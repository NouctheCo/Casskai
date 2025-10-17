/**
 * Utilitaires pour le calcul et l'affichage des tendances/variations
 * Version: 1.0.0
 *
 * Ces fonctions permettent de calculer et formater les variations entre deux périodes
 * de manière cohérente dans toute l'application.
 */

/**
 * Calcule la variation en pourcentage entre deux valeurs
 * @param current - Valeur actuelle
 * @param previous - Valeur précédente
 * @returns Pourcentage de variation ou null si calcul impossible
 *
 * @example
 * calculateTrend(120, 100) // Returns 20 (+20%)
 * calculateTrend(80, 100) // Returns -20 (-20%)
 * calculateTrend(100, 0) // Returns null (division par zéro)
 */
export const calculateTrend = (current: number, previous: number): number | null => {
  // Si valeur précédente est 0, on ne peut pas calculer de variation
  if (previous === 0) {
    // Si la valeur actuelle est aussi 0, pas de changement
    if (current === 0) return 0;
    // Sinon, on ne peut pas calculer de variation en %
    return null;
  }

  return Math.round(((current - previous) / previous) * 100);
};

/**
 * Formate une variation en string avec signe
 * @param trend - Pourcentage de variation
 * @returns String formatée avec signe (+/-) ou "-" si null
 *
 * @example
 * formatTrend(20) // Returns "+20%"
 * formatTrend(-15) // Returns "-15%"
 * formatTrend(0) // Returns "0%"
 * formatTrend(null) // Returns "-"
 */
export const formatTrend = (trend: number | null): string => {
  if (trend === null) return '-';
  if (trend === 0) return '0%';
  return `${trend > 0 ? '+' : ''}${trend}%`;
};

/**
 * Retourne la classe CSS Tailwind pour la couleur selon la tendance
 * @param trend - Pourcentage de variation
 * @param inverse - Si true, inverse les couleurs (rouge pour positif, vert pour négatif)
 * @returns Classe CSS Tailwind
 *
 * @example
 * getTrendColor(20) // Returns "text-green-600 dark:text-green-400"
 * getTrendColor(-15) // Returns "text-red-600 dark:text-red-400"
 * getTrendColor(20, true) // Returns "text-red-600 dark:text-red-400" (inversé)
 * getTrendColor(null) // Returns "text-gray-400 dark:text-gray-500"
 */
export const getTrendColor = (trend: number | null, inverse: boolean = false): string => {
  if (trend === null || trend === 0) return 'text-gray-400 dark:text-gray-500';

  const isPositive = trend > 0;
  const shouldBeGreen = inverse ? !isPositive : isPositive;

  return shouldBeGreen
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';
};

/**
 * Retourne l'icône appropriée selon la tendance
 * @param trend - Pourcentage de variation
 * @returns Nom de l'icône Lucide
 */
export const getTrendIcon = (trend: number | null): string => {
  if (trend === null || trend === 0) return 'Minus';
  return trend > 0 ? 'TrendingUp' : 'TrendingDown';
};

/**
 * Calcule la variation entre deux valeurs avec formatage complet
 * @param current - Valeur actuelle
 * @param previous - Valeur précédente
 * @param inverse - Si true, inverse les couleurs
 * @returns Objet avec toutes les informations de tendance
 */
export const calculateFullTrend = (
  current: number,
  previous: number,
  inverse: boolean = false
) => {
  const trend = calculateTrend(current, previous);

  return {
    value: trend,
    formatted: formatTrend(trend),
    color: getTrendColor(trend, inverse),
    icon: getTrendIcon(trend),
    hasData: trend !== null
  };
};

/**
 * Calcule les dates de la période précédente pour comparaison
 * @param period - Type de période ('current-month', 'current-quarter', etc.)
 * @returns Objet avec start et end de la période précédente
 */
export const getPreviousPeriodDates = (period: string): { start: string; end: string } => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  switch (period) {
    case 'current-month':
    case 'month': {
      // Mois précédent
      const prevMonth = currentMonth - 1;
      const prevYear = prevMonth < 0 ? currentYear - 1 : currentYear;
      const month = prevMonth < 0 ? 11 : prevMonth;
      return {
        start: new Date(prevYear, month, 1).toISOString().split('T')[0],
        end: new Date(prevYear, month + 1, 0).toISOString().split('T')[0]
      };
    }

    case 'current-quarter':
    case 'quarter': {
      // Trimestre précédent
      const quarterStart = Math.floor(currentMonth / 3) * 3;
      const prevQuarterStart = quarterStart - 3;
      const qYear = prevQuarterStart < 0 ? currentYear - 1 : currentYear;
      const qMonth = prevQuarterStart < 0 ? 9 : prevQuarterStart;
      return {
        start: new Date(qYear, qMonth, 1).toISOString().split('T')[0],
        end: new Date(qYear, qMonth + 3, 0).toISOString().split('T')[0]
      };
    }

    case 'current-year':
    case 'year':
      // Année précédente
      return {
        start: new Date(currentYear - 1, 0, 1).toISOString().split('T')[0],
        end: new Date(currentYear - 1, 11, 31).toISOString().split('T')[0]
      };

    case 'last-month': {
      // Mois d'avant le mois dernier (N-2)
      const lastMonth = currentMonth - 2;
      const lYear = lastMonth < 0 ? currentYear - 1 : currentYear;
      const lMonth = lastMonth < 0 ? 12 + lastMonth : lastMonth;
      return {
        start: new Date(lYear, lMonth, 1).toISOString().split('T')[0],
        end: new Date(lYear, lMonth + 1, 0).toISOString().split('T')[0]
      };
    }

    case '7d': {
      // 7 jours précédents (J-14 à J-8)
      const end7d = new Date(now);
      end7d.setDate(end7d.getDate() - 8);
      const start7d = new Date(end7d);
      start7d.setDate(start7d.getDate() - 6);
      return {
        start: start7d.toISOString().split('T')[0],
        end: end7d.toISOString().split('T')[0]
      };
    }

    case '30d': {
      // 30 jours précédents (J-60 à J-31)
      const end30d = new Date(now);
      end30d.setDate(end30d.getDate() - 31);
      const start30d = new Date(end30d);
      start30d.setDate(start30d.getDate() - 29);
      return {
        start: start30d.toISOString().split('T')[0],
        end: end30d.toISOString().split('T')[0]
      };
    }

    default: {
      // Par défaut: mois précédent
      const defPrevMonth = currentMonth - 1;
      const defYear = defPrevMonth < 0 ? currentYear - 1 : currentYear;
      const defMonth = defPrevMonth < 0 ? 11 : defPrevMonth;
      return {
        start: new Date(defYear, defMonth, 1).toISOString().split('T')[0],
        end: new Date(defYear, defMonth + 1, 0).toISOString().split('T')[0]
      };
    }
  }
};

/**
 * Formate un nombre en devise
 * @param amount - Montant à formater
 * @param currency - Code devise (EUR, USD, etc.)
 * @param locale - Locale pour le formatage
 * @returns String formatée
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formate un nombre en pourcentage
 * @param value - Valeur à formater (0.15 pour 15%)
 * @param decimals - Nombre de décimales
 * @returns String formatée
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};
