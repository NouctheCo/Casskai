/**
 * Helpers de mapping entre les interfaces TypeScript et la base de données
 * pour le module Budget
 *
 * La base de données utilise 'line_type' pour éviter un conflit avec le mot réservé SQL 'type'
 * Le code TypeScript utilise 'type' pour une meilleure lisibilité
 */

interface BudgetCategory {
  id?: string;
  budget_id?: string;
  account_id: string;
  account_number?: string;
  account_name?: string;
  subcategory?: string;
  type: 'revenue' | 'expense';
  annual_amount: number;
  growth_rate: number;
  monthly_distribution: number[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface BudgetLineDB {
  id?: string;
  budget_id?: string;
  account_id: string;
  account_number?: string;
  account_name?: string;
  subcategory?: string;
  line_type: 'revenue' | 'expense';
  annual_amount: number;
  growth_rate: number;
  monthly_distribution: number[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Convertit une catégorie budget TypeScript vers le format DB
 * @param category - Catégorie au format TypeScript
 * @returns Objet compatible avec la table budget_lines
 */
export const toBudgetLineDB = (category: BudgetCategory): BudgetLineDB => {
  const { type, ...rest } = category;
  return {
    ...rest,
    line_type: type,
  };
};

/**
 * Convertit une ligne de budget DB vers le format TypeScript
 * @param row - Ligne de la table budget_lines
 * @returns Catégorie au format TypeScript
 */
export const fromBudgetLineDB = (row: BudgetLineDB): BudgetCategory => {
  const { line_type, ...rest } = row;
  return {
    ...rest,
    type: line_type,
  };
};

/**
 * Convertit un array de catégories TypeScript vers le format DB
 * @param categories - Array de catégories TypeScript
 * @returns Array compatible avec la table budget_lines
 */
export const toBudgetLinesDB = (categories: BudgetCategory[]): BudgetLineDB[] => {
  return categories.map(toBudgetLineDB);
};

/**
 * Convertit un array de lignes DB vers le format TypeScript
 * @param rows - Array de lignes de la table budget_lines
 * @returns Array de catégories TypeScript
 */
export const fromBudgetLinesDB = (rows: BudgetLineDB[]): BudgetCategory[] => {
  return rows.map(fromBudgetLineDB);
};

/**
 * Type guard pour vérifier si un objet est une BudgetLineDB
 */
export const isBudgetLineDB = (obj: any): obj is BudgetLineDB => {
  return obj && typeof obj === 'object' && 'line_type' in obj;
};

/**
 * Type guard pour vérifier si un objet est une BudgetCategory
 */
export const isBudgetCategory = (obj: any): obj is BudgetCategory => {
  return obj && typeof obj === 'object' && 'type' in obj;
};

// Export des types pour utilisation dans d'autres fichiers
export type { BudgetCategory, BudgetLineDB };
