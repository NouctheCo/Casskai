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

// Service pour l'import/export de budgets au format Excel
import * as XLSX from 'xlsx';
import type { BudgetImportData, BudgetCategoryImport, BudgetAssumptionImport, CategoryType } from '@/types/budget.types';

export class BudgetImportExportService {
  private static instance: BudgetImportExportService;

  static getInstance(): BudgetImportExportService {
    if (!BudgetImportExportService.instance) {
      BudgetImportExportService.instance = new BudgetImportExportService();
    }
    return BudgetImportExportService.instance;
  }

  /**
   * Génère et télécharge un modèle Excel vide pour l'import de budget
   */
  async downloadBudgetTemplate(year: number, companyName: string = 'MonEntreprise'): Promise<void> {
    try {
      // Création du workbook
      const wb = XLSX.utils.book_new();

      // Feuille 1: Instructions
      const instructionsData = [
        ['MODÈLE DE BUDGET - INSTRUCTIONS'],
        [''],
        ['Ce fichier permet d\'importer un budget annuel dans CassKai'],
        [''],
        ['Instructions:'],
        ['1. Remplissez l\'onglet "Catégories" avec vos lignes budgétaires'],
        ['2. (Optionnel) Remplissez l\'onglet "Hypothèses" avec vos hypothèses'],
        ['3. Enregistrez le fichier'],
        ['4. Importez-le dans CassKai via le bouton "Importer"'],
        [''],
        ['Notes importantes:'],
        ['- Les montants doivent être en euros (ou votre devise)'],
        ['- category_type doit être: revenue, expense ou capex'],
        ['- Ne modifiez pas les en-têtes de colonnes'],
        ['- Les cellules en gris sont des exemples, vous pouvez les supprimer'],
      ];
      const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

      // Feuille 2: Catégories budgétaires
      const categoriesData = [
        [
          'category',
          'subcategory',
          'category_type',
          'jan',
          'feb',
          'mar',
          'apr',
          'may',
          'jun',
          'jul',
          'aug',
          'sep',
          'oct',
          'nov',
          'dec',
          'notes'
        ],
        // Exemples de lignes
        ['Ventes', 'Ventes produits', 'revenue', 50000, 50000, 52000, 55000, 58000, 60000, 62000, 65000, 63000, 68000, 70000, 75000, 'Croissance prévue 10%'],
        ['Ventes', 'Ventes services', 'revenue', 30000, 30000, 31000, 32000, 33000, 34000, 35000, 36000, 37000, 38000, 39000, 40000, ''],
        ['Charges', 'Salaires', 'expense', 80000, 80000, 80000, 82000, 82000, 82000, 85000, 85000, 85000, 85000, 85000, 90000, 'Augmentation prévue'],
        ['Charges', 'Loyer', 'expense', 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 'Loyer fixe mensuel'],
        ['Charges', 'Marketing', 'expense', 8000, 8000, 9000, 10000, 12000, 12000, 10000, 9000, 9000, 10000, 11000, 15000, 'Budget variable'],
        ['Investissements', 'Matériel informatique', 'capex', 0, 0, 15000, 0, 0, 0, 0, 0, 0, 0, 0, 10000, 'Renouvellement matériel'],
      ];
      const wsCategories = XLSX.utils.aoa_to_sheet(categoriesData);
      
      // Mise en forme des en-têtes
      const headerRange = XLSX.utils.decode_range(wsCategories['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!wsCategories[cellAddress]) continue;
        wsCategories[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center' }
        };
      }
      
      // Définir les largeurs de colonnes
      wsCategories['!cols'] = [
        { wch: 20 }, // category
        { wch: 20 }, // subcategory
        { wch: 15 }, // category_type
        { wch: 10 }, // jan
        { wch: 10 }, // feb
        { wch: 10 }, // mar
        { wch: 10 }, // apr
        { wch: 10 }, // may
        { wch: 10 }, // jun
        { wch: 10 }, // jul
        { wch: 10 }, // aug
        { wch: 10 }, // sep
        { wch: 10 }, // oct
        { wch: 10 }, // nov
        { wch: 10 }, // dec
        { wch: 30 }, // notes
      ];

      XLSX.utils.book_append_sheet(wb, wsCategories, 'Catégories');

      // Feuille 3: Hypothèses (optionnel)
      const assumptionsData = [
        ['key', 'description', 'value', 'unit', 'category'],
        ['growth_rate', 'Taux de croissance annuel', 10, '%', 'Général'],
        ['inflation_rate', 'Taux d\'inflation prévu', 2.5, '%', 'Économique'],
        ['employee_count', 'Nombre d\'employés', 25, 'personnes', 'RH'],
        ['avg_salary', 'Salaire moyen mensuel', 3500, '€', 'RH'],
      ];
      const wsAssumptions = XLSX.utils.aoa_to_sheet(assumptionsData);
      wsAssumptions['!cols'] = [
        { wch: 20 },
        { wch: 40 },
        { wch: 15 },
        { wch: 10 },
        { wch: 20 },
      ];
      XLSX.utils.book_append_sheet(wb, wsAssumptions, 'Hypothèses');

      // Télécharger le fichier
      const fileName = `Budget_${year}_${companyName}_Modele.xlsx`;
      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error('Error generating budget template:', error);
      throw new Error('Erreur lors de la génération du modèle Excel');
    }
  }

  /**
   * Importe un fichier Excel et retourne les données structurées
   */
  async importBudgetFromExcel(file: File): Promise<BudgetImportData> {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Vérifier que le fichier contient les feuilles nécessaires
      if (!workbook.SheetNames.includes('Catégories')) {
        throw new Error('Le fichier doit contenir une feuille "Catégories"');
      }

      // Lire les catégories
      const categoriesSheet = workbook.Sheets['Catégories'];
      const categoriesJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(categoriesSheet);

      // eslint-disable-next-line complexity
      const categories: BudgetCategoryImport[] = categoriesJson.map((row: Record<string, unknown>) => {
        // Valider les champs obligatoires
        if (!row.category || !row.category_type) {
          throw new Error('Chaque ligne doit avoir au minimum "category" et "category_type"');
        }

        // Valider le type de catégorie
        const validTypes: CategoryType[] = ['revenue', 'expense', 'capex'];
        if (!validTypes.includes(row.category_type as CategoryType)) {
          throw new Error(`category_type doit être: revenue, expense ou capex (trouvé: ${row.category_type})`);
        }

        const result: BudgetCategoryImport = {
          category: String(row.category).trim(),
          subcategory: row.subcategory ? String(row.subcategory).trim() : undefined,
          category_type: row.category_type as CategoryType,
          jan: Number(row.jan || 0),
          feb: Number(row.feb || 0),
          mar: Number(row.mar || 0),
          apr: Number(row.apr || 0),
          may: Number(row.may || 0),
          jun: Number(row.jun || 0),
          jul: Number(row.jul || 0),
          aug: Number(row.aug || 0),
          sep: Number(row.sep || 0),
          oct: Number(row.oct || 0),
          nov: Number(row.nov || 0),
          dec: Number(row.dec || 0),
          notes: row.notes ? String(row.notes) : undefined,
        };

        return result;
      });

      // Lire les hypothèses (optionnel)
      let assumptions: BudgetAssumptionImport[] = [];
      if (workbook.SheetNames.includes('Hypothèses')) {
        const assumptionsSheet = workbook.Sheets['Hypothèses'];
        const assumptionsJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(assumptionsSheet);

        assumptions = assumptionsJson.map((row: Record<string, unknown>) => ({
          key: String(row.key || '').trim(),
          description: String(row.description || '').trim(),
          value: row.value as number | string,
          unit: row.unit ? String(row.unit) : undefined,
          category: String(row.category || 'Général').trim(),
        }));
      }

      // Déterminer l'année (utiliser l'année en cours par défaut)
      const year = new Date().getFullYear();

      return {
        year,
        categories,
        assumptions,
        source: 'excel',
      };

    } catch (error) {
      console.error('Error importing budget from Excel:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur lors de l\'import du fichier Excel');
    }
  }

