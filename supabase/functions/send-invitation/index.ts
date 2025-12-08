import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://casskai.app'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Client avec le token de l'utilisateur
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Client admin pour les opérations privilégiées
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer l'utilisateur
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, role, allowed_modules, company_id } = await req.json()

    // Vérifier que l'utilisateur est admin/owner de la company
    const { data: userCompany, error: ucError } = await supabaseAdmin
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .eq('is_active', true)
      .single()

    if (ucError || !userCompany || !['owner', 'admin'].includes(userCompany.role)) {
      return new Response(
        JSON.stringify({ error: 'Vous n\'avez pas les droits pour inviter des utilisateurs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier si l'email est déjà membre
    const { data: existingMember } = await supabaseAdmin
      .from('user_companies')
      .select('id')
      .eq('company_id', company_id)
      .eq('user_id', (
        await supabaseAdmin.from('profiles').select('id').eq('email', email).single()
      ).data?.id)
      .single()

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'Cet utilisateur est déjà membre de l\'entreprise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier si une invitation est déjà en attente
    const { data: existingInvite } = await supabaseAdmin
      .from('user_invitations')
      .select('id')
      .eq('company_id', company_id)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: 'Une invitation est déjà en attente pour cet email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer les infos de la company
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name')
      .eq('id', company_id)
      .single()

    // Créer l'invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('user_invitations')
      .insert({
        company_id,
        email: email.toLowerCase(),
        role: role || 'member',
        allowed_modules: allowed_modules || [],
        invited_by: user.id,
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Erreur création invitation:', inviteError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création de l\'invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Envoyer l'email d'invitation
    const inviteUrl = `${APP_URL}/invitation?token=${invitation.token}`
    
    if (RESEND_API_KEY) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'CassKai <noreply@casskai.app>',
          to: email,
          subject: `Invitation à rejoindre ${company?.name || 'CassKai'}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Vous êtes invité(e) !</h1>
                </div>
                <div class="content">
                  <p>Bonjour,</p>
                  <p>Vous avez été invité(e) à rejoindre <strong>${company?.name || 'une entreprise'}</strong> sur CassKai, la plateforme de gestion financière.</p>
                  <p>Votre rôle : <strong>${role || 'Membre'}</strong></p>
                  <p style="text-align: center;">
                    <a href="${inviteUrl}" class="button">Accepter l'invitation</a>
                  </p>
                  <p style="color: #6b7280; font-size: 14px;">Cette invitation expire dans 7 jours.</p>
                  <p style="color: #6b7280; font-size: 12px;">Si le bouton ne fonctionne pas, copiez ce lien : ${inviteUrl}</p>
                </div>
                <div class="footer">
                  <p>© 2025 CassKai - NOUTCHE CONSEIL</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }),
      })

      if (!emailResponse.ok) {
        console.error('Erreur envoi email:', await emailResponse.text())
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expires_at: invitation.expires_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})