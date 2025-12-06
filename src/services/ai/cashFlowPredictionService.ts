/**
 * Service de prédiction de trésorerie
 * Projette le solde bancaire sur les 30/60/90 prochains jours
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type {
  CashFlowPrediction,
  DailyPrediction,
  CashFlowItem,
  AIInsight
} from '@/types/automation.types';
import { toAIInsightDB } from '../automation/workflowAdapter';

/**
 * Calcule la probabilité de paiement d'une facture basée sur :
 * - Historique du client
 * - Jours de retard
 * - Montant
 */
function calculatePaymentProbability(
  daysOverdue: number,
  clientHistoryPaymentRate: number = 0.85
): number {
  // Base probability from client history
  let probability = clientHistoryPaymentRate;

  // Decrease probability based on days overdue
  if (daysOverdue > 0) {
    probability *= Math.exp(-daysOverdue / 30); // Décroissance exponentielle
  } else if (daysOverdue < 0) {
    // Facture pas encore échue
    const daysUntilDue = Math.abs(daysOverdue);
    if (daysUntilDue <= 7) {
      probability = 0.95; // Très probable si échéance proche
    } else if (daysUntilDue <= 30) {
      probability = 0.8;
    } else {
      probability = 0.6;
    }
  }

  return Math.max(0.1, Math.min(1.0, probability));
}

/**
 * Récupère le solde bancaire actuel
 */
async function getCurrentBalance(companyId: string): Promise<number> {
  const { data: accounts, error } = await supabase
    .from('bank_accounts')
    .select('balance')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (error) throw error;

  return accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
}

/**
 * Récupère les factures clients impayées (encaissements prévus)
 */
async function getPendingInvoices(companyId: string) {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      total_amount,
      paid_amount,
      due_date,
      issue_date,
      third_party_id,
      third_parties (
        name,
        payment_terms
      )
    `)
    .eq('company_id', companyId)
    .eq('type', 'sale')
    .in('status', ['sent', 'overdue'])
    .order('due_date', { ascending: true });

  if (error) throw error;

  return (invoices || []).map(inv => {
    const remainingAmount = inv.total_amount - (inv.paid_amount || 0);
    const dueDate = new Date(inv.due_date);
    const today = new Date();
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: inv.id,
      type: 'invoice' as const,
      description: `Facture ${inv.invoice_number}`,
      amount: remainingAmount,
      due_date: inv.due_date,
      probability: calculatePaymentProbability(daysOverdue),
      client_name: (inv.third_parties as any)?.name || 'Client inconnu'
    };
  });
}

/**
 * Récupère les factures fournisseurs à payer (décaissements prévus)
 */
async function getPendingPurchases(companyId: string) {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      total_amount,
      paid_amount,
      due_date,
      third_parties (
        name
      )
    `)
    .eq('company_id', companyId)
    .eq('type', 'purchase')
    .in('status', ['sent', 'overdue'])
    .order('due_date', { ascending: true });

  if (error) throw error;

  return (invoices || []).map(inv => ({
    id: inv.id,
    type: 'payment' as const,
    description: `Facture fournisseur ${inv.invoice_number}`,
    amount: -(inv.total_amount - (inv.paid_amount || 0)),
    due_date: inv.due_date,
    probability: 1.0, // On suppose qu'on va payer nos fournisseurs
    supplier_name: (inv.third_parties as any)?.name || 'Fournisseur inconnu'
  }));
}

/**
 * Estime les charges récurrentes mensuelles
 */
async function estimateRecurringExpenses(companyId: string): Promise<number> {
  // Analyser les 3 derniers mois pour identifier les charges récurrentes
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('amount, category, date')
    .eq('company_id', companyId)
    .eq('type', 'expense')
    .gte('date', threeMonthsAgo.toISOString());

  if (error || !transactions || transactions.length === 0) {
    return 0;
  }

  // Calculer la moyenne mensuelle des dépenses
  const totalExpenses = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const monthlyAverage = totalExpenses / 3;

  return monthlyAverage;
}

/**
 * Génère la projection de trésorerie jour par jour
 */
