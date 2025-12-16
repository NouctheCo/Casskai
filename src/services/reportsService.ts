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

import {

  FinancialReport,

  ReportFormData,

  ReportTemplate,

  ReportTemplateFormData,

  ReportSchedule,

  ReportScheduleFormData,

  ReportAnalytics,

  BalanceSheetData,

  IncomeStatementData,

  CashFlowData,

  TrialBalanceData,

  ReportFilters,

  ReportStats,

  ReportsDashboardData,

  ReportExportConfig,

  ReportServiceResponse,

  ReportChartData

} from '../types/reports.types';



// Mock data

import { supabase } from '../lib/supabase';



class ReportsService {




  // Reports CRUD

  async getReports(companyId: string, filters?: ReportFilters): Promise<ReportServiceResponse<FinancialReport[]>> {

    try {      let query = supabase

        .from('financial_reports')

        .select('*')

        .eq('company_id', companyId);



      if (filters) {

        if (filters.search) {

          query = query.ilike('name', `%${filters.search}%`);

        }

        if (filters.type) {

          query = query.eq('type', filters.type);

        }

        if (filters.status) {

          query = query.eq('status', filters.status);

        }

        if (filters.period_start) {

          query = query.gte('period_start', filters.period_start);

        }

        if (filters.period_end) {

          query = query.lte('period_end', filters.period_end);

        }

        if (filters.generated_by) {

          query = query.eq('generated_by', filters.generated_by);

        }

        if (filters.file_format) {

          query = query.eq('file_format', filters.file_format);

        }

      }



      const { data, error } = await query.order('created_at', { ascending: false });



      if (error) {

        console.error('Error fetching reports:', error);

        return { data: [], error: { message: error.message } };

      }



      return { data: data || [] };

    } catch (error) {

      console.error('Exception in getReports:', error instanceof Error ? error.message : String(error));

      const message = error instanceof Error ? error.message : 'Erreur inconnue lors de la récupération des rapports';

      return {

        data: [],

        error: { message }

      };

    }

  }



  async createReport(companyId: string, userId: string, formData: ReportFormData): Promise<ReportServiceResponse<FinancialReport>> {

    try {

      const newReportData = {

        company_id: companyId,

        generated_by: userId,

        name: formData.name,

        type: formData.type,

        format: formData.format,

        period_start: formData.period_start,

        period_end: formData.period_end,

        file_format: formData.file_format,

        currency: formData.currency,

        status: 'draft',

      };



      const { data, error } = await supabase

        .from('financial_reports')

        .insert(newReportData)

        .select()

        .single();



      if (error) {

        console.error('Error creating report:', error);

        return { data: null, error: { message: error.message } };

      }



      return { data };

    } catch (error) {

      console.error('Exception in createReport:', error instanceof Error ? error.message : String(error));

      const message = error instanceof Error ? error.message : 'Erreur inconnue lors de la création du rapport';

      return {

        data: null,

        error: { message }

      };

    }

  }



  async updateReport(reportId: string, formData: Partial<ReportFormData>): Promise<ReportServiceResponse<FinancialReport>> {

    try {

      const { data, error } = await supabase

        .from('financial_reports')

        .update(formData)

        .eq('id', reportId)

        .select()

        .single();



      if (error) {

        console.error('Error updating report:', error);

        return { data: null, error: { message: error.message } };

      }



      return { data };

    } catch (error) {

      console.error('Exception in updateReport:', error instanceof Error ? error.message : String(error));

      const message = error instanceof Error ? error.message : 'Erreur inconnue lors de la mise à jour du rapport';

      return {

        data: null,

        error: { message }

      };

    }

  }



