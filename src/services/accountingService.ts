// src/services/accountingService.ts
import type { AccountPlan, AccountClass, Account, AccountType } from '../types/accounting';

export class AccountingService {
  private static instance: AccountingService;
  private currentPlan: AccountPlan | null = null;

  private constructor() {
    // Charger le plan par défaut (PCG français)
    this.currentPlan = this.getDefaultPCGPlan();
  }

  static getInstance(): AccountingService {
    if (!AccountingService.instance) {
      AccountingService.instance = new AccountingService();
    }
    return AccountingService.instance;
  }

  setAccountPlan(plan: AccountPlan): void {
    this.currentPlan = plan;
  }

  getCurrentPlan(): AccountPlan | null {
    return this.currentPlan;
  }

  getAccountByNumber(accountNumber: string): Account | null {
    if (!this.currentPlan) return null;

    for (const accountClass of this.currentPlan.classes) {
      for (const account of accountClass.accounts) {
        if (account.number === accountNumber) {
          return account;
        }
        if (account.subAccounts) {
          const subAccount = account.subAccounts.find(sub => sub.number === accountNumber);
          if (subAccount) return subAccount;
        }
      }
    }
    return null;
  }

  getAccountsByType(type: AccountType): Account[] {
    if (!this.currentPlan) return [];

    const accounts: Account[] = [];
    for (const accountClass of this.currentPlan.classes) {
      for (const account of accountClass.accounts) {
        if (account.type === type) {
          accounts.push(account);
        }
        if (account.subAccounts) {
          accounts.push(...account.subAccounts.filter(sub => sub.type === type));
        }
      }
    }
    return accounts;
  }

  getAllAccounts(): Account[] {
    if (!this.currentPlan) return [];

    const allAccounts: Account[] = [];
    for (const accountClass of this.currentPlan.classes) {
      for (const account of accountClass.accounts) {
        allAccounts.push(account);
        if (account.subAccounts) {
          allAccounts.push(...account.subAccounts);
        }
      }
    }
    return allAccounts;
  }

  validateAccountNumber(accountNumber: string): boolean {
    return this.getAccountByNumber(accountNumber) !== null;
  }

  getAccountHierarchy(accountNumber: string): string[] {
    const hierarchy: string[] = [];
    
    // Classe (1er chiffre)
    const classNumber = accountNumber.charAt(0);
    hierarchy.push(classNumber);
    
    // Compte principal (2 premiers chiffres)
    if (accountNumber.length >= 2) {
      hierarchy.push(accountNumber.substring(0, 2));
    }
    
    // Sous-compte (3+ chiffres)
    if (accountNumber.length >= 3) {
      hierarchy.push(accountNumber);
    }
    
    return hierarchy;
  }

  generateAccountTree(): any[] {
    if (!this.currentPlan) return [];

    return this.currentPlan.classes.map(accountClass => ({
      id: accountClass.number,
      label: `${accountClass.number} - ${accountClass.name}`,
      type: accountClass.type,
      children: accountClass.accounts.map(account => ({
        id: account.number,
        label: `${account.number} - ${account.name}`,
        type: account.type,
        isDebitNormal: account.isDebitNormal,
        children: account.subAccounts?.map(subAccount => ({
          id: subAccount.number,
          label: `${subAccount.number} - ${subAccount.name}`,
          type: subAccount.type,
          isDebitNormal: subAccount.isDebitNormal
        })) || []
      }))
    }));
  }

  // Fonctions spécifiques aux types de comptes
  isTVAAccount(accountNumber: string): boolean {
    // PCG français: 44xxx
    // SYSCOHADA: 443, 444, 445
    return accountNumber.startsWith('44');
  }

  isBankAccount(accountNumber: string): boolean {
    // PCG français: 512
    // SYSCOHADA: 52
    return accountNumber.startsWith('512') || accountNumber.startsWith('52');
  }

  isCashAccount(accountNumber: string): boolean {
    // PCG français: 53
    // SYSCOHADA: 57
    return accountNumber.startsWith('53') || accountNumber.startsWith('57');
  }

  isClientAccount(accountNumber: string): boolean {
    return accountNumber.startsWith('41');
  }

  isSupplierAccount(accountNumber: string): boolean {
    return accountNumber.startsWith('40');
  }

  isRevenueAccount(accountNumber: string): boolean {
    return accountNumber.startsWith('7');
  }

  isExpenseAccount(accountNumber: string): boolean {
    return accountNumber.startsWith('6');
  }

  getDefaultAccounts(): { [key: string]: string } {
    const standard = this.currentPlan?.standard || 'PCG';
    
    if (standard === 'SYSCOHADA') {
      return {
        capital: '101',
        reportANouveau: '110',
        resultatExercice: '120',
        clientsVentes: '411',
        fournisseursAchats: '401',
        banquePrincipale: '521',
        caissePrincipale: '571',
        tvaCollectee: '443',
        tvaDeductible: '445',
        venteMarchandises: '701',
        achatMarchandises: '601',
        chargesPersonnel: '661',
        fraisBancaires: '631'
      };
    } else {
      // PCG français
      return {
        capital: '101',
        reportANouveau: '110',
        resultatExercice: '120',
        clientsVentes: '411',
        fournisseursAchats: '401',
        banquePrincipale: '512',
        caissePrincipale: '530',
        tvaCollectee: '44571',
        tvaDeductible: '44566',
        venteMarchandises: '707',
        achatMarchandises: '607',
        chargesPersonnel: '641',
        fraisBancaires: '627'
      };
    }
  }

