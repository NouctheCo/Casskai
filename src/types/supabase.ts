export type Json =

  | string

  | number

  | boolean

  | null

  | { [key: string]: Json | undefined }

  | Json[]



export interface Database {

  public: {

    Tables: {

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

          accounting_standard: string | null

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

          accounting_standard?: string | null

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

          accounting_standard?: string | null

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

      accounts: {

        Row: {

          id: string

          company_id: string

          account_number: string

          name: string

          type: string

          description: string | null

          is_active: boolean | null

          balance: number | null

          currency: string

          created_at: string | null

          updated_at: string | null

          code: string | null

          label: string | null

          parent_code: string | null

          class: number | null

          tva_type: string | null

          imported_from_fec: boolean | null

        }

        Insert: {

          id?: string

          company_id: string

          account_number: string

          name: string

          type: string

          description?: string | null

          is_active?: boolean | null

          balance?: number | null

          currency: string

          created_at?: string | null

          updated_at?: string | null

          code?: string | null

          label?: string | null

          parent_code?: string | null

          class?: number | null

          tva_type?: string | null

          imported_from_fec?: boolean | null

        }

        Update: {

          id?: string

          company_id?: string

          account_number?: string

          name?: string

          type?: string

          description?: string | null

          is_active?: boolean | null

          balance?: number | null

          currency?: string

          created_at?: string | null

          updated_at?: string | null

          code?: string | null

          label?: string | null

          parent_code?: string | null

          class?: number | null

          tva_type?: string | null

          imported_from_fec?: boolean | null

        }

      }

      chart_of_accounts: {

        Row: {

          id: string

          company_id: string

          account_number: string

          account_name: string

          account_type: string

          parent_account_id: string | null

          level: number | null

          is_active: boolean | null

          balance_debit: number | null

          balance_credit: number | null

          current_balance: number | null

          description: string | null

          created_at: string | null

          updated_at: string | null

          account_class: number | null

          is_detail_account: boolean | null

        }

        Insert: {

          id?: string

          company_id: string

          account_number: string

          account_name: string

          account_type: string

          parent_account_id?: string | null

          level?: number | null

          is_active?: boolean | null

          balance_debit?: number | null

          balance_credit?: number | null

          current_balance?: number | null

          description?: string | null

          created_at?: string | null

          updated_at?: string | null

          account_class?: number | null

          is_detail_account?: boolean | null

        }

        Update: {

          id?: string

          company_id?: string

          account_number?: string

          account_name?: string

          account_type?: string

          parent_account_id?: string | null

          level?: number | null

          is_active?: boolean | null

          balance_debit?: number | null

          balance_credit?: number | null

          current_balance?: number | null

          description?: string | null

          created_at?: string | null

          updated_at?: string | null

          account_class?: number | null

          is_detail_account?: boolean | null

        }

      }

      journals: {

        Row: {

          id: string

          company_id: string

          code: string

          name: string

          type: string

          description: string | null

          is_active: boolean | null

          last_entry_number: number | null

          created_at: string | null

          updated_at: string | null

          imported_from_fec: boolean | null

        }

        Insert: {

          id?: string

          company_id: string

          code: string

          name: string

          type: string

          description?: string | null

          is_active?: boolean | null

          last_entry_number?: number | null

          created_at?: string | null

          updated_at?: string | null

          imported_from_fec?: boolean | null

        }

        Update: {

          id?: string

          company_id?: string

          code?: string

          name?: string

          type?: string

          description?: string | null

          is_active?: boolean | null

          last_entry_number?: number | null

          created_at?: string | null

          updated_at?: string | null

          imported_from_fec?: boolean | null

        }

      }

      journal_entries: {

        Row: {

          id: string

          company_id: string

          entry_date: string

          description: string

          reference_number: string | null

          journal_id: string | null

          created_at: string | null

          updated_at: string | null

          entry_number: string | null

          status: string | null

          imported_from_fec: boolean | null

          original_fec_data: Json | null

          fec_journal_code: string | null

          fec_entry_num: string | null

        }

        Insert: {

          id?: string

          company_id: string

          entry_date: string

          description: string

          reference_number?: string | null

          journal_id?: string | null

          created_at?: string | null

          updated_at?: string | null

          entry_number?: string | null

          status?: string | null

          imported_from_fec?: boolean | null

          original_fec_data?: Json | null

          fec_journal_code?: string | null

          fec_entry_num?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          entry_date?: string

          description?: string

          reference_number?: string | null

          journal_id?: string | null

          created_at?: string | null

          updated_at?: string | null

          entry_number?: string | null

          status?: string | null

          imported_from_fec?: boolean | null

          original_fec_data?: Json | null

          fec_journal_code?: string | null

          fec_entry_num?: string | null

        }

      }

      journal_entry_lines: {

        Row: {

          id: string

          journal_entry_id: string

          account_id: string

          description: string

          debit_amount: number

          credit_amount: number

          line_order: number | null

          created_at: string | null

          account_number: string | null

          account_name: string | null

        }

        Insert: {

          id?: string

          journal_entry_id: string

          account_id: string

          description: string

          debit_amount?: number

          credit_amount?: number

          line_order?: number | null

          created_at?: string | null

          account_number?: string | null

          account_name?: string | null

        }

        Update: {

          id?: string

          journal_entry_id?: string

          account_id?: string

          description?: string

          debit_amount?: number

          credit_amount?: number

          line_order?: number | null

          created_at?: string | null

          account_number?: string | null

          account_name?: string | null

        }

      }

      journal_lines: {

        Row: {

          id: string

          journal_entry_id: string

          account_id: string

          debit: number | null

          credit: number | null

          currency: string | null

          description: string | null

          client_id: string | null

          supplier_id: string | null

          tax_id: string | null

          invoice_id: string | null

          expense_id: string | null

          created_at: string | null

        }

        Insert: {

          id?: string

          journal_entry_id: string

          account_id: string

          debit?: number | null

          credit?: number | null

          currency?: string | null

          description?: string | null

          client_id?: string | null

          supplier_id?: string | null

          tax_id?: string | null

          invoice_id?: string | null

          expense_id?: string | null

          created_at?: string | null

        }

        Update: {

          id?: string

          journal_entry_id?: string

          account_id?: string

          debit?: number | null

          credit?: number | null

          currency?: string | null

          description?: string | null

          client_id?: string | null

          supplier_id?: string | null

          tax_id?: string | null

          invoice_id?: string | null

          expense_id?: string | null

          created_at?: string | null

        }

      }

      third_parties: {

        Row: {

          id: string

          company_id: string

          name: string

          email: string | null

          phone: string | null

          address: string | null

          city: string | null

          postal_code: string | null

          country: string | null

          tax_number: string | null

          type: string

          is_active: boolean | null

          balance: number | null

          notes: string | null

          default_payment_terms: string | null

          default_currency: string | null

          created_at: string | null

          updated_at: string | null

          website: string | null

          contact_name: string | null

        }

        Insert: {

          id?: string

          company_id: string

          name: string

          email?: string | null

          phone?: string | null

          address?: string | null

          city?: string | null

          postal_code?: string | null

          country?: string | null

          tax_number?: string | null

          type: string

          is_active?: boolean | null

          balance?: number | null

          notes?: string | null

          default_payment_terms?: string | null

          default_currency?: string | null

          created_at?: string | null

          updated_at?: string | null

          website?: string | null

          contact_name?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          name?: string

          email?: string | null

          phone?: string | null

          address?: string | null

          city?: string | null

          postal_code?: string | null

          country?: string | null

          tax_number?: string | null

          type?: string

          is_active?: boolean | null

          balance?: number | null

          notes?: string | null

          default_payment_terms?: string | null

          default_currency?: string | null

          created_at?: string | null

          updated_at?: string | null

          website?: string | null

          contact_name?: string | null

        }

      }

      invoices: {

        Row: {

          id: string

          company_id: string

          client_id: string | null

          invoice_number: string

          issue_date: string

          due_date: string | null

          status: string

          currency: string

          subtotal: number

          tax_amount: number | null

          total_amount: number

          amount_paid: number | null

          notes: string | null

          terms: string | null

          pdf_url: string | null

          created_at: string | null

          updated_at: string | null

          client_name: string | null

        }

        Insert: {

          id?: string

          company_id: string

          client_id?: string | null

          invoice_number: string

          issue_date: string

          due_date?: string | null

          status: string

          currency: string

          subtotal: number

          tax_amount?: number | null

          total_amount: number

          amount_paid?: number | null

          notes?: string | null

          terms?: string | null

          pdf_url?: string | null

          created_at?: string | null

          updated_at?: string | null

          client_name?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          client_id?: string | null

          invoice_number?: string

          issue_date?: string

          due_date?: string | null

          status?: string

          currency?: string

          subtotal?: number

          tax_amount?: number | null

          total_amount?: number

          amount_paid?: number | null

          notes?: string | null

          terms?: string | null

          pdf_url?: string | null

          created_at?: string | null

          updated_at?: string | null

          client_name?: string | null

        }

      }

      invoice_items: {

        Row: {

          id: string

          invoice_id: string

          company_id: string

          description: string

          quantity: number

          unit_price: number

          tax_rate: number | null

          total_amount: number

          created_at: string | null

          updated_at: string | null

        }

        Insert: {

          id?: string

          invoice_id: string

          company_id: string

          description: string

          quantity: number

          unit_price: number

          tax_rate?: number | null

          total_amount: number

          created_at?: string | null

          updated_at?: string | null

        }

        Update: {

          id?: string

          invoice_id?: string

          company_id?: string

          description?: string

          quantity?: number

          unit_price?: number

          tax_rate?: number | null

          total_amount?: number

          created_at?: string | null

          updated_at?: string | null

        }

      }

      taxes: {

        Row: {

          id: string

          company_id: string

          name: string

          rate: number

          is_active: boolean | null

          collect_account: string | null

          deduct_account: string | null

          country: string | null

          created_at: string | null

          updated_at: string | null

        }

        Insert: {

          id?: string

          company_id: string

          name: string

          rate: number

          is_active?: boolean | null

          collect_account?: string | null

          deduct_account?: string | null

          country?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          name?: string

          rate?: number

          is_active?: boolean | null

          collect_account?: string | null

          deduct_account?: string | null

          country?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

      }

      company_tax_rates: {

        Row: {

          id: string

          company_id: string

          name: string

          rate: number

          type: string

          description: string

          is_default: boolean

          is_active: boolean

          valid_from: string

          created_by: string | null

          created_at: string

          updated_at: string

        }

        Insert: {

          id?: string

          company_id: string

          name: string

          rate: number

          type: string

          description?: string

          is_default?: boolean

          is_active?: boolean

          valid_from?: string

          created_by?: string | null

          created_at?: string

          updated_at?: string

        }

        Update: {

          id?: string

          company_id?: string

          name?: string

          rate?: number

          type?: string

          description?: string

          is_default?: boolean

          is_active?: boolean

          valid_from?: string

          created_by?: string | null

          created_at?: string

          updated_at?: string

        }

      }

      company_tax_declarations: {

        Row: {

          id: string

          company_id: string

          type: string

          name: string

          period_start: string | null

          period_end: string | null

          due_date: string

          status: string

          amount: number | null

          description: string

          currency: string

          submitted_date: string | null

          submitted_by: string | null

          created_at: string

          updated_at: string

        }

        Insert: {

          id?: string

          company_id: string

          type: string

          name: string

          period_start?: string | null

          period_end?: string | null

          due_date: string

          status?: string

          amount?: number | null

          description?: string

          currency?: string

          submitted_date?: string | null

          submitted_by?: string | null

          created_at?: string

          updated_at?: string

        }

        Update: {

          id?: string

          company_id?: string

          type?: string

          name?: string

          period_start?: string | null

          period_end?: string | null

          due_date?: string

          status?: string

          amount?: number | null

          description?: string

          currency?: string

          submitted_date?: string | null

          submitted_by?: string | null

          created_at?: string

          updated_at?: string

        }

      }

      company_tax_payments: {

        Row: {

          id: string

          company_id: string

          declaration_id: string | null

          amount: number

          currency: string

          payment_date: string

          payment_method: string

          reference: string | null

          status: string

          receipt_url: string | null

          created_by: string | null

          created_at: string

          updated_at: string

        }

        Insert: {

          id?: string

          company_id: string

          declaration_id?: string | null

          amount: number

          currency?: string

          payment_date: string

          payment_method: string

          reference?: string | null

          status?: string

          receipt_url?: string | null

          created_by?: string | null

          created_at?: string

          updated_at?: string

        }

        Update: {

          id?: string

          company_id?: string

          declaration_id?: string | null

          amount?: number

          currency?: string

          payment_date?: string

          payment_method?: string

          reference?: string | null

          status?: string

          receipt_url?: string | null

          created_by?: string | null

          created_at?: string

          updated_at?: string

        }

      }

      company_tax_documents: {

        Row: {

          id: string

          company_id: string

          declaration_id: string | null

          name: string

          type: string

          file_url: string

          file_size: number | null

          mime_type: string | null

          uploaded_by: string | null

          created_at: string

          updated_at: string

        }

        Insert: {

          id?: string

          company_id: string

          declaration_id?: string | null

          name: string

          type: string

          file_url: string

          file_size?: number | null

          mime_type?: string | null

          uploaded_by?: string | null

          created_at?: string

          updated_at?: string

        }

        Update: {

          id?: string

          company_id?: string

          declaration_id?: string | null

          name?: string

          type?: string

          file_url?: string

          file_size?: number | null

          mime_type?: string | null

          uploaded_by?: string | null

          created_at?: string

          updated_at?: string

        }

      }

      bank_accounts: {

        Row: {

          id: string

          company_id: string

          account_name: string

          bank_name: string | null

          account_number_masked: string | null

          currency: string

          type: string | null

          is_active: boolean | null

          current_balance: number | null

          last_synced_at: string | null

          notes: string | null

          created_at: string | null

          updated_at: string | null

        }

        Insert: {

          id?: string

          company_id: string

          account_name: string

          bank_name?: string | null

          account_number_masked?: string | null

          currency: string

          type?: string | null

          is_active?: boolean | null

          current_balance?: number | null

          last_synced_at?: string | null

          notes?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          account_name?: string

          bank_name?: string | null

          account_number_masked?: string | null

          currency?: string

          type?: string | null

          is_active?: boolean | null

          current_balance?: number | null

          last_synced_at?: string | null

          notes?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

      }

      bank_transactions: {

        Row: {

          id: string

          company_id: string

          bank_account_id: string

          transaction_date: string

          amount: number

          currency: string | null

          label: string | null

          reference: string | null

          linked_journal_line_id: string | null

          created_at: string | null

        }

        Insert: {

          id?: string

          company_id: string

          bank_account_id: string

          transaction_date: string

          amount: number

          currency?: string | null

          label?: string | null

          reference?: string | null

          linked_journal_line_id?: string | null

          created_at?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          bank_account_id?: string

          transaction_date?: string

          amount?: number

          currency?: string | null

          label?: string | null

          reference?: string | null

          linked_journal_line_id?: string | null

          created_at?: string | null

        }

      }

      transactions: {

        Row: {

          id: string

          company_id: string

          bank_account_id: string | null

          transaction_date: string

          description: string

          amount: number

          currency: string

          type: string | null

          category: string | null

          status: string | null

          reference_number: string | null

          is_reconciled: boolean | null

          created_at: string | null

          updated_at: string | null

        }

        Insert: {

          id?: string

          company_id: string

          bank_account_id?: string | null

          transaction_date: string

          description: string

          amount: number

          currency: string

          type?: string | null

          category?: string | null

          status?: string | null

          reference_number?: string | null

          is_reconciled?: boolean | null

          created_at?: string | null

          updated_at?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          bank_account_id?: string | null

          transaction_date?: string

          description?: string

          amount?: number

          currency?: string

          type?: string | null

          category?: string | null

          status?: string | null

          reference_number?: string | null

          is_reconciled?: boolean | null

          created_at?: string | null

          updated_at?: string | null

        }

      }

      expenses: {

        Row: {

          id: string

          company_id: string

          supplier_id: string | null

          expense_date: string

          category: string | null

          description: string

          amount: number

          currency: string

          status: string | null

          receipt_url: string | null

          notes: string | null

          created_at: string | null

          updated_at: string | null

        }

        Insert: {

          id?: string

          company_id: string

          supplier_id?: string | null

          expense_date: string

          category?: string | null

          description: string

          amount: number

          currency: string

          status?: string | null

          receipt_url?: string | null

          notes?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          supplier_id?: string | null

          expense_date?: string

          category?: string | null

          description?: string

          amount?: number

          currency?: string

          status?: string | null

          receipt_url?: string | null

          notes?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

      }

      employees: {

        Row: {

          id: string

          company_id: string

          user_id: string | null

          first_name: string

          last_name: string

          email: string | null

          phone: string | null

          position: string | null

          department: string | null

          hire_date: string | null

          salary: number | null

          contract_type: string | null

          is_active: boolean | null

          created_at: string | null

          updated_at: string | null

        }

        Insert: {

          id?: string

          company_id: string

          user_id?: string | null

          first_name: string

          last_name: string

          email?: string | null

          phone?: string | null

          position?: string | null

          department?: string | null

          hire_date?: string | null

          salary?: number | null

          contract_type?: string | null

          is_active?: boolean | null

          created_at?: string | null

          updated_at?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          user_id?: string | null

          first_name?: string

          last_name?: string

          email?: string | null

          phone?: string | null

          position?: string | null

          department?: string | null

          hire_date?: string | null

          salary?: number | null

          contract_type?: string | null

          is_active?: boolean | null

          created_at?: string | null

          updated_at?: string | null

        }

      }

      projects: {

        Row: {

          id: string

          company_id: string

          name: string

          description: string | null

          client_name: string | null

          start_date: string | null

          end_date: string | null

          budget: number | null

          status: string

          manager_id: string | null

          created_at: string | null

          updated_at: string | null

        }

        Insert: {

          id?: string

          company_id: string

          name: string

          description?: string | null

          client_name?: string | null

          start_date?: string | null

          end_date?: string | null

          budget?: number | null

          status?: string

          manager_id?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          name?: string

          description?: string | null

          client_name?: string | null

          start_date?: string | null

          end_date?: string | null

          budget?: number | null

          status?: string

          manager_id?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

      }

      budgets: {

        Row: {

          id: string

          company_id: string

          name: string

          period_start_date: string

          period_end_date: string

          description: string | null

          status: string | null

          created_at: string | null

          updated_at: string | null

        }

        Insert: {

          id?: string

          company_id: string

          name: string

          period_start_date: string

          period_end_date: string

          description?: string | null

          status?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          name?: string

          period_start_date?: string

          period_end_date?: string

          description?: string | null

          status?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

      }

      budget_items: {

        Row: {

          id: string

          budget_id: string

          company_id: string

          account_id: string | null

          category_name: string | null

          budgeted_amount: number

          actual_amount: number | null

          currency: string

          notes: string | null

          created_at: string | null

          updated_at: string | null

        }

        Insert: {

          id?: string

          budget_id: string

          company_id: string

          account_id?: string | null

          category_name?: string | null

          budgeted_amount: number

          actual_amount?: number | null

          currency: string

          notes?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

        Update: {

          id?: string

          budget_id?: string

          company_id?: string

          account_id?: string | null

          category_name?: string | null

          budgeted_amount?: number

          actual_amount?: number | null

          currency?: string

          notes?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

      }

      reconciliations: {

        Row: {

          id: string

          company_id: string

          bank_account_id: string

          statement_date: string

          statement_ending_balance: number

          calculated_ending_balance: number | null

          difference: number | null

          status: string | null

          notes: string | null

          created_at: string | null

          updated_at: string | null

        }

        Insert: {

          id?: string

          company_id: string

          bank_account_id: string

          statement_date: string

          statement_ending_balance: number

          calculated_ending_balance?: number | null

          difference?: number | null

          status?: string | null

          notes?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

        Update: {

          id?: string

          company_id?: string

          bank_account_id?: string

          statement_date?: string

          statement_ending_balance?: number

          calculated_ending_balance?: number | null

          difference?: number | null

          status?: string | null

          notes?: string | null

          created_at?: string | null

          updated_at?: string | null

        }

      }

      reconciled_items: {

        Row: {

          id: string

          reconciliation_id: string

          transaction_id: string

          company_id: string

          reconciled_at: string | null

        }

        Insert: {

          id?: string

          reconciliation_id: string

          transaction_id: string

          company_id: string

          reconciled_at?: string | null

        }

        Update: {

          id?: string

          reconciliation_id?: string

          transaction_id?: string

          company_id?: string

          reconciled_at?: string | null

        }

      }

      currencies: {

        Row: {

          code: string

          name: string

          symbol: string

          is_active: boolean | null

        }

        Insert: {

          code: string

          name: string

          symbol: string

          is_active?: boolean | null

        }

        Update: {

          code?: string

          name?: string

          symbol?: string

          is_active?: boolean | null

        }

      }

      exchange_rates: {

        Row: {

          id: string

          base_currency: string

          target_currency: string

          rate: number

          rate_date: string

          created_at: string | null

        }

        Insert: {

          id?: string

          base_currency: string

          target_currency: string

          rate: number

          rate_date: string

          created_at?: string | null

        }

        Update: {

          id?: string

          base_currency?: string

          target_currency?: string

          rate?: number

          rate_date?: string

          created_at?: string | null

        }

      }

      company_modules: {

        Row: {

          id: string

          company_id: string

          module_key: string

          is_enabled: boolean | null

          created_at: string

          updated_at: string

        }

        Insert: {

          id?: string

          company_id: string

          module_key: string

          is_enabled?: boolean | null

          created_at?: string

          updated_at?: string

        }

        Update: {

          id?: string

          company_id?: string

          module_key?: string

          is_enabled?: boolean | null

          created_at?: string

          updated_at?: string

        }

      }

      stripe_products: {

        Row: {

          id: string

          active: boolean | null

          name: string

          description: string | null

          created_at: string

          updated_at: string

        }

        Insert: {

          id: string

          active?: boolean | null

          name: string

          description?: string | null

          created_at?: string

          updated_at?: string

        }

        Update: {

          id?: string

          active?: boolean | null

          name?: string

          description?: string | null

          created_at?: string

          updated_at?: string

        }

      }

      stripe_prices: {

        Row: {

          id: string

          product_id: string

          active: boolean | null

          currency: string

          unit_amount: number | null

          type: string | null

          recurring: Json | null

          created_at: string

          updated_at: string

        }

        Insert: {

          id: string

          product_id: string

          active?: boolean | null

          currency: string

          unit_amount?: number | null

          type?: string | null

          recurring?: Json | null

          created_at?: string

          updated_at?: string

        }

        Update: {

          id?: string

          product_id?: string

          active?: boolean | null

          currency?: string

          unit_amount?: number | null

          type?: string | null

          recurring?: Json | null

          created_at?: string

          updated_at?: string

        }

      }

      stripe_subscriptions: {

        Row: {

          stripe_subscription_id: string

          company_id: string

          status: string

          price_id: string | null

          current_period_end: string | null

          created_at: string

          updated_at: string

        }

        Insert: {

          stripe_subscription_id: string

          company_id: string

          status: string

          price_id?: string | null

          current_period_end?: string | null

          created_at?: string

          updated_at?: string

        }

        Update: {

          stripe_subscription_id?: string

          company_id?: string

          status?: string

          price_id?: string | null

          current_period_end?: string | null

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

    Views: {

      balance_generale: {

        Row: {

          account_number: string | null

          name: string | null

          type: string | null

          class: number | null

          balance: number | null

          currency: string | null

          company_name: string | null

          company_id: string | null

        }

      }

      grand_livre: {

        Row: {

          entry_date: string | null

          entry_number: string | null

          description: string | null

          account_number: string | null

          account_name: string | null

          line_description: string | null

          debit_amount: number | null

          credit_amount: number | null

          journal_name: string | null

          company_name: string | null

          company_id: string | null

        }

      }

    }

    Functions: {

      [_ in never]: never

    }

    Enums: {

      [_ in never]: never

    }

    CompositeTypes: {

      [_ in never]: never

    }

  }

}
