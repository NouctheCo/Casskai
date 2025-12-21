/**
 * Service de catégorisation automatique des transactions
 * Utilise l'apprentissage des choix utilisateur + règles par mots-clés
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type { CategorySuggestion, SimilarTransaction, AlternativeCategory } from '@/types/automation.types';

// Dictionnaire de mots-clés pour catégorisation automatique
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Transport': ['sncf', 'uber', 'taxi', 'essence', 'péage', 'parking', 'train', 'avion', 'air france', 'blablacar'],
  'Restauration': ['restaurant', 'café', 'boulangerie', 'mcdonalds', 'burger king', 'pizza', 'déjeuner'],
  'Fournitures': ['bureau vallée', 'staples', 'papeterie', 'fourniture', 'cartouche', 'papier'],
  'Télécom': ['orange', 'sfr', 'free', 'bouygues', 'téléphone', 'internet', 'mobile'],
  'Logiciel': ['microsoft', 'adobe', 'google', 'saas', 'abonnement', 'licence', 'software'],
  'Electricité': ['edf', 'engie', 'électricité', 'gaz', 'eau', 'enedis'],
  'Loyer': ['loyer', 'bail', 'location', 'immobilier'],
  'Assurance': ['assurance', 'axa', 'allianz', 'maif', 'macif', 'mutuelle'],
  'Banque': ['frais bancaires', 'commission', 'agios', 'carte bancaire'],
  'Marketing': ['google ads', 'facebook ads', 'publicité', 'marketing', 'seo', 'communication'],
  'Comptabilité': ['expert comptable', 'comptable', 'audit', 'legal'],
  'Salaires': ['salaire', 'paie', 'urssaf', 'charges sociales']
};

/**
 * Calcule la similarité entre deux chaînes de caractères
 * Utilise l'algorithme de Levenshtein simplifié
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  // Vérifier si une chaîne contient l'autre
  if (s1.includes(s2) || s2.includes(s1)) {
    const shorter = s1.length < s2.length ? s1 : s2;
    const longer = s1.length >= s2.length ? s1 : s2;
    return shorter.length / longer.length;
  }

  // Compter les mots en commun
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w)).length;
  const totalWords = Math.max(words1.length, words2.length);

  return commonWords / totalWords;
}

/**
 * Catégorise une transaction basée sur des mots-clés
 */
function categorizeByKeywords(description: string): { category: string; confidence: number } | null {
  const descLower = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (descLower.includes(keyword)) {
        // Confiance basée sur la longueur du match
        const confidence = Math.min(0.9, 0.6 + (keyword.length / description.length) * 0.3);
        return { category, confidence };
      }
    }
  }

  return null;
}

/**
 * Trouve des transactions similaires déjà catégorisées
 */
async function findSimilarTransactions(
  companyId: string,
  description: string,
  _amount: number
): Promise<SimilarTransaction[]> {
  try {
    // Récupérer les transactions catégorisées des 12 derniers mois
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, description, category, date, amount')
      .eq('company_id', companyId)
      .not('category', 'is', null)
      .gte('date', twelveMonthsAgo.toISOString())
      .limit(100);

    if (error) throw error;
    if (!transactions) return [];

    // Calculer la similarité avec chaque transaction
    const similarities = transactions.map(tx => ({
      id: tx.id,
      description: tx.description,
      category: tx.category!,
      amount: tx.amount,
      date: tx.date,
      similarity_score: calculateSimilarity(description, tx.description)
    }));

    // Filtrer et trier par similarité
    return similarities
      .filter(s => s.similarity_score > 0.3) // Seuil minimum de similarité
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 5);

  } catch (error) {
    logger.error('Categorization: Error finding similar transactions', error);
    return [];
  }
}

/**
 * Suggère une catégorie pour une transaction
 */