  async deleteReport(reportId: string): Promise<ReportServiceResponse<boolean>> {

    try {

      const { error } = await supabase

        .from('financial_reports')

        .delete()

        .eq('id', reportId);



      if (error) {

        console.error('Error deleting report:', error);

        return { data: false, error: { message: error.message } };

      }



      return { data: true };

    } catch (error) {

      console.error('Exception in deleteReport:', error instanceof Error ? error.message : String(error));

      const message = error instanceof Error ? error.message : 'Erreur inconnue lors de la suppression du rapport';

      return {

        data: false,

        error: { message }

      };

    }

  }



  // Report data generation

  async generateBalanceSheet(companyId: string, periodEnd: string): Promise<ReportServiceResponse<BalanceSheetData>> {

    try {

      const { data, error } = await supabase.rpc('generate_balance_sheet', {

        company_id_param: companyId,

        end_date_param: periodEnd

      });



      if (error) {

        console.error('Error generating balance sheet:', error);

        return { data: null, error: { message: error.message } };

      }



      return { data: data as BalanceSheetData };

    } catch (error) {

      console.error('Exception in generateBalanceSheet:', error instanceof Error ? error.message : String(error));

      const message = error instanceof Error ? error.message : 'Erreur inconnue lors de la génération du bilan';

      return {

        data: null,

        error: { message }

      };

    }

  }



  async generateIncomeStatement(companyId: string, periodStart: string, periodEnd: string): Promise<ReportServiceResponse<IncomeStatementData>> {

    try {

      const { data, error } = await supabase.rpc('generate_income_statement', {

        company_id_param: companyId,

        start_date_param: periodStart,

        end_date_param: periodEnd

      });



      if (error) {

        console.error('Error generating income statement:', error);

        return { data: null, error: { message: error.message } };

      }



      return { data: data as IncomeStatementData };

    } catch (error) {

      console.error('Exception in generateIncomeStatement:', error instanceof Error ? error.message : String(error));

      const message = error instanceof Error ? error.message : 'Erreur inconnue lors de la génération du compte de résultat';

      return {

        data: null,

        error: { message }

      };

    }

  }



  async generateCashFlowStatement(companyId: string, periodStart: string, periodEnd: string): Promise<ReportServiceResponse<CashFlowData>> {

    try {

      const { data, error } = await supabase.rpc('generate_cash_flow_statement', {

        company_id_param: companyId,

        start_date_param: periodStart,

        end_date_param: periodEnd

      });



      if (error) {

        console.error('Error generating cash flow statement:', error);

        return { data: null, error: { message: error.message } };

      }



      return { data: data as CashFlowData };

    } catch (error) {

      console.error('Exception in generateCashFlowStatement:', error instanceof Error ? error.message : String(error));

      const message = error instanceof Error ? error.message : 'Erreur inconnue lors de la génération du tableau de flux de trésorerie';

      return {

        data: null,

        error: { message }

      };

    }

  }



  async generateTrialBalance(companyId: string, periodEnd: string): Promise<ReportServiceResponse<TrialBalanceData>> {

    try {

      const { data, error } = await supabase.rpc('generate_trial_balance', {

        company_id_param: companyId,

        end_date_param: periodEnd

      });



      if (error) {

        console.error('Error generating trial balance:', error);

        return { data: null, error: { message: error.message } };

      }



      return { data: data as TrialBalanceData };

    } catch (error) {

      console.error('Exception in generateTrialBalance:', error instanceof Error ? error.message : String(error));

      const message = error instanceof Error ? error.message : 'Erreur inconnue lors de la génération de la balance générale';

      return {

        data: null,

        error: { message }

      };

    }

  }



  // Templates

  async getTemplates(enterpriseId: string): Promise<ReportServiceResponse<ReportTemplate[]>> {

    try {      const { data, error } = await supabase

        .from('report_templates')

        .select('*')

        .or(`company_id.eq.${enterpriseId},is_default.eq.true`);



      if (error) throw error;



      return { data: data || [] };

    } catch (_error) {

      return {

        data: [],

        error: { message: 'Erreur lors de la récupération des modèles' }

      };

    }

  }



