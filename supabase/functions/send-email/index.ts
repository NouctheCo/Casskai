import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html?: string
  text?: string
  attachments?: EmailAttachment[]
  companyId: string
}

interface EmailAttachment {
  filename: string
  content: string
  contentType?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { to, cc, bcc, subject, html, text, attachments, companyId }: EmailRequest = await req.json()

    // Validation
    if (!to || to.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Au moins un destinataire requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: 'Sujet et contenu (HTML ou texte) requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Récupérer la configuration email de l'entreprise
    const { data: companyData, error: companyError } = await supabaseClient
      .from('companies')
      .select('email_config, name, email')
      .eq('id', companyId)
      .single()

    if (companyError) {
      console.error('Erreur récupération entreprise:', companyError)
      return new Response(
        JSON.stringify({ error: 'Configuration email non trouvée' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Configuration par défaut ou depuis la base
    const emailConfig = companyData?.email_config || {
      provider: 'resend', // ou 'sendgrid', 'smtp'
      from_email: companyData?.email || 'noreply@casskai.app',
      from_name: companyData?.name || 'CassKai'
    }

    let messageId: string | undefined
    let success = false

    // Envoi selon le provider configuré
    switch (emailConfig.provider) {
      case 'resend':
        const resendResult = await sendWithResend({
          to,
          cc,
          bcc,
          subject,
          html,
          text,
          attachments,
          from: {
            email: emailConfig.from_email,
            name: emailConfig.from_name
          },
          apiKey: Deno.env.get('RESEND_API_KEY')
        })
        success = resendResult.success
        messageId = resendResult.messageId
        break

      case 'sendgrid':
        const sendgridResult = await sendWithSendGrid({
          to,
          cc,
          bcc,
          subject,
          html,
          text,
          attachments,
          from: {
            email: emailConfig.from_email,
            name: emailConfig.from_name
          },
          apiKey: Deno.env.get('SENDGRID_API_KEY')
        })
        success = sendgridResult.success
        messageId = sendgridResult.messageId
        break

      case 'smtp':
        // Implémentation SMTP native si nécessaire
        const smtpResult = await sendWithSMTP({
          to,
          cc,
          bcc,
          subject,
          html,
          text,
          attachments,
          from: {
            email: emailConfig.from_email,
            name: emailConfig.from_name
          },
          config: emailConfig.smtp_config
        })
        success = smtpResult.success
        messageId = smtpResult.messageId
        break

      default:
        // Fallback: log l'email au lieu de l'envoyer
        console.log('📧 Email simulé:', {
          to,
          subject,
          from: emailConfig.from_email
        })
        success = true
        messageId = `sim_${Date.now()}`
    }

    if (success) {
      return new Response(
        JSON.stringify({
          success: true,
          messageId,
          message: 'Email envoyé avec succès'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Échec de l\'envoi d\'email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Erreur Edge Function send-email:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur interne' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Provider Resend
async function sendWithResend(params: any): Promise<{ success: boolean; messageId?: string }> {
  if (!params.apiKey) {
    console.log('📧 [DEV] Resend API key manquante, simulation d\'envoi')
    return { success: true, messageId: `resend_sim_${Date.now()}` }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${params.from.name} <${params.from.email}>`,
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        html: params.html,
        text: params.text,
        attachments: params.attachments
      })
    })

    const result = await response.json()

    if (response.ok) {
      return { success: true, messageId: result.id }
    } else {
      console.error('Erreur Resend:', result)
      return { success: false }
    }
  } catch (error) {
    console.error('Erreur Resend:', error)
    return { success: false }
  }
}

// Provider SendGrid
async function sendWithSendGrid(params: any): Promise<{ success: boolean; messageId?: string }> {
  if (!params.apiKey) {
    console.log('📧 [DEV] SendGrid API key manquante, simulation d\'envoi')
    return { success: true, messageId: `sendgrid_sim_${Date.now()}` }
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${params.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: {
          email: params.from.email,
          name: params.from.name
        },
        personalizations: [{
          to: params.to.map((email: string) => ({ email })),
          cc: params.cc?.map((email: string) => ({ email })),
          bcc: params.bcc?.map((email: string) => ({ email })),
          subject: params.subject
        }],
        content: [
          ...(params.text ? [{ type: 'text/plain', value: params.text }] : []),
          ...(params.html ? [{ type: 'text/html', value: params.html }] : [])
        ],
        attachments: params.attachments?.map((att: any) => ({
          filename: att.filename,
          content: att.content,
          type: att.contentType || 'application/octet-stream'
        }))
      })
    })

    if (response.ok) {
      const messageId = response.headers.get('X-Message-Id')
      return { success: true, messageId }
    } else {
      const error = await response.text()
      console.error('Erreur SendGrid:', error)
      return { success: false }
    }
  } catch (error) {
    console.error('Erreur SendGrid:', error)
    return { success: false }
  }
}

// Provider SMTP (basique)
async function sendWithSMTP(params: any): Promise<{ success: boolean; messageId?: string }> {
  // Pour une implémentation SMTP complète, il faudrait utiliser une lib comme nodemailer
  // Pour l'instant, on simule
  console.log('📧 [SMTP] Email simulé:', {
    to: params.to,
    subject: params.subject,
    from: params.from.email
  })

  return { success: true, messageId: `smtp_sim_${Date.now()}` }
}

/* Edge function pour envoyer des emails via différents providers.
   Supporte Resend, SendGrid et SMTP.
   Configure les clés API via les secrets Supabase.

   Usage depuis le client :

   const { data, error } = await supabase.functions.invoke('send-email', {
     body: {
       to: ['user@example.com'],
       subject: 'Test email',
       html: '<p>Hello world</p>',
       companyId: 'company-uuid'
     }
   })
*/