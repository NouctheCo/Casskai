// Supabase Edge Function - Send Email via SendGrid
// Deploy: supabase functions deploy send-email
// Set secrets: supabase secrets set SENDGRID_API_KEY=your-key SENDGRID_FROM_EMAIL=noreply@casskai.app

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// SendGrid types
interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
  }>;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    if (!payload.to || !payload.subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get SendGrid API key from environment
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
    if (!SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare email data
    const emailData = {
      personalizations: [
        {
          to: Array.isArray(payload.to)
            ? payload.to.map((email) => ({ email }))
            : [{ email: payload.to }],
        },
      ],
      from: {
        email: payload.from || Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@casskai.app',
        name: 'CassKai',
      },
      subject: payload.subject,
      content: [
        {
          type: 'text/html',
          value: payload.html,
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

    // Send email via SendGrid API
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error('SendGrid error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: errorText,
        }),
        {
          status: sendGridResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log email sent
    console.log(`✅ Email sent to ${payload.to}`);

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
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
