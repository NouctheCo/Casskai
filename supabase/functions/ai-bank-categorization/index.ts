/**
 * CassKai - AI Bank Transaction Categorization Edge Function
 * Catégorise automatiquement les transactions bancaires importées
 * Utilise OpenAI GPT-4o-mini pour la classification intelligente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransactionToClassify {
  description: string
  amount: number
  date: string
  reference?: string
}

interface BankCategorizationRequest {
  transactions: TransactionToClassify[]
  company_id: string
  country?: string
  language?: string
}

interface CategorySuggestion {
  category: string
  account_number: string
  account_class: string
  account_name: string
  confidence: number
  reasoning?: string
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const openai = new OpenAI({ apiKey: openaiKey })

    const body: BankCategorizationRequest = await req.json()
    const { transactions, company_id, country = 'FR', language = 'fr' } = body

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'transactions array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limiter à 50 transactions par batch pour éviter timeouts
    const batchSize = 50
    const transactionsBatch = transactions.slice(0, batchSize)

    // Récupérer le contexte de l'entreprise
    const { data: company } = await supabase
      .from('companies')
      .select('name, country, currency, accounting_standard')
      .eq('id', company_id)
      .single()

    // Récupérer les catégorisations historiques pour apprentissage
    const { data: historicalCategories } = await supabase
      .from('bank_transactions')
      .select('description, category, suggested_account')
      .eq('company_id', company_id)
      .not('category', 'is', null)
      .limit(20)

    const systemPrompt = buildCategorizationPrompt(country, language, historicalCategories || [])

    // Construire la liste des transactions
    const transactionsList = transactionsBatch.map((t, i) => 
      `${i + 1}. ${t.description} | ${t.amount > 0 ? '+' : ''}${t.amount}€ | ${t.date}`
    ).join('\n')

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Catégorise ces ${transactionsBatch.length} transactions bancaires selon le plan comptable ${company?.accounting_standard || 'PCG français'} :

${transactionsList}

Retourne un JSON avec un array "categories" contenant exactement ${transactionsBatch.length} objets dans l'ordre.`
      }
    ]

    // Appel OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as any,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      max_tokens: 3000
    })

    const rawResponse = completion.choices[0]?.message?.content
    if (!rawResponse) {
      throw new Error('Empty response from OpenAI')
    }

    const parsed = JSON.parse(rawResponse)
    const categories: CategorySuggestion[] = parsed.categories || []

    // Validation : même nombre de catégories que de transactions
    if (categories.length !== transactionsBatch.length) {
      console.warn(`Expected ${transactionsBatch.length} categories, got ${categories.length}`)
      // Compléter avec des catégories par défaut si nécessaire
      while (categories.length < transactionsBatch.length) {
        categories.push({
          category: 'Autre',
          account_number: '999999',
          account_class: '9',
          account_name: 'Non catégorisé',
          confidence: 0,
          reasoning: 'Catégorisation automatique échouée'
        })
      }
    }

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      company_id,
      feature: 'bank_categorization',
      model: 'gpt-4o-mini',
      tokens_used: completion.usage?.total_tokens || 0,
      cost_usd: calculateCost(completion.usage?.total_tokens || 0),
      metadata: {
        transactions_count: transactionsBatch.length,
        avg_confidence: categories.reduce((s, c) => s + c.confidence, 0) / categories.length
      }
    })

    return new Response(
      JSON.stringify({ 
        categories,
        processed_count: transactionsBatch.length,
        total_count: transactions.length,
        has_more: transactions.length > batchSize
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-bank-categorization:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : ''
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Construit le prompt système pour la catégorisation
 */
