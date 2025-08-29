// Types pour les composants AI

export interface CashFlowPrediction {
  id: string;
  month: string;
  actualValue?: number;
  predictedValue: number;
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
  complexity: 'low' | 'medium' | 'high';
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
  severity: 'low' | 'medium' | 'high';
  affectedData: string;
  detectedAt: string;
  confidence: number;
  possibleCauses?: string[];
  suggestedActions?: string[];
}