  // Plan comptable français simplifié (sera remplacé par des données externes)
  private getDefaultPCGPlan(): AccountPlan {
    return {
      standard: 'PCG',
      country: 'FR',
      classes: [
        {
          number: '1',
          name: 'COMPTES DE CAPITAUX',
          type: 'equity',
          accounts: [
            {
              number: '10',
              name: 'CAPITAL ET RÉSERVES',
              type: 'capitaux',
              isDebitNormal: false,
              subAccounts: [
                { number: '101', name: 'Capital', type: 'capitaux', isDebitNormal: false },
                { number: '106', name: 'Réserves', type: 'capitaux', isDebitNormal: false },
                { number: '110', name: 'Report à nouveau', type: 'capitaux', isDebitNormal: false },
                { number: '120', name: 'Résultat de l\'exercice', type: 'capitaux', isDebitNormal: false }
              ]
            }
          ]
        },
        {
          number: '2',
          name: 'COMPTES D\'IMMOBILISATIONS',
          type: 'asset',
          accounts: [
            {
              number: '20',
              name: 'IMMOBILISATIONS INCORPORELLES',
              type: 'immobilisations',
              isDebitNormal: true,
              subAccounts: [
                { number: '201', name: 'Frais de développement', type: 'immobilisations', isDebitNormal: true },
                { number: '205', name: 'Concessions et droits similaires', type: 'immobilisations', isDebitNormal: true }
              ]
            },
            {
              number: '21',
              name: 'IMMOBILISATIONS CORPORELLES',
              type: 'immobilisations',
              isDebitNormal: true,
              subAccounts: [
                { number: '211', name: 'Terrains', type: 'immobilisations', isDebitNormal: true },
                { number: '213', name: 'Constructions', type: 'immobilisations', isDebitNormal: true },
                { number: '215', name: 'Installations techniques', type: 'immobilisations', isDebitNormal: true }
              ]
            }
          ]
        },
        {
          number: '3',
          name: 'COMPTES DE STOCKS',
          type: 'asset',
          accounts: [
            {
              number: '31',
              name: 'MATIÈRES PREMIÈRES',
              type: 'stocks',
              isDebitNormal: true,
              subAccounts: [
                { number: '311', name: 'Matières premières', type: 'stocks', isDebitNormal: true },
                { number: '312', name: 'Matières consommables', type: 'stocks', isDebitNormal: true }
              ]
            }
          ]
        },
        {
          number: '4',
          name: 'COMPTES DE TIERS',
          type: 'asset',
          accounts: [
            {
              number: '40',
              name: 'FOURNISSEURS',
              type: 'dettes',
              isDebitNormal: false,
              subAccounts: [
                { number: '401', name: 'Fournisseurs', type: 'dettes', isDebitNormal: false },
                { number: '408', name: 'Fournisseurs factures non parvenues', type: 'dettes', isDebitNormal: false }
              ]
            },
            {
              number: '41',
              name: 'CLIENTS',
              type: 'creances',
              isDebitNormal: true,
              subAccounts: [
                { number: '411', name: 'Clients', type: 'creances', isDebitNormal: true },
                { number: '416', name: 'Clients douteux', type: 'creances', isDebitNormal: true }
              ]
            },
            {
              number: '44',
              name: 'ÉTAT ET COLLECTIVITÉS',
              type: 'dettes',
              isDebitNormal: false,
              subAccounts: [
                { number: '44566', name: 'TVA déductible', type: 'creances', isDebitNormal: true },
                { number: '44571', name: 'TVA collectée', type: 'dettes', isDebitNormal: false }
              ]
            }
          ]
        },
        {
          number: '5',
          name: 'COMPTES FINANCIERS',
          type: 'asset',
          accounts: [
            {
              number: '51',
              name: 'BANQUES',
              type: 'tresorerie',
              isDebitNormal: true,
              subAccounts: [
                { number: '512', name: 'Banques', type: 'tresorerie', isDebitNormal: true }
              ]
            },
            {
              number: '53',
              name: 'CAISSE',
              type: 'tresorerie',
              isDebitNormal: true,
              subAccounts: [
                { number: '530', name: 'Caisse', type: 'tresorerie', isDebitNormal: true }
              ]
            }
          ]
        },
        {
          number: '6',
          name: 'COMPTES DE CHARGES',
          type: 'expense',
          accounts: [
            {
              number: '60',
              name: 'ACHATS',
              type: 'charges',
              isDebitNormal: true,
              subAccounts: [
                { number: '607', name: 'Achats de marchandises', type: 'charges', isDebitNormal: true }
              ]
            },
            {
              number: '62',
              name: 'AUTRES SERVICES EXTÉRIEURS',
              type: 'charges',
              isDebitNormal: true,
              subAccounts: [
                { number: '627', name: 'Services bancaires', type: 'charges', isDebitNormal: true }
              ]
            },
            {
              number: '64',
              name: 'CHARGES DE PERSONNEL',
              type: 'charges',
              isDebitNormal: true,
              subAccounts: [
                { number: '641', name: 'Rémunérations du personnel', type: 'charges', isDebitNormal: true }
              ]
            }
          ]
        },
        {
          number: '7',
          name: 'COMPTES DE PRODUITS',
          type: 'revenue',
          accounts: [
            {
              number: '70',
              name: 'VENTES',
              type: 'produits',
              isDebitNormal: false,
              subAccounts: [
                { number: '707', name: 'Ventes de marchandises', type: 'produits', isDebitNormal: false }
              ]
            }
          ]
        }
      ]
    };
  }
}
