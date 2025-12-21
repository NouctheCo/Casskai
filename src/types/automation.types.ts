/**
 * Types pour le module d'automatisation intelligent de CassKai
 */

// ============================================================================
// DÉCLENCHEURS (Triggers)
// ============================================================================

export type TriggerType =
  // Événements données
  | 'record_created'      // Enregistrement créé (facture, client, etc.)
  | 'record_updated'      // Enregistrement modifié
  | 'record_deleted'      // Enregistrement supprimé
  // Temporels
  | 'schedule'            // Planification (cron)
  | 'date_field'          // Champ date atteint (échéance, anniversaire)
  // Seuils
  | 'threshold_crossed'   // Seuil franchi (solde, stock)
  // Manuels
  | 'manual';             // Déclenchement manuel

export type EntityType =
  | 'invoice'
  | 'payment'
  | 'transaction'
  | 'client'
  | 'employee'
  | 'opportunity'
  | 'contract'
  | 'expense';

export interface TriggerConfig {
  type: TriggerType;

  // Pour record_created/updated/deleted
  entity_type?: EntityType;

  // Pour schedule
  cron?: string;              // "0 9 * * 1" = Tous les lundis à 9h
  timezone?: string;

  // Pour date_field
  date_field?: string;        // Nom du champ date
  days_before?: number;       // Déclencher X jours avant
  days_after?: number;        // Déclencher X jours après

  // Pour threshold_crossed
  metric?: string;            // 'balance', 'stock_level', etc.
  operator?: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold_value?: number;
}

// ============================================================================
// CONDITIONS (Filters)
// ============================================================================

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in';

export type LogicalOperator = 'AND' | 'OR';

export interface Condition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface ConditionGroup {
  logical_operator: LogicalOperator;
  conditions: Condition[];
  groups?: ConditionGroup[];  // Pour conditions imbriquées
}

// ============================================================================
// ACTIONS
// ============================================================================

export type ActionType =
  // Communications
  | 'send_email'          // Envoi email (templates)
  | 'send_notification'   // Notification in-app
  // Données
  | 'create_record'       // Créer enregistrement
  | 'update_record'       // Modifier enregistrement
  | 'create_task'         // Créer tâche/rappel
  // Documents
  | 'generate_document'   // Générer document (PDF)
  | 'generate_invoice'    // Générer facture
  | 'generate_report'     // Générer rapport
  // Financier
  | 'create_accounting_entry'  // Écriture comptable
  | 'create_payment'      // Enregistrer paiement
  | 'send_payment_reminder' // Relance paiement
  // Workflow
  | 'wait'                // Attendre (délai)
  | 'approval_request'    // Demande d'approbation
  | 'call_webhook';       // Appeler webhook externe

export interface BaseActionConfig {
  type: ActionType;
  name?: string;          // Nom descriptif de l'action
  continue_on_error?: boolean; // Continuer si cette action échoue
}

export interface SendEmailAction extends BaseActionConfig {
  type: 'send_email';
  to: string | string[];  // Email(s) destinataire(s) ou champ dynamique
  subject: string;
  body: string;           // Supporte variables {{field_name}}
  template_id?: string;
}

export interface SendNotificationAction extends BaseActionConfig {
  type: 'send_notification';
  user_ids: string[];
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface CreateRecordAction extends BaseActionConfig {
  type: 'create_record';
  entity_type: EntityType;
  fields: Record<string, any>;
}

export interface UpdateRecordAction extends BaseActionConfig {
  type: 'update_record';
  entity_type: EntityType;
  record_id: string;      // ID ou champ dynamique
  fields: Record<string, any>;
}

export interface CreateTaskAction extends BaseActionConfig {
  type: 'create_task';
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface WaitAction extends BaseActionConfig {
  type: 'wait';
  duration_minutes?: number;
  duration_hours?: number;
  duration_days?: number;
  until_date?: string;    // Attendre jusqu'à une date spécifique
}

export interface SendPaymentReminderAction extends BaseActionConfig {
  type: 'send_payment_reminder';
  invoice_id: string;
  tone: 'friendly' | 'firm' | 'legal';  // Ton de la relance
}

export interface CallWebhookAction extends BaseActionConfig {
  type: 'call_webhook';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

export type ActionConfig =
  | SendEmailAction
  | SendNotificationAction
  | CreateRecordAction
  | UpdateRecordAction
  | CreateTaskAction
  | WaitAction
  | SendPaymentReminderAction
  | CallWebhookAction;

// ============================================================================
// WORKFLOW
// ============================================================================

export interface Workflow {
  id: string;
  company_id: string;
  name: string;
  description?: string;

  // Configuration
  trigger: TriggerConfig;
  conditions?: ConditionGroup;
  actions: ActionConfig[];

  // Métadonnées
  is_active: boolean;
  is_template: boolean;
  template_id?: string;

  // Stats
  execution_count: number;
  last_executed_at?: string;
  avg_execution_time_ms?: number;
  success_rate?: number;

  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInsert extends Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'last_executed_at' | 'avg_execution_time_ms' | 'success_rate'> {
  id?: string;
}

// ============================================================================
// TEMPLATES
// ============================================================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'finance' | 'hr' | 'crm' | 'inventory' | 'general';
  popularity?: number;        // Score de popularité (0-100)
  time_saved_hours?: number;  // Temps économisé estimé par mois

