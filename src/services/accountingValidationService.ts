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

import { JournalEntrySchema, JournalEntryType, ImportError } from '../types/accounting-import.types';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';

/**
 * Service de validation comptable avec Zod et règles métier
 */
export class AccountingValidationService {
  
  /**
   * Valide une écriture comptable complète
   */
  static async validateJournalEntry(entry: any, companyId: string): Promise<{
    isValid: boolean;
    errors: ImportError[];
    warnings: ImportError[];
    validatedEntry?: JournalEntryType;
  }> {
    const errors: ImportError[] = [];
    const warnings: ImportError[] = [];

    try {
      // 1. Validation Zod de base
      const zodValidation = JournalEntrySchema.safeParse({ ...entry, companyId });
      
      if (!zodValidation.success) {
        zodValidation.error.errors.forEach(err => {
          errors.push({
            row: 0,
            field: err.path.join('.'),
            message: err.message,
            type: 'validation',
            severity: 'error'
          });
        });
        return { isValid: false, errors, warnings };
      }

      const validatedEntry = zodValidation.data;

      // 2. Validations métier avancées
      await this.validateBusinessRules(validatedEntry, errors, warnings);

      // 3. Validation de cohérence des comptes
      await this.validateAccountConsistency(validatedEntry, errors, warnings);

      // 4. Validation des équilibres
      this.validateBalance(validatedEntry, errors);

      // 5. Validation des contraintes temporelles
      this.validateDateConstraints(validatedEntry, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedEntry: errors.length === 0 ? validatedEntry : undefined
      };

    } catch (err) {
      errors.push({
        row: 0,
        message: `Erreur de validation: ${(err as Error).message}`,
        type: 'validation',
        severity: 'error'
      });
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validation des règles métier
   */
  private static async validateBusinessRules(
    entry: JournalEntryType,
    errors: ImportError[],
    warnings: ImportError[]
  ): Promise<void> {
    // Règle 1: Vérification de l'unicité du numéro d'écriture
    const existingEntry = await supabase
      .from('journal_entries')
      .select('id')
      .eq('company_id', entry.companyId)
      .eq('entry_number', entry.entryNumber)
      .single();

    if (existingEntry.data) {
      errors.push({
        row: 0,
        field: 'entryNumber',
        message: 'Numéro d\'écriture déjà existant',
        type: 'business',
        severity: 'error'
      });
    }

    // Règle 2: Validation de la période comptable
    const currentYear = new Date().getFullYear();
    const entryYear = new Date(entry.date).getFullYear();
    
    if (entryYear < currentYear - 1) {
      warnings.push({
        row: 0,
        field: 'date',
        message: 'Écriture sur exercice clôturé',
        type: 'business',
        severity: 'warning'
      });
    }

    // Règle 3: Validation des comptes selon le journal
    await this.validateJournalAccountRules(entry, errors, warnings);
  }

  /**
   * Validation des règles journal/comptes
   */
  private static async validateJournalAccountRules(
    entry: JournalEntryType,
    errors: ImportError[],
    warnings: ImportError[]
  ): Promise<void> {
    // Récupération du journal
    const journal = await supabase
      .from('journals')
      .select('code, type, name')
      .eq('id', entry.journalId)
      .single();

    if (!journal.data) {
      errors.push({
        row: 0,
        field: 'journalId',
        message: 'Journal inexistant',
        type: 'business',
        severity: 'error'
      });
      return;
    }

    // Récupération des comptes utilisés
    const accountIds = entry.items.map(item => item.accountId);
    const accounts = await supabase
      .from('chart_of_accounts')
      .select('id, account_number, account_type, account_class')
      .in('id', accountIds);

    if (!accounts.data || accounts.data.length !== accountIds.length) {
      errors.push({
        row: 0,
        field: 'items',
        message: 'Un ou plusieurs comptes n\'existent pas',
        type: 'business',
        severity: 'error'
      });
      return;
    }

    // Validation des règles spécifiques par type de journal
    const journalRules = this.getJournalAccountRules(journal.data.type);
    
    accounts.data.forEach(account => {
      const accountClass = account.account_number.charAt(0);
      if (!journalRules.allowedClasses.includes(accountClass)) {
        warnings.push({
          row: 0,
          field: 'items',
          message: `Compte ${account.account_number} inhabituel pour journal ${journal.data.code}`,
          type: 'business',
          severity: 'warning'
        });
      }
    });
  }

  /**
   * Règles de comptes par type de journal
   */
  private static getJournalAccountRules(journalType: string): {
    allowedClasses: string[];
    requiredClasses?: string[];
  } {
    const rules: Record<string, { allowedClasses: string[]; requiredClasses?: string[] }> = {
      'sales': {
        allowedClasses: ['4', '7', '4', '5'], // Clients, Ventes, TVA, Banque
        requiredClasses: ['7'] // Au moins un compte de vente
      },
      'purchases': {
        allowedClasses: ['4', '6', '4', '5'], // Fournisseurs, Achats, TVA, Banque
        requiredClasses: ['6'] // Au moins un compte d'achat
      },
      'bank': {
        allowedClasses: ['5', '4', '6', '7'], // Banque, Tiers, Charges, Produits
        requiredClasses: ['5'] // Au moins un compte de trésorerie
      },
      'miscellaneous': {
        allowedClasses: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] // Tous
      }
    };

    return rules[journalType] || rules['miscellaneous'];
  }

  /**
   * Validation de la cohérence des comptes
   */
  private static async validateAccountConsistency(
    entry: JournalEntryType,
    errors: ImportError[],
    warnings: ImportError[]
  ): Promise<void> {
    const accountIds = entry.items.map(item => item.accountId);
    const accounts = await supabase
      .from('chart_of_accounts')
      .select('id, account_number, account_name, account_type, is_active')
      .in('id', accountIds);

    if (!accounts.data) return;

    accounts.data.forEach((account, index) => {
      // Vérification que le compte est actif
      if (!account.is_active) {
        errors.push({
          row: 0,
          field: `items.${index}.accountId`,
          message: `Compte ${account.account_number} inactif`,
          type: 'business',
          severity: 'error'
        });
      }

      // Vérification de cohérence débit/crédit avec le type de compte
      const item = entry.items[index];
      this.validateAccountNormalBalance(account, item, index, warnings);
    });
  }

  /**
   * Validation du sens normal des comptes
   */
  private static validateAccountNormalBalance(
    account: any,
    item: any,
    index: number,
    warnings: ImportError[]
  ): void {
    const accountClass = account.account_number.charAt(0);
    const debitAccount = ['1', '2', '3', '6', '8'].includes(accountClass);
    const creditAccount = ['4', '7', '9'].includes(accountClass);

    if (debitAccount && item.creditAmount > item.debitAmount) {
      warnings.push({
        row: 0,
        field: `items.${index}`,
        message: `Compte ${account.account_number} mouvementé au crédit (inhabituel)`,
        type: 'business',
        severity: 'warning'
      });
    }

    if (creditAccount && item.debitAmount > item.creditAmount) {
      warnings.push({
        row: 0,
        field: `items.${index}`,
        message: `Compte ${account.account_number} mouvementé au débit (inhabituel)`,
        type: 'business',
        severity: 'warning'
      });
    }
  }

  /**
   * Validation de l'équilibre de l'écriture
   */
  private static validateBalance(entry: JournalEntryType, errors: ImportError[]): void {
    const totalDebit = entry.items.reduce((sum, item) => sum + item.debitAmount, 0);
    const totalCredit = entry.items.reduce((sum, item) => sum + item.creditAmount, 0);
    const difference = Math.abs(totalDebit - totalCredit);

    if (difference > 0.01) { // Tolérance d'1 centime pour les arrondis
      errors.push({
        row: 0,
        field: 'items',
        message: `Écriture déséquilibrée: Débit ${formatCurrency(totalDebit)}, Crédit ${formatCurrency(totalCredit)} (écart: ${formatCurrency(difference)})`,
        type: 'business',
        severity: 'error'
      });
    }
  }

  /**
   * Validation des contraintes temporelles
   */
  private static validateDateConstraints(entry: JournalEntryType, warnings: ImportError[]): void {
    const entryDate = new Date(entry.date);
    const today = new Date();
    
    // Écriture future
    if (entryDate > today) {
      warnings.push({
        row: 0,
        field: 'date',
        message: 'Écriture datée dans le futur',
        type: 'business',
        severity: 'warning'
      });
    }

    // Écriture trop ancienne
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    if (entryDate < threeMonthsAgo) {
      warnings.push({
        row: 0,
        field: 'date',
        message: 'Écriture datée de plus de 3 mois',
        type: 'business',
        severity: 'warning'
      });
    }
  }

  /**
   * Détection et gestion des doublons
   */
  static async detectDuplicates(
    entries: JournalEntryType[],
    companyId: string
  ): Promise<{
    duplicates: Array<{
      entry: JournalEntryType;
      existingEntryId: string;
      similarity: number;
      matchCriteria: string[];
    }>;
    unique: JournalEntryType[];
  }> {
    const duplicates: any[] = [];
    const unique: JournalEntryType[] = [];

    for (const entry of entries) {
      const potentialDuplicates = await this.findSimilarEntries(entry, companyId);
      
      if (potentialDuplicates.length > 0) {
        const bestMatch = potentialDuplicates.reduce((best, current) => 
          current.similarity > best.similarity ? current : best
        );

        if (bestMatch.similarity > 0.8) { // Seuil de 80% de similarité
          duplicates.push({
            entry,
            existingEntryId: bestMatch.id,
            similarity: bestMatch.similarity,
            matchCriteria: bestMatch.criteria
          });
        } else {
          unique.push(entry);
        }
      } else {
        unique.push(entry);
      }
    }

    return { duplicates, unique };
  }

  /**
   * Recherche d'écritures similaires
   */
  private static async findSimilarEntries(
    entry: JournalEntryType,
    companyId: string
  ): Promise<Array<{
    id: string;
    similarity: number;
    criteria: string[];
  }>> {
    // Recherche par critères multiples
    const dateRange = new Date(entry.date);
    const startDate = new Date(dateRange);
    startDate.setDate(startDate.getDate() - 7); // ±7 jours
    const endDate = new Date(dateRange);
    endDate.setDate(endDate.getDate() + 7);

    const _totalAmount = entry.items.reduce((sum, item) => sum + item.debitAmount + item.creditAmount, 0) / 2;

    const similarEntries = await supabase
      .from('journal_entries')
      .select(`
        id, entry_number, entry_date, description,
        journal_entry_lines (
          account_id,
          debit_amount,
          credit_amount,
          description,
          account_number,
          account_name,
          line_order
        )
      `)
      .eq('company_id', companyId)
      .gte('entry_date', startDate.toISOString())
      .lte('entry_date', endDate.toISOString())
      .neq('id', entry.id || '');

    if (!similarEntries.data) return [];

    return similarEntries.data.map(existing => {
      const similarity = this.calculateSimilarity(entry, existing);
      return {
        id: existing.id,
        similarity: similarity.score,
        criteria: similarity.criteria
      };
    }).filter(result => result.similarity > 0.5);
  }

  /**
   * Calcul de similarité entre deux écritures
   */
  private static calculateSimilarity(entry1: any, entry2: any): {
    score: number;
    criteria: string[];
  } {
    let score = 0;
    const criteria: string[] = [];
    const weights = {
      amount: 0.4,
      accounts: 0.3,
      date: 0.2,
      description: 0.1
    };

    // Similarité des montants
    const amount1 = entry1.items.reduce((sum: number, item: any) => sum + item.debitAmount, 0);
    const amount2 = entry2.journal_entry_lines.reduce((sum: number, item: any) => sum + item.debit_amount, 0);
    const amountSimilarity = 1 - Math.abs(amount1 - amount2) / Math.max(amount1, amount2, 1);

    if (amountSimilarity > 0.95) {
      score += weights.amount;
      criteria.push('montant identique');
    } else if (amountSimilarity > 0.8) {
      score += weights.amount * 0.7;
      criteria.push('montant similaire');
    }

    // Similarité des comptes
    const accounts1 = new Set(entry1.items.map((item: any) => item.accountId));
    const accounts2 = new Set(entry2.journal_entry_lines.map((item: any) => item.account_id));
    const commonAccounts = new Set([...accounts1].filter(x => accounts2.has(x)));
    const accountSimilarity = commonAccounts.size / Math.max(accounts1.size, accounts2.size);
    
    if (accountSimilarity === 1) {
      score += weights.accounts;
      criteria.push('comptes identiques');
    } else if (accountSimilarity > 0.5) {
      score += weights.accounts * accountSimilarity;
      criteria.push('comptes partiellement identiques');
    }

    // Similarité des dates (déjà filtrée par la requête)
    const date1 = new Date(entry1.date);
    const date2 = new Date(entry2.date);
    const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff === 0) {
      score += weights.date;
      criteria.push('même date');
    } else if (daysDiff <= 1) {
      score += weights.date * 0.8;
      criteria.push('dates proches');
    }

    // Similarité des descriptions
    const desc1 = entry1.description.toLowerCase();
    const desc2 = entry2.description.toLowerCase();
    const descSimilarity = this.calculateTextSimilarity(desc1, desc2);
    
    if (descSimilarity > 0.8) {
      score += weights.description;
      criteria.push('descriptions similaires');
    }

    return { score, criteria };
  }

