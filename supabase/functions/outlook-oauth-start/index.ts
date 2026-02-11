import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsH = getCorsHeaders(req);

  try {
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

    const state = btoa(JSON.stringify({
      companyId,
      userId: user.id,
      redirectUrl: redirectUrl || `${SUPABASE_URL.replace('.supabase.co', '')}/settings`,
      timestamp: Date.now(),
    }));

    const callbackUrl = `${SUPABASE_URL}/functions/v1/outlook-oauth-callback`;

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', MICROSOFT_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access');
    authUrl.searchParams.set('response_mode', 'query');
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
