/**
 * Service de réconciliation bancaire automatique et manuelle
 * Permet de rapprocher les transactions bancaires avec les écritures comptables
 */

import { supabase } from '@/lib/supabase';
import { BankTransaction } from './bankImportService';

export interface AccountingEntry {
  id: string;
  company_id: string;
  account_number: string;
  date: string;
  amount: number;
  debit: number;
  credit: number;
  description: string;
  reference?: string;
  journal_entry_id?: string;
  reconciled: boolean;
  bank_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationMatch {
  bank_transaction: BankTransaction;
  accounting_entries: AccountingEntry[];
  confidence_score: number;
  match_type: 'exact' | 'fuzzy' | 'manual';
  match_criteria: string[];
  suggested: boolean;
}

export interface ReconciliationSummary {
  total_bank_transactions: number;
  total_accounting_entries: number;
  matched_transactions: number;
  unmatched_bank: number;
  unmatched_accounting: number;
  reconciliation_rate: number;
  amount_matched: number;
  amount_unmatched: number;
}

export interface ReconciliationRule {
  id?: string;
  company_id: string;
  name: string;
  description: string;
  active: boolean;
  priority: number;
  conditions: ReconciliationCondition[];
  action: ReconciliationAction;
  created_at?: string;
  updated_at?: string;
}

export interface ReconciliationCondition {
  field: 'amount' | 'description' | 'reference' | 'date' | 'account';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'range';
  value: string | number;
  tolerance?: number; // Pour les montants
}

export interface ReconciliationAction {
  type: 'auto_match' | 'suggest_match' | 'categorize' | 'create_entry';
  account_number?: string;
  category?: string;
  confidence_threshold?: number;
}

class BankReconciliationService {

