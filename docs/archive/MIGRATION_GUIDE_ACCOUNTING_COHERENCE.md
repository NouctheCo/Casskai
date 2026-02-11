/**
 * CassKai - MIGRATION GUIDE: Unified Accounting Coherence
 * 
 * OBJECTIF: Tous les modules doivent utiliser la MÊME source de vérité comptable
 * pour éviter les incohérences dans le CA, les charges, et les marges.
 * 
 * DATE: 2026-02-06
 * RESPONSABILITÉ: Expert-comptable international
 */

// ============================================================================
// MODULE 1: DASHBOARD (Real-time KPIs)
// ============================================================================

/**
 * ANCIEN APPROCHE (INCOHÉRENT)
 * ├─ dashboardStatsService.ts: utilise class 7 directement
 * ├─ realDashboardKpiService.ts: utilise 70x avec fallback invoices
 * └─ PROBLÈME: Deux calculs différents, résultats différents
 * 
 * NOUVELLE APPROCHE (COHÉRENTE)
 * └─ Tous deux utilisent acceptedAccountingService.calculateRevenueWithAudit()
 */

// MIGRATION: dashboardStatsService.ts
export async function calculateStats_MIGRATED(companyId: string, startDate: string, endDate: string) {
  // AVANT: Requête directe sur journal_entry_lines filtrée par class 7
  // const revenue = ... custom logic ...
  
  // APRÈS: Utiliser la source unique
  const { revenue, audit } = await acceptedAccountingService.calculateRevenueWithAudit(
    companyId,
    startDate,
    endDate,
    undefined, // No client filter for aggregated dashboard
    {
      vatTreatment: 'ttc', // Dashboard shows total billing
      includeBreakdown: false,
      includeReconciliation: false
    }
  );
  
  // Enregistrer l'audit
  await supabase
    .from('accounting_calculations_audit')
    .insert({
      company_id: companyId,
      calculation_type: 'revenue',
      purpose: 'dashboard',
      period_start: startDate,
      period_end: endDate,
      accounting_standard: audit.standard,
      vat_treatment: 'ttc',
      calculation_method: audit.calculation_method,
      journal_entries_included: audit.journal_entries_included,
      journal_lines_count: audit.journal_lines_count,
      final_amount: audit.final_revenue,
      confidence_score: audit.confidence_score,
      warnings: audit.warnings,
      is_balanced: audit.is_balanced,
      all_entries_posted: audit.integrity_checks.journal_entries_posted,
      calculated_by: auth.uid(),
      calculation_hash: generateHash({ companyId, startDate, endDate, 'ttc' })
    });
  
  return { revenue, confidence: audit.confidence_score };
}

// MIGRATION: realDashboardKpiService.ts
export async function calculateRealKPIs_MIGRATED(companyId: string, startDate: string, endDate: string) {
  // Same pattern as above - call the single source
  return acceptedAccountingService.calculateRevenueWithAudit(
    companyId,
    startDate,
    endDate,
    undefined,
    {
      vatTreatment: 'ttc',
      includeBreakdown: true, // Include top clients, monthly breakdown
      includeReconciliation: false
    }
  );
}

// ============================================================================
// MODULE 2: RFA (Remise de Fin d'Année - Year-end Rebate)
// ============================================================================

/**
 * ANCIEN APPROCHE
 * └─ rfaCalculationService.ts: calcul custom par contrat
 * 
 * NOUVELLE APPROCHE
 * └─ Même source que dashboard mais:
 *    - client_id = contrat.client_id (revenue SPÉCIFIQUE au client)
 *    - vat_treatment: 'ht' (RFA sur CA HT)
 *    - period: contrat.start_date à contrat.end_date
 */

