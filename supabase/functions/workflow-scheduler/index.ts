import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cron } from 'https://deno.land/x/deno_cron@v1.0.0/cron.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Workflow {
  id: string
  company_id: string
  name: string
  is_active: boolean
  trigger: {
    type: 'schedule' | 'event' | 'condition'
    config: {
      schedule?: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
        time: string
        dayOfWeek?: number
        dayOfMonth?: number
      }
    }
  }
  actions: any[]
  next_run?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'schedule'

    switch (action) {
      case 'schedule':
        return await handleScheduleWorkflows(supabaseClient)

      case 'execute':
        const workflowId = url.searchParams.get('workflowId')
        if (!workflowId) {
          return new Response(
            JSON.stringify({ error: 'workflowId requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return await handleExecuteWorkflow(supabaseClient, workflowId)

      case 'cleanup':
        return await handleCleanupExecutions(supabaseClient)

      default:
        return new Response(
          JSON.stringify({ error: 'Action non supportée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Erreur workflow scheduler:', error)
    return new Response(
      JSON.stringify({
        error: 'Erreur serveur interne',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Planifie et exécute les workflows dus
 */
async function handleScheduleWorkflows(supabaseClient: any) {
  try {
    const now = new Date().toISOString()

    // Récupérer tous les workflows actifs avec déclenchement programmé
    const { data: workflows, error } = await supabaseClient
      .from('workflows')
      .select('*')
      .eq('is_active', true)
      .eq('trigger->>type', 'schedule')
      .or(`next_run.is.null,next_run.lte.${now}`)

    if (error) {
      throw new Error(`Erreur récupération workflows: ${error.message}`)
    }

    const executedWorkflows = []
    const errors = []

    for (const workflow of workflows || []) {
      try {
        console.log(`🚀 Exécution workflow programmé: ${workflow.name}`)

        // Exécuter le workflow
        const executionResult = await executeWorkflow(supabaseClient, workflow)

        if (executionResult.success) {
          // Calculer la prochaine exécution
          const nextRun = calculateNextRun(workflow.trigger.config.schedule)

          // Mettre à jour la prochaine exécution
          await supabaseClient
            .from('workflows')
            .update({
              next_run: nextRun,
              last_run: now,
              run_count: (workflow.run_count || 0) + 1,
              success_count: executionResult.hasFailures
                ? workflow.success_count || 0
                : (workflow.success_count || 0) + 1,
              error_count: executionResult.hasFailures
                ? (workflow.error_count || 0) + 1
                : workflow.error_count || 0
            })
            .eq('id', workflow.id)

          executedWorkflows.push({
            id: workflow.id,
            name: workflow.name,
            status: executionResult.hasFailures ? 'partial_success' : 'success',
            nextRun
          })
        } else {
          errors.push({
            id: workflow.id,
            name: workflow.name,
            error: executionResult.error
          })
        }

      } catch (workflowError) {
        console.error(`Erreur exécution workflow ${workflow.id}:`, workflowError)
        errors.push({
          id: workflow.id,
          name: workflow.name,
          error: workflowError.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Traité ${(workflows || []).length} workflow(s)`,
        executed: executedWorkflows,
        errors: errors,
        timestamp: now
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erreur handleScheduleWorkflows:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Exécute un workflow spécifique
 */
async function handleExecuteWorkflow(supabaseClient: any, workflowId: string) {
  try {
    // Récupérer le workflow
    const { data: workflow, error } = await supabaseClient
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (error || !workflow) {
      return new Response(
        JSON.stringify({ error: 'Workflow non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!workflow.is_active) {
      return new Response(
        JSON.stringify({ error: 'Workflow inactif' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await executeWorkflow(supabaseClient, workflow)

    return new Response(
      JSON.stringify({
        success: result.success,
        workflowId: workflow.id,
        workflowName: workflow.name,
        executionId: result.executionId,
        hasFailures: result.hasFailures,
        error: result.error,
        timestamp: new Date().toISOString()
      }),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erreur handleExecuteWorkflow:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Nettoie les anciennes exécutions
 */
async function handleCleanupExecutions(supabaseClient: any) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30) // Garder 30 jours

    const { data, error, count } = await supabaseClient
      .from('workflow_executions')
      .delete()
      .lt('started_at', cutoffDate.toISOString())
      .select()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        message: `Supprimé ${count || 0} ancienne(s) exécution(s)`,
        deletedCount: count || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erreur handleCleanupExecutions:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Exécute un workflow complet
 */
async function executeWorkflow(supabaseClient: any, workflow: Workflow) {
  const startTime = Date.now()

  try {
    // Créer un enregistrement d'exécution
    const { data: execution, error: executionError } = await supabaseClient
      .from('workflow_executions')
      .insert({
        workflow_id: workflow.id,
        status: 'running',
        started_at: new Date().toISOString(),
        results: []
      })
      .select()
      .single()

    if (executionError) {
      throw new Error(`Erreur création exécution: ${executionError.message}`)
    }

    // Exécuter chaque action
    const results = []
    let hasFailures = false

    for (const action of workflow.actions || []) {
      try {
        const actionResult = await executeAction(supabaseClient, action, workflow.company_id)
        results.push({
          action_id: action.id,
          status: 'success',
          result: actionResult
        })
      } catch (actionError) {
        console.error(`Erreur action ${action.id}:`, actionError)
        hasFailures = true
        results.push({
          action_id: action.id,
          status: 'failed',
          error: actionError.message
        })
      }
    }

    // Mettre à jour l'exécution
    const duration = Date.now() - startTime
    const { error: updateError } = await supabaseClient
      .from('workflow_executions')
      .update({
        status: hasFailures ? 'failed' : 'completed',
        completed_at: new Date().toISOString(),
        results: results
      })
      .eq('id', execution.id)

    if (updateError) {
      console.warn('Erreur mise à jour exécution:', updateError)
    }

    // Créer une notification
    await createWorkflowNotification(
      supabaseClient,
      workflow.company_id,
      workflow.name,
      hasFailures ? 'failed' : 'success',
      {
        duration: `${Math.round(duration / 1000)}s`,
        results: results.map(r => r.result || r.error).join(', ')
      }
    )

    return {
      success: true,
      executionId: execution.id,
      hasFailures,
      results
    }

  } catch (error) {
    console.error('Erreur executeWorkflow:', error)

    // Créer une notification d'erreur
    await createWorkflowNotification(
      supabaseClient,
      workflow.company_id,
      workflow.name,
      'failed',
      { errorMessage: error.message }
    )

    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Exécute une action spécifique
 */
async function executeAction(supabaseClient: any, action: any, companyId: string): Promise<string> {
  switch (action.type) {
    case 'email':
      return await executeEmailAction(supabaseClient, action.config.email, companyId)

    case 'report_generation':
      return await executeReportAction(supabaseClient, action.config.report, companyId)

    case 'data_update':
      return await executeUpdateAction(supabaseClient, action.config.update)

    case 'notification':
      return await executeNotificationAction(supabaseClient, action.config.notification, companyId)

    default:
      throw new Error(`Type d'action non supporté: ${action.type}`)
  }
}

/**
 * Exécute une action email
 */
async function executeEmailAction(supabaseClient: any, config: any, companyId: string): Promise<string> {
  const { data, error } = await supabaseClient.functions.invoke('send-email', {
    body: {
      to: config.to,
      cc: config.cc,
      bcc: config.bcc,
      subject: config.subject,
      template: config.template,
      variables: config.variables,
      companyId: companyId
    }
  })

  if (error) {
    throw new Error(`Erreur envoi email: ${error.message}`)
  }

  return `Email envoyé à ${config.to.join(', ')}`
}

/**
 * Exécute une action de génération de rapport
 */
async function executeReportAction(supabaseClient: any, config: any, companyId: string): Promise<string> {
  // Cette fonction devrait appeler le service de génération de rapports
  // Pour l'instant, on simule
  console.log('📊 Génération rapport:', config.type, 'pour entreprise', companyId)

  return `Rapport ${config.type} généré (${config.format})`
}

/**
 * Exécute une action de mise à jour de données
 */
async function executeUpdateAction(supabaseClient: any, config: any): Promise<string> {
  const { data, error, count } = await supabaseClient
    .from(config.table)
    .update(config.data)
    .match(config.filters)
    .select()

  if (error) {
    throw new Error(`Erreur mise à jour: ${error.message}`)
  }

  return `Mis à jour ${count || 0} enregistrement(s) dans ${config.table}`
}

/**
 * Exécute une action de notification
 */
async function executeNotificationAction(supabaseClient: any, config: any, companyId: string): Promise<string> {
  const { error } = await supabaseClient
    .from('notifications')
    .insert({
      company_id: companyId,
      title: config.title,
      message: config.message,
      type: 'info',
      priority: config.priority || 'medium',
      category: 'automation',
      read: false
    })

  if (error) {
    throw new Error(`Erreur création notification: ${error.message}`)
  }

  return `Notification créée: ${config.title}`
}

/**
 * Crée une notification pour l'exécution d'un workflow
 */
async function createWorkflowNotification(
  supabaseClient: any,
  companyId: string,
  workflowName: string,
  status: 'success' | 'failed',
  details?: any
) {
  try {
    await supabaseClient
      .from('notifications')
      .insert({
        company_id: companyId,
        title: `Workflow: ${workflowName}`,
        message: status === 'success'
          ? `Workflow "${workflowName}" exécuté avec succès${details?.duration ? ` en ${details.duration}` : ''}`
          : `Workflow "${workflowName}" a échoué${details?.errorMessage ? `: ${details.errorMessage}` : ''}`,
        type: status === 'success' ? 'success' : 'error',
        priority: status === 'success' ? 'low' : 'high',
        category: 'automation',
        read: false,
        data: {
          workflow_name: workflowName,
          status,
          ...details
        }
      })
  } catch (error) {
    console.warn('Impossible de créer la notification workflow:', error)
  }
}

/**
 * Calcule la prochaine exécution d'un workflow
 */
function calculateNextRun(schedule: any): string {
  const now = new Date()
  const [hours, minutes] = schedule.time.split(':').map(Number)

  let nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)

  switch (schedule.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break

    case 'weekly':
      const targetDay = schedule.dayOfWeek || 1 // Lundi par défaut
      while (nextRun.getDay() !== targetDay || nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break

    case 'monthly':
      const targetDate = schedule.dayOfMonth || 1
      nextRun.setDate(targetDate)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
      break

    case 'yearly':
      nextRun.setFullYear(nextRun.getFullYear() + 1)
      break
  }

  return nextRun.toISOString()
}

/* Edge function pour planifier et exécuter les workflows.

   URLs d'accès :
   - GET /workflow-scheduler?action=schedule - Exécute les workflows dus
   - GET /workflow-scheduler?action=execute&workflowId=xxx - Exécute un workflow spécifique
   - GET /workflow-scheduler?action=cleanup - Nettoie les anciennes exécutions

   Pour configurer un cron job dans Supabase :
   1. Aller dans Database > Extensions
   2. Activer pg_cron
   3. Exécuter : SELECT cron.schedule('workflow-scheduler', '*/5 * * * *', 'SELECT net.http_get(url := ''https://your-project.supabase.co/functions/v1/workflow-scheduler?action=schedule'', headers := jsonb_build_object(''Authorization'', ''Bearer YOUR_SERVICE_ROLE_KEY''));');

   Cela exécutera le scheduler toutes les 5 minutes.
*/