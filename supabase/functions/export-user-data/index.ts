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
    const bearer = getBearerToken(req);
    const { data: userData, error: userErr } = await admin.auth.getUser(bearer);
    if (userErr || !userData?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(req) });
    }
    const userId = userData.user.id;

    const results: Record<string, unknown> = {};

    const { data: profile } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
    results.profile = profile ?? null;

    const { data: memberships } = await admin.from("user_companies").select("company_id, role, is_active, created_at").eq("user_id", userId);
    results.memberships = memberships ?? [];

    const { data: deletionRequests } = await admin.from("account_deletion_requests").select("status, requested_at, scheduled_deletion_date, processed_at, cancelled_at, reason").eq("user_id", userId);
    results.deletion_requests = deletionRequests ?? [];

    return Response.json({ user_id: userId, exported_at: new Date().toISOString(), data: results }, { headers: getCorsHeaders(req) });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: getCorsHeaders(req) });
  }
});

/**
 * CassKai - Edge Function: Export User Data (RGPD Article 15 & 20)
 *
 * Cette fonction gère l'export complet des données personnelles d'un utilisateur
 * conformément aux articles 15 (droit d'accès) et 20 (droit à la portabilité) du RGPD.
 *
 * Fonctionnalités:
 * - Authentification JWT obligatoire
 * - Rate limiting: 1 export par 24h
 * - Logs d'audit dans rgpd_logs
 * - Export JSON complet de toutes les données utilisateur
 * - Email de confirmation (optionnel)
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse2 = handleCorsPreflightRequest(req)
  if (preflightResponse2) return preflightResponse2

  try {
    // Créer le client Supabase avec les credentials service_role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. AUTHENTIFICATION - Vérifier le JWT token
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
      console.error('Erreur authentification:', authError)
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[RGPD Export] Demande d'export pour user: ${user.id}`)

    // 2. RATE LIMITING - 1 export par 24h
    const { data: lastExport, error: logError } = await supabase
      .from('rgpd_logs')
      .select('created_at, operation_status')
      .eq('user_id', user.id)
      .eq('action', 'EXPORT_DATA')
      .eq('operation_status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (logError) {
      console.error('Erreur vérification rate limit:', logError)
    }

    if (lastExport) {
      const hoursSinceLastExport = (Date.now() - new Date(lastExport.created_at).getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastExport < 24) {
        const nextAllowedAt = new Date(new Date(lastExport.created_at).getTime() + 24 * 60 * 60 * 1000)
        console.log(`[RGPD Export] Rate limit atteint pour user ${user.id}`)
        return new Response(
          JSON.stringify({
            error: 'Rate limit dépassé',
            message: 'Vous pouvez effectuer 1 export par 24 heures.',
            nextAllowedAt: nextAllowedAt.toISOString(),
            hoursRemaining: (24 - hoursSinceLastExport).toFixed(1)
          }),
          { status: 429, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
        )
      }
    }

    // 3. LOGGER LA DEMANDE (pending)
    const { data: logEntry, error: insertLogError } = await supabase
      .from('rgpd_logs')
      .insert({
        user_id: user.id,
        action: 'EXPORT_DATA',
        operation_status: 'pending',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        metadata: { format: 'json', requested_via: 'edge_function' }
      })
      .select()
      .single()

    if (insertLogError) {
      console.error('Erreur création log:', insertLogError)
    }

    const logId = logEntry?.id

    try {
      // 4. COLLECTER TOUTES LES DONNÉES UTILISATEUR
      console.log(`[RGPD Export] Collecte des données pour user ${user.id}`)

      const [
        profile,
        companies,
        userCompanies,
        preferences,
        invoices,
        quotes,
        payments,
        journalEntries,
        documents,
        consents,
        auditLogs
      ] = await Promise.all([
        // Profil utilisateur
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),

        // Entreprises où l'utilisateur est membre
        supabase.from('companies').select('*').eq('owner_id', user.id),

        // Associations user-company
        supabase.from('user_companies').select('*').eq('user_id', user.id),

        // Préférences (si table existe)
        supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),

        // Factures (anonymiser les données sensibles)
        supabase.from('invoices')
          .select('id, invoice_number, amount, currency, status, created_at, updated_at')
          .eq('user_id', user.id)
          .limit(1000),

        // Devis
        supabase.from('quotes')
          .select('id, quote_number, amount, currency, status, created_at')
          .eq('user_id', user.id)
          .limit(1000),

        // Paiements
        supabase.from('payments')
          .select('id, amount, currency, payment_date, status')
          .eq('user_id', user.id)
          .limit(1000),

        // Écritures comptables
        supabase.from('journal_entries')
          .select('id, date, debit, credit, description, created_at, reference_number as reference')
          .eq('created_by', user.id)
          .limit(1000),

        // Documents (métadonnées uniquement, pas le contenu)
        supabase.from('documents')
          .select('id, name, type, size, created_at')
          .eq('uploaded_by', user.id)
          .limit(1000),

        // Consentements RGPD
        supabase.from('rgpd_consents').select('*').eq('user_id', user.id),

        // Logs d'audit (10 derniers)
        supabase.from('audit_logs')
          .select('id, action, entity_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100)
      ])

      // 5. CONSTRUIRE LE FICHIER D'EXPORT
      const exportData = {
        export_metadata: {
          export_date: new Date().toISOString(),
          export_format: 'json',
          user_id: user.id,
          user_email: user.email,
          rgpd_article: 'Article 15 & 20 - Droit d\'accès et portabilité des données',
          generated_by: 'CassKai RGPD Compliance System',
          data_controller: {
            name: 'NOUTCHE CONSEIL SAS',
            siren: '909 672 685',
            address: 'France',
            contact: 'privacy@casskai.app'
          }
        },
        personal_data: {
          user_id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          profile: profile.data || null
        },
        companies: {
          owned_companies: companies.data || [],
          company_memberships: userCompanies.data || []
        },
        preferences: preferences.data || null,
        business_data: {
          invoices: {
            count: invoices.data?.length || 0,
            data: invoices.data || []
          },
          quotes: {
            count: quotes.data?.length || 0,
            data: quotes.data || []
          },
          payments: {
            count: payments.data?.length || 0,
            data: payments.data || []
          },
          journal_entries: {
            count: journalEntries.data?.length || 0,
            data: journalEntries.data || []
          },
          documents: {
            count: documents.data?.length || 0,
            metadata: documents.data || []
          }
        },
        rgpd_consents: consents.data || [],
        activity_log: {
          count: auditLogs.data?.length || 0,
          recent_actions: auditLogs.data || []
        }
      }

      const exportSize = JSON.stringify(exportData).length

      console.log(`[RGPD Export] Export généré: ${exportSize} bytes`)

      // 6. METTRE À JOUR LE LOG (success)
      if (logId) {
        await supabase
          .from('rgpd_logs')
          .update({
            operation_status: 'success',
            completed_at: new Date().toISOString(),
            metadata: {
              format: 'json',
              size_bytes: exportSize,
              items_exported: {
                companies: companies.data?.length || 0,
                invoices: invoices.data?.length || 0,
                quotes: quotes.data?.length || 0,
                payments: payments.data?.length || 0,
                journal_entries: journalEntries.data?.length || 0,
                documents: documents.data?.length || 0,
                consents: consents.data?.length || 0
              }
            }
          })
          .eq('id', logId)
      }

      // 7. RETOURNER LES DONNÉES
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Export de données réussi',
          data: exportData
        }),
        {
          status: 200,
          headers: {
            ...getCorsHeaders(req),
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="casskai-export-${user.id}-${Date.now()}.json"`
          }
        }
      )

    } catch (error) {
      console.error('[RGPD Export] Erreur lors de l\'export:', error)

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
          error: 'Erreur lors de l\'export des données',
          details: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('[RGPD Export] Erreur générale:', error)
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
