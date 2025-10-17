import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompanyContext {
  id: string
  name: string
  country: string
  currency: string
  accounting_standard: string
  recent_transactions: any[]
  financial_summary: any
  alerts: any[]
}

interface AIRequest {
  query: string
  context_type?: 'dashboard' | 'accounting' | 'invoicing' | 'reports' | 'general'
  company_id: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request data
    const { query, context_type = 'general', company_id }: AIRequest = await req.json()

    // Initialize services
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
    })

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch company context
    const companyContext = await getCompanyContext(supabaseClient, company_id, user.id)

    if (!companyContext) {
      return new Response(JSON.stringify({ error: 'Company not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(companyContext, context_type)

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    })

    const response = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu traiter votre demande.'

    // Log the interaction
    await logAIInteraction(supabaseClient, {
      user_id: user.id,
      company_id,
      query,
      response,
      context_type,
      model_used: 'gpt-4-turbo-preview',
      tokens_used: completion.usage?.total_tokens || 0
    })

    return new Response(JSON.stringify({
      response,
      confidence: 0.9,
      sources: ['company_data', 'accounting_rules', 'tax_regulations'],
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('AI Assistant Error:', error)
    return new Response(JSON.stringify({
      error: 'Erreur lors du traitement de votre demande',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function getCompanyContext(supabase: any, companyId: string, userId: string): Promise<CompanyContext | null> {
  try {
    // Verify user access to company
    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .single()

    if (!userCompany) return null

    // Get company basic info
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, country, default_currency, accounting_standard')
      .eq('id', companyId)
      .single()

    if (!company) return null

    // Get recent transactions (last 30 days)
    const { data: transactions } = await supabase
      .from('journal_entries')
      .select(`
        id, entry_date, reference, description, total_amount,
        journal_entry_lines (
          account_code, debit_amount, credit_amount, description
        )
      `)
      .eq('company_id', companyId)
      .gte('entry_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('entry_date', { ascending: false })
      .limit(20)

    // Get financial summary
    const { data: accounts } = await supabase
      .from('accounts')
      .select('account_code, account_name, account_type, current_balance')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('account_code')

    // Get active alerts
    const { data: alerts } = await supabase
      .from('smart_alerts')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_read', false)
      .order('timestamp', { ascending: false })
      .limit(10)

    // Calculate financial summary
    const assets = accounts?.filter(a => a.account_type === 'asset').reduce((sum, a) => sum + (a.current_balance || 0), 0) || 0
    const liabilities = accounts?.filter(a => a.account_type === 'liability').reduce((sum, a) => sum + (a.current_balance || 0), 0) || 0
    const equity = accounts?.filter(a => a.account_type === 'equity').reduce((sum, a) => sum + (a.current_balance || 0), 0) || 0
    const revenue = accounts?.filter(a => a.account_type === 'revenue').reduce((sum, a) => sum + (a.current_balance || 0), 0) || 0
    const expenses = accounts?.filter(a => a.account_type === 'expense').reduce((sum, a) => sum + (a.current_balance || 0), 0) || 0

    return {
      id: company.id,
      name: company.name,
      country: company.country,
      currency: company.default_currency,
      accounting_standard: company.accounting_standard || 'PCG',
      recent_transactions: transactions || [],
      financial_summary: {
        assets,
        liabilities,
        equity,
        revenue,
        expenses,
        net_result: revenue - expenses,
        accounts_count: accounts?.length || 0
      },
      alerts: alerts || []
    }
  } catch (error) {
    console.error('Error fetching company context:', error)
    return null
  }
}

function buildSystemPrompt(context: CompanyContext, contextType: string): string {
  const basePrompt = `Tu es CassKai AI, l'assistant intelligent spécialisé en gestion d'entreprise et comptabilité.

CONTEXTE ENTREPRISE :
- Nom: ${context.name}
- Pays: ${context.country}
- Devise: ${context.currency}
- Standard comptable: ${context.accounting_standard}
- Résultat net: ${context.financial_summary.net_result?.toLocaleString()} ${context.currency}
- Total actifs: ${context.financial_summary.assets?.toLocaleString()} ${context.currency}
- Nombre d'alertes actives: ${context.alerts.length}

DONNÉES RÉCENTES :
- ${context.recent_transactions.length} transactions des 30 derniers jours
- ${context.financial_summary.accounts_count} comptes comptables actifs

RÈGLES DE RÉPONSE :
1. Réponds toujours en français professionnel
2. Utilise les données de l'entreprise pour contextualiser tes réponses
3. Fournis des conseils pratiques et actionnables
4. Mentionne les normes comptables du pays (${context.accounting_standard})
5. Indique les montants dans la devise de l'entreprise (${context.currency})
6. Sois précis et concis (max 300 mots)
7. Suggère des actions concrètes quand pertinent`

  const contextSpecificPrompts = {
    dashboard: `\n\nCONTEXTE SPÉCIFIQUE : Tu aides l'utilisateur à comprendre son tableau de bord, analyser les KPIs et interpréter les métriques financières.`,
    accounting: `\n\nCONTEXTE SPÉCIFIQUE : Tu aides avec la comptabilité, les écritures, le plan comptable et les rapports financiers selon les normes ${context.accounting_standard}.`,
    invoicing: `\n\nCONTEXTE SPÉCIFIQUE : Tu aides avec la facturation, les devis, les paiements clients et la gestion des créances.`,
    reports: `\n\nCONTEXTE SPÉCIFIQUE : Tu aides à interpréter les rapports financiers, analyser les tendances et fournir des insights métier.`,
    general: `\n\nCONTEXTE SPÉCIFIQUE : Tu peux aider sur tous les aspects de la gestion d'entreprise et donner des conseils stratégiques.`
  }

  return basePrompt + (contextSpecificPrompts[contextType as keyof typeof contextSpecificPrompts] || contextSpecificPrompts.general)
}

async function logAIInteraction(supabase: any, data: {
  user_id: string
  company_id: string
  query: string
  response: string
  context_type: string
  model_used: string
  tokens_used: number
}) {
  try {
    await supabase
      .from('ai_interactions')
      .insert({
        user_id: data.user_id,
        company_id: data.company_id,
        query: data.query,
        response: data.response,
        context_type: data.context_type,
        model_used: data.model_used,
        tokens_used: data.tokens_used,
        timestamp: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging AI interaction:', error)
  }
}