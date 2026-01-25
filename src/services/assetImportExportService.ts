/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Service d'import/export des immobilisations
 * Formats supportés: CSV, Excel (XLSX), JSON
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  Asset,
  AssetCategory,
  AssetDepreciationScheduleLine,
  DepreciationMethod,
  AssetStatus,
} from '@/types/assets.types';

// ============================================================================
// TYPES
// ============================================================================

export interface AssetExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  includeSchedule: boolean; // Inclure le plan d'amortissement
  includeDisposed: boolean; // Inclure les immobilisations cédées
  categoryIds?: string[]; // Filtrer par catégories
  dateFrom?: string;
  dateTo?: string;
  locale: 'fr' | 'en' | 'es';
}

export interface AssetImportResult {
  success: boolean;
  imported: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
  warnings: string[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface AssetImportRow {
  asset_number?: string;
  name: string;
  description?: string;
  category_name?: string;
  category_code?: string;
  acquisition_date: string;
  acquisition_value: number | string;
  depreciation_method: string;
  depreciation_start_date?: string;
  duration_years: number | string;
  declining_rate?: number | string;
  residual_value?: number | string;
  location?: string;
  responsible_person?: string;
  serial_number?: string;
  invoice_reference?: string;
  notes?: string;
  status?: string;
  // Comptes comptables optionnels
  account_asset?: string;
  account_depreciation?: string;
  account_expense?: string;
}

// Labels par langue
const COLUMN_LABELS = {
  fr: {
    asset_number: 'N° inventaire',
    name: 'Nom',
    description: 'Description',
    category_name: 'Catégorie',
    acquisition_date: 'Date acquisition',
    acquisition_value: 'Valeur acquisition',
    depreciation_method: 'Méthode amortissement',
    depreciation_start_date: 'Début amortissement',
    duration_years: 'Durée (années)',
    declining_rate: 'Coefficient dégressif',
    residual_value: 'Valeur résiduelle',
    total_depreciation: 'Amortissements cumulés',
    net_book_value: 'VNC',
    status: 'Statut',
    location: 'Localisation',
    responsible_person: 'Responsable',
    serial_number: 'N° série',
    invoice_reference: 'Réf. facture',
    notes: 'Notes',
    account_asset: 'Compte immobilisation',
    account_depreciation: 'Compte amortissement',
    account_expense: 'Compte dotation',
    created_at: 'Date création',
  },
  en: {
    asset_number: 'Asset Number',
    name: 'Name',
    description: 'Description',
    category_name: 'Category',
    acquisition_date: 'Acquisition Date',
    acquisition_value: 'Acquisition Value',
    depreciation_method: 'Depreciation Method',
    depreciation_start_date: 'Depreciation Start',
    duration_years: 'Useful Life (years)',
    declining_rate: 'Declining Rate',
    residual_value: 'Residual Value',
    total_depreciation: 'Accumulated Depreciation',
    net_book_value: 'Net Book Value',
    status: 'Status',
    location: 'Location',
    responsible_person: 'Responsible Person',
    serial_number: 'Serial Number',
    invoice_reference: 'Invoice Reference',
    notes: 'Notes',
    account_asset: 'Asset Account',
    account_depreciation: 'Depreciation Account',
    account_expense: 'Expense Account',
    created_at: 'Created Date',
  },
  es: {
    asset_number: 'N° Inventario',
    name: 'Nombre',
    description: 'Descripción',
    category_name: 'Categoría',
    acquisition_date: 'Fecha Adquisición',
    acquisition_value: 'Valor Adquisición',
    depreciation_method: 'Método Depreciación',
    depreciation_start_date: 'Inicio Depreciación',
    duration_years: 'Vida Útil (años)',
    declining_rate: 'Coeficiente Decreciente',
    residual_value: 'Valor Residual',
    total_depreciation: 'Depreciación Acumulada',
    net_book_value: 'VNC',
    status: 'Estado',
    location: 'Ubicación',
    responsible_person: 'Responsable',
    serial_number: 'N° Serie',
    invoice_reference: 'Ref. Factura',
    notes: 'Notas',
    account_asset: 'Cuenta Activo',
    account_depreciation: 'Cuenta Depreciación',
    account_expense: 'Cuenta Gasto',
    created_at: 'Fecha Creación',
  },
};

const STATUS_LABELS = {
  fr: { active: 'Actif', disposed: 'Cédé', fully_depreciated: 'Amorti', under_maintenance: 'En maintenance' },
  en: { active: 'Active', disposed: 'Disposed', fully_depreciated: 'Fully Depreciated', under_maintenance: 'Under Maintenance' },
  es: { active: 'Activo', disposed: 'Cedido', fully_depreciated: 'Depreciado', under_maintenance: 'En Mantenimiento' },
};

const METHOD_LABELS = {
  fr: { linear: 'Linéaire', declining_balance: 'Dégressif', units_of_production: 'Unités d\'œuvre' },
  en: { linear: 'Straight-line', declining_balance: 'Declining Balance', units_of_production: 'Units of Production' },
  es: { linear: 'Lineal', declining_balance: 'Decreciente', units_of_production: 'Unidades de Producción' },
};

// ============================================================================
// CLASSE PRINCIPALE
// ============================================================================

export class AssetImportExportService {

  // ============================================================================
  // EXPORT
  // ============================================================================

  /**
   * Exporte les immobilisations au format demandé
   */
  static async exportAssets(
    companyId: string,
    options: AssetExportOptions
  ): Promise<{ data: string | Blob; filename: string; mimeType: string }> {
    try {
      // 1. Récupérer les immobilisations
      let query = supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(id, name, code)
        `)
        .eq('company_id', companyId)
        .order('acquisition_date', { ascending: false });

      if (!options.includeDisposed) {
        query = query.neq('status', 'disposed');
      }

      if (options.categoryIds && options.categoryIds.length > 0) {
        query = query.in('category_id', options.categoryIds);
      }

      if (options.dateFrom) {
        query = query.gte('acquisition_date', options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte('acquisition_date', options.dateTo);
      }

      const { data: assets, error } = await query;

      if (error) throw error;

      // 2. Récupérer les plans d'amortissement si demandé
      const schedules: Map<string, AssetDepreciationScheduleLine[]> = new Map();
      if (options.includeSchedule) {
        const assetIds = assets?.map(a => a.id) || [];
        if (assetIds.length > 0) {
          const { data: scheduleData } = await supabase
            .from('asset_depreciation_schedule')
            .select('*')
            .in('asset_id', assetIds)
            .order('period_start_date');

          for (const line of scheduleData || []) {
            if (!schedules.has(line.asset_id)) {
              schedules.set(line.asset_id, []);
            }
            schedules.get(line.asset_id)!.push(line);
          }
        }
      }

      // 3. Formater selon le format demandé
      const labels = COLUMN_LABELS[options.locale];
      const statusLabels = STATUS_LABELS[options.locale];
      const methodLabels = METHOD_LABELS[options.locale];

      const timestamp = new Date().toISOString().slice(0, 10);

      switch (options.format) {
        case 'csv':
          return {
            data: this.formatToCSV(assets || [], labels, statusLabels, methodLabels),
            filename: `immobilisations_${timestamp}.csv`,
            mimeType: 'text/csv;charset=utf-8',
          };

        case 'json':
          return {
            data: JSON.stringify({
              exported_at: new Date().toISOString(),
              company_id: companyId,
              count: assets?.length || 0,
              assets: assets?.map(a => ({
                ...a,
                schedule: options.includeSchedule ? schedules.get(a.id) || [] : undefined,
              })),
            }, null, 2),
            filename: `immobilisations_${timestamp}.json`,
            mimeType: 'application/json',
          };

        case 'xlsx':
          // Pour Excel, on retourne les données formatées pour utilisation avec une lib comme xlsx
          return {
            data: this.formatToXLSX(assets || [], labels, statusLabels, methodLabels, schedules, options.includeSchedule),
            filename: `immobilisations_${timestamp}.xlsx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          };

        default:
          throw new Error(`Format non supporté: ${options.format}`);
      }

    } catch (error) {
      logger.error('AssetImportExportService', 'Erreur export:', error);
      throw error;
    }
  }