export async function calculateContractRFA_MIGRATED(contract: Contract) {
  // Récupérer le CA du client pour ce contrat
  const { revenue, audit, breakdown } = await acceptedAccountingService.calculateRevenueWithAudit(
    contract.company_id,
    contract.start_date,
    contract.end_date,
    contract.client_id, // IMPORTANT: Filter par client
    {
      vatTreatment: 'ht', // RFA sur HT
      includeBreakdown: true,
      includeReconciliation: true
    }
  );
  
  // Vérifier que c'est bien le CA du client (pas partagé avec d'autres)
  if (breakdown.by_client.length !== 1) {
    logger.warn('RFA', 'Client revenue calculation ambiguous - check filters');
  }
  
  // Enregistrer l'audit
  await supabase
    .from('accounting_calculations_audit')
    .insert({
      company_id: contract.company_id,
      calculation_type: 'revenue',
      purpose: 'rfa_calculation',
      period_start: contract.start_date,
      period_end: contract.end_date,
      client_id: contract.client_id,
      contract_id: contract.id,
      accounting_standard: audit.standard,
      vat_treatment: 'ht',
      calculation_method: audit.calculation_method,
      final_amount: revenue,
      confidence_score: audit.confidence_score,
      // ... autres champs ...
    });
  
  // Ensuite, appliquer le barème RFA
  const rfa = calculateRFABrackets(revenue, contract.rfa_brackets);
  
  return { revenue, rfa, audit };
}

// ============================================================================
// MODULE 3: FISCAL REPORTS
// ============================================================================

/**
 * ANCIEN APPROCHE
 * ├─ SYSCOHADATaxComplianceService.ts: calcul custom par standard
 * ├─ reportsService.ts: appels RPC Supabase
 * └─ PROBLÈME: Pas d'audit trail, pas de réconciliation
 * 
 * NOUVELLE APPROCHE
 * └─ Utiliser acceptedAccountingService + standard-specific rules
 */

export async function generateFiscalReport_MIGRATED(
  companyId: string,
  fiscalYear: number
) {
  const startDate = `${fiscalYear}-01-01`;
  const endDate = `${fiscalYear}-12-31`;
  
  // Récupérer le CA officiel
  const { revenue, audit, reconciliation } = await acceptedAccountingService.calculateRevenueWithAudit(
    companyId,
    startDate,
    endDate,
    undefined,
    {
      vatTreatment: 'ht', // Fiscal reports use HT
      includeBreakdown: true,
      includeReconciliation: true // Important for compliance
    }
  );
  
  // Vérifier la réconciliation
  if (reconciliation.reconciliation_status === 'variance_unexplained') {
    logger.error('FiscalReport', 'Unexplained variance in revenue calculation', {
      variance: reconciliation.total_variance,
      percentage: reconciliation.variance_percentage
    });
    // Bloquer le rapport et demander investigation
    throw new Error('Cannot generate fiscal report: revenue variance must be explained');
  }
  
  // Construire le rapport avec audit trail
  const report = {
    company_id: companyId,
    fiscal_year: fiscalYear,
    revenue_certified: revenue,
    revenue_audit_id: audit.id,
    revenue_confidence: audit.confidence_score,
    reconciliation: reconciliation,
    // ... autres sections du rapport ...
  };
  
  // Enregistrer dans accounting_calculations_audit
  await supabase
    .from('accounting_calculations_audit')
    .insert({
      company_id: companyId,
      calculation_type: 'revenue',
      purpose: 'fiscal_report',
      period_start: startDate,
      period_end: endDate,
      accounting_standard: audit.standard,
      vat_treatment: 'ht',
      calculation_method: audit.calculation_method,
      final_amount: revenue,
      confidence_score: audit.confidence_score,
      reconciliation_status: reconciliation.reconciliation_status,
      // ... autres champs audit ...
    });
  
  return report;
}

// ============================================================================
// MODULE 4: AI ASSISTANT CONTEXT
// ============================================================================

/**
 * ANCIEN APPROCHE
 * └─ supabase/functions/ai-assistant/index.ts: custom accounting indicators
 * 
 * NOUVELLE APPROCHE
 * └─ Appeler acceptedAccountingService pour contexte cohérent
 */

export async function getAccountingIndicators_MIGRATED(companyId: string) {
  const { revenue, audit } = await acceptedAccountingService.calculateRevenueWithAudit(
    companyId,
    getYearStart(),
    getToday(),
    undefined,
    { vatTreatment: 'ttc', includeBreakdown: true }
  );
  
  return {
    chiffre_affaires: revenue,
    ca_source: audit.calculation_method, // 'journal_entries' | 'chart_accounts' | 'invoices_fallback'
    ca_confidence: audit.confidence_score,
    ca_reconciliation: reconciliation ? reconciliation.reconciliation_status : 'unknown',
    // ... autres indicateurs ...
  };
}

