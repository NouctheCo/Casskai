// @ts-nocheck
// Service for auto-creating standard accounts from PCG (Plan Comptable Général)
import { supabase } from '@/lib/supabase';
import { PCG_ACCOUNTS, PCG_CLASSES } from '@/data/pcg';

export interface AccountCreationResult {
  success: boolean;
  accountsCreated: number;
  accountsSkipped: number;
  error?: string;
}

export class AccountsAutoCreationService {
  private static instance: AccountsAutoCreationService;

  static getInstance(): AccountsAutoCreationService {
    if (!AccountsAutoCreationService.instance) {
      AccountsAutoCreationService.instance = new AccountsAutoCreationService();
    }
    return AccountsAutoCreationService.instance;
  }

  /**
   * Create essential accounts from PCG standard
   * This includes the most commonly used accounts for businesses
   */
  async createEssentialAccounts(companyId: string): Promise<AccountCreationResult> {
    try {
      // Check if accounts already exist
      const { count, error: countError } = await supabase
        .from('accounts')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (countError) throw countError;

      if (count && count > 0) {
        return {
          success: false,
          accountsCreated: 0,
          accountsSkipped: count,
          error: 'Accounts already exist for this company'
        };
      }

      // Essential accounts list - most commonly used accounts
      const essentialAccountCodes = [
        // Class 1 - Equity
        '101000', '106000', '110000', '120000', '129000',
        // Class 2 - Fixed Assets
        '211000', '215000', '218000', '281100', '281500',
        // Class 3 - Inventory
        '311000', '371000', '391000',
        // Class 4 - Third Parties
        '401000', '404000', '408000', '411000', '416000', '421000', '431000', '437000',
        '441000', '442000', '443000', '444000', '445000', '445660', '445710',
        // Class 5 - Financial Accounts
        '512000', '530000', '540000',
        // Class 6 - Expenses
        '601000', '602000', '606000', '611000', '613000', '615000', '616000',
        '621000', '622000', '623000', '625000', '626000', '627000', '628000',
        '631000', '633000', '641000', '645000', '661000', '671000', '681000',
        // Class 7 - Revenue
        '701000', '706000', '707000', '708000', '761000', '771000', '781000'
      ];

      const accountsToCreate = PCG_ACCOUNTS
        .filter(account => essentialAccountCodes.includes(account.code))
        .map(account => {
          // Determine budget category based on account type and code
          let budgetCategory = '';
          const classNumber = parseInt(account.code[0]);
          
          if (classNumber === 6) {
            if (account.code.startsWith('60') || account.code.startsWith('61')) {
              budgetCategory = 'operating_expenses';
            } else if (account.code.startsWith('64')) {
              budgetCategory = 'personnel_costs';
            } else if (account.code.startsWith('66')) {
              budgetCategory = 'financial_expenses';
            }
          } else if (classNumber === 7) {
            if (account.code.startsWith('70')) {
              budgetCategory = 'operating_revenue';
            } else if (account.code.startsWith('76')) {
              budgetCategory = 'financial_revenue';
            }
          } else if (classNumber === 2) {
            budgetCategory = 'investments';
          } else if (classNumber === 1 && !account.code.startsWith('12')) {
            budgetCategory = 'financing';
          }

          return {
            company_id: companyId,
            account_number: account.code,
            name: account.name,
            type: account.type,
            class: parseInt(account.code[0]),
            parent_account_number: account.parent || null,
            description: account.description || `Compte ${account.code} - ${account.name}`,
            budget_category: budgetCategory || null,
            is_active: true,
            balance: 0,
            currency: 'EUR'
          };
        });

      if (accountsToCreate.length === 0) {
        return {
          success: false,
          accountsCreated: 0,
          accountsSkipped: 0,
          error: 'No essential accounts found to create'
        };
      }

      const { data, error } = await supabase
        .from('accounts')
        .insert(accountsToCreate)
        .select();

      if (error) throw error;

      return {
        success: true,
        accountsCreated: data?.length || 0,
        accountsSkipped: 0
      };
    } catch (error) {
      console.error('Error creating essential accounts:', error);
      return {
        success: false,
        accountsCreated: 0,
        accountsSkipped: 0,
        error: error.message || 'Failed to create essential accounts'
      };
    }
  }

