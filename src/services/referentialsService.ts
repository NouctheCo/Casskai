// src/services/referentialsService.ts
import { supabase } from '@/lib/supabase';

// =============================================
// TYPES POUR LES RÉFÉRENTIELS DYNAMIQUES
// =============================================

export interface CountryReferential {
  code: string;
  name: string;
  name_english?: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  timezone: string;
  accounting_standard: string;
  accounting_standard_name?: string;
  region?: string;
  is_active: boolean;
  priority_order: number;
}

export interface SectorReferential {
  sector_code: string;
  sector_name: string;
  category: string;
  subcategory?: string;
  description?: string;
  typical_size_ranges?: string[];
  common_modules?: string[];
  is_active: boolean;
  priority_order: number;
}

export interface CompanySizeReferential {
  size_code: string;
  size_name: string;
  category: string;
  employee_min?: number;
  employee_max?: number;
  description?: string;
  recommended_plan?: string;
  is_active: boolean;
  priority_order: number;
}

export interface TimezoneReferential {
  timezone_name: string;
  timezone_display: string;
  utc_offset_minutes: number;
  country_codes?: string[];
  major_cities?: string[];
  is_active: boolean;
  is_popular: boolean;
}

export interface CurrencyReferential {
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  decimal_places: number;
  country_codes?: string[];
  is_major: boolean;
  is_active: boolean;
}

export interface TaxRateReferential {
  country_code: string;
  tax_name: string;
  tax_type: string;
  tax_rate: number;
  is_default: boolean;
  is_active: boolean;
}

// =============================================
// SERVICE RÉFÉRENTIELS DYNAMIQUES
// =============================================

class ReferentialsService {

