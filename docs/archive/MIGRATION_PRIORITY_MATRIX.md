/**
 * CassKai - MIGRATION PRIORITY MATRIX
 * Quelle is the order to migrate services for maximum impact with minimum risk?
 * 
 * Critères: Impact (users affected), Risk (difficultés à implémenter), Complexity, Dependencies
 */

// ============================================================================
// MATRICE DE DÉCISION
// ============================================================================

const SERVICES_TO_MIGRATE = [
  {
    name: 'realDashboardKpiService',
    file: 'src/services/realDashboardKpiService.ts',
    purpose: 'KPIs des tableaux de bord en temps réel',
    
    // IMPACT: Qui utilise ça?
    affectedUsers: 'Tous les utilisateurs (visible à chaque login)',
    userCount: 'TRÈS ÉLEVÉ (100% de la base)',
    businessImpact: 'CRITIQUE (première chose vue)',
    visibility: 'HAUTE (graphiques en top du dashboard)',
    
    // RISQUE D'IMPLÉMENTATION
    complexity: 'Faible', // Simple rempl acement, pas de logique métier custom
    testingDifficulty: 'Faible', // Tests existants peuvent être réutilisés
    rollbackEase: 'Facile', // Juste revenir à l'ancienne requête
    dataImpact: 'Lisible', // Différence visible = détectable rapidement
    
    // DÉPENDANCES
    dependencies: 'Aucune (standalone)',
    blockedBy: [],
    blocks: [],
    
    // PRIORITÉ CALCULÉE
    priority: 1, // À faire EN PREMIER
    reasoning: `
      ✅ Impact très élevé = tous les users verront si c'est cohérent
      ✅ Pas de dépendances = peut être migré indépendamment
      ✅ Facile à tester = peut comparer avant/après rapidement
      ✅ Lisible = si variance, on le voit immédiatement
      ✅ Première étape = établit le pattern pour autres services
    `
  },
  
  {
    name: 'dashboardStatsService',
    file: 'src/services/dashboardStatsService.ts',
    purpose: 'Statistiques agrégées du dashboard',
    
    affectedUsers: 'Tous les utilisateurs (vue "Statistiques")',
    userCount: 'TRÈS ÉLEVÉ',
    businessImpact: 'HAUTE (KPI secondaires)',
    visibility: 'HAUTE (section dédiée)',
    
    complexity: 'Faible',
    testingDifficulty: 'Faible',
    rollbackEase: 'Facile',
    dataImpact: 'Lisible',
    
    dependencies: 'Utilise realDashboardKpiService?',
    blockedBy: [], // Could run parallel
    blocks: [],
    
    priority: 2, // À faire EN SECOND
    reasoning: `
      ✅ Impact similaire à #1
      ✅ Pas de dépendances critiques
      ✅ Peut tourner en parallèle ou après #1
      ✅ Facile à valider = comparer nombres
    `
  },
  
  {
    name: 'rfaCalculationService',
    file: 'src/services/rfaCalculationService.ts',
    purpose: 'Calcul des RFA (Remises de Fin d\'Année) par client',
    
    affectedUsers: 'Part du revenue (certains clients seulement)',
    userCount: 'MOYEN (seulement clients avec RFA)',
    businessImpact: 'MOYENNE (RFA ≠ tous les clients)',
    visibility: 'MOYENNE (rapport RFA, pas visible tous les jours)',
    
    complexity: 'Moyen', // Logique plus custom (par contrat, filtres)
    testingDifficulty: 'Moyen', // Faut tester par contrat
    rollbackEase: 'Moyen', // Plus critique si RFA déjà calculée
    dataImpact: 'Caché', // RFA n'est pas visible en temps réel
    
    dependencies: 'Utilise contract.client_id (nécessite mapping)',
    blockedBy: [], // Peut être indépendant
    blocks: ['fiscal_reports_if_rfa_used'],
    
    priority: 3, // À faire EN TROISIÈME
    reasoning: `
      ✅ Pas de dépendances critiques
      ⚠️ Logique plus composée = plus de tests nécessaires
      ⚠️ RFA = secteur = doit être TRÈS précis
      ✅ Peut se faire après dashboard stable
    `
  },
  
  {
    name: 'SYSCOHADATaxComplianceService',
    file: 'src/services/SYSCOHADATaxComplianceService.ts',
    purpose: 'Conformité fiscale SYSCOHADA pour pays UEMOA',
    
    affectedUsers: 'Companies en Afrique de l\'Ouest (WAEMU)',
    userCount: 'FAIBLE (~5-10% de la base)',
    businessImpact: 'CRITIQUE pour impactés (légalité)',
    visibility: 'BASSE (normes spécifiques)',
    
    complexity: 'Élevée', // Standard SYSCOHADA != PCG
    testingDifficulty: 'Élevée', // Besoin expert SYSCOHADA
    rollbackEase: 'Difficile', // Si déjà reporté aux autorités
    dataImpact: 'Critique', // Erreur = problème légal
    
    dependencies: 'Nécessite standard detection logic',
    blockedBy: ['acceptedAccountingService.accounting_standards_complete'],
    blocks: ['fiscal_reports_WAEMU'],
    
    priority: 4, // À faire EN QUATRIÈME
    reasoning: `
      ⚠️ Complexité élevée = plus de risque
      ⚠️ Impact légal = doit être certain avant déployer
      ✅ Dépend de standards document = peut s'appuyer sur ça
      ⚠️ Faible % utilisateurs = urgence réduite
    `
  },
  
  {
    name: 'reportsService (Fiscal Reports)',
    file: 'src/services/reportsService.ts + supabase/functions',
    purpose: 'Génération rapports fiscaux annuels',
    
    affectedUsers: 'Toutes companies (audit annuel)',
    userCount: 'TRÈS ÉLEVÉ (100% de la base)',
    businessImpact: 'CRITIQUE (conformité légale)',
    visibility: 'BASSE (une fois par an)',
    
    complexity: 'Très élevée', // Multi-standard, multi-sections
    testingDifficulty: 'Très élevée', // Besoin fiscal expert
    rollbackEase: 'Impossible', // Rapport déjà soumis = critique
    dataImpact: 'Critique', // Erreur = audit externe
    
    dependencies: [
      'acceptedAccountingService complete',
      'realDashboardKpiService migré',
      'SYSCOHADATaxComplianceService migré',
      'rfaCalculationService migré'
    ],
    blockedBy: [1, 2, 3, 4],
    blocks: [],
    
    priority: 5, // À faire EN DERNIER
    reasoning: `
      ⚠️ Très complexe = risque élevé
      ⚠️ Impact critique = zéro tolerance erreur
      ✅ Dépend d'autres = faire en dernier
      ✅ Basse fréquence = temps pour tester complètement
      ✅ Todos dépendances doivent être stables en prod d'abord
    `
  },
  
  {
    name: 'AI Assistant Context Building',
    file: 'supabase/functions/ai-assistant/index.ts',
    purpose: 'Contexte comptable pour assistant IA',
    
    affectedUsers: 'Power users (assistants IA)',
    userCount: 'FAIBLE (avant-gardistes)',
    businessImpact: 'BASSE (feature optionnelle)',
    visibility: 'BASSE (backend)',
    
    complexity: 'Faible', // Juste passer les résultats
    testingDifficulty: 'Moyen', // AI testing = moins clair
    rollbackEase: 'Facile', // Assistant n'est pas critique
    dataImpact: 'Faible', // Utilisateur verra si off',
    
    dependencies: 'acceptedAccountingService',
    blockedBy: [],
    blocks: [],
    
    priority: 2.5, // OPTIONNEL, peut être après #2
    reasoning: `
      ✅ Impacts faible = peut être fait en dernier
      ✅ Pas de dépendances
      ✅ Easy to test = demander à AI si calculs cohérents
      ⚠️ Feature optionnelle = peut être déprioritisé
    `
  }
];

