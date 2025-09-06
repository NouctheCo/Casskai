// Types pour les composants AI

// Types de transactions
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

// Types pour AI Assistant
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

// Types pour la santé financière
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

// Types pour les alertes intelligentes
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

export interface CashFlowPrediction {
  id: string;
  month: string;
  date: Date;
  actualValue?: number;
  predictedValue: number;
  predictedIncome: number;
  predictedExpenses: number;
  predictedBalance: number;
  confidence: number;
  factors?: PredictionFactor[];
  trend?: 'up' | 'down' | 'stable';
  variance?: number;
}

export interface PredictionFactor {
  id: string;
  name: string;
  impact: number;
  description?: string;
  weight?: number;
}

// Types pour les recommandations fiscales
export type TaxOptimizationStatus = 'suggested' | 'in_progress' | 'completed' | 'dismissed' | 'implemented';

export interface TaxOptimization {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  complexity: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  type: 'deduction' | 'credit' | 'timing' | 'structure';
  deadline?: string;
  status: TaxOptimizationStatus;
  category: string;
  implementationSteps?: string[];
  requirements?: string[];
  estimatedTime?: string;
}

// Types pour Analytics
export interface PlausibleEventProps {
  [key: string]: string | number | boolean | undefined;
}

// Types pour les modules de service
export interface ServiceResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

// Types pour les widgets AI
export interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'prediction' | 'analysis';
  title: string;
  description: string;
  confidence: number;
  category: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLoading?: boolean;
  error?: string;
}

// Types pour les prédictions d'anomalies
export interface AnomalyDetection {
  id: string;
  type: 'outlier' | 'pattern' | 'trend';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedData: string;
  detectedAt: string;
  confidence: number;
  resolved: boolean;
  transaction: Transaction;
  score: number;
  reasons: string[];
  timestamp: Date;
  possibleCauses?: string[];
  suggestedActions?: string[];
}