export async function suggestCategory(
  companyId: string,
  transactionId: string,
  description: string,
  amount: number
): Promise<CategorySuggestion> {
  try {
    logger.info('Categorization: Suggesting category', { transactionId, description });

    // 1. Chercher des transactions similaires déjà catégorisées
    const similarTransactions = await findSimilarTransactions(companyId, description, amount);

    let suggestedCategory: string;
    let confidence: number;
    let reasoning: string;
    const alternatives: AlternativeCategory[] = [];

    if (similarTransactions.length > 0) {
      // Utiliser la catégorie de la transaction la plus similaire
      const best = similarTransactions[0];
      suggestedCategory = best.category;
      confidence = Math.min(0.95, best.similarity_score * 1.2);
      reasoning = `Basé sur ${similarTransactions.length} transaction(s) similaire(s), notamment "${best.description}" (similarité: ${(best.similarity_score * 100).toFixed(0)}%)`;

      // Ajouter des alternatives si plusieurs catégories trouvées
      const categoryFrequency = new Map<string, number>();
      similarTransactions.forEach(tx => {
        const count = categoryFrequency.get(tx.category) || 0;
        categoryFrequency.set(tx.category, count + 1);
      });

      for (const [cat, count] of categoryFrequency.entries()) {
        if (cat !== suggestedCategory) {
          alternatives.push({
            category: cat,
            confidence: (count / similarTransactions.length) * 0.8
          });
        }
      }

    } else {
      // Fallback sur les mots-clés
      const keywordMatch = categorizeByKeywords(description);

      if (keywordMatch) {
        suggestedCategory = keywordMatch.category;
        confidence = keywordMatch.confidence;
        reasoning = `Catégorisation basée sur les mots-clés (pas de transaction similaire trouvée)`;
      } else {
        // Aucune suggestion
        suggestedCategory = 'Non catégorisé';
        confidence = 0.1;
        reasoning = 'Aucune correspondance trouvée. Veuillez catégoriser manuellement.';
      }
    }

    const suggestion: CategorySuggestion = {
      transaction_id: transactionId,
      suggested_category: suggestedCategory,
      confidence,
      alternatives: alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 3),
      reasoning,
      similar_transactions: similarTransactions
    };

    logger.info('Categorization: Suggestion generated', {
      transactionId,
      category: suggestedCategory,
      confidence
    });

    return suggestion;

  } catch (error) {
    logger.error('Categorization: Error suggesting category', error, { transactionId });
    throw error;
  }
}

/**
 * Catégorise automatiquement toutes les transactions non catégorisées
 */
export async function autoCategorizeTransactions(
  companyId: string,
  minConfidence: number = 0.7
): Promise<{ categorized: number; suggestions: CategorySuggestion[] }> {
  try {
    logger.info('Categorization: Auto-categorizing transactions', { companyId, minConfidence });

    // Récupérer les transactions non catégorisées
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, description, date, amount')
      .eq('company_id', companyId)
      .is('category', null)
      .limit(50); // Traiter 50 à la fois

    if (error) throw error;
    if (!transactions || transactions.length === 0) {
      return { categorized: 0, suggestions: [] };
    }

    const suggestions: CategorySuggestion[] = [];
    let categorized = 0;

    for (const tx of transactions) {
      const suggestion = await suggestCategory(
        companyId,
        tx.id,
        tx.description,
        tx.amount
      );

      suggestions.push(suggestion);

      // Si confiance suffisante, catégoriser automatiquement
      if (suggestion.confidence >= minConfidence) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ category: suggestion.suggested_category })
          .eq('id', tx.id);

        if (!updateError) {
          categorized++;
        }
      }
    }

    logger.info('Categorization: Auto-categorization complete', {
      companyId,
      categorized,
      total: transactions.length
    });

    return { categorized, suggestions };

  } catch (error) {
    logger.error('Categorization: Error auto-categorizing', error, { companyId });
    throw error;
  }
}

/**
 * Applique une catégorie suggérée (learning from user)
 */
export async function applyCategorySuggestion(
  transactionId: string,
  category: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ category })
      .eq('id', transactionId);

    if (error) throw error;

    logger.info('Categorization: Category applied', { transactionId, category });

  } catch (error) {
    logger.error('Categorization: Error applying category', error, { transactionId });
    throw error;
  }
}
