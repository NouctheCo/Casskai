import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse, getRateLimitPreset } from '../_shared/rate-limit.ts';

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const admin = createClient(supabaseUrl, serviceKey);
const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

function getBearerToken(req: Request) {
  const h = req.headers.get("Authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : h;
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Rate limiting
  const rateLimit = checkRateLimit(req, getRateLimitPreset('accept-invitation'));
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!, getCorsHeaders(req));
  }

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: getCorsHeaders(req) });

  try {
    const { token } = await req.json();
    if (!token) {
      return Response.json({ error: "Missing token" }, { status: 400, headers: getCorsHeaders(req) });
    }

    const bearer = getBearerToken(req);
    const { data: userData, error: userErr } = await admin.auth.getUser(bearer);
    if (userErr || !userData?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(req) });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email ?? "";

    const { data: invite, error: inviteErr } = await admin
      .from("company_invitations")
      .select("id, company_id, email, role, allowed_modules, invited_by, status, expires_at")
      .eq("token", token)
      .single();

    if (inviteErr || !invite) {
      return Response.json({ error: "Invitation not found" }, { status: 404, headers: getCorsHeaders(req) });
    }

    if (invite.status !== "pending") {
      return Response.json({ error: "Invitation is not pending" }, { status: 400, headers: getCorsHeaders(req) });
    }

    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return Response.json({ error: "Invitation expired" }, { status: 400, headers: getCorsHeaders(req) });
    }

    if (invite.email && invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      return Response.json({ error: "Email mismatch" }, { status: 403, headers: getCorsHeaders(req) });
    }

    // Get company subscription info
    const { data: subscription } = await admin
      .from('subscriptions')
      .select('*, profiles!inner(stripe_customer_id)')
      .eq('company_id', invite.company_id)
      .eq('status', 'active')
      .maybeSingle();

    // Add seat to Stripe subscription if exists
    if (subscription?.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        if (stripeSubscription.items.data.length > 0) {
          const subscriptionItem = stripeSubscription.items.data[0];
          const currentQuantity = subscriptionItem.quantity || 1;
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            items: [{ id: subscriptionItem.id, quantity: currentQuantity + 1 }],
            proration_behavior: 'create_prorations',
          });
          console.log(`Seat added: ${currentQuantity} -> ${currentQuantity + 1}`);
        }
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        // Continue even if Stripe fails
      }
    }

    // Add user to company
    const { error: upsertErr } = await admin
      .from("user_companies")
      .upsert({
        company_id: invite.company_id,
        user_id: userId,
        role: invite.role,
        allowed_modules: invite.allowed_modules,
        is_active: true,
        is_default: false,
        invited_by: invite.invited_by,
        invited_at: new Date().toISOString(),
        status: 'active'
      }, { onConflict: "company_id,user_id" });

    if (upsertErr) {
      return Response.json({ error: upsertErr.message }, { status: 500, headers: getCorsHeaders(req) });
    }

    // Update invitation status
    const { error: updateErr } = await admin
      .from("company_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: userId })
      .eq("id", invite.id);

    if (updateErr) {
      return Response.json({ error: updateErr.message }, { status: 500, headers: getCorsHeaders(req) });
    }

    // Update subscription seat count
    if (subscription) {
      await admin
        .from('subscriptions')
        .update({ seats_used: (subscription.seats_used || 1) + 1 })
        .eq('id', subscription.id);
    }

    return Response.json({
      ok: true,
      company_id: invite.company_id,
      role: invite.role
    }, { headers: getCorsHeaders(req) });

  } catch (err) {
    console.error('Error accepting invitation:', err);
    return Response.json({ error: String(err) }, { status: 500, headers: getCorsHeaders(req) });
  }
});