// ============================================================================
// IMPLEMENTATION CHECKLIST
// ============================================================================

/**
 * ÉTAPES POUR MIGRER CHAQUE SERVICE:
 * 
 * 1. ANALYSE
 *    ✅ Identifier la logique actuelle de calcul du CA
 *    ✅ Noter les filtres appliqués (client, date, status)
 *    ✅ Noter le traitement TVA (HT vs TTC)
 *    ✅ Identifier les fallbacks utilisés
 * 
 * 2. REMPLACEMENT
 *    ✅ Remplacer la requête custom par acceptedAccountingService.calculateRevenueWithAudit()
 *    ✅ Utiliser les mêmes paramètres (startDate, endDate, clientId)
 *    ✅ Spécifier vatTreatment correct (HT pour fiscal, TTC pour dashboard)
 *    ✅ Inclure breakdown et reconciliation si nécessaire
 * 
 * 3. AUDIT TRAIL
 *    ✅ Insérer un record dans accounting_calculations_audit
 *    ✅ Inclure purpose = le module qui fait le calcul
 *    ✅ Inclure confidence_score et warnings
 *    ✅ Inclure reconciliation_status si applicable
 * 
 * 4. VALIDATION
 *    ✅ Comparer ancien vs nouveau résultat
 *    ✅ Si variance > 1%: investiguer avant déployer
 *    ✅ Si variance acceptable: créer test pour vérifier cohérence
 *    ✅ Documenter tout écart expliquable
 * 
 * 5. DÉPLOIEMENT
 *    ✅ Déployer acceptedAccountingService en production d'abord
 *    ✅ Déployer les migrations de DB (audit trail)
 *    ✅ Migrer les services un par un (dashboard, puis reports, puis RFA)
 *    ✅ Monitorer les audit logs pour anomalies
 * 
 * 6. DÉCOMMISSIONNEMENT
 *    ✅ Une fois tous les services migrés, décommissionner les anciens calculs
 *    ✅ Archiver les anciens services à des fins historiques
 */

// ============================================================================
// EXPECTED IMPROVEMENTS
// ============================================================================

/**
 * AVANT migration:
 * ├─ Dashboard affiche CA: 500,000 €
 * ├─ RFA utilise CA: 510,000 € (incohérence!)
 * ├─ Reports affichent CA: 495,000 €
 * └─ Aucune audit trail → impossible d'expliquer les différences
 * 
 * APRÈS migration:
 * ├─ Tous les modules affichent CA: 505,000 € (cohérent)
 * ├─ accounting_calculations_audit enregistre chaque calcul
 * ├─ Réconciliation automatique vs invoices (variance < 1%)
 * ├─ Confidence score montre la qualité du calcul (95/100)
 * ├─ Audit trail permet traçabilité complète pour audit externe
 * └─ Expert-comptable peut certifier les chiffres avec confiance
 */

// ============================================================================
// TESTING STRATEGY
// ============================================================================

/**
 * Pour chaque service migré, créer des tests:
 */

function testDashboardCoherence() {
  // Setup: company with test data
  const company = createTestCompany();
  const startDate = '2026-01-01';
  const endDate = '2026-12-31';
  
  // Run both old and new calculation
  const oldResult = calculateStats_OLD(company.id, startDate, endDate);
  const newResult = calculateStats_MIGRATED(company.id, startDate, endDate);
  
  // Assert difference is acceptable
  const variance = Math.abs(oldResult.revenue - newResult.revenue);
  const variancePercent = (variance / oldResult.revenue) * 100;
  
  expect(variancePercent).toBeLessThan(2); // Allow 2% for fallback differences
  
  // Assert audit trail exists
  const audit = await supabase
    .from('accounting_calculations_audit')
    .select('*')
    .eq('purpose', 'dashboard');
  
  expect(audit.data).toBeTruthy();
  expect(audit.data[0].confidence_score).toBeGreaterThanOrEqual(80);
}

export { 
  calculateStats_MIGRATED,
  calculateRealKPIs_MIGRATED,
  calculateContractRFA_MIGRATED,
  generateFiscalReport_MIGRATED,
  getAccountingIndicators_MIGRATED,
  testDashboardCoherence
};
