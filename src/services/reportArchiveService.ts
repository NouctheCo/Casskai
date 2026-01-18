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
 * Report Archive Service
 * Service complet de gestion et d'archivage des rapports financiers
 * Similaire à hrDocumentTemplatesService mais adapté aux rapports
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { emailService } from './emailService';
// ============================================================================
// TYPES
// ============================================================================
export interface GeneratedReport {
  id: string;
  company_id: string;
  report_name: string;
  report_type: string;
  report_format: 'detailed' | 'summary';
  period_start: string;
  period_end: string;
  fiscal_year?: number;
  status: 'draft' | 'generated' | 'reviewed' | 'approved' | 'archived';
  file_url?: string;
  file_path?: string;
  file_format?: 'pdf' | 'excel' | 'csv' | 'json';
  file_size_bytes?: number;
  storage_bucket?: string;
  generated_by?: string;
  generated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
  template_id?: string;
  generation_config?: Record<string, any>;
  report_data?: Record<string, any>;
  notes?: string;
  tags?: string[];
  is_archived: boolean;
  archive_reference?: string;
  archived_at?: string;
  retention_until?: string;
  can_be_destroyed: boolean;
  shared_with?: string[];
  access_level?: 'private' | 'company' | 'shared' | 'public';
  created_at: string;
  updated_at: string;
}
export interface ReportArchive {
  id: string;
  company_id: string;
  archive_reference: string;
  generated_report_id?: string;
  report_name: string;
  report_type: string;
  report_date: string;
  fiscal_year: number;
  archive_file_url: string;
  archive_file_path: string;
  file_format: string;
  file_size_bytes?: number;
  file_hash?: string;
  archived_at: string;
  archived_by?: string;
  retention_years: number;
  retention_until: string;
  can_be_destroyed: boolean;
  destruction_date?: string;
  archive_category?: string;
  legal_requirement?: string;
  importance_level?: 'high' | 'medium' | 'low';
  original_generated_at?: string;
  original_generated_by?: string;
  report_data_snapshot?: Record<string, any>;
  tags?: string[];
  notes?: string;
  access_log?: Array<{
    user_id: string;
    accessed_at: string;
    action: string;
  }>;
  last_accessed_at?: string;
  last_accessed_by?: string;
  created_at: string;
  updated_at: string;
}
export interface ReportComparison {
  id: string;
  company_id: string;
  comparison_name: string;
  report_type: string;
  base_report_id: string;
  compare_report_id: string;
  comparison_data?: Record<string, any>;
  variance_percentage?: number;
  key_changes?: string[];
  created_by?: string;
  created_at: string;
  notes?: string;
}
export interface ArchiveStats {
  total_archives: number;
  total_size_bytes: number;
  total_size_mb: number;
  obligatoires: number;
  fiscaux: number;
  can_be_destroyed: number;
  expiring_soon: number;
  by_type: Record<string, number>;
  by_fiscal_year: Record<number, number>;
  oldest_archive?: string;
  newest_archive?: string;
}
export interface ReportFilters {
  report_type?: string;
  status?: string;
  fiscal_year?: number;
  period_start?: string;
  period_end?: string;
  tags?: string[];
  search?: string;
}
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
// ============================================================================
// SERVICE CLASS
// ============================================================================
class ReportArchiveService {
  private static instance: ReportArchiveService;
  static getInstance(): ReportArchiveService {
    if (!this.instance) {
      this.instance = new ReportArchiveService();
    }
    return this.instance;
  }
  // ========================================================================
  // GENERATED REPORTS - CRUD
  // ========================================================================
  /**
   * Créer un nouveau rapport généré
   */
  async createGeneratedReport(
    report: Omit<GeneratedReport, 'id' | 'created_at' | 'updated_at' | 'is_archived' | 'can_be_destroyed'>
  ): Promise<ServiceResponse<GeneratedReport>> {
    try {
      const { data, error } = await supabase
        .from('generated_reports')
        .insert(report)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('ReportArchive', 'Error creating generated report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create report'
      };
    }
  }
  /**
   * Récupérer les rapports générés d'une société
   */
  async getGeneratedReports(
    companyId: string,
    filters?: ReportFilters
  ): Promise<ServiceResponse<GeneratedReport[]>> {
    try {
      let query = supabase
        .from('generated_reports')
        .select('*')
        .eq('company_id', companyId)
        .order('generated_at', { ascending: false });
      if (filters) {
        if (filters.report_type) {
          query = query.eq('report_type', filters.report_type);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.fiscal_year) {
          query = query.eq('fiscal_year', filters.fiscal_year);
        }
        if (filters.period_start) {
          query = query.gte('period_start', filters.period_start);
        }
        if (filters.period_end) {
          query = query.lte('period_end', filters.period_end);
        }
        if (filters.tags && filters.tags.length > 0) {
          query = query.contains('tags', filters.tags);
        }
        if (filters.search) {
          query = query.or(`report_name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      logger.error('ReportArchive', 'Error fetching generated reports:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reports'
      };
    }
  }
  /**
   * Récupérer un rapport spécifique
   */
  async getGeneratedReport(reportId: string): Promise<ServiceResponse<GeneratedReport>> {
    try {
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', reportId)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('ReportArchive', 'Error fetching report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch report'
      };
    }
  }
  /**
   * Mettre à jour un rapport
   */
  async updateGeneratedReport(
    reportId: string,
    updates: Partial<GeneratedReport>
  ): Promise<ServiceResponse<GeneratedReport>> {
    try {
      const { data, error } = await supabase
        .from('generated_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('ReportArchive', 'Error updating report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update report'
      };
    }
  }
  /**
   * Changer le statut d'un rapport
   */
  async updateReportStatus(
    reportId: string,
    status: GeneratedReport['status'],
    userId?: string
  ): Promise<ServiceResponse<GeneratedReport>> {
    try {
      const updates: Partial<GeneratedReport> = { status };
      // Ajouter les métadonnées selon le statut
      if (status === 'reviewed' && userId) {
        updates.reviewed_by = userId;
        updates.reviewed_at = new Date().toISOString();
      } else if (status === 'approved' && userId) {
        updates.approved_by = userId;
        updates.approved_at = new Date().toISOString();
      } else if (status === 'archived') {
        updates.archived_at = new Date().toISOString();
      }
      return await this.updateGeneratedReport(reportId, updates);
    } catch (error) {
      logger.error('ReportArchive', 'Error updating report status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update status'
      };
    }
  }
  /**
   * Supprimer un rapport (seulement si non archivé)
   */
  async deleteGeneratedReport(reportId: string): Promise<ServiceResponse<void>> {
    try {
      // Vérifier que le rapport n'est pas archivé
      const { data: report } = await this.getGeneratedReport(reportId);
      if (report?.is_archived) {
        return {
          success: false,
          error: 'Cannot delete archived report'
        };
      }
      // Supprimer le fichier du storage si existe
      if (report?.file_path) {
        await supabase.storage
          .from('financial-reports')
          .remove([report.file_path]);
      }
      // Supprimer le rapport
      const { error } = await supabase
        .from('generated_reports')
        .delete()
        .eq('id', reportId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('ReportArchive', 'Error deleting report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete report'
      };
    }
  }
  // ========================================================================
  // STORAGE - UPLOAD/DOWNLOAD
  // ========================================================================
  /**
   * Upload d'un fichier rapport dans le storage
   */
  async uploadReportFile(
    companyId: string,
    file: File,
    reportType: string,
    reportName: string,
    isArchived: boolean = false
  ): Promise<ServiceResponse<{ path: string; url: string }>> {
    try {
      // Générer le chemin de stockage
      const { data: pathData, error: pathError } = await supabase
        .rpc('get_report_storage_path', {
          p_company_id: companyId,
          p_report_type: reportType,
          p_report_name: reportName,
          p_file_format: file.name.split('.').pop() || 'pdf',
          p_is_archived: isArchived
        });
      if (pathError) throw pathError;
      const filePath = pathData as string;
      // Upload du fichier
      const { data: _data, error } = await supabase.storage
        .from('financial-reports')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      if (error) throw error;
      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('financial-reports')
        .getPublicUrl(filePath);
      return {
        success: true,
        data: {
          path: filePath,
          url: publicUrl
        }
      };
    } catch (error) {
      logger.error('ReportArchive', 'Error uploading report file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file'
      };
    }
  }
  /**
   * Télécharger un fichier rapport
   */
  async downloadReportFile(filePath: string): Promise<ServiceResponse<Blob>> {
    try {
      const { data, error } = await supabase.storage
        .from('financial-reports')
        .download(filePath);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('ReportArchive', 'Error downloading report file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download file'
      };
    }
  }
  /**
   * Obtenir une URL signée temporaire pour un rapport
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<ServiceResponse<string>> {
    try {
      const { data, error } = await supabase.storage
        .from('financial-reports')
        .createSignedUrl(filePath, expiresIn);
      if (error) throw error;
      return { success: true, data: data.signedUrl };
    } catch (error) {
      logger.error('ReportArchive', 'Error creating signed URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create signed URL'
      };
    }
  }
  // ========================================================================
  // ARCHIVES - GESTION LÉGALE
  // ========================================================================
  /**
   * Récupérer les archives d'une société
   */
  async getArchives(
    companyId: string,
    filters?: {
      fiscal_year?: number;
      report_type?: string;
      archive_category?: string;
      search?: string;
    }
  ): Promise<ServiceResponse<ReportArchive[]>> {
    try {
      let query = supabase
        .from('reports_archive')
        .select('*')
        .eq('company_id', companyId)
        .order('archived_at', { ascending: false });
      if (filters) {
        if (filters.fiscal_year) {
          query = query.eq('fiscal_year', filters.fiscal_year);
        }
        if (filters.report_type) {
          query = query.eq('report_type', filters.report_type);
        }
        if (filters.archive_category) {
          query = query.eq('archive_category', filters.archive_category);
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      logger.error('ReportArchive', 'Error fetching archives:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch archives'
      };
    }
  }
  /**
   * Récupérer les statistiques d'archivage
   */
  async getArchiveStats(companyId: string): Promise<ServiceResponse<ArchiveStats>> {
    try {
      const { data, error } = await supabase
        .from('v_archive_stats')
        .select('*')
        .eq('company_id', companyId)
        .single();
      if (error) throw error;
      // Récupérer répartition par type et année fiscale
      const { data: archives } = await supabase
        .from('reports_archive')
        .select('report_type, fiscal_year')
        .eq('company_id', companyId);
      const by_type: Record<string, number> = {};
      const by_fiscal_year: Record<number, number> = {};
      archives?.forEach(archive => {
        by_type[archive.report_type] = (by_type[archive.report_type] || 0) + 1;
        by_fiscal_year[archive.fiscal_year] = (by_fiscal_year[archive.fiscal_year] || 0) + 1;
      });
      const stats: ArchiveStats = {
        ...data,
        total_size_mb: data.total_size_bytes / (1024 * 1024),
        by_type,
        by_fiscal_year
      };
      return { success: true, data: stats };
    } catch (error) {
      logger.error('ReportArchive', 'Error fetching archive stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats'
      };
    }
  }
  /**
   * Logger un accès à une archive (traçabilité)
   */
  async logArchiveAccess(
    archiveId: string,
    userId: string,
    action: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Récupérer l'archive actuelle
      const { data: archive, error: fetchError } = await supabase
        .from('reports_archive')
        .select('access_log')
        .eq('id', archiveId)
        .single();
      if (fetchError) throw fetchError;
      const accessLog = archive.access_log || [];
      accessLog.push({
        user_id: userId,
        accessed_at: new Date().toISOString(),
        action
      });
      // Mettre à jour
      const { error } = await supabase
        .from('reports_archive')
        .update({
          access_log: accessLog,
          last_accessed_at: new Date().toISOString(),
          last_accessed_by: userId
        })
        .eq('id', archiveId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('ReportArchive', 'Error logging archive access:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to log access'
      };
    }
  }
  // ========================================================================
  // COMPARAISONS
  // ========================================================================
  /**
   * Créer une comparaison entre deux rapports
   */
  async createComparison(
    comparison: Omit<ReportComparison, 'id' | 'created_at'>
  ): Promise<ServiceResponse<ReportComparison>> {
    try {
      const { data, error } = await supabase
        .from('report_comparisons')
        .insert(comparison)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      logger.error('ReportArchive', 'Error creating comparison:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create comparison'
      };
    }
  }
  /**
   * Récupérer les comparaisons d'une société
   */
  async getComparisons(companyId: string): Promise<ServiceResponse<ReportComparison[]>> {
    try {
      const { data, error } = await supabase
        .from('report_comparisons')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      logger.error('ReportArchive', 'Error fetching comparisons:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch comparisons'
      };
    }
  }
  // ========================================================================
  // UTILITAIRES
  // ========================================================================
  /**
   * Calculer la taille d'un fichier en format lisible
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }
  /**
   * Obtenir le label d'un type de rapport
   */
  getReportTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      balance_sheet: 'Bilan comptable',
      income_statement: 'Compte de résultat',
      cash_flow: 'Tableau de flux de trésorerie',
      trial_balance: 'Balance générale',
      general_ledger: 'Grand livre',
      vat_report: 'Déclaration TVA',
      aged_receivables: 'Analyse créances clients',
      aged_payables: 'Analyse dettes fournisseurs',
      financial_ratios: 'Ratios financiers',
      tax_summary: 'Synthèse fiscale'
    };
    return labels[type] || type;
  }
  /**
   * Obtenir la couleur d'un statut
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'gray',
      generated: 'blue',
      reviewed: 'purple',
      approved: 'green',
      archived: 'yellow'
    };
    return colors[status] || 'gray';
  }
  // ========================================================================
  // FONCTIONNALITÉS AVANCÉES
  // ========================================================================
  /**
   * Comparer automatiquement deux rapports (mois N vs mois N-1)
   */
  async compareReportsAutomatically(
    companyId: string,
    reportType: string,
    currentPeriodStart: string,
    currentPeriodEnd: string
  ): Promise<ServiceResponse<ReportComparison>> {
    try {
      // Trouver le rapport de la période actuelle
      const currentReports = await this.getGeneratedReports(companyId, {
        report_type: reportType,
        period_start: currentPeriodStart,
        period_end: currentPeriodEnd
      });
      if (!currentReports.success || !currentReports.data || currentReports.data.length === 0) {
        return {
          success: false,
          error: 'Aucun rapport trouvé pour la période actuelle'
        };
      }
      const currentReport = currentReports.data[0];
      // Calculer la période précédente
      const currentStart = new Date(currentPeriodStart);
      const currentEnd = new Date(currentPeriodEnd);
      const periodLength = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
      const previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - periodLength + 1);
      // Trouver le rapport de la période précédente
      const previousReports = await this.getGeneratedReports(companyId, {
        report_type: reportType,
        period_start: previousStart.toISOString().split('T')[0],
        period_end: previousEnd.toISOString().split('T')[0]
      });
      if (!previousReports.success || !previousReports.data || previousReports.data.length === 0) {
        return {
          success: false,
          error: 'Aucun rapport trouvé pour la période précédente'
        };
      }
      const previousReport = previousReports.data[0];
      // Calculer les variances
      const comparisonData: Record<string, any> = {};
      const keyChanges: string[] = [];
      if (currentReport.report_data && previousReport.report_data) {
        // Exemple de calculs (à adapter selon les données du rapport)
        const currentRevenue = currentReport.report_data.revenue || 0;
        const previousRevenue = previousReport.report_data.revenue || 0;
        const revenueVariance = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
        comparisonData.revenue = {
          current: currentRevenue,
          previous: previousRevenue,
          variance: revenueVariance,
          variance_amount: currentRevenue - previousRevenue
        };
        if (Math.abs(revenueVariance) > 10) {
          keyChanges.push(
            `Chiffre d'affaires: ${revenueVariance > 0 ? '+' : ''}${revenueVariance.toFixed(2)}%`
          );
        }
      }
      // Créer la comparaison
      return await this.createComparison({
        company_id: companyId,
        comparison_name: `${this.getReportTypeLabel(reportType)} - ${currentPeriodStart} vs ${previousStart.toISOString().split('T')[0]}`,
        report_type: reportType,
        base_report_id: previousReport.id,
        compare_report_id: currentReport.id,
        comparison_data: comparisonData,
        variance_percentage: comparisonData.revenue?.variance || 0,
        key_changes: keyChanges,
        created_by: companyId // TODO: use actual user ID
      });
    } catch (error) {
      logger.error('ReportArchive', 'Error comparing reports:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to compare reports'
      };
    }
  }
  /**
   * Exporter plusieurs rapports dans un ZIP
   */
  async exportReportsToZip(
    companyId: string,
    reportIds: string[],
    _zipName?: string
  ): Promise<ServiceResponse<Blob>> {
    try {
      // Import dynamique de JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      // Télécharger tous les rapports
      const downloadPromises = reportIds.map(async (reportId) => {
        const reportResult = await this.getGeneratedReport(reportId);
        if (!reportResult.success || !reportResult.data) {
          return null;
        }
        const report = reportResult.data;
        if (!report.file_path) {
          return null;
        }
        const fileResult = await this.downloadReportFile(report.file_path);
        if (!fileResult.success || !fileResult.data) {
          return null;
        }
        return {
          name: `${report.report_name}.${report.file_format}`,
          data: fileResult.data
        };
      });
      const files = await Promise.all(downloadPromises);
      // Ajouter les fichiers au ZIP
      files.forEach((file) => {
        if (file) {
          zip.file(file.name, file.data);
        }
      });
      // Générer le ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      return {
        success: true,
        data: zipBlob
      };
    } catch (error) {
      logger.error('ReportArchive', 'Error exporting reports to ZIP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create ZIP'
      };
    }
  }
  /**
   * Exporter tous les rapports d'une période
   */
  async exportPeriodReportsToZip(
    companyId: string,
    periodStart: string,
    periodEnd: string,
    reportType?: string
  ): Promise<ServiceResponse<Blob>> {
    try {
      const result = await this.getGeneratedReports(companyId, {
        period_start: periodStart,
        period_end: periodEnd,
        report_type: reportType,
        status: 'archived' // Seulement les rapports archivés
      });
      if (!result.success || !result.data || result.data.length === 0) {
        return {
          success: false,
          error: 'Aucun rapport trouvé pour cette période'
        };
      }
      const reportIds = result.data.map(r => r.id);
      const zipName = `rapports_${periodStart}_${periodEnd}.zip`;
      return await this.exportReportsToZip(companyId, reportIds, zipName);
    } catch (error) {
      logger.error('ReportArchive', 'Error exporting period reports:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export period'
      };
    }
  }
  /**
   * Envoyer un rapport par email (à implémenter avec service email)
   */
  async sendReportByEmail(
    reportId: string,
    recipients: string[],
    subject?: string,
    message?: string
  ): Promise<ServiceResponse<void>> {
    try {
      const reportResult = await this.getGeneratedReport(reportId);
      if (!reportResult.success || !reportResult.data) {
        return {
          success: false,
          error: 'Rapport non trouvé'
        };
      }
      const report = reportResult.data;

      // Construire le contenu HTML de l'email
      const emailSubject = subject || `Rapport: ${report.report_name}`;
      const emailMessage = message || 'Veuillez trouver ci-joint le rapport demandé.';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2563eb;">📊 ${report.report_name}</h2>
          <p>${emailMessage}</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Détails du rapport:</strong></p>
            <ul>
              <li>Type: ${report.report_type}</li>
              <li>Période: ${report.period_start} au ${report.period_end}</li>
              <li>Format: ${report.report_format}</li>
              ${report.fiscal_year ? `<li>Exercice fiscal: ${report.fiscal_year}</li>` : ''}
            </ul>
          </div>
          <p style="color: #666; font-size: 0.9em;">
            Ce rapport a été généré automatiquement par CassKai.
          </p>
        </div>
      `;

      // Envoyer via le service email configuré
      try {
        await emailService.sendEmail(report.company_id, {
          to: recipients,
          subject: emailSubject,
          html: htmlContent,
          text: `${report.report_name}\n\n${emailMessage}\n\nType: ${report.report_type}\nPériode: ${report.period_start} au ${report.period_end}`
        });

        logger.info('ReportArchive', `Email sent successfully to ${recipients.length} recipients for report ${report.report_name}`);
        return {
          success: true
        };
      } catch (emailError) {
        logger.error('ReportArchive', 'Email send failed:', emailError);
        return {
          success: false,
          error: emailError instanceof Error ? emailError.message : 'Erreur lors de l\'envoi de l\'email'
        };
      }
    } catch (error) {
      logger.error('ReportArchive', 'Error sending report by email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }
  /**
   * Planifier l'envoi automatique d'un rapport
   */
  async scheduleReportGeneration(
    companyId: string,
    reportType: string,
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    recipients: string[],
    autoSend: boolean = true
  ): Promise<ServiceResponse<any>> {
    try {
      // TODO: Implémenter avec table report_schedules
      // Pour l'instant, structure de base
      const schedule = {
        company_id: companyId,
        report_type: reportType,
        frequency,
        recipients,
        auto_send: autoSend,
        next_run: this.calculateNextRun(frequency),
        is_active: true
      };
      logger.debug('ReportArchive', 'Schedule would be created:', schedule);
      return {
        success: true,
        data: schedule
      };
    } catch (error) {
      logger.error('ReportArchive', 'Error scheduling report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule'
      };
    }
  }
  /**
   * Calculer la prochaine exécution
   */
  private calculateNextRun(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      case 'yearly':
        now.setFullYear(now.getFullYear() + 1);
        break;
    }
    return now;
  }
}
// Export singleton
export const reportArchiveService = ReportArchiveService.getInstance();