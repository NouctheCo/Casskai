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

/**
 * Helpers pour gérer les exercices fiscaux multi-pays
 *
 * Supporte :
 * - Exercice année civile (01/01 → 31/12) - majorité pays OHADA
 * - Exercice décalé (ex: 01/07 → 30/06, UK 06/04 → 05/04)
 * - Configuration par entreprise (fiscal_year_start_month en DB)
 * - Configuration par pays (fiscalYearEnd dans taxConfigurations)
 *
 * @module fiscalYearHelpers
 * @priority P0 - Compliance critique pour calculs fiscaux multi-pays
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getTaxConfiguration } from '@/data/taxConfigurations';

// ============================================================================
// TYPES
// ============================================================================

export interface FiscalYearDates {
  startDate: string;  // Format: YYYY-MM-DD
  endDate: string;    // Format: YYYY-MM-DD
  fiscalYear: number; // Année de l'exercice (année de fin)
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Obtenir les dates de début/fin d'exercice fiscal pour une entreprise
 *
 * @param companyId - ID de l'entreprise
 * @param fiscalYear - Année de l'exercice (année de fin, ex: 2024 pour exercice 2023-2024)
 * @returns Dates de début et fin au format YYYY-MM-DD
 *
 * @example
 * // Entreprise avec année civile (par défaut OHADA)
 * await getFiscalYearDatesForCompany('company-id', 2024)
 * // => { startDate: '2024-01-01', endDate: '2024-12-31', fiscalYear: 2024 }
 *
 * @example
 * // Entreprise avec exercice décalé (01/07 → 30/06)
 * await getFiscalYearDatesForCompany('company-id', 2024)
 * // => { startDate: '2023-07-01', endDate: '2024-06-30', fiscalYear: 2024 }
 */
export async function getFiscalYearDatesForCompany(
  companyId: string,
  fiscalYear: number
): Promise<FiscalYearDates> {
  try {
    // Récupérer paramètres entreprise
    const { data: company, error } = await supabase
      .from('companies')
      .select('country, fiscal_year_start_month, fiscal_year_start_day')
      .eq('id', companyId)
      .single();

    if (error || !company) {
      logger.error('FiscalYearHelpers', 'Impossible de récupérer entreprise', error);
      // Défaut: année civile
      return getCalendarYearDates(fiscalYear);
    }

    const countryCode = company.country || 'FR';
    const fiscalYearStartMonth = company.fiscal_year_start_month; // 1-12 (1 = janvier)
    const fiscalYearStartDay = company.fiscal_year_start_day || 1; // 1-31

    // Si fiscal_year_start_month défini en DB, utiliser cette config
    if (fiscalYearStartMonth && fiscalYearStartMonth >= 1 && fiscalYearStartMonth <= 12) {
      return calculateFiscalYearDates(fiscalYear, fiscalYearStartMonth, fiscalYearStartDay);
    }

    // Sinon, utiliser config pays depuis taxConfigurations
    const taxConfig = getTaxConfiguration(countryCode);
    if (taxConfig && taxConfig.fiscalYearEnd) {
      return calculateFiscalYearDatesFromEndDate(fiscalYear, taxConfig.fiscalYearEnd);
    }

    // Fallback: année civile
    logger.warn('FiscalYearHelpers', `Pas de config fiscale pour ${countryCode}, défaut année civile`);
    return getCalendarYearDates(fiscalYear);

  } catch (error) {
    logger.error('FiscalYearHelpers', 'Erreur getFiscalYearDatesForCompany:', error);
    return getCalendarYearDates(fiscalYear);
  }
}

/**
 * Calculer dates exercice fiscal depuis mois de début
 *
 * @param fiscalYear - Année de fin de l'exercice
 * @param startMonth - Mois de début (1-12)
 * @param startDay - Jour de début (1-31)
 * @returns Dates calculées
 *
 * @example
 * // Exercice décalé commençant le 1er juillet
 * calculateFiscalYearDates(2024, 7, 1)
 * // => { startDate: '2023-07-01', endDate: '2024-06-30', fiscalYear: 2024 }
 */
