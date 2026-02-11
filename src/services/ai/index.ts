/**
 * CassKai - AI Services Barrel Export
 * Copyright (c) 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 *
 * Canonical import point for all AI services.
 * Usage: import { openAIService, aiService, ... } from '@/services/ai';
 */

// Core OpenAI integration
export { openAIService, OpenAIService } from './OpenAIService';

// Chat / Assistant service
export { aiService } from './chatService';
export type { AIMessage, AIConversation, AIResponse, AIAction } from './chatService';

// Conversation persistence service
export { conversationService } from './conversationService';
export type { ChatMessage, Conversation } from './conversationService';

// Dashboard analysis (KPI insights)
export { aiDashboardAnalysisService, AIDashboardAnalysisService } from './dashboardService';
export type { AIAnalysisResult as DashboardAnalysisResult } from './dashboardService';

// Financial KPI analysis
export { aiAnalysisService } from './kpiAnalysisService';
export type { FinancialKPIs, AIAnalysisResult as KPIAnalysisResult } from './kpiAnalysisService';

// Report analysis (cash flow, receivables, ratios, budget, payables, inventory)
export {
  aiReportAnalysisService,
  type CashFlowData,
  type ReceivablesData,
  type FinancialRatiosData,
  type BudgetVarianceData,
  type PayablesData,
  type InventoryData
} from './reportService';
export type { AIAnalysisResult as ReportAnalysisResult } from './reportService';

// Document analysis (OCR/vision for invoices, receipts)
export { aiDocumentAnalysisService } from './documentService';

// Account categorization (GPT-4 based auto-categorization)
export { aiAccountCategorizationService } from './accountCategorizationService';
export type { AccountSuggestion, CategorizationStats } from './accountCategorizationService';

// TensorFlow.js predictive analytics
export { aiAnalyticsService } from './analyticsService';

// D3.js financial visualizations
export { aiVisualizationService } from './visualizationService';

// Rule-based transaction categorization
export { suggestCategory, autoCategorizeTransactions, applyCategorySuggestion } from './categorizationService';

// Statistical anomaly detection (Z-score based)
export { detectTransactionAnomalies, detectExpenseAnomalies, runAnomalyDetection, getActiveAnomalies } from './anomalyDetectionService';

// Cash flow prediction
export { generateCashFlowPrediction, checkCashFlowRiskAndCreateAlert } from './cashFlowPredictionService';

// Tax optimization suggestions
export { generateTaxOptimizations, createTaxOptimizationAlerts, applyTaxOptimization } from './taxOptimizationService';
