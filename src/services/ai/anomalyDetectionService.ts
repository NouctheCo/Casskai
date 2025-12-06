/**
 * Service de détection d'anomalies basé sur l'analyse statistique
 * Utilise le Z-score pour détecter les valeurs aberrantes
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type { AIInsight } from '@/types/automation.types';
import { toAIInsightDB, fromAIInsightDB } from '../automation/workflowAdapter';

// Seuils de détection
const Z_SCORE_THRESHOLD = 2.0;  // 2 écarts-types = ~95% de confiance
const MIN_DATA_POINTS = 10;      // Minimum de données historiques nécessaires

/**
 * Calcule la moyenne d'un tableau de nombres
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calcule l'écart-type d'un tableau de nombres
 */
function calculateStdDeviation(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calcule le Z-score d'une valeur
 */
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Détecte les anomalies dans les transactions d'une entreprise
 */
export async function detectTransactionAnomalies(
  companyId: string
): Promise<AIInsight[]> {
  try {
    logger.info('AnomalyDetection: Analyzing transactions', { companyId });

    // 1. Récupérer les transactions des 12 derniers mois
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, amount, description, category, date, type, created_at')
      .eq('company_id', companyId)
      .gte('date', twelveMonthsAgo.toISOString())
      .order('date', { ascending: true });

    if (error) throw error;
    if (!transactions || transactions.length < MIN_DATA_POINTS) {
      logger.info('AnomalyDetection: Not enough data', {
        companyId,
        dataPoints: transactions?.length || 0
      });
      return [];
    }

    // 2. Grouper par catégorie
    const byCategory = new Map<string, typeof transactions>();
    transactions.forEach(tx => {
      const category = tx.category || 'uncategorized';
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(tx);
    });

    // 3. Détecter les anomalies par catégorie
    const insights: AIInsight[] = [];
    const now = new Date().toISOString();

    for (const [category, categoryTransactions] of byCategory.entries()) {
      if (categoryTransactions.length < MIN_DATA_POINTS) continue;

      // Prendre seulement les montants absolus pour analyse
      const amounts = categoryTransactions.map(tx => Math.abs(tx.amount));
      const mean = calculateMean(amounts);
      const stdDev = calculateStdDeviation(amounts, mean);

      // Analyser les 5 dernières transactions pour cette catégorie
      const recentTransactions = categoryTransactions.slice(-5);

      for (const transaction of recentTransactions) {
        const amount = Math.abs(transaction.amount);
        const zScore = calculateZScore(amount, mean, stdDev);

        // Anomalie détectée si z-score > seuil
        if (Math.abs(zScore) > Z_SCORE_THRESHOLD) {
          const percentageDiff = ((amount - mean) / mean) * 100;

          insights.push({
            id: `anomaly-${transaction.id}-${Date.now()}`,
            company_id: companyId,
            type: 'anomaly',
            category: 'finance',
            severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
            title: `Dépense inhabituelle détectée`,
            description: `La transaction "${transaction.description}" de ${amount.toFixed(2)}€ dans la catégorie "${category}" est ${Math.abs(percentageDiff).toFixed(0)}% ${percentageDiff > 0 ? 'au-dessus' : 'en-dessous'} de la moyenne (${mean.toFixed(2)}€)`,
            related_entity_type: 'transaction',
            related_entity_id: transaction.id,
            data: {
              transaction_id: transaction.id,
              amount,
              category,
              mean,
              std_deviation: stdDev,
              z_score: zScore,
              percentage_diff: percentageDiff,
              historical_data: amounts.map((val, idx) => ({
                date: categoryTransactions[idx].date,
                value: val
              }))
            },
            suggested_actions: [
              {
                label: 'Voir la transaction',
                action_type: 'navigation',
                navigation_path: `/accounting/transactions?id=${transaction.id}`
              },
              {
                label: 'Marquer comme normal',
                action_type: 'api_call',
                api_endpoint: '/api/insights/dismiss',
                api_payload: { insight_id: `anomaly-${transaction.id}-${Date.now()}` }
              }
            ],
            status: 'new',
            confidence_score: Math.min(Math.abs(zScore) / 3, 1.0),
            model_version: 'zscore-v1',
            created_at: now
          });
        }
      }
    }

    logger.info('AnomalyDetection: Analysis complete', {
      companyId,
      anomaliesFound: insights.length
    });

    return insights;

  } catch (error) {
    logger.error('AnomalyDetection: Error detecting anomalies', error, { companyId });
    throw error;
  }
}

/**
 * Détecte les anomalies dans les dépenses (expenses)
 */
export async function detectExpenseAnomalies(
  companyId: string
): Promise<AIInsight[]> {
  try {
    logger.info('AnomalyDetection: Analyzing expenses', { companyId });

    // 1. Récupérer les dépenses des 12 derniers mois
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('id, amount, description, category, date, created_at')
      .eq('company_id', companyId)
      .gte('date', twelveMonthsAgo.toISOString())
      .order('date', { ascending: true });

    if (error) throw error;
    if (!expenses || expenses.length < MIN_DATA_POINTS) {
      return [];
    }

    // 2. Grouper par catégorie
    const byCategory = new Map<string, typeof expenses>();
    expenses.forEach(exp => {
      const category = exp.category || 'uncategorized';
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(exp);
    });

    // 3. Détecter les anomalies
    const insights: AIInsight[] = [];
    const now = new Date().toISOString();

    for (const [category, categoryExpenses] of byCategory.entries()) {
      if (categoryExpenses.length < MIN_DATA_POINTS) continue;

      const amounts = categoryExpenses.map(exp => exp.amount);
      const mean = calculateMean(amounts);
      const stdDev = calculateStdDeviation(amounts, mean);

      // Analyser les dépenses récentes (derniers 30 jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentExpenses = categoryExpenses.filter(
        exp => new Date(exp.date) >= thirtyDaysAgo
      );

      for (const expense of recentExpenses) {
        const zScore = calculateZScore(expense.amount, mean, stdDev);

        if (Math.abs(zScore) > Z_SCORE_THRESHOLD) {
          const percentageDiff = ((expense.amount - mean) / mean) * 100;

          insights.push({
            id: `anomaly-expense-${expense.id}-${Date.now()}`,
            company_id: companyId,
            type: 'anomaly',
            category: 'finance',
            severity: Math.abs(zScore) > 3 ? 'critical' : 'high',
            title: `Dépense anormalement ${percentageDiff > 0 ? 'élevée' : 'basse'}`,
            description: `La dépense "${expense.description}" de ${expense.amount.toFixed(2)}€ dans la catégorie "${category}" dépasse de ${Math.abs(percentageDiff).toFixed(0)}% la moyenne habituelle`,
            related_entity_type: 'expense',
            related_entity_id: expense.id,
            data: {
              expense_id: expense.id,
              amount: expense.amount,
              category,
              mean,
              std_deviation: stdDev,
              z_score: zScore,
              percentage_diff: percentageDiff
            },
            suggested_actions: [
              {
                label: 'Examiner la dépense',
                action_type: 'navigation',
                navigation_path: `/expenses/${expense.id}`
              },
              {
                label: 'Demander justification',
                action_type: 'workflow',
                workflow_id: 'request-expense-justification'
              }
            ],
            status: 'new',
            confidence_score: Math.min(Math.abs(zScore) / 3, 1.0),
            model_version: 'zscore-v1',
            created_at: now
          });
        }
      }
    }

    logger.info('AnomalyDetection: Expense analysis complete', {
      companyId,
      anomaliesFound: insights.length
    });

    return insights;

  } catch (error) {
    logger.error('AnomalyDetection: Error detecting expense anomalies', error, { companyId });
    throw error;
  }
}

