/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

// src/hooks/useReferentials.ts
import { useState, useEffect, useCallback } from 'react';
import referentialsService, {
  CountryReferential,
  SectorReferential,
  CompanySizeReferential,
  TimezoneReferential,
  CurrencyReferential,
  TaxRateReferential
} from '@/services/referentialsService';

// =============================================
// HOOK POUR LES PAYS
// =============================================

export function useCountries() {
  const [countries, setCountries] = useState<CountryReferential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await referentialsService.getCountries();
        setCountries(data);
      } catch (error) {
        setError('Erreur lors du chargement des pays');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  const getCountryByCode = useCallback((code: string) => {
    return countries.find(c => c.code === code);
  }, [countries]);

  return { countries, loading, error, getCountryByCode };
}

// =============================================
// HOOK POUR LES SECTEURS
// =============================================

export function useSectors() {
  const [sectors, setSectors] = useState<SectorReferential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSectors = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await referentialsService.getSectors();
        setSectors(data);
      } catch (error) {
        setError('Erreur lors du chargement des secteurs');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadSectors();
  }, []);

  const searchSectors = useCallback(async (searchTerm: string) => {
    try {
      const data = await referentialsService.searchSectors(searchTerm);
      return data;
    } catch (error) {
      console.error('...', error);
      return sectors;
    }
  }, [sectors]);

  const getSectorByCode = useCallback((code: string) => {
    return sectors.find(s => s.sector_code === code);
  }, [sectors]);

  return { sectors, loading, error, searchSectors, getSectorByCode };
}

// =============================================
// HOOK POUR LES TAILLES D'ENTREPRISE
// =============================================

export function useCompanySizes() {
  const [companySizes, setCompanySizes] = useState<CompanySizeReferential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompanySizes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await referentialsService.getCompanySizes();
        setCompanySizes(data);
      } catch (error) {
        setError('Erreur lors du chargement des tailles d\'entreprise');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanySizes();
  }, []);

  const getSizeByCode = useCallback((code: string) => {
    return companySizes.find(s => s.size_code === code);
  }, [companySizes]);

  return { companySizes, loading, error, getSizeByCode };
}

// =============================================
// HOOK POUR LES FUSEAUX HORAIRES
// =============================================

export function useTimezones(popularOnly = false) {
  const [timezones, setTimezones] = useState<TimezoneReferential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTimezones = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = popularOnly
          ? await referentialsService.getPopularTimezones()
          : await referentialsService.getTimezones();
        setTimezones(data);
      } catch (error) {
        setError('Erreur lors du chargement des fuseaux horaires');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadTimezones();
  }, [popularOnly]);

  const getTimezoneByName = useCallback((name: string) => {
    return timezones.find(t => t.timezone_name === name);
  }, [timezones]);

  return { timezones, loading, error, getTimezoneByName };
}

// =============================================
// HOOK POUR LES DEVISES
// =============================================

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<CurrencyReferential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await referentialsService.getCurrencies();
        setCurrencies(data);
      } catch (error) {
        setError('Erreur lors du chargement des devises');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrencies();
  }, []);

  const getCurrencyByCode = useCallback((code: string) => {
    return currencies.find(c => c.currency_code === code);
  }, [currencies]);

  return { currencies, loading, error, getCurrencyByCode };
}

// =============================================
// HOOK POUR LES TAUX DE TAXES
// =============================================

export function useTaxRates(countryCode?: string) {
  const [taxRates, setTaxRates] = useState<TaxRateReferential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryCode) {
      setTaxRates([]);
      setLoading(false);
      return;
    }

    const loadTaxRates = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await referentialsService.getTaxRates(countryCode);
        setTaxRates(data);
      } catch (error) {
        setError('Erreur lors du chargement des taux de taxes');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadTaxRates();
  }, [countryCode]);

  const getDefaultTaxRate = useCallback(() => {
    return taxRates.find(t => t.is_default);
  }, [taxRates]);

  return { taxRates, loading, error, getDefaultTaxRate };
}

// =============================================
// HOOK COMBINÉ POUR L'ONBOARDING
// =============================================

export function useOnboardingReferentials() {
  const { countries, loading: countriesLoading } = useCountries();
  const { sectors, loading: sectorsLoading, searchSectors } = useSectors();
  const { companySizes, loading: sizesLoading } = useCompanySizes();
  const { timezones, loading: timezonesLoading } = useTimezones(true); // Seulement les populaires
  const { currencies, loading: currenciesLoading } = useCurrencies();

  const loading = countriesLoading || sectorsLoading || sizesLoading || timezonesLoading || currenciesLoading;

  // Configuration automatique basée sur le pays
  const getCountryConfiguration = useCallback(async (countryCode: string) => {
    try {
      const config = await referentialsService.getCountryConfig(countryCode);
      return config;
    } catch (error) {
      console.error('Erreur configuration pays:', error);
      return null;
    }
  }, []);

  return {
    countries,
    sectors,
    companySizes,
    timezones,
    currencies,
    loading,
    searchSectors,
    getCountryConfiguration
  };
}

// =============================================
// HOOK POUR LA CONFIGURATION AUTOMATIQUE
// =============================================

export function useCountryAutoConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadCountryConfig = useCallback(async (countryCode: string) => {
    try {
      setLoading(true);
      const data = await referentialsService.getCountryConfig(countryCode);
      setConfig(data);
    } catch (error) {
      console.error('Erreur auto-config pays:', error);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { config, loading, loadCountryConfig };
}
