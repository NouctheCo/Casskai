/**
 * Adaptateur pour mapper les types TypeScript avec la structure BDD
 * Gère les différences de noms de colonnes entre le code et Supabase
 */

import type { Workflow, WorkflowExecution, AIInsight } from '@/types/automation.types';

/**
 * Types de la base de données (snake_case, noms différents)
 */
interface WorkflowDB {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category: string;
  is_active: boolean;
  is_template?: boolean;
  trigger_type: string;
  trigger_config: any; // JSONB
  actions: any; // JSONB
  conditions?: any; // JSONB
  execution_count?: number;
  success_count?: number;
  failure_count?: number;
  success_rate?: number;
  last_execution_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  next_run_at?: string;
}

interface WorkflowExecutionDB {
  id: string;
  company_id: string;
  workflow_id?: string;
  workflow_name?: string;
  template_id?: string;
  status: string;
  trigger_data?: any;
  execution_log?: any; // Ancien nom
  steps_executed?: any; // Nouveau nom
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
  error_step?: number;
  actions_total?: number;
  actions_success?: number;
  actions_failed?: number;
  created_at?: string;
}

interface AIInsightDB {
  id: string;
  company_id: string;
  user_id?: string;
  insight_type: string;
  category: string;
  priority?: string;
  severity?: string;
  title: string;
  description: string;
  detailed_analysis?: string;
  source_data?: any; // Ancien format
  data?: any; // Nouveau format
  related_transactions?: any;
  affected_accounts?: any;
  related_entity_type?: string;
  related_entity_id?: string;
  confidence_score: number;
  impact_score?: number;
  model_version?: string;
  suggested_actions?: any;
  implementation_difficulty?: string;
  estimated_time_to_implement?: string;
  status: string;
  implemented_at?: string;
  implemented_by?: string;
  actioned_at?: string;
  dismissed_at?: string;
  user_rating?: number;
  user_feedback?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convertit un workflow de la BDD vers le type TypeScript
 */
export function fromWorkflowDB(dbWorkflow: WorkflowDB): Workflow {
  return {
    id: dbWorkflow.id,
    company_id: dbWorkflow.company_id,
    name: dbWorkflow.name,
    description: dbWorkflow.description,
    trigger: dbWorkflow.trigger_config, // Mapping trigger_config -> trigger
    conditions: dbWorkflow.conditions,
    actions: dbWorkflow.actions,
    is_active: dbWorkflow.is_active,
    is_template: false, // Valeur par défaut
    execution_count: dbWorkflow.execution_count || 0,
    last_executed_at: dbWorkflow.last_execution_at,
    success_rate: dbWorkflow.success_rate,
    created_by: dbWorkflow.created_by ?? '',
    created_at: dbWorkflow.created_at,
    updated_at: dbWorkflow.updated_at,
  };
}

/**
 * Convertit un workflow TypeScript vers le format BDD
 */
export function toWorkflowDB(workflow: Partial<Workflow>): Partial<WorkflowDB> {
  const result: Partial<WorkflowDB> = {
    ...workflow,
    trigger_config: workflow.trigger, // Mapping trigger -> trigger_config
  };

  // Supprimer le champ 'trigger' qui n'existe pas en BDD
  delete (result as any).trigger;

  return result;
}

/**
 * Convertit une exécution de la BDD vers le type TypeScript
 */
export function fromWorkflowExecutionDB(dbExecution: WorkflowExecutionDB): WorkflowExecution {
  return {
    id: dbExecution.id,
    workflow_id: dbExecution.workflow_id || dbExecution.template_id || '',
    workflow_name: dbExecution.workflow_name || '',
    company_id: dbExecution.company_id,
    trigger_data: dbExecution.trigger_data,
    status: dbExecution.status as any,
    started_at: dbExecution.started_at,
    completed_at: dbExecution.completed_at,
    duration_ms: dbExecution.duration_ms,
    steps_executed: dbExecution.steps_executed || dbExecution.execution_log || [],
    error_message: dbExecution.error_message,
    error_step: dbExecution.error_step,
    actions_total: dbExecution.actions_total || 0,
    actions_success: dbExecution.actions_success || 0,
    actions_failed: dbExecution.actions_failed || 0,
  };
}

/**
 * Convertit une exécution TypeScript vers le format BDD
 */
export function toWorkflowExecutionDB(execution: Partial<WorkflowExecution>): Partial<WorkflowExecutionDB> {
  return {
    id: execution.id,
    workflow_id: execution.workflow_id,
    workflow_name: execution.workflow_name,
    company_id: execution.company_id,
    trigger_data: execution.trigger_data,
    status: execution.status,
    started_at: execution.started_at,
    completed_at: execution.completed_at,
    duration_ms: execution.duration_ms,
    steps_executed: execution.steps_executed,
    error_message: execution.error_message,
    error_step: execution.error_step,
    actions_total: execution.actions_total,
    actions_success: execution.actions_success,
    actions_failed: execution.actions_failed,
  };
}

/**
 * Convertit un insight de la BDD vers le type TypeScript
 */
export function fromAIInsightDB(dbInsight: AIInsightDB): AIInsight {
  return {
    id: dbInsight.id,
    company_id: dbInsight.company_id,
    type: dbInsight.insight_type as any, // Mapping insight_type -> type
    category: dbInsight.category as any,
    severity: (dbInsight.severity || dbInsight.priority || 'medium') as any,
    title: dbInsight.title,
    description: dbInsight.description,
    related_entity_type: dbInsight.related_entity_type as any,
    related_entity_id: dbInsight.related_entity_id,
    data: dbInsight.data || dbInsight.source_data || {},
    suggested_actions: dbInsight.suggested_actions || [],
    status: dbInsight.status as any,
    actioned_at: dbInsight.actioned_at || dbInsight.implemented_at,
    confidence_score: dbInsight.confidence_score || 0,
    model_version: dbInsight.model_version,
    created_at: dbInsight.created_at,
    expires_at: dbInsight.expires_at,
  };
}

/**
 * Convertit un insight TypeScript vers le format BDD
 */
export function toAIInsightDB(insight: Partial<AIInsight>): Partial<AIInsightDB> {
  return {
    id: insight.id,
    company_id: insight.company_id,
    insight_type: insight.type, // Mapping type -> insight_type
    category: insight.category,
    severity: insight.severity,
    title: insight.title,
    description: insight.description,
    related_entity_type: insight.related_entity_type,
    related_entity_id: insight.related_entity_id,
    data: insight.data,
    suggested_actions: insight.suggested_actions,
    status: insight.status,
    actioned_at: insight.actioned_at,
    confidence_score: insight.confidence_score,
    model_version: insight.model_version,
    expires_at: insight.expires_at,
  };
}
