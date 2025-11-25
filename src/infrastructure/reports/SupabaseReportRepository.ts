import { supabase } from '../../lib/supabase';
import { IReportRepository } from '../../domain/reports/repositories/IReportRepository';
import { Report, ReportExecution, ReportParameters, ReportMetadata, ReportCategory, ReportFrequency } from '../../domain/reports/entities/Report';

export class SupabaseReportRepository implements IReportRepository {
  async findReportById(id: string): Promise<Report | null> {
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Error fetching report template:', error);
      return null;
    }

    const metadata: ReportMetadata = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      category: data.category as ReportCategory,
      frequency: data.frequency as ReportFrequency,
      requiredPeriods: 1, // Default value
      estimatedDuration: data.estimated_duration,
      complexity: data.complexity as 'simple' | 'medium' | 'complex',
      tags: data.tags || []
    };

    return new Report(metadata);
  }

  async findReportsByCategory(category: string): Promise<Report[]> {
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching reports by category:', error);
      throw error;
    }

    return data.map(template => {
      const metadata: ReportMetadata = {
        id: template.id,
        name: template.name,
        description: template.description || '',
        category: template.category as ReportCategory,
        frequency: template.frequency as ReportFrequency,
        requiredPeriods: 1,
        estimatedDuration: template.estimated_duration,
        complexity: template.complexity as 'simple' | 'medium' | 'complex',
        tags: template.tags || []
      };
      return new Report(metadata);
    });
  }

  async findAllReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching all reports:', error);
      throw error;
    }

    return data.map(template => {
      const metadata: ReportMetadata = {
        id: template.id,
        name: template.name,
        description: template.description || '',
        category: template.category as ReportCategory,
        frequency: template.frequency as ReportFrequency,
        requiredPeriods: 1,
        estimatedDuration: template.estimated_duration,
        complexity: template.complexity as 'simple' | 'medium' | 'complex',
        tags: template.tags || []
      };
      return new Report(metadata);
    });
  }

  async createExecution(reportId: string, parameters: ReportParameters): Promise<ReportExecution> {
    const execution: ReportExecution = {
      id: this.generateId(),
      reportId,
      status: 'generating',
      createdAt: new Date(),
      parameters,
      progress: 0
    };

    // Store in Supabase
    const { error } = await supabase
      .from('report_executions')
      .insert({
        id: execution.id,
        report_id: execution.reportId,
        status: execution.status,
        created_at: execution.createdAt.toISOString(),
        parameters: execution.parameters,
        progress: execution.progress,
        company_id: parameters.companyId
      });

    if (error) {
      console.error('Error creating report execution:', error);
      // In development, continue without error to avoid blocking
      if (import.meta.env.DEV) {
        console.warn('Using mock report execution in development mode');
      } else {
        throw error;
      }
    }

    return execution;
  }

  async updateExecution(executionId: string, update: Partial<ReportExecution>): Promise<void> {
    const { error } = await supabase
      .from('report_executions')
      .update({
        status: update.status,
        completed_at: update.completedAt?.toISOString(),
        result: update.result,
        error: update.error,
        progress: update.progress
      })
      .eq('id', executionId);

    if (error && !import.meta.env.DEV) {
      throw error;
    }
  }

  async findExecutionById(executionId: string): Promise<ReportExecution | null> {
    const { data, error } = await supabase
      .from('report_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (error) {
      console.error('Error fetching report execution:', error);
      return null;
    }

    return this.mapExecutionFromDB(data);
  }

  async findExecutionsByReportId(reportId: string, limit = 10): Promise<ReportExecution[]> {
    const { data, error } = await supabase
      .from('report_executions')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching report executions:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(this.mapExecutionFromDB);
  }

  async getFinancialData(companyId: string, dateFrom: Date, dateTo: Date): Promise<Record<string, unknown>> {
    // Use the balance sheet function for complete financial data
    const { data, error } = await supabase
      .rpc('get_balance_sheet_data', {
        p_company_id: companyId,
        p_date_from: dateFrom.toISOString().split('T')[0],
        p_date_to: dateTo.toISOString().split('T')[0]
      });

    if (error) {
      console.error('Error fetching financial data:', error);
      throw error;
    }

    return data;
  }

  async getAccountingEntries(companyId: string, dateFrom: Date, dateTo: Date): Promise<Array<Record<string, unknown>>> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        id,
        entry_date,
        reference,
        description,
        account_code,
        account_name,
        debit_amount,
        credit_amount,
        company_id
      `)
      .eq('company_id', companyId)
      .gte('entry_date', dateFrom.toISOString())
      .lte('entry_date', dateTo.toISOString())
      .order('entry_date', { ascending: true });

    if (error) {
      console.error('Error fetching accounting entries:', error);
      throw error;
    }

    return data || [];
  }

  async getInvoices(companyId: string, dateFrom: Date, dateTo: Date): Promise<Array<Record<string, unknown>>> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('company_id', companyId)
      .gte('entry_date', dateFrom.toISOString())
      .lte('entry_date', dateTo.toISOString());

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    return data || [];
  }

  async getExpenses(companyId: string, dateFrom: Date, dateTo: Date): Promise<Array<Record<string, unknown>>> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('company_id', companyId)
      .gte('entry_date', dateFrom.toISOString())
      .lte('entry_date', dateTo.toISOString());

    if (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }

    return data || [];
  }

  async getCachedReportResult(reportId: string, parameters: ReportParameters): Promise<Record<string, unknown> | null> {
    const cacheKey = this.generateCacheKey(reportId, parameters);

    const { data, error } = await supabase
      .from('report_cache')
      .select('result, expires_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data.result;
  }

  async setCachedReportResult(reportId: string, parameters: ReportParameters, result: Record<string, unknown>, ttl: number): Promise<void> {
    const cacheKey = this.generateCacheKey(reportId, parameters);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    const { error } = await supabase
      .from('report_cache')
      .upsert({
        cache_key: cacheKey,
        report_id: reportId,
        result,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Failed to cache report result:', error);
    }
  }

  private mapExecutionFromDB(data: Record<string, unknown>): ReportExecution {
    return {
      id: data.id,
      reportId: data.report_id,
      status: data.status,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      parameters: data.parameters,
      result: data.result,
      error: data.error,
      progress: data.progress || 0
    };
  }

  private generateId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(reportId: string, parameters: ReportParameters): string {
    const key = `${reportId}_${parameters.companyId}_${parameters.dateFrom.toISOString()}_${parameters.dateTo.toISOString()}`;
    return btoa(key);
  }

}
