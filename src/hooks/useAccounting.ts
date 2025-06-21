// src/hooks/useAccounting.ts
import { useState, useEffect } from 'react';
import { AccountingService } from '../services/accountingService';
import type { AccountType, Account, AccountPlan } from '../types/accounting';

export function useAccounting() {
  const [accountingService] = useState(() => AccountingService.getInstance());
  const [accountTree, setAccountTree] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setIsLoading(true);
      const tree = accountingService.generateAccountTree();
      setAccountTree(tree);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du plan comptable');
      console.error('Erreur useAccounting:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accountingService]);

  const getAccount = (accountNumber: string): Account | null => {
    try {
      return accountingService.getAccountByNumber(accountNumber);
    } catch (error) {
      console.error('Erreur lors de la récupération du compte:', error);
      return null;
    }
  };

  const validateAccount = (accountNumber: string): boolean => {
    try {
      return accountingService.validateAccountNumber(accountNumber);
    } catch (error) {
      console.error('Erreur lors de la validation du compte:', error);
      return false;
    }
  };

  const getAccountsByType = (type: AccountType): Account[] => {
    try {
      return accountingService.getAccountsByType(type);
    } catch (error) {
      console.error('Erreur lors de la récupération des comptes par type:', error);
      return [];
    }
  };

  const searchAccounts = (query: string): Account[] => {
    try {
      const allAccounts = accountingService.getAllAccounts();
      return allAccounts.filter(account => 
        account.number.includes(query) || 
        account.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Erreur lors de la recherche de comptes:', error);
      return [];
    }
  };

  const getAccountHierarchy = (accountNumber: string): string[] => {
    try {
      return accountingService.getAccountHierarchy(accountNumber);
    } catch (error) {
      console.error('Erreur lors de la récupération de la hiérarchie:', error);
      return [];
    }
  };

  const isDebitAccount = (accountNumber: string): boolean => {
    const account = getAccount(accountNumber);
    return account ? account.isDebitNormal : false;
  };

  const isCreditAccount = (accountNumber: string): boolean => {
    const account = getAccount(accountNumber);
    return account ? !account.isDebitNormal : false;
  };

  // Fonctions spécifiques aux types de comptes
  const getAssetAccounts = (): Account[] => getAccountsByType('immobilisations');
  const getLiabilityAccounts = (): Account[] => getAccountsByType('dettes');
  const getEquityAccounts = (): Account[] => getAccountsByType('capitaux');
  const getRevenueAccounts = (): Account[] => getAccountsByType('produits');
  const getExpenseAccounts = (): Account[] => getAccountsByType('charges');
  const getCashAccounts = (): Account[] => getAccountsByType('tresorerie');
  const getStockAccounts = (): Account[] => getAccountsByType('stocks');
  const getReceivableAccounts = (): Account[] => getAccountsByType('creances');

  // Fonctions de validation métier
  const canDebit = (accountNumber: string, amount: number): boolean => {
    if (amount <= 0) return false;
    const account = getAccount(accountNumber);
    return account !== null;
  };

  const canCredit = (accountNumber: string, amount: number): boolean => {
    if (amount <= 0) return false;
    const account = getAccount(accountNumber);
    return account !== null;
  };

  // Suggestions d'écritures
  const suggestCounterAccounts = (accountNumber: string): Account[] => {
    const account = getAccount(accountNumber);
    if (!account) return [];

    // Logique de suggestion basée sur le type de compte
    switch (account.type) {
      case 'charges':
        return [...getCashAccounts(), ...getLiabilityAccounts()].slice(0, 5);
      case 'produits':
        return [...getCashAccounts(), ...getReceivableAccounts()].slice(0, 5);
      case 'immobilisations':
        return [...getCashAccounts(), ...getLiabilityAccounts()].slice(0, 5);
      default:
        return [];
    }
  };

  return {
    // État
    accountTree,
    isLoading,
    error,
    
    // Fonctions de base
    getAccount,
    validateAccount,
    getAccountsByType,
    searchAccounts,
    getAccountHierarchy,
    
    // Validation
    isDebitAccount,
    isCreditAccount,
    canDebit,
    canCredit,
    
    // Comptes par type
    getAssetAccounts,
    getLiabilityAccounts,
    getEquityAccounts,
    getRevenueAccounts,
    getExpenseAccounts,
    getCashAccounts,
    getStockAccounts,
    getReceivableAccounts,
    
    // Suggestions
    suggestCounterAccounts,
    
    // Configuration
    defaultAccounts: accountingService.getDefaultAccounts(),
    currentPlan: accountingService.getCurrentPlan(),
    
    // Méthodes avancées
    refreshAccountTree: () => {
      const tree = accountingService.generateAccountTree();
      setAccountTree(tree);
    }
  };
}

// Hook spécialisé pour les écritures comptables
export function useJournalEntry() {
  const accounting = useAccounting();
  const [entries, setEntries] = useState<Array<{
    accountNumber: string;
    debit: number;
    credit: number;
    description: string;
  }>>([]);

  const addEntry = (accountNumber: string, debit: number, credit: number, description: string = '') => {
    if (!accounting.validateAccount(accountNumber)) {
      throw new Error(`Compte invalide: ${accountNumber}`);
    }

    setEntries(prev => [...prev, {
      accountNumber,
      debit: debit || 0,
      credit: credit || 0,
      description
    }]);
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const clearEntries = () => {
    setEntries([]);
  };

  const getTotalDebit = (): number => {
    return entries.reduce((total, entry) => total + entry.debit, 0);
  };

  const getTotalCredit = (): number => {
    return entries.reduce((total, entry) => total + entry.credit, 0);
  };

  const isBalanced = (): boolean => {
    return Math.abs(getTotalDebit() - getTotalCredit()) < 0.01; // Tolérance pour les arrondis
  };

  const validate = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (entries.length === 0) {
      errors.push('Aucune écriture saisie');
    }

    if (entries.length < 2) {
      errors.push('Une écriture doit avoir au moins 2 lignes');
    }

    if (!isBalanced()) {
      errors.push(`Écriture déséquilibrée: ${getTotalDebit()} ≠ ${getTotalCredit()}`);
    }

    // Vérification des comptes
    entries.forEach((entry, index) => {
      if (!accounting.validateAccount(entry.accountNumber)) {
        errors.push(`Ligne ${index + 1}: Compte invalide ${entry.accountNumber}`);
      }
      if (entry.debit === 0 && entry.credit === 0) {
        errors.push(`Ligne ${index + 1}: Montant requis`);
      }
      if (entry.debit > 0 && entry.credit > 0) {
        errors.push(`Ligne ${index + 1}: Une ligne ne peut être à la fois débit et crédit`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    entries,
    addEntry,
    removeEntry,
    clearEntries,
    getTotalDebit,
    getTotalCredit,
    isBalanced,
    validate,
    ...accounting
  };
}