  // PAYS ET CONFIGURATION
  async getCountries(): Promise<CountryReferential[]> {
    try {
      const { data, error } = await supabase
        .from('countries_catalog')
        .select('*')
        .eq('is_active', true)
        .order('priority_order', { ascending: true });

      if (error) {
        console.error('Erreur récupération pays:', error);
        return this.getFallbackCountries();
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service pays:', error instanceof Error ? error.message : String(error));
      return this.getFallbackCountries();
    }
  }

  async getCountryConfig(countryCode: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_country_config', { country_code_param: countryCode });

      if (error || !data) {
        console.error('Erreur config pays:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur service config pays:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  // SECTEURS D'ACTIVITÉ
  async getSectors(): Promise<SectorReferential[]> {
    try {
      const { data, error } = await supabase
        .from('sectors_catalog')
        .select('*')
        .eq('is_active', true)
        .order('priority_order', { ascending: true });

      if (error) {
        console.error('Erreur récupération secteurs:', error);
        return this.getFallbackSectors();
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service secteurs:', error instanceof Error ? error.message : String(error));
      return this.getFallbackSectors();
    }
  }

  async searchSectors(searchTerm?: string): Promise<SectorReferential[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_sectors', {
          search_term: searchTerm || null,
          limit_param: 50
        });

      if (error) {
        console.error('Erreur recherche secteurs:', error);
        return this.getFallbackSectors();
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service recherche secteurs:', error instanceof Error ? error.message : String(error));
      return this.getFallbackSectors();
    }
  }

  // TAILLES D'ENTREPRISE
  async getCompanySizes(): Promise<CompanySizeReferential[]> {
    try {
      const { data, error } = await supabase
        .from('company_sizes_catalog')
        .select('*')
        .eq('is_active', true)
        .order('priority_order', { ascending: true });

      if (error) {
        console.error('Erreur récupération tailles:', error);
        return this.getFallbackCompanySizes();
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service tailles:', error instanceof Error ? error.message : String(error));
      return this.getFallbackCompanySizes();
    }
  }

  // FUSEAUX HORAIRES
  async getTimezones(): Promise<TimezoneReferential[]> {
    try {
      const { data, error } = await supabase
        .from('timezones_catalog')
        .select('*')
        .eq('is_active', true)
        .order('is_popular', { ascending: false })
        .order('timezone_display', { ascending: true });

      if (error) {
        console.error('Erreur récupération fuseaux:', error);
        return this.getFallbackTimezones();
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service fuseaux:', error instanceof Error ? error.message : String(error));
      return this.getFallbackTimezones();
    }
  }

  async getPopularTimezones(): Promise<TimezoneReferential[]> {
    try {
      const { data, error } = await supabase
        .from('timezones_catalog')
        .select('*')
        .eq('is_active', true)
        .eq('is_popular', true)
        .order('timezone_display', { ascending: true });

      if (error) {
        console.error('Erreur récupération fuseaux populaires:', error);
        return this.getFallbackTimezones();
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service fuseaux populaires:', error instanceof Error ? error.message : String(error));
      return this.getFallbackTimezones();
    }
  }

  // DEVISES
  async getCurrencies(): Promise<CurrencyReferential[]> {
    try {
      const { data, error } = await supabase
        .from('currencies_catalog')
        .select('*')
        .eq('is_active', true)
        .order('is_major', { ascending: false })
        .order('currency_name', { ascending: true });

      if (error) {
        console.error('Erreur récupération devises:', error);
        return this.getFallbackCurrencies();
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service devises:', error instanceof Error ? error.message : String(error));
      return this.getFallbackCurrencies();
    }
  }

  // TAUX DE TAXES
  async getTaxRates(countryCode: string): Promise<TaxRateReferential[]> {
    try {
      const { data, error } = await supabase
        .from('tax_rates_catalog')
        .select('*')
        .eq('country_code', countryCode)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('tax_rate', { ascending: false });

      if (error) {
        console.error('Erreur récupération taxes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur service taxes:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // =============================================
  // FALLBACKS EN CAS D'ERREUR (DONNÉES HARDCODÉES)
  // =============================================

  private getFallbackCountries(): CountryReferential[] {
    return [
      // Pays prioritaires (Afrique francophone + Europe + Amérique du Nord + Ghana/Nigeria)
      {
        code: 'FR',
        name: 'France',
        currency_code: 'EUR',
        currency_name: 'Euro',
        currency_symbol: '€',
        timezone: 'Europe/Paris',
        accounting_standard: 'PCG',
        is_active: true,
        priority_order: 1
      },
      {
        code: 'CI',
        name: 'Côte d\'Ivoire',
        currency_code: 'XOF',
        currency_name: 'Franc CFA',
        currency_symbol: 'CFA',
        timezone: 'Africa/Abidjan',
        accounting_standard: 'SYSCOHADA',
        is_active: true,
        priority_order: 2
      },
      {
        code: 'SN',
        name: 'Sénégal',
        currency_code: 'XOF',
        currency_name: 'Franc CFA',
        currency_symbol: 'CFA',
        timezone: 'Africa/Dakar',
        accounting_standard: 'SYSCOHADA',
        is_active: true,
        priority_order: 3
      },
      {
        code: 'CM',
        name: 'Cameroun',
        currency_code: 'XAF',
        currency_name: 'Franc CFA',
        currency_symbol: 'CFA',
        timezone: 'Africa/Douala',
        accounting_standard: 'SYSCOHADA',
        is_active: true,
        priority_order: 4
      },
      {
        code: 'MA',
        name: 'Maroc',
        currency_code: 'MAD',
        currency_name: 'Dirham Marocain',
        currency_symbol: 'MAD',
        timezone: 'Africa/Casablanca',
        accounting_standard: 'LOCAL',
        is_active: true,
        priority_order: 5
      },
      {
        code: 'TN',
        name: 'Tunisie',
        currency_code: 'TND',
        currency_name: 'Dinar Tunisien',
        currency_symbol: 'TND',
        timezone: 'Africa/Tunis',
        accounting_standard: 'LOCAL',
        is_active: true,
        priority_order: 6
      },
      {
        code: 'ML',
        name: 'Mali',
        currency_code: 'XOF',
        currency_name: 'Franc CFA',
        currency_symbol: 'CFA',
        timezone: 'Africa/Bamako',
        accounting_standard: 'SYSCOHADA',
        is_active: true,
        priority_order: 7
      },
      {
        code: 'BF',
        name: 'Burkina Faso',
        currency_code: 'XOF',
        currency_name: 'Franc CFA',
        currency_symbol: 'CFA',
        timezone: 'Africa/Ouagadougou',
        accounting_standard: 'SYSCOHADA',
        is_active: true,
        priority_order: 8
      },
      {
        code: 'BJ',
        name: 'Bénin',
        currency_code: 'XOF',
        currency_name: 'Franc CFA',
        currency_symbol: 'CFA',
        timezone: 'Africa/Porto-Novo',
        accounting_standard: 'SYSCOHADA',
        is_active: true,
        priority_order: 9
      },
      {
        code: 'TG',
        name: 'Togo',
        currency_code: 'XOF',
        currency_name: 'Franc CFA',
        currency_symbol: 'CFA',
        timezone: 'Africa/Lome',
        accounting_standard: 'SYSCOHADA',
        is_active: true,
        priority_order: 10
      },
      {
        code: 'GA',
        name: 'Gabon',
        currency_code: 'XAF',
        currency_name: 'Franc CFA',
        currency_symbol: 'CFA',
        timezone: 'Africa/Libreville',
        accounting_standard: 'SYSCOHADA',
        is_active: true,
        priority_order: 11
      },
      {
        code: 'GH',
        name: 'Ghana',
        currency_code: 'GHS',
        currency_name: 'Ghana Cedi',
        currency_symbol: '₵',
        timezone: 'Africa/Accra',
        accounting_standard: 'IFRS',
        is_active: true,
        priority_order: 12
      },
      {
        code: 'NG',
        name: 'Nigeria',
        currency_code: 'NGN',
        currency_name: 'Nigerian Naira',
        currency_symbol: '₦',
        timezone: 'Africa/Lagos',
        accounting_standard: 'IFRS',
        is_active: true,
        priority_order: 13
      },
      {
        code: 'US',
        name: 'United States',
        currency_code: 'USD',
        currency_name: 'US Dollar',
        currency_symbol: '$',
        timezone: 'America/New_York',
        accounting_standard: 'GAAP',
        is_active: true,
        priority_order: 14
      },
      {
        code: 'GB',
        name: 'United Kingdom',
        currency_code: 'GBP',
        currency_name: 'British Pound',
        currency_symbol: '£',
        timezone: 'Europe/London',
        accounting_standard: 'IFRS',
        is_active: true,
        priority_order: 15
      }
    ];
  }

  private getFallbackSectors(): SectorReferential[] {
    return [
      {
        sector_code: 'SERVICES_PROF',
        sector_name: 'Services Professionnels',
        category: 'TERTIARY',
        is_active: true,
        priority_order: 1
      },
      {
        sector_code: 'COMMERCE_DETAIL',
        sector_name: 'Commerce de Détail',
        category: 'TERTIARY',
        is_active: true,
        priority_order: 2
      },
      {
        sector_code: 'INDUSTRIE_MANUF',
        sector_name: 'Industrie Manufacturière',
        category: 'SECONDARY',
        is_active: true,
        priority_order: 3
      }
    ];
  }

  private getFallbackCompanySizes(): CompanySizeReferential[] {
    return [
      {
        size_code: 'MICRO',
        size_name: 'Micro-entreprise',
        category: 'MICRO',
        employee_min: 1,
        employee_max: 9,
        is_active: true,
        priority_order: 1
      },
      {
        size_code: 'PME',
        size_name: 'PME',
        category: 'MEDIUM',
        employee_min: 10,
        employee_max: 249,
        is_active: true,
        priority_order: 2
      }
    ];
  }

  private getFallbackTimezones(): TimezoneReferential[] {
    return [
      {
        timezone_name: 'Europe/Paris',
        timezone_display: '(UTC+01:00) Paris',
        utc_offset_minutes: 60,
        is_active: true,
        is_popular: true
      },
      {
        timezone_name: 'Africa/Abidjan',
        timezone_display: '(UTC+00:00) Abidjan',
        utc_offset_minutes: 0,
        is_active: true,
        is_popular: true
      }
    ];
  }

  private getFallbackCurrencies(): CurrencyReferential[] {
    return [
      {
        currency_code: 'EUR',
        currency_name: 'Euro',
        currency_symbol: '€',
        decimal_places: 2,
        is_major: true,
        is_active: true
      },
      {
        currency_code: 'XOF',
        currency_name: 'Franc CFA',
        currency_symbol: 'CFA',
        decimal_places: 0,
        is_major: false,
        is_active: true
      }
    ];
  }
}

// Export du service singleton
export const referentialsService = new ReferentialsService();

// =============================================
// HOOKS REACT POUR L'UTILISATION FACILE
// =============================================

export { referentialsService as default };