  /**
   * Create all PCG accounts (comprehensive plan)
   */
  async createFullPCGAccounts(companyId: string): Promise<AccountCreationResult> {
    try {
      const { count, error: countError } = await supabase
        .from('accounts')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId);

      if (countError) throw countError;

      if (count && count > 0) {
        return {
          success: false,
          accountsCreated: 0,
          accountsSkipped: count,
          error: 'Accounts already exist for this company'
        };
      }

      const accountsToCreate = PCG_ACCOUNTS.map(account => {
        let budgetCategory = '';
        const classNumber = parseInt(account.code[0]);
        
        if (classNumber === 6) {
          if (account.code.startsWith('60') || account.code.startsWith('61')) {
            budgetCategory = 'operating_expenses';
          } else if (account.code.startsWith('64')) {
            budgetCategory = 'personnel_costs';
          } else if (account.code.startsWith('66')) {
            budgetCategory = 'financial_expenses';
          }
        } else if (classNumber === 7) {
          if (account.code.startsWith('70')) {
            budgetCategory = 'operating_revenue';
          } else if (account.code.startsWith('76')) {
            budgetCategory = 'financial_revenue';
          }
        } else if (classNumber === 2) {
          budgetCategory = 'investments';
        } else if (classNumber === 1 && !account.code.startsWith('12')) {
          budgetCategory = 'financing';
        }

        return {
          company_id: companyId,
          account_number: account.code,
          name: account.name,
          type: account.type,
          class: parseInt(account.code[0]),
          parent_account_number: account.parent || null,
          description: account.description || `Compte ${account.code} - ${account.name}`,
          budget_category: budgetCategory || null,
          is_active: account.isActive,
          balance: 0,
          currency: 'EUR'
        };
      });

      // Insert in batches to avoid timeout
      const batchSize = 50;
      let totalCreated = 0;

      for (let i = 0; i < accountsToCreate.length; i += batchSize) {
        const batch = accountsToCreate.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('accounts')
          .insert(batch)
          .select();

        if (error) throw error;
        totalCreated += data?.length || 0;
      }

      return {
        success: true,
        accountsCreated: totalCreated,
        accountsSkipped: 0
      };
    } catch (error) {
      console.error('Error creating full PCG accounts:', error);
      return {
        success: false,
        accountsCreated: 0,
        accountsSkipped: 0,
        error: error.message || 'Failed to create full PCG accounts'
      };
    }
  }

  /**
   * Create accounts for a specific industry sector
   */
  async createSectorSpecificAccounts(
    companyId: string,
    sector: 'retail' | 'services' | 'manufacturing' | 'freelance'
  ): Promise<AccountCreationResult> {
    try {
      const sectorAccounts: Record<string, string[]> = {
        retail: [
          '101000', '120000', '401000', '411000', '512000', '530000',
          '607000', '701000', '707000', '445660', '445710'
        ],
        services: [
          '101000', '120000', '401000', '411000', '421000', '512000',
          '606000', '622000', '641000', '706000', '445660', '445710'
        ],
        manufacturing: [
          '101000', '120000', '211000', '311000', '371000', '401000', '411000',
          '512000', '601000', '602000', '701000', '445660', '445710'
        ],
        freelance: [
          '101000', '120000', '411000', '512000', '530000',
          '622000', '623000', '626000', '641000', '706000', '445660', '445710'
        ]
      };

      const accountCodes = sectorAccounts[sector] || sectorAccounts.services;

      const accountsToCreate = PCG_ACCOUNTS
        .filter(account => accountCodes.includes(account.code))
        .map(account => ({
          company_id: companyId,
          account_number: account.code,
          name: account.name,
          type: account.type,
          class: parseInt(account.code[0]),
          parent_account_number: account.parent || null,
          description: account.description || `Compte ${account.code} - ${account.name}`,
          is_active: true,
          balance: 0,
          currency: 'EUR'
        }));

      const { data, error } = await supabase
        .from('accounts')
        .insert(accountsToCreate)
        .select();

      if (error) throw error;

      return {
        success: true,
        accountsCreated: data?.length || 0,
        accountsSkipped: 0
      };
    } catch (error) {
      console.error('Error creating sector-specific accounts:', error);
      return {
        success: false,
        accountsCreated: 0,
        accountsSkipped: 0,
        error: error.message || 'Failed to create sector-specific accounts'
      };
    }
  }
}

export const accountsAutoCreationService = AccountsAutoCreationService.getInstance();
