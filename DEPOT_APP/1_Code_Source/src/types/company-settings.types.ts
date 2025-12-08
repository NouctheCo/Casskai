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



// Type étendu pour les propriétés additionnelles qui peuvent exister dans la DB mais pas encore dans le schéma TS
type ExtendedCompanyRow = CompanyRow & Record<string, unknown>;

// Utilitaires de transformation

export function mapRowToSettings(row: CompanyRow): CompanySettings {

  // Cast to extended type to access potential additional properties
  const r = row as ExtendedCompanyRow;

  return {

    generalInfo: {

      name: r.name,

      commercialName: (r.commercial_name as string) || undefined,

      legalForm: (r.legal_form as LegalForm) || undefined,

      siret: r.siret || undefined,

      apeCode: (r.ape_code as string) || undefined,

      vatNumber: r.vat_number || undefined,

      shareCapital: r.share_capital || undefined,

    },

    contact: {

      address: {

        street: (r.address_street as string) || r.address || undefined,

        postalCode: (r.address_postal_code as string) || r.postal_code || undefined,

        city: (r.address_city as string) || r.city || undefined,

        country: (r.address_country as string) || r.country || undefined,

      },

      correspondenceAddress: ((r.correspondence_address_street as string) || 

                             (r.correspondence_address_postal_code as string) || 

                             (r.correspondence_address_city as string) || 

                             (r.correspondence_address_country as string)) ? {

        street: (r.correspondence_address_street as string) || undefined,

        postalCode: (r.correspondence_address_postal_code as string) || undefined,

        city: (r.correspondence_address_city as string) || undefined,

        country: (r.correspondence_address_country as string) || undefined,

      } : undefined,

      phone: r.phone || undefined,

      email: r.email || undefined,

      website: r.website || undefined,

    },

    accounting: {

      fiscalYear: {

        startMonth: r.fiscal_year_start_month || 1,

        endMonth: (r.fiscal_year_end_month as number) || 12,

      },

      taxRegime: ((r.tax_regime as string) as TaxRegime) || 'real_normal',

      vatRegime: ((r.vat_regime as string) as VATRegime) || 'subject',

      defaultVatRate: (r.vat_rate as number) || 20.0,

      accountant: ((r.accountant_firm_name as string) || (r.accountant_contact as string) || 

                   (r.accountant_email as string) || (r.accountant_phone as string)) ? {

        firmName: (r.accountant_firm_name as string) || undefined,

        contact: (r.accountant_contact as string) || undefined,

        email: (r.accountant_email as string) || undefined,

        phone: (r.accountant_phone as string) || undefined,

      } : undefined,

      mainBank: ((r.main_bank_name as string) || (r.main_bank_iban as string) || (r.main_bank_bic as string)) ? {

        name: (r.main_bank_name as string) || undefined,

        iban: (r.main_bank_iban as string) || undefined,

        bic: (r.main_bank_bic as string) || undefined,

      } : undefined,

    },

    business: {

      sector: ((r.business_sector as string) as BusinessSector) || undefined,

      employeesCount: parseInt(String(r.employees_count || r.employee_count || '1'), 10) || 1,

      annualRevenue: (r.annual_revenue as number) || undefined,

      currency: r.default_currency || 'EUR',

      language: (r.interface_language as string) || r.default_locale || 'fr',

      timezone: r.timezone || 'Europe/Paris',

    },

    branding: {

      logoUrl: (r.logo_url as string) || r.logo || undefined,

      primaryColor: (r.brand_primary_color as string) || '#3B82F6',

      secondaryColor: (r.brand_secondary_color as string) || '#1E40AF',

      emailSignature: (r.email_signature as string) || undefined,

      legalMentions: (r.legal_mentions as string) || undefined,

      defaultTermsConditions: (r.default_terms_conditions as string) || undefined,

    },

    documents: {

      templates: {

        invoice: ((r.invoice_template as string) as DocumentTemplate) || 'default',

        quote: ((r.quote_template as string) as DocumentTemplate) || 'default',

      },

      headers: (r.document_header as string) || undefined,

      footers: (r.document_footer as string) || undefined,

      numbering: {

        invoicePrefix: (r.invoice_prefix as string) || 'FAC',

        quotePrefix: (r.quote_prefix as string) || 'DEV',

        format: (r.numbering_format as string) || '{prefix}-{year}-{number:0000}',

        counters: {

          invoice: (r.invoice_counter as number) || 1,

          quote: (r.quote_counter as number) || 1,

        },

      },

    },

    ceo: (r.ceo_name || r.ceo_title || (r.ceo_email as string)) ? {

      name: r.ceo_name || undefined,

      title: r.ceo_title || undefined,

      email: (r.ceo_email as string) || undefined,

    } : undefined,

    metadata: {

      settingsCompletedAt: (r.settings_completed_at as string) ? new Date(r.settings_completed_at as string) : undefined,

      onboardingCompletedAt: r.onboarding_completed_at ? new Date(r.onboarding_completed_at) : undefined,

    },

  };

}



// Type étendu pour les mises à jour avec propriétés additionnelles
type ExtendedCompanyUpdate = CompanyUpdate & Record<string, unknown>;

export function mapSettingsToUpdate(settings: Partial<CompanySettings>): ExtendedCompanyUpdate {

  const update: ExtendedCompanyUpdate = {};



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
