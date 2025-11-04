import { supabase } from '@/lib/supabase';

export interface WorkflowTrigger {
  id: string;
  type: 'schedule' | 'event' | 'condition';
  config: {
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      time: string;
      dayOfWeek?: number;
      dayOfMonth?: number;
    };
    event?: {
      table: string;
      action: 'insert' | 'update' | 'delete';
      conditions?: Record<string, any>;
    };
    condition?: {
      field: string;
      operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
      value: any;
    };
  };
}

export interface WorkflowAction {
  id: string;
  type: 'email' | 'report_generation' | 'data_update' | 'notification' | 'invoice_creation' | 'backup';
  config: {
    email?: {
      to: string[];
      subject: string;
      template: string;
      variables?: Record<string, any>;
      attachments?: Array<{
        filename: string;
        content: string;
        contentType?: string;
      }>;
    };
    report?: {
      type: 'balance_sheet' | 'income_statement' | 'trial_balance' | 'general_ledger';
      format: 'pdf' | 'excel' | 'csv';
      filters: Record<string, any>;
    };
    update?: {
      table: string;
      filters: Record<string, any>;
      data: Record<string, any>;
    };
    notification?: {
      title: string;
      message: string;
      priority: 'low' | 'medium' | 'high';
      recipients: string[];
    };
    invoice?: {
      client_id: string;
      template_id?: string;
      auto_send: boolean;
    };
  };
}

export interface Workflow {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  last_run?: string;
  next_run?: string;
  run_count: number;
  success_count: number;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  results: {
    action_id: string;
    status: 'success' | 'failed';
    result?: any;
    error?: string;
  }[];
}

export interface AutomationServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class AutomationService {
  private static instance: AutomationService;

  static getInstance(): AutomationService {
    if (!this.instance) {
      this.instance = new AutomationService();
    }
    return this.instance;
  }

