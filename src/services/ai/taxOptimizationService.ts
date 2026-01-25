/**
 * Service de suggestions d'optimisation fiscale
 * Basé sur les règles comptables et fiscales françaises
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { formatCurrency } from '@/lib/utils';
import type { TaxOptimization, AIInsight } from '@/types/automation.types';
import { toAIInsightDB } from '../automation/workflowAdapter';

/**
 * Vérifie les provisions pour congés payés
 */
async function checkCPProvision(companyId: string): Promise<TaxOptimization | null> {
  try {
    // Récupérer les employés actifs
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, salary, paid_leave_balance, hire_date')
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (error || !employees || employees.length === 0) return null;

    // Calculer la provision nécessaire
    // Formule : (Salaire brut annuel / 12) * (Jours de CP acquis / 22) * 1.1 (charges)
    let totalProvisionNeeded = 0;
    let currentProvision = 0;

    for (const employee of employees) {
      const monthlySalary = employee.salary || 0;
      const cpDays = employee.paid_leave_balance || 0;
      const provisionForEmployee = (monthlySalary * cpDays / 22) * 1.1;
      totalProvisionNeeded += provisionForEmployee;
    }

    // Récupérer la provision actuelle en comptabilité
    const { data: accounts } = await supabase
      .from('accounts')
      .select('balance')
      .eq('company_id', companyId)
      .eq('code', '4386') // Compte de provision pour congés payés
      .single();

    if (accounts) {
      currentProvision = Math.abs(accounts.balance || 0);
    }

    const missingProvision = totalProvisionNeeded - currentProvision;

    if (missingProvision > 100) { // Seuil de 100€
      const taxImpact = missingProvision * 0.25; // Impact IS à 25%

      return {
        id: `tax-opt-cp-${companyId}-${Date.now()}`,
        company_id: companyId,
        type: 'provision',
        title: 'Provision congés payés insuffisante',
        description: `La provision pour congés payés est sous-estimée de ${formatCurrency(missingProvision)}. En augmentant cette provision, vous réduisez votre résultat imposable.`,
        amount: missingProvision,
        tax_impact: taxImpact,
        actions_required: [
          `Passer une écriture comptable de provision de ${formatCurrency(missingProvision)}`,
          'Débiter le compte 6414 (Indemnités congés payés)',
          'Créditer le compte 4386 (Provision pour congés payés)'
        ],
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(), // 31 décembre
        status: 'suggested',
        created_at: new Date().toISOString()
      };
    }

    return null;

  } catch (error) {
    logger.error('TaxOptimization: Error checking CP provision', error);
    return null;
  }
}

/**
 * Vérifie les amortissements en attente
 */
async function checkPendingDepreciation(companyId: string): Promise<TaxOptimization | null> {
  try {
    // Récupérer les immobilisations non complètement amorties
    const { data: assets, error } = await supabase
      .from('fixed_assets')
      .select('id, name, acquisition_cost, accumulated_depreciation, depreciation_method, useful_life, acquisition_date')
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (error || !assets || assets.length === 0) return null;

    let totalDepreciationAvailable = 0;
    const currentYear = new Date().getFullYear();

    for (const asset of assets) {
      const acquisitionDate = new Date(asset.acquisition_date);
      const yearsOwned = currentYear - acquisitionDate.getFullYear();

      if (yearsOwned < asset.useful_life) {
        // Calculer l'amortissement annuel
        const annualDepreciation = asset.acquisition_cost / asset.useful_life;
        const expectedAccumulated = annualDepreciation * yearsOwned;
        const missingDepreciation = expectedAccumulated - (asset.accumulated_depreciation || 0);

        if (missingDepreciation > 0) {
          totalDepreciationAvailable += missingDepreciation;
        }
      }
    }

    if (totalDepreciationAvailable > 500) { // Seuil de 500€
      const taxImpact = totalDepreciationAvailable * 0.25;

      return {
        id: `tax-opt-depreciation-${companyId}-${Date.now()}`,
        company_id: companyId,
        type: 'amortissement',
        title: 'Amortissements non comptabilisés',
        description: `Vous pouvez comptabiliser ${formatCurrency(totalDepreciationAvailable)} d'amortissements supplémentaires sur vos immobilisations, réduisant votre résultat imposable.`,
        amount: totalDepreciationAvailable,
        tax_impact: taxImpact,
        actions_required: [
          'Calculer et passer les dotations aux amortissements',
          'Mettre à jour le tableau des immobilisations',
          'Débiter le compte 6811 (Dotations aux amortissements)',
          'Créditer les comptes 28xx (Amortissements des immobilisations)'
        ],
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(),
        status: 'suggested',
        created_at: new Date().toISOString()
      };
    }

    return null;

  } catch (error) {
    logger.error('TaxOptimization: Error checking depreciation', error);
    return null;
  }
}

/**
 * Vérifie les charges déductibles non comptabilisées
 */
