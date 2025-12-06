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

import { useState, useEffect, useCallback } from 'react';

import { Report, ReportExecution, ReportParameters } from '../domain/reports/entities/Report';

import { ReportService } from '../application/reports/ReportService';

import { SupabaseReportRepository } from '../infrastructure/reports/SupabaseReportRepository';

import { useAuth } from '@/contexts/AuthContext';



// Legacy interfaces for backward compatibility

export interface ReportFilters {

  dateFrom?: string;

  dateTo?: string;

  accountType?: string;

  journalId?: string;

  status?: string;

}



export interface BalanceSheetData {

  assets: {

    current_assets: Record<string, number>;

    non_current_assets: Record<string, number>;

    total_assets: number;

  };

  liabilities: {

    current_liabilities: Record<string, number>;

    non_current_liabilities: Record<string, number>;

    total_liabilities: number;

  };

  equity: {

    retained_earnings: number;

    capital: number;

    total_equity: number;

  };

}



export interface IncomeStatementData {

  revenue: Record<string, number>;

  expenses: Record<string, number>;

  total_revenue: number;

  total_expenses: number;

  net_income: number;

  gross_profit: number;

  operating_income: number;

}



export interface TrialBalanceData {

  accounts: Array<{

    account_number: string;

    account_name: string;

    account_type: string;

    debit: number;

    credit: number;

    balance: number;

  }>;

  total_debits: number;

  total_credits: number;

  is_balanced: boolean;

}



export interface ReportSummary {

  id: string;

  name: string;

  type: 'balance_sheet' | 'income_statement' | 'trial_balance' | 'cash_flow';

  period_start: string;

  period_end: string;

  status: 'draft' | 'final' | 'archived';

  created_at: string;

  created_by: string;

  file_url?: string;

}



// Modern interface

export interface UseReportsReturn {

  // Legacy data for backward compatibility

  reports: ReportSummary[];

  loading: boolean;

  error: string | null;



  // Modern data

  reportDefinitions: Report[];

  executions: ReportExecution[];

  currentExecution: ReportExecution | null;

  generating: boolean;



  // Legacy methods for backward compatibility

  generateBalanceSheet: (filters?: ReportFilters) => Promise<BalanceSheetData | null>;

  generateIncomeStatement: (filters?: ReportFilters) => Promise<IncomeStatementData | null>;

  generateTrialBalance: (filters?: ReportFilters) => Promise<TrialBalanceData | null>;

  getReportHistory: () => Promise<ReportSummary[]>;

  saveReport: (type: string, name: string, data: any, periodStart: string, periodEnd: string) => Promise<string | null>;

  deleteReport: (reportId: string) => Promise<void>;

  refresh: () => Promise<void>;



  // Modern methods

  loadReports: () => Promise<void>;

  loadReportsByCategory: (category: string) => Promise<void>;

  generateReport: (reportId: string, parameters: ReportParameters) => Promise<ReportExecution>;

  getReportExecution: (executionId: string) => Promise<void>;

  getReportExecutions: (reportId: string) => Promise<void>;

  estimateGeneration: (reportId: string, parameters: ReportParameters) => Promise<{

    estimatedTime: number;

    complexity: string;

    warnings: string[];

  }>;

  clearError: () => void;

  refreshExecution: (executionId: string) => Promise<void>;

}



// Initialize service instances

const reportRepository = new SupabaseReportRepository();

const reportService = new ReportService(reportRepository);



