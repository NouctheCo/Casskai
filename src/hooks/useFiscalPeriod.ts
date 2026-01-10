/**
 * CassKai - Hook for fiscal period selection
 * Hook personnalisé pour la gestion de la sélection des périodes fiscales
 */
import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import {
  FiscalPeriod,
  getFiscalPeriods,
  getFiscalPeriod,
  getFiscalPeriodByYear,
  debugPeriod,
  getCurrentFiscalYear
} from '@/utils/periods';
export interface UseFiscalPeriodOptions {
  defaultPeriod?: string; // 'N', 'N-1', 'N-2', etc.
  defaultYear?: number; // Année spécifique
  yearsBack?: number; // Nombre d'années à remonter
  debug?: boolean; // Activer les logs de debug
}
export interface UseFiscalPeriodReturn {
  periods: FiscalPeriod[];
  selectedPeriod: FiscalPeriod | null;
  selectedYear: number | null;
  currentYear: number;
  handlePeriodChange: (periodValue: string) => void;
  handleYearChange: (year: number) => void;
  isLoading: boolean;
}
/**
 * Hook personnalisé pour gérer la sélection de périodes fiscales
 * @param options Options de configuration
 * @returns Utilitaires et état de gestion des périodes
 *
 * @example
 * ```tsx
 * const { periods, selectedPeriod, handlePeriodChange } = useFiscalPeriod({
 *   defaultPeriod: 'N-1', // Année précédente par défaut
 *   debug: true
 * });
 *
 * // Dans le JSX:
 * <select onChange={(e) => handlePeriodChange(e.target.value)}>
 *   {periods.map(p => (
 *     <option key={p.value} value={p.value}>{p.label}</option>
 *   ))}
 * </select>
 * ```
 */
export function useFiscalPeriod(options: UseFiscalPeriodOptions = {}): UseFiscalPeriodReturn {
  const {
    defaultPeriod = 'N',
    defaultYear,
    yearsBack = 5,
    debug = false
  } = options;
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<FiscalPeriod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentYear = getCurrentFiscalYear();
  // Initialiser les périodes
  useEffect(() => {
    setIsLoading(true);
    try {
      const allPeriods = getFiscalPeriods(yearsBack);
      setPeriods(allPeriods);
      // Sélectionner la période par défaut
      let initialPeriod: FiscalPeriod | null = null;
      if (defaultYear) {
        // Si une année spécifique est fournie, l'utiliser
        initialPeriod = getFiscalPeriodByYear(defaultYear);
        if (debug) {
          logger.debug('UseFiscalPeriod', '[useFiscalPeriod] Initializing with specific year:', defaultYear);
        }
      } else {
        // Sinon utiliser la valeur de période (N, N-1, etc.)
        initialPeriod = getFiscalPeriod(defaultPeriod);
        if (debug) {
          logger.debug('UseFiscalPeriod', '[useFiscalPeriod] Initializing with period value:', defaultPeriod);
        }
      }
      setSelectedPeriod(initialPeriod);
      if (debug && initialPeriod) {
        debugPeriod(initialPeriod);
      }
    } catch (error) {
      logger.error('UseFiscalPeriod', '[useFiscalPeriod] Error initializing periods:', error);
      setSelectedPeriod(null);
    } finally {
      setIsLoading(false);
    }
  }, [defaultPeriod, defaultYear, yearsBack, debug]);
  /**
   * Change la période sélectionnée par valeur (N, N-1, etc.)
   */
  const handlePeriodChange = useCallback((periodValue: string) => {
    const period = getFiscalPeriod(periodValue);
    setSelectedPeriod(period);
    if (debug) {
      logger.debug('UseFiscalPeriod', '[useFiscalPeriod] Period changed to:', periodValue);
      debugPeriod(period);
    }
  }, [debug]);
  /**
   * Change la période sélectionnée par année
   */
  const handleYearChange = useCallback((year: number) => {
    const period = getFiscalPeriodByYear(year);
    setSelectedPeriod(period);
    if (debug) {
      logger.debug('UseFiscalPeriod', '[useFiscalPeriod] Year changed to:', year);
      debugPeriod(period);
    }
  }, [debug]);
  return {
    periods,
    selectedPeriod,
    selectedYear: selectedPeriod?.year || null,
    currentYear,
    handlePeriodChange,
    handleYearChange,
    isLoading
  };
}
/**
 * Hook simplifié pour obtenir uniquement la liste des périodes
 */
export function useFiscalPeriodsList(yearsBack: number = 5): FiscalPeriod[] {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  useEffect(() => {
    setPeriods(getFiscalPeriods(yearsBack));
  }, [yearsBack]);
  return periods;
}