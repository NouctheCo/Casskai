// Core tables: companies, user_companies, roles, permissions, role_permissions
export interface CoreTables {
  companies: {
    Row: {
      id: string
      name: string
      created_at: string
      updated_at: string
      stripe_customer_id: string | null
      stripe_subscription_id: string | null
      country: string | null
      default_currency: string | null
      is_active: boolean | null
      group_id: string | null
      default_locale: string | null
      timezone: string | null
      // INFORMATIONS GÉNÉRALES
      legal_form: string | null
      commercial_name: string | null
      siret: string | null
      ape_code: string | null
      vat_number: string | null
      share_capital: number | null
      // ADRESSE & CONTACT
      address_street: string | null
      address_postal_code: string | null
      address_city: string | null
      address_country: string | null
      correspondence_address_street: string | null
      correspondence_address_postal_code: string | null
      correspondence_address_city: string | null
      correspondence_address_country: string | null
      phone: string | null
      email: string | null
      website: string | null
      // INFORMATIONS COMPTABLES
      fiscal_year_start_month: number | null
      fiscal_year_end_month: number | null
      tax_regime: string | null
      vat_regime: string | null
      vat_rate: number | null
      accountant_firm_name: string | null
      accountant_contact: string | null
      accountant_email: string | null
      accountant_phone: string | null
      main_bank_name: string | null
      main_bank_iban: string | null
      main_bank_bic: string | null
      // PARAMÈTRES MÉTIER
      business_sector: string | null
      employees_count: number | null
      annual_revenue: number | null
      interface_language: string | null
      // PERSONNALISATION
      logo_url: string | null
      brand_primary_color: string | null
      brand_secondary_color: string | null
      email_signature: string | null
      legal_mentions: string | null
      default_terms_conditions: string | null
      // DOCUMENTS & TEMPLATES
      invoice_template: string | null
      quote_template: string | null
      document_header: string | null
      document_footer: string | null
      invoice_prefix: string | null
      quote_prefix: string | null
      invoice_counter: number | null
      quote_counter: number | null
      numbering_format: string | null
      // DIRIGEANT
      ceo_name: string | null
      ceo_title: string | null
      ceo_email: string | null
      // MÉTADONNÉES
      settings_completed_at: string | null
      onboarding_completed_at: string | null
    }
    Insert: {
      id?: string
      name: string
      created_at?: string
      updated_at?: string
      stripe_customer_id?: string | null
      stripe_subscription_id?: string | null
      country?: string | null
      default_currency?: string | null
      is_active?: boolean | null
      group_id?: string | null
      default_locale?: string | null
      timezone?: string | null
      // INFORMATIONS GÉNÉRALES
      legal_form?: string | null
      commercial_name?: string | null
      siret?: string | null
      ape_code?: string | null
      vat_number?: string | null
      share_capital?: number | null
      // ADRESSE & CONTACT
      address_street?: string | null
      address_postal_code?: string | null
      address_city?: string | null
      address_country?: string | null
      correspondence_address_street?: string | null
      correspondence_address_postal_code?: string | null
      correspondence_address_city?: string | null
      correspondence_address_country?: string | null
      phone?: string | null
      email?: string | null
      website?: string | null
      // INFORMATIONS COMPTABLES
      fiscal_year_start_month?: number | null
      fiscal_year_end_month?: number | null
      tax_regime?: string | null
      vat_regime?: string | null
      vat_rate?: number | null
      accountant_firm_name?: string | null
      accountant_contact?: string | null
      accountant_email?: string | null
      accountant_phone?: string | null
      main_bank_name?: string | null
      main_bank_iban?: string | null
      main_bank_bic?: string | null
      // PARAMÈTRES MÉTIER
      business_sector?: string | null
      employees_count?: number | null
      annual_revenue?: number | null
      interface_language?: string | null
      // PERSONNALISATION
      logo_url?: string | null
      brand_primary_color?: string | null
      brand_secondary_color?: string | null
      email_signature?: string | null
      legal_mentions?: string | null
      default_terms_conditions?: string | null
      // DOCUMENTS & TEMPLATES
      invoice_template?: string | null
      quote_template?: string | null
      document_header?: string | null
      document_footer?: string | null
      invoice_prefix?: string | null
      quote_prefix?: string | null
      invoice_counter?: number | null
      quote_counter?: number | null
      numbering_format?: string | null
      // DIRIGEANT
      ceo_name?: string | null
      ceo_title?: string | null
      ceo_email?: string | null
      // MÉTADONNÉES
      settings_completed_at?: string | null
      onboarding_completed_at?: string | null
    }
    Update: {
      id?: string
      name?: string
      created_at?: string
      updated_at?: string
      stripe_customer_id?: string | null
      stripe_subscription_id?: string | null
      country?: string | null
      default_currency?: string | null
      is_active?: boolean | null
      group_id?: string | null
      default_locale?: string | null
      timezone?: string | null
      // INFORMATIONS GÉNÉRALES
      legal_form?: string | null
      commercial_name?: string | null
      siret?: string | null
      ape_code?: string | null
      vat_number?: string | null
      share_capital?: number | null
      // ADRESSE & CONTACT
      address_street?: string | null
      address_postal_code?: string | null
      address_city?: string | null
      address_country?: string | null
      correspondence_address_street?: string | null
      correspondence_address_postal_code?: string | null
      correspondence_address_city?: string | null
      correspondence_address_country?: string | null
      phone?: string | null
      email?: string | null
      website?: string | null
      // INFORMATIONS COMPTABLES
      fiscal_year_start_month?: number | null
      fiscal_year_end_month?: number | null
      tax_regime?: string | null
      vat_regime?: string | null
      vat_rate?: number | null
      accountant_firm_name?: string | null
      accountant_contact?: string | null
      accountant_email?: string | null
      accountant_phone?: string | null
      main_bank_name?: string | null
      main_bank_iban?: string | null
      main_bank_bic?: string | null
      // PARAMÈTRES MÉTIER
      business_sector?: string | null
      employees_count?: number | null
      annual_revenue?: number | null
      interface_language?: string | null
      // PERSONNALISATION
      logo_url?: string | null
      brand_primary_color?: string | null
      brand_secondary_color?: string | null
      email_signature?: string | null
      legal_mentions?: string | null
      default_terms_conditions?: string | null
      // DOCUMENTS & TEMPLATES
      invoice_template?: string | null
      quote_template?: string | null
      document_header?: string | null
      document_footer?: string | null
      invoice_prefix?: string | null
      quote_prefix?: string | null
      invoice_counter?: number | null
      quote_counter?: number | null
      numbering_format?: string | null
      // DIRIGEANT
      ceo_name?: string | null
      ceo_title?: string | null
      ceo_email?: string | null
      // MÉTADONNÉES
      settings_completed_at?: string | null
      onboarding_completed_at?: string | null
    }
  }
  user_companies: {
    Row: {
      id: string
      user_id: string
      company_id: string
      role_id: string
      is_default: boolean | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      company_id: string
      role_id: string
      is_default?: boolean | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      company_id?: string
      role_id?: string
      is_default?: boolean | null
      created_at?: string
      updated_at?: string
    }
  }
  roles: {
    Row: {
      id: string
      name: string
      description: string | null
      company_id: string | null
      is_system_role: boolean | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      description?: string | null
      company_id?: string | null
      is_system_role?: boolean | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      description?: string | null
      company_id?: string | null
      is_system_role?: boolean | null
      created_at?: string
      updated_at?: string
    }
  }
  permissions: {
    Row: {
      id: string
      name: string
      description: string | null
      module: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      name: string
      description?: string | null
      module?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      name?: string
      description?: string | null
      module?: string | null
      created_at?: string
      updated_at?: string
    }
  }
  role_permissions: {
    Row: {
      id: string
      role_id: string
      permission_id: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      role_id: string
      permission_id: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      role_id?: string
      permission_id?: string
      created_at?: string
      updated_at?: string
    }
  }
  accounting_experts_access: {
    Row: {
      id: string
      expert_user_id: string
      company_id: string
      can_validate: boolean | null
      access_level: string | null
      granted_by: string | null
      created_at: string | null
    }
    Insert: {
      id?: string
      expert_user_id: string
      company_id: string
      can_validate?: boolean | null
      access_level?: string | null
      granted_by?: string | null
      created_at?: string | null
    }
    Update: {
      id?: string
      expert_user_id?: string
      company_id?: string
      can_validate?: boolean | null
      access_level?: string | null
      granted_by?: string | null
      created_at?: string | null
    }
  }
  user_roles: {
    Row: {
      id: string
      user_id: string | null
      role_id: string | null
      company_id: string | null
      assigned_by: string | null
      assigned_at: string | null
    }
    Insert: {
      id?: string
      user_id?: string | null
      role_id?: string | null
      company_id?: string | null
      assigned_by?: string | null
      assigned_at?: string | null
    }
    Update: {
      id?: string
      user_id?: string | null
      role_id?: string | null
      company_id?: string | null
      assigned_by?: string | null
      assigned_at?: string | null
    }
  }
}
