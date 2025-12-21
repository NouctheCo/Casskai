// Mapping automatique compte → catégorie budget (PCG français)

export type BudgetCategory =
  | 'immobilisations'
  | 'stocks'
  | 'exploitation'
  | 'financier'
  | 'exceptionnel'
  | 'personnel'
  | 'impots'
  | 'non_categorise';

export interface BudgetCategoryInfo {
  id: BudgetCategory;
  labelFr: string;
  labelEn: string;
  labelEs: string;
  color: string;
}

export const BUDGET_CATEGORIES: Record<BudgetCategory, BudgetCategoryInfo> = {
  immobilisations: {
    id: 'immobilisations',
    labelFr: 'Immobilisations',
    labelEn: 'Fixed Assets',
    labelEs: 'Activos Fijos',
    color: '#3B82F6'
  },
  stocks: {
    id: 'stocks',
    labelFr: 'Stocks',
    labelEn: 'Inventory',
    labelEs: 'Inventario',
    color: '#F59E0B'
  },
  exploitation: {
    id: 'exploitation',
    labelFr: 'Exploitation',
    labelEn: 'Operations',
    labelEs: 'Operaciones',
    color: '#10B981'
  },
  financier: {
    id: 'financier',
    labelFr: 'Financier',
    labelEn: 'Financial',
    labelEs: 'Financiero',
    color: '#8B5CF6'
  },
  exceptionnel: {
    id: 'exceptionnel',
    labelFr: 'Exceptionnel',
    labelEn: 'Exceptional',
    labelEs: 'Excepcional',
    color: '#EF4444'
  },
  personnel: {
    id: 'personnel',
    labelFr: 'Personnel',
    labelEn: 'Personnel',
    labelEs: 'Personal',
    color: '#06B6D4'
  },
  impots: {
    id: 'impots',
    labelFr: 'Impôts & Taxes',
    labelEn: 'Taxes',
    labelEs: 'Impuestos',
    color: '#EC4899'
  },
  non_categorise: {
    id: 'non_categorise',
    labelFr: 'Non catégorisé',
    labelEn: 'Uncategorized',
    labelEs: 'Sin categoría',
    color: '#6B7280'
  }
};

/**
 * Mappe un numéro de compte vers une catégorie budgétaire selon le Plan Comptable Général français
 * @param accountNumber - Le numéro de compte (ex: "401", "64100", "701")
 * @returns La catégorie budgétaire correspondante
 */
export function mapAccountToBudgetCategory(accountNumber: string): BudgetCategory {
  if (!accountNumber) return 'non_categorise';

  const firstDigit = accountNumber.charAt(0);
  const prefix = accountNumber.substring(0, 2);

  switch (firstDigit) {
    case '1': // Capitaux
      return 'financier';
    case '2': // Immobilisations
      return 'immobilisations';
    case '3': // Stocks
      return 'stocks';
    case '4': // Tiers
      if (prefix === '44') return 'impots'; // État, impôts et taxes
      return 'exploitation';
    case '5': // Financiers
      return 'financier';
    case '6': // Charges
      if (prefix === '64') return 'personnel'; // Charges de personnel
      if (prefix === '66') return 'financier'; // Charges financières
      if (prefix === '67') return 'exceptionnel'; // Charges exceptionnelles
      return 'exploitation';
    case '7': // Produits
      if (prefix === '76') return 'financier'; // Produits financiers
      if (prefix === '77') return 'exceptionnel'; // Produits exceptionnels
      return 'exploitation';
    default:
      return 'non_categorise';
  }
}

/**
 * Retourne le label et la couleur de la catégorie budgétaire pour un compte
 * @param accountNumber - Le numéro de compte
 * @param locale - La locale ('fr', 'en', 'es')
 * @returns Un objet contenant le label et la couleur
 */
export function getBudgetCategoryLabel(
  accountNumber: string,
  locale: 'fr' | 'en' | 'es' = 'fr'
): { label: string; color: string } {
  const category = mapAccountToBudgetCategory(accountNumber);
  const info = BUDGET_CATEGORIES[category];

  const label = locale === 'fr'
    ? info.labelFr
    : locale === 'es'
    ? info.labelEs
    : info.labelEn;

  return { label, color: info.color };
}
