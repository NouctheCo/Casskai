// Types pour l'IA financière et l'analyse prédictive

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  category?: string;
  type: 'income' | 'expense';
  account: string;
  counterparty?: string;
  reference?: string;
  tags?: string[];
  isAnomaly?: boolean;
  anomalyScore?: number;
  predictedCategory?: string;
  categoryConfidence?: number;
}

export interface AnomalyDetection {
  transaction: Transaction;
  score: number;
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
}

export interface CashFlowPrediction {
  date: Date;
  predictedIncome: number;
  predictedExpenses: number;
  predictedBalance: number;
  confidence: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface FinancialHealthScore {
  overall: number;
  liquidity: number;
  profitability: number;
  efficiency: number;
  solvency: number;
  factors: HealthFactor[];
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

export interface HealthFactor {
  metric: string;
  score: number;
  weight: number;
  description: string;
  recommendation?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  parentId?: string;
  keywords: string[];
  patterns: string[];
  confidence: number;
  color: string;
  icon: string;
  budget?: number;
  alertThreshold?: number;
}

export interface CategoryPrediction {
  category: ExpenseCategory;
  confidence: number;
  reasoning: string[];
}

export interface AIAssistantQuery {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
  type: 'accounting' | 'tax' | 'analysis' | 'general';
  confidence: number;
  sources?: string[];
  suggestions?: string[];
}

export interface TaxOptimization {
  id: string;
  type: 'deduction' | 'credit' | 'timing' | 'structure';
  title: string;
  description: string;
  potentialSaving: number;
  effort: 'low' | 'medium' | 'high';
  deadline?: Date;
  requirements: string[];
  status: 'suggested' | 'in_progress' | 'completed' | 'dismissed';
}

export interface SmartAlert {
  id: string;
  type: 'anomaly' | 'threshold' | 'trend' | 'opportunity' | 'risk';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: Date;
  isRead: boolean;
  actions?: AlertAction[];
  autoResolve?: boolean;
  expiresAt?: Date;
}

export interface AlertAction {
  label: string;
  action: string;
  params?: Record<string, unknown>;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface ReportNarrative {
  id: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  title: string;
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  metrics: NarrativeMetric[];
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
}

export interface NarrativeMetric {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  interpretation: string;
}

// ML Model configurations
export interface MLModelConfig {
  id: string;
  name: string;
  type: 'classification' | 'regression' | 'clustering' | 'anomaly_detection';
  version: string;
  trainingData: {
    samples: number;
    features: string[];
    lastTrained: Date;
  };
  performance: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
  };
  hyperparameters: Record<string, unknown>;
  isActive: boolean;
}

export interface PredictiveModel {
  anomalyDetection: MLModelConfig;
  categoryClassification: MLModelConfig;
  cashFlowForecasting: MLModelConfig;
  healthScoring: MLModelConfig;
}

// Visualisation data types
export interface HeatmapData {
  date: Date;
  category: string;
  value: number;
  normalized?: number;
}

export interface SankeyNode {
  id: string;
  name: string;
  category: string;
  value: number;
  color?: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  color?: string;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface TreemapNode {
  id: string;
  name: string;
  value: number;
  parentId?: string;
  children?: TreemapNode[];
  color?: string;
  percentage?: number;
}

export interface FinancialTimeSeriesData {
  date: Date;
  value: number;
  predicted?: boolean;
  confidence?: number;
  trend?: number;
}

// AI Service responses
export interface AIServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  confidence?: number;
  processingTime?: number;
  modelUsed?: string;
}

export interface BatchPredictionResult {
  processed: number;
  successful: number;
  failed: number;
  results: unknown[];
  errors: string[];
  processingTime: number;
}

// Configuration types
export interface AIConfiguration {
  openaiApiKey?: string;
  models: {
    anomalyDetection: {
      enabled: boolean;
      threshold: number;
      features: string[];
    };
    categoryClassification: {
      enabled: boolean;
      confidence: number;
      autoApply: boolean;
    };
    cashFlowPrediction: {
      enabled: boolean;
      horizon: number; // days
      method: 'regression' | 'arima' | 'lstm';
    };
    healthScoring: {
      enabled: boolean;
      weights: Record<string, number>;
      updateFrequency: number; // minutes
    };
  };
  assistant: {
    enabled: boolean;
    model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
    maxTokens: number;
    temperature: number;
    contextWindow: number;
  };
  alerts: {
    enabled: boolean;
    thresholds: Record<string, number>;
    channels: ('ui' | 'email' | 'webhook')[];
  };
}

export interface TrainingData {
  transactions: Transaction[];
  categories: ExpenseCategory[];
  labels: Record<string, string>; // transaction_id -> category_id
  features: number[][];
  targets: number[];
}

// Performance monitoring
export interface AIPerformanceMetrics {
  modelId: string;
  timestamp: Date;
  predictions: number;
  accuracy: number;
  latency: number; // ms
  memoryUsage: number; // MB
  errors: number;
  successRate: number;
}

export interface AIUsageStatistics {
  period: {
    start: Date;
    end: Date;
  };
  totalPredictions: number;
  totalQueries: number;
  averageResponseTime: number;
  modelAccuracy: Record<string, number>;
  costEstimate: number;
  topQueries: Array<{
    query: string;
    count: number;
  }>;
}