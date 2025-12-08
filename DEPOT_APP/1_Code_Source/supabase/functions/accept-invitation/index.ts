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