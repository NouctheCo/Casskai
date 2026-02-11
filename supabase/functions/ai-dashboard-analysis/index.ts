/**
 * CassKai - Edge Function: AI Dashboard Analysis
 * Analyse IA du tableau de bord
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit, rateLimitResponse, getRateLimitPreset } from '../_shared/rate-limit.ts'

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
  prompt?: string
  companyName: string
  company_id?: string
  industryType?: string
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Rate limiting
  const rateLimit = checkRateLimit(req, getRateLimitPreset('ai-dashboard-analysis'))
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!, getCorsHeaders(req))
  }

  try {
    const { kpiData, prompt: promptFromBody, companyName, company_id: providedCompanyId, industryType }: DashboardAnalysisRequest = await req.json()

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
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      })
    }

    // Resolve company_id if not provided
    let company_id = providedCompanyId
    if (!company_id) {
      const { data: activeCompany, error: companyError } = await supabaseClient
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()
      
      if (companyError) {
        console.error('[ai-dashboard-analysis] Error resolving company_id:', companyError)
        return new Response(JSON.stringify({ error: 'Failed to resolve company', details: companyError.message }), {
          status: 403,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        })
      }
      
      company_id = activeCompany?.company_id
    }

    if (!company_id) {
      return new Response(JSON.stringify({ error: 'Company not provided' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
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
      console.error('[ai-dashboard-analysis] RLS error checking access:', accessError)
      return new Response(JSON.stringify({ error: 'Access verification failed', details: accessError.message }), {
        status: 403,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      })
    }

    if (!userCompany) {
      console.warn('[ai-dashboard-analysis] User access denied to company:', company_id)
      return new Response(JSON.stringify({ error: 'Access denied to this company' }), {
        status: 403,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      })
    }

    // Build analysis prompt (fallback to provided prompt for backward compatibility)
    // UPDATED: Added comprehensive logging and error handling for kpiData
    console.log('[ai-dashboard-analysis] Request received:', {
      hasKpiData: !!kpiData,
      hasPrompt: !!promptFromBody,
      companyName,
      company_id,
      industryType,
      kpiDataStructure: kpiData ? JSON.stringify(kpiData, null, 2) : 'N/A'
    })

    if (!kpiData && !promptFromBody) {
      console.error('[ai-dashboard-analysis] Missing both kpiData and prompt')
      return new Response(JSON.stringify({ error: 'Missing prompt or kpiData' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      })
    }

    // Build prompt: use provided prompt if available, otherwise build from kpiData
    let prompt = promptFromBody
    if (!prompt && kpiData) {
      try {
        prompt = buildAnalysisPrompt(kpiData, companyName, industryType)
      } catch (promptError) {
        console.error('[ai-dashboard-analysis] Error building prompt from kpiData:', promptError)
        return new Response(JSON.stringify({ 
          error: 'Failed to build analysis prompt from kpiData',
          details: promptError instanceof Error ? promptError.message : String(promptError)
        }), {
          status: 400,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        })
      }
    }
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'No valid prompt could be generated' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      })
    }

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
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Dashboard Analysis Error:', error)
    return new Response(JSON.stringify({
      error: 'Erreur lors de l\'analyse du tableau de bord',
      details: error.message
    }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
    })
  }
})

function buildAnalysisPrompt(kpiData: RealKPIData, companyName: string, industryType?: string): string {
  // Safe access with defaults to prevent undefined errors (v2.1)
  const financial = kpiData?.financial || { revenue: 0, expenses: 0, netIncome: 0, profitMargin: 0 }
  const liquidity = kpiData?.liquidity || { currentRatio: 0, quickRatio: 0, cashRatio: 0 }
  const efficiency = kpiData?.efficiency || { dso: 0, dpo: 0, inventoryTurnover: 0 }
  const profitability = kpiData?.profitability || { grossMargin: 0, operatingMargin: 0, roa: 0, roe: 0 }
  const leverage = kpiData?.leverage || { debtToEquity: 0, debtToAssets: 0, interestCoverage: 0 }

  return `Analyse le tableau de bord financier de ${companyName}${industryType ? ` (secteur: ${industryType})` : ''}.

DONNÉES FINANCIÈRES:
- Chiffre d'affaires: ${(financial.revenue || 0).toLocaleString()} €
- Charges: ${(financial.expenses || 0).toLocaleString()} €
- Résultat net: ${(financial.netIncome || 0).toLocaleString()} €
- Marge nette: ${((financial.profitMargin || 0) * 100).toFixed(2)}%

LIQUIDITÉ:
- Ratio de liquidité générale: ${(liquidity.currentRatio || 0).toFixed(2)}
- Ratio de liquidité réduite: ${(liquidity.quickRatio || 0).toFixed(2)}
- Ratio de liquidité immédiate: ${(liquidity.cashRatio || 0).toFixed(2)}

EFFICACITÉ OPÉRATIONNELLE:
- DSO (délai recouvrement clients): ${efficiency.dso || 0} jours
- DPO (délai paiement fournisseurs): ${efficiency.dpo || 0} jours
- Rotation des stocks: ${(efficiency.inventoryTurnover || 0).toFixed(2)} fois/an

RENTABILITÉ:
- Marge brute: ${((profitability.grossMargin || 0) * 100).toFixed(2)}%
- Marge opérationnelle: ${((profitability.operatingMargin || 0) * 100).toFixed(2)}%
- ROA (rendement des actifs): ${((profitability.roa || 0) * 100).toFixed(2)}%
- ROE (rendement des capitaux propres): ${((profitability.roe || 0) * 100).toFixed(2)}%

STRUCTURE FINANCIÈRE:
- Ratio d'endettement (D/E): ${(leverage.debtToEquity || 0).toFixed(2)}
- Dette/Actifs: ${((leverage.debtToAssets || 0) * 100).toFixed(2)}%
- Couverture des intérêts: ${(leverage.interestCoverage || 0).toFixed(2)}x

Fournis une analyse stratégique complète avec:
1. Un résumé exécutif de la situation financière
2. 5-7 insights clés sur la performance actuelle
3. 5-7 recommandations stratégiques hiérarchisées
4. 3-5 facteurs de risque à surveiller
5. 3-5 opportunités d'amélioration
6. 5-8 actions prioritaires avec leur impact attendu (classées par priorité: high, medium, low)`
}
