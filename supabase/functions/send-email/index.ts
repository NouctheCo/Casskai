// Supabase Edge Function - Send Email via Multiple Providers
// Deploy: supabase functions deploy send-email
// Supports: SendGrid, SMTP, AWS SES, Mailgun

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

// Email types
interface EmailPayload {
  provider: 'smtp' | 'sendgrid' | 'aws_ses' | 'mailgun';
  config?: {
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
    api_key?: string;
    api_endpoint?: string;
    from_email?: string;
    from_name?: string;
    reply_to?: string;
  };
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
  }>;
}

// ========================================
// PROVIDER IMPLEMENTATIONS
// ========================================

/**
 * Send email via SMTP
 */
async function sendViaSMTP(payload: EmailPayload): Promise<boolean> {
  if (!payload.config) {
    throw new Error('SMTP configuration required');
  }

  const { host, port, secure, username, password, from_email, from_name } = payload.config;

  if (!host || !port || !username || !password || !from_email) {
    throw new Error('Missing SMTP configuration fields');
  }

  const client = new SmtpClient();

  try {
    await client.connectTLS({
      hostname: host,
      port: port,
      username: username,
      password: password,
    });

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

    for (const recipient of recipients) {
      await client.send({
        from: `${from_name || 'CassKai'} <${from_email}>`,
        to: recipient,
        subject: payload.subject,
        content: payload.html || payload.text || '',
        html: payload.html,
      });
    }

    await client.close();
    return true;
  } catch (error) {
    console.error('SMTP Error:', error);
    await client.close();
    throw error;
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(payload: EmailPayload): Promise<boolean> {
  const SENDGRID_API_KEY = payload.config?.api_key || Deno.env.get('SENDGRID_API_KEY');

  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const emailData = {
    personalizations: [
      {
        to: Array.isArray(payload.to)
          ? payload.to.map((email) => ({ email }))
          : [{ email: payload.to }],
      },
    ],
    from: {
      email: payload.config?.from_email || Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@casskai.app',
      name: payload.config?.from_name || 'CassKai',
    },
    subject: payload.subject,
    content: [
      {
        type: 'text/html',
        value: payload.html || '',
      },
      ...(payload.text
        ? [
            {
              type: 'text/plain',
              value: payload.text,
            },
          ]
        : []),
    ],
    ...(payload.attachments && {
      attachments: payload.attachments.map((att) => ({
        content: att.content,
        filename: att.filename,
        type: att.type || 'application/pdf',
        disposition: 'attachment',
      })),
    }),
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid error: ${errorText}`);
  }

  return true;
}

/**
 * Send email via AWS SES
 */
async function sendViaAWSSES(payload: EmailPayload): Promise<boolean> {
  // AWS SES implementation would require AWS SDK
  // For now, return error - this should be implemented based on your AWS setup
  throw new Error('AWS SES provider not yet implemented in Edge Function. Please use SMTP or SendGrid.');
}

/**
 * Send email via Mailgun
 */
async function sendViaMailgun(payload: EmailPayload): Promise<boolean> {
  if (!payload.config?.api_key || !payload.config?.api_endpoint) {
    throw new Error('Mailgun API key and endpoint required');
  }

  const formData = new FormData();
  formData.append('from', `${payload.config.from_name || 'CassKai'} <${payload.config.from_email}>`);
  formData.append('to', Array.isArray(payload.to) ? payload.to.join(',') : payload.to);
  formData.append('subject', payload.subject);
  if (payload.html) formData.append('html', payload.html);
  if (payload.text) formData.append('text', payload.text);
  if (payload.config.reply_to) formData.append('h:Reply-To', payload.config.reply_to);

  const response = await fetch(payload.config.api_endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${payload.config.api_key}`)}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailgun error: ${errorText}`);
  }

  return true;
}

// ========================================
// MAIN HANDLER
// ========================================

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get request body
    const payload: EmailPayload = await req.json();

    // Validate payload
    if (!payload.to || !payload.subject || !payload.provider) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: provider, to, subject' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Route to appropriate provider
    let success = false;
    let errorDetails = '';

    try {
      switch (payload.provider) {
        case 'smtp':
          success = await sendViaSMTP(payload);
          break;
        case 'sendgrid':
          success = await sendViaSendGrid(payload);
          break;
        case 'aws_ses':
          success = await sendViaAWSSES(payload);
          break;
        case 'mailgun':
          success = await sendViaMailgun(payload);
          break;
        default:
          throw new Error(`Unsupported provider: ${payload.provider}`);
      }
    } catch (error) {
      errorDetails = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error with provider ${payload.provider}:`, errorDetails);
    }

    if (!success) {
      return new Response(
        JSON.stringify({
          error: `Failed to send email via ${payload.provider}`,
          details: errorDetails,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log email sent
    console.log(`✅ Email sent via ${payload.provider} to ${payload.to}`);

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        provider: payload.provider,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