  /**
   * Exporte le plan d'amortissement d'une immobilisation
   */
  static async exportDepreciationSchedule(
    assetId: string,
    locale: 'fr' | 'en' | 'es' = 'fr'
  ): Promise<string> {
    try {
      const { data: asset } = await supabase
        .from('assets')
        .select('name, asset_number')
        .eq('id', assetId)
        .single();

      const { data: schedule } = await supabase
        .from('asset_depreciation_schedule')
        .select('*')
        .eq('asset_id', assetId)
        .order('period_start_date');

      const scheduleLabels = {
        fr: ['Année', 'Période', 'Date début', 'Date fin', 'VNC début', 'Dotation', 'Cumulé', 'VNC fin', 'Prorata', 'Statut'],
        en: ['Year', 'Period', 'Start Date', 'End Date', 'Opening NBV', 'Depreciation', 'Cumulative', 'Closing NBV', 'Prorata', 'Status'],
        es: ['Año', 'Período', 'Fecha Inicio', 'Fecha Fin', 'VNC Apertura', 'Depreciación', 'Acumulado', 'VNC Cierre', 'Prorata', 'Estado'],
      };

      const statusLabels = {
        fr: { true: 'Passée', false: 'En attente' },
        en: { true: 'Posted', false: 'Pending' },
        es: { true: 'Contabilizada', false: 'Pendiente' },
      };

      const headers = scheduleLabels[locale];
      const rows = (schedule || []).map(line => [
        line.fiscal_year,
        line.period_number,
        line.period_start_date,
        line.period_end_date,
        this.formatNumber(line.opening_net_book_value),
        this.formatNumber(line.depreciation_amount),
        this.formatNumber(line.cumulative_depreciation),
        this.formatNumber(line.closing_net_book_value),
        line.prorata_days ? `${line.prorata_days}j` : '-',
        statusLabels[locale][String(line.is_posted) as 'true' | 'false'],
      ]);

      // BOM pour Excel + headers + données
      const BOM = '\uFEFF';
      const csv = BOM + [
        `# ${asset?.name || 'Immobilisation'} (${asset?.asset_number || assetId})`,
        headers.join(';'),
        ...rows.map(row => row.join(';')),
      ].join('\n');

      return csv;

    } catch (error) {
      logger.error('AssetImportExportService', 'Erreur export plan:', error);
      throw error;
    }
  }

