// Supabase Edge Function - Gmail OAuth Start
// Deploy: supabase functions deploy gmail-oauth-start
// Initiates the Gmail OAuth2 flow

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsH = getCorsHeaders(req);

  try {
    // Vérifier l'authentification
    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsH, 'Content-Type': 'application/json' },
      });
    }

    const { companyId, redirectUrl } = await req.json();

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'companyId required' }), {
        status: 400,
        headers: { ...corsH, 'Content-Type': 'application/json' },
      });
    }

    // Générer le state pour sécuriser le callback
    const state = btoa(JSON.stringify({
      companyId,
      userId: user.id,
      redirectUrl: redirectUrl || `${SUPABASE_URL.replace('.supabase.co', '')}/settings`,
      timestamp: Date.now(),
    }));

    // URL de redirection vers le callback Supabase
    const callbackUrl = `${SUPABASE_URL}/functions/v1/gmail-oauth-callback`;

    // Construire l'URL d'authentification Google
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/gmail.send email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
      status: 200,
      headers: { ...corsH, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsH, 'Content-Type': 'application/json' },
    });
  }
});
