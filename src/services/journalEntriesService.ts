// src/services/journalEntriesService.ts
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type JournalEntry = {
  id: string;
  company_id: string;
  entry_number: string;
  date: string;
  description: string;
  reference?: string;
  journal_code: string;
  total_amount: number;
  currency: string;
  status: 'draft' | 'validated' | 'pending';
  created_by: string;
  created_at: string;
  updated_at: string;
  lines?: JournalEntryLine[];
};

type JournalEntryLine = {
  id: string;
  company_id: string;
  journal_entry_id: string;
  account_id: string;
  description?: string;
  debit: number;
  credit: number;
  currency: string;
  line_order: number;
  created_at: string;
  account?: {
    account_number: string;
    name: string;
  };
};

type JournalEntryInsert = {
  company_id: string;
  entry_number: string;
  date: string;
  description: string;
  reference?: string;
  journal_code: string;
  status: 'draft' | 'validated' | 'pending';
  lines: {
    account_id: string;
    description?: string;
    debit: number;
    credit: number;
    line_order: number;
  }[];
};

export class JournalEntriesService {
  private static instance: JournalEntriesService;

  static getInstance(): JournalEntriesService {
    if (!JournalEntriesService.instance) {
      JournalEntriesService.instance = new JournalEntriesService();
    }
    return JournalEntriesService.instance;
  }

  // Générer un numéro d'écriture automatique
  async generateEntryNumber(companyId: string, journalCode: string): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const { data, error } = await supabase
        .from('journal_entries')
        .select('entry_number')
        .eq('company_id', companyId)
        .like('entry_number', `${journalCode}${year}%`)
        .order('entry_number', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = data[0].entry_number;
        const match = lastNumber.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      return `${journalCode}${year}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Erreur génération numéro écriture:', error);
      return `${journalCode}${Date.now()}`;
    }
  }

  // Récupérer les écritures d'une entreprise
  async getJournalEntries(companyId: string, filters?: {
    status?: string;
    journalCode?: string;
    accountCode?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<JournalEntry[]> {
    try {
      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          lines:journal_entry_lines(
            *,
            account:accounts(account_number, name)
          )
        `)
        .eq('company_id', companyId)
        .order('date', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.journalCode) {
        query = query.ilike('journal_code', `%${filters.journalCode}%`);
      }

      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrer par code de compte si nécessaire
      let results = data || [];
      if (filters?.accountCode) {
        results = results.filter(entry => 
          entry.lines?.some(line => 
            line.account?.account_number?.startsWith(filters.accountCode!)
          )
        );
      }

      return results;
    } catch (error) {
      console.error('Erreur récupération écritures:', error);
      return [];
    }
  }

  // Créer une nouvelle écriture
  async createJournalEntry(entryData: JournalEntryInsert): Promise<{ 
    success: boolean; 
    data?: JournalEntry; 
    error?: string 
  }> {
    try {
      // Vérifier que l'écriture est équilibrée
      const totalDebit = entryData.lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = entryData.lines.reduce((sum, line) => sum + line.credit, 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return { success: false, error: 'L\'écriture n\'est pas équilibrée' };
      }

      // Générer un numéro d'écriture si pas fourni
      let entryNumber = entryData.entry_number;
      if (!entryNumber) {
        entryNumber = await this.generateEntryNumber(entryData.company_id, entryData.journal_code);
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return { success: false, error: 'Utilisateur non authentifié' };
      }

      // Créer l'écriture principale
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert([{
          ...entryData,
          entry_number: entryNumber,
          total_amount: totalDebit,
          currency: 'EUR',
          created_by: userData.user.id
        }])
        .select()
        .single();

      if (entryError) throw entryError;

      // Créer les lignes d'écriture
      const lines = entryData.lines.map(line => ({
        ...line,
        company_id: entryData.company_id,
        journal_entry_id: entry.id,
        currency: 'EUR'
      }));

      const { data: linesData, error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines)
        .select(`
          *,
          account:accounts(account_number, name)
        `);

      if (linesError) throw linesError;

      return { 
        success: true, 
        data: { 
          ...entry, 
          lines: linesData 
        } 
      };
    } catch (error) {
      console.error('Erreur création écriture:', error);
      return { success: false, error: error.message };
    }
  }

  // Mettre à jour le statut d'une écriture
  async updateEntryStatus(entryId: string, status: 'draft' | 'validated' | 'pending'): Promise<{ 
    success: boolean; 
    data?: JournalEntry; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .update({ status })
        .eq('id', entryId)
        .select(`
          *,
          lines:journal_entry_lines(
            *,
            account:accounts(account_number, name)
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Erreur mise à jour statut écriture:', error);
      return { success: false, error: error.message };
    }
  }

  // Supprimer une écriture (seulement si en brouillon)
  async deleteJournalEntry(entryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier que l'écriture est en brouillon
      const { data: entry } = await supabase
        .from('journal_entries')
        .select('status')
        .eq('id', entryId)
        .single();

      if (!entry) {
        return { success: false, error: 'Écriture non trouvée' };
      }

      if (entry.status !== 'draft') {
        return { success: false, error: 'Seules les écritures en brouillon peuvent être supprimées' };
      }

      // Supprimer les lignes d'abord (cascade devrait s'en charger normalement)
      await supabase
        .from('journal_entry_lines')
        .delete()
        .eq('journal_entry_id', entryId);

      // Supprimer l'écriture
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Erreur suppression écriture:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtenir les statistiques des écritures
  async getEntriesStats(companyId: string): Promise<{
    totalEntries: number;
    totalDebit: number;
    totalCredit: number;
    validatedEntries: number;
    draftEntries: number;
    pendingEntries: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('status, total_amount')
        .eq('company_id', companyId);

      if (error) throw error;

      const stats = {
        totalEntries: data?.length || 0,
        totalDebit: 0,
        totalCredit: 0,
        validatedEntries: 0,
        draftEntries: 0,
        pendingEntries: 0
      };

      data?.forEach(entry => {
        stats.totalDebit += entry.total_amount || 0;
        stats.totalCredit += entry.total_amount || 0;
        
        switch (entry.status) {
          case 'validated':
            stats.validatedEntries++;
            break;
          case 'draft':
            stats.draftEntries++;
            break;
          case 'pending':
            stats.pendingEntries++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Erreur stats écritures:', error);
      return {
        totalEntries: 0,
        totalDebit: 0,
        totalCredit: 0,
        validatedEntries: 0,
        draftEntries: 0,
        pendingEntries: 0
      };
    }
  }

  // Obtenir les comptes pour les écritures
  async getAccountsForEntries(companyId: string): Promise<{
    id: string;
    account_number: string;
    name: string;
    type: string;
    is_active: boolean;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, account_number, name, type, is_active')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('account_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération comptes:', error);
      return [];
    }
  }
}

export const journalEntriesService = JournalEntriesService.getInstance();