import { Report, ReportExecution, ReportParameters } from '../entities/Report';

export interface IReportRepository {
  // Report definitions
  findReportById(id: string): Promise<Report | null>;
  findReportsByCategory(category: string): Promise<Report[]>;
  findAllReports(): Promise<Report[]>;

  // Report executions
  createExecution(reportId: string, parameters: ReportParameters): Promise<ReportExecution>;
  updateExecution(executionId: string, update: Partial<ReportExecution>): Promise<void>;
  findExecutionById(executionId: string): Promise<ReportExecution | null>;
  findExecutionsByReportId(reportId: string, limit?: number): Promise<ReportExecution[]>;

  // Data access for report generation
  getFinancialData(companyId: string, dateFrom: Date, dateTo: Date): Promise<any>;
  getAccountingEntries(companyId: string, dateFrom: Date, dateTo: Date): Promise<any[]>;
  getInvoices(companyId: string, dateFrom: Date, dateTo: Date): Promise<any[]>;
  getExpenses(companyId: string, dateFrom: Date, dateTo: Date): Promise<any[]>;

  // Caching
  getCachedReportResult(reportId: string, parameters: ReportParameters): Promise<any | null>;
  setCachedReportResult(reportId: string, parameters: ReportParameters, result: any, ttl: number): Promise<void>;
}
