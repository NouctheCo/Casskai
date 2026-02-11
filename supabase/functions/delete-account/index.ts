import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceKey);

function getBearerToken(req: Request) {
  const h = req.headers.get("Authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : h;
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: getCorsHeaders(req) });
  try {
    const { reason } = await req.json().catch(() => ({ reason: null }));
    const bearer = getBearerToken(req);
    const { data: userData, error: userErr } = await admin.auth.getUser(bearer);
    if (userErr || !userData?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(req) });
    }
    const userId = userData.user.id;

    const { data: pending } = await admin
      .from("account_deletion_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending");
    if ((pending ?? []).length > 0) {
      return Response.json({ error: "Existing pending deletion request" }, { status: 400, headers: getCorsHeaders(req) });
    }

    const ip = req.headers.get("x-forwarded-for") ?? undefined;
    const ua = req.headers.get("user-agent") ?? undefined;
    const scheduled = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await admin
      .from("account_deletion_requests")
      .insert({
        user_id: userId,
        reason: reason ?? null,
        status: "pending",
        requested_at: new Date().toISOString(),
        scheduled_deletion_date: scheduled,
        ip_address: ip ?? null,
        user_agent: ua ?? null,
      })
      .select("id, scheduled_deletion_date")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500, headers: getCorsHeaders(req) });
    }
    return Response.json({ id: data.id, scheduled_deletion_date: data.scheduled_deletion_date }, { headers: getCorsHeaders(req) });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: getCorsHeaders(req) });
  }
});

