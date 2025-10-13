/**
 * Service pour gérer le stockage des rapports dans Supabase Storage
 * Upload, download, et gestion des métadonnées
 */

import { supabase } from '@/lib/supabase';
import type { FinancialReport } from '@/types/reports.types';

export interface UploadReportParams {
  companyId: string;
  reportType: string;
  reportName: string;
  fileBlob: Blob;
  fileFormat: 'pdf' | 'xlsx';
  periodStart?: string;
  periodEnd: string;
}

export interface UploadReportResult {
  success: boolean;
  report?: FinancialReport;
  error?: string;
}

/**
 * Service de gestion du stockage des rapports
 */
class ReportStorageService {
  private readonly BUCKET_NAME = 'company-reports';

  /**
   * Upload un rapport vers Supabase Storage et crée les métadonnées
   */
  async uploadReport(params: UploadReportParams): Promise<UploadReportResult> {
    try {
      const {
        companyId,
        reportType,
        reportName,
        fileBlob,
        fileFormat,
        periodStart,
        periodEnd
      } = params;

      // Générer le chemin de fichier: company_id/reports/report_type_timestamp.ext
      const timestamp = new Date().getTime();
      const extension = fileFormat === 'pdf' ? 'pdf' : 'xlsx';
      const fileName = `${reportType}_${timestamp}.${extension}`;
      const filePath = `${companyId}/reports/${fileName}`;

      // 1. Upload vers Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, fileBlob, {
          contentType: fileFormat === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Échec de l'upload: ${uploadError.message}`);
      }

      // 2. Obtenir l'URL publique signée (valide 1 an)
      const { data: urlData } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 31536000); // 1 an en secondes

      if (!urlData) {
        throw new Error('Impossible de générer l\'URL de téléchargement');
      }

      // 3. Créer l'entrée dans financial_reports
      const { data: reportData, error: insertError } = await supabase
        .from('financial_reports')
        .insert({
          company_id: companyId,
          name: reportName,
          type: reportType,
          format: 'detailed',
          period_start: periodStart,
          period_end: periodEnd,
          status: 'ready',
          file_format: fileFormat,
          file_path: filePath,
          file_url: urlData.signedUrl,
          file_size: fileBlob.size,
          storage_uploaded: true,
          download_count: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        // Nettoyer le fichier uploadé en cas d'erreur
        await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
        throw new Error(`Échec de la sauvegarde des métadonnées: ${insertError.message}`);
      }

      return {
        success: true,
        report: reportData as FinancialReport
      };

    } catch (error) {
      console.error('Error uploading report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Télécharger un rapport depuis le storage
   */
  async downloadReport(reportId: string): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      // 1. Récupérer les métadonnées du rapport
      const { data: report, error: fetchError } = await supabase
        .from('financial_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (fetchError || !report) {
        throw new Error('Rapport introuvable');
      }

      if (!report.file_path) {
        throw new Error('Aucun fichier associé à ce rapport');
      }

      // 2. Télécharger depuis le storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .download(report.file_path);

      if (downloadError || !fileData) {
        throw new Error(`Échec du téléchargement: ${downloadError?.message || 'Fichier introuvable'}`);
      }

      // 3. Incrémenter le compteur de téléchargements
      await supabase.rpc('increment_report_download_count', { report_id: reportId });

      return {
        success: true,
        blob: fileData
      };

    } catch (error) {
      console.error('Error downloading report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Supprimer un rapport (fichier + métadonnées)
   */
  async deleteReport(reportId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Récupérer les métadonnées
      const { data: report, error: fetchError } = await supabase
        .from('financial_reports')
        .select('file_path')
        .eq('id', reportId)
        .single();

      if (fetchError || !report) {
        throw new Error('Rapport introuvable');
      }

      // 2. Supprimer le fichier du storage si il existe
      if (report.file_path) {
        const { error: deleteError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove([report.file_path]);

        if (deleteError) {
          console.error('Storage delete error:', deleteError);
          // Continue quand même pour supprimer les métadonnées
        }
      }

      // 3. Supprimer les métadonnées
      const { error: deleteMetaError } = await supabase
        .from('financial_reports')
        .delete()
        .eq('id', reportId);

      if (deleteMetaError) {
        throw new Error(`Échec de la suppression: ${deleteMetaError.message}`);
      }

      return { success: true };

    } catch (error) {
      console.error('Error deleting report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Obtenir la liste des rapports d'une entreprise
   */
  async listReports(
    companyId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: string;
    }
  ): Promise<{ success: boolean; reports?: FinancialReport[]; error?: string }> {
    try {
      let query = supabase
        .from('financial_reports')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erreur de récupération: ${error.message}`);
      }

      return {
        success: true,
        reports: data as FinancialReport[]
      };

    } catch (error) {
      console.error('Error listing reports:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Obtenir les statistiques de storage pour une entreprise
   */
  async getStorageStats(companyId: string): Promise<{
    success: boolean;
    stats?: {
      totalReports: number;
      totalSize: number;
      totalDownloads: number;
      byType: Record<string, { count: number; size: number }>;
    };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('type, file_size, download_count')
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Erreur de récupération: ${error.message}`);
      }

      // Calculer les statistiques
      const stats = {
        totalReports: data.length,
        totalSize: data.reduce((sum, r) => sum + (r.file_size || 0), 0),
        totalDownloads: data.reduce((sum, r) => sum + (r.download_count || 0), 0),
        byType: {} as Record<string, { count: number; size: number }>
      };

      // Grouper par type
      data.forEach(report => {
        if (!stats.byType[report.type]) {
          stats.byType[report.type] = { count: 0, size: 0 };
        }
        stats.byType[report.type].count++;
        stats.byType[report.type].size += report.file_size || 0;
      });

      return { success: true, stats };

    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
}

export const reportStorageService = new ReportStorageService();
