/**
 * CassKai - Edge Function: AI KPI Analysis
 * Analyse IA des indicateurs financiers (KPI)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FinancialKPIs {
  revenues: number
  expenses: number
  netIncome: number
  profitMargin: number
  currentRatio: number
  debtToEquity: number
  roa: number
  roe: number
  revenueGrowth: number
  inventoryTurnover: number
  dso: number
  dpo: number
  cashConversionCycle: number
  currentAssets: number
  currentLiabilities: number
}

interface AIAnalysisResult {
  executiveSummary: string
  financialHealth: string
  keyStrengths: string[]
  concernPoints: string[]
  recommendations: string[]
  riskLevel: 'Faible' | 'Modéré' | 'Élevé' | 'Critique'
}

interface KPIAnalysisRequest {
  kpis: FinancialKPIs
  periodStart: string
  periodEnd: string
  company_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { kpis, periodStart, periodEnd, company_id }: KPIAnalysisRequest = await req.json()

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
    const { data: userCompany, error: accessError } = await supabaseClient
      .from('user_companies')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .eq('is_active', true)
      .maybeSingle()

    if (accessError) {
      console.error('[ai-kpi-analysis] RLS error checking access:', accessError)
      return new Response(JSON.stringify({ error: 'Access verification failed', details: accessError.message }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!userCompany) {
      console.warn('[ai-kpi-analysis] User access denied to company:', company_id)
      return new Response(JSON.stringify({ error: 'Access denied to this company' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build analysis prompt
    const prompt = buildAnalysisPrompt(kpis, periodStart, periodEnd)

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert-comptable et analyste financier senior avec 20 ans d'expérience.
Tu analyses les indicateurs financiers d'une entreprise et fournis des recommandations stratégiques claires et actionnables.
Tes analyses sont professionnelles, précises, et adaptées au contexte français (PCG).
Tu te concentres sur les aspects critiques et fournis des conseils pratiques.

IMPORTANT: Réponds UNIQUEMENT au format JSON avec la structure suivante:
{
  "executiveSummary": "résumé de 2-3 phrases",
  "financialHealth": "évaluation globale",
  "keyStrengths": ["point fort 1", "point fort 2", ...],
  "concernPoints": ["préoccupation 1", "préoccupation 2", ...],
  "recommendations": ["recommandation 1", "recommandation 2", ...],
  "riskLevel": "Faible|Modéré|Élevé|Critique"
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
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
        query: `KPI Analysis: ${periodStart} to ${periodEnd}`,
        response: JSON.stringify(analysis),
        context_type: 'kpi_analysis',
        model_used: 'gpt-4o-mini',
        tokens_used: completion.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      })

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('KPI Analysis Error:', error)
    return new Response(JSON.stringify({
      error: 'Erreur lors de l\'analyse des KPI',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function buildAnalysisPrompt(kpis: FinancialKPIs, periodStart: string, periodEnd: string): string {
  return `Analyse les KPI financiers suivants pour la période du ${periodStart} au ${periodEnd}:

INDICATEURS DE PERFORMANCE:
- Chiffre d'affaires: ${kpis.revenues.toLocaleString()} €
- Charges: ${kpis.expenses.toLocaleString()} €
- Résultat net: ${kpis.netIncome.toLocaleString()} €
- Marge bénéficiaire: ${(kpis.profitMargin * 100).toFixed(2)}%
- Croissance CA: ${(kpis.revenueGrowth * 100).toFixed(2)}%

RATIOS FINANCIERS:
- Ratio de liquidité: ${kpis.currentRatio.toFixed(2)}
- Ratio d'endettement: ${kpis.debtToEquity.toFixed(2)}
- ROA (Rendement actifs): ${(kpis.roa * 100).toFixed(2)}%
- ROE (Rendement capitaux propres): ${(kpis.roe * 100).toFixed(2)}%

CYCLE D'EXPLOITATION:
- DSO (Délai moyen recouvrement): ${kpis.dso} jours
- DPO (Délai moyen paiement): ${kpis.dpo} jours
- Rotation des stocks: ${kpis.inventoryTurnover.toFixed(2)} fois/an
- Cycle de conversion: ${kpis.cashConversionCycle} jours

STRUCTURE FINANCIÈRE:
- Actifs courants: ${kpis.currentAssets.toLocaleString()} €
- Passifs courants: ${kpis.currentLiabilities.toLocaleString()} €

Fournis une analyse complète avec:
1. Un résumé exécutif percutant
2. Une évaluation de la santé financière globale
3. Les points forts à capitaliser (3-5 maximum)
4. Les points de vigilance à surveiller (3-5 maximum)
5. Des recommandations actionnables et prioritaires (5 maximum)
6. Une évaluation du niveau de risque global`
}
