import type { Database } from './supabase';

// Types de base
export type CompanyRow = Database['public']['Tables']['companies']['Row'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];

// Énumérations pour les valeurs prédéfinies
export type LegalForm = 
  | 'SARL' | 'SAS' | 'SASU' | 'EURL' | 'SA' | 'SNC' | 'SCS' | 'SCA'
  | 'Auto-entrepreneur' | 'Micro-entreprise' | 'EI' | 'EIRL' | 'Autre';

export type TaxRegime = 'real_normal' | 'real_simplified' | 'micro';
export type VATRegime = 'subject' | 'exempt';

export type BusinessSector = 
  | 'services' | 'commerce' | 'commerce-gros' | 'industrie' | 'agriculture'
  | 'btp' | 'transport' | 'tech' | 'sante' | 'education' | 'restauration'
  | 'immobilier' | 'autres';

export type DocumentTemplate = 'default' | 'modern' | 'classic' | 'minimal';

// Interface structurée pour les paramètres d'entreprise
export interface CompanySettings {
  // INFORMATIONS GÉNÉRALES
  generalInfo: {
    name: string;
    commercialName?: string;
    legalForm?: LegalForm;
    siret?: string;
    apeCode?: string;
    vatNumber?: string;
    shareCapital?: number;
  };

  // ADRESSE & CONTACT
  contact: {
    address: {
      street?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
    correspondenceAddress?: {
      street?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
    phone?: string;
    email?: string;
    website?: string;
  };

  // INFORMATIONS COMPTABLES
  accounting: {
    fiscalYear: {
      startMonth: number;
      endMonth: number;
    };
    taxRegime: TaxRegime;
    vatRegime: VATRegime;
    defaultVatRate: number;
    accountant?: {
      firmName?: string;
      contact?: string;
      email?: string;
      phone?: string;
    };
    mainBank?: {
      name?: string;
      iban?: string;
      bic?: string;
    };
  };

  // PARAMÈTRES MÉTIER
  business: {
    sector?: BusinessSector;
    employeesCount: number;
    annualRevenue?: number;
    currency: string;
    language: string;
    timezone: string;
  };

  // PERSONNALISATION
  branding: {
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    emailSignature?: string;
    legalMentions?: string;
    defaultTermsConditions?: string;
  };

  // DOCUMENTS & TEMPLATES
  documents: {
    templates: {
      invoice: DocumentTemplate;
      quote: DocumentTemplate;
    };
    headers?: string;
    footers?: string;
    numbering: {
      invoicePrefix: string;
      quotePrefix: string;
      format: string;
      counters: {
        invoice: number;
        quote: number;
      };
    };
  };

  // DIRIGEANT
  ceo?: {
    name?: string;
    title?: string;
    email?: string;
  };

  // MÉTADONNÉES
  metadata: {
    settingsCompletedAt?: Date;
    onboardingCompletedAt?: Date;
  };
}

// Utilitaires de transformation
export function mapRowToSettings(row: CompanyRow): CompanySettings {
  return {
    generalInfo: {
      name: row.name || '',
      commercialName: row.legal_name || undefined,
      legalForm: (row.legal_form as LegalForm) || undefined,
      siret: row.siret || undefined,
      apeCode: undefined, // Pas de colonne ape_code
      vatNumber: row.vat_number || undefined,
      shareCapital: row.share_capital ? Number(row.share_capital) : undefined,
    },
    contact: {
      address: {
        street: row.address || undefined,
        postalCode: row.postal_code || undefined,
        city: row.city || undefined,
        country: row.country || undefined,
      },
      correspondenceAddress: undefined, // Pas de colonnes correspondence_address_*
      phone: row.phone || undefined,
      email: row.email || undefined,
      website: row.website || undefined,
    },
    accounting: {
      fiscalYear: {
        startMonth: row.fiscal_year_start_month || 1,
        endMonth: 12, // Calculé: (startMonth + 11) % 12 + 1 ou défaut 12
      },
      taxRegime: 'real_normal', // Pas de colonne tax_regime
      vatRegime: 'subject', // Pas de colonne vat_regime
      defaultVatRate: 20.0, // Pas de colonne vat_rate
      accountant: undefined, // Pas de colonnes accountant_*
      mainBank: undefined, // Pas de colonnes main_bank_*
    },
    business: {
      sector: (row.activity_sector as BusinessSector) || (row.sector as BusinessSector) || undefined,
      employeesCount: row.employee_count ? parseInt(row.employee_count) : 1,
      annualRevenue: undefined, // Pas de colonne annual_revenue
      currency: row.default_currency || 'EUR',
      language: row.default_locale || 'fr',
      timezone: row.timezone || 'Europe/Paris',
    },
    branding: {
      logoUrl: row.logo || undefined,
      primaryColor: '#3B82F6', // Pas de colonnes brand_*
      secondaryColor: '#1E40AF',
      emailSignature: undefined,
      legalMentions: undefined,
      defaultTermsConditions: undefined,
    },
    documents: {
      templates: {
        invoice: 'default', // Pas de colonnes template
        quote: 'default',
      },
      headers: undefined,
      footers: undefined,
      numbering: {
        invoicePrefix: 'FAC',
        quotePrefix: 'DEV',
        format: '{prefix}-{year}-{number:0000}',
        counters: {
          invoice: 1,
          quote: 1,
        },
      },
    },
    ceo: (row.ceo_name || row.ceo_title) ? {
      name: row.ceo_name || undefined,
      title: row.ceo_title || undefined,
      email: undefined, // Pas de colonne ceo_email
    } : undefined,
    metadata: {
      settingsCompletedAt: undefined, // Pas de colonne settings_completed_at
      onboardingCompletedAt: undefined, // Pas de colonne onboarding_completed_at
    },
  };
}

export function mapSettingsToUpdate(settings: Partial<CompanySettings>): CompanyUpdate {
  const update: CompanyUpdate = {};

  if (settings.generalInfo) {
    const { generalInfo } = settings;
    if (generalInfo.name !== undefined) update.name = generalInfo.name;
    if (generalInfo.commercialName !== undefined) update.legal_name = generalInfo.commercialName;
    if (generalInfo.legalForm !== undefined) update.legal_form = generalInfo.legalForm;
    if (generalInfo.siret !== undefined) update.siret = generalInfo.siret;
    // apeCode: pas de colonne
    if (generalInfo.vatNumber !== undefined) update.vat_number = generalInfo.vatNumber;
    if (generalInfo.shareCapital !== undefined) update.share_capital = generalInfo.shareCapital;
  }

  if (settings.contact) {
    const { contact } = settings;
    if (contact.address) {
      if (contact.address.street !== undefined) update.address = contact.address.street;
      if (contact.address.postalCode !== undefined) update.postal_code = contact.address.postalCode;
      if (contact.address.city !== undefined) update.city = contact.address.city;
      if (contact.address.country !== undefined) update.country = contact.address.country;
    }
    // correspondenceAddress: pas de colonnes
    if (contact.phone !== undefined) update.phone = contact.phone;
    if (contact.email !== undefined) update.email = contact.email;
    if (contact.website !== undefined) update.website = contact.website;
  }

  if (settings.accounting) {
    const { accounting } = settings;
    if (accounting.fiscalYear?.startMonth !== undefined) update.fiscal_year_start_month = accounting.fiscalYear.startMonth;
    // fiscal_year_end_month: pas de colonne
    // taxRegime, vatRegime, defaultVatRate: pas de colonnes
    // accountant, mainBank: pas de colonnes
  }

  if (settings.business) {
    const { business } = settings;
    if (business.sector !== undefined) {
      update.activity_sector = business.sector;
      update.sector = business.sector;
    }
    if (business.employeesCount !== undefined) update.employee_count = String(business.employeesCount);
    // annualRevenue: pas de colonne
    if (business.currency !== undefined) update.default_currency = business.currency;
    if (business.language !== undefined) update.default_locale = business.language;
    if (business.timezone !== undefined) update.timezone = business.timezone;
  }

  if (settings.branding) {
    const { branding } = settings;
    if (branding.logoUrl !== undefined) update.logo = branding.logoUrl;
    // primaryColor, secondaryColor, emailSignature, legalMentions, defaultTermsConditions: pas de colonnes
  }

  // documents: pas de colonnes

  if (settings.ceo) {
    const { ceo } = settings;
    if (ceo.name !== undefined) update.ceo_name = ceo.name;
    if (ceo.title !== undefined) update.ceo_title = ceo.title;
    // ceo.email: pas de colonne
  }

  return update;
}

// Valeurs par défaut
export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  generalInfo: {
    name: '',
  },
  contact: {
    address: {},
  },
  accounting: {
    fiscalYear: {
      startMonth: 1,
      endMonth: 12,
    },
    taxRegime: 'real_normal',
    vatRegime: 'subject',
    defaultVatRate: 20.0,
  },
  business: {
    employeesCount: 1,
    currency: 'EUR',
    language: 'fr',
    timezone: 'Europe/Paris',
  },
  branding: {
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
  },
  documents: {
    templates: {
      invoice: 'default',
      quote: 'default',
    },
    numbering: {
      invoicePrefix: 'FAC',
      quotePrefix: 'DEV',
      format: '{prefix}-{year}-{number:0000}',
      counters: {
        invoice: 1,
        quote: 1,
      },
    },
  },
  metadata: {},
};