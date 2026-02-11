import type { AccountPlan, Account } from '@/types/accounting';

// Plan Comptable Général (PCG) - Structure comptable française
// Ce fichier définit la structure hiérarchique du plan comptable selon les normes françaises

export interface PCGAccount {
  code: string;
  name: string;
  nameEn: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category: string;
  categoryEn: string;
  level: number;
  parent?: string;
  isActive: boolean;
  description?: string;
  descriptionEn?: string;
}

export interface PCGClass {
  class: number;
  name: string;
  nameEn: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  color: string;
}

// Classes principales du PCG
export const PCG_CLASSES: PCGClass[] = [
  {
    class: 1,
    name: 'Comptes de capitaux',
    nameEn: 'Capital accounts',
    type: 'equity',
    color: '#3B82F6'
  },
  {
    class: 2,
    name: 'Comptes d\'immobilisations',
    nameEn: 'Fixed assets',
    type: 'asset',
    color: '#10B981'
  },
  {
    class: 3,
    name: 'Comptes de stocks et en-cours',
    nameEn: 'Inventory and work in progress',
    type: 'asset',
    color: '#F59E0B'
  },
  {
    class: 4,
    name: 'Comptes de tiers',
    nameEn: 'Third party accounts',
    type: 'asset',
    color: '#8B5CF6'
  },
  {
    class: 5,
    name: 'Comptes financiers',
    nameEn: 'Financial accounts',
    type: 'asset',
    color: '#06B6D4'
  },
  {
    class: 6,
    name: 'Comptes de charges',
    nameEn: 'Expense accounts',
    type: 'expense',
    color: '#EF4444'
  },
  {
    class: 7,
    name: 'Comptes de produits',
    nameEn: 'Revenue accounts',
    type: 'revenue',
    color: '#22C55E'
  }
];

