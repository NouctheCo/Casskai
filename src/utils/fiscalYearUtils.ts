/**
 * Utilitaires pour les années fiscales
 */

/**
 * Génère un tableau d'années depuis 2020 jusqu'à l'année en cours
 * @returns Array d'années dans l'ordre décroissant (année courante en premier)
 * @example
 * // En 2026, retourne: [2026, 2025, 2024, 2023, 2022, 2021, 2020]
 * const years = getFiscalYears();
 */
export function getFiscalYears(): number[] {
  const currentYear = new Date().getFullYear();
  const startYear = 2020;
  const length = currentYear - startYear + 1;

  return Array.from({ length }, (_, i) => currentYear - i);
}

/**
 * Retourne l'année fiscale en cours
 * @returns L'année en cours
 */
export function getCurrentFiscalYear(): number {
  return new Date().getFullYear();
}

/**
 * Vérifie si une année fiscale est valide (entre 2020 et l'année en cours)
 * @param year - Année à vérifier
 * @returns true si l'année est valide
 */
export function isValidFiscalYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year >= 2020 && year <= currentYear;
}