// ============================================================================
// TIMELINE RECOMMANDÉE
// ============================================================================

export const MIGRATION_TIMELINE = `

📅 SEMAINE 1: Setup & Tests
├─ lundi: Déployer acceptedAccountingService en prod
├─ mardi: Déployer migrations DB (audit trail table)
├─ mercredi: Lancer tests de cohérence sur service vierge
└─ jeudi: Créer un test dataset représentatif (réelles données anonymisées)

📅 SEMAINE 2: Dashboard Migration (PRIORITY #1-2)
├─ lundi: Migrer realDashboardKpiService
│  ├─ Implémenter calculateRevenueWithAudit() call
│  └─ Inscrire audit trail dans accounting_calculations_audit
├─ mardi: Tests & validation (comparer ancien vs nouveau)
│  ├─ Si variance < 1%: ✅
│  └─ Si variance > 1%: investiguer avant déployer
├─ mercredi: Déployer en production (avec monitoring)
│  └─ Alerter si confidence_score baisse
├─ jeudi: Migrer dashboardStatsService (même pattern)
└─ vendredi: Validation croisée (les deux services donnent même CA)

📅 SEMAINE 3: RFA & Fiscal (PRIORITY #3-5)
├─ lundi-mardi: Migrer rfaCalculationService
│  └─ Pour chaque contrat, appeler calculateRevenueWithAudit(clientId=contract.client_id)
├─ mercredi: Tester cohérence (RFA CA = partie du total CA)
├─ jeudi: Migrer SYSCOHADATaxComplianceService
│  └─ Utiliser accounting_standards.REVENUE_STANDARDS[standard]
└─ vendredi: Validation SYSCOHADA (besoin expert)

📅 SEMAINE 4: Reports & Finalization (PRIORITY #5)
├─ lundi-mardi: Refactoriser reportsService pour fiscal reports
│  ├─ HT calculation
│  ├─ Multi-standard support
│  └─ Audit trail référence
├─ mercredi-jeudi: Tests exhaustifs
│  ├─ PCG specimen
│  ├─ SYSCOHADA specimen
│  └─ IFRS specimen
├─ vendredi: Validation par expert-comptable
└─ SEMAINE 5: Go-live & monitoring

✅ À la fin:
 - 6 services utilisent la MÊME source de vérité
 - Tous les CA affichés sont cohérents (< 0.1% variance)
 - Audit trail complet pour chaque calcul
 - Confidence scores documentent la qualité
 - Expert-comptable peut certifier les chiffres
`;

