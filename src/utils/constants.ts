// src/utils/constants.ts

import { CountryInfo } from '../types/config';

export const APP_VERSION = '1.0.0';

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  // ============================================================================
  // EUROPE
  // ============================================================================
  {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    fiscalYearStart: '01-01',
    accountingStandard: 'PCG',
    taxRates: [
      { name: 'TVA Standard', rate: 20, type: 'VAT', isDefault: true },
      { name: 'TVA Réduite', rate: 10, type: 'VAT', isDefault: false },
      { name: 'TVA Super Réduite', rate: 5.5, type: 'VAT', isDefault: false },
      { name: 'TVA Particulière', rate: 2.1, type: 'VAT', isDefault: false }
    ]
  },
  {
    code: 'BE',
    name: 'Belgique',
    currency: 'EUR',
    timezone: 'Europe/Brussels',
    fiscalYearStart: '01-01',
    accountingStandard: 'PCG',
    taxRates: [
      { name: 'TVA Standard', rate: 21, type: 'VAT', isDefault: true },
      { name: 'TVA Réduite', rate: 12, type: 'VAT', isDefault: false },
      { name: 'TVA Super Réduite', rate: 6, type: 'VAT', isDefault: false }
    ]
  },

  // ============================================================================
  // AFRIQUE DE L'OUEST - ZONE CFA (SYSCOHADA)
  // ============================================================================
  {
    code: 'SN',
    name: 'Sénégal',
    currency: 'XOF',
    timezone: 'Africa/Dakar',
    fiscalYearStart: '01-01',
    accountingStandard: 'SYSCOHADA',
    taxRates: [
      { name: 'TVA Standard', rate: 18, type: 'VAT', isDefault: true },
      { name: 'TVA Réduite', rate: 10, type: 'VAT', isDefault: false }
    ]
  },
  {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    currency: 'XOF',
    timezone: 'Africa/Abidjan',
    fiscalYearStart: '01-01',
    accountingStandard: 'SYSCOHADA',
    taxRates: [
      { name: 'TVA Standard', rate: 18, type: 'VAT', isDefault: true },
      { name: 'TVA Réduite', rate: 9, type: 'VAT', isDefault: false }
    ]
  },
  {
    code: 'BJ',
    name: 'Bénin',
    currency: 'XOF',
    timezone: 'Africa/Porto-Novo',
    fiscalYearStart: '01-01',
    accountingStandard: 'SYSCOHADA',
    taxRates: [
      { name: 'TVA Standard', rate: 18, type: 'VAT', isDefault: true }
    ]
  },
  {
    code: 'CM',
    name: 'Cameroun',
    currency: 'XAF',
    timezone: 'Africa/Douala',
    fiscalYearStart: '01-01',
    accountingStandard: 'SYSCOHADA',
    taxRates: [
      { name: 'TVA Standard', rate: 19.25, type: 'VAT', isDefault: true }
    ]
  },

  // ============================================================================
  // AFRIQUE ANGLOPHONE (IFRS)
  // ============================================================================
  {
    code: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    fiscalYearStart: '01-01',
    accountingStandard: 'IFRS',
    taxRates: [
      { name: 'VAT Standard', rate: 7.5, type: 'VAT', isDefault: true }
    ]
  },
  {
    code: 'GH',
    name: 'Ghana',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    fiscalYearStart: '01-01',
    accountingStandard: 'IFRS',
    taxRates: [
      { name: 'VAT Standard', rate: 15, type: 'VAT', isDefault: true },
      { name: 'NHIL', rate: 2.5, type: 'VAT', isDefault: false },
      { name: 'COVID Levy', rate: 1, type: 'VAT', isDefault: false }
    ]
  },
  {
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    fiscalYearStart: '01-01',
    accountingStandard: 'IFRS',
    taxRates: [
      { name: 'VAT Standard', rate: 16, type: 'VAT', isDefault: true },
      { name: 'VAT Reduced', rate: 8, type: 'VAT', isDefault: false }
    ]
  },
  {
    code: 'ZA',
    name: 'Afrique du Sud',
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    fiscalYearStart: '03-01',
    accountingStandard: 'IFRS',
    taxRates: [
      { name: 'VAT Standard', rate: 15, type: 'VAT', isDefault: true }
    ]
  },

  // ============================================================================
  // MAGHREB (SCF)
  // ============================================================================
  {
    code: 'MA',
    name: 'Maroc',
    currency: 'MAD',
    timezone: 'Africa/Casablanca',
    fiscalYearStart: '01-01',
    accountingStandard: 'SCF',
    taxRates: [
      { name: 'TVA Standard', rate: 20, type: 'VAT', isDefault: true },
      { name: 'TVA Réduite', rate: 14, type: 'VAT', isDefault: false },
      { name: 'TVA Super Réduite', rate: 7, type: 'VAT', isDefault: false }
    ]
  },
  {
    code: 'DZ',
    name: 'Algérie',
    currency: 'DZD',
    timezone: 'Africa/Algiers',
    fiscalYearStart: '01-01',
    accountingStandard: 'SCF',
    taxRates: [
      { name: 'TVA Standard', rate: 19, type: 'VAT', isDefault: true },
      { name: 'TVA Réduite', rate: 9, type: 'VAT', isDefault: false }
    ]
  },
  {
    code: 'TN',
    name: 'Tunisie',
    currency: 'TND',
    timezone: 'Africa/Tunis',
    fiscalYearStart: '01-01',
    accountingStandard: 'SCF',
    taxRates: [
      { name: 'TVA Standard', rate: 19, type: 'VAT', isDefault: true },
      { name: 'TVA Réduite', rate: 13, type: 'VAT', isDefault: false },
      { name: 'TVA Super Réduite', rate: 7, type: 'VAT', isDefault: false }
    ]
  }
];