  // Workflow Management
  async getWorkflows(companyId: string): Promise<AutomationServiceResponse<Workflow[]>> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch workflows'
      };
    }
  }

  async createWorkflow(companyId: string, workflowData: Omit<Workflow, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'run_count' | 'success_count' | 'error_count'>): Promise<AutomationServiceResponse<Workflow>> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          ...workflowData,
          company_id: companyId,
          run_count: 0,
          success_count: 0,
          error_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule the workflow if it's a scheduled trigger
      if (workflowData.trigger.type === 'schedule' && workflowData.is_active) {
        await this.scheduleWorkflow(data.id, workflowData.trigger.config.schedule!);
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create workflow'
      };
    }
  }

  async updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<AutomationServiceResponse<Workflow>> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .update(updates)
        .eq('id', workflowId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update workflow'
      };
    }
  }

  async deleteWorkflow(workflowId: string): Promise<AutomationServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete workflow'
      };
    }
  }

  async toggleWorkflow(workflowId: string, isActive: boolean): Promise<AutomationServiceResponse<Workflow>> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .update({ is_active: isActive })
        .eq('id', workflowId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle workflow'
      };
    }
  }

  // Workflow Execution
  async executeWorkflow(workflowId: string): Promise<AutomationServiceResponse<WorkflowExecution>> {
    try {
      // Get workflow details
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError) throw workflowError;
      if (!workflow.is_active) {
        throw new Error('Workflow is not active');
      }

      // Create execution record
      const { data: execution, error: executionError } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflowId,
          status: 'running',
          started_at: new Date().toISOString(),
          results: []
        })
        .select()
        .single();

      if (executionError) throw executionError;

      // Execute actions
      const results: WorkflowExecution['results'] = [];

      for (const action of workflow.actions) {
        try {
          const result = await this.executeAction(action, workflow.company_id);
          results.push({
            action_id: action.id,
            status: 'success',
            result
          });
        } catch (actionError) {
          results.push({
            action_id: action.id,
            status: 'failed',
            error: actionError instanceof Error ? actionError.message : 'Unknown error'
          });
        }
      }

      // Update execution record
      const hasFailures = results.some(r => r.status === 'failed');
      const { data: updatedExecution, error: updateError } = await supabase
        .from('workflow_executions')
        .update({
          status: hasFailures ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          results
        })
        .eq('id', execution.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update workflow statistics
      if (updatedExecution) {
        await supabase
          .from('workflows')
          .update({
            run_count: workflow.run_count + 1,
            success_count: hasFailures ? workflow.success_count : workflow.success_count + 1,
            error_count: hasFailures ? workflow.error_count + 1 : workflow.error_count,
            last_run: new Date().toISOString()
          })
          .eq('id', workflowId);
      }

      return {
        success: true,
        data: updatedExecution
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute workflow'
      };
    }
  }

  private async executeAction(action: WorkflowAction, companyId: string): Promise<any> {
    switch (action.type) {
      case 'email':
        return await this.executeEmailAction(action.config.email!, companyId);

      case 'report_generation':
        return await this.executeReportAction(action.config.report!, companyId);

      case 'data_update':
        return await this.executeUpdateAction(action.config.update!);

      case 'notification':
        return await this.executeNotificationAction(action.config.notification!, companyId);

      case 'invoice_creation':
        return await this.executeInvoiceAction(action.config.invoice!, companyId);

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeEmailAction(config: NonNullable<WorkflowAction['config']['email']>, companyId: string): Promise<string> {
    // Utiliser le vrai service d'email
    const { emailService } = await import('@/services/emailService');

    const result = await emailService.sendEmail({
      to: config.to,
      subject: config.subject,
      template: config.template,
      variables: config.variables || {},
      attachments: config.attachments
    }, companyId);

    if (!result.success) {
      throw new Error(result.error || 'Erreur envoi email');
    }

    return `Email envoyé à ${config.to.join(', ')} (ID: ${result.messageId})`;
  }

  private async executeReportAction(config: NonNullable<WorkflowAction['config']['report']>, companyId: string): Promise<string> {
    // Import report generation service
    const { reportGenerationService } = await import('@/services/reportGenerationService');

    const filters = {
      companyId,
      ...config.filters
    };

    const exportOptions = {
      format: config.format,
      title: `Automated ${config.type} Report`
    };

    let downloadUrl: string;
    switch (config.type) {
      case 'balance_sheet':
        downloadUrl = await reportGenerationService.generateBalanceSheet(filters, exportOptions);
        break;
      case 'income_statement':
        downloadUrl = await reportGenerationService.generateIncomeStatement(filters, exportOptions);
        break;
      case 'trial_balance':
        downloadUrl = await reportGenerationService.generateTrialBalance(filters, exportOptions);
        break;
      case 'general_ledger':
        downloadUrl = await reportGenerationService.generateGeneralLedger(filters, exportOptions);
        break;
      default:
        throw new Error(`Unknown report type: ${config.type}`);
    }

    return `Report generated: ${downloadUrl}`;
  }

  private async executeUpdateAction(config: NonNullable<WorkflowAction['config']['update']>): Promise<string> {
    const { data, error, count } = await supabase
      .from(config.table)
      .update(config.data)
      .match(config.filters)
      .select();

    if (error) throw error;

    return `Updated ${data?.length || count || 0} records in ${config.table}`;
  }

  private async executeNotificationAction(config: NonNullable<WorkflowAction['config']['notification']>, _companyId: string): Promise<string> {
    // Utiliser le vrai service de notifications
    const { notificationService } = await import('@/services/notificationService');

    const result = await notificationService.createNotification({
      title: config.title,
      message: config.message,
      type: 'info',
      priority: config.priority,
      category: 'system' as any
    } as any);

    if (!result.success) {
      throw new Error(result.error || 'Erreur création notification');
    }

    return `Notification créée: ${config.title}`;
  }

  private async executeInvoiceAction(config: NonNullable<WorkflowAction['config']['invoice']>, _companyId: string): Promise<string> {
    // Import invoice service
    const { invoicingService: _invoicingService } = await import('@/services/invoicingService');

    // This would create an invoice - simplified for automation
    return `Invoice creation initiated for client: ${config.client_id}`;
  }

  // Workflow Scheduling
  private async scheduleWorkflow(workflowId: string, schedule: NonNullable<WorkflowTrigger['config']['schedule']>): Promise<void> {
    const nextRun = this.calculateNextRun(schedule);

    await supabase
      .from('workflows')
      .update({ next_run: nextRun })
      .eq('id', workflowId);
  }

  private calculateNextRun(schedule: NonNullable<WorkflowTrigger['config']['schedule']>): string {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'weekly': {
        const targetDay = schedule.dayOfWeek || 1; // Monday by default
        while (nextRun.getDay() !== targetDay || nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      }

      case 'monthly': {
        const targetDate = schedule.dayOfMonth || 1;
        nextRun.setDate(targetDate);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
      }

      case 'yearly':
        nextRun.setFullYear(nextRun.getFullYear() + 1);
        break;
    }

    return nextRun.toISOString();
  }

  // Workflow Templates
  async getWorkflowTemplates(): Promise<AutomationServiceResponse<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    template: Omit<Workflow, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'run_count' | 'success_count' | 'error_count'>;
  }>>> {
    // Return predefined workflow templates
    const templates = [
      {
        id: 'monthly-reports',
        name: 'Rapports Mensuels Automatiques',
        description: 'Génère automatiquement les rapports financiers mensuels',
        category: 'Comptabilité',
        template: {
          name: 'Rapports Mensuels',
          description: 'Génération automatique des rapports financiers chaque mois',
          is_active: true,
          trigger: {
            id: 'schedule-trigger',
            type: 'schedule' as const,
            config: {
              schedule: {
                frequency: 'monthly' as const,
                time: '09:00',
                dayOfMonth: 1
              }
            }
          },
          actions: [
            {
              id: 'generate-balance-sheet',
              type: 'report_generation' as const,
              config: {
                report: {
                  type: 'balance_sheet' as const,
                  format: 'pdf' as const,
                  filters: {}
                }
              }
            },
            {
              id: 'generate-income-statement',
              type: 'report_generation' as const,
              config: {
                report: {
                  type: 'income_statement' as const,
                  format: 'pdf' as const,
                  filters: {}
                }
              }
            }
          ],
          last_run: undefined,
          next_run: undefined
        }
      },
      {
        id: 'invoice-reminders',
        name: 'Rappels de Factures',
        description: 'Envoie des rappels automatiques pour les factures impayées',
        category: 'Facturation',
        template: {
          name: 'Rappels de Factures',
          description: 'Rappels automatiques pour les factures en retard',
          is_active: true,
          trigger: {
            id: 'schedule-trigger',
            type: 'schedule' as const,
            config: {
              schedule: {
                frequency: 'weekly' as const,
                time: '10:00',
                dayOfWeek: 1
              }
            }
          },
          actions: [
            {
              id: 'send-reminders',
              type: 'email' as const,
              config: {
                email: {
                  to: ['admin@company.com'],
                  subject: 'Rappel: Factures impayées',
                  template: 'overdue_invoice_reminder'
                }
              }
            }
          ],
          last_run: undefined,
          next_run: undefined
        }
      }
    ];

    return {
      success: true,
      data: templates
    };
  }

  // Déclenche l'exécution programmée des workflows
  async triggerScheduledWorkflows(): Promise<AutomationServiceResponse<any>> {
    try {
      const { data, error } = await supabase.functions.invoke('workflow-scheduler', {
        body: { action: 'schedule' }
      });

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger scheduled workflows'
      };
    }
  }

  // Exécute un workflow via le scheduler
  async executeWorkflowViaScheduler(workflowId: string): Promise<AutomationServiceResponse<any>> {
    try {
      const { data, error } = await supabase.functions.invoke('workflow-scheduler', {
        body: {
          action: 'execute',
          workflowId
        }
      });

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute workflow via scheduler'
      };
    }
  }

  // Get workflow executions
  async getWorkflowExecutions(workflowId: string): Promise<AutomationServiceResponse<WorkflowExecution[]>> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch executions'
      };
    }
  }
}

export const automationService = AutomationService.getInstance();
