/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface ReportLogEntry {
  companyId: string;
  reportType: string;
  reportName: string;
  periodStart: string;
  periodEnd: string;
  fileFormat: 'pdf' | 'excel' | 'csv' | 'json';
  fileSizeBytes?: number;
  fileUrl?: string;
  parameters?: Record<string, any>;
  status?: 'draft' | 'generated' | 'reviewed' | 'approved' | 'archived';
  errorMessage?: string;
}

/**
 * Service de logging des rapports générés
 * Enregistre dans la table generated_reports pour traçabilité
 */
class ReportLoggingService {
  private static instance: ReportLoggingService;

  private constructor() {}

  static getInstance(): ReportLoggingService {
    if (!ReportLoggingService.instance) {
      ReportLoggingService.instance = new ReportLoggingService();
    }
    return ReportLoggingService.instance;
  }

  /**
   * Enregistre un rapport généré avec succès
   */
  async logGeneratedReport(entry: ReportLogEntry): Promise<void> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        logger.warn('ReportLogging', 'User not found, skipping report log');
        return;
      }

      const { error } = await supabase
        .from('generated_reports')
        .insert({
          company_id: entry.companyId,
          report_type: entry.reportType,
          report_name: entry.reportName,
          report_format: 'detailed',
          period_start: entry.periodStart,
          period_end: entry.periodEnd,
          file_format: entry.fileFormat,
          file_size_bytes: entry.fileSizeBytes || null,
          file_url: entry.fileUrl || null,
          generated_by: user.id,
          generation_config: entry.parameters || {},
          status: entry.status || 'generated',
          notes: entry.errorMessage || null,
        });

      if (error) {
        logger.error('ReportLogging', 'Error logging report:', error);
      } else {
        logger.info('ReportLogging', `Report logged: ${entry.reportType} - ${entry.reportName}`);
      }
    } catch (err) {
      logger.error('ReportLogging', 'Unexpected error logging report:', err);
    }
  }

  /**
   * Enregistre un rapport en échec
   */
  async logFailedReport(
    companyId: string,
    reportType: string,
    reportName: string,
    periodStart: string,
    periodEnd: string,
    errorMessage: string,
    parameters?: Record<string, any>
  ): Promise<void> {
    await this.logGeneratedReport({
      companyId,
      reportType,
      reportName,
      periodStart,
      periodEnd,
      fileFormat: 'pdf',
      status: 'draft',
      errorMessage,
      parameters,
    });
  }

  /**
   * Récupère l'historique des rapports générés pour une entreprise
   */
  async getReportHistory(
    companyId: string,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    reportType: string;
    reportName: string;
    periodStart: string | null;
    periodEnd: string | null;
    fileFormat: string;
    fileUrl: string | null;
    generatedAt: string;
    generatedBy: string;
    status: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('company_id', companyId)
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('ReportLogging', 'Error fetching report history:', error);
        return [];
      }

      return (data || []).map(r => ({
        id: r.id,
        reportType: r.report_type,
        reportName: r.report_name,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        fileFormat: r.file_format,
        fileUrl: r.file_url,
        generatedAt: r.generated_at,
        generatedBy: r.generated_by,
        status: r.status,
      }));
    } catch (err) {
      logger.error('ReportLogging', 'Unexpected error fetching history:', err);
      return [];
    }
  }
}

export const reportLoggingService = ReportLoggingService.getInstance();
export default ReportLoggingService;