  // Configuration du workflow
  trigger: TriggerConfig;
  conditions?: ConditionGroup;
  actions: ActionConfig[];

  // Métadonnées
  tags: string[];
  icon?: string;
  is_premium?: boolean;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXÉCUTION
// ============================================================================

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'partially_failed';

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_name: string;
  company_id: string;

  // Contexte
  trigger_data: any;          // Données qui ont déclenché

  // Résultat
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;

  // Détails des étapes
  steps_executed: ExecutionStep[];
  error_message?: string;
  error_step?: number;

  // Résumé
  actions_total: number;
  actions_success: number;
  actions_failed: number;
}

export interface ExecutionStep {
  step_number: number;
  action_type: ActionType;
  action_name?: string;
  status: 'success' | 'failed' | 'skipped';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
  result?: any;               // Résultat de l'action
}

// ============================================================================
// IA & ALERTES
// ============================================================================

export type InsightType =
  | 'anomaly'           // Anomalie détectée
  | 'prediction'        // Prédiction
  | 'optimization'      // Suggestion d'optimisation
  | 'recommendation';   // Recommandation

export type InsightCategory =
  | 'finance'
  | 'hr'
  | 'crm'
  | 'inventory'
  | 'general';

export type InsightSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type InsightStatus =
  | 'new'
  | 'seen'
  | 'actioned'
  | 'dismissed';

export interface AIInsight {
  id: string;
  company_id: string;

  type: InsightType;
  category: InsightCategory;
  severity: InsightSeverity;

  title: string;
  description: string;

  // Données
  related_entity_type?: EntityType;
  related_entity_id?: string;
  data: Record<string, any>;  // Données détaillées

  // Actions suggérées
  suggested_actions: SuggestedAction[];

  // Statut
  status: InsightStatus;
  actioned_at?: string;
  actioned_by?: string;

  // ML
  confidence_score: number;   // 0.0 à 1.0
  model_version?: string;

  created_at: string;
  expires_at?: string;
}

export interface SuggestedAction {
  label: string;
  action_type: 'workflow' | 'navigation' | 'api_call';
  workflow_id?: string;
  navigation_path?: string;
  api_endpoint?: string;
  api_payload?: any;
}

// ============================================================================
// ANOMALIES
// ============================================================================

export interface AnomalyDetection {
  id: string;
  company_id: string;

  // Contexte
  entity_type: EntityType;
  entity_id: string;
  field_name: string;

  // Valeurs
  current_value: number;
  expected_value: number;     // Moyenne historique
  std_deviation: number;      // Écart-type
  z_score: number;            // Score d'anomalie

  // Métadonnées
  detected_at: string;
  resolved_at?: string;
  is_false_positive?: boolean;

  // Contexte additionnel
  historical_data: HistoricalDataPoint[];
}

export interface HistoricalDataPoint {
  date: string;
  value: number;
}

// ============================================================================
// PRÉDICTIONS DE TRÉSORERIE
// ============================================================================

export interface CashFlowPrediction {
  company_id: string;
  generated_at: string;

  current_balance: number;
  currency: string;

  predictions: DailyPrediction[];

  // Résumé
  min_balance: number;
  min_balance_date: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';

  // Recommandations
  recommendations: string[];
}

export interface DailyPrediction {
  date: string;
  predicted_balance: number;
  expected_income: number;
  expected_expenses: number;
  confidence: number;         // 0.0 à 1.0

  // Détail
  income_sources: CashFlowItem[];
  expense_sources: CashFlowItem[];
}

export interface CashFlowItem {
  type: 'invoice' | 'payment' | 'recurring_expense' | 'other';
  entity_id?: string;
  description: string;
  amount: number;
  probability: number;        // 0.0 à 1.0 (certitude du paiement)
}

// ============================================================================
// CATÉGORISATION AUTOMATIQUE
// ============================================================================

export interface CategorySuggestion {
  transaction_id: string;

  suggested_category: string;
  confidence: number;         // 0.0 à 1.0

  alternatives: AlternativeCategory[];

  // Justification
  reasoning: string;
  similar_transactions: SimilarTransaction[];
}

export interface AlternativeCategory {
  category: string;
  confidence: number;
}

export interface SimilarTransaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  similarity_score: number;   // 0.0 à 1.0
}

// ============================================================================
// OPTIMISATIONS FISCALES
// ============================================================================

export interface TaxOptimization {
  id: string;
  company_id: string;

  type: 'provision' | 'amortissement' | 'deduction' | 'timing';
  title: string;
  description: string;

  // Impact
  amount: number;             // Montant de l'optimisation
  tax_impact: number;         // Impact sur l'IS/IR

  // Actions
  actions_required: string[];
  deadline?: string;

  // Statut
  status: 'suggested' | 'applied' | 'dismissed';
  applied_at?: string;

  created_at: string;
}

// ============================================================================
// STATISTIQUES
// ============================================================================

export interface AutomationStats {
  total_workflows: number;
  active_workflows: number;

  executions_this_month: number;
  executions_success_rate: number;

  time_saved_hours_this_month: number;
  time_saved_cost_estimate: number;  // En euros

  top_workflows: TopWorkflow[];

  recent_executions: WorkflowExecution[];
}

export interface TopWorkflow {
  workflow_id: string;
  workflow_name: string;
  execution_count: number;
  time_saved_hours: number;
  success_rate: number;
}
