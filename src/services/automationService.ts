/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

// src/services/automationService.ts

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface Workflow {
  id: string;
  company_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: WorkflowCategory;
  is_active: boolean;
  is_template: boolean;
  trigger_type: TriggerType;
  trigger_config: TriggerConfig;
  actions: WorkflowAction[];
  created_by: string;
  created_at: string;
  updated_at: string;
  last_run_at: string | null;
  next_run_at: string | null;
}

export type WorkflowCategory =
  | 'accounting'
  | 'invoicing'
  | 'hr'
  | 'crm'
  | 'inventory'
  | 'notifications'
  | 'reports'
  | 'custom';

export type TriggerType = 'schedule' | 'event' | 'manual' | 'webhook' | 'condition';

export interface TriggerConfig {
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  time?: string;
  timezone?: string;
  day?: number;
  days?: number[];
  cron?: string;
  event_type?: string;
  conditions?: Record<string, any>;
  secret?: string;
  allowed_ips?: string[];
  field?: string;
  operator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'starts_with';
  value?: any;
  value_field?: string;
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  config: ActionConfig;
  order: number;
  condition?: ActionCondition;
}

export type ActionType =
  | 'send_email'
  | 'generate_report'
  | 'notification'
  | 'create_invoice'
  | 'update_record'
  | 'webhook_call'
  | 'delay'
  | 'condition_branch';

export interface ActionConfig {
  recipients?: string[];
  template?: string;
  subject?: string;
  body?: string;
  report_type?: string;
  format?: 'pdf' | 'xlsx' | 'csv';
  notification_type?: 'info' | 'success' | 'warning' | 'error';
  message?: string;
  source?: string;
  table?: string;
  field?: string;
  value?: any;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  payload?: any;
  duration?: number;
  unit?: 'seconds' | 'minutes' | 'hours' | 'days';
}

export interface ActionCondition {
  field: string;
  operator: string;
  value: any;
}

export interface WorkflowExecution {
  id: string;
  workflow_id?: string;
  template_id?: string;
  company_id: string;
  started_at: string;
  completed_at: string | null;
  duration_ms?: number | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_data?: any;
  result?: any;
  error_message?: string | null;
  triggered_by?: string;
  triggered_by_user?: string | null;
}

export interface WorkflowTemplate {
  id: string;
  template_name: string;
  description: string;
  category: string;
  workflow_definition: any;
  is_system: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export interface WorkflowStats {
  total: number;
  active: number;
  inactive: number;
  executions_total: number;
  executions_success: number;
  executions_failed: number;
  success_rate: number;
}

// =====================================================
// SERVICE
// =====================================================

class AutomationService {
  async getWorkflows(companyId: string): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_template', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) throw error;
    return data;
  }

