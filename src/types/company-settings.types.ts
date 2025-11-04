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
      name: row.name,
      commercialName: row.commercial_name || undefined,
      legalForm: (row.legal_form as LegalForm) || undefined,
      siret: row.siret || undefined,
      apeCode: row.ape_code || undefined,
      vatNumber: row.vat_number || undefined,
      shareCapital: row.share_capital || undefined,
    },
    contact: {
      address: {
        street: row.address_street || undefined,
        postalCode: row.address_postal_code || undefined,
        city: row.address_city || undefined,
        country: row.address_country || undefined,
      },
      correspondenceAddress: (row.correspondence_address_street || 
                             row.correspondence_address_postal_code || 
                             row.correspondence_address_city || 
                             row.correspondence_address_country) ? {
        street: row.correspondence_address_street || undefined,
        postalCode: row.correspondence_address_postal_code || undefined,
        city: row.correspondence_address_city || undefined,
        country: row.correspondence_address_country || undefined,
      } : undefined,
      phone: row.phone || undefined,
      email: row.email || undefined,
      website: row.website || undefined,
    },
    accounting: {
      fiscalYear: {
        startMonth: row.fiscal_year_start_month || 1,
        endMonth: row.fiscal_year_end_month || 12,
      },
      taxRegime: (row.tax_regime as TaxRegime) || 'real_normal',
      vatRegime: (row.vat_regime as VATRegime) || 'subject',
      defaultVatRate: row.vat_rate || 20.0,
      accountant: (row.accountant_firm_name || row.accountant_contact || 
                   row.accountant_email || row.accountant_phone) ? {
        firmName: row.accountant_firm_name || undefined,
        contact: row.accountant_contact || undefined,
        email: row.accountant_email || undefined,
        phone: row.accountant_phone || undefined,
      } : undefined,
      mainBank: (row.main_bank_name || row.main_bank_iban || row.main_bank_bic) ? {
        name: row.main_bank_name || undefined,
        iban: row.main_bank_iban || undefined,
        bic: row.main_bank_bic || undefined,
      } : undefined,
    },
    business: {
      sector: (row.business_sector as BusinessSector) || undefined,
      employeesCount: row.employees_count || 1,
      annualRevenue: row.annual_revenue || undefined,
      currency: row.default_currency || 'EUR',
      language: row.interface_language || row.default_locale || 'fr',
      timezone: row.timezone || 'Europe/Paris',
    },
    branding: {
      logoUrl: row.logo_url || undefined,
      primaryColor: row.brand_primary_color || '#3B82F6',
      secondaryColor: row.brand_secondary_color || '#1E40AF',
      emailSignature: row.email_signature || undefined,
      legalMentions: row.legal_mentions || undefined,
      defaultTermsConditions: row.default_terms_conditions || undefined,
    },
    documents: {
      templates: {
        invoice: (row.invoice_template as DocumentTemplate) || 'default',
        quote: (row.quote_template as DocumentTemplate) || 'default',
      },
      headers: row.document_header || undefined,
      footers: row.document_footer || undefined,
      numbering: {
        invoicePrefix: row.invoice_prefix || 'FAC',
        quotePrefix: row.quote_prefix || 'DEV',
        format: row.numbering_format || '{prefix}-{year}-{number:0000}',
        counters: {
          invoice: row.invoice_counter || 1,
          quote: row.quote_counter || 1,
        },
      },
    },
    ceo: (row.ceo_name || row.ceo_title || row.ceo_email) ? {
      name: row.ceo_name || undefined,
      title: row.ceo_title || undefined,
      email: row.ceo_email || undefined,
    } : undefined,
    metadata: {
      settingsCompletedAt: row.settings_completed_at ? new Date(row.settings_completed_at) : undefined,
      onboardingCompletedAt: row.onboarding_completed_at ? new Date(row.onboarding_completed_at) : undefined,
    },
  };
}