// Comptes principaux du PCG
export const PCG_ACCOUNTS: PCGAccount[] = [
  // CLASSE 1 - COMPTES DE CAPITAUX
  {
    code: '10',
    name: 'Capital et réserves',
    nameEn: 'Capital and reserves',
    type: 'equity',
    category: 'Capitaux propres',
    categoryEn: 'Equity',
    level: 1,
    isActive: true
  },
  {
    code: '101',
    name: 'Capital',
    nameEn: 'Share capital',
    type: 'equity',
    category: 'Capitaux propres',
    categoryEn: 'Equity',
    level: 2,
    parent: '10',
    isActive: true
  },
  {
    code: '106',
    name: 'Réserves',
    nameEn: 'Reserves',
    type: 'equity',
    category: 'Capitaux propres',
    categoryEn: 'Equity',
    level: 2,
    parent: '10',
    isActive: true
  },
  {
    code: '108',
    name: 'Compte de l\'exploitant',
    nameEn: 'Owner\'s account',
    type: 'equity',
    category: 'Capitaux propres',
    categoryEn: 'Equity',
    level: 2,
    parent: '10',
    isActive: true
  },
  {
    code: '12',
    name: 'Résultat de l\'exercice',
    nameEn: 'Current year result',
    type: 'equity',
    category: 'Résultat',
    categoryEn: 'Result',
    level: 1,
    isActive: true
  },
  {
    code: '16',
    name: 'Emprunts et dettes assimilées',
    nameEn: 'Loans and similar debts',
    type: 'liability',
    category: 'Dettes financières',
    categoryEn: 'Financial debts',
    level: 1,
    isActive: true
  },
  {
    code: '164',
    name: 'Emprunts auprès des établissements de crédit',
    nameEn: 'Bank loans',
    type: 'liability',
    category: 'Dettes financières',
    categoryEn: 'Financial debts',
    level: 2,
    parent: '16',
    isActive: true
  },

  // CLASSE 2 - COMPTES D'IMMOBILISATIONS
  {
    code: '20',
    name: 'Immobilisations incorporelles',
    nameEn: 'Intangible assets',
    type: 'asset',
    category: 'Immobilisations',
    categoryEn: 'Fixed assets',
    level: 1,
    isActive: true
  },
  {
    code: '205',
    name: 'Concessions et droits similaires',
    nameEn: 'Concessions and similar rights',
    type: 'asset',
    category: 'Immobilisations',
    categoryEn: 'Fixed assets',
    level: 2,
    parent: '20',
    isActive: true
  },
  {
    code: '21',
    name: 'Immobilisations corporelles',
    nameEn: 'Tangible assets',
    type: 'asset',
    category: 'Immobilisations',
    categoryEn: 'Fixed assets',
    level: 1,
    isActive: true
  },
  {
    code: '213',
    name: 'Constructions',
    nameEn: 'Buildings',
    type: 'asset',
    category: 'Immobilisations',
    categoryEn: 'Fixed assets',
    level: 2,
    parent: '21',
    isActive: true
  },
  {
    code: '2154',
    name: 'Matériel industriel',
    nameEn: 'Industrial equipment',
    type: 'asset',
    category: 'Immobilisations',
    categoryEn: 'Fixed assets',
    level: 3,
    parent: '21',
    isActive: true
  },
  {
    code: '2182',
    name: 'Matériel de transport',
    nameEn: 'Transport equipment',
    type: 'asset',
    category: 'Immobilisations',
    categoryEn: 'Fixed assets',
    level: 3,
    parent: '21',
    isActive: true
  },
  {
    code: '2183',
    name: 'Matériel de bureau et informatique',
    nameEn: 'Office and IT equipment',
    type: 'asset',
    category: 'Immobilisations',
    categoryEn: 'Fixed assets',
    level: 3,
    parent: '21',
    isActive: true
  },

  // CLASSE 3 - COMPTES DE STOCKS
  {
    code: '31',
    name: 'Matières premières',
    nameEn: 'Raw materials',
    type: 'asset',
    category: 'Stocks',
    categoryEn: 'Inventory',
    level: 1,
    isActive: true
  },
  {
    code: '37',
    name: 'Stocks de marchandises',
    nameEn: 'Merchandise inventory',
    type: 'asset',
    category: 'Stocks',
    categoryEn: 'Inventory',
    level: 1,
    isActive: true
  },

  // CLASSE 4 - COMPTES DE TIERS
  {
    code: '41',
    name: 'Clients et comptes rattachés',
    nameEn: 'Customers and related accounts',
    type: 'asset',
    category: 'Créances clients',
    categoryEn: 'Trade receivables',
    level: 1,
    isActive: true
  },
  {
    code: '411',
    name: 'Clients',
    nameEn: 'Customers',
    type: 'asset',
    category: 'Créances clients',
    categoryEn: 'Trade receivables',
    level: 2,
    parent: '41',
    isActive: true
  },
  {
    code: '4111',
    name: 'Clients - Ventes de biens ou prestations de services',
    nameEn: 'Customers - Sales of goods or services',
    type: 'asset',
    category: 'Créances clients',
    categoryEn: 'Trade receivables',
    level: 3,
    parent: '411',
    isActive: true
  },
  {
    code: '40',
    name: 'Fournisseurs et comptes rattachés',
    nameEn: 'Suppliers and related accounts',
    type: 'liability',
    category: 'Dettes fournisseurs',
    categoryEn: 'Trade payables',
    level: 1,
    isActive: true
  },
  {
    code: '401',
    name: 'Fournisseurs',
    nameEn: 'Suppliers',
    type: 'liability',
    category: 'Dettes fournisseurs',
    categoryEn: 'Trade payables',
    level: 2,
    parent: '40',
    isActive: true
  },
  {
    code: '4011',
    name: 'Fournisseurs - Achats de biens ou prestations de services',
    nameEn: 'Suppliers - Purchases of goods or services',
    type: 'liability',
    category: 'Dettes fournisseurs',
    categoryEn: 'Trade payables',
    level: 3,
    parent: '401',
    isActive: true
  },
  {
    code: '44',
    name: 'État et collectivités publiques',
    nameEn: 'State and public entities',
    type: 'asset',
    category: 'Créances et dettes fiscales',
    categoryEn: 'Tax receivables and payables',
    level: 1,
    isActive: true
  },
  {
    code: '445',
    name: 'État - Taxes sur le chiffre d\'affaires',
    nameEn: 'State - VAT',
    type: 'asset',
    category: 'TVA',
    categoryEn: 'VAT',
    level: 2,
    parent: '44',
    isActive: true
  },
  {
    code: '4456',
    name: 'État - TVA déductible',
    nameEn: 'State - Deductible VAT',
    type: 'asset',
    category: 'TVA',
    categoryEn: 'VAT',
    level: 3,
    parent: '445',
    isActive: true
  },
  {
    code: '4457',
    name: 'État - TVA collectée',
    nameEn: 'State - Collected VAT',
    type: 'liability',
    category: 'TVA',
    categoryEn: 'VAT',
    level: 3,
    parent: '445',
    isActive: true
  },

  // CLASSE 5 - COMPTES FINANCIERS
  {
    code: '50',
    name: 'Valeurs mobilières de placement',
    nameEn: 'Marketable securities',
    type: 'asset',
    category: 'Placements',
    categoryEn: 'Investments',
    level: 1,
    isActive: true
  },
  {
    code: '51',
    name: 'Banques, établissements financiers et assimilés',
    nameEn: 'Banks and financial institutions',
    type: 'asset',
    category: 'Disponibilités',
    categoryEn: 'Cash and cash equivalents',
    level: 1,
    isActive: true
  },
  {
    code: '512',
    name: 'Banques',
    nameEn: 'Banks',
    type: 'asset',
    category: 'Disponibilités',
    categoryEn: 'Cash and cash equivalents',
    level: 2,
    parent: '51',
    isActive: true
  },
  {
    code: '53',
    name: 'Caisse',
    nameEn: 'Cash',
    type: 'asset',
    category: 'Disponibilités',
    categoryEn: 'Cash and cash equivalents',
    level: 1,
    isActive: true
  },
  {
    code: '531',
    name: 'Caisse',
    nameEn: 'Cash register',
    type: 'asset',
    category: 'Disponibilités',
    categoryEn: 'Cash and cash equivalents',
    level: 2,
    parent: '53',
    isActive: true
  },

  // CLASSE 6 - COMPTES DE CHARGES
  {
    code: '60',
    name: 'Achats',
    nameEn: 'Purchases',
    type: 'expense',
    category: 'Achats',
    categoryEn: 'Purchases',
    level: 1,
    isActive: true
  },
  {
    code: '601',
    name: 'Achats stockés - Matières premières',
    nameEn: 'Purchases stored - Raw materials',
    type: 'expense',
    category: 'Achats',
    categoryEn: 'Purchases',
    level: 2,
    parent: '60',
    isActive: true
  },
  {
    code: '607',
    name: 'Achats de marchandises',
    nameEn: 'Merchandise purchases',
    type: 'expense',
    category: 'Achats',
    categoryEn: 'Purchases',
    level: 2,
    parent: '60',
    isActive: true
  },
  {
    code: '61',
    name: 'Services extérieurs',
    nameEn: 'External services',
    type: 'expense',
    category: 'Services extérieurs',
    categoryEn: 'External services',
    level: 1,
    isActive: true
  },
  {
    code: '613',
    name: 'Locations',
    nameEn: 'Rentals',
    type: 'expense',
    category: 'Services extérieurs',
    categoryEn: 'External services',
    level: 2,
    parent: '61',
    isActive: true
  },
  {
    code: '626',
    name: 'Frais postaux et de télécommunications',
    nameEn: 'Postal and telecommunications expenses',
    type: 'expense',
    category: 'Autres services extérieurs',
    categoryEn: 'Other external services',
    level: 2,
    parent: '62',
    isActive: true
  },
  {
    code: '62',
    name: 'Autres services extérieurs',
    nameEn: 'Other external services',
    type: 'expense',
    category: 'Autres services extérieurs',
    categoryEn: 'Other external services',
    level: 1,
    isActive: true
  },
  {
    code: '63',
    name: 'Impôts, taxes et versements assimilés',
    nameEn: 'Taxes and similar payments',
    type: 'expense',
    category: 'Impôts et taxes',
    categoryEn: 'Taxes',
    level: 1,
    isActive: true
  },
  {
    code: '64',
    name: 'Charges de personnel',
    nameEn: 'Personnel expenses',
    type: 'expense',
    category: 'Charges de personnel',
    categoryEn: 'Personnel expenses',
    level: 1,
    isActive: true
  },
  {
    code: '641',
    name: 'Rémunérations du personnel',
    nameEn: 'Personnel remuneration',
    type: 'expense',
    category: 'Charges de personnel',
    categoryEn: 'Personnel expenses',
    level: 2,
    parent: '64',
    isActive: true
  },
  {
    code: '645',
    name: 'Charges de sécurité sociale et de prévoyance',
    nameEn: 'Social security and welfare charges',
    type: 'expense',
    category: 'Charges de personnel',
    categoryEn: 'Personnel expenses',
    level: 2,
    parent: '64',
    isActive: true
  },
  {
    code: '65',
    name: 'Autres charges de gestion courante',
    nameEn: 'Other current management expenses',
    type: 'expense',
    category: 'Autres charges',
    categoryEn: 'Other expenses',
    level: 1,
    isActive: true
  },
  {
    code: '66',
    name: 'Charges financières',
    nameEn: 'Financial expenses',
    type: 'expense',
    category: 'Charges financières',
    categoryEn: 'Financial expenses',
    level: 1,
    isActive: true
  },
  {
    code: '661',
    name: 'Charges d\'intérêts',
    nameEn: 'Interest expenses',
    type: 'expense',
    category: 'Charges financières',
    categoryEn: 'Financial expenses',
    level: 2,
    parent: '66',
    isActive: true
  },

  // CLASSE 7 - COMPTES DE PRODUITS
  {
    code: '70',
    name: 'Ventes de produits fabriqués, prestations de services',
    nameEn: 'Sales of manufactured products, services',
    type: 'revenue',
    category: 'Chiffre d\'affaires',
    categoryEn: 'Revenue',
    level: 1,
    isActive: true
  },
  {
    code: '701',
    name: 'Ventes de produits finis',
    nameEn: 'Sales of finished products',
    type: 'revenue',
    category: 'Chiffre d\'affaires',
    categoryEn: 'Revenue',
    level: 2,
    parent: '70',
    isActive: true
  },
  {
    code: '706',
    name: 'Prestations de services',
    nameEn: 'Services',
    type: 'revenue',
    category: 'Chiffre d\'affaires',
    categoryEn: 'Revenue',
    level: 2,
    parent: '70',
    isActive: true
  },
  {
    code: '707',
    name: 'Ventes de marchandises',
    nameEn: 'Merchandise sales',
    type: 'revenue',
    category: 'Chiffre d\'affaires',
    categoryEn: 'Revenue',
    level: 2,
    parent: '70',
    isActive: true
  },
  {
    code: '74',
    name: 'Autres produits de gestion courante',
    nameEn: 'Other current management income',
    type: 'revenue',
    category: 'Autres produits',
    categoryEn: 'Other income',
    level: 1,
    isActive: true
  },
  {
    code: '76',
    name: 'Produits financiers',
    nameEn: 'Financial income',
    type: 'revenue',
    category: 'Produits financiers',
    categoryEn: 'Financial income',
    level: 1,
    isActive: true
  },
  {
    code: '761',
    name: 'Produits de participations',
    nameEn: 'Income from investments',
    type: 'revenue',
    category: 'Produits financiers',
    categoryEn: 'Financial income',
    level: 2,
    parent: '76',
    isActive: true
  },
  {
    code: '762',
    name: 'Produits des autres immobilisations financières',
    nameEn: 'Income from other financial investments',
    type: 'revenue',
    category: 'Produits financiers',
    categoryEn: 'Financial income',
    level: 2,
    parent: '76',
    isActive: true
  },
  {
    code: '766',
    name: 'Gains de change',
    nameEn: 'Foreign exchange gains',
    type: 'revenue',
    category: 'Produits financiers',
    categoryEn: 'Financial income',
    level: 2,
    parent: '76',
    isActive: true
  }
];

