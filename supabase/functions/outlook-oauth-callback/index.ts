import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID')!;
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;
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

  const errorRedirect = (msg: string) => {
    return new Response(null, {
      status: 302,
      headers: { Location: `${APP_URL}/settings?outlook_error=${encodeURIComponent(msg)}` },
    });
  };

  if (error) {
    return errorRedirect(`Microsoft error: ${error}`);
  }

  if (!code || !state) {
    return errorRedirect('Missing code or state');
  }

  try {
    const stateData = JSON.parse(atob(state));
    const { companyId, userId, redirectUrl } = stateData;

    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      return errorRedirect('Session expired, please try again');
    }

    const callbackUrl = `${SUPABASE_URL}/functions/v1/outlook-oauth-callback`;

    // Échanger le code contre les tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
        scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', errorText);
      return errorRedirect('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Récupérer l'email de l'utilisateur Microsoft
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return errorRedirect('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();
    const email = userInfo.mail || userInfo.userPrincipalName;

    // Stocker les tokens
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: dbError } = await supabaseAdmin
      .from('email_oauth_tokens')
      .upsert({
        company_id: companyId,
        provider: 'outlook',
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

    // Mettre à jour la configuration email
    await supabaseAdmin
      .from('email_configurations')
      .upsert({
        company_id: companyId,
        provider: 'outlook_oauth',
        from_email: email,
        from_name: userInfo.displayName || email.split('@')[0],
        is_active: true,
        is_verified: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'company_id,provider',
      });

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${APP_URL}/settings?outlook_success=true&outlook_email=${encodeURIComponent(email)}`
      },
    });

  } catch (error) {
    console.error('Callback error:', error);
    return errorRedirect(error.message || 'Unknown error');
  }
});