export function mapSettingsToUpdate(settings: Partial<CompanySettings>): CompanyUpdate {
  const update: CompanyUpdate = {};

  if (settings.generalInfo) {
    const { generalInfo } = settings;
    if (generalInfo.name !== undefined) update.name = generalInfo.name;
    if (generalInfo.commercialName !== undefined) update.commercial_name = generalInfo.commercialName;
    if (generalInfo.legalForm !== undefined) update.legal_form = generalInfo.legalForm;
    if (generalInfo.siret !== undefined) update.siret = generalInfo.siret;
    if (generalInfo.apeCode !== undefined) update.ape_code = generalInfo.apeCode;
    if (generalInfo.vatNumber !== undefined) update.vat_number = generalInfo.vatNumber;
    if (generalInfo.shareCapital !== undefined) update.share_capital = generalInfo.shareCapital;
  }

  if (settings.contact) {
    const { contact } = settings;
    if (contact.address) {
      if (contact.address.street !== undefined) update.address_street = contact.address.street;
      if (contact.address.postalCode !== undefined) update.address_postal_code = contact.address.postalCode;
      if (contact.address.city !== undefined) update.address_city = contact.address.city;
      if (contact.address.country !== undefined) update.address_country = contact.address.country;
    }
    if (contact.correspondenceAddress) {
      if (contact.correspondenceAddress.street !== undefined) update.correspondence_address_street = contact.correspondenceAddress.street;
      if (contact.correspondenceAddress.postalCode !== undefined) update.correspondence_address_postal_code = contact.correspondenceAddress.postalCode;
      if (contact.correspondenceAddress.city !== undefined) update.correspondence_address_city = contact.correspondenceAddress.city;
      if (contact.correspondenceAddress.country !== undefined) update.correspondence_address_country = contact.correspondenceAddress.country;
    }
    if (contact.phone !== undefined) update.phone = contact.phone;
    if (contact.email !== undefined) update.email = contact.email;
    if (contact.website !== undefined) update.website = contact.website;
  }

  if (settings.accounting) {
    const { accounting } = settings;
    if (accounting.fiscalYear?.startMonth !== undefined) update.fiscal_year_start_month = accounting.fiscalYear.startMonth;
    if (accounting.fiscalYear?.endMonth !== undefined) update.fiscal_year_end_month = accounting.fiscalYear.endMonth;
    if (accounting.taxRegime !== undefined) update.tax_regime = accounting.taxRegime;
    if (accounting.vatRegime !== undefined) update.vat_regime = accounting.vatRegime;
    if (accounting.defaultVatRate !== undefined) update.vat_rate = accounting.defaultVatRate;
    if (accounting.accountant?.firmName !== undefined) update.accountant_firm_name = accounting.accountant.firmName;
    if (accounting.accountant?.contact !== undefined) update.accountant_contact = accounting.accountant.contact;
    if (accounting.accountant?.email !== undefined) update.accountant_email = accounting.accountant.email;
    if (accounting.accountant?.phone !== undefined) update.accountant_phone = accounting.accountant.phone;
    if (accounting.mainBank?.name !== undefined) update.main_bank_name = accounting.mainBank.name;
    if (accounting.mainBank?.iban !== undefined) update.main_bank_iban = accounting.mainBank.iban;
    if (accounting.mainBank?.bic !== undefined) update.main_bank_bic = accounting.mainBank.bic;
  }

  if (settings.business) {
    const { business } = settings;
    if (business.sector !== undefined) update.business_sector = business.sector;
    if (business.employeesCount !== undefined) update.employees_count = business.employeesCount;
    if (business.annualRevenue !== undefined) update.annual_revenue = business.annualRevenue;
    if (business.currency !== undefined) update.default_currency = business.currency;
    if (business.language !== undefined) {
      update.interface_language = business.language;
      update.default_locale = business.language;
    }
    if (business.timezone !== undefined) update.timezone = business.timezone;
  }

  if (settings.branding) {
    const { branding } = settings;
    if (branding.logoUrl !== undefined) update.logo_url = branding.logoUrl;
    if (branding.primaryColor !== undefined) update.brand_primary_color = branding.primaryColor;
    if (branding.secondaryColor !== undefined) update.brand_secondary_color = branding.secondaryColor;
    if (branding.emailSignature !== undefined) update.email_signature = branding.emailSignature;
    if (branding.legalMentions !== undefined) update.legal_mentions = branding.legalMentions;
    if (branding.defaultTermsConditions !== undefined) update.default_terms_conditions = branding.defaultTermsConditions;
  }

  if (settings.documents) {
    const { documents } = settings;
    if (documents.templates?.invoice !== undefined) update.invoice_template = documents.templates.invoice;
    if (documents.templates?.quote !== undefined) update.quote_template = documents.templates.quote;
    if (documents.headers !== undefined) update.document_header = documents.headers;
    if (documents.footers !== undefined) update.document_footer = documents.footers;
    if (documents.numbering?.invoicePrefix !== undefined) update.invoice_prefix = documents.numbering.invoicePrefix;
    if (documents.numbering?.quotePrefix !== undefined) update.quote_prefix = documents.numbering.quotePrefix;
    if (documents.numbering?.format !== undefined) update.numbering_format = documents.numbering.format;
    if (documents.numbering?.counters?.invoice !== undefined) update.invoice_counter = documents.numbering.counters.invoice;
    if (documents.numbering?.counters?.quote !== undefined) update.quote_counter = documents.numbering.counters.quote;
  }

  if (settings.ceo) {
    const { ceo } = settings;
    if (ceo.name !== undefined) update.ceo_name = ceo.name;
    if (ceo.title !== undefined) update.ceo_title = ceo.title;
    if (ceo.email !== undefined) update.ceo_email = ceo.email;
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
