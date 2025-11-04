export interface ReportMetadata {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  frequency: ReportFrequency;
  requiredPeriods: number;
  estimatedDuration: number;
  complexity: 'simple' | 'medium' | 'complex';
  tags: string[];
}

export type ReportCategory =
  | 'financial_statements'
  | 'management'
  | 'tax'
  | 'analytics'
  | 'compliance';

export type ReportFrequency =
  | 'real_time'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'on_demand';

export type ReportStatus =
  | 'draft'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'expired';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'html';

export interface ReportExecution {
  id: string;
  reportId: string;
  status: ReportStatus;
  createdAt: Date;
  completedAt?: Date;
  parameters: ReportParameters;
  result?: ReportResult;
  error?: string;
  progress: number;
}

export interface ReportParameters {
  dateFrom: Date;
  dateTo: Date;
  companyId: string;
  currency?: string;
  filters?: Record<string, unknown>;
  groupBy?: string[];
  includeComparisons?: boolean;
  previousPeriod?: boolean;
}

export interface ReportResult {
  data: Record<string, unknown>;
  metadata: {
    generatedAt: Date;
    dataPoints: number;
    queryTime: number;
    cacheHit: boolean;
  };
  summary: ReportSummary;
}

export interface ReportSummary {
  totalRevenue?: number;
  totalExpenses?: number;
  netIncome?: number;
  grossMargin?: number;
  keyMetrics: Record<string, number>;
  insights: string[];
  recommendations: string[];
}

export class Report {
  constructor(
    public readonly metadata: ReportMetadata,
    public readonly execution?: ReportExecution
  ) {}

  get isExecutable(): boolean {
    return this.metadata.complexity !== 'complex' || this.hasRequiredData();
  }

  get estimatedSize(): 'small' | 'medium' | 'large' {
    if (this.metadata.estimatedDuration < 30) return 'small';
    if (this.metadata.estimatedDuration < 120) return 'medium';
    return 'large';
  }

  private hasRequiredData(): boolean {
    // TODO: Implement actual data availability check
    return true;
  }
}