export async function generateCashFlowPrediction(
  companyId: string,
  daysAhead: number = 90
): Promise<CashFlowPrediction> {
  try {
    logger.info('CashFlowPrediction: Generating prediction', { companyId, daysAhead });

    // 1. Récupérer les données de base
    const [
      currentBalance,
      pendingInvoices,
      pendingPurchases,
      monthlyRecurringExpenses
    ] = await Promise.all([
      getCurrentBalance(companyId),
      getPendingInvoices(companyId),
      getPendingPurchases(companyId),
      estimateRecurringExpenses(companyId)
    ]);

    // 2. Générer les prédictions jour par jour
    const predictions: DailyPrediction[] = [];
    let runningBalance = currentBalance;
    const today = new Date();
    const dailyRecurringExpense = monthlyRecurringExpenses / 30;

    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Trouver les flux de ce jour
      const incomeSources: CashFlowItem[] = [];
      const expenseSources: CashFlowItem[] = [];

      // Encaissements prévus
      pendingInvoices.forEach(invoice => {
        const invoiceDueDate = new Date(invoice.due_date).toISOString().split('T')[0];
        if (invoiceDueDate === dateStr) {
          incomeSources.push({
            type: 'invoice',
            entity_id: invoice.id,
            description: invoice.description,
            amount: invoice.amount,
            probability: invoice.probability
          });
        }
      });

      // Décaissements prévus
      pendingPurchases.forEach(purchase => {
        const purchaseDueDate = new Date(purchase.due_date).toISOString().split('T')[0];
        if (purchaseDueDate === dateStr) {
          expenseSources.push({
            type: 'payment',
            entity_id: purchase.id,
            description: purchase.description,
            amount: Math.abs(purchase.amount),
            probability: purchase.probability
          });
        }
      });

      // Charges récurrentes quotidiennes
      if (dailyRecurringExpense > 0) {
        expenseSources.push({
          type: 'recurring_expense',
          description: 'Charges récurrentes quotidiennes',
          amount: dailyRecurringExpense,
          probability: 0.95
        });
      }

      // Calculer les totaux pondérés par probabilité
      const expectedIncome = incomeSources.reduce(
        (sum, item) => sum + (item.amount * item.probability),
        0
      );
      const expectedExpenses = expenseSources.reduce(
        (sum, item) => sum + (item.amount * item.probability),
        0
      );

      // Mettre à jour le solde prévisionnel
      runningBalance = runningBalance + expectedIncome - expectedExpenses;

      // Calculer la confiance (basée sur le nombre de flux identifiés)
      const totalFlows = incomeSources.length + expenseSources.length;
      const confidence = Math.min(0.95, 0.5 + (totalFlows * 0.05));

      predictions.push({
        date: dateStr,
        predicted_balance: runningBalance,
        expected_income: expectedIncome,
        expected_expenses: expectedExpenses,
        confidence,
        income_sources: incomeSources,
        expense_sources: expenseSources
      });
    }

    // 3. Trouver le solde minimum
    const minPrediction = predictions.reduce((min, pred) =>
      pred.predicted_balance < min.predicted_balance ? pred : min
    );

    // 4. Déterminer le niveau de risque
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (minPrediction.predicted_balance < 0) {
      riskLevel = 'critical';
    } else if (minPrediction.predicted_balance < monthlyRecurringExpenses * 0.5) {
      riskLevel = 'high';
    } else if (minPrediction.predicted_balance < monthlyRecurringExpenses) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // 5. Générer des recommandations
    const recommendations: string[] = [];
    if (riskLevel === 'critical') {
      recommendations.push('⚠️ Risque de découvert bancaire - Contacter les clients avec factures impayées');
      recommendations.push('Négocier des délais de paiement avec les fournisseurs');
      recommendations.push('Envisager une ligne de crédit court terme');
    } else if (riskLevel === 'high') {
      recommendations.push('Relancer les factures impayées en priorité');
      recommendations.push('Décaler les dépenses non urgentes');
    } else if (riskLevel === 'medium') {
      recommendations.push('Surveiller les encaissements des 15 prochains jours');
    }

    const prediction: CashFlowPrediction = {
      company_id: companyId,
      generated_at: new Date().toISOString(),
      current_balance: currentBalance,
      currency: 'EUR',
      predictions,
      min_balance: minPrediction.predicted_balance,
      min_balance_date: minPrediction.date,
      risk_level: riskLevel,
      recommendations
    };

    logger.info('CashFlowPrediction: Prediction generated', {
      companyId,
      riskLevel,
      minBalance: minPrediction.predicted_balance
    });

    return prediction;

  } catch (error) {
    logger.error('CashFlowPrediction: Error generating prediction', error, { companyId });
    throw error;
  }
}

/**
 * Crée une alerte IA si risque de trésorerie
 */
export async function checkCashFlowRiskAndCreateAlert(
  companyId: string
): Promise<AIInsight | null> {
  try {
    const prediction = await generateCashFlowPrediction(companyId, 90);

    if (prediction.risk_level === 'critical' || prediction.risk_level === 'high') {
      const daysUntilMin = Math.floor(
        (new Date(prediction.min_balance_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const insight: AIInsight = {
        id: `cashflow-risk-${companyId}-${Date.now()}`,
        company_id: companyId,
        type: 'prediction',
        category: 'finance',
        severity: prediction.risk_level === 'critical' ? 'critical' : 'high',
        title: prediction.risk_level === 'critical'
          ? '⚠️ Risque de découvert bancaire'
          : '📉 Trésorerie basse prévue',
        description: `Solde prévisionnel minimum de ${prediction.min_balance.toFixed(2)}€ dans ${daysUntilMin} jours (${prediction.min_balance_date})`,
        data: {
          prediction,
          current_balance: prediction.current_balance,
          min_balance: prediction.min_balance,
          min_balance_date: prediction.min_balance_date,
          days_until_min: daysUntilMin
        },
        suggested_actions: [
          {
            label: 'Voir les prévisions détaillées',
            action_type: 'navigation',
            navigation_path: '/treasury/forecast'
          },
          {
            label: 'Relancer les impayés',
            action_type: 'workflow',
            workflow_id: 'send-payment-reminders'
          },
          {
            label: 'Voir les factures en attente',
            action_type: 'navigation',
            navigation_path: '/invoicing?status=overdue'
          }
        ],
        status: 'new',
        confidence_score: 0.85,
        model_version: 'cashflow-v1',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
      };

      // Stocker l'insight
      const insightDB = toAIInsightDB(insight);
      await supabase.from('ai_insights').upsert(insightDB, { onConflict: 'id' });

      return insight;
    }

    return null;

  } catch (error) {
    logger.error('CashFlowPrediction: Error checking risk', error, { companyId });
    throw error;
  }
}