  // ============================================================================
  // IMPORT
  // ============================================================================

  /**
   * Importe des immobilisations depuis un fichier CSV ou JSON
   */
  static async importAssets(
    companyId: string,
    data: string,
    format: 'csv' | 'json',
    options: {
      updateExisting: boolean;
      createCategories: boolean;
      generateSchedules: boolean;
    } = { updateExisting: false, createCategories: true, generateSchedules: true }
  ): Promise<AssetImportResult> {
    const result: AssetImportResult = {
      success: true,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      warnings: [],
    };

    try {
      // 1. Parser les données
      let rows: AssetImportRow[];
      if (format === 'csv') {
        rows = this.parseCSV(data);
      } else {
        const parsed = JSON.parse(data);
        rows = Array.isArray(parsed) ? parsed : parsed.assets || [];
      }

      if (rows.length === 0) {
        result.success = false;
        result.errors.push({ row: 0, message: 'Aucune donnée à importer' });
        return result;
      }

      // 2. Récupérer les catégories existantes
      const { data: existingCategories } = await supabase
        .from('asset_categories')
        .select('*')
        .eq('company_id', companyId);

      const categoryMap = new Map<string, AssetCategory>();
      for (const cat of existingCategories || []) {
        categoryMap.set(cat.name.toLowerCase(), cat);
        if (cat.code) {
          categoryMap.set(cat.code.toLowerCase(), cat);
        }
      }

      // 3. Récupérer les immobilisations existantes (par numéro d'inventaire)
      const { data: existingAssets } = await supabase
        .from('assets')
        .select('id, asset_number')
        .eq('company_id', companyId);

      const assetNumberMap = new Map<string, string>();
      for (const asset of existingAssets || []) {
        if (asset.asset_number) {
          assetNumberMap.set(asset.asset_number.toLowerCase(), asset.id);
        }
      }

      const { data: user } = await supabase.auth.getUser();

      // 4. Traiter chaque ligne
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 car header + index 0

        try {
          // Validation
          const validation = this.validateRow(row, rowNum);
          if (validation.errors.length > 0) {
            result.errors.push(...validation.errors);
            result.skipped++;
            continue;
          }
          result.warnings.push(...validation.warnings);

          // Résoudre la catégorie
          let categoryId: string | undefined;
          if (row.category_name || row.category_code) {
            const catKey = (row.category_name || row.category_code || '').toLowerCase();
            let category = categoryMap.get(catKey);

            if (!category && options.createCategories && row.category_name) {
              // Créer la catégorie
              const { data: newCat, error: catError } = await supabase
                .from('asset_categories')
                .insert({
                  company_id: companyId,
                  name: row.category_name,
                  code: row.category_code,
                  default_depreciation_method: this.parseDepreciationMethod(row.depreciation_method),
                  default_duration_years: Number(row.duration_years) || 5,
                  is_active: true,
                  created_by: user.user?.id,
                })
                .select()
                .single();

              if (!catError && newCat) {
                category = newCat;
                categoryMap.set(catKey, newCat);
                result.warnings.push(`Ligne ${rowNum}: Catégorie "${row.category_name}" créée automatiquement`);
              }
            }

            categoryId = category?.id;
          }

          // Vérifier si l'immobilisation existe déjà
          const existingId = row.asset_number ? assetNumberMap.get(row.asset_number.toLowerCase()) : undefined;

          if (existingId && !options.updateExisting) {
            result.skipped++;
            result.warnings.push(`Ligne ${rowNum}: Immobilisation "${row.asset_number}" existe déjà, ignorée`);
            continue;
          }

          // Préparer les données
          const assetData = {
            company_id: companyId,
            asset_number: row.asset_number || undefined,
            name: row.name,
            description: row.description || undefined,
            category_id: categoryId,
            acquisition_date: row.acquisition_date,
            acquisition_value: Number(row.acquisition_value),
            depreciation_method: this.parseDepreciationMethod(row.depreciation_method),
            depreciation_start_date: row.depreciation_start_date || row.acquisition_date,
            duration_years: Number(row.duration_years),
            declining_rate: row.declining_rate ? Number(row.declining_rate) : undefined,
            residual_value: row.residual_value ? Number(row.residual_value) : 0,
            location: row.location || undefined,
            responsible_person: row.responsible_person || undefined,
            serial_number: row.serial_number || undefined,
            invoice_reference: row.invoice_reference || undefined,
            notes: row.notes || undefined,
            status: this.parseStatus(row.status) || 'active',
            account_asset: row.account_asset || undefined,
            account_depreciation: row.account_depreciation || undefined,
            account_expense: row.account_expense || undefined,
            total_depreciation: 0,
            net_book_value: Number(row.acquisition_value) - (Number(row.residual_value) || 0),
            created_by: user.user?.id,
          };

          if (existingId && options.updateExisting) {
            // Mise à jour
            const { error: updateError } = await supabase
              .from('assets')
              .update(assetData)
              .eq('id', existingId);

            if (updateError) {
              result.errors.push({ row: rowNum, message: `Erreur mise à jour: ${updateError.message}` });
              result.skipped++;
            } else {
              result.updated++;
              if (options.generateSchedules) {
                await this.regenerateSchedule(existingId);
              }
            }
          } else {
            // Création
            const { data: newAsset, error: insertError } = await supabase
              .from('assets')
              .insert(assetData)
              .select()
              .single();

            if (insertError) {
              result.errors.push({ row: rowNum, message: `Erreur création: ${insertError.message}` });
              result.skipped++;
            } else {
              result.imported++;
              if (options.generateSchedules && newAsset) {
                await this.regenerateSchedule(newAsset.id);
              }
            }
          }

        } catch (rowError: any) {
          result.errors.push({ row: rowNum, message: `Erreur: ${rowError.message}` });
          result.skipped++;
        }
      }

      result.success = result.errors.length === 0;

    } catch (error: any) {
      logger.error('AssetImportExportService', 'Erreur import:', error);
      result.success = false;
      result.errors.push({ row: 0, message: `Erreur globale: ${error.message}` });
    }