  async createTemplate(enterpriseId: string, formData: ReportTemplateFormData): Promise<ReportServiceResponse<ReportTemplate>> {

    try {

      const newTemplate: ReportTemplate = {

        id: Date.now().toString(),

        name: formData.name,

        description: formData.description,

        type: formData.type,

        sections: formData.sections.map((section, index) => ({

          id: (index + 1).toString(),

          name: section.name,

          order: index + 1,

          items: section.items.map((item, itemIndex) => ({

            id: (itemIndex + 1).toString(),

            name: item.name,

            account_codes: item.account_codes,

            calculation_type: item.calculation_type,

            format: item.format,

            show_in_summary: item.show_in_summary

          }))

        })),

        styling: {

          font_family: 'Arial',

          font_size: 12,

          header_color: '#2563eb',

          show_logo: true,

          show_watermark: false

        },

        is_default: false,

        enterprise_id: enterpriseId,

        created_by: 'current-user',

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString()

      };



      const { data, error } = await supabase

        .from('report_templates')

        .insert(newTemplate)

        .select()

        .single();



      if (error) throw error;



      return { data: data || newTemplate };

    } catch (_error) {

      return {

        data: {} as ReportTemplate,

        error: { message: 'Erreur lors de la création du modèle' }

      };

    }

  }



  // Schedules

  async getSchedules(enterpriseId: string): Promise<ReportServiceResponse<ReportSchedule[]>> {

    try {      const { data, error } = await supabase

        .from('report_schedules')

        .select('*')

        .eq('company_id', enterpriseId);



      if (error) throw error;



      return { data: data || [] };

    } catch (_error) {

      return {

        data: [],

        error: { message: 'Erreur lors de la récupération des planifications' }

      };

    }

  }



  async createSchedule(enterpriseId: string, formData: ReportScheduleFormData): Promise<ReportServiceResponse<ReportSchedule>> {

    try {

      const newSchedule: ReportSchedule = {

        id: Date.now().toString(),

        report_template_id: formData.report_template_id,

        name: formData.name,

        description: formData.description,

        frequency: formData.frequency,

        day_of_week: formData.day_of_week,

        day_of_month: formData.day_of_month,

        time: formData.time,

        recipients: formData.recipients,

        auto_send: formData.auto_send,

        include_charts: formData.include_charts,

        file_format: formData.file_format,

        is_active: true,

        next_run: this.calculateNextRun(formData.frequency, formData.day_of_month, formData.day_of_week, formData.time),

        enterprise_id: enterpriseId,

        created_by: 'current-user',

        created_at: new Date().toISOString(),

        updated_at: new Date().toISOString()

      };



      const { data, error } = await supabase

        .from('report_schedules')

        .insert(newSchedule)

        .select()

        .single();



      if (error) throw error;



      return { data: data || newSchedule };

    } catch (_error) {

      return {

        data: {} as ReportSchedule,

        error: { message: 'Erreur lors de la création de la planification' }

      };

    }

  }



  // Analytics

  async getReportAnalytics(reportId: string, period: string): Promise<ReportServiceResponse<ReportAnalytics>> {

    try {

      const { data: report, error: reportError } = await supabase

        .from('financial_reports')

        .select('*')

        .eq('id', reportId)

        .single();



      if (reportError || !report) {

        return {

          data: {} as ReportAnalytics,

          error: { message: 'Rapport non trouvé' }

        };

      }



      // Mock analytics calculation based on report type

      const analytics: ReportAnalytics = {

        report_id: reportId,

        period,

        profitability: {

          gross_margin: 43.2,

          operating_margin: 21.7,

          net_margin: 15.8,

          return_on_assets: 20.1,

          return_on_equity: 31.4

        },

        liquidity: {

          current_ratio: 2.43,

          quick_ratio: 1.92,

          cash_ratio: 1.09,

          working_capital: 190000

        },

        efficiency: {

          asset_turnover: 1.27,

          inventory_turnover: 10.4,

          receivables_turnover: 13.8,

          payables_turnover: 13.0

        },

        leverage: {

          debt_to_equity: 0.57,

          debt_to_assets: 0.36,

          interest_coverage: 14.8,

          debt_service_coverage: 2.8

        },

        trends: {

          revenue_growth: 8.5,

          expense_growth: 6.2,

          profit_growth: 12.3,

          asset_growth: 5.7

        },

        industry_benchmarks: {

          gross_margin: 40.0,

          operating_margin: 18.5,

          current_ratio: 2.1,

          debt_to_equity: 0.6

        }

      };

      

      return { data: analytics };

    } catch (_error) {

      return {

        data: {} as ReportAnalytics,

        error: { message: 'Erreur lors du calcul des analytiques' }

      };

    }

  }