// ============================================================================
// RISK MITIGATIONS
// ============================================================================

export const RISK_MITIGATIONS = {
  'Service migration breaks dashboard': {
    risk: 'Haute', // CA affiché mauvais = users paniquent
    mitigation: [
      '✅ Tester sur dataset priv avec expected values',
      '✅ Déployer en feature flag (toggle entre ancien/nouveau)',
      '✅ Déployer le week-end (moins de users)',
      '✅ Avoir rollback plan (10 min max)',
      '✅ Monitor dashboard requests pour variance'
    ]
  },
  
  'Audit table become bottleneck': {
    risk: 'Moyenne', // Si 1000 calculations/jour, inserts peuvent ralentir
    mitigation: [
      '✅ Créer index sur company_id + period + type',
      '✅ Utiliser partition sur company_id',
      '✅ Async inserts (ne pas bloquer le calcul)',
      '✅ Monitor insert latency',
      '✅ Archive old records mensuellement'
    ]
  },
  
  'RLS policy error': {
    risk: 'Haute', // Users voient données autres companies
    mitigation: [
      '✅ Policy: "SELECT * where company_users.company_id = audit.company_id"',
      '✅ Tester avec multiple users + companies',
      '✅ No INSERT permission pour users (server-only)',
      '✅ Audit qui a accès à quoi dans DB'
    ]
  },
  
  'Variance unexplained': {
    risk: 'Très haute', // Expert-comptable peut pas certifier
    mitigation: [
      '✅ Créer alerting si variance > 1%',
      '✅ Documenter toujours POURQUOI (source différente?)',
      '✅ Reconciliation workflow: auto vs manual'
    ]
  }
};

// ============================================================================
// SUCCESS CRITERIA
// ============================================================================

export const SUCCESS_CRITERIA = {
  'Cohérence': {
    'Dashboard CA': 'Identique à Reports CA (< 0.1% variance)',
    'RFA CA': 'Somme = partie du CA total',
    'Audit trail': 'Chaque calcul enregistré avec source'
  },
  
  'Qualité': {
    'Confidence score': 'Moyen ≥ 90/100',
    'Reconciliation': '≥ 95% matched vs invoices',
    'Intégrité': 'Tous journal_entries posted ✅'
  },
  
  'Documentation': {
    'Chaque écart': 'Expliqué par audit trail',
    'Standards': 'Clairement documenté (PCG/SYSCOHADA/etc)',
    'Test coverage': '≥ 95% pass rate'
  }
};

export { SERVICES_TO_MIGRATE, MIGRATION_TIMELINE, RISK_MITIGATIONS, SUCCESS_CRITERIA };
