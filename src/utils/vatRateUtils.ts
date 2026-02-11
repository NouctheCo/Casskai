import { COUNTRIES } from '@/config/currencies';
import { MultiCountryTaxService } from '@/services/fiscal/MultiCountryTaxService';
import { getDefaultCountry } from '@/services/pricingMultiCurrency';
import type { Company } from '@/types/database/company.types';
import type { CompanySettings } from '@/types/company-settings.types';

export interface VatCountryContext {
  currentCompany?: Company | null;
  companySettings?: CompanySettings | null;
  countryOverride?: string | null;
}

const normalizeCountryValue = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isCountryCode = (value: string): boolean => /^[A-Za-z]{2}$/.test(value.trim());

export function resolveCompanyCountryCode({
  currentCompany,
  companySettings,
  countryOverride
}: VatCountryContext): string {
  const explicit = countryOverride?.trim();
  if (explicit) {
    if (isCountryCode(explicit)) {
      return explicit.toUpperCase();
    }

    const normalizedOverride = normalizeCountryValue(explicit);
    const overrideMatch = COUNTRIES.find((country) =>
      normalizeCountryValue(country.name) === normalizedOverride
    );
    if (overrideMatch) {
      return overrideMatch.code;
    }

    return explicit.toUpperCase();
  }

  const companyCountryCode = (currentCompany as Record<string, unknown>)?.country_code;
  if (typeof companyCountryCode === 'string' && companyCountryCode.trim()) {
    return companyCountryCode.trim().toUpperCase();
  }

  const addressCountry = companySettings?.contact?.address?.country;
  if (typeof addressCountry === 'string' && addressCountry.trim()) {
    const trimmedCountry = addressCountry.trim();
    if (isCountryCode(trimmedCountry)) {
      return trimmedCountry.toUpperCase();
    }

    const normalized = normalizeCountryValue(trimmedCountry);
    const match = COUNTRIES.find((country) => normalizeCountryValue(country.name) === normalized);
    if (match) {
      return match.code;
    }
  }

  return getDefaultCountry();
}

export function buildVatRateOptions(countryCode: string, defaultVatRate?: number): number[] {
  const taxService = MultiCountryTaxService.getInstance();
  const { standard, reduced, exempt } = taxService.getVATRates(countryCode);
  const rateSet = new Set<number>();

  if (typeof standard === 'number') {
    rateSet.add(standard);
  }

  reduced.forEach((rate) => rateSet.add(rate));

  if (exempt) {
    rateSet.add(0);
  }

  if (typeof defaultVatRate === 'number' && !Number.isNaN(defaultVatRate)) {
    rateSet.add(defaultVatRate);
  }

  return Array.from(rateSet).sort((a, b) => a - b);
}

export function getDefaultVatRate(countryCode: string, defaultVatRate?: number): number {
  if (typeof defaultVatRate === 'number' && !Number.isNaN(defaultVatRate)) {
    return defaultVatRate;
  }

  const taxService = MultiCountryTaxService.getInstance();
  const { standard } = taxService.getVATRates(countryCode);

  return typeof standard === 'number' ? standard : 20;
}