  /**
   * Exporte un budget existant vers Excel
   */
  async exportBudgetToExcel(
    year: number,
    categories: Array<{
      category: string;
      subcategory?: string;
      category_type: CategoryType;
      monthly_amounts: number[];
      notes?: string;
    }>,
    assumptions?: Array<{
      key: string;
      description: string;
      value: number | string;
      unit?: string;
      category: string;
    }>,
    companyName: string = 'MonEntreprise'
  ): Promise<void> {
    try {
      const wb = XLSX.utils.book_new();

      // Feuille Catégories
      const categoriesData = [
        [
          'category',
          'subcategory',
          'category_type',
          'jan',
          'feb',
          'mar',
          'apr',
          'may',
          'jun',
          'jul',
          'aug',
          'sep',
          'oct',
          'nov',
          'dec',
          'total',
          'notes'
        ],
        ...categories.map(cat => [
          cat.category,
          cat.subcategory || '',
          cat.category_type,
          cat.monthly_amounts[0] || 0,
          cat.monthly_amounts[1] || 0,
          cat.monthly_amounts[2] || 0,
          cat.monthly_amounts[3] || 0,
          cat.monthly_amounts[4] || 0,
          cat.monthly_amounts[5] || 0,
          cat.monthly_amounts[6] || 0,
          cat.monthly_amounts[7] || 0,
          cat.monthly_amounts[8] || 0,
          cat.monthly_amounts[9] || 0,
          cat.monthly_amounts[10] || 0,
          cat.monthly_amounts[11] || 0,
          cat.monthly_amounts.reduce((sum, val) => sum + val, 0),
          cat.notes || '',
        ])
      ];

      const wsCategories = XLSX.utils.aoa_to_sheet(categoriesData);
      wsCategories['!cols'] = [
        { wch: 20 }, { wch: 20 }, { wch: 15 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 12 }, { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(wb, wsCategories, 'Catégories');

      // Feuille Hypothèses (si présentes)
      if (assumptions && assumptions.length > 0) {
        const assumptionsData = [
          ['key', 'description', 'value', 'unit', 'category'],
          ...assumptions.map(ass => [
            ass.key,
            ass.description,
            ass.value,
            ass.unit || '',
            ass.category,
          ])
        ];
        const wsAssumptions = XLSX.utils.aoa_to_sheet(assumptionsData);
        wsAssumptions['!cols'] = [
          { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(wb, wsAssumptions, 'Hypothèses');
      }

      // Télécharger
      const fileName = `Budget_${year}_${companyName}_Export.xlsx`;
      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error('Error exporting budget to Excel:', error);
      throw new Error('Erreur lors de l\'export du budget');
    }
  }
}

export const budgetImportExportService = BudgetImportExportService.getInstance();