  /**
   * Calcul de similarité textuelle (distance de Levenshtein simplifiée)
   */
  private static calculateTextSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.includes(shorter)) return 0.8;
    
    // Similarité basée sur les mots communs
    const words1 = str1.split(' ').filter(w => w.length > 2);
    const words2 = str2.split(' ').filter(w => w.length > 2);
    const commonWords = words1.filter(w => words2.includes(w));
    
    return commonWords.length / Math.max(words1.length, words2.length, 1);
  }

  /**
   * Validation en lot d'écritures
   */
  static async validateBatch(
    entries: any[],
    companyId: string
  ): Promise<{
    valid: JournalEntryType[];
    invalid: Array<{ entry: any; errors: ImportError[] }>;
    warnings: ImportError[];
  }> {
    const valid: JournalEntryType[] = [];
    const invalid: Array<{ entry: any; errors: ImportError[] }> = [];
    const allWarnings: ImportError[] = [];

    for (let i = 0; i < entries.length; i++) {
      const validation = await this.validateJournalEntry(entries[i], companyId);
      
      if (validation.isValid && validation.validatedEntry) {
        valid.push(validation.validatedEntry);
      } else {
        invalid.push({
          entry: entries[i],
          errors: validation.errors.map(err => ({ ...err, row: i + 1 }))
        });
      }
      
      allWarnings.push(
        ...validation.warnings.map(warn => ({ ...warn, row: i + 1 }))
      );
    }

    return {
      valid,
      invalid,
      warnings: allWarnings
    };
  }
}