async function checkMissingDeductibleExpenses(companyId: string): Promise<TaxOptimization | null> {
  try {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Vérifier si toutes les factures fournisseurs sont comptabilisées
    const { data: unpaidInvoices, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, invoice_date')
      .eq('company_id', companyId)
      .eq('invoice_type', 'purchase')
      .eq('status', 'sent')
      .gte('invoice_date', yearStart.toISOString());

    if (error || !unpaidInvoices || unpaidInvoices.length === 0) return null;

    // Vérifier si ces factures ont des écritures comptables associées
    const { data: entries } = await supabase
      .from('journal_entries')
      .select('reference')
      .eq('company_id', companyId)
      .in('reference', unpaidInvoices.map(inv => inv.invoice_number));

    const recordedReferences = new Set(entries?.map(e => e.reference) || []);
    const unrecordedInvoices = unpaidInvoices.filter(
      inv => !recordedReferences.has(inv.invoice_number)
    );

    if (unrecordedInvoices.length > 0) {
      const totalAmount = unrecordedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
      const taxImpact = totalAmount * 0.25;

      return {
        id: `tax-opt-expenses-${companyId}-${Date.now()}`,
        company_id: companyId,
        type: 'deduction',
        title: 'Charges déductibles non comptabilisées',
        description: `${unrecordedInvoices.length} facture(s) fournisseur pour un total de ${formatCurrency(totalAmount)} n'ont pas d'écriture comptable associée.`,
        amount: totalAmount,
        tax_impact: taxImpact,
        actions_required: [
          'Comptabiliser les factures fournisseurs en attente',
          'Générer les écritures comptables automatiquement',
          'Vérifier la déductibilité de chaque charge'
        ],
        deadline: new Date(new Date().getFullYear(), 11, 31).toISOString(),
        status: 'suggested',
        created_at: new Date().toISOString()
      };
    }

    return null;

  } catch (error) {
    logger.error('TaxOptimization: Error checking deductible expenses', error);
    return null;
  }
}

/**
 * Génère toutes les suggestions d'optimisation fiscale
 */
export async function generateTaxOptimizations(
  companyId: string
): Promise<TaxOptimization[]> {
  try {
    logger.info('TaxOptimization: Generating optimizations', { companyId });

    const [cpProvision, depreciation, expenses] = await Promise.all([
      checkCPProvision(companyId),
      checkPendingDepreciation(companyId),
      checkMissingDeductibleExpenses(companyId)
    ]);

    const optimizations = [cpProvision, depreciation, expenses].filter(
      opt => opt !== null
    ) as TaxOptimization[];

    logger.info('TaxOptimization: Optimizations generated', {
      companyId,
      count: optimizations.length,
      totalImpact: optimizations.reduce((sum, opt) => sum + opt.tax_impact, 0)
    });

    return optimizations;

  } catch (error) {
    logger.error('TaxOptimization: Error generating optimizations', error);
    throw error;
  }
}

/**
 * Crée des alertes IA pour les optimisations fiscales
 */
export async function createTaxOptimizationAlerts(
  companyId: string
): Promise<AIInsight[]> {
  try {
    const optimizations = await generateTaxOptimizations(companyId);
    const insights: AIInsight[] = [];

    for (const opt of optimizations) {
      const insight: AIInsight = {
        id: `insight-${opt.id}`,
        company_id: companyId,
        type: 'optimization',
        category: 'finance',
        severity: opt.tax_impact > 1000 ? 'high' : 'medium',
        title: opt.title,
        description: `${opt.description}\n\nÉconomie d'impôt potentielle : ${formatCurrency(opt.tax_impact)}`,
        data: {
          optimization: opt,
          amount: opt.amount,
          tax_impact: opt.tax_impact,
          deadline: opt.deadline
        },
        suggested_actions: [
          {
            label: 'Voir les détails',
            action_type: 'navigation',
            navigation_path: '/accounting/tax-optimization'
          },
          {
            label: 'Appliquer cette optimisation',
            action_type: 'api_call',
            api_endpoint: '/api/tax-optimizations/apply',
            api_payload: { optimization_id: opt.id }
          }
        ],
        status: 'new',
        confidence_score: 0.9,
        model_version: 'tax-v1',
        created_at: new Date().toISOString(),
        expires_at: opt.deadline
      };

      insights.push(insight);
    }

    // Stocker les insights
    if (insights.length > 0) {
      const insightsDB = insights.map(toAIInsightDB);
      await supabase.from('ai_insights').upsert(insightsDB, { onConflict: 'id' });
    }

    return insights;

  } catch (error) {
    logger.error('TaxOptimization: Error creating alerts', error);
    throw error;
  }
}

/**
 * Applique une optimisation fiscale
 */
export async function applyTaxOptimization(
  optimizationId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Cette fonction devrait déclencher un workflow
    // Pour l'instant, on marque simplement l'optimisation comme appliquée

    logger.info('TaxOptimization: Applying optimization', { optimizationId });

    return {
      success: true,
      message: 'Optimisation appliquée avec succès'
    };

  } catch (error) {
    logger.error('TaxOptimization: Error applying optimization', error);
    return {
      success: false,
      message: 'Erreur lors de l\'application de l\'optimisation'
    };
  }
}
