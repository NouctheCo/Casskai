// services/accountingService.ts
export class AccountingService {
  private static instance: AccountingService;
  private currentPlan: AccountPlan = SYSCOHADA_PLAN;

  static getInstance(): AccountingService {
    if (!AccountingService.instance) {
      AccountingService.instance = new AccountingService();
    }
    return AccountingService.instance;
  }

  setAccountPlan(plan: AccountPlan): void {
    this.currentPlan = plan;
  }

  getCurrentPlan(): AccountPlan {
    return this.currentPlan;
  }

  getAccountByNumber(accountNumber: string): Account | null {
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

  // Fonctions spécifiques SYSCOHADA
  isTVAAccount(accountNumber: string): boolean {
    return accountNumber.startsWith('443') || 
           accountNumber.startsWith('444') || 
           accountNumber.startsWith('445');
  }

  isBankAccount(accountNumber: string): boolean {
    return accountNumber.startsWith('52');
  }

  isCashAccount(accountNumber: string): boolean {
    return accountNumber.startsWith('57');
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
    return {
      // Comptes par défaut SYSCOHADA
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
      fraisBancaires: '631',
      dotationAmortissement: '681'
    };
  }
}
