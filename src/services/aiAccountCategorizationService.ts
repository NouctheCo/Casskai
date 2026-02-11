/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 *
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

/**
 * Service d'auto-catégorisation intelligente des transactions comptables
 * Utilise ML (GPT-4) + apprentissage historique pour suggérer comptes comptables
 *
 * @module aiAccountCategorizationService
 * @priority P0 - Feature deal-breaker pour Phase 1
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * Suggestion de compte comptable avec score de confiance
 */
export interface AccountSuggestion {
  account_code: string;
  account_name: string;
  confidence_score: number; // 0-100
  usage_count: number;
  last_used_at: string | null;
  reason?: string; // Explication de la suggestion
}

/**
 * Statistiques d'utilisation de l'auto-catégorisation
 */
export interface CategorizationStats {
  total_suggestions: number;
  validated_suggestions: number;
  rejected_suggestions: number;
  avg_confidence_score: number;
  accuracy_rate: number; // % de suggestions validées
  most_used_accounts: Array<{
    account_code: string;
    usage_count: number;
  }>;
}

/**
 * Contexte de transaction pour améliorer suggestions
 */
interface TransactionContext {
  amount?: number;
  transaction_type?: 'debit' | 'credit' | 'transfer';
  date?: string;
  reference?: string;
  bank_account?: string;
}

/**
 * Service d'auto-catégorisation IA
 */
class AIAccountCategorizationService {
  /**
   * Obtenir suggestions de compte pour une description de transaction
   *
   * @param companyId - ID de l'entreprise
   * @param description - Description de la transaction
   * @param context - Contexte additionnel (montant, type, etc.)
   * @returns Tableau de suggestions triées par confiance
   *
   * @example
   * ```typescript
   * const suggestions = await suggestAccount(
   *   'company-123',
   *   'VIR SALAIRES JANVIER 2024',
   *   { amount: -15000, transaction_type: 'debit' }
   * );
   * // => [{ account_code: '641000', confidence_score: 95, ... }]
   * ```
   */
  async suggestAccount(
    companyId: string,
    description: string,
    context?: TransactionContext
  ): Promise<AccountSuggestion[]> {
    try {
      logger.info('AIAccountCategorization', `Recherche suggestions pour: ${description}`);

      // 1. Chercher suggestions existantes dans la base
      const dbSuggestions = await this.getDBSuggestions(companyId, description);

      if (dbSuggestions.length > 0) {
        logger.info('AIAccountCategorization', `${dbSuggestions.length} suggestions trouvées en cache`);
        return dbSuggestions;
      }

      // 2. Si aucune suggestion en cache, utiliser IA (GPT-4)
      logger.info('AIAccountCategorization', 'Aucune suggestion en cache, appel IA...');
      const aiSuggestion = await this.getAISuggestion(companyId, description, context);

      if (aiSuggestion) {
        // Enregistrer en cache pour futures utilisations
        await this.saveSuggestion(companyId, description, aiSuggestion);
        return [aiSuggestion];
      }

      // 3. Fallback: suggestions génériques basées sur mots-clés
      logger.warn('AIAccountCategorization', 'IA indisponible, utilisation fallback keywords');
      return this.getKeywordBasedSuggestions(description);

    } catch (error) {
      logger.error('AIAccountCategorization', 'Erreur suggestAccount:', error);
      // Fallback gracieux: retourner suggestions génériques
      return this.getKeywordBasedSuggestions(description);
    }
  }

