// Supabase Edge Function - Gmail Send
// Deploy: supabase functions deploy gmail-send
// Sends emails via Gmail API using OAuth2 tokens

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';
import { encode as base64Encode } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { checkRateLimit, rateLimitResponse, getRateLimitPreset } from '../_shared/rate-limit.ts';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

/**
 * Rafraîchir le token si expiré
 */
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    console.error('Failed to refresh token:', await response.text());
    return null;
  }

  return await response.json();
}

/**
 * Construire l'email au format RFC 2822
 */
function buildEmail(to: string, from: string, subject: string, html: string, attachments?: any[]): string {
  const boundary = `boundary_${Date.now()}`;

  let email = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
  ];

  if (attachments && attachments.length > 0) {
    email.push(`Content-Type: multipart/mixed; boundary="${boundary}"`, '', `--${boundary}`);
  }

  email.push(
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(html)))
  );

  // Ajouter les pièces jointes
  if (attachments && attachments.length > 0) {
    for (const att of attachments) {
      email.push(
        '',
        `--${boundary}`,
        `Content-Type: ${att.type || 'application/octet-stream'}`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${att.filename}"`,
        '',
        att.content
      );
    }
    email.push('', `--${boundary}--`);
  }

  return email.join('\r\n');
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Rate limiting
  const rateLimit = checkRateLimit(req, getRateLimitPreset('gmail-send'));
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!, getCorsHeaders(req));
  }

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

    const { companyId, to, subject, html, attachments } = await req.json();

    if (!companyId || !to || !subject || !html) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsH, 'Content-Type': 'application/json' },
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
      .eq('provider', 'gmail')
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({
        error: 'Gmail not connected',
        code: 'GMAIL_NOT_CONNECTED'
      }), {
        status: 400,
        headers: { ...corsH, 'Content-Type': 'application/json' },
      });
    }

    let accessToken = tokenData.access_token;

    // Vérifier si le token est expiré
    if (new Date(tokenData.token_expiry) <= new Date()) {
      console.log('Token expired, refreshing...');
      const newTokens = await refreshAccessToken(tokenData.refresh_token);

      if (!newTokens) {
        // Le refresh token est invalide, l'utilisateur doit se reconnecter
        await supabaseAdmin
          .from('email_oauth_tokens')
          .update({ is_active: false })
          .eq('id', tokenData.id);

        return new Response(JSON.stringify({
          error: 'Gmail session expired, please reconnect',
          code: 'GMAIL_SESSION_EXPIRED'
        }), {
          status: 401,
          headers: { ...corsH, 'Content-Type': 'application/json' },
        });
      }

      accessToken = newTokens.access_token;

      // Mettre à jour le token en base
      await supabaseAdmin
        .from('email_oauth_tokens')
        .update({
          access_token: newTokens.access_token,
          token_expiry: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', tokenData.id);
    }

    // Construire l'email
    const fromEmail = tokenData.email;
    const rawEmail = buildEmail(to, fromEmail, subject, html, attachments);
    const encodedEmail = base64Encode(new TextEncoder().encode(rawEmail))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Envoyer via Gmail API
    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error('Gmail API error:', errorText);
      return new Response(JSON.stringify({
        error: 'Failed to send email',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsH, 'Content-Type': 'application/json' },
      });
    }

    const sendResult = await sendResponse.json();
    console.log('✅ Email sent via Gmail:', sendResult.id);

    return new Response(JSON.stringify({
      success: true,
      messageId: sendResult.id,
      from: fromEmail,
    }), {
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