function buildCategorizationPrompt(country: string, language: string, historicalData: any[]): string {
  const accountingPlans: Record<string, Record<string, string>> = {
    'FR': {
      '411': 'Clients',
      '401': 'Fournisseurs',
      '512': 'Banque',
      '606': 'Achats non stockés (Eau, Électricité, Gaz)',
      '607': 'Achats de marchandises',
      '613': 'Locations',
      '615': 'Entretien et réparations',
      '616': 'Primes d\'assurance',
      '622': 'Rémunérations d\'intermédiaires et honoraires',
      '623': 'Publicité, publications',
      '625': 'Déplacements, missions et réceptions',
      '626': 'Frais postaux et de télécommunications',
      '627': 'Services bancaires et assimilés',
      '635': 'Impôts et taxes',
      '641': 'Rémunérations du personnel',
      '645': 'Charges de sécurité sociale',
      '661': 'Charges d\'intérêts',
      '707': 'Ventes de marchandises',
      '708': 'Produits des activités annexes',
      '758': 'Produits divers de gestion courante'
    },
    'BE': {
      '400': 'Fournisseurs',
      '550': 'Banque',
      '604': 'Achats de marchandises',
      '620': 'Loyers',
      '700': 'Ventes de marchandises'
    },
    'ES': {
      '430': 'Clientes',
      '400': 'Proveedores',
      '572': 'Banco',
      '600': 'Compras',
      '700': 'Ventas'
    }
  }

  const plan = accountingPlans[country] || accountingPlans['FR']
  const planDescription = Object.entries(plan).map(([code, name]) => `${code}: ${name}`).join('\n')

  const historicalContext = historicalData.length > 0
    ? `\n\nContexte historique (catégorisations précédentes de cette entreprise) :
${historicalData.map(h => `- "${h.description}" → ${h.category} (compte ${h.suggested_account})`).join('\n')}`
    : ''

  return `Tu es un expert-comptable spécialisé dans la catégorisation de transactions bancaires.

**Plan comptable de référence :**
${planDescription}

**Catégories communes :**
- "Ventes" → compte 707xxx (virements entrants de clients)
- "Achats marchandises" → compte 607xxx (fournisseurs, grossistes)
- "Achats fournitures" → compte 606xxx (eau, électricité, gaz, fournitures bureau)
- "Loyer" → compte 613xxx (loyers, charges locatives)
- "Assurances" → compte 616xxx (assurances diverses)
- "Honoraires" → compte 622xxx (consultants, avocats, experts-comptables)
- "Publicité" → compte 623xxx (Google Ads, Facebook Ads, affiches)
- "Déplacements" → compte 625xxx (carburant, péages, billets train/avion)
- "Télécom" → compte 626xxx (téléphone, internet, mobile)
- "Frais bancaires" → compte 627xxx (commissions, agios, frais carte)
- "Impôts et taxes" → compte 635xxx (CFE, CVAE, taxe foncière)
- "Salaires" → compte 641xxx (salaires nets versés)
- "Charges sociales" → compte 645xxx (URSSAF, cotisations)
- "Intérêts emprunt" → compte 661xxx (intérêts bancaires)
- "Remboursement emprunt" → compte 164xxx (capital remboursé)
- "Autre" → compte 999999 (si vraiment impossible à catégoriser)
${historicalContext}

**Instructions :**
1. Lis attentivement la description de chaque transaction
2. Identifie les mots-clés (VIREMENT, PRELEVEMENT, CB, CHEQUE, etc.)
3. Déduis la catégorie la plus appropriée
4. Propose le numéro de compte comptable correspondant
5. Indique un niveau de confiance (0-100)

**Format de réponse JSON strict :**

{
  "categories": [
    {
      "category": "Nom de la catégorie",
      "account_number": "6XXXXX",
      "account_class": "6",
      "account_name": "Nom du compte",
      "confidence": 85,
      "reasoning": "Explication courte (optionnel)"
    }
  ]
}

**Règles importantes :**
- Un objet par transaction, dans l'ordre exact
- confidence entre 0 et 100 (0 = incertain, 100 = très sûr)
- Si plusieurs catégories possibles, choisir la plus probable
- Pour les virements sortants inconnus, utiliser "Achats fournitures" (607) par défaut
- Pour les virements entrants inconnus, utiliser "Ventes" (707) par défaut
- Les CB (Carte Bancaire) sont généralement des achats (607) sauf si contexte évident
- Les PRELEVEMENTS sont souvent des charges récurrentes (loyer, électricité, etc.)
- Les VIREMENTS peuvent être des salaires (si montant fixe mensuel) ou des ventes/achats

Sois précis mais pragmatique. Si vraiment aucune catégorie ne convient, utilise "Autre" avec confidence faible.
`
}

/**
 * Calcule le coût d'une requête OpenAI
 */
function calculateCost(tokens: number): number {
  // GPT-4o-mini : $0.15 per 1M input tokens, $0.60 per 1M output tokens
  // Approximation : ~$0.15 per 1M tokens en moyenne
  return tokens * 0.00015
}
