/**
 * CassKai - Utilities for fiscal period management
 * Gestion des périodes fiscales (années N, N-1, N-2, etc.)
 */
import { logger } from '@/lib/logger';

export interface FiscalPeriod {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
  year: number;
}
export type PeriodType = 'month' | 'quarter' | 'year' | 'custom';
/**
 * Génère les périodes fiscales disponibles (N, N-1, N-2, etc.)
 * @param yearsBack Nombre d'années à remonter (par défaut 5)
 * @returns Liste des périodes fiscales
 */
export function getFiscalPeriods(yearsBack: number = 5): FiscalPeriod[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const periods: FiscalPeriod[] = [];
  for (let i = 0; i <= yearsBack; i++) {
    const year = currentYear - i;
    const label = i === 0 ? `Année N (${year})` : `Année N-${i} (${year})`;
    periods.push({
      label,
      value: i === 0 ? 'N' : `N-${i}`,
      startDate: new Date(year, 0, 1), // 1er janvier
      endDate: new Date(year, 11, 31, 23, 59, 59, 999), // 31 décembre 23:59:59.999
      year
    });
  }
  return periods;
}
/**
 * Obtient une période fiscale spécifique par sa valeur
 * @param periodValue Valeur de la période (ex: "N", "N-1", "N-2")
 * @returns Période fiscale ou null si non trouvée
 */
export function getFiscalPeriod(periodValue: string): FiscalPeriod | null {
  const periods = getFiscalPeriods();
  return periods.find(p => p.value === periodValue) || null;
}
/**
 * Obtient une période fiscale par année
 * @param year Année fiscale (ex: 2024, 2025, 2026)
 * @returns Période fiscale ou null si non trouvée
 */
export function getFiscalPeriodByYear(year: number): FiscalPeriod | null {
  const currentYear = new Date().getFullYear();
  const offset = currentYear - year;
  if (offset < 0 || offset > 5) return null;
  const value = offset === 0 ? 'N' : `N-${offset}`;
  const label = offset === 0 ? `Année N (${year})` : `Année N-${offset} (${year})`;
  return {
    label,
    value,
    startDate: new Date(year, 0, 1),
    endDate: new Date(year, 11, 31, 23, 59, 59, 999),
    year
  };
}
/**
 * Formate une période pour affichage
 * @param period Période fiscale
 * @param locale Locale (par défaut 'fr-FR')
 * @returns Chaîne formatée (ex: "Période du 01/01/2025 au 31/12/2025")
 */
export function formatPeriod(period: FiscalPeriod, locale: string = 'fr-FR'): string {
  const startStr = period.startDate.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const endStr = period.endDate.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  return `Période du ${startStr} au ${endStr}`;
}
/**
 * Convertit une date en format ISO pour Supabase (YYYY-MM-DD)
 * @param date Date à convertir
 * @returns Chaîne au format ISO (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
/**
 * Obtient les périodes mensuelles pour une année donnée
 * @param year Année
 * @returns Liste des 12 mois
 */
export function getMonthlyPeriods(year: number): Array<{ label: string; value: string; month: number; startDate: Date; endDate: Date }> {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months.map((name, index) => {
    const month = index;
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return {
      label: `${name} ${year}`,
      value: `${year}-${String(month + 1).padStart(2, '0')}`,
      month: month + 1,
      startDate,
      endDate
    };
  });
}
/**
 * Obtient les périodes trimestrielles pour une année donnée
 * @param year Année
 * @returns Liste des 4 trimestres
 */
export function getQuarterlyPeriods(year: number): Array<{ label: string; value: string; quarter: number; startDate: Date; endDate: Date }> {
  return [
    {
      label: `T1 ${year}`,
      value: `${year}-Q1`,
      quarter: 1,
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 2, 31, 23, 59, 59, 999)
    },
    {
      label: `T2 ${year}`,
      value: `${year}-Q2`,
      quarter: 2,
      startDate: new Date(year, 3, 1),
      endDate: new Date(year, 5, 30, 23, 59, 59, 999)
    },
    {
      label: `T3 ${year}`,
      value: `${year}-Q3`,
      quarter: 3,
      startDate: new Date(year, 6, 1),
      endDate: new Date(year, 8, 30, 23, 59, 59, 999)
    },
    {
      label: `T4 ${year}`,
      value: `${year}-Q4`,
      quarter: 4,
      startDate: new Date(year, 9, 1),
      endDate: new Date(year, 11, 31, 23, 59, 59, 999)
    }
  ];
}
/**
 * Détermine si une année est une année fiscale future
 * @param year Année à vérifier
 * @returns true si l'année est dans le futur
 */
export function isFutureYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year > currentYear;
}
/**
 * Obtient l'année fiscale en cours
 * @returns Année en cours
 */
export function getCurrentFiscalYear(): number {
  return new Date().getFullYear();
}
/**
 * Debug utility: Log period information
 * @param period Période à logger
 */
export function debugPeriod(period: FiscalPeriod | null): void {
  if (!period) {
    logger.debug('Periods', '🔍 [Period Debug] Period is null');
    return;
  }
  logger.debug('periods', '🔍 [Period Debug]:', {
    label: period.label,
    value: period.value,
    year: period.year,
    startDate: toISODateString(period.startDate),
    endDate: toISODateString(period.endDate),
    currentYear: getCurrentFiscalYear(),
    isFuture: isFutureYear(period.year)
  });
}