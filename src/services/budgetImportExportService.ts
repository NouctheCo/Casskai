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
import type { BudgetImportData, BudgetCategoryImport, BudgetAssumptionImport, CategoryType } from '@/types/budget.types';
import { logger } from '@/lib/logger';

// ExcelJS import conditionnel pour éviter les problèmes de build
let ExcelJS: typeof import('exceljs') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExcelJS = require('exceljs');
} catch (_error) {
  logger.warn('BudgetImportExport', 'ExcelJS not available in browser environment');
}

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
      if (!ExcelJS) {
        throw new Error('ExcelJS n\'est pas disponible dans cet environnement.');
      }

      const workbook = new ExcelJS.Workbook();

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

      const wsInstructions = workbook.addWorksheet('Instructions');
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

      const wsCategories = workbook.addWorksheet('Catégories');
      categoriesData.forEach((row) => wsCategories.addRow(row));

      // Largeurs de colonnes
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

      // Style en-têtes
      const headerRow = wsCategories.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        cell.alignment = { horizontal: 'center' };
      });

      // Feuille 3: Hypothèses (optionnel)
      const assumptionsData = [
        ['key', 'description', 'value', 'unit', 'category'],
        ['growth_rate', 'Taux de croissance annuel', 10, '%', 'Général'],
        ['inflation_rate', 'Taux d\'inflation prévu', 2.5, '%', 'Économique'],
        ['employee_count', 'Nombre d\'employés', 25, 'personnes', 'RH'],
        ['avg_salary', 'Salaire moyen mensuel', 3500, ' EUR', 'RH'],
      ];

      const wsAssumptions = workbook.addWorksheet('Hypothèses');
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
      const buffer = await workbook.xlsx.writeBuffer();
      this.downloadExcelBuffer(buffer, fileName);
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
      if (!ExcelJS) {
        throw new Error('ExcelJS n\'est pas disponible dans cet environnement.');
      }

      const data = await file.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);

      // Vérifier que le fichier contient les feuilles nécessaires
      const categoriesWorksheet = workbook.getWorksheet('Catégories');
      if (!categoriesWorksheet) {
        throw new Error('Le fichier doit contenir une feuille "Catégories"');
      }
      // Lire les catégories
      const categoriesJson = this.worksheetToJson(categoriesWorksheet);
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
      const assumptionsWorksheet = workbook.getWorksheet('Hypothèses');
      if (assumptionsWorksheet) {
        const assumptionsJson = this.worksheetToJson(assumptionsWorksheet);
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
      if (!ExcelJS) {
        throw new Error('ExcelJS n\'est pas disponible dans cet environnement.');
      }

      const workbook = new ExcelJS.Workbook();

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

      const wsCategories = workbook.addWorksheet('Catégories');
      categoriesData.forEach((row) => wsCategories.addRow(row));
      wsCategories.columns = [
        { width: 20 }, { width: 20 }, { width: 15 },
        { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
        { width: 12 }, { width: 30 }
      ];

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

        const wsAssumptions = workbook.addWorksheet('Hypothèses');
        assumptionsData.forEach((row) => wsAssumptions.addRow(row));
        wsAssumptions.columns = [
          { width: 20 }, { width: 40 }, { width: 15 }, { width: 10 }, { width: 20 }
        ];
      }
      // Télécharger
      const fileName = `Budget_${year}_${companyName}_Export.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      this.downloadExcelBuffer(buffer, fileName);
    } catch (error) {
      logger.error('BudgetImportExport', 'Error exporting budget to Excel:', error);
      throw new Error('Erreur lors de l\'export du budget');
    }
  }

  private downloadExcelBuffer(buffer: ArrayBuffer, fileName: string) {
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private worksheetToJson(worksheet: import('exceljs').Worksheet): Array<Record<string, unknown>> {
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];

    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber - 1] = String(this.normalizeCellValue(cell.value) ?? '').trim();
    });

    const rows: Array<Record<string, unknown>> = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;

      const record: Record<string, unknown> = {};
      let hasAnyValue = false;

      headers.forEach((header, index) => {
        if (!header) return;
        const value = this.normalizeCellValue(row.getCell(index + 1).value);
        record[header] = value;
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          hasAnyValue = true;
        }
      });

      if (hasAnyValue) {
        rows.push(record);
      }
    });

    return rows;
  }

  private normalizeCellValue(value: unknown): unknown {
    if (value && typeof value === 'object') {
      // Formula: { formula, result }
      if ('result' in (value as any)) {
        return (value as any).result;
      }
      // Rich text: { richText: [{ text }] }
      if ('richText' in (value as any) && Array.isArray((value as any).richText)) {
        return (value as any).richText.map((t: any) => t?.text ?? '').join('');
      }
      // Hyperlink: { text, hyperlink }
      if ('text' in (value as any)) {
        return (value as any).text;
      }
    }
    return value;
  }
}
export const budgetImportExportService = BudgetImportExportService.getInstance();