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

    commercialName: string | null;

    legalForm: LegalForm | null;

    siret: string | null;

    apeCode?: string;

    vatNumber: string | null;

    shareCapital: number | null;

  };



  // ADRESSE & CONTACT

  contact: {

    address: {

      street: string | null;

      postalCode: string | null;

      city: string | null;

      country: string | null;

    };

    correspondenceAddress: {

      street: string | null;

      postalCode: string | null;

      city: string | null;

      country: string | null;

    } | null;

    phone: string | null;

    email: string | null;

    website: string | null;

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

    sector: BusinessSector | null;

    employeesCount: number;

    annualRevenue: number | null;

    currency: string;

    language: string;

    timezone: string;

  };



  // PERSONNALISATION

  branding: {

    logoUrl: string | null;

    primaryColor: string;

    secondaryColor: string;

    emailSignature: string | null;

    legalMentions: string | null;

    defaultTermsConditions: string | null;

  };



  // DOCUMENTS & TEMPLATES

  documents: {

    templates: {

      invoice: DocumentTemplate | null;

      quote: DocumentTemplate | null;

    };

    headers: string | null;

    footers: string | null;

    numbering: {

      invoicePrefix: string | null;

      quotePrefix: string | null;

      format: string | null;

      counters: {

        invoice: number;

        quote: number;

      };

    };

  };



  // DIRIGEANT

  ceo: {

    name: string | null;

    title: string | null;

    email: string | null;

  } | null;



  // MÉTADONNÉES

  metadata: {

    settingsCompletedAt: Date | null;

    onboardingCompletedAt: Date | null;

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

      commercialName: (r.commercial_name as string) ?? null,

      legalForm: (r.legal_form as LegalForm) ?? null,

      siret: r.siret ?? null,

      apeCode: undefined, // 'ape_code' n'existe pas

      vatNumber: r.vat_number ?? null,

      shareCapital: r.share_capital ?? null,

    },

    contact: {

      address: {

        street: r.address ?? null,

        postalCode: r.postal_code ?? null,

        city: r.city ?? null,

        country: r.country ?? null,

      },

      correspondenceAddress: null, // Pas de colonnes de correspondance en base

      phone: r.phone ?? null,

      email: r.email ?? null,

      website: r.website ?? null,

    },

    accounting: {

      fiscalYear: {

        startMonth: r.fiscal_year_start_month || 1,

        endMonth: 12, // 'fiscal_year_end_month' n'existe pas - default to December

      },

      taxRegime: 'real_normal' as TaxRegime, // 'tax_regime' n'existe pas - default

      vatRegime: 'subject' as VATRegime, // 'vat_regime' n'existe pas - default

      defaultVatRate: 20, // 'vat_rate' n'existe pas - default 20%

      accountant: undefined, // Pas de colonnes accountant en base

      mainBank: undefined, // Pas de colonnes mainBank en base

    },

    business: {

      sector: (r.activity_sector as BusinessSector) ?? null, // 'activity_sector' existe

      employeesCount: parseInt(String(r.employee_count || '1'), 10) || 1, // 'employee_count' existe

      annualRevenue: (r.annual_revenue as number) ?? null,

      currency: r.default_currency || 'EUR',

      language: r.default_locale || 'fr',

      timezone: r.timezone || 'Europe/Paris',

    },

    branding: {

      logoUrl: (r.logo as string) ?? null, // 'logo' existe

      primaryColor: (r.brand_primary_color as string) || '#3B82F6',

      secondaryColor: (r.brand_secondary_color as string) || '#1E40AF',

      emailSignature: null, // 'email_signature' n'existe pas

      legalMentions: null, // 'legal_mentions' n'existe pas

      defaultTermsConditions: null, // 'default_terms_conditions' n'existe pas

    },

    documents: {

      templates: {

        invoice: (r.invoice_template as DocumentTemplate) ?? null,

        quote: (r.quote_template as DocumentTemplate) ?? null,

      },

      headers: (r.document_header as string) ?? null,

      footers: (r.document_footer as string) ?? null,

      numbering: {

        invoicePrefix: (r.invoice_prefix as string) ?? null,

        quotePrefix: (r.quote_prefix as string) ?? null,

        format: (r.numbering_format as string) ?? null,

        counters: {

          invoice: 1, // Valeurs par défaut

          quote: 1,

        },

      },

    },

    ceo: r.ceo_name || r.ceo_title || r.ceo_email ? {

      name: r.ceo_name ?? null,

      title: r.ceo_title ?? null,

      email: (r.ceo_email as string) ?? null,

    } : null,

    metadata: {

      settingsCompletedAt: (r.settings_completed_at as string) ? new Date(r.settings_completed_at as string) : null,

      onboardingCompletedAt: r.onboarding_completed_at ? new Date(r.onboarding_completed_at) : null,

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

    // 'commercialName' n'existe pas en base, on la stocke dans 'legal_name' ou on l'ignore
    // if (generalInfo.commercialName !== undefined) update.commercial_name = generalInfo.commercialName;

    if (generalInfo.legalForm !== undefined) update.legal_form = generalInfo.legalForm;

    if (generalInfo.siret !== undefined) update.siret = generalInfo.siret;

    // 'apeCode' n'existe pas en base (activité_sector existe)
    // if (generalInfo.apeCode !== undefined) update.ape_code = generalInfo.apeCode;

    if (generalInfo.vatNumber !== undefined) update.vat_number = generalInfo.vatNumber;

    if (generalInfo.shareCapital !== undefined) update.share_capital = generalInfo.shareCapital;

  }



  if (settings.contact) {

    const { contact } = settings;

    if (contact.address) {

      // La base de données stocke l'adresse dans un champ unique 'address'
      // On concatène les champs individuels
      const addressParts: string[] = [];
      if (contact.address.street) addressParts.push(contact.address.street);
      if (contact.address.city) addressParts.push(contact.address.city);
      if (contact.address.postalCode) addressParts.push(contact.address.postalCode);
      if (contact.address.country) addressParts.push(contact.address.country);
      
      if (addressParts.length > 0 && contact.address.street !== undefined) {
        update.address = contact.address.street;
      }
      if (contact.address.postalCode !== undefined) update.postal_code = contact.address.postalCode;
      if (contact.address.city !== undefined) update.city = contact.address.city;
      if (contact.address.country !== undefined) update.country = contact.address.country;

    }

    // Note: correspondenceAddress n'a pas de colonnes équivalentes en base
    // Les données de correspondance sont stockées dans 'address', 'city', 'postal_code'

    if (contact.phone !== undefined) update.phone = contact.phone;
    if (contact.email !== undefined) update.email = contact.email;
    if (contact.website !== undefined) update.website = contact.website;

  }



  if (settings.accounting) {

    const { accounting } = settings;

    if (accounting.fiscalYear?.startMonth !== undefined) update.fiscal_year_start_month = accounting.fiscalYear.startMonth;

    // 'fiscalYear.endMonth' n'existe pas en base
    // if (accounting.fiscalYear?.endMonth !== undefined) update.fiscal_year_end_month = accounting.fiscalYear.endMonth;

    // 'taxRegime', 'vatRegime', 'vat_rate' n'existent pas en base - ces données ne sont pas stockées dans 'companies'
    // if (accounting.taxRegime !== undefined) update.tax_regime = accounting.taxRegime;
    // if (accounting.vatRegime !== undefined) update.vat_regime = accounting.vatRegime;
    // if (accounting.defaultVatRate !== undefined) update.vat_rate = accounting.defaultVatRate;

    // Les informations comptables sont peut-être dans une autre table ou ne sont pas persistées
    // if (accounting.accountant?.firmName !== undefined) update.accountant_firm_name = accounting.accountant.firmName;
    // if (accounting.accountant?.contact !== undefined) update.accountant_contact = accounting.accountant.contact;
    // if (accounting.accountant?.email !== undefined) update.accountant_email = accounting.accountant.email;
    // if (accounting.accountant?.phone !== undefined) update.accountant_phone = accounting.accountant.phone;
    // if (accounting.mainBank?.name !== undefined) update.main_bank_name = accounting.mainBank.name;
    // if (accounting.mainBank?.iban !== undefined) update.main_bank_iban = accounting.mainBank.iban;
    // if (accounting.mainBank?.bic !== undefined) update.main_bank_bic = accounting.mainBank.bic;

  }



  if (settings.business) {

    const { business } = settings;

    if (business.sector !== undefined) update.activity_sector = business.sector; // 'activity_sector' existe

    if (business.employeesCount !== undefined) update.employee_count = String(business.employeesCount); // employee_count existe comme TEXT


    if (business.annualRevenue !== undefined) update.annual_revenue = business.annualRevenue;

    if (business.currency !== undefined) update.default_currency = business.currency;

    if (business.language !== undefined) {

      // 'interface_language' n'existe pas, on ignore
      // update.interface_language = business.language;
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
    commercialName: null,
    legalForm: null,
    siret: null,
    vatNumber: null,
    shareCapital: null,

  },

  contact: {

    address: {
      street: null,
      postalCode: null,
      city: null,
      country: null,
    },
    correspondenceAddress: null,
    phone: null,
    email: null,
    website: null,

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

    sector: null,

    employeesCount: 1,

    annualRevenue: null,

    currency: 'EUR',

    language: 'fr',

    timezone: 'Europe/Paris',

  },

  branding: {

    logoUrl: null,
    primaryColor: '#3B82F6',

    secondaryColor: '#1E40AF',

    emailSignature: null,

    legalMentions: null,

    defaultTermsConditions: null,

  },

  documents: {

    templates: {

      invoice: 'default',

      quote: 'default',

    },

    headers: null,

    footers: null,

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

  ceo: null,

  metadata: {
    settingsCompletedAt: null,
    onboardingCompletedAt: null,
  },

};
