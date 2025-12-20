/**
 * CassKai - Edge Function: Delete Company (RGPD Article 17)
 *
 * Gère la suppression d'entreprise avec consensus des propriétaires
 * 
 * Fonctionnalités:
 * - Authentification JWT obligatoire
 * - Vérification que l'utilisateur est propriétaire
 * - Demande d'approbation à tous les autres propriétaires
 * - Export FEC avant suppression
 * - Période de grâce de 30 jours
 * - Archivage légal des données comptables
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteCompanyRequest {
  company_id: string;
  reason?: string;
  export_requested?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Créer le client Supabase
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

    console.log(`[Company Delete] Demande de suppression pour user: ${user.id}`)

    // 2. PARSER LA REQUÊTE
    const requestData: DeleteCompanyRequest = req.method === 'POST'
      ? await req.json()
      : {}

    if (!requestData.company_id) {
      return new Response(
        JSON.stringify({ error: 'company_id manquant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. VÉRIFIER QUE L'UTILISATEUR EST PROPRIÉTAIRE
    const { data: userCompany, error: ucError } = await supabase
      .from('user_companies')
      .select('*')
      .eq('company_id', requestData.company_id)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (ucError || !userCompany) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Vous n\'êtes pas propriétaire de cette entreprise'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. VÉRIFIER S'IL Y A DÉJÀ UNE DEMANDE EN COURS
    const { data: existingRequest, error: checkError } = await supabase
      .from('company_deletion_requests')
      .select('*')
      .eq('company_id', requestData.company_id)
      .in('status', ['pending', 'approval_pending', 'approved'])
      .maybeSingle()

    if (checkError && checkError.code !== '42P01') {
      console.error('Erreur vérification demande existante:', checkError)
    }

    if (existingRequest) {
      const daysRemaining = Math.ceil(
        (new Date(existingRequest.scheduled_deletion_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Une demande de suppression est déjà en cours',
          existing_request: {
            id: existingRequest.id,
            status: existingRequest.status,
            scheduled_deletion_at: existingRequest.scheduled_deletion_at,
            days_remaining: daysRemaining
          }
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. RÉCUPÉRER TOUS LES PROPRIÉTAIRES
    const { data: owners, error: ownersError } = await supabase
      .from('user_companies')
      .select(`
        user_id,
        auth_users:user_id (email)
      `)
      .eq('company_id', requestData.company_id)
      .eq('role', 'owner')
      .eq('is_active', true)

    if (ownersError) {
      console.error('Erreur récupération propriétaires:', ownersError)
      throw ownersError
    }

    const allOwners = owners || []
    const otherOwners = allOwners.filter((o: any) => o.user_id !== user.id)
    const requiredApprovals = otherOwners.length > 0 ? otherOwners.map((o: any) => ({
      user_id: o.user_id,
      email: o.auth_users?.email || 'email@inconnu.fr',
      role: 'owner'
    })) : []

    const scheduledDeletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // + 30 jours

    // 6. CRÉER LA DEMANDE DE SUPPRESSION
    const { data: deletionRequest, error: deletionError } = await supabase
      .from('company_deletion_requests')
      .insert({
        company_id: requestData.company_id,
        requested_by: user.id,
        reason: requestData.reason,
        export_requested: requestData.export_requested !== false, // true par défaut
        required_approvals: requiredApprovals.length > 0 ? requiredApprovals : [],
        status: requiredApprovals.length > 0 ? 'approval_pending' : 'approved', // approved immédiatement si seul owner
        scheduled_deletion_at: scheduledDeletionDate.toISOString(),
        requested_at: new Date().toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        metadata: {
          owner_count: allOwners.length,
          other_owners_count: otherOwners.length,
          export_requested: requestData.export_requested !== false
        }
      })
      .select()
      .single()

    if (deletionError) {
      console.error('Erreur création demande de suppression:', deletionError)

      if (deletionError.code === '42P01') {
        console.warn('[Company Delete] Table company_deletion_requests n\'existe pas encore')
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Table company_deletion_requests n\'existe pas. Migration requise.'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      throw deletionError
    }

    console.log(`[Company Delete] Demande créée: ${deletionRequest.id}`)

    // 7. CRÉER LES DEMANDES D'APPROBATION POUR LES AUTRES PROPRIÉTAIRES
    if (otherOwners.length > 0) {
      const approvals = otherOwners.map((owner: any) => ({
        deletion_request_id: deletionRequest.id,
        approver_id: owner.user_id,
        approved: false
      }))

      const { error: approvalsError } = await supabase
        .from('company_deletion_approvals')
        .insert(approvals)

      if (approvalsError && approvalsError.code !== '42P01') {
        console.error('Erreur création demandes d\'approbation:', approvalsError)
      }
    }

    // 8. RETOURNER LA CONFIRMATION
    return new Response(
      JSON.stringify({
        success: true,
        message: requiredApprovals.length > 0 
          ? 'Demande de suppression créée - En attente d\'approbation des propriétaires'
          : 'Demande de suppression créée - Seul propriétaire',
        deletion_request: {
          id: deletionRequest.id,
          company_id: requestData.company_id,
          status: deletionRequest.status,
          scheduled_deletion_at: scheduledDeletionDate.toISOString(),
          days_until_deletion: 30,
          requires_approval: requiredApprovals.length > 0,
          other_owners_count: otherOwners.length,
          can_cancel: true
        },
        next_steps: requiredApprovals.length > 0
          ? [
              'Demande en attente d\'approbation des propriétaires',
              `${otherOwners.length} propriétaire(s) doit/doivent approuver`,
              'Suppression définitive après approbation et 30 jours',
              'Vous pouvez annuler cette demande à tout moment pendant cette période'
            ]
          : [
              'Vous êtes le seul propriétaire - Demande approuvée',
              'Un export FEC sera généré avant la suppression',
              'Suppression définitive prévue le ' + scheduledDeletionDate.toLocaleDateString('fr-FR'),
              'Vous recevrez un email de confirmation 7 jours avant la suppression'
            ]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[Company Delete] Erreur générale:', error)
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