/**
 * Exécute toutes les détections d'anomalies et stocke les résultats
 */
export async function runAnomalyDetection(companyId: string): Promise<AIInsight[]> {
  try {
    const [transactionAnomalies, expenseAnomalies] = await Promise.all([
      detectTransactionAnomalies(companyId),
      detectExpenseAnomalies(companyId)
    ]);

    const allInsights = [...transactionAnomalies, ...expenseAnomalies];

    // Stocker les insights en base
    if (allInsights.length > 0) {
      const insightsDB = allInsights.map(toAIInsightDB);
      const { error } = await supabase
        .from('ai_insights')
        .upsert(insightsDB, { onConflict: 'id' });

      if (error) {
        logger.error('AnomalyDetection: Error storing insights', error);
      }
    }

    return allInsights;

  } catch (error) {
    logger.error('AnomalyDetection: Error running detection', error, { companyId });
    throw error;
  }
}

/**
 * Récupère les anomalies actives pour une entreprise
 */
export async function getActiveAnomalies(companyId: string): Promise<AIInsight[]> {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('company_id', companyId)
      .eq('insight_type', 'anomaly')
      .in('status', ['new', 'seen'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data || []).map(fromAIInsightDB);

  } catch (error) {
    logger.error('AnomalyDetection: Error getting active anomalies', error);
    throw error;
  }
}