  async createWorkflow(companyId: string, workflow: Partial<Workflow>): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        company_id: companyId,
        name: workflow.name,
        description: workflow.description || '',
        icon: workflow.icon || 'zap',
        color: workflow.color || 'blue',
        category: workflow.category || 'custom',
        trigger_type: workflow.trigger_type,
        trigger_config: workflow.trigger_config || {},
        actions: workflow.actions || [],
        is_active: false,
        is_template: false,
        next_run_at: this.calculateNextRun(workflow.trigger_type!, workflow.trigger_config || {})
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.trigger_type || updates.trigger_config) {
      const current = await this.getWorkflow(workflowId);
      if (current) {
        updateData.next_run_at = this.calculateNextRun(
          updates.trigger_type || current.trigger_type,
          updates.trigger_config || current.trigger_config
        );
      }
    }

    const { data, error } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', workflowId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId);

    if (error) throw error;
  }

  async toggleWorkflow(workflowId: string, isActive: boolean): Promise<Workflow> {
    return this.updateWorkflow(workflowId, { is_active: isActive });
  }

  async getTemplates(category?: WorkflowCategory): Promise<WorkflowTemplate[]> {
    let query = supabase
      .from('workflow_templates')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('usage_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createFromTemplate(
    companyId: string,
    templateId: string,
    customizations?: Partial<Workflow>
  ): Promise<Workflow> {
    const { data: template, error: templateError } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    await supabase
      .from('workflow_templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', templateId);

    const workflowDefinition = template.workflow_definition || {};
    const steps = workflowDefinition.steps || [];

    const actions: WorkflowAction[] = steps.map((step: any, index: number) => ({
      id: `action-${index + 1}`,
      type: this.mapStepTypeToActionType(step.type),
      config: step.config || {},
      order: index + 1
    }));

    return this.createWorkflow(companyId, {
      name: customizations?.name || template.template_name,
      description: customizations?.description || template.description,
      icon: 'zap',
      category: this.mapTemplateCategory(template.category),
      trigger_type: customizations?.trigger_type || 'manual',
      trigger_config: customizations?.trigger_config || {},
      actions: customizations?.actions || actions
    });
  }

  private mapStepTypeToActionType(stepType: string): ActionType {
    const mapping: Record<string, ActionType> = {
      'approval': 'notification',
      'action': 'notification',
      'notification': 'notification',
      'task': 'notification',
      'trigger': 'notification'
    };
    return mapping[stepType] || 'notification';
  }

  private mapTemplateCategory(category: string): WorkflowCategory {
    const mapping: Record<string, WorkflowCategory> = {
      'Finance': 'accounting',
      'RH': 'hr',
      'Sécurité': 'notifications'
    };
    return mapping[category] || 'custom';
  }

  async getExecutions(companyId: string, limit = 20): Promise<WorkflowExecution[]> {
    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('company_id', companyId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async executeWorkflow(workflowId: string, triggeredBy: string = 'manual'): Promise<WorkflowExecution> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) throw new Error('Workflow non trouvé');

    const { data: execution, error: execError } = await supabase
      .from('workflow_executions')
      .insert({
        company_id: workflow.company_id,
        template_id: null,
        status: 'running',
        trigger_data: { workflow_id: workflowId, triggered_by: triggeredBy },
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (execError) throw execError;

    this.runWorkflowActions(workflow, execution.id).catch(console.error);

    return execution;
  }

  private async runWorkflowActions(workflow: Workflow, executionId: string): Promise<void> {
    let hasError = false;
    let errorMessage = '';

    try {
      const sortedActions = [...workflow.actions].sort((a, b) => a.order - b.order);

      for (const action of sortedActions) {
        try {
          await this.executeAction(action, workflow);
        } catch (actionError: any) {
          hasError = true;
          errorMessage = actionError.message;
          break;
        }
      }

      await supabase
        .from('workflow_executions')
        .update({
          status: hasError ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          error_message: errorMessage || null,
          result: { success: !hasError }
        })
        .eq('id', executionId);

      await supabase
        .from('workflows')
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: this.calculateNextRun(workflow.trigger_type, workflow.trigger_config)
        })
        .eq('id', workflow.id);

    } catch (error: any) {
      await supabase
        .from('workflow_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', executionId);
    }
  }

  private async executeAction(action: WorkflowAction, workflow: Workflow): Promise<any> {
    switch (action.type) {
      case 'send_email':
      case 'generate_report':
      case 'notification':
      case 'create_invoice':
        console.log(`Action ${action.type}:`, action.config);
        return { success: true };

      case 'webhook_call':
        if (!action.config.url) throw new Error('URL webhook manquante');
        const response = await fetch(action.config.url, {
          method: action.config.method || 'POST',
          headers: { 'Content-Type': 'application/json', ...action.config.headers },
          body: action.config.payload ? JSON.stringify(action.config.payload) : undefined
        });
        return { status: response.status, ok: response.ok };

      case 'delay':
        const ms = (action.config.duration || 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, ms));
        return { delayed: true, duration: ms };

      default:
        throw new Error(`Type d'action non supporté: ${action.type}`);
    }
  }

  async getStats(companyId: string): Promise<WorkflowStats> {
    const { data: workflows } = await supabase
      .from('workflows')
      .select('is_active')
      .eq('company_id', companyId)
      .eq('is_template', false);

    const total = workflows?.length || 0;
    const active = workflows?.filter(w => w.is_active).length || 0;

    const { data: executions } = await supabase
      .from('workflow_executions')
      .select('status')
      .eq('company_id', companyId);

    const execTotal = executions?.length || 0;
    const execSuccess = executions?.filter(e => e.status === 'completed').length || 0;
    const execFailed = executions?.filter(e => e.status === 'failed').length || 0;

    return {
      total,
      active,
      inactive: total - active,
      executions_total: execTotal,
      executions_success: execSuccess,
      executions_failed: execFailed,
      success_rate: execTotal > 0 ? Math.round((execSuccess / execTotal) * 100 * 10) / 10 : 0
    };
  }

  private calculateNextRun(triggerType: TriggerType, config: TriggerConfig): string | null {
    if (triggerType !== 'schedule') return null;

    const now = new Date();
    const [hours, minutes] = (config.time || '09:00').split(':').map(Number);

    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (config.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'weekly':
        const targetDay = config.day ?? 1;
        let daysUntilTarget = targetDay - now.getDay();
        if (daysUntilTarget <= 0 || (daysUntilTarget === 0 && nextRun <= now)) {
          daysUntilTarget += 7;
        }
        nextRun.setDate(now.getDate() + daysUntilTarget);
        break;

      case 'monthly':
        const targetDayOfMonth = config.day ?? 1;
        nextRun.setDate(targetDayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }

    return nextRun.toISOString();
  }
}

export const automationService = new AutomationService();