/**
 * CassKai - Edge Function: Delete Account (RGPD Article 17)
 *
 * Cette fonction gère la suppression de compte utilisateur avec période de grâce de 30 jours
 * conformément à l'article 17 du RGPD (droit à l'effacement).
 *
 * Fonctionnalités:
 * - Authentification JWT obligatoire
 * - Période de grâce de 30 jours avant suppression définitive
 * - Analyse des entreprises possédées (transfert de propriété requis)
 * - Archivage légal des données comptables (10 ans)
 * - Anonymisation des données légalement obligatoires
 * - Logs d'audit dans rgpd_logs
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

interface DeleteAccountRequest {
  reason?: string;
  ownership_transfers?: Array<{
    company_id: string;
    new_owner_id: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse2 = handleCorsPreflightRequest(req)
  if (preflightResponse2) return preflightResponse2

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
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[RGPD Delete] Demande de suppression pour user: ${user.id}`)

    // 2. PARSER LA REQUÊTE
    const requestData: DeleteAccountRequest = req.method === 'POST'
      ? await req.json()
      : {}

    // 3. VÉRIFIER SI UNE DEMANDE EST DÉJÀ EN COURS
    const { data: existingRequest, error: checkError } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (checkError) {
      console.error('Erreur vérification demande existante:', checkError)
      // Continue même si la table n'existe pas encore
    }

    if (existingRequest) {
      const daysRemaining = Math.ceil(
        (new Date(existingRequest.scheduled_deletion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Une demande de suppression est déjà en cours',
          existing_request: {
            id: existingRequest.id,
            scheduled_deletion_date: existingRequest.scheduled_deletion_date,
            days_remaining: daysRemaining
          }
        }),
        { status: 409, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // 4. ANALYSER LES ENTREPRISES POSSÉDÉES
    const { data: ownedCompanies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('owner_id', user.id)

    if (companiesError) {
      console.error('Erreur récupération entreprises:', companiesError)
    }

    const hasOwnedCompanies = ownedCompanies && ownedCompanies.length > 0

    if (hasOwnedCompanies && (!requestData.ownership_transfers || requestData.ownership_transfers.length === 0)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Transfert de propriété requis',
          message: 'Vous possédez des entreprises. Vous devez transférer la propriété avant de supprimer votre compte.',
          owned_companies: ownedCompanies
        }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // 5. LOGGER LA DEMANDE (pending)
    const { data: logEntry, error: logError } = await supabase
      .from('rgpd_logs')
      .insert({
        user_id: user.id,
        action: 'DELETE_ACCOUNT',
        operation_status: 'pending',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        metadata: {
          reason: requestData.reason,
          has_ownership_transfers: !!requestData.ownership_transfers,
          grace_period_days: 30
        }
      })
      .select()
      .single()

    if (logError) {
      console.error('Erreur création log:', logError)
    }

    const logId = logEntry?.id

    try {
      // 6. CRÉER LA DEMANDE DE SUPPRESSION
      const scheduledDeletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // + 30 jours

      const { data: deletionRequest, error: deletionError } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: user.id,
          reason: requestData.reason,
          ownership_transfer_data: requestData.ownership_transfers ? {
            transfers: requestData.ownership_transfers
          } : null,
          status: 'pending',
          requested_at: new Date().toISOString(),
          scheduled_deletion_date: scheduledDeletionDate.toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent')
        })
        .select()
        .single()

      if (deletionError) {
        console.error('Erreur création demande de suppression:', deletionError)

        // Si la table n'existe pas, on continue avec un mock
        if (deletionError.code === '42P01') {
          console.warn('[RGPD Delete] Table account_deletion_requests n\'existe pas encore')

          // Mettre à jour le log
          if (logId) {
            await supabase
              .from('rgpd_logs')
              .update({
                operation_status: 'success',
                completed_at: new Date().toISOString(),
                metadata: {
                  reason: requestData.reason,
                  scheduled_deletion_date: scheduledDeletionDate.toISOString(),
                  warning: 'Table account_deletion_requests non créée - demande enregistrée dans logs uniquement'
                }
              })
              .eq('id', logId)
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Demande de suppression enregistrée (mode logs uniquement)',
              warning: 'La table account_deletion_requests n\'existe pas encore. Exécutez la migration SQL.',
              deletion_request: {
                user_id: user.id,
                scheduled_deletion_date: scheduledDeletionDate.toISOString(),
                days_until_deletion: 30
              }
            }),
            { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
          )
        }

        throw deletionError
      }

      console.log(`[RGPD Delete] Demande créée: ${deletionRequest.id}, suppression prévue: ${scheduledDeletionDate.toISOString()}`)

      // 7. EFFECTUER LES TRANSFERTS DE PROPRIÉTÉ (si fournis)
      if (requestData.ownership_transfers && requestData.ownership_transfers.length > 0) {
        for (const transfer of requestData.ownership_transfers) {
          await supabase
            .from('companies')
            .update({ owner_id: transfer.new_owner_id })
            .eq('id', transfer.company_id)
            .eq('owner_id', user.id) // Sécurité: vérifier que c'est bien le propriétaire
        }
        console.log(`[RGPD Delete] ${requestData.ownership_transfers.length} transfert(s) de propriété effectué(s)`)
      }

      // 8. METTRE À JOUR LE LOG (success)
      if (logId) {
        await supabase
          .from('rgpd_logs')
          .update({
            operation_status: 'success',
            completed_at: new Date().toISOString(),
            metadata: {
              deletion_request_id: deletionRequest.id,
              scheduled_deletion_date: scheduledDeletionDate.toISOString(),
              ownership_transfers_count: requestData.ownership_transfers?.length || 0
            }
          })
          .eq('id', logId)
      }

      // 9. RETOURNER LA CONFIRMATION
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Demande de suppression de compte enregistrée',
          deletion_request: {
            id: deletionRequest.id,
            scheduled_deletion_date: scheduledDeletionDate.toISOString(),
            days_until_deletion: 30,
            can_cancel: true
          },
          next_steps: [
            'Votre compte reste actif pendant 30 jours.',
            'Vous pouvez annuler cette demande à tout moment pendant cette période.',
            `Suppression définitive prévue le ${scheduledDeletionDate.toLocaleDateString('fr-FR')}.`,
            'Vous recevrez un email de confirmation 7 jours avant la suppression définitive.'
          ]
        }),
        {
          status: 200,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      console.error('[RGPD Delete] Erreur lors de la création de la demande:', error)

      // Logger l'erreur
      if (logId) {
        await supabase
          .from('rgpd_logs')
          .update({
            operation_status: 'failed',
            error_message: error instanceof Error ? error.message : String(error),
            completed_at: new Date().toISOString()
          })
          .eq('id', logId)
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erreur lors de la création de la demande de suppression',
          details: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('[RGPD Delete] Erreur générale:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    )
  }
})