export function calculateFiscalYearDates(
  fiscalYear: number,
  startMonth: number,
  startDay: number = 1
): FiscalYearDates {
  // Si commence en janvier (mois 1) → année civile
  if (startMonth === 1) {
    return {
      startDate: `${fiscalYear}-01-${String(startDay).padStart(2, '0')}`,
      endDate: `${fiscalYear}-12-31`,
      fiscalYear
    };
  }

  // Exercice décalé : commence année N-1, finit année N
  const startYear = fiscalYear - 1;
  const endMonth = startMonth - 1; // Mois précédent
  const endDay = getLastDayOfMonth(fiscalYear, endMonth);

  const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const endDate = `${fiscalYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  return {
    startDate,
    endDate,
    fiscalYear
  };
}

/**
 * Calculer dates exercice fiscal depuis date de fin (format DD/MM)
 *
 * @param fiscalYear - Année de fin de l'exercice
 * @param fiscalYearEnd - Date de fin au format "DD/MM" (ex: "31/12", "30/06")
 * @returns Dates calculées
 *
 * @example
 * // Kenya (exercice se terminant le 30 juin)
 * calculateFiscalYearDatesFromEndDate(2024, "30/06")
 * // => { startDate: '2023-07-01', endDate: '2024-06-30', fiscalYear: 2024 }
 */
export function calculateFiscalYearDatesFromEndDate(
  fiscalYear: number,
  fiscalYearEnd: string
): FiscalYearDates {
  const [endDay, endMonth] = fiscalYearEnd.split('/').map(Number);

  // Si finit le 31/12 → année civile
  if (endMonth === 12 && endDay === 31) {
    return getCalendarYearDates(fiscalYear);
  }

  // Exercice décalé
  const startMonth = endMonth === 12 ? 1 : endMonth + 1; // Mois suivant
  const startDay = 1;
  const startYear = startMonth === 1 ? fiscalYear : fiscalYear - 1;

  const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const endDate = `${fiscalYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  return {
    startDate,
    endDate,
    fiscalYear
  };
}

/**
 * Obtenir dates année civile (01/01 → 31/12)
 *
 * @param year - Année
 * @returns Dates année civile
 */
export function getCalendarYearDates(year: number): FiscalYearDates {
  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    fiscalYear: year
  };
}

/**
 * Obtenir dernier jour du mois
 *
 * @param year - Année
 * @param month - Mois (1-12)
 * @returns Dernier jour (28-31)
 */
export function getLastDayOfMonth(year: number, month: number): number {
  // Créer date du 1er jour du mois suivant, puis soustraire 1 jour
  const date = new Date(year, month, 0);
  return date.getDate();
}

/**
 * Vérifier si une date est dans un exercice fiscal
 *
 * @param date - Date à vérifier (YYYY-MM-DD)
 * @param fiscalYearDates - Dates de l'exercice
 * @returns true si la date est dans l'exercice
 */
export function isDateInFiscalYear(date: string, fiscalYearDates: FiscalYearDates): boolean {
  return date >= fiscalYearDates.startDate && date <= fiscalYearDates.endDate;
}

/**
 * Obtenir l'exercice fiscal précédent
 *
 * @param companyId - ID de l'entreprise
 * @param fiscalYear - Année de l'exercice actuel
 * @returns Dates de l'exercice précédent
 */
export async function getPreviousFiscalYear(
  companyId: string,
  fiscalYear: number
): Promise<FiscalYearDates> {
  return await getFiscalYearDatesForCompany(companyId, fiscalYear - 1);
}

/**
 * Obtenir l'exercice fiscal suivant
 *
 * @param companyId - ID de l'entreprise
 * @param fiscalYear - Année de l'exercice actuel
 * @returns Dates de l'exercice suivant
 */
export async function getNextFiscalYear(
  companyId: string,
  fiscalYear: number
): Promise<FiscalYearDates> {
  return await getFiscalYearDatesForCompany(companyId, fiscalYear + 1);
}

/**
 * Obtenir l'exercice fiscal actuel pour une entreprise
 *
 * @param companyId - ID de l'entreprise
 * @param currentDate - Date actuelle (défaut: aujourd'hui)
 * @returns Dates de l'exercice fiscal actuel
 */
export async function getCurrentFiscalYear(
  companyId: string,
  currentDate: Date = new Date()
): Promise<FiscalYearDates> {
  const currentYear = currentDate.getFullYear();

  try {
    // Récupérer paramètres entreprise
    const { data: company, error } = await supabase
      .from('companies')
      .select('fiscal_year_start_month')
      .eq('id', companyId)
      .single();

    if (error || !company) {
      return getCalendarYearDates(currentYear);
    }

    const startMonth = company.fiscal_year_start_month || 1;

    // Si exercice décalé, déterminer si on est dans l'exercice N ou N+1
    if (startMonth > 1) {
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      if (currentMonth >= startMonth) {
        // On est dans l'exercice qui finira l'année prochaine
        return await getFiscalYearDatesForCompany(companyId, currentYear + 1);
      } else {
        // On est dans l'exercice qui finit cette année
        return await getFiscalYearDatesForCompany(companyId, currentYear);
      }
    }

    // Année civile
    return await getFiscalYearDatesForCompany(companyId, currentYear);

  } catch (error) {
    logger.error('FiscalYearHelpers', 'Erreur getCurrentFiscalYear:', error);
    return getCalendarYearDates(currentYear);
  }
}

/**
 * Export singleton service
 */
export const fiscalYearHelpers = {
  getFiscalYearDatesForCompany,
  calculateFiscalYearDates,
  calculateFiscalYearDatesFromEndDate,
  getCalendarYearDates,
  getLastDayOfMonth,
  isDateInFiscalYear,
  getPreviousFiscalYear,
  getNextFiscalYear,
  getCurrentFiscalYear,
};
