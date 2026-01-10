/**
 * Service d'exécution des workflows
 * Gère l'exécution des triggers, conditions et actions
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { auditService } from './auditService';
import type {
  Workflow,
  WorkflowExecution,
  ExecutionStep,
  ActionConfig,
  SendEmailAction,
  SendNotificationAction,
  CreateRecordAction,
  UpdateRecordAction,
  CreateTaskAction,
  WaitAction,
  SendPaymentReminderAction,
  CallWebhookAction,
  ConditionGroup,
  Condition
} from '@/types/automation.types';
import { toWorkflowExecutionDB } from './automation/workflowAdapter';

// ============================================================================
// ÉVALUATION DES CONDITIONS
// ============================================================================

/**
 * Évalue une condition simple
 */
function evaluateCondition(condition: Condition, data: any): boolean {
  const fieldValue = data[condition.field];
  const { operator, value } = condition;

  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'not_equals':
      return fieldValue !== value;
    case 'contains':
      return String(fieldValue).includes(String(value));
    case 'not_contains':
      return !String(fieldValue).includes(String(value));
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    case 'greater_than_or_equal':
      return Number(fieldValue) >= Number(value);
    case 'less_than_or_equal':
      return Number(fieldValue) <= Number(value);
    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldValue === '';
    case 'is_not_empty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    case 'starts_with':
      return String(fieldValue).startsWith(String(value));
    case 'ends_with':
      return String(fieldValue).endsWith(String(value));
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'not_in':
      return Array.isArray(value) && !value.includes(fieldValue);
    default:
      return false;
  }
}

/**
 * Évalue un groupe de conditions
 */
function evaluateConditionGroup(group: ConditionGroup, data: any): boolean {
  const results = group.conditions.map(cond => evaluateCondition(cond, data));

  // Évaluer les sous-groupes si présents
  if (group.groups && group.groups.length > 0) {
    const subResults = group.groups.map(subGroup => evaluateConditionGroup(subGroup, data));
    results.push(...subResults);
  }

  if (group.logical_operator === 'AND') {
    return results.every(r => r === true);
  } else {
    return results.some(r => r === true);
  }
}

// ============================================================================
// EXÉCUTION DES ACTIONS
// ============================================================================

/**
 * Remplace les variables dynamiques dans une chaîne
 * Exemple: "Bonjour {{client_name}}" avec data {client_name: "John"} → "Bonjour John"
 */
function replaceVariables(template: string, data: any): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

/**
 * Exécute une action: Envoyer un email
 */
async function executeSendEmail(
  action: SendEmailAction,
  data: any,
  companyId: string
): Promise<any> {
  const to = Array.isArray(action.to) ? action.to : [action.to];
  const subject = replaceVariables(action.subject, data);
  const _body = replaceVariables(action.body, data);

  logger.info('WorkflowExecution: Sending email', {
    to,
    subject,
    companyId
  });

  // En mode production, envoyer via service email (Resend, SendGrid, etc.)
  // Pour l'instant, on log
  // TODO: Intégrer service d'envoi d'emails

  return {
    sent: true,
    recipients: to,
    subject,
    timestamp: new Date().toISOString()
  };
}

/**
 * Exécute une action: Envoyer une notification
 */
