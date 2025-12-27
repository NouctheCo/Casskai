/**
 * CassKai - Edge Function: AI Report Analysis
 * Analyse IA des rapports financiers (Cash Flow, Créances, Ratios, etc.)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIAnalysisResult {
  executiveSummary: string
  financialHealth: string
  keyStrengths: string[]
  concernPoints: string[]
  recommendations: string[]
  riskLevel: 'Faible' | 'Modéré' | 'Élevé' | 'Critique'
}

interface ReportAnalysisRequest {
  reportType: 'cashflow' | 'receivables' | 'payables' | 'ratios' | 'budget_variance' | 'inventory'
  reportData: any
  company_id: string
  periodStart?: string
  periodEnd?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reportType, reportData, company_id, periodStart, periodEnd }: ReportAnalysisRequest = await req.json()

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

    // Build analysis prompt based on report type
    const prompt = buildPromptForReportType(reportType, reportData, periodStart, periodEnd)

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert-comptable et analyste financier senior avec 20 ans d'expérience.
Tu analyses les ${getReportTypeName(reportType)} d'une entreprise et fournis des recommandations stratégiques claires et actionnables.
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
        query: `Report Analysis (${reportType}): ${periodStart || ''} to ${periodEnd || ''}`,
        response: JSON.stringify(analysis),
        context_type: `report_analysis_${reportType}`,
        model_used: 'gpt-4o-mini',
        tokens_used: completion.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      })

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Report Analysis Error:', error)
    return new Response(JSON.stringify({
      error: 'Erreur lors de l\'analyse du rapport',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function getReportTypeName(reportType: string): string {
  const names: Record<string, string> = {
    'cashflow': 'flux de trésorerie',
    'receivables': 'créances clients',
    'payables': 'dettes fournisseurs',
    'ratios': 'ratios financiers',
    'budget_variance': 'écarts budgétaires',
    'inventory': 'stocks et inventaire'
  }
  return names[reportType] || 'données financières'
}

function buildPromptForReportType(
  reportType: string,
  data: any,
  periodStart?: string,
  periodEnd?: string
): string {
  const period = periodStart && periodEnd ? `pour la période du ${periodStart} au ${periodEnd}` : ''

  switch (reportType) {
    case 'cashflow':
      return buildCashFlowPrompt(data, period)
    case 'receivables':
      return buildReceivablesPrompt(data, period)
    case 'payables':
      return buildPayablesPrompt(data, period)
    case 'ratios':
      return buildRatiosPrompt(data, period)
    case 'budget_variance':
      return buildBudgetVariancePrompt(data, period)
    case 'inventory':
      return buildInventoryPrompt(data, period)
    default:
      return `Analyse les données financières suivantes ${period}:\n${JSON.stringify(data, null, 2)}`
  }
}

function buildCashFlowPrompt(data: any, period: string): string {
  return `Analyse les flux de trésorerie ${period}:

FLUX DE TRÉSORERIE:
- Flux opérationnels: ${data.operatingCashFlow?.toLocaleString() || 'N/A'} €
- Flux d'investissement: ${data.investingCashFlow?.toLocaleString() || 'N/A'} €
- Flux de financement: ${data.financingCashFlow?.toLocaleString() || 'N/A'} €
- Flux net de trésorerie: ${data.netCashFlow?.toLocaleString() || 'N/A'} €
- Solde de trésorerie: ${data.cashBalance?.toLocaleString() || 'N/A'} €
- Cash flow libre (FCF): ${data.freeCashFlow?.toLocaleString() || 'N/A'} €
- Cash flow / Dette: ${data.cashFlowToDebt?.toFixed(2) || 'N/A'}

Fournis une analyse complète avec focus sur la capacité de génération de cash et la santé financière.`
}

function buildReceivablesPrompt(data: any, period: string): string {
  return `Analyse les créances clients ${period}:

CRÉANCES CLIENTS:
- Total des créances: ${data.totalReceivables?.toLocaleString() || 'N/A'} €
- À jour (0-30j): ${data.current?.toLocaleString() || 'N/A'} €
- Retard 30-60j: ${data.overdue30?.toLocaleString() || 'N/A'} €
- Retard 60-90j: ${data.overdue60?.toLocaleString() || 'N/A'} €
- Retard +90j: ${data.overdue90?.toLocaleString() || 'N/A'} €
- DSO (délai moyen de recouvrement): ${data.dso || 'N/A'} jours
- Taux de recouvrement: ${data.collectionRate?.toFixed(2) || 'N/A'}%
- Montant moyen en retard: ${data.averageOverdueAmount?.toLocaleString() || 'N/A'} €

Fournis une analyse du risque client et des recommandations pour optimiser le recouvrement.`
}

function buildPayablesPrompt(data: any, period: string): string {
  return `Analyse les dettes fournisseurs ${period}:

DETTES FOURNISSEURS:
- Total des dettes: ${data.totalPayables?.toLocaleString() || 'N/A'} €
- À jour (0-30j): ${data.current?.toLocaleString() || 'N/A'} €
- Retard 30-60j: ${data.overdue30?.toLocaleString() || 'N/A'} €
- Retard 60-90j: ${data.overdue60?.toLocaleString() || 'N/A'} €
- Retard +90j: ${data.overdue90?.toLocaleString() || 'N/A'} €
- DPO (délai moyen de paiement): ${data.dpo || 'N/A'} jours
- Taux de paiement: ${data.paymentRate?.toFixed(2) || 'N/A'}%
- Montant moyen en retard: ${data.averageOverdueAmount?.toLocaleString() || 'N/A'} €

Fournis une analyse de la gestion fournisseurs et des recommandations pour optimiser les paiements.`
}

function buildRatiosPrompt(data: any, period: string): string {
  return `Analyse les ratios financiers ${period}:

RATIOS DE LIQUIDITÉ:
- Current ratio: ${data.liquidityRatios?.currentRatio?.toFixed(2) || 'N/A'}
- Quick ratio: ${data.liquidityRatios?.quickRatio?.toFixed(2) || 'N/A'}
- Cash ratio: ${data.liquidityRatios?.cashRatio?.toFixed(2) || 'N/A'}

RATIOS DE RENTABILITÉ:
- Marge brute: ${data.profitabilityRatios?.grossMargin ? (data.profitabilityRatios.grossMargin * 100).toFixed(2) : 'N/A'}%
- Marge nette: ${data.profitabilityRatios?.netMargin ? (data.profitabilityRatios.netMargin * 100).toFixed(2) : 'N/A'}%
- ROA: ${data.profitabilityRatios?.roa ? (data.profitabilityRatios.roa * 100).toFixed(2) : 'N/A'}%
- ROE: ${data.profitabilityRatios?.roe ? (data.profitabilityRatios.roe * 100).toFixed(2) : 'N/A'}%

RATIOS D'ENDETTEMENT:
- Dette/Capitaux propres: ${data.leverageRatios?.debtToEquity?.toFixed(2) || 'N/A'}
- Dette/Actifs: ${data.leverageRatios?.debtToAssets ? (data.leverageRatios.debtToAssets * 100).toFixed(2) : 'N/A'}%
- Couverture des intérêts: ${data.leverageRatios?.interestCoverage?.toFixed(2) || 'N/A'}x

RATIOS D'EFFICACITÉ:
- Rotation des actifs: ${data.efficiencyRatios?.assetTurnover?.toFixed(2) || 'N/A'}
- Rotation des stocks: ${data.efficiencyRatios?.inventoryTurnover?.toFixed(2) || 'N/A'}
- Rotation des créances: ${data.efficiencyRatios?.receivablesTurnover?.toFixed(2) || 'N/A'}

Fournis une analyse complète de la santé financière basée sur ces ratios.`
}

function buildBudgetVariancePrompt(data: any, period: string): string {
  return `Analyse les écarts budgétaires ${period}:

ANALYSE BUDGÉTAIRE:
- Budget total: ${data.totalBudget?.toLocaleString() || 'N/A'} €
- Réalisé total: ${data.totalActual?.toLocaleString() || 'N/A'} €
- Écart total: ${data.totalVariance?.toLocaleString() || 'N/A'} €
- Écart en %: ${data.variancePercentage?.toFixed(2) || 'N/A'}%

ÉCARTS MAJEURS PAR CATÉGORIE:
${data.majorVariances?.map((v: any) =>
  `- ${v.category}: Budget ${v.budget?.toLocaleString() || 'N/A'}€, Réalisé ${v.actual?.toLocaleString() || 'N/A'}€, Écart ${v.variance?.toLocaleString() || 'N/A'}€ (${v.variancePercent?.toFixed(1) || 'N/A'}%)`
).join('\n') || 'Aucun écart majeur'}

Fournis une analyse des écarts significatifs et des recommandations pour améliorer la performance budgétaire.`
}

function buildInventoryPrompt(data: any, period: string): string {
  return `Analyse les stocks ${period}:

INVENTAIRE:
- Stock total: ${data.totalInventory?.toLocaleString() || 'N/A'} €
- Matières premières: ${data.rawMaterials?.toLocaleString() || 'N/A'} €
- En-cours de production: ${data.workInProgress?.toLocaleString() || 'N/A'} €
- Produits finis: ${data.finishedGoods?.toLocaleString() || 'N/A'} €
- Rotation des stocks: ${data.inventoryTurnover?.toFixed(2) || 'N/A'} fois/an
- DIO (durée moyenne stockage): ${data.daysInventoryOutstanding || 'N/A'} jours
- Stock obsolète: ${data.obsoleteInventory?.toLocaleString() || 'N/A'} €
- Ratio stock/ventes: ${data.inventoryToSales ? (data.inventoryToSales * 100).toFixed(2) : 'N/A'}%

Fournis une analyse de la gestion des stocks et des recommandations pour optimiser le niveau et la rotation.`
}
