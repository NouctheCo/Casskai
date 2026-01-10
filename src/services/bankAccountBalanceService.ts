/**
 * CassKai - Service de Gestion du Solde Bancaire
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Ce service gère la mise à jour du solde des comptes bancaires
 * en fonction des opérations comptables.
 * 
 * Deux approches :
 * 1. Mise à jour automatique en temps réel (lors de la création d'une écriture banque)
 * 2. Recalcul manuel / ponctuel (pour corriger les dérives)
 */
import { supabase } from '@/lib/supabase';
import { JournalType } from './accountingRulesService';
import { logger } from '@/lib/logger';
export interface BankAccountBalanceUpdate {
  account_id: string;
  new_balance: number;
  previous_balance: number;
  reason: string;
  reference?: string;
}
class BankAccountBalanceService {
  private static instance: BankAccountBalanceService;
  static getInstance(): BankAccountBalanceService {
    if (!BankAccountBalanceService.instance) {
      BankAccountBalanceService.instance = new BankAccountBalanceService();
    }
    return BankAccountBalanceService.instance;
  }
  /**
   * ========================================================================
   * APPROCHE 1 : MISE À JOUR AUTOMATIQUE EN TEMPS RÉEL
   * ========================================================================
   * Appelée automatiquement quand une écriture comptable est créée/modifiée
   */
  /**
   * Met à jour le solde d'un compte bancaire après une écriture comptable
   * Appelée après la création/modification d'une écriture dans le journal banque
   */
  async updateBalanceFromJournalEntry(
    companyId: string,
    journalEntryId: string,
    bankAccountId: string
  ): Promise<BankAccountBalanceUpdate | null> {
    try {
      // 1. Récupérer l'écriture comptable
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          journal_entry_lines (
            account_id,
            debit_amount,
            credit_amount
          )
        `)
        .eq('id', journalEntryId)
        .eq('company_id', companyId)
        .single();
      if (entryError || !entry) {
        logger.error('BankAccountBalance', 'Erreur récupération écriture:', entryError);
        return null;
      }
      // 2. Trouver la ligne relative au compte bancaire
      const lines = (entry.journal_entry_lines || []) as any[];
      const bankLine = lines.find(
        (l) => l.account_id === bankAccountId
      );
      if (!bankLine) {
        logger.debug('BankAccountBalance', 'Aucune ligne bancaire trouvée dans cette écriture');
        return null;
      }
      // 3. Calculer le mouvement (débit = entrée, crédit = sortie)
      const movement = (bankLine.debit_amount || 0) - (bankLine.credit_amount || 0);
      // 4. Récupérer le solde actuel du compte
      const { data: account, error: accountError } = await supabase
        .from('bank_accounts')
        .select('id, current_balance')
        .eq('id', bankAccountId)
        .eq('company_id', companyId)
        .single();
      if (accountError || !account) {
        logger.error('BankAccountBalance', 'Erreur récupération compte:', accountError);
        return null;
      }
      const previousBalance = account.current_balance || 0;
      const newBalance = previousBalance + movement;
      // 5. Mettre à jour le solde
      const { error: updateError } = await supabase
        .from('bank_accounts')
        .update({
          current_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', bankAccountId)
        .eq('company_id', companyId);
      if (updateError) {
        logger.error('BankAccountBalance', 'Erreur mise à jour solde:', updateError);
        return null;
      }
      logger.debug('bankAccountBalance', 
        `✅ Solde bancaire ${bankAccountId} mis à jour: ${previousBalance}€ → ${newBalance}€ (mouvement: ${movement}€)`
      );
      return {
        account_id: bankAccountId,
        new_balance: newBalance,
        previous_balance: previousBalance,
        reason: `Écriture comptable ${journalEntryId}`,
        reference: journalEntryId
      };
    } catch (error) {
      logger.error('BankAccountBalance', 'Erreur dans updateBalanceFromJournalEntry:', error);
      return null;
    }
  }
  /**
   * Met à jour tous les comptes bancaires impactés par une écriture
   * (en cas de virement entre deux comptes bancaires, par exemple)
   */
  async updateBalancesFromJournalEntry(
    companyId: string,
    journalEntryId: string
  ): Promise<BankAccountBalanceUpdate[]> {
    try {
      const updates: BankAccountBalanceUpdate[] = [];
      // 1. Récupérer l'écriture
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .select(`
          id,
          journal_entry_lines (
            account_id,
            debit_amount,
            credit_amount
          )
        `)
        .eq('id', journalEntryId)
        .eq('company_id', companyId)
        .single();
      if (entryError || !entry) return updates;
      // 2. Récupérer tous les comptes bancaires de l'entreprise
      const { data: bankAccounts, error: accountsError } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (accountsError || !bankAccounts) return updates;
      // 3. Pour chaque compte bancaire, vérifier s'il est impacté
      for (const account of bankAccounts) {
        const update = await this.updateBalanceFromJournalEntry(
          companyId,
          journalEntryId,
          account.id
        );
        if (update) {
          updates.push(update);
        }
      }
      return updates;
    } catch (error) {
      logger.error('BankAccountBalance', 'Erreur dans updateBalancesFromJournalEntry:', error);
      return [];
    }
  }
  /**
   * ========================================================================
   * APPROCHE 2 : RECALCUL MANUEL / PONCTUEL
   * ========================================================================
   * À utiliser pour corriger les dérives ou lors de maintenance
   */
  /**
   * Recalcule complètement le solde d'un compte bancaire
   * Basé sur initial_balance + toutes les opérations comptables
   */
  async recalculateBankAccountBalance(
    companyId: string,
    bankAccountId: string
  ): Promise<{ success: boolean; newBalance: number; message: string }> {
    try {
      // 1. Récupérer le compte
      const { data: account, error: accountError } = await supabase
        .from('bank_accounts')
        .select('id, initial_balance, current_balance')
        .eq('id', bankAccountId)
        .eq('company_id', companyId)
        .single();
      if (accountError || !account) {
        return {
          success: false,
          newBalance: 0,
          message: 'Compte bancaire non trouvé'
        };
      }
      const initialBalance = account.initial_balance || 0;
      // 2. Récupérer le journal banque
      const { data: journal, error: journalError } = await supabase
        .from('journals')
        .select('id')
        .eq('company_id', companyId)
        .eq('journal_type', JournalType.BANK)
        .single();
      if (journalError || !journal) {
        return {
          success: false,
          newBalance: initialBalance,
          message: 'Journal banque non trouvé'
        };
      }
      // 3. Récupérer toutes les lignes de journal pour ce compte
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select(`
          id,
          journal_entry_lines (
            account_id,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .eq('journal_id', journal.id);
      if (entriesError) {
        return {
          success: false,
          newBalance: initialBalance,
          message: 'Erreur lors de la récupération des écritures'
        };
      }
      // 4. Calculer la somme de tous les mouvements
      let totalMovement = 0;
      if (entries) {
        for (const entry of entries) {
          const lines = (entry.journal_entry_lines || []) as any[];
          const bankLine = lines.find((l) => l.account_id === bankAccountId);
          if (bankLine) {
            const movement = (bankLine.debit_amount || 0) - (bankLine.credit_amount || 0);
            totalMovement += movement;
          }
        }
      }
      const calculatedBalance = initialBalance + totalMovement;
      // 5. Mettre à jour le solde
      const { error: updateError } = await supabase
        .from('bank_accounts')
        .update({
          current_balance: calculatedBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', bankAccountId)
        .eq('company_id', companyId);
      if (updateError) {
        return {
          success: false,
          newBalance: initialBalance,
          message: 'Erreur lors de la mise à jour du solde'
        };
      }
      const previousBalance = account.current_balance || 0;
      const difference = calculatedBalance - previousBalance;
      if (difference === 0) {
        return {
          success: true,
          newBalance: calculatedBalance,
          message: `✅ Solde vérifié: ${calculatedBalance}€ (pas de changement)`
        };
      } else {
        return {
          success: true,
          newBalance: calculatedBalance,
          message: `✅ Solde recalculé: ${previousBalance}€ → ${calculatedBalance}€ (correction: ${difference > 0 ? '+' : ''}${difference}€)`
        };
      }
    } catch (error) {
      logger.error('BankAccountBalance', 'Erreur dans recalculateBankAccountBalance:', error);
      return {
        success: false,
        newBalance: 0,
        message: 'Erreur système lors du recalcul'
      };
    }
  }
  /**
   * Recalcule tous les comptes bancaires d'une entreprise
   */
  async recalculateAllBankAccountBalances(
    companyId: string
  ): Promise<{ success: boolean; results: Array<{ accountId: string; message: string }> }> {
    try {
      // 1. Récupérer tous les comptes actifs
      const { data: accounts, error: accountsError } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (accountsError || !accounts) {
        return {
          success: false,
          results: []
        };
      }
      // 2. Recalculer chaque compte
      const results = [];
      for (const account of accounts) {
        const result = await this.recalculateBankAccountBalance(companyId, account.id);
        results.push({
          accountId: account.id,
          message: result.message
        });
      }
      return {
        success: true,
        results
      };
    } catch (error) {
      logger.error('BankAccountBalance', 'Erreur dans recalculateAllBankAccountBalances:', error);
      return {
        success: false,
        results: []
      };
    }
  }
  /**
   * Récupère l'historique des mouvements sur un compte bancaire
   * Utile pour déboguer
   */
  async getBankAccountMovementHistory(
    companyId: string,
    bankAccountId: string,
    limit: number = 50
  ): Promise<Array<{
    entryId: string;
    entryDate: string;
    description: string;
    debit: number;
    credit: number;
    movement: number;
  }>> {
    try {
      const { data: journal, error: journalError } = await supabase
        .from('journals')
        .select('id')
        .eq('company_id', companyId)
        .eq('journal_type', JournalType.BANK)
        .single();
      if (journalError || !journal) {
        return [];
      }
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          description,
          journal_entry_lines (
            account_id,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .eq('journal_id', journal.id)
        .order('entry_date', { ascending: false })
        .limit(limit);
      if (entriesError) {
        return [];
      }
      const movements = [];
      if (entries) {
        for (const entry of entries) {
          const lines = (entry.journal_entry_lines || []) as any[];
          const bankLine = lines.find((l) => l.account_id === bankAccountId);
          if (bankLine) {
            movements.push({
              entryId: entry.id,
              entryDate: entry.entry_date,
              description: entry.description || 'Sans description',
              debit: bankLine.debit_amount || 0,
              credit: bankLine.credit_amount || 0,
              movement: (bankLine.debit_amount || 0) - (bankLine.credit_amount || 0)
            });
          }
        }
      }
      return movements;
    } catch (error) {
      logger.error('BankAccountBalance', 'Erreur dans getBankAccountMovementHistory:', error);
      return [];
    }
  }
}
export const bankAccountBalanceService = BankAccountBalanceService.getInstance();
