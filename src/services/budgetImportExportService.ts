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
import ExcelJS from 'exceljs';
import type { BudgetImportData, BudgetCategoryImport, BudgetAssumptionImport, CategoryType } from '@/types/budget.types';
import { logger } from '@/lib/logger';
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
      const wb = new ExcelJS.Workbook();
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
      const wsInstructions = wb.addWorksheet('Instructions');
      instructionsData.forEach((row) => wsInstructions.addRow(row));
      wsInstructions.columns = [{ width: 80 }];
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
      const wsCategories = wb.addWorksheet('Catégories');
      categoriesData.forEach((row) => wsCategories.addRow(row));
      // Mise en forme des en-têtes
      const headerRow = wsCategories.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
        cell.alignment = { horizontal: 'center' };
      });
      // Définir les largeurs de colonnes
      wsCategories.columns = [
        { width: 20 }, // category
        { width: 20 }, // subcategory
        { width: 15 }, // category_type
        { width: 10 }, // jan
        { width: 10 }, // feb
        { width: 10 }, // mar
        { width: 10 }, // apr
        { width: 10 }, // may
        { width: 10 }, // jun
        { width: 10 }, // jul
        { width: 10 }, // aug
        { width: 10 }, // sep
        { width: 10 }, // oct
        { width: 10 }, // nov
        { width: 10 }, // dec
        { width: 30 }, // notes
      ];
      // Feuille 3: Hypothèses (optionnel)
      const assumptionsData = [
        ['key', 'description', 'value', 'unit', 'category'],
        ['growth_rate', 'Taux de croissance annuel', 10, '%', 'Général'],
        ['inflation_rate', 'Taux d\'inflation prévu', 2.5, '%', 'Économique'],
        ['employee_count', 'Nombre d\'employés', 25, 'personnes', 'RH'],
        ['avg_salary', 'Salaire moyen mensuel', 3500, ' EUR', 'RH'],
      ];
      const wsAssumptions = wb.addWorksheet('Hypothèses');
      assumptionsData.forEach((row) => wsAssumptions.addRow(row));
      wsAssumptions.columns = [
        { width: 20 },
        { width: 40 },
        { width: 15 },
        { width: 10 },
        { width: 20 },
      ];
      // Télécharger le fichier
      const fileName = `Budget_${year}_${companyName}_Modele.xlsx`;
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('BudgetImportExport', 'Error generating budget template:', error);
      throw new Error('Erreur lors de la génération du modèle Excel');
    }
  }
  /**
   * Importe un fichier Excel et retourne les données structurées
   */
  async importBudgetFromExcel(file: File): Promise<BudgetImportData> {
    try {
      const data = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      // Vérifier que le fichier contient les feuilles nécessaires
      const categoriesSheet = workbook.getWorksheet('Catégories');
      if (!categoriesSheet) {
        throw new Error('Le fichier doit contenir une feuille "Catégories"');
      }
      const categories: BudgetCategoryImport[] = [];
      const categoryHeaders = (categoriesSheet.getRow(1).values as Array<string | number | null | undefined>)
        .slice(1)
        .map((header) => String(header || '').trim());
      categoriesSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowValues = row.values as Array<string | number | null | undefined>;
        const record: Record<string, unknown> = {};
        categoryHeaders.forEach((header, index) => {
          record[header] = rowValues[index + 1];
        });
        const hasValues = Object.values(record).some((value) => value !== undefined && value !== null && String(value).trim() !== '');
        if (!hasValues) return;
        // Valider les champs obligatoires
        if (!record.category || !record.category_type) {
          throw new Error('Chaque ligne doit avoir au minimum "category" et "category_type"');
        }
        // Valider le type de catégorie
        const validTypes: CategoryType[] = ['revenue', 'expense', 'capex'];
        if (!validTypes.includes(record.category_type as CategoryType)) {
          throw new Error(`category_type doit être: revenue, expense ou capex (trouvé: ${record.category_type})`);
        }
        const result: BudgetCategoryImport = {
          category: String(record.category).trim(),
          subcategory: record.subcategory ? String(record.subcategory).trim() : undefined,
          category_type: record.category_type as CategoryType,
          jan: Number(record.jan || 0),
          feb: Number(record.feb || 0),
          mar: Number(record.mar || 0),
          apr: Number(record.apr || 0),
          may: Number(record.may || 0),
          jun: Number(record.jun || 0),
          jul: Number(record.jul || 0),
          aug: Number(record.aug || 0),
          sep: Number(record.sep || 0),
          oct: Number(record.oct || 0),
          nov: Number(record.nov || 0),
          dec: Number(record.dec || 0),
          notes: record.notes ? String(record.notes) : undefined,
        };
        categories.push(result);
      });
      // Lire les hypothèses (optionnel)
      const assumptions: BudgetAssumptionImport[] = [];
      const assumptionsSheet = workbook.getWorksheet('Hypothèses');
      if (assumptionsSheet) {
        const assumptionsHeaders = (assumptionsSheet.getRow(1).values as Array<string | number | null | undefined>)
          .slice(1)
          .map((header) => String(header || '').trim());
        assumptionsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return;
          const rowValues = row.values as Array<string | number | null | undefined>;
          const record: Record<string, unknown> = {};
          assumptionsHeaders.forEach((header, index) => {
            record[header] = rowValues[index + 1];
          });
          const hasValues = Object.values(record).some((value) => value !== undefined && value !== null && String(value).trim() !== '');
          if (!hasValues) return;
          assumptions.push({
            key: String(record.key || '').trim(),
            description: String(record.description || '').trim(),
            value: record.value as number | string,
            unit: record.unit ? String(record.unit) : undefined,
            category: String(record.category || 'Général').trim(),
          });
        });
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
      logger.error('BudgetImportExport', 'Error importing budget from Excel:', error);
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
      const wb = new ExcelJS.Workbook();
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
      const wsCategories = wb.addWorksheet('Catégories');
      categoriesData.forEach((row) => wsCategories.addRow(row));
      wsCategories.columns = [
        { width: 20 }, { width: 20 }, { width: 15 },
        { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 12 }, { width: 30 }
      ];
      const headerRow = wsCategories.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
      });
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
        const wsAssumptions = wb.addWorksheet('Hypothèses');
        assumptionsData.forEach((row) => wsAssumptions.addRow(row));
        wsAssumptions.columns = [
          { width: 20 }, { width: 40 }, { width: 15 }, { width: 10 }, { width: 20 }
        ];
        const assumptionsHeader = wsAssumptions.getRow(1);
        assumptionsHeader.eachCell((cell) => {
          cell.font = { bold: true };
        });
      }
      // Télécharger
      const fileName = `Budget_${year}_${companyName}_Export.xlsx`;
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('BudgetImportExport', 'Error exporting budget to Excel:', error);
      throw new Error('Erreur lors de l\'export du budget');
    }
  }
}
export const budgetImportExportService = BudgetImportExportService.getInstance();