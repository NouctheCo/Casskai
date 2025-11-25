#!/usr/bin/env python3
"""
Script to remove fallback mock data from accountingDataService.ts
Replaces generateMockTransactions with real Supabase query
"""

import re

# Read the file
with open('src/services/accountingDataService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace generateMockTransactions call with real Supabase query
old_code = r'''// Simulation de données pour le développement
      return this\.generateMockTransactions\(companyId, startDate, endDate\);'''

new_code = '''// Query real data from Supabase
      const { data: transactions, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          entries:journal_entry_lines(*)
        `)
        .eq('company_id', companyId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .eq('status', 'validated')
        .order('entry_date', { ascending: true });

      if (error) throw error;

      return (transactions || []).map(t => ({
        id: t.id,
        company_id: t.company_id,
        transaction_date: t.entry_date,
        reference: t.reference_number || '',
        description: t.description || '',
        journal_code: t.journal_code || 'DIV',
        total_debit: Number(t.total_debit) || 0,
        total_credit: Number(t.total_credit) || 0,
        validated: t.status === 'validated',
        created_at: t.created_at,
        updated_at: t.updated_at,
        entries: ((t.entries as any) || []).map((e: any) => ({
          id: e.id,
          transaction_id: t.id,
          account_code: e.account_code,
          account_name: e.account_name || '',
          debit_amount: Number(e.debit) || 0,
          credit_amount: Number(e.credit) || 0,
          description: e.description || ''
        }))
      }));'''

content = re.sub(old_code, new_code, content)

# 2. Replace getDefaultChartOfAccounts calls with real Supabase query
old_chart = r'''// TODO: Remplacer par l'appel réel à Supabase
      return this\.getDefaultChartOfAccounts\(\);
    \} catch \(error\) \{
      console\.error\('Erreur lors de la récupération du plan comptable:', error instanceof Error \? error\.message : String\(error\)\);
      return this\.getDefaultChartOfAccounts\(\);'''

new_chart = '''const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('account_code', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération du plan comptable:', error instanceof Error ? error.message : String(error));
      return [];'''

content = re.sub(old_chart, new_chart, content, flags=re.DOTALL)

# 3. Remove generateMockTransactions method entirely
mock_method_pattern = r'private generateMockTransactions\(.*?\n  \}'

content = re.sub(mock_method_pattern, '', content, flags=re.DOTALL)

# 4. Remove getDefaultChartOfAccounts method
default_chart_pattern = r'private getDefaultChartOfAccounts\(\).*?\n  \}'

content = re.sub(default_chart_pattern, '', content, flags=re.DOTALL)

# Write back
with open('src/services/accountingDataService.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("OK Successfully cleaned accountingDataService.ts")
print("OK Replaced generateMockTransactions with real Supabase query")
print("OK Replaced getDefaultChartOfAccounts with real Supabase query")
print("OK Removed mock methods (approx 100+ lines)")
