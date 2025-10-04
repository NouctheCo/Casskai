import { IReportRepository } from '../../domain/reports/repositories/IReportRepository';
import { IReportGeneratorService } from '../../domain/reports/services/IReportGeneratorService';
import { Report, ReportExecution, ReportParameters, ReportResult } from '../../domain/reports/entities/Report';
import { BalanceSheetGenerator } from '../../infrastructure/reports/generators/BalanceSheetGenerator';
import { IncomeStatementGenerator } from '../../infrastructure/reports/generators/IncomeStatementGenerator';
import { CashFlowGenerator } from '../../infrastructure/reports/generators/CashFlowGenerator';

export class ReportService {
  private generators = new Map<string, IReportGeneratorService>();

  constructor(private repository: IReportRepository) {
    this.initializeGenerators();
  }

  private initializeGenerators() {
    this.generators.set('balance_sheet', new BalanceSheetGenerator(this.repository));
    this.generators.set('income_statement', new IncomeStatementGenerator(this.repository));
    this.generators.set('cash_flow', new CashFlowGenerator(this.repository));
    // Add more generators as needed
  }

  async getAllReports(): Promise<Report[]> {
    return await this.repository.findAllReports();
  }

  async getReportsByCategory(category: string): Promise<Report[]> {
    return await this.repository.findReportsByCategory(category);
  }

  async getReportById(id: string): Promise<Report | null> {
    return await this.repository.findReportById(id);
  }

  async generateReport(reportId: string, parameters: ReportParameters): Promise<ReportExecution> {
    // Get report definition
    const report = await this.repository.findReportById(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    // Get appropriate generator
    const generator = this.generators.get(reportId);
    if (!generator) {
      throw new Error(`No generator found for report: ${reportId}`);
    }

    // Validate parameters
    const validation = generator.validateParameters(report, parameters);
    if (!validation.isValid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }

    // Check cache first
    const cachedResult = await this.repository.getCachedReportResult(reportId, parameters);
    if (cachedResult) {
      const execution = await this.repository.createExecution(reportId, parameters);
      await this.repository.updateExecution(execution.id, {
        status: 'completed',
        completedAt: new Date(),
        result: cachedResult,
        progress: 100
      });
      return { ...execution, status: 'completed', result: cachedResult, progress: 100 };
    }

    // Create execution record
    const execution = await this.repository.createExecution(reportId, parameters);

    try {
      // Generate report asynchronously
      this.generateReportAsync(execution.id, report, generator, parameters);
      return execution;
    } catch (error) {
      await this.repository.updateExecution(execution.id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0
      });
      throw error;
    }
  }

  private async generateReportAsync(
    executionId: string,
    report: Report,
    generator: IReportGeneratorService,
    parameters: ReportParameters
  ): Promise<void> {
    try {
      // Update progress
      await this.repository.updateExecution(executionId, {
        status: 'generating',
        progress: 25
      });

      // Generate report
      const result = await generator.generateReport(report, parameters);

      // Update progress
      await this.repository.updateExecution(executionId, {
        progress: 75
      });

      // Cache result (TTL based on report frequency)
      const cacheTTL = this.getCacheTTL(report.metadata.frequency);
      await this.repository.setCachedReportResult(report.metadata.id, parameters, result, cacheTTL);

      // Complete execution
      await this.repository.updateExecution(executionId, {
        status: 'completed',
        completedAt: new Date(),
        result,
        progress: 100
      });
    } catch (error) {
      await this.repository.updateExecution(executionId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0
      });
    }
  }

  async getReportExecution(executionId: string): Promise<ReportExecution | null> {
    return await this.repository.findExecutionById(executionId);
  }

  async getReportExecutions(reportId: string, limit?: number): Promise<ReportExecution[]> {
    return await this.repository.findExecutionsByReportId(reportId, limit);
  }

  async estimateReportGeneration(reportId: string, parameters: ReportParameters): Promise<{
    estimatedTime: number;
    complexity: string;
    warnings: string[];
  }> {
    const report = await this.repository.findReportById(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    const generator = this.generators.get(reportId);
    if (!generator) {
      throw new Error(`No generator found for report: ${reportId}`);
    }

    const validation = generator.validateParameters(report, parameters);
    const estimatedTime = generator.estimateGenerationTime(report, parameters);

    return {
      estimatedTime,
      complexity: report.metadata.complexity,
      warnings: validation.warnings
    };
  }

  async getReportInsights(reportId: string, parameters: ReportParameters): Promise<{
    trends: string[];
    alerts: string[];
    recommendations: string[];
  }> {
    // This would typically analyze historical data and provide insights
    // For now, return basic insights based on report type
    const insights = {
      trends: [],
      alerts: [],
      recommendations: []
    };

    const report = await this.repository.findReportById(reportId);
    if (!report) return insights;

    // Get recent executions for trend analysis
    const recentExecutions = await this.repository.findExecutionsByReportId(reportId, 5);
    const completedExecutions = recentExecutions.filter(e => e.status === 'completed' && e.result);

    if (completedExecutions.length >= 2) {
      // Analyze trends between recent reports
      const latest = completedExecutions[0];
      const previous = completedExecutions[1];

      if (latest.result?.summary && previous.result?.summary) {
        this.analyzeFinancialTrends(latest.result.summary, previous.result.summary, insights);
      }
    }

    return insights;
  }

  private analyzeFinancialTrends(latest: any, previous: any, insights: any) {
    // Revenue trends
    if (latest.totalRevenue && previous.totalRevenue) {
      const revenueGrowth = ((latest.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100;
      if (revenueGrowth > 10) {
        insights.trends.push(`Croissance du chiffre d'affaires: +${revenueGrowth.toFixed(1)}%`);
      } else if (revenueGrowth < -5) {
        insights.alerts.push(`Baisse du chiffre d'affaires: ${revenueGrowth.toFixed(1)}%`);
        insights.recommendations.push('Analyser les causes de la baisse du chiffre d\'affaires');
      }
    }

    // Margin trends
    if (latest.grossMargin && previous.grossMargin) {
      const marginChange = latest.grossMargin - previous.grossMargin;
      if (marginChange > 2) {
        insights.trends.push(`Amélioration de la marge brute: +${marginChange.toFixed(1)} points`);
      } else if (marginChange < -2) {
        insights.alerts.push(`Détérioration de la marge brute: ${marginChange.toFixed(1)} points`);
        insights.recommendations.push('Revoir la politique de prix ou optimiser les coûts');
      }
    }
  }

  private getCacheTTL(frequency: string): number {
    const ttlMap = {
      'real_time': 300,      // 5 minutes
      'daily': 3600,         // 1 hour
      'weekly': 7200,        // 2 hours
      'monthly': 86400,      // 24 hours
      'quarterly': 259200,   // 3 days
      'yearly': 604800,      // 7 days
      'on_demand': 1800      // 30 minutes
    };

    return ttlMap[frequency as keyof typeof ttlMap] || 1800;
  }
}