export const SUPPORTED_CURRENCIES = [
  {
    code: 'EUR',
    name: 'Euro',
    symbol: ' EUR',
    decimal_places: 2,
    countries: ['FR', 'BE']
  },
  {
    code: 'XOF',
    name: 'Franc CFA (BCEAO)',
    symbol: 'CFA',
    decimal_places: 0,
    countries: ['BJ', 'CI']
  },
  {
    code: 'USD',
    name: 'Dollar US',
    symbol: '$',
    decimal_places: 2,
    countries: []
  }
];

export const CONFIG_STORAGE_KEY = 'casskai_config';
export const CONFIG_VERSION = '1.0';

export const SUPABASE_URL_REGEX = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/;

export const DEFAULT_FISCAL_YEAR_START = '01-01';

export const ACCOUNTING_STANDARDS = {
  PCG: 'Plan Comptable Général (France)',
  SYSCOHADA: 'Système Comptable OHADA',
  IFRS: 'IFRS for SMEs (International)',
  SCF: 'Système Comptable Financier (Maghreb)',
  BELGIAN: 'Plan Comptable Belge',
  BASIC: 'Plan Comptable Basique'
} as const;

export const DATABASE_TABLES = {
  COMPANIES: 'companies',
  USER_PROFILES: 'user_profiles',
  ACCOUNTS: 'accounts',
  JOURNAL_ENTRIES: 'journal_entries',
  JOURNAL_LINES: 'journal_lines',
  BANK_ACCOUNTS: 'bank_accounts',
  TRANSACTIONS: 'transactions',
  EXCHANGE_RATES: 'exchange_rates'
} as const;

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant',
  USER: 'user'
} as const;

export const PERMISSIONS = {
  // Gestion entreprise
  COMPANY_VIEW: 'company:view',
  COMPANY_EDIT: 'company:edit',
  COMPANY_DELETE: 'company:delete',
  
  // Gestion utilisateurs
  USERS_VIEW: 'users:view',
  USERS_INVITE: 'users:invite',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  
  // Comptabilité
  ACCOUNTS_VIEW: 'accounts:view',
  ACCOUNTS_EDIT: 'accounts:edit',
  ENTRIES_VIEW: 'entries:view',
  ENTRIES_CREATE: 'entries:create',
  ENTRIES_EDIT: 'entries:edit',
  ENTRIES_DELETE: 'entries:delete',
  ENTRIES_POST: 'entries:post',
  
  // Banque
  BANK_VIEW: 'bank:view',
  BANK_EDIT: 'bank:edit',
  BANK_RECONCILE: 'bank:reconcile',
  
  // Rapports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // Administration
  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_BACKUP: 'admin:backup'
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.OWNER]: Object.values(PERMISSIONS),
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.COMPANY_EDIT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_INVITE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.ACCOUNTS_VIEW,
    PERMISSIONS.ACCOUNTS_EDIT,
    PERMISSIONS.ENTRIES_VIEW,
    PERMISSIONS.ENTRIES_CREATE,
    PERMISSIONS.ENTRIES_EDIT,
    PERMISSIONS.ENTRIES_POST,
    PERMISSIONS.BANK_VIEW,
    PERMISSIONS.BANK_EDIT,
    PERMISSIONS.BANK_RECONCILE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],
  [USER_ROLES.ACCOUNTANT]: [
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.ACCOUNTS_VIEW,
    PERMISSIONS.ENTRIES_VIEW,
    PERMISSIONS.ENTRIES_CREATE,
    PERMISSIONS.ENTRIES_EDIT,
    PERMISSIONS.ENTRIES_POST,
    PERMISSIONS.BANK_VIEW,
    PERMISSIONS.BANK_RECONCILE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.ACCOUNTS_VIEW,
    PERMISSIONS.ENTRIES_VIEW,
    PERMISSIONS.BANK_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ]
};

export const ERROR_CODES = {
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  SUPABASE_CONNECTION_FAILED: 'SUPABASE_CONNECTION_FAILED',
  INVALID_SUPABASE_URL: 'INVALID_SUPABASE_URL',
  INVALID_SUPABASE_KEY: 'INVALID_SUPABASE_KEY',
  DATABASE_INIT_FAILED: 'DATABASE_INIT_FAILED',
  COMPANY_CREATION_FAILED: 'COMPANY_CREATION_FAILED',
  USER_CREATION_FAILED: 'USER_CREATION_FAILED'
} as const;

export const SUCCESS_MESSAGES = {
  CONFIG_SAVED: 'Configuration sauvegardée avec succès',
  SUPABASE_CONNECTED: 'Connexion Supabase établie',
  DATABASE_INITIALIZED: 'Base de données initialisée',
  COMPANY_CREATED: 'Entreprise créée avec succès'
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.CONFIG_NOT_FOUND]: 'Configuration non trouvée',
  [ERROR_CODES.SUPABASE_CONNECTION_FAILED]: 'Impossible de se connecter à Supabase',
  [ERROR_CODES.INVALID_SUPABASE_URL]: 'URL Supabase invalide',
  [ERROR_CODES.INVALID_SUPABASE_KEY]: 'Clé Supabase invalide',
  [ERROR_CODES.DATABASE_INIT_FAILED]: 'Échec de l\'initialisation de la base de données',
  [ERROR_CODES.COMPANY_CREATION_FAILED]: 'Échec de la création de l\'entreprise',
  [ERROR_CODES.USER_CREATION_FAILED]: 'Échec de la création de l\'utilisateur'
} as const;