    return result;
  }

  /**
   * Génère un fichier modèle pour l'import
   */
  static generateTemplate(locale: 'fr' | 'en' | 'es' = 'fr'): string {
    const labels = COLUMN_LABELS[locale];
    const methodLabels = METHOD_LABELS[locale];

    const headers = [
      labels.asset_number,
      labels.name,
      labels.description,
      labels.category_name,
      labels.acquisition_date,
      labels.acquisition_value,
      labels.depreciation_method,
      labels.depreciation_start_date,
      labels.duration_years,
      labels.declining_rate,
      labels.residual_value,
      labels.location,
      labels.responsible_person,
      labels.serial_number,
      labels.invoice_reference,
      labels.notes,
      labels.account_asset,
      labels.account_depreciation,
      labels.account_expense,
    ];

    // Exemple de ligne
    const exampleRow = [
      'IMM-2025-001',
      'MacBook Pro 16"',
      'Ordinateur portable',
      'Matériel informatique',
      '2025-01-15',
      '2499.00',
      methodLabels.linear,
      '2025-01-15',
      '3',
      '',
      '0',
      'Bureau Paris',
      'Jean Dupont',
      'ABC123XYZ',
      'FA-2025-001',
      'Achat via Apple Store',
      '2183',
      '28183',
      '68112',
    ];

    const BOM = '\uFEFF';
    return BOM + [
      headers.join(';'),
      exampleRow.join(';'),
    ].join('\n');
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  private static formatToCSV(
    assets: any[],
    labels: Record<string, string>,
    statusLabels: Record<string, string>,
    methodLabels: Record<string, string>
  ): string {
    const headers = [
      labels.asset_number,
      labels.name,
      labels.description,
      labels.category_name,
      labels.acquisition_date,
      labels.acquisition_value,
      labels.depreciation_method,
      labels.depreciation_start_date,
      labels.duration_years,
      labels.declining_rate,
      labels.residual_value,
      labels.total_depreciation,
      labels.net_book_value,
      labels.status,
      labels.location,
      labels.responsible_person,
      labels.serial_number,
      labels.invoice_reference,
      labels.notes,
      labels.account_asset,
      labels.account_depreciation,
      labels.account_expense,
      labels.created_at,
    ];

    const rows = assets.map(asset => [
      asset.asset_number || '',
      this.escapeCSV(asset.name),
      this.escapeCSV(asset.description || ''),
      (asset.category as any)?.name || '',
      asset.acquisition_date,
      this.formatNumber(asset.acquisition_value),
      methodLabels[asset.depreciation_method as keyof typeof methodLabels] || asset.depreciation_method,
      asset.depreciation_start_date,
      asset.duration_years,
      asset.declining_rate || '',
      this.formatNumber(asset.residual_value),
      this.formatNumber(asset.total_depreciation),
      this.formatNumber(asset.net_book_value),
      statusLabels[asset.status as keyof typeof statusLabels] || asset.status,
      this.escapeCSV(asset.location || ''),
      this.escapeCSV(asset.responsible_person || ''),
      asset.serial_number || '',
      asset.invoice_reference || '',
      this.escapeCSV(asset.notes || ''),
      asset.account_asset || '',
      asset.account_depreciation || '',
      asset.account_expense || '',
      asset.created_at?.slice(0, 10) || '',
    ]);

    const BOM = '\uFEFF';
    return BOM + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
  }

  private static formatToXLSX(
    assets: any[],
    labels: Record<string, string>,
    statusLabels: Record<string, string>,
    methodLabels: Record<string, string>,
    schedules: Map<string, AssetDepreciationScheduleLine[]>,
    includeSchedule: boolean
  ): string {
    // Retourne les données JSON formatées pour être utilisées avec une lib comme xlsx
    // L'application frontend utilisera ces données avec xlsx.utils.json_to_sheet()
    const formattedAssets = assets.map(asset => ({
      [labels.asset_number]: asset.asset_number || '',
      [labels.name]: asset.name,
      [labels.description]: asset.description || '',
      [labels.category_name]: (asset.category as any)?.name || '',
      [labels.acquisition_date]: asset.acquisition_date,
      [labels.acquisition_value]: asset.acquisition_value,
      [labels.depreciation_method]: methodLabels[asset.depreciation_method as keyof typeof methodLabels] || asset.depreciation_method,
      [labels.depreciation_start_date]: asset.depreciation_start_date,
      [labels.duration_years]: asset.duration_years,
      [labels.declining_rate]: asset.declining_rate || '',
      [labels.residual_value]: asset.residual_value,
      [labels.total_depreciation]: asset.total_depreciation,
      [labels.net_book_value]: asset.net_book_value,
      [labels.status]: statusLabels[asset.status as keyof typeof statusLabels] || asset.status,
      [labels.location]: asset.location || '',
      [labels.responsible_person]: asset.responsible_person || '',
      [labels.serial_number]: asset.serial_number || '',
      [labels.invoice_reference]: asset.invoice_reference || '',
      [labels.notes]: asset.notes || '',
      [labels.account_asset]: asset.account_asset || '',
      [labels.account_depreciation]: asset.account_depreciation || '',
      [labels.account_expense]: asset.account_expense || '',
      schedule: includeSchedule ? schedules.get(asset.id) || [] : undefined,
    }));

    return JSON.stringify({ sheets: { 'Immobilisations': formattedAssets } });
  }

  private static parseCSV(csv: string): AssetImportRow[] {
    // Supprimer BOM si présent
    const content = csv.replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
      return [];
    }

    // Parser les headers (première ligne)
    const headers = this.parseCSVLine(lines[0]);
    const headerMap = this.mapHeaders(headers);

    // Parser les données
    const rows: AssetImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) {
        continue; // Ligne vide
      }

      const row: AssetImportRow = {
        name: values[headerMap.name] || '',
        acquisition_date: values[headerMap.acquisition_date] || '',
        acquisition_value: values[headerMap.acquisition_value] || '0',
        depreciation_method: values[headerMap.depreciation_method] || 'linear',
        duration_years: values[headerMap.duration_years] || '5',
      };

      // Champs optionnels
      if (headerMap.asset_number !== undefined) row.asset_number = values[headerMap.asset_number];
      if (headerMap.description !== undefined) row.description = values[headerMap.description];
      if (headerMap.category_name !== undefined) row.category_name = values[headerMap.category_name];
      if (headerMap.depreciation_start_date !== undefined) row.depreciation_start_date = values[headerMap.depreciation_start_date];
      if (headerMap.declining_rate !== undefined) row.declining_rate = values[headerMap.declining_rate];
      if (headerMap.residual_value !== undefined) row.residual_value = values[headerMap.residual_value];
      if (headerMap.location !== undefined) row.location = values[headerMap.location];
      if (headerMap.responsible_person !== undefined) row.responsible_person = values[headerMap.responsible_person];
      if (headerMap.serial_number !== undefined) row.serial_number = values[headerMap.serial_number];
      if (headerMap.invoice_reference !== undefined) row.invoice_reference = values[headerMap.invoice_reference];
      if (headerMap.notes !== undefined) row.notes = values[headerMap.notes];
      if (headerMap.status !== undefined) row.status = values[headerMap.status];
      if (headerMap.account_asset !== undefined) row.account_asset = values[headerMap.account_asset];
      if (headerMap.account_depreciation !== undefined) row.account_depreciation = values[headerMap.account_depreciation];
      if (headerMap.account_expense !== undefined) row.account_expense = values[headerMap.account_expense];

      rows.push(row);
    }

    return rows;
  }

  private static parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ';' || char === ',') && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  private static mapHeaders(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

    // Mapping des variantes de noms de colonnes
    const mappings: Record<string, string[]> = {
      asset_number: ['n° inventaire', 'numero inventaire', 'asset number', 'n° activo', 'asset_number'],
      name: ['nom', 'name', 'nombre', 'libelle', 'libellé'],
      description: ['description', 'descripcion', 'desc'],
      category_name: ['categorie', 'catégorie', 'category', 'categoria'],
      acquisition_date: ['date acquisition', 'acquisition date', 'fecha adquisicion', 'acquisition_date'],
      acquisition_value: ['valeur acquisition', 'acquisition value', 'valor adquisicion', 'montant', 'amount', 'acquisition_value'],
      depreciation_method: ['methode amortissement', 'méthode amortissement', 'depreciation method', 'metodo depreciacion', 'depreciation_method'],
      depreciation_start_date: ['debut amortissement', 'début amortissement', 'depreciation start', 'inicio depreciacion', 'depreciation_start_date'],
      duration_years: ['duree', 'durée', 'duration', 'useful life', 'vida util', 'annees', 'années', 'years', 'duration_years'],
      declining_rate: ['coefficient', 'taux degressif', 'declining rate', 'coeficiente', 'declining_rate'],
      residual_value: ['valeur residuelle', 'residual value', 'valor residual', 'residual_value'],
      location: ['localisation', 'location', 'ubicacion'],
      responsible_person: ['responsable', 'responsible', 'responsible person'],
      serial_number: ['n° serie', 'numero serie', 'serial number', 'serial_number'],
      invoice_reference: ['ref facture', 'réf facture', 'invoice reference', 'ref factura', 'invoice_reference'],
      notes: ['notes', 'notas', 'commentaire', 'comment'],
      status: ['statut', 'status', 'estado'],
      account_asset: ['compte immobilisation', 'asset account', 'cuenta activo', 'account_asset'],
      account_depreciation: ['compte amortissement', 'depreciation account', 'cuenta depreciacion', 'account_depreciation'],
      account_expense: ['compte dotation', 'expense account', 'cuenta gasto', 'account_expense'],
    };

    for (const [field, variants] of Object.entries(mappings)) {
      for (let i = 0; i < normalizedHeaders.length; i++) {
        if (variants.some(v => normalizedHeaders[i].includes(v))) {
          map[field] = i;
          break;
        }
      }
    }

    return map;
  }

  private static validateRow(row: AssetImportRow, rowNum: number): { errors: ImportError[]; warnings: string[] } {
    const errors: ImportError[] = [];
    const warnings: string[] = [];

    // Champs requis
    if (!row.name || row.name.trim().length === 0) {
      errors.push({ row: rowNum, field: 'name', message: 'Le nom est requis' });
    }

    if (!row.acquisition_date) {
      errors.push({ row: rowNum, field: 'acquisition_date', message: 'La date d\'acquisition est requise' });
    } else if (!this.isValidDate(row.acquisition_date)) {
      errors.push({ row: rowNum, field: 'acquisition_date', message: 'Format de date invalide (attendu: YYYY-MM-DD)' });
    }

    const acquisitionValue = Number(row.acquisition_value);
    if (isNaN(acquisitionValue) || acquisitionValue <= 0) {
      errors.push({ row: rowNum, field: 'acquisition_value', message: 'La valeur d\'acquisition doit être un nombre positif' });
    }

    const durationYears = Number(row.duration_years);
    if (isNaN(durationYears) || durationYears <= 0 || durationYears > 50) {
      errors.push({ row: rowNum, field: 'duration_years', message: 'La durée doit être entre 1 et 50 ans' });
    }

    // Warnings
    if (row.depreciation_start_date && !this.isValidDate(row.depreciation_start_date)) {
      warnings.push(`Ligne ${rowNum}: Date de début d'amortissement invalide, utilisera la date d'acquisition`);
    }

    const residualValue = Number(row.residual_value || 0);
    if (residualValue > acquisitionValue) {
      warnings.push(`Ligne ${rowNum}: Valeur résiduelle supérieure à la valeur d'acquisition`);
    }

    return { errors, warnings };
  }

  private static isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  private static parseDepreciationMethod(method: string): DepreciationMethod {
    const normalized = method?.toLowerCase().trim() || '';

    if (normalized.includes('degressif') || normalized.includes('declining') || normalized.includes('decreciente')) {
      return 'declining_balance';
    }
    if (normalized.includes('unite') || normalized.includes('unit') || normalized.includes('unidad')) {
      return 'units_of_production';
    }
    return 'linear';
  }

  private static parseStatus(status?: string): AssetStatus | undefined {
    if (!status) return undefined;
    const normalized = status.toLowerCase().trim();

    if (normalized.includes('cede') || normalized.includes('disposed') || normalized.includes('cedido')) {
      return 'disposed';
    }
    if (normalized.includes('amorti') || normalized.includes('depreciated') || normalized.includes('depreciado')) {
      return 'fully_depreciated';
    }
    if (normalized.includes('maintenance')) {
      return 'under_maintenance';
    }
    return 'active';
  }

  private static formatNumber(value: number | null | undefined): string {
    if (value == null) return '';
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private static escapeCSV(value: string): string {
    if (value.includes(';') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private static async regenerateSchedule(assetId: string): Promise<void> {
    try {
      const { generateDepreciationSchedule } = await import('./assetsService');
      await generateDepreciationSchedule(assetId);
    } catch (error) {
      logger.warn('AssetImportExportService', `Impossible de générer le plan pour ${assetId}:`, error);
    }
  }
}

// Export par défaut
export default AssetImportExportService;