async function executeSendNotification(
  action: SendNotificationAction,
  data: any,
  companyId: string
): Promise<any> {
  const title = replaceVariables(action.title, data);
  const message = replaceVariables(action.message, data);

  logger.info('WorkflowExecution: Sending notification', {
    userIds: action.user_ids,
    title,
    companyId
  });

  // Créer des notifications dans la table notifications
  const notifications = action.user_ids.map(userId => ({
    user_id: userId,
    company_id: companyId,
    type: 'workflow',
    title,
    message,
    severity: action.severity,
    read: false,
    created_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('notifications')
    .insert(notifications);

  if (error) throw error;

  return {
    sent: true,
    notifications_created: notifications.length
  };
}

/**
 * Exécute une action: Créer un enregistrement
 */
async function executeCreateRecord(
  action: CreateRecordAction,
  data: any,
  companyId: string
): Promise<any> {
  const tableName = getTableName(action.entity_type);
  const fields: Record<string, unknown> = { ...action.fields, company_id: companyId };

  // Remplacer les variables dans les champs
  Object.keys(fields).forEach(key => {
    if (typeof fields[key] === 'string') {
      fields[key] = replaceVariables(fields[key] as string, data);
    }
  });

  logger.info('WorkflowExecution: Creating record', {
    entityType: action.entity_type,
    tableName,
    companyId
  });

  const { data: created, error } = await supabase
    .from(tableName)
    .insert(fields)
    .select()
    .single();

  if (error) throw error;

  return created;
}

/**
 * Exécute une action: Mettre à jour un enregistrement
 */
async function executeUpdateRecord(
  action: UpdateRecordAction,
  data: any,
  companyId: string
): Promise<any> {
  const tableName = getTableName(action.entity_type);
  const recordId = replaceVariables(action.record_id, data);
  const fields = { ...action.fields };

  // Remplacer les variables
  Object.keys(fields).forEach(key => {
    if (typeof fields[key] === 'string') {
      fields[key] = replaceVariables(fields[key], data);
    }
  });

  logger.info('WorkflowExecution: Updating record', {
    entityType: action.entity_type,
    recordId,
    companyId
  });

  const { data: updated, error } = await supabase
    .from(tableName)
    .update(fields)
    .eq('id', recordId)
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) throw error;

  return updated;
}

/**
 * Exécute une action: Créer une tâche
 */
async function executeCreateTask(
  action: CreateTaskAction,
  data: any,
  companyId: string
): Promise<any> {
  const title = replaceVariables(action.title, data);
  const description = action.description ? replaceVariables(action.description, data) : undefined;
  const assignedTo = action.assigned_to ? replaceVariables(action.assigned_to, data) : undefined;

  const task = {
    company_id: companyId,
    title,
    description,
    assigned_to: assignedTo,
    due_date: action.due_date,
    priority: action.priority,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  logger.info('WorkflowExecution: Creating task', { title, companyId });

  const { data: created, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;

  return created;
}

/**
 * Exécute une action: Attendre
 */
async function executeWait(action: WaitAction): Promise<any> {
  let waitMs = 0;

  if (action.duration_minutes) {
    waitMs = action.duration_minutes * 60 * 1000;
  } else if (action.duration_hours) {
    waitMs = action.duration_hours * 60 * 60 * 1000;
  } else if (action.duration_days) {
    waitMs = action.duration_days * 24 * 60 * 60 * 1000;
  }

  logger.info('WorkflowExecution: Waiting', { ms: waitMs });

  if (action.until_date) {
    const targetDate = new Date(replaceVariables(action.until_date, {}));
    waitMs = targetDate.getTime() - Date.now();
  }

  // Note: Dans une vraie implémentation, on utiliserait une queue (Bull, etc.)
  // Pour l'instant, on ne fait qu'attendre
  if (waitMs > 0 && waitMs < 60000) { // Max 1 minute d'attente synchrone
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }

  return { waited_ms: waitMs };
}

/**
 * Exécute une action: Envoyer une relance de paiement
 */
async function executeSendPaymentReminder(
  action: SendPaymentReminderAction,
  data: any,
  companyId: string
): Promise<any> {
  const invoiceId = replaceVariables(action.invoice_id, data);

  // Récupérer la facture
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      third_parties (
        name,
        email
      )
    `)
    .eq('id', invoiceId)
    .eq('company_id', companyId)
    .single();

  if (error) throw error;

  // Générer le message selon le ton
  const tones = {
    friendly: {
      subject: `Rappel amical - Facture ${invoice.invoice_number}`,
      body: `Bonjour,\n\nNous vous rappelons aimablement que la facture ${invoice.invoice_number} d'un montant de ${invoice.total_amount}€ est en attente de paiement.\n\nCordialement`
    },
    firm: {
      subject: `Relance - Facture ${invoice.invoice_number} en retard`,
      body: `Madame, Monsieur,\n\nNous constatons que la facture ${invoice.invoice_number} d'un montant de ${invoice.total_amount}€ n'a pas été réglée malgré notre précédent rappel.\n\nNous vous demandons de régulariser cette situation rapidement.\n\nCordialement`
    },
    legal: {
      subject: `MISE EN DEMEURE - Facture ${invoice.invoice_number}`,
      body: `Madame, Monsieur,\n\nPar la présente, nous vous mettons formellement en demeure de régler la facture ${invoice.invoice_number} d'un montant de ${invoice.total_amount}€.\n\nÀ défaut de règlement sous 8 jours, nous nous réserverons le droit d'engager une procédure de recouvrement.\n\nCordialement`
    }
  };

  const _template = tones[action.tone];
  const clientEmail = (invoice.third_parties as any)?.email;

  logger.info('WorkflowExecution: Sending payment reminder', {
    invoiceId,
    tone: action.tone,
    clientEmail
  });

  // Envoyer l'email (via le service d'email)
  // TODO: Intégrer service d'envoi d'emails

  // Enregistrer la relance
  const { error: logError } = await supabase
    .from('payment_reminders')
    .insert({
      invoice_id: invoiceId,
      company_id: companyId,
      tone: action.tone,
      sent_at: new Date().toISOString()
    });

  if (logError) logger.error('Error logging payment reminder', logError);

  return {
    sent: true,
    invoice_number: invoice.invoice_number,
    client_email: clientEmail,
    tone: action.tone
  };
}

/**
 * Exécute une action: Appeler un webhook
 */
async function executeCallWebhook(
  action: CallWebhookAction,
  data: any
): Promise<any> {
  const url = replaceVariables(action.url, data);

  logger.info('WorkflowExecution: Calling webhook', { url, method: action.method });

  const response = await fetch(url, {
    method: action.method,
    headers: {
      'Content-Type': 'application/json',
      ...action.headers
    },
    body: action.body ? JSON.stringify(action.body) : undefined
  });

  const responseData = await response.json();

  return {
    status: response.status,
    ok: response.ok,
    data: responseData
  };
}

/**
 * Helper: Obtenir le nom de table à partir du type d'entité
 */
function getTableName(entityType: string): string {
  const mapping: Record<string, string> = {
    invoice: 'invoices',
    payment: 'payments',
    transaction: 'transactions',
    client: 'third_parties',
    employee: 'employees',
    opportunity: 'opportunities',
    contract: 'contracts',
    expense: 'expenses'
  };
  return mapping[entityType] || entityType;
}

// ============================================================================
// EXÉCUTION DU WORKFLOW
// ============================================================================

/**
 * Exécute une action avec gestion d'erreur
 */
async function executeAction(
  action: ActionConfig,
  data: any,
  companyId: string
): Promise<ExecutionStep> {
  const startTime = Date.now();

  try {
    let result: any;

    switch (action.type) {
      case 'send_email':
        result = await executeSendEmail(action as SendEmailAction, data, companyId);
        break;
      case 'send_notification':
        result = await executeSendNotification(action as SendNotificationAction, data, companyId);
        break;
      case 'create_record':
        result = await executeCreateRecord(action as CreateRecordAction, data, companyId);
        break;
      case 'update_record':
        result = await executeUpdateRecord(action as UpdateRecordAction, data, companyId);
        break;
      case 'create_task':
        result = await executeCreateTask(action as CreateTaskAction, data, companyId);
        break;
      case 'wait':
        result = await executeWait(action as WaitAction);
        break;
      case 'send_payment_reminder':
        result = await executeSendPaymentReminder(action as SendPaymentReminderAction, data, companyId);
        break;
      case 'call_webhook':
        result = await executeCallWebhook(action as CallWebhookAction, data);
        break;
      default:
        throw new Error(`Unknown action type: ${(action as any).type}`);
    }

    return {
      step_number: 0, // Sera assigné par l'appelant
      action_type: action.type,
      action_name: action.name,
      status: 'success',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      result
    };

  } catch (error) {
    return {
      step_number: 0,
      action_type: action.type,
      action_name: action.name,
      status: 'failed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      error_message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Exécute un workflow complet
 */
export async function executeWorkflow(
  workflow: Workflow,
  triggerData: any
): Promise<WorkflowExecution> {
  const startTime = Date.now();
  const executionId = `exec-${workflow.id}-${Date.now()}`;

  logger.info('WorkflowExecution: Starting workflow', {
    workflowId: workflow.id,
    workflowName: workflow.name,
    executionId
  });

  try {
    // 1. Évaluer les conditions
    if (workflow.conditions) {
      const conditionsMet = evaluateConditionGroup(workflow.conditions, triggerData);
      if (!conditionsMet) {
        logger.info('WorkflowExecution: Conditions not met, skipping', {
          workflowId: workflow.id
        });

        return {
          id: executionId,
          workflow_id: workflow.id,
          workflow_name: workflow.name,
          company_id: workflow.company_id,
          trigger_data: triggerData,
          status: 'cancelled',
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          steps_executed: [],
          actions_total: 0,
          actions_success: 0,
          actions_failed: 0
        };
      }
    }

    // 2. Exécuter les actions séquentiellement
    const steps: ExecutionStep[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < workflow.actions.length; i++) {
      const action = workflow.actions[i];
      const step = await executeAction(action, triggerData, workflow.company_id);
      step.step_number = i + 1;
      steps.push(step);

      if (step.status === 'success') {
        successCount++;
      } else {
        failedCount++;
        // Si l'action échoue et continue_on_error = false, arrêter
        if (!action.continue_on_error) {
          logger.warn('WorkflowExecution: Action failed, stopping', {
            workflowId: workflow.id,
            actionType: action.type,
            stepNumber: i + 1
          });
          break;
        }
      }
    }

    const finalStatus = failedCount === 0 ? 'success' : (successCount > 0 ? 'partially_failed' : 'failed');

    const execution: WorkflowExecution = {
      id: executionId,
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      company_id: workflow.company_id,
      trigger_data: triggerData,
      status: finalStatus,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      steps_executed: steps,
      actions_total: workflow.actions.length,
      actions_success: successCount,
      actions_failed: failedCount
    };

    // 3. Enregistrer l'exécution
    const executionDB = toWorkflowExecutionDB(execution);
    await supabase.from('workflow_executions').insert(executionDB);

    // 4. Mettre à jour les stats du workflow
    await updateWorkflowStats(workflow.id, finalStatus === 'success');

    // 5. Audit log
    await auditService.log({
      company_id: workflow.company_id,
      event_type: 'update' as any,
      table_name: 'workflows',
      record_id: workflow.id,
      metadata: {
        user_id: 'system',
        workflow_executed: true,
        execution_id: executionId,
        status: finalStatus,
        actions_executed: successCount
      }
    });

    logger.info('WorkflowExecution: Workflow completed', {
      workflowId: workflow.id,
      executionId,
      status: finalStatus,
      duration: execution.duration_ms
    });

    return execution;

  } catch (error) {
    logger.error('WorkflowExecution: Workflow execution failed', error, {
      workflowId: workflow.id
    });

    const execution: WorkflowExecution = {
      id: executionId,
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      company_id: workflow.company_id,
      trigger_data: triggerData,
      status: 'failed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      steps_executed: [],
      error_message: error instanceof Error ? error.message : String(error),
      actions_total: workflow.actions.length,
      actions_success: 0,
      actions_failed: workflow.actions.length
    };

    const executionDB = toWorkflowExecutionDB(execution);
    await supabase.from('workflow_executions').insert(executionDB);

    return execution;
  }
}

/**
 * Met à jour les statistiques d'un workflow
 */
async function updateWorkflowStats(workflowId: string, success: boolean): Promise<void> {
  try {
    // Récupérer les stats actuelles
    const { data: workflow } = await supabase
      .from('workflows')
      .select('execution_count, success_rate')
      .eq('id', workflowId)
      .single();

    if (!workflow) return;

    const newCount = (workflow.execution_count || 0) + 1;
    const oldSuccessRate = workflow.success_rate || 100;
    const newSuccessRate = ((oldSuccessRate * (newCount - 1)) + (success ? 100 : 0)) / newCount;

    await supabase
      .from('workflows')
      .update({
        execution_count: newCount,
        success_rate: newSuccessRate,
        last_executed_at: new Date().toISOString()
      })
      .eq('id', workflowId);

  } catch (error) {
    logger.error('WorkflowExecution: Error updating stats', error, { workflowId });
  }
}
