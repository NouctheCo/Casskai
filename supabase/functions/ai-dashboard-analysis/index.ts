/**
 * CassKai - Edge Function: AI Dashboard Analysis
 * Analyse IA du tableau de bord
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

interface RealKPIData {
  financial: {
    revenue: number
    expenses: number
    netIncome: number
    profitMargin: number
  }
  liquidity: {
    currentRatio: number
    quickRatio: number
    cashRatio: number
  }
  efficiency: {
    dso: number
    dpo: number
    inventoryTurnover: number
  }
  profitability: {
    grossMargin: number
    operatingMargin: number
    roa: number
    roe: number
  }
  leverage: {
    debtToEquity: number
    debtToAssets: number
    interestCoverage: number
  }
}

interface AIAnalysisResult {
  executive_summary: string
  key_insights: string[]
  strategic_recommendations: string[]
  risk_factors: string[]
  opportunities: string[]
  action_items: {
    priority: 'high' | 'medium' | 'low'
    action: string
    expected_impact: string
  }[]
}

interface DashboardAnalysisRequest {
  kpiData: RealKPIData
  companyName: string
  company_id: string
  industryType?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { kpiData, companyName, company_id, industryType }: DashboardAnalysisRequest = await req.json()

    // Initialize services
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
    })

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify user access to company
    const { data: userCompany } = await supabaseClient
      .from('user_companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .eq('is_active', true)
      .single()

    if (!userCompany) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build analysis prompt
    const prompt = buildAnalysisPrompt(kpiData, companyName, industryType)

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en contrôle de gestion et analyse financière.
Tu analyses les données financières d'entreprises françaises et fournis des recommandations stratégiques précises et actionnables.
Tu dois répondre en français et structurer ta réponse au format JSON selon le schéma fourni.

IMPORTANT: Réponds UNIQUEMENT au format JSON avec la structure suivante:
{
  "executive_summary": "résumé stratégique",
  "key_insights": ["insight 1", "insight 2", ...],
  "strategic_recommendations": ["recommandation 1", "recommandation 2", ...],
  "risk_factors": ["risque 1", "risque 2", ...],
  "opportunities": ["opportunité 1", "opportunité 2", ...],
  "action_items": [
    {"priority": "high|medium|low", "action": "action à faire", "expected_impact": "impact attendu"},
    ...
  ]
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Empty response from OpenAI')
    }

    const analysis: AIAnalysisResult = JSON.parse(response)

    // Log the analysis
    await supabaseClient
      .from('ai_interactions')
      .insert({
        user_id: user.id,
        company_id,
        query: `Dashboard Analysis: ${companyName}`,
        response: JSON.stringify(analysis),
        context_type: 'dashboard_analysis',
        model_used: 'gpt-4o',
        tokens_used: completion.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      })

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Dashboard Analysis Error:', error)
    return new Response(JSON.stringify({
      error: 'Erreur lors de l\'analyse du tableau de bord',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function buildAnalysisPrompt(kpiData: RealKPIData, companyName: string, industryType?: string): string {
  return `Analyse le tableau de bord financier de ${companyName}${industryType ? ` (secteur: ${industryType})` : ''}.

DONNÉES FINANCIÈRES:
- Chiffre d'affaires: ${kpiData.financial.revenue.toLocaleString()} €
- Charges: ${kpiData.financial.expenses.toLocaleString()} €
- Résultat net: ${kpiData.financial.netIncome.toLocaleString()} €
- Marge nette: ${(kpiData.financial.profitMargin * 100).toFixed(2)}%

LIQUIDITÉ:
- Ratio de liquidité générale: ${kpiData.liquidity.currentRatio.toFixed(2)}
- Ratio de liquidité réduite: ${kpiData.liquidity.quickRatio.toFixed(2)}
- Ratio de liquidité immédiate: ${kpiData.liquidity.cashRatio.toFixed(2)}

EFFICACITÉ OPÉRATIONNELLE:
- DSO (délai recouvrement clients): ${kpiData.efficiency.dso} jours
- DPO (délai paiement fournisseurs): ${kpiData.efficiency.dpo} jours
- Rotation des stocks: ${kpiData.efficiency.inventoryTurnover.toFixed(2)} fois/an

RENTABILITÉ:
- Marge brute: ${(kpiData.profitability.grossMargin * 100).toFixed(2)}%
- Marge opérationnelle: ${(kpiData.profitability.operatingMargin * 100).toFixed(2)}%
- ROA (rendement des actifs): ${(kpiData.profitability.roa * 100).toFixed(2)}%
- ROE (rendement des capitaux propres): ${(kpiData.profitability.roe * 100).toFixed(2)}%

STRUCTURE FINANCIÈRE:
- Ratio d'endettement (D/E): ${kpiData.leverage.debtToEquity.toFixed(2)}
- Dette/Actifs: ${(kpiData.leverage.debtToAssets * 100).toFixed(2)}%
- Couverture des intérêts: ${kpiData.leverage.interestCoverage.toFixed(2)}x

Fournis une analyse stratégique complète avec:
1. Un résumé exécutif de la situation financière
2. 5-7 insights clés sur la performance actuelle
3. 5-7 recommandations stratégiques hiérarchisées
4. 3-5 facteurs de risque à surveiller
5. 3-5 opportunités d'amélioration
6. 5-8 actions prioritaires avec leur impact attendu (classées par priorité: high, medium, low)`
}