  /**
   * Récupère suggestions depuis la base de données (cache)
   * Utilise la fonction RPC get_ai_account_suggestion
   */
  private async getDBSuggestions(
    companyId: string,
    description: string
  ): Promise<AccountSuggestion[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_ai_account_suggestion', {
          p_company_id: companyId,
          p_description: description,
          p_amount: null
        });

      if (error) {
        logger.error('AIAccountCategorization', 'Erreur RPC get_ai_account_suggestion:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row: any) => ({
        account_code: row.account_code,
        account_name: row.account_name,
        confidence_score: parseFloat(row.confidence_score),
        usage_count: row.usage_count || 0,
        last_used_at: row.last_used_at,
        reason: 'Basé sur historique'
      }));

    } catch (error) {
      logger.error('AIAccountCategorization', 'Erreur getDBSuggestions:', error);
      return [];
    }
  }

  /**
   * Obtient suggestion via GPT-4 (OpenAI)
   * Utilise le prompt engineering pour contextualiser la demande
   */
  private async getAISuggestion(
    companyId: string,
    description: string,
    context?: TransactionContext
  ): Promise<AccountSuggestion | null> {
    try {
      // Récupérer norme comptable de l'entreprise
      const { data: company } = await supabase
        .from('companies')
        .select('accounting_standard, country')
        .eq('id', companyId)
        .single();

      const accountingStandard = company?.accounting_standard || 'PCG';
      const country = company?.country || 'France';

      // Construire le prompt pour GPT-4
      const prompt = this.buildAIPrompt(description, accountingStandard, country, context);

      // Appeler Edge Function ai-assistant
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          query: prompt,
          context_type: 'accounting',
          company_id: companyId,
          system_message: `Tu es un expert-comptable spécialisé en ${accountingStandard}.
Ton rôle est de suggérer le compte comptable le plus approprié pour une transaction.
Réponds UNIQUEMENT avec un objet JSON au format:
{"account_code": "XXXXXX", "account_name": "Nom du compte", "confidence": 85, "reason": "Explication courte"}`
        }
      });

      if (error) {
        logger.error('AIAccountCategorization', 'Erreur Edge Function ai-assistant:', error);
        return null;
      }

      // Parser la réponse GPT-4
      const aiResponse = data?.response || data?.message || '';
      const suggestion = this.parseAIResponse(aiResponse);

      return suggestion;

    } catch (error) {
      logger.error('AIAccountCategorization', 'Erreur getAISuggestion:', error);
      return null;
    }
  }

  /**
   * Construit le prompt pour GPT-4
   */
  private buildAIPrompt(
    description: string,
    accountingStandard: string,
    country: string,
    context?: TransactionContext
  ): string {
    let prompt = `Norme comptable: ${accountingStandard} (${country})\n`;
    prompt += `Transaction: "${description}"\n`;

    if (context) {
      if (context.amount) {
        prompt += `Montant: ${context.amount} €\n`;
      }
      if (context.transaction_type) {
        prompt += `Type: ${context.transaction_type}\n`;
      }
    }

    prompt += `\nQuel compte comptable ${accountingStandard} utiliser pour cette transaction ?`;

    return prompt;
  }

  /**
   * Parse la réponse GPT-4 (JSON ou texte libre)
   */
  private parseAIResponse(response: string): AccountSuggestion | null {
    try {
      // Tenter de parser JSON direct
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          account_code: parsed.account_code || '',
          account_name: parsed.account_name || '',
          confidence_score: parsed.confidence || 70,
          usage_count: 0,
          last_used_at: null,
          reason: parsed.reason || 'Suggestion IA'
        };
      }

      // Fallback: extraire code compte depuis texte
      const codeMatch = response.match(/\b(\d{6})\b/);
      if (codeMatch) {
        return {
          account_code: codeMatch[1],
          account_name: 'Compte suggéré par IA',
          confidence_score: 60,
          usage_count: 0,
          last_used_at: null,
          reason: 'Extraction texte IA'
        };
      }

      logger.warn('AIAccountCategorization', 'Impossible de parser réponse IA:', response);
      return null;

    } catch (error) {
      logger.error('AIAccountCategorization', 'Erreur parseAIResponse:', error);
      return null;
    }
  }

  /**
   * Suggestions génériques basées sur mots-clés (fallback)
   * Utilisé si IA indisponible ou pas de cache
   */
  private getKeywordBasedSuggestions(description: string): AccountSuggestion[] {
    const desc = description.toLowerCase();
    const suggestions: AccountSuggestion[] = [];

    // Mapping mots-clés → comptes PCG français
    const keywordMap: Record<string, { code: string; name: string; keywords: string[] }> = {
      salaires: {
        code: '641000',
        name: 'Rémunérations du personnel',
        keywords: ['salaire', 'salaires', 'paie', 'vir salaires', 'virement salaires']
      },
      urssaf: {
        code: '645000',
        name: 'Charges de sécurité sociale',
        keywords: ['urssaf', 'secu', 'sécurité sociale', 'cotisations sociales']
      },
      electricite: {
        code: '606100',
        name: 'Eau et énergie',
        keywords: ['edf', 'électricité', 'electricite', 'gaz', 'engie', 'eau']
      },
      fournitures: {
        code: '606400',
        name: 'Fournitures administratives',
        keywords: ['amazon', 'bureau vallée', 'fournitures', 'papeterie']
      },
      clients: {
        code: '411000',
        name: 'Clients',
        keywords: ['vir client', 'virement client', 'paiement client', 'facture client']
      },
      fournisseurs: {
        code: '401000',
        name: 'Fournisseurs',
        keywords: ['cheque fournisseur', 'paiement fournisseur', 'vir fournisseur']
      },
      frais_bancaires: {
        code: '661100',
        name: 'Frais bancaires',
        keywords: ['agios', 'frais bancaires', 'commission bancaire', 'tenue de compte']
      },
      loyer: {
        code: '613200',
        name: 'Locations immobilières',
        keywords: ['loyer', 'bail', 'location', 'immobilier']
      },
      telephone: {
        code: '626100',
        name: 'Téléphone',
        keywords: ['orange', 'sfr', 'bouygues', 'free', 'telephone', 'internet']
      }
    };

    // Rechercher mots-clés dans description
    for (const [key, mapping] of Object.entries(keywordMap)) {
      if (mapping.keywords.some(keyword => desc.includes(keyword))) {
        suggestions.push({
          account_code: mapping.code,
          account_name: mapping.name,
          confidence_score: 65, // Score moyen pour fallback
          usage_count: 0,
          last_used_at: null,
          reason: `Mot-clé: ${key}`
        });
      }
    }

    // Si aucune suggestion, retourner compte générique
    if (suggestions.length === 0) {
      suggestions.push({
        account_code: '471000',
        account_name: 'Comptes d\'attente',
        confidence_score: 40,
        usage_count: 0,
        last_used_at: null,
        reason: 'Compte d\'attente (à vérifier manuellement)'
      });
    }

    return suggestions.slice(0, 3); // Max 3 suggestions
  }

  /**
   * Enregistrer suggestion en cache pour futures utilisations
   */
  private async saveSuggestion(
    companyId: string,
    description: string,
    suggestion: AccountSuggestion
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_categorization_suggestions')
        .insert({
          company_id: companyId,
          transaction_description: description,
          suggested_account_code: suggestion.account_code,
          suggested_account_name: suggestion.account_name,
          confidence_score: suggestion.confidence_score,
          learned_from_history: false, // Suggestion IA initiale
          usage_count: 0
        });

      if (error && !error.message.includes('duplicate')) {
        logger.error('AIAccountCategorization', 'Erreur saveSuggestion:', error);
      }

    } catch (error) {
      logger.error('AIAccountCategorization', 'Erreur saveSuggestion:', error);
    }
  }

  /**
   * Enregistrer feedback utilisateur (validation ou rejet)
   * Améliore progressivement les suggestions futures
   *
   * @param companyId - ID de l'entreprise
   * @param description - Description de la transaction
   * @param suggestedAccount - Compte suggéré par IA
   * @param actualAccount - Compte réellement utilisé
   * @param validated - true si suggestion acceptée, false si rejetée
   */
  async recordFeedback(
    companyId: string,
    description: string,
    suggestedAccount: string,
    actualAccount: string,
    validated: boolean
  ): Promise<void> {
    try {
      logger.info('AIAccountCategorization', `Feedback: ${validated ? 'VALIDÉ' : 'REJETÉ'} - ${description}`);

      const { error } = await supabase
        .rpc('record_categorization_feedback', {
          p_company_id: companyId,
          p_description: description,
          p_suggested_account: suggestedAccount,
          p_actual_account: actualAccount,
          p_validated: validated
        });

      if (error) {
        logger.error('AIAccountCategorization', 'Erreur recordFeedback:', error);
      }

    } catch (error) {
      logger.error('AIAccountCategorization', 'Erreur recordFeedback:', error);
    }
  }

  /**
   * Obtenir statistiques d'utilisation de l'auto-catégorisation
   * Utile pour dashboard IA et monitoring accuracy
   */
  async getStats(companyId: string): Promise<CategorizationStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_categorization_stats', {
          p_company_id: companyId
        });

      if (error) {
        logger.error('AIAccountCategorization', 'Erreur getStats:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          total_suggestions: 0,
          validated_suggestions: 0,
          rejected_suggestions: 0,
          avg_confidence_score: 0,
          accuracy_rate: 0,
          most_used_accounts: []
        };
      }

      const stats = data[0];
      const totalValidatedOrRejected = stats.validated_suggestions + stats.rejected_suggestions;
      const accuracyRate = totalValidatedOrRejected > 0
        ? (stats.validated_suggestions / totalValidatedOrRejected) * 100
        : 0;

      return {
        total_suggestions: stats.total_suggestions,
        validated_suggestions: stats.validated_suggestions,
        rejected_suggestions: stats.rejected_suggestions,
        avg_confidence_score: parseFloat(stats.avg_confidence_score) || 0,
        accuracy_rate: Math.round(accuracyRate * 100) / 100,
        most_used_accounts: stats.most_used_accounts || []
      };

    } catch (error) {
      logger.error('AIAccountCategorization', 'Erreur getStats:', error);
      return null;
    }
  }

  /**
   * Incrémenter compteur d'utilisation d'une suggestion
   * Appelé quand l'utilisateur sélectionne une suggestion
   *
   * @param companyId - ID de l'entreprise
   * @param description - Description de la transaction
   * @param accountCode - Code du compte sélectionné
   */
  async incrementUsageCount(
    companyId: string,
    description: string,
    accountCode: string
  ): Promise<void> {
    try {
      // Récupérer la suggestion existante
      const { data: existing } = await supabase
        .from('ai_categorization_suggestions')
        .select('usage_count')
        .eq('company_id', companyId)
        .eq('transaction_description', description)
        .eq('suggested_account_code', accountCode)
        .single();

      if (existing) {
        // Mettre à jour avec incrémentation
        const { error } = await supabase
          .from('ai_categorization_suggestions')
          .update({
            usage_count: (existing.usage_count || 0) + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('company_id', companyId)
          .eq('transaction_description', description)
          .eq('suggested_account_code', accountCode);

        if (error) {
          logger.error('AIAccountCategorization', 'Erreur incrementUsageCount:', error);
        }
      }
    } catch (error) {
      logger.error('AIAccountCategorization', 'Erreur incrementUsageCount:', error);
    }
  }

  /**
   * Apprentissage depuis historique des écritures existantes
   * Analyse les écritures validées pour créer suggestions
   *
   * @param companyId - ID de l'entreprise
   * @param limit - Nombre max d'écritures à analyser (défaut: 1000)
   */
  async learnFromHistory(companyId: string, limit = 1000): Promise<number> {
    try {
      logger.info('AIAccountCategorization', `Apprentissage depuis historique (${limit} écritures)...`);

      // Récupérer écritures existantes validées
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('description, journal_entry_lines(account_number, account_id)')
        .eq('company_id', companyId)
        .eq('status', 'validated')
        .not('description', 'is', null)
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error || !entries) {
        logger.error('AIAccountCategorization', 'Erreur récupération historique:', error);
        return 0;
      }

      let learnedCount = 0;

      // Grouper par description → compte le plus fréquent
      const descriptionMap = new Map<string, Map<string, number>>();

      for (const entry of entries) {
        const description = entry.description?.trim();
        if (!description || !entry.journal_entry_lines) continue;

        for (const line of entry.journal_entry_lines as any[]) {
          const accountNumber = line.account_number;
          if (!accountNumber) continue;

          if (!descriptionMap.has(description)) {
            descriptionMap.set(description, new Map());
          }

          const accountCounts = descriptionMap.get(description)!;
          accountCounts.set(accountNumber, (accountCounts.get(accountNumber) || 0) + 1);
        }
      }

      // Créer suggestions basées sur fréquences
      for (const [description, accountCounts] of descriptionMap.entries()) {
        // Trouver compte le plus fréquent
        let maxCount = 0;
        let mostFrequentAccount = '';

        for (const [account, count] of accountCounts.entries()) {
          if (count > maxCount) {
            maxCount = count;
            mostFrequentAccount = account;
          }
        }

        if (mostFrequentAccount && maxCount >= 2) {
          // Calculer confidence basé sur fréquence
          const totalOccurrences = Array.from(accountCounts.values()).reduce((a, b) => a + b, 0);
          const confidence = Math.min((maxCount / totalOccurrences) * 100, 95);

          // Sauvegarder suggestion
          await this.saveSuggestion(companyId, description, {
            account_code: mostFrequentAccount,
            account_name: 'Compte appris depuis historique',
            confidence_score: Math.round(confidence),
            usage_count: maxCount,
            last_used_at: null,
            reason: `Utilisé ${maxCount} fois dans l'historique`
          });

          learnedCount++;
        }
      }

      logger.info('AIAccountCategorization', `Apprentissage terminé: ${learnedCount} suggestions créées`);
      return learnedCount;

    } catch (error) {
      logger.error('AIAccountCategorization', 'Erreur learnFromHistory:', error);
      return 0;
    }
  }
}

// Export singleton
export const aiAccountCategorizationService = new AIAccountCategorizationService();
export default aiAccountCategorizationService;
