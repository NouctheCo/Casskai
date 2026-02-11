// Supabase Edge Function - Gmail OAuth Callback
// Deploy: supabase functions deploy gmail-oauth-callback
// Handles the OAuth2 callback from Google and stores tokens

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://casskai.app';

serve(async (req) => {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // URL de redirection en cas d'erreur
  const errorRedirect = (msg: string) => {
    return new Response(null, {
      status: 302,
      headers: { Location: `${APP_URL}/settings?gmail_error=${encodeURIComponent(msg)}` },
    });
  };

  if (error) {
    return errorRedirect(`Google error: ${error}`);
  }

  if (!code || !state) {
    return errorRedirect('Missing code or state');
  }

  try {
    // Décoder le state
    const stateData = JSON.parse(atob(state));
    const { companyId, userId, redirectUrl } = stateData;

    // Vérifier que le state n'est pas trop vieux (10 minutes max)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return errorRedirect('Session expired, please try again');
    }

    // Échanger le code contre les tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${SUPABASE_URL}/functions/v1/gmail-oauth-callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', errorText);
      return errorRedirect('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Récupérer l'email de l'utilisateur Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return errorRedirect('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;

    // Stocker les tokens dans Supabase (avec service role pour bypasser RLS)
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Upsert le token
    const { error: dbError } = await supabaseAdmin
      .from('email_oauth_tokens')
      .upsert({
        company_id: companyId,
        provider: 'gmail',
        email: email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'company_id,provider',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return errorRedirect('Failed to save tokens');
    }

    // Mettre à jour la configuration email pour utiliser gmail oauth
    await supabaseAdmin
      .from('email_configurations')
      .upsert({
        company_id: companyId,
        provider: 'gmail_oauth',
        from_email: email,
        from_name: userInfo.name || email.split('@')[0],
        is_active: true,
        is_verified: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'company_id,provider',
      });

    // Rediriger vers l'app avec succès
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${APP_URL}/settings?gmail_success=true&gmail_email=${encodeURIComponent(email)}`
      },
    });

  } catch (error) {
    console.error('Callback error:', error);
    return errorRedirect(error.message || 'Unknown error');
  }
});
