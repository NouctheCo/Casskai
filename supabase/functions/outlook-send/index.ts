import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse, getRateLimitPreset } from '../_shared/rate-limit.ts';

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID')!;
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

// Rafraîchir le token si expiré
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access',
    }),
  });

  if (!response.ok) {
    console.error('Failed to refresh token:', await response.text());
    return null;
  }

  return await response.json();
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Rate limiting
  const rateLimit = checkRateLimit(req, getRateLimitPreset('outlook-send'));
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!, getCorsHeaders(req));
  }

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
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    const { companyId, to, subject, html, attachments } = await req.json();

    if (!companyId || !to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    // Récupérer les tokens OAuth
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('email_oauth_tokens')
      .select('*')
      .eq('company_id', companyId)
      .eq('provider', 'outlook')
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({
        error: 'Outlook not connected',
        code: 'OUTLOOK_NOT_CONNECTED'
      }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    let accessToken = tokenData.access_token;

    // Vérifier si le token est expiré
    if (new Date(tokenData.token_expiry) <= new Date()) {
      console.log('Token expired, refreshing...');
      const newTokens = await refreshAccessToken(tokenData.refresh_token);

      if (!newTokens) {
        await supabaseAdmin
          .from('email_oauth_tokens')
          .update({ is_active: false })
          .eq('id', tokenData.id);

        return new Response(JSON.stringify({
          error: 'Outlook session expired, please reconnect',
          code: 'OUTLOOK_SESSION_EXPIRED'
        }), {
          status: 401,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        });
      }

      accessToken = newTokens.access_token;

      await supabaseAdmin
        .from('email_oauth_tokens')
        .update({
          access_token: newTokens.access_token,
          token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', tokenData.id);
    }

    // Construire l'email pour Microsoft Graph
    const emailMessage: any = {
      message: {
        subject: subject,
        body: {
          contentType: 'HTML',
          content: html,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
      saveToSentItems: true,
    };

    // Ajouter les pièces jointes si présentes
    if (attachments && attachments.length > 0) {
      emailMessage.message.attachments = attachments.map((att: any) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: att.filename,
        contentType: att.type || 'application/octet-stream',
        contentBytes: att.content,
      }));
    }

    // Envoyer via Microsoft Graph API
    const sendResponse = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailMessage),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error('Microsoft Graph API error:', errorText);
      return new Response(JSON.stringify({
        error: 'Failed to send email',
        details: errorText
      }), {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Email sent via Outlook');

    return new Response(JSON.stringify({
      success: true,
      from: tokenData.email,
    }), {
      status: 200,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});