  // Dashboard

  async getDashboardData(enterpriseId: string): Promise<ReportServiceResponse<ReportsDashboardData>> {

    try {

      // Utiliser des données mockées si flag activé

      // if (this.useMocks) { // TODO: Implement mock mode if needed

      //   return { data: this.getMockDashboardData() };

      // }



      const { data: enterpriseReports, error: reportsError } = await supabase

        .from('financial_reports')

        .select('*')

        .eq('company_id', enterpriseId);



      const { data: enterpriseSchedules, error: schedulesError } = await supabase

        .from('report_schedules')

        .select('*')

        .eq('company_id', enterpriseId);



      const { data: enterpriseTemplates, error: templatesError } = await supabase

        .from('report_templates')

        .select('*')

        .or(`company_id.eq.${enterpriseId},is_default.eq.true`);



      if (reportsError || schedulesError || templatesError) {

        throw new Error('Erreur lors de la récupération des données');

      }



      const reports = enterpriseReports || [];

      const schedules = enterpriseSchedules || [];

      const stats: ReportStats = this.buildDashboardStats(reports, schedules);



      const dashboardData: ReportsDashboardData = {

        stats,

        recent_reports: reports.slice(0, 5),

        scheduled_reports: schedules.filter(s => s.is_active).slice(0, 5),

        popular_templates: (enterpriseTemplates || []).slice(0, 3),

        key_metrics: {

          total_revenue_ytd: 0,

          total_expenses_ytd: 0,

          net_income_ytd: 0,

          cash_position: 0

        },

        alerts: {

          missing_data: Math.floor(Math.random() * 3) + 1,

          failed_schedules: Math.floor(Math.random() * 2),

          outdated_reports: Math.floor(Math.random() * 5) + 2

        }

      };



      return { data: dashboardData };

    } catch (_error) {

      return {

        data: {} as ReportsDashboardData,

        error: { message: 'Erreur lors de la récupération des données du tableau de bord' }

      };

    }

  }



  private buildDashboardStats(

    reports: Array<{ id: string; created_at: string; type?: string; file_format?: string; generated_at?: string }>,

    schedules: Array<{ is_active: boolean; report_template_id?: string; next_run?: string }>

  ): ReportStats {

    return {

      total_reports: reports.length,

      reports_this_month: reports.filter(r => {

        const createdDate = new Date(r.created_at);

        const now = new Date();

        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();

      }).length,

      automated_reports: schedules.filter(s => s.is_active).length,

  manual_reports: reports.filter(r => !schedules.some((s) => s.report_template_id === r.id)).length,

      by_type: [

        {

          type: 'balance_sheet',

          count: reports.filter(r => r.type === 'balance_sheet').length,

          last_generated: reports.find(r => r.type === 'balance_sheet')?.generated_at

        },

        {

          type: 'income_statement',

          count: reports.filter(r => r.type === 'income_statement').length,

          last_generated: reports.find(r => r.type === 'income_statement')?.generated_at

        },

        {

          type: 'cash_flow',

          count: reports.filter(r => r.type === 'cash_flow').length,

          last_generated: reports.find(r => r.type === 'cash_flow')?.generated_at

        }

      ],

      by_format: [

        {

          format: 'pdf',

          count: reports.filter(r => r.file_format === 'pdf').length,

          percentage: (reports.filter(r => r.file_format === 'pdf').length / Math.max(reports.length, 1)) * 100

        },

        {

          format: 'excel',

          count: reports.filter(r => r.file_format === 'excel').length,

          percentage: (reports.filter(r => r.file_format === 'excel').length / Math.max(reports.length, 1)) * 100

        }

      ],

      recent_generations: Math.floor(Math.random() * 10) + 5,

      scheduled_today: schedules.filter((s) => {

        const today = new Date().toISOString().split('T')[0];

        return s.next_run?.startsWith(today);

      }).length

    };

  }



