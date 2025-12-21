import { Report, ReportParameters, ReportResult } from '../entities/Report';

export interface IReportGeneratorService {
  generateReport(report: Report, parameters: ReportParameters): Promise<ReportResult>;
  validateParameters(report: Report, parameters: ReportParameters): ValidationResult;
  estimateGenerationTime(report: Report, parameters: ReportParameters): number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export abstract class BaseReportGenerator implements IReportGeneratorService {
  abstract generateReport(report: Report, parameters: ReportParameters): Promise<ReportResult>;

  validateParameters(report: Report, parameters: ReportParameters): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Common validations
    if (parameters.dateFrom >= parameters.dateTo) {
      errors.push('Date from must be before date to');
    }

    if (!parameters.companyId) {
      errors.push('Company ID is required');
    }

    const periodDays = Math.ceil((parameters.dateTo.getTime() - parameters.dateFrom.getTime()) / (1000 * 60 * 60 * 24));
    if (periodDays > 365 && report.metadata.complexity === 'complex') {
      warnings.push('Large date range may impact performance for complex reports');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  estimateGenerationTime(report: Report, parameters: ReportParameters): number {
    const baseTime = report.metadata.estimatedDuration;
    const periodDays = Math.ceil((parameters.dateTo.getTime() - parameters.dateFrom.getTime()) / (1000 * 60 * 60 * 24));

    // Adjust based on period length
    const periodMultiplier = Math.max(1, periodDays / 30);

    return Math.ceil(baseTime * periodMultiplier);
  }

  protected async measureExecutionTime<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    return { result, duration };
  }
}