// Fonction utilitaire pour obtenir les comptes par classe
export const getAccountsByClass = (classNumber: number): PCGAccount[] => {
  return PCG_ACCOUNTS.filter(account => 
    account.code.startsWith(classNumber.toString())
  );
};

// Fonction utilitaire pour obtenir les comptes par type
export const getAccountsByType = (type: PCGAccount['type']): PCGAccount[] => {
  return PCG_ACCOUNTS.filter(account => account.type === type);
};

// Fonction utilitaire pour rechercher un compte
export const findAccount = (code: string): PCGAccount | undefined => {
  return PCG_ACCOUNTS.find(account => account.code === code);
};

// Fonction utilitaire pour obtenir les comptes enfants
export const getChildAccounts = (parentCode: string): PCGAccount[] => {
  return PCG_ACCOUNTS.filter(account => account.parent === parentCode);
};

// Fonction utilitaire pour obtenir la hiérarchie d'un compte
export const getAccountHierarchy = (code: string): PCGAccount[] => {
  const hierarchy: PCGAccount[] = [];
  let currentAccount = findAccount(code);
  
  while (currentAccount) {
    hierarchy.unshift(currentAccount);
    if (currentAccount.parent) {
      currentAccount = findAccount(currentAccount.parent);
    } else {
      break;
    }
  }
  
  return hierarchy;
};

// Export par défaut conforme à AccountPlan
const PCG_FRANCE: AccountPlan = {
  standard: 'PCG',
  country: 'FR',
  // Convertir PCGClass vers AccountClass avec la structure attendue
  classes: PCG_CLASSES.map(pcgClass => ({
    number: pcgClass.class.toString(),
    name: pcgClass.name,
    type: pcgClass.type,
    accounts: PCG_ACCOUNTS
      .filter(acc => acc.code.startsWith(pcgClass.class.toString()))
      .map(acc => ({
        number: acc.code,
        name: acc.name,
        type: acc.type as 'immobilisations' | 'stocks' | 'creances' | 'tresorerie' | 'dettes' | 'capitaux' | 'charges' | 'produits',
        isDebitNormal: acc.type === 'asset' || acc.type === 'expense',
        subAccounts: [] as Account[]
      }))
  }))
};

export default PCG_FRANCE;
