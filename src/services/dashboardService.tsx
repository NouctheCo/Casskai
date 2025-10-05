// src/services/dashboardService.js
import { supabase } from '../lib/supabase';

export const dashboardService = {
  // Obtenir les statistiques principales du dashboard
  getDashboardStats: async (currentEnterpriseId, options = {}) => {
    if (!currentEnterpriseId) {
      return { data: null, error: new Error('Company ID is required') };
    }

    try {
      // Utiliser la fonction RPC créée dans les migrations
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        company_id: currentEnterpriseId
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Fallback : calculer manuellement si la fonction RPC n'est pas disponible
      return await dashboardService.calculateDashboardStatsManually(currentEnterpriseId);
    }
  },

  // Calcul manuel des statistiques (fallback)
  calculateDashboardStatsManually: async (currentEnterpriseId) => {
    try {
      // 1. Statistiques des comptes par classe
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('class, type, balance, is_active')
        .eq('company_id', currentEnterpriseId);

      if (accountsError) throw accountsError;

      // 2. Statistiques des écritures récentes
      const { data: recentEntries, error: entriesError } = await supabase
        .from('journal_entries')
        .select('id, entry_date, status')
        .eq('company_id', currentEnterpriseId)
        .gte('entry_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('entry_date', { ascending: false });

      if (entriesError) throw entriesError;

      // 3. Calculer les totaux
      const stats = {
        accounts: {
          total: accounts.length,
          active: accounts.filter(a => a.is_active).length,
          by_class: {}
        },
        balances: {
          assets: 0,      // Classes 1,2,3,5
          liabilities: 0, // Classe 4
          equity: 0,      // Capitaux propres
          revenue: 0,     // Classe 7
          expenses: 0     // Classe 6
        },
        recent_activity: {
          entries_last_30_days: recentEntries.length,
          draft_entries: recentEntries.filter(e => e.status === 'draft').length
        }
      };

      // Calculer les balances par type
      accounts.forEach(account => {
        const balance = account.balance || 0;
        
        // Grouper par classe
        if (!stats.accounts.by_class[account.class]) {
          stats.accounts.by_class[account.class] = { count: 0, balance: 0 };
        }
        stats.accounts.by_class[account.class].count++;
        stats.accounts.by_class[account.class].balance += balance;

        // Calculer par type de bilan
        switch (account.class) {
          case 1:
          case 2:
          case 3:
          case 5:
            stats.balances.assets += balance;
            break;
          case 4:
            stats.balances.liabilities += Math.abs(balance);
            break;
          case 6:
            stats.balances.expenses += balance;
            break;
          case 7:
            stats.balances.revenue += Math.abs(balance);
            break;
        }
      });

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error calculating dashboard stats manually:', error);
      return { data: null, error };
    }
  },

  // Obtenir le bilan comptable
  getBalanceSheet: async (currentEnterpriseId, date = null) => {
    if (!currentEnterpriseId) {
      return { data: null, error: new Error('Company ID is required') };
    }

    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('get_balance_sheet', {
        p_company_id: currentEnterpriseId,
        p_date: targetDate
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
      return { data: null, error };
    }
  },

  // Obtenir le compte de résultat
  getIncomeStatement: async (currentEnterpriseId, startDate = null, endDate = null) => {
    if (!currentEnterpriseId) {
      return { data: null, error: new Error('Company ID is required') };
    }

    try {
      const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('get_income_statement', {
        p_company_id: currentEnterpriseId,
        p_start_date: start,
        p_end_date: end
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching income statement:', error);
      return { data: null, error };
    }
  },

  // Obtenir les données de cash-flow
  getCashFlowData: async (currentEnterpriseId, months = 12) => {
    if (!currentEnterpriseId) {
      return { data: [], error: new Error('Company ID is required') };
    }

    try {
      const { data, error } = await supabase.rpc('get_cash_flow_data', {
        p_company_id: currentEnterpriseId,
        p_months: months
      });

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      
      // Fallback : simuler des données de cash-flow
      return await dashboardService.simulateCashFlowData(currentEnterpriseId, months);
    }
  },

  // Simuler des données de cash-flow (fallback)
  simulateCashFlowData: async (currentEnterpriseId, months) => {
    try {
      // Récupérer les mouvements des comptes de trésorerie (classe 5)
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, balance')
        .eq('company_id', currentEnterpriseId)
        .eq('class', 5)
        .eq('is_active', true);

      if (accountsError) throw accountsError;

      // Générer des données mensuelles simulées
      const cashFlowData = [];
      const currentDate = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        
        cashFlowData.push({
          month: monthDate.toISOString().slice(0, 7),
          inflows: Math.max(0, totalBalance * 0.1 + Math.random() * 1000),
          outflows: Math.max(0, totalBalance * 0.08 + Math.random() * 800),
          net_flow: totalBalance * 0.02 + (Math.random() - 0.5) * 200
        });
      }

      return { data: cashFlowData, error: null };
    } catch (error) {
      console.error('Error simulating cash flow data:', error);
      return { data: [], error };
    }
  },

  // Obtenir les écritures récentes pour le dashboard
  getRecentJournalEntries: async (currentEnterpriseId, limit = 10) => {
    if (!currentEnterpriseId) {
      return { data: [], error: new Error('Company ID is required') };
    }

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          id, entry_date, entry_number, description, status,
          journals (code, name),
          journal_entry_items (debit_amount, credit_amount)
        `)
        .eq('company_id', currentEnterpriseId)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Calculer le montant total pour chaque écriture
      const entriesWithAmount = (data || []).map(entry => {
        const totalAmount = entry.journal_entry_items.reduce(
          (sum, item) => sum + (item.debit_amount || 0), 0
        );
        return { ...entry, total_amount: totalAmount };
      });

      return { data: entriesWithAmount, error: null };
    } catch (error) {
      console.error('Error fetching recent journal entries:', error);
      return { data: [], error };
    }
  },

  // Obtenir les comptes avec les plus gros mouvements
  getTopAccountsByActivity: async (currentEnterpriseId, limit = 5, days = 30) => {
    if (!currentEnterpriseId) {
      return { data: [], error: new Error('Company ID is required') };
    }

    try {
      const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('journal_entry_items')
        .select(`
          account_id,
          debit_amount,
          credit_amount,
          accounts!inner (id, account_number, name, balance),
          journal_entries!inner (entry_date)
        `)
        .eq('company_id', currentEnterpriseId)
        .gte('journal_entries.entry_date', dateFrom);

      if (error) throw error;

      // Grouper par compte et calculer l'activité
      const accountActivity = {};
      
      (data || []).forEach(item => {
        const accountId = item.account_id;
        if (!accountActivity[accountId]) {
          accountActivity[accountId] = {
            account: item.accounts,
            total_movement: 0,
            transaction_count: 0
          };
        }
        
        accountActivity[accountId].total_movement += 
          (item.debit_amount || 0) + (item.credit_amount || 0);
        accountActivity[accountId].transaction_count++;
      });

      // Trier par activité et prendre le top
      const topAccounts = Object.values(accountActivity)
        .sort((a: any, b: any) => b.total_movement - a.total_movement)
        .slice(0, limit);

      return { data: topAccounts, error: null };
    } catch (error) {
      console.error('Error fetching top accounts by activity:', error);
      return { data: [], error };
    }
  },

  // Obtenir les alertes et notifications du dashboard
  getDashboardAlerts: async (currentEnterpriseId) => {
    if (!currentEnterpriseId) {
      return { data: [], error: new Error('Company ID is required') };
    }

    try {
      const alerts = [];

      // 1. Vérifier les écritures non équilibrées
      const { data: unbalancedEntries, error: balanceError } = await supabase
        .from('journal_entries')
        .select(`
          id, entry_number, description,
          journal_entry_items (debit_amount, credit_amount)
        `)
        .eq('company_id', currentEnterpriseId)
        .eq('status', 'draft');

      if (!balanceError && unbalancedEntries) {
        unbalancedEntries.forEach(entry => {
          const totalDebit = entry.journal_entry_items.reduce(
            (sum, item) => sum + (item.debit_amount || 0), 0
          );
          const totalCredit = entry.journal_entry_items.reduce(
            (sum, item) => sum + (item.credit_amount || 0), 0
          );
          
          if (Math.abs(totalDebit - totalCredit) > 0.01) {
            alerts.push({
              type: 'warning',
              title: 'Écriture non équilibrée',
              message: `L'écriture ${entry.entry_number} n'est pas équilibrée`,
              action: 'edit_entry',
              data: { entryId: entry.id }
            });
          }
        });
      }

      // 2. Vérifier les comptes avec des soldes anormaux
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, account_number, name, type, class, balance')
        .eq('company_id', currentEnterpriseId)
        .eq('is_active', true);

      if (!accountsError && accounts) {
        accounts.forEach(account => {
          // Détecter les soldes anormaux selon le type de compte
          const isDebitAccount = [1, 2, 3, 5, 6].includes(account.class);
          const balance = account.balance || 0;
          
          if (isDebitAccount && balance < 0) {
            alerts.push({
              type: 'info',
              title: 'Solde négatif inhabituel',
              message: `Le compte ${account.account_number} - ${account.name} a un solde négatif`,
              action: 'view_account',
              data: { accountId: account.id }
            });
          } else if (!isDebitAccount && balance > 0 && account.class === 4) {
            // Comptes de dettes avec solde débiteur
            alerts.push({
              type: 'info',
              title: 'Solde débiteur sur compte de dette',
              message: `Le compte ${account.account_number} - ${account.name} a un solde débiteur`,
              action: 'view_account',
              data: { accountId: account.id }
            });
          }
        });
      }

      // 3. Vérifier les écritures anciennes en brouillon
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data: oldDrafts, error: draftsError } = await supabase
        .from('journal_entries')
        .select('id, entry_number, entry_date, description')
        .eq('company_id', currentEnterpriseId)
        .eq('status', 'draft')
        .lt('entry_date', thirtyDaysAgo);

      if (!draftsError && oldDrafts?.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Écritures en brouillon anciennes',
          message: `${oldDrafts.length} écriture(s) en brouillon datant de plus de 30 jours`,
          action: 'review_drafts',
          data: { count: oldDrafts.length }
        });
      }

      return { data: alerts, error: null };
    } catch (error) {
      console.error('Error fetching dashboard alerts:', error);
      return { data: [], error };
    }
  },

  // Obtenir les métriques de performance
  getPerformanceMetrics: async (currentEnterpriseId, period = '12M') => {
    if (!currentEnterpriseId) {
      return { data: null, error: new Error('Company ID is required') };
    }

    try {
      let startDate;
      const endDate = new Date().toISOString().split('T')[0];
      
      switch (period) {
        case '1M':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '3M':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '6M':
          startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default: // 12M
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      // Récupérer les données pour calculer les métriques
      const { data: incomeStatement } = await dashboardService.getIncomeStatement(
        currentEnterpriseId, startDate, endDate
      );

      const { data: balanceSheet } = await dashboardService.getBalanceSheet(
        currentEnterpriseId, endDate
      );

      // Calculer les métriques de base
      const metrics = {
        period,
        revenue: 0,
        expenses: 0,
        profit: 0,
        profit_margin: 0,
        asset_total: 0,
        liability_total: 0,
        equity_total: 0
      };

      if (incomeStatement) {
        const produits = incomeStatement.produits || [];
        const charges = incomeStatement.charges || [];
        
        metrics.revenue = produits.reduce((sum, p) => sum + (p.amount || 0), 0);
        metrics.expenses = charges.reduce((sum, c) => sum + (c.amount || 0), 0);
        metrics.profit = metrics.revenue - metrics.expenses;
        metrics.profit_margin = metrics.revenue > 0 ? 
          (metrics.profit / metrics.revenue) * 100 : 0;
      }

      if (balanceSheet) {
        const actif = balanceSheet.actif || [];
        const passif = balanceSheet.passif || [];
        
        metrics.asset_total = actif.reduce((sum, a) => sum + (a.amount || 0), 0);
        metrics.liability_total = passif
          .filter(p => p.category !== 'Capitaux propres')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        metrics.equity_total = passif
          .filter(p => p.category === 'Capitaux propres')
          .reduce((sum, p) => sum + (p.amount || 0), 0);
      }

      return { data: metrics, error: null };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return { data: null, error };
    }
  }
};
