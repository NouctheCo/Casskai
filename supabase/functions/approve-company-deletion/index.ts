/**
 * CassKai - Edge Function: Approve/Reject Company Deletion
 *
 * Gère l'approbation ou le rejet d'une demande de suppression d'entreprise
 * Seulement accessible aux propriétaires demandés pour approbation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApprovalRequest {
  deletion_request_id: string;
  approved: boolean;
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. AUTHENTIFICATION
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Company Approval] User ${user.id} approuve/rejette une demande`)

    // 2. PARSER LA REQUÊTE
    const requestData: ApprovalRequest = req.method === 'POST'
      ? await req.json()
      : {}

    if (!requestData.deletion_request_id) {
      return new Response(
        JSON.stringify({ error: 'deletion_request_id manquant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. VÉRIFIER QUE L'UTILISATEUR EST INVITÉ À APPROUVER
    const { data: approval, error: approvalCheckError } = await supabase
      .from('company_deletion_approvals')
      .select(`
        *,
        deletion_request:deletion_request_id (*)
      `)
      .eq('deletion_request_id', requestData.deletion_request_id)
      .eq('approver_id', user.id)
      .single()

    if (approvalCheckError || !approval) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Vous n\'êtes pas autorisé à approuver cette demande'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. VÉRIFIER QUE LA DEMANDE EST EN ATTENTE D'APPROBATION
    if (approval.deletion_request.status !== 'approval_pending') {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Cette demande n'est plus en attente d'approbation (statut: ${approval.deletion_request.status})`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. ENREGISTRER L'APPROBATION
    const { error: updateError } = await supabase
      .from('company_deletion_approvals')
      .update({
        approved: requestData.approved,
        approval_reason: requestData.reason || null,
        approved_at: new Date().toISOString()
      })
      .eq('id', approval.id)

    if (updateError) {
      console.error('Erreur mise à jour approbation:', updateError)
      throw updateError
    }

    // 6. VÉRIFIER SI TOUTES LES APPROBATIONS SONT REÇUES
    const { data: approvalStatus, error: statusError } = await supabase
      .rpc('get_company_deletion_approvals', {
        p_deletion_request_id: requestData.deletion_request_id
      })
      .single()

    if (statusError && statusError.code !== '42P01') {
      console.error('Erreur vérification approbations:', statusError)
    }

    let deletionRequest = approval.deletion_request

    if (approvalStatus && approvalStatus.all_approved) {
      // Mettre à jour le statut de la demande à 'approved'
      const { error: updateStatusError } = await supabase
        .from('company_deletion_requests')
        .update({ status: 'approved' })
        .eq('id', requestData.deletion_request_id)

      if (updateStatusError && updateStatusError.code !== '42P01') {
        console.error('Erreur mise à jour statut demande:', updateStatusError)
      }

      deletionRequest = {
        ...deletionRequest,
        status: 'approved'
      }
    } else if (requestData.approved === false) {
      // Un rejet annule la demande
      const { error: cancelError } = await supabase
        .from('company_deletion_requests')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: `Rejeté par ${user.id}`
        })
        .eq('id', requestData.deletion_request_id)

      if (cancelError && cancelError.code !== '42P01') {
        console.error('Erreur annulation demande:', cancelError)
      }

      deletionRequest = {
        ...deletionRequest,
        status: 'cancelled'
      }
    }

    // 7. RETOURNER LA CONFIRMATION
    return new Response(
      JSON.stringify({
        success: true,
        message: requestData.approved ? 'Approbation enregistrée' : 'Rejet enregistré',
        approval: {
          deletion_request_id: requestData.deletion_request_id,
          approved: requestData.approved,
          status: deletionRequest.status,
          approvals_summary: approvalStatus ? {
            total_required: approvalStatus.total_required,
            total_approved: approvalStatus.total_approved,
            all_approved: approvalStatus.all_approved
          } : null
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[Company Approval] Erreur générale:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