  // Export functions

  async exportReport(reportId: string, config: ReportExportConfig): Promise<ReportServiceResponse<string>> {

    try {

      const { data: report, error } = await supabase

        .from('financial_reports')

        .select('*')

        .eq('id', reportId)

        .single();



      if (error || !report) {

        return {

          data: '',

          error: { message: 'Rapport non trouvé' }

        };

      }



      // Mock export URL generation

      const exportUrl = `/exports/${reportId}_${Date.now()}.${config.format}`;



      // Simulate export processing

      console.warn(`Export du rapport ${report.name} en format ${config.format}`);



      return { data: exportUrl };

    } catch (_error) {

      return {

        data: '',

        error: { message: 'Erreur lors de l\'export du rapport' }

      };

    }

  }



  exportReportsToCSV(reports: FinancialReport[], filename: string = 'rapports_financiers') {

    const headers = [

      'Nom',

      'Type',

      'Format',

      'Période début',

      'Période fin',

      'Statut',

      'Généré le',

      'Généré par',

      'Taille fichier (KB)',

      'Accès'

    ];

    

    const csvContent = [

      headers.join(','),

      ...reports.map(report => [

        `"${report.name}"`,

        `"${report.type}"`,

        `"${report.format}"`,

        report.created_at ? new Date(report.created_at).toLocaleDateString('fr-FR') : '',

        report.updated_at ? new Date(report.updated_at).toLocaleDateString('fr-FR') : '',

        `"${report.status || 'generated'}"`,

        report.created_at ? new Date(report.created_at).toLocaleDateString('fr-FR') : '',

        `"system"`,

        report.file_size ? Math.round(report.file_size / 1024).toString() : '0',

        `"public"`

      ].join(','))

    ].join('\n');

    

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);

    link.setAttribute('download', `${filename}.csv`);

    link.style.visibility = 'hidden';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

  }



  // Chart data generation

  async generateChartData(reportType: string, _period: string): Promise<ReportServiceResponse<ReportChartData[]>> {

    try {

      const charts: ReportChartData[] = [];

      

      if (reportType === 'balance_sheet') {

        charts.push({

          type: 'pie',

          title: 'Répartition de l\'Actif',

          data: {

            labels: ['Actif immobilisé', 'Actif circulant'],

            datasets: [{

              name: 'Montant',

              data: [50000, 30000], // TODO: Calculate from actual balance sheet data

              color: '#3b82f6'

            }]

          },

          options: {

            show_legend: true,

            show_grid: false,

            currency_format: true,

            percentage_format: false

          }

        });

      }

      

      if (reportType === 'income_statement') {

        charts.push({

          type: 'bar',

          title: 'Évolution Trimestrielle',

          data: {

            labels: ['T1 2023', 'T2 2023', 'T3 2023', 'T4 2023'],

            datasets: [{

              name: 'Chiffre d\'affaires',

              data: [280000, 315000, 298000, 339000],

              color: '#10b981'

            }, {

              name: 'Charges',

              data: [210000, 235000, 225000, 255000],

              color: '#ef4444'

            }]

          },

          options: {

            show_legend: true,

            show_grid: true,

            currency_format: true,

            percentage_format: false

          }

        });

      }

      

      return { data: charts };

    } catch (_error) {

      return {

        data: [],

        error: { message: 'Erreur lors de la génération des graphiques' }

      };

    }

  }



  // Helper: get single report

  async getReportById(reportId: string): Promise<ReportServiceResponse<FinancialReport | null>> {

    try {

      const { data, error } = await supabase

        .from('financial_reports')

        .select('*')

        .eq('id', reportId)

        .single();



      if (error) {

        return { data: null, error: { message: error.message } };

      }



      return { data: data as FinancialReport };

    } catch (_error) {

      return { data: null, error: { message: 'Erreur lors de la récupération du rapport' } };

    }

  }



  // Helper: resolve a download URL, exporting if needed

  async getDownloadUrl(reportId: string, preferredFormat: 'pdf' | 'excel' | 'csv' = 'pdf'): Promise<ReportServiceResponse<string>> {

    try {

      const reportRes = await this.getReportById(reportId);

      if (reportRes.error) return { data: '', error: reportRes.error };

      const report = reportRes.data as FinancialReport | null;

      if (!report) return { data: '', error: { message: 'Rapport introuvable' } };



      if (report.file_url) {

        return { data: report.file_url };

      }



      const exportRes = await this.exportReport(reportId, {

        format: preferredFormat,

        include_charts: true,

        include_notes: true,

        include_raw_data: false,

        compress: true,

        password_protect: false

      });

      if (exportRes.error) return { data: '', error: exportRes.error };

      return { data: exportRes.data };

    } catch (_error) {

      return { data: '', error: { message: 'Erreur lors de la génération du lien de téléchargement' } };

    }

  }



  // Utility functions

  private determinePeriodType(startDate: string, endDate: string): 'monthly' | 'quarterly' | 'annual' | 'custom' {

    const start = new Date(startDate);

    const end = new Date(endDate);

    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    

    if (diffMonths === 0) return 'monthly';

    if (diffMonths === 2) return 'quarterly';

    if (diffMonths === 11) return 'annual';

    return 'custom';

  }



  private calculateNextRun(frequency: string, dayOfMonth?: number, dayOfWeek?: number, time?: string): string {

    const now = new Date();

    const nextRun = new Date();

    

    switch (frequency) {

      case 'daily':

        nextRun.setDate(now.getDate() + 1);

        break;

      case 'weekly': {

        const targetDay = dayOfWeek || 1; // Monday default

        const currentDay = now.getDay();

        const daysUntilNext = (targetDay - currentDay + 7) % 7 || 7;

        nextRun.setDate(now.getDate() + daysUntilNext);

        break;

      }

      case 'monthly':

        nextRun.setMonth(now.getMonth() + 1);

        nextRun.setDate(dayOfMonth || 1);

        break;

      case 'quarterly':

        nextRun.setMonth(now.getMonth() + 3);

        nextRun.setDate(dayOfMonth || 1);

        break;

      case 'annually':

        nextRun.setFullYear(now.getFullYear() + 1);

        nextRun.setMonth(0);

        nextRun.setDate(dayOfMonth || 1);

        break;

      default:

        nextRun.setDate(now.getDate() + 1);

    }

    

    if (time) {

      const [hours, minutes] = time.split(':').map(Number);

      nextRun.setHours(hours, minutes, 0, 0);

    }

    

    return nextRun.toISOString();

  }



  // Méthodes de données mockées pour le développement

  private getMockReports(): FinancialReport[] {

    return [

      {

        id: 'report-1',

        company_id: 'comp-1',

        name: 'Bilan comptable - Décembre 2024',

        type: 'balance_sheet',

        format: 'detailed',

        period_start: '2024-12-01',

        period_end: '2024-12-31',

        status: 'ready',

        file_url: '/reports/balance-sheet-dec-2024.pdf',

        file_format: 'pdf',

        file_size: 2457600,

        generated_at: '2024-12-20T10:30:00Z',

        created_at: '2024-12-20T10:00:00Z',

        updated_at: '2024-12-20T10:30:00Z'

      },

      {

        id: 'report-2',

        company_id: 'comp-1',

        name: 'Compte de résultat - Novembre 2024',

        type: 'income_statement',

        format: 'detailed',

        period_start: '2024-11-01',

        period_end: '2024-11-30',

        status: 'ready',

        file_url: '/reports/income-statement-nov-2024.pdf',

        file_format: 'pdf',

        file_size: 1843200,

        generated_at: '2024-12-01T09:15:00Z',

        created_at: '2024-12-01T09:00:00Z',

        updated_at: '2024-12-01T09:15:00Z'

      }

    ];

  }



  private getMockTemplates(): ReportTemplate[] {

    return [

      {

        id: 'template-1',

        name: 'Bilan Standard PCG',

        description: 'Template de bilan conforme au Plan Comptable Général français',

        type: 'balance_sheet',

        sections: [

          {

            id: 'actif',

            name: 'ACTIF',

            order: 1,

            items: [

              {

                id: 'immobilisations',

                name: 'Immobilisations',

                account_codes: ['2'],

                calculation_type: 'sum',

                format: 'currency',

                show_in_summary: true

              }

            ]

          }

        ],

        styling: {

          font_family: 'Arial',

          font_size: 12,

          header_color: '#1f2937',

          show_logo: true,

          show_watermark: false

        },

        is_default: true,

        enterprise_id: 'ent-1',

        created_by: 'user-1',

        created_at: '2024-01-01T00:00:00Z',

        updated_at: '2024-01-01T00:00:00Z'

      }

    ];

  }



  private getMockSchedules(): ReportSchedule[] {

    return [

      {

        id: 'schedule-1',

        report_template_id: 'template-1',

        name: 'Bilan mensuel automatique',

        description: 'Génération automatique du bilan tous les mois',

        frequency: 'monthly',

        day_of_month: 1,

        time: '09:00',

        recipients: [

          {

            email: 'comptabilite@entreprise.com',

            name: 'Service Comptabilité',

            role: 'comptable'

          }

        ],

        auto_send: true,

        include_charts: true,

        file_format: 'pdf',

        report_type: 'balance_sheet',

        status: 'active',

        is_active: true,

        enterprise_id: 'ent-1',

        created_by: 'user-1',

        created_at: '2024-01-01T00:00:00Z',

        updated_at: '2024-01-01T00:00:00Z'

      }

    ];

  }



  private getMockDashboardData(): ReportsDashboardData {

    return {

      stats: {

        total_reports: 25,

        reports_this_month: 8,

        automated_reports: 15,

        manual_reports: 10,

        by_type: [

          { type: 'balance_sheet', count: 8, last_generated: '2024-12-20' },

          { type: 'income_statement', count: 7, last_generated: '2024-12-19' },

          { type: 'cash_flow', count: 4, last_generated: '2024-12-18' }

        ],

        by_format: [

          { format: 'pdf', count: 18, percentage: 72 },

          { format: 'excel', count: 5, percentage: 20 },

          { format: 'csv', count: 2, percentage: 8 }

        ],

        recent_generations: 12,

        scheduled_today: 3

      },

      recent_reports: this.getMockReports(),

      scheduled_reports: this.getMockSchedules(),

      popular_templates: this.getMockTemplates(),

      key_metrics: {

        total_revenue_ytd: 485000,

        total_expenses_ytd: 312000,

        net_income_ytd: 173000,

        cash_position: 125000

      },

      alerts: {

        missing_data: 0,

        failed_schedules: 0,

        outdated_reports: 2

      }

    };

  }

}



export const reportsService = new ReportsService();