  /**
   * Lance la réconciliation automatique pour une période donnée
   */
  async runAutoReconciliation(
    companyId: string, 
    accountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ReconciliationMatch[]> {
    try {
      // Récupérer les transactions bancaires non réconciliées
      const bankTransactions = await this.getUnreconciledBankTransactions(
        companyId, accountId, startDate, endDate
      );

      // Récupérer les écritures comptables non réconciliées
      const accountingEntries = await this.getUnreconciledAccountingEntries(
        companyId, startDate, endDate
      );

      // Récupérer les règles de réconciliation
      const rules = await this.getReconciliationRules(companyId);

      const matches: ReconciliationMatch[] = [];

      // Pour chaque transaction bancaire, chercher les correspondances
      for (const bankTx of bankTransactions) {
        const potentialMatches = await this.findPotentialMatches(
          bankTx, accountingEntries, rules
        );
        
        if (potentialMatches.length > 0) {
          matches.push(...potentialMatches);
        }
      }

      // Trier par score de confiance
      matches.sort((a, b) => b.confidence_score - a.confidence_score);

      // Auto-valider les correspondances avec un score élevé
      await this.autoValidateHighConfidenceMatches(matches);

      return matches;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur réconciliation automatique:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Trouve les correspondances potentielles pour une transaction bancaire
   */
  private async findPotentialMatches(
    bankTx: BankTransaction,
    accountingEntries: AccountingEntry[],
    rules: ReconciliationRule[]
  ): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];

    // 1. Correspondance exacte par montant et date
    const exactMatches = accountingEntries.filter(entry => 
      Math.abs(entry.amount - Math.abs(bankTx.amount)) < 0.01 &&
      this.isSameDate(entry.date, bankTx.transaction_date)
    );

    if (exactMatches.length > 0) {
      matches.push({
        bank_transaction: bankTx,
        accounting_entries: exactMatches,
        confidence_score: 0.95,
        match_type: 'exact',
        match_criteria: ['amount_exact', 'date_exact'],
        suggested: true
      });
    }

    // 2. Correspondance par référence
    if (bankTx.reference) {
      const referenceMatches = accountingEntries.filter(entry =>
        entry.reference && entry.reference === bankTx.reference
      );

      if (referenceMatches.length > 0) {
        matches.push({
          bank_transaction: bankTx,
          accounting_entries: referenceMatches,
          confidence_score: 0.9,
          match_type: 'exact',
          match_criteria: ['reference_exact'],
          suggested: true
        });
      }
    }

    // 3. Correspondance fuzzy par description
    const descriptionMatches = accountingEntries.filter(entry => {
      const similarity = this.calculateStringSimilarity(
        bankTx.description.toLowerCase(),
        entry.description.toLowerCase()
      );
      return similarity > 0.7;
    });

    if (descriptionMatches.length > 0) {
      matches.push({
        bank_transaction: bankTx,
        accounting_entries: descriptionMatches,
        confidence_score: 0.7,
        match_type: 'fuzzy',
        match_criteria: ['description_similar'],
        suggested: true
      });
    }

    // 4. Appliquer les règles personnalisées
    for (const rule of rules.filter(r => r.active)) {
      const ruleMatches = this.applyReconciliationRule(bankTx, accountingEntries, rule);
      if (ruleMatches.length > 0) {
        matches.push({
          bank_transaction: bankTx,
          accounting_entries: ruleMatches,
          confidence_score: 0.8,
          match_type: 'exact',
          match_criteria: [`rule_${rule.name}`],
          suggested: true
        });
      }
    }

    return matches;
  }

  /**
   * Applique une règle de réconciliation
   */
  private applyReconciliationRule(
    bankTx: BankTransaction,
    entries: AccountingEntry[],
    rule: ReconciliationRule
  ): AccountingEntry[] {
    return entries.filter(entry => {
      return rule.conditions.every(condition => {
        return this.evaluateCondition(bankTx, entry, condition);
      });
    });
  }

  /**
   * Évalue une condition de réconciliation
   */
  private evaluateCondition(
    bankTx: BankTransaction,
    entry: AccountingEntry,
    condition: ReconciliationCondition
  ): boolean {
    let bankValue: any;
    let entryValue: any;

    // Récupérer les valeurs à comparer
    switch (condition.field) {
      case 'amount':
        bankValue = Math.abs(bankTx.amount);
        entryValue = Math.abs(entry.amount);
        break;
      case 'description':
        bankValue = bankTx.description.toLowerCase();
        entryValue = entry.description.toLowerCase();
        break;
      case 'reference':
        bankValue = bankTx.reference || '';
        entryValue = entry.reference || '';
        break;
      case 'date':
        bankValue = bankTx.transaction_date;
        entryValue = entry.date;
        break;
      case 'account':
        bankValue = bankTx.bank_account_id;
        entryValue = entry.account_number;
        break;
      default:
        return false;
    }

    // Appliquer l'opérateur
    switch (condition.operator) {
      case 'equals':
        if (condition.field === 'amount') {
          const tolerance = condition.tolerance || 0.01;
          return Math.abs(bankValue - entryValue) <= tolerance + Number.EPSILON;
        }
        return bankValue === entryValue;
      
      case 'contains':
        return String(entryValue).includes(String(bankValue)) || 
               String(bankValue).includes(String(entryValue));
      
      case 'starts_with':
        return String(entryValue).startsWith(String(condition.value));
      
      case 'ends_with':
        return String(entryValue).endsWith(String(condition.value));
      
      case 'regex':
        try {
          const regex = new RegExp(String(condition.value), 'i');
          return regex.test(String(entryValue));
        } catch {
          return false;
        }
      
      case 'range':
        if (condition.field === 'amount') {
          const range = condition.tolerance || 0.05; // 5% par défaut
          const diff = Math.abs(bankValue - entryValue) / entryValue;
          return diff <= range;
        }
        return false;
      
      default:
        return false;
    }
  }

  /**
   * Valide automatiquement les correspondances avec un score élevé
   */
  private async autoValidateHighConfidenceMatches(matches: ReconciliationMatch[]): Promise<void> {
    const highConfidenceMatches = matches.filter(match => 
      match.confidence_score >= 0.9 && 
      match.accounting_entries.length === 1
    );

    for (const match of highConfidenceMatches) {
      await this.validateReconciliation(
        match.bank_transaction.id!,
        match.accounting_entries[0].id
      );
    }
  }

  /**
   * Valide manuellement une réconciliation
   */
  async validateReconciliation(
    bankTransactionId: string,
    accountingEntryId: string
  ): Promise<boolean> {
    try {
      // Marquer la transaction bancaire comme réconciliée
      const { error: bankError } = await supabase
        .from('bank_transactions')
        .update({ 
          reconciled: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', bankTransactionId);

      if (bankError) throw bankError;

      // Marquer l'écriture comptable comme réconciliée
      const { error: accountingError } = await supabase
        .from('accounting_entries')
        .update({ 
          reconciled: true,
          bank_transaction_id: bankTransactionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountingEntryId);

      if (accountingError) throw accountingError;

      // Enregistrer l'action de réconciliation
      await this.logReconciliationAction(bankTransactionId, accountingEntryId, 'validated');

      return true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur validation réconciliation:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Annule une réconciliation
   */
  async cancelReconciliation(bankTransactionId: string): Promise<boolean> {
    try {
      // Récupérer l'écriture comptable associée
      const { data: entry } = await supabase
        .from('accounting_entries')
        .select('id')
        .eq('bank_transaction_id', bankTransactionId)
        .single();

      // Démarquer la transaction bancaire
      await supabase
        .from('bank_transactions')
        .update({ reconciled: false })
        .eq('id', bankTransactionId);

      // Démarquer l'écriture comptable
      if (entry) {
        await supabase
          .from('accounting_entries')
          .update({ 
            reconciled: false,
            bank_transaction_id: null
          })
          .eq('id', entry.id);
      }

      await this.logReconciliationAction(bankTransactionId, entry?.id, 'cancelled');

      return true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur annulation réconciliation:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Génère un résumé de réconciliation
   */
  async getReconciliationSummary(
    companyId: string,
    accountId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ReconciliationSummary> {
    try {
      // Requête pour les transactions bancaires
      let bankQuery = supabase
        .from('bank_transactions')
        .select('id, amount, reconciled')
        .eq('company_id', companyId);

      if (accountId) bankQuery = bankQuery.eq('bank_account_id', accountId);
      if (startDate) bankQuery = bankQuery.gte('transaction_date', startDate);
      if (endDate) bankQuery = bankQuery.lte('transaction_date', endDate);

      const { data: bankTransactions } = await bankQuery;

      // Requête pour les écritures comptables
      let accountingQuery = supabase
        .from('accounting_entries')
        .select('id, amount, reconciled')
        .eq('company_id', companyId);

      if (startDate) accountingQuery = accountingQuery.gte('date', startDate);
      if (endDate) accountingQuery = accountingQuery.lte('date', endDate);

      const { data: accountingEntries } = await accountingQuery;

      // Calculs
      const totalBankTx = bankTransactions?.length || 0;
      const totalAccountingEntries = accountingEntries?.length || 0;
      const matchedTx = bankTransactions?.filter(tx => tx.reconciled).length || 0;
      const matchedAmount = bankTransactions
        ?.filter(tx => tx.reconciled)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;
      const unmatchedAmount = bankTransactions
        ?.filter(tx => !tx.reconciled)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;

      return {
        total_bank_transactions: totalBankTx,
        total_accounting_entries: totalAccountingEntries,
        matched_transactions: matchedTx,
        unmatched_bank: totalBankTx - matchedTx,
        unmatched_accounting: totalAccountingEntries - 
          (accountingEntries?.filter(entry => entry.reconciled).length || 0),
        reconciliation_rate: totalBankTx > 0 ? (matchedTx / totalBankTx) * 100 : 0,
        amount_matched: matchedAmount,
        amount_unmatched: unmatchedAmount
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur calcul résumé réconciliation:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Utilitaires privés
   */
  private async getUnreconciledBankTransactions(
    companyId: string,
    accountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<BankTransaction[]> {
    let query = supabase
      .from('bank_transactions')
      .select('*')
      .eq('company_id', companyId)
      .eq('bank_account_id', accountId)
      .eq('reconciled', false);

    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  private async getUnreconciledAccountingEntries(
    companyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AccountingEntry[]> {
    let query = supabase
      .from('accounting_entries')
      .select('*')
      .eq('company_id', companyId)
      .eq('reconciled', false);

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  private async getReconciliationRules(companyId: string): Promise<ReconciliationRule[]> {
    const { data, error } = await supabase
      .from('reconciliation_rules')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private isSameDate(date1: string, date2: string): boolean {
    return date1.split('T')[0] === date2.split('T')[0];
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private async logReconciliationAction(
    bankTransactionId: string,
    accountingEntryId: string | undefined,
    action: string
  ): Promise<void> {
    try {
      await supabase
        .from('reconciliation_log')
        .insert({
          bank_transaction_id: bankTransactionId,
          accounting_entry_id: accountingEntryId,
          action,
          timestamp: new Date().toISOString(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn('Erreur logging réconciliation:', error);
    }
  }

  /**
   * CRUD pour les règles de réconciliation
   */
  async createReconciliationRule(rule: Omit<ReconciliationRule, 'id' | 'created_at' | 'updated_at'>): Promise<ReconciliationRule | null> {
    try {
      const { data, error } = await supabase
        .from('reconciliation_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur création règle réconciliation:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async updateReconciliationRule(id: string, updates: Partial<ReconciliationRule>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reconciliation_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      return !error;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur mise à jour règle réconciliation:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  async deleteReconciliationRule(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reconciliation_rules')
        .delete()
        .eq('id', id);

      return !error;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Erreur suppression règle réconciliation:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
}

export const bankReconciliationService = new BankReconciliationService();
export default bankReconciliationService;


