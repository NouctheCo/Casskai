import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(supabaseUrl, serviceKey);

function getBearerToken(req: Request) {
  const h = req.headers.get("Authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : h;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });
  try {
    const { token } = await req.json();
    if (!token) {
      return Response.json({ error: "Missing token" }, { status: 400, headers: cors });
    }

    const bearer = getBearerToken(req);
    const { data: userData, error: userErr } = await admin.auth.getUser(bearer);
    if (userErr || !userData?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email ?? "";

    const { data: invite, error: inviteErr } = await admin
      .from("company_invitations")
      .select("id, company_id, email, role, status, expires_at")
      .eq("token", token)
      .single();

    if (inviteErr || !invite) {
      return Response.json({ error: "Invitation not found" }, { status: 404, headers: cors });
    }

    if (invite.status !== "pending") {
      return Response.json({ error: "Invitation is not pending" }, { status: 400, headers: cors });
    }

    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return Response.json({ error: "Invitation expired" }, { status: 400, headers: cors });
    }

    if (invite.email && invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      return Response.json({ error: "Email mismatch" }, { status: 403, headers: cors });
    }

    const { error: upsertErr } = await admin
      .from("user_companies")
      .upsert({ company_id: invite.company_id, user_id: userId, role: invite.role, is_active: true }, { onConflict: "company_id,user_id" });
    if (upsertErr) {
      return Response.json({ error: upsertErr.message }, { status: 500, headers: cors });
    }

    const { error: updateErr } = await admin
      .from("company_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: userId })
      .eq("id", invite.id);
    if (updateErr) {
      return Response.json({ error: updateErr.message }, { status: 500, headers: cors });
    }

    return Response.json({ ok: true }, { headers: cors });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Client avec le token de l'utilisateur
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { token } = await req.json()

    // Récupérer l'invitation
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('user_invitations')
      .select('*, companies(name)')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (invError || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Invitation invalide ou expirée' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier si l'invitation n'a pas expiré
    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseAdmin
        .from('user_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return new Response(
        JSON.stringify({ error: 'Cette invitation a expiré' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier que l'email correspond
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return new Response(
        JSON.stringify({ 
          error: `Cette invitation est destinée à ${invitation.email}. Connectez-vous avec ce compte.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer l'abonnement de la company
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*, profiles!inner(stripe_customer_id)')
      .eq('company_id', invitation.company_id)
      .eq('status', 'active')
      .single()

    if (!subscription) {
      return new Response(
        JSON.stringify({ error: 'Aucun abonnement actif pour cette entreprise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ajouter un siège à l'abonnement Stripe (pro-rata)
    if (subscription.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        )

        if (stripeSubscription.items.data.length > 0) {
          const subscriptionItem = stripeSubscription.items.data[0]
          const currentQuantity = subscriptionItem.quantity || 1

          // Mettre à jour la quantité (ajouter 1 siège)
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            items: [{
              id: subscriptionItem.id,
              quantity: currentQuantity + 1,
            }],
            proration_behavior: 'create_prorations', // Facturation pro-rata immédiate
          })

          console.log(`Siège ajouté: ${currentQuantity} -> ${currentQuantity + 1}`)
        }
      } catch (stripeError) {
        console.error('Erreur Stripe:', stripeError)
        // Continuer même si Stripe échoue (on peut rattraper manuellement)
      }
    }

    // Ajouter l'utilisateur à la company
    const { error: ucError } = await supabaseAdmin
      .from('user_companies')
      .insert({
        user_id: user.id,
        company_id: invitation.company_id,
        role: invitation.role,
        allowed_modules: invitation.allowed_modules,
        is_active: true,
        is_default: false,
        invited_by: invitation.invited_by,
        invited_at: invitation.created_at,
        status: 'active'
      })

    if (ucError) {
      console.error('Erreur ajout user_companies:', ucError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'ajout à l\'entreprise' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mettre à jour l'invitation
    await supabaseAdmin
      .from('user_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: user.id
      })
      .eq('id', invitation.id)

    // Mettre à jour le compteur de sièges
    await supabaseAdmin
      .from('subscriptions')
      .update({
        seats_used: (subscription.seats_used || 1) + 1
      })
      .eq('id', subscription.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        company_id: invitation.company_id,
        company_name: invitation.companies?.name,
        role: invitation.role
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})