export function useReports(companyId: string): UseReportsReturn {

  const { user } = useAuth();



  // Legacy state

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [reports, _setReports] = useState<ReportSummary[]>([]);



  // Modern state

  const [reportDefinitions, setReportDefinitions] = useState<Report[]>([]);

  const [executions, setExecutions] = useState<ReportExecution[]>([]);

  const [currentExecution, setCurrentExecution] = useState<ReportExecution | null>(null);

  const [generating, setGenerating] = useState(false);



  // Modern methods

  const clearError = useCallback(() => {

    setError(null);

  }, []);



  const loadReports = useCallback(async () => {

    try {

      setLoading(true);

      setError(null);

      const allReports = await reportService.getAllReports();

      setReportDefinitions(allReports);

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Failed to load reports');

    } finally {

      setLoading(false);

    }

  }, []);



  const loadReportsByCategory = useCallback(async (category: string) => {

    try {

      setLoading(true);

      setError(null);

      const categoryReports = await reportService.getReportsByCategory(category);

      setReportDefinitions(categoryReports);

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Failed to load reports by category');

    } finally {

      setLoading(false);

    }

  }, []);



  const generateReport = useCallback(async (reportId: string, parameters: ReportParameters): Promise<ReportExecution> => {

    try {

      setGenerating(true);

      setError(null);

      const execution = await reportService.generateReport(reportId, parameters);

      setCurrentExecution(execution);



      // Start polling for updates if report is generating

      if (execution.status === 'generating') {

        startExecutionPolling(execution.id);

      }



      return execution;

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Failed to generate report');

      throw err;

    } finally {

      setGenerating(false);

    }

  }, []);



  const getReportExecution = useCallback(async (executionId: string) => {

    try {

      const execution = await reportService.getReportExecution(executionId);

      if (execution) {

        setCurrentExecution(execution);

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Failed to get report execution');

    }

  }, []);



  const getReportExecutions = useCallback(async (reportId: string) => {

    try {

      const reportExecutions = await reportService.getReportExecutions(reportId);

      setExecutions(reportExecutions);

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Failed to get report executions');

    }

  }, []);



  const estimateGeneration = useCallback(async (reportId: string, parameters: ReportParameters) => {

    try {

      return await reportService.estimateReportGeneration(reportId, parameters);

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Failed to estimate generation time');

      throw err;

    }

  }, []);



  const refreshExecution = useCallback(async (executionId: string) => {

    try {

      const execution = await reportService.getReportExecution(executionId);

      if (execution) {

        setCurrentExecution(execution);



        // Continue polling if still generating

        if (execution.status === 'generating') {

          setTimeout(() => refreshExecution(executionId), 2000);

        }

      }

    } catch (_err) {

      console.error('...', error);

    }

  }, []);



  const startExecutionPolling = useCallback((executionId: string) => {

    const pollInterval = setInterval(async () => {

      try {

        const execution = await reportService.getReportExecution(executionId);

        if (execution) {

          setCurrentExecution(execution);



          // Stop polling if execution is complete

          if (execution.status === 'completed' || execution.status === 'failed') {

            clearInterval(pollInterval);

          }

        }

      } catch (_err) {

        console.error('...', error);

        clearInterval(pollInterval);

      }

    }, 2000); // Poll every 2 seconds



    // Cleanup after 5 minutes max

    setTimeout(() => clearInterval(pollInterval), 300000);

  }, []);



  // Legacy methods - using new architecture under the hood

  const generateBalanceSheet = useCallback(async (filters: ReportFilters = {}): Promise<BalanceSheetData | null> => {

    if (!user || !companyId) return null;



    try {

      const parameters: ReportParameters = {

        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : new Date(),

        dateTo: filters.dateTo ? new Date(filters.dateTo) : new Date(),

        companyId

      };



      const execution = await generateReport('balance_sheet', parameters);



      // Wait for completion in simple cases

      if (execution.status === 'completed' && execution.result?.data) {

        const data = execution.result.data as any; // Temp fix for TS2339

        return {

          assets: {

            current_assets: data.assets?.current || {},

            non_current_assets: data.assets?.nonCurrent || {},

            total_assets: data.assets?.total || 0

          },

          liabilities: {

            current_liabilities: data.liabilities?.current || {},

            non_current_liabilities: data.liabilities?.nonCurrent || {},

            total_liabilities: data.liabilities?.total || 0

          },

          equity: {

            retained_earnings: data.equity?.retained_earnings || 0,

            capital: data.equity?.share_capital || 0,

            total_equity: data.equity?.total || 0

          }

        };

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Failed to generate balance sheet');

    }



    return null;

  }, [user, companyId, generateReport]);



  const generateIncomeStatement = useCallback(async (filters: ReportFilters = {}): Promise<IncomeStatementData | null> => {

    if (!user || !companyId) return null;



    try {

      const parameters: ReportParameters = {

        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : new Date(),

        dateTo: filters.dateTo ? new Date(filters.dateTo) : new Date(),

        companyId

      };



      const execution = await generateReport('income_statement', parameters);



      if (execution.status === 'completed' && execution.result?.data) {

        const data = execution.result.data as any; // Temp fix for TS2339

        return {

          revenue: data.revenue || {},

          expenses: data.expenses || {},

          total_revenue: data.revenue?.total || 0,

          total_expenses: data.expenses?.total || 0,

          net_income: data.net_income || 0,

          gross_profit: data.margins?.gross_margin || 0,

          operating_income: data.margins?.operating_margin || 0

        };

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Failed to generate income statement');

    }



    return null;

  }, [user, companyId, generateReport]);



  const generateTrialBalance = useCallback(async (filters: ReportFilters = {}): Promise<TrialBalanceData | null> => {

    if (!user || !companyId) return null;



    try {

      const parameters: ReportParameters = {

        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : new Date(),

        dateTo: filters.dateTo ? new Date(filters.dateTo) : new Date(),

        companyId

      };



      const execution = await generateReport('trial_balance', parameters);



      if (execution.status === 'completed' && execution.result?.data) {

        const data = execution.result.data as any; // Temp fix for TS2339

        return {

          accounts: data.accounts || [],

          total_debits: data.total_debits || 0,

          total_credits: data.total_credits || 0,

          is_balanced: data.is_balanced || false

        };

      }

    } catch (err) {

      setError(err instanceof Error ? (err as Error).message : 'Failed to generate trial balance');

    }



    return null;

  }, [user, companyId, generateReport]);



  const getReportHistory = useCallback(async (): Promise<ReportSummary[]> => {

    if (!user || !companyId) return [];

    // Legacy method - return empty for now, use modern executions instead

    return [];

  }, [user, companyId]);



  const saveReport = useCallback(async (

    _type: string,

    _name: string,

    _data: any,

    _periodStart: string,

    _periodEnd: string

  ): Promise<string | null> => {

    if (!user || !companyId) return null;

    // Legacy method - not implemented in new architecture

    console.warn('saveReport is deprecated, use the new report execution system');

    return null;

  }, [user, companyId]);



  const deleteReport = useCallback(async (_reportId: string): Promise<void> => {

    if (!user || !companyId) return;

    // Legacy method - not implemented in new architecture

    console.warn('deleteReport is deprecated, use the new report execution system');

  }, [user, companyId]);



  const refresh = useCallback(async () => {

    await loadReports();

  }, [loadReports]);



  // Load reports on mount

  useEffect(() => {

    if (companyId) {

      loadReports();

    }

  }, [companyId, loadReports]);



  return {

    // Legacy data

    reports,

    loading,

    error,



    // Modern data

    reportDefinitions,

    executions,

    currentExecution,

    generating,



    // Legacy methods

    generateBalanceSheet,

    generateIncomeStatement,

    generateTrialBalance,

    getReportHistory,

    saveReport,

    deleteReport,

    refresh,



    // Modern methods

    loadReports,

    loadReportsByCategory,

    generateReport,

    getReportExecution,

    getReportExecutions,

    estimateGeneration,

    clearError,

    refreshExecution

  };

}
