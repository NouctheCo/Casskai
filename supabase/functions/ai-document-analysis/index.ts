/**
 * CassKai - AI Document Analysis Edge Function
 * Analyse les factures/reçus uploadés et extrait les données comptables
 * Utilise OpenAI GPT-4o-mini Vision pour l'extraction
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.20.1'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts'
import { checkRateLimit, rateLimitResponse, getRateLimitPreset } from '../_shared/rate-limit.ts'

interface DocumentAnalysisRequest {
  document_url?: string
  document_base64?: string
  document_type: 'invoice' | 'receipt' | 'bank_statement'
  company_id: string
  expected_format: 'journal_entry' | 'transaction_categorization'
  mime_type?: string
}

interface JournalEntryLine {
  account_suggestion: string
  account_class: string
  debit_amount: number
  credit_amount: number
  description: string
}

interface RawExtraction {
  supplier_name?: string
  customer_name?: string
  invoice_number?: string
  invoice_date?: string
  total_ht?: number
  total_ttc?: number
  vat_amount?: number
  vat_rate?: number
  currency?: string
  line_items?: Array<{
    description: string
    quantity: number
    unit_price: number
    vat_rate: number
  }>
}

interface JournalEntryExtracted {
  entry_date: string
  description: string
  reference_number: string
  lines: JournalEntryLine[]
  confidence_score: number
  raw_extraction: RawExtraction
}

serve(async (req) => {
  // CORS preflight
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  // Rate limiting
  const rateLimit = checkRateLimit(req, getRateLimitPreset('ai-document-analysis'))
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfter!, getCorsHeaders(req))
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

    const body: DocumentAnalysisRequest = await req.json()
    const { document_url, document_base64, document_type, company_id, expected_format, mime_type } = body

    if (!document_url && !document_base64) {
      return new Response(
        JSON.stringify({ error: 'document_url or document_base64 required' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer les infos de l'entreprise pour personnaliser l'analyse
    const { data: company } = await supabase
      .from('companies')
      .select('name, country, currency, accounting_standard')
      .eq('id', company_id)
      .single()

    const currency = company?.currency || 'EUR'
    const country = company?.country || 'FR'

    // Prompt système adapté au pays et type de document
    const systemPrompt = buildSystemPrompt(document_type, country, currency)

    // Construire le message pour OpenAI Vision
    // Utiliser le mime_type fourni, ou PNG par défaut (pour PDFs convertis), ou JPEG sinon
    const detectedMimeType = mime_type || 'image/png'
    const imageUrl = document_url || `data:${detectedMimeType};base64,${document_base64}`

    const messages: Array<{ role: string; content: any }> = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          },
          {
            type: 'text',
            text: `Analyse ce document comptable (${document_type}) et extrais toutes les informations au format JSON strict selon les instructions.`
          }
        ]
      }
    ]

    // Appel OpenAI GPT-4o-mini Vision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modèle économique mais efficace
      messages: messages as any,
      temperature: 0.1, // Faible température = plus déterministe
      response_format: { type: 'json_object' },
      max_tokens: 2000
    })

    const rawResponse = completion.choices[0]?.message?.content
    if (!rawResponse) {
      throw new Error('Empty response from OpenAI')
    }

    const parsed = JSON.parse(rawResponse)

    // Construire la réponse structurée
    const result: JournalEntryExtracted = {
      entry_date: parsed.invoice_date || new Date().toISOString().split('T')[0],
      description: parsed.description || `${document_type} ${parsed.invoice_number || ''}`.trim(),
      reference_number: parsed.invoice_number || '',
      lines: parsed.suggested_journal_entry?.lines || [],
      confidence_score: parsed.confidence_score || 0,
      raw_extraction: {
        supplier_name: parsed.supplier_name,
        customer_name: parsed.customer_name,
        invoice_number: parsed.invoice_number,
        invoice_date: parsed.invoice_date,
        total_ht: parsed.total_ht,
        total_ttc: parsed.total_ttc,
        vat_amount: parsed.vat_amount,
        vat_rate: parsed.vat_rate,
        currency: parsed.currency || currency,
        line_items: parsed.line_items
      }
    }

    // Log usage pour tracking coûts
    await supabase.from('ai_usage_logs').insert({
      company_id,
      feature: 'document_analysis',
      model: 'gpt-4o-mini',
      tokens_used: completion.usage?.total_tokens || 0,
      cost_usd: calculateCost(completion.usage?.total_tokens || 0, 'gpt-4o-mini'),
      metadata: {
        document_type,
        confidence_score: result.confidence_score
      }
    })

    return new Response(
      JSON.stringify(result),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in ai-document-analysis:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : ''
      }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Construit le prompt système adapté au contexte
 */
function buildSystemPrompt(documentType: string, country: string, currency: string): string {
  const basePrompt = `Tu es un expert-comptable spécialisé dans l'analyse de documents financiers.`

  const accountingStandards: Record<string, string> = {
    'FR': 'Plan Comptable Général (PCG) français',
    'BE': 'Plan Comptable Minimum Normalisé (PCMN) belge',
    'CH': 'Plan comptable suisse',
    'ES': 'Plan General de Contabilidad (PGC) espagnol',
    'DE': 'Handelsgesetzbuch (HGB) allemand',
    'UK': 'UK GAAP',
    'US': 'US GAAP'
  }

  const standard = accountingStandards[country] || accountingStandards['FR']

  const documentInstructions: Record<string, string> = {
    'invoice': `Ce document est une FACTURE. **ÉTAPE 1 : DÉTERMINER LE TYPE**
Analyse le document pour identifier :
- Est-ce une facture d'ACHAT (je dois payer au fournisseur) ? → Mots-clés: "Facture de", "Veuillez payer", "À payer"
- Ou une facture de VENTE (le client me doit) ? → Mots-clés: "Devis", "Invoice to", "Bill to"

**ÉTAPE 2 : EXTRAIRE LES MONTANTS**
Identifier et extraire PRÉCISÉMENT :
- total_ht : montant HT (avant TVA)
- vat_amount : montant de TVA
- total_ttc : montant TTC (HT + TVA)
- vat_rate : taux de TVA (ex: 20, 5.5, 0)

⚠️ SI DEUX MONTANTS SEULEMENT :
- Si HT et TTC présents : calculer TVA = TTC - HT
- Si HT et TVA présents : calculer TTC = HT + TVA  
- Si TVA et TTC présents : calculer HT = TTC - TVA

**ÉTAPE 3 : GÉNÉRER LES ÉCRITURES COMPTABLES**

📌 **POUR FACTURE D'ACHAT** (invoice_purchase) :
- Ligne 1: Débit compte 607xxx (Achats) = **total_ht**
- Ligne 2: Débit compte 44566 (TVA déductible) = **vat_amount**
- Ligne 3: Crédit compte 401xxx (Fournisseurs) = **total_ttc**

📌 **POUR FACTURE DE VENTE** (invoice_sale) :
- Ligne 1: Débit compte 411xxx (Clients) = **total_ttc**
- Ligne 2: Crédit compte 707xxx (Ventes) = **total_ht**
- Ligne 3: Crédit compte 44571 (TVA collectée) = **vat_amount**

✅ L'écriture DOIT ÊTRE ÉQUILIBRÉE : somme débits = somme crédits`,

    'receipt': `Ce document est un reçu/ticket de caisse. Extrais :
- Commerçant
- Date
- Montant total
- Catégorie probable (restaurant, carburant, fournitures, etc.)

Écriture comptable suggérée:
- Ligne 1: Débit compte 6xxxxx (Charges selon catégorie) = montant
- Ligne 2: Crédit compte 512xxx (Banque) = montant`,

    'bank_statement': `Ce document est un relevé bancaire. Extrais :
- Banque
- Période
- Liste des transactions (date, description, montant)
- Solde initial et final`
  }

  return `${basePrompt}

Norme comptable appliquée : ${standard}
Devise : ${currency}

${documentInstructions[documentType] || documentInstructions['invoice']}

**Format de réponse JSON strict :**

{
  "document_type": "invoice_purchase",
  "supplier_name": "CERNEI Aurélia",
  "customer_name": null,
  "invoice_number": "2026-XXXX",
  "invoice_date": "2026-01-16",
  "description": "Prestation de ménage - CERNEI Aurélia",
  "total_ht": 95.20,
  "total_ttc": 102.30,
  "vat_amount": 7.10,
  "vat_rate": 7.5,
  "currency": "${currency}",
  "line_items": [
    {
      "description": "Prestation de ménage",
      "quantity": 3,
      "unit_price": 31.73,
      "vat_rate": 7.5
    }
  ],
  "suggested_journal_entry": {
    "lines": [
      {
        "account_class": "607",
        "account_suggestion": "Achats de services",
        "debit_amount": 95.20,
        "credit_amount": 0,
        "description": "Prestation ménage CERNEI - 3h"
      },
      {
        "account_class": "44566",
        "account_suggestion": "TVA déductible",
        "debit_amount": 7.10,
        "credit_amount": 0,
        "description": "TVA 7.5% sur prestation"
      },
      {
        "account_class": "401",
        "account_suggestion": "Fournisseurs - CERNEI",
        "debit_amount": 0,
        "credit_amount": 102.30,
        "description": "À payer CERNEI Aurélia"
      }
    ]
  },
  "confidence_score": 92
}

**Règles strictes :**
- Montants en décimal avec point (pas virgule) : 1234.56
- Dates au format ISO : YYYY-MM-DD
- account_class doit correspondre au ${standard}
- confidence_score entre 0 et 100 (100 = très confiant)
- Si information manquante, mettre null (pas de string vide)
- L'écriture DOIT être équilibrée : somme débits = somme crédits
- Toujours inclure la TVA si présente sur le document
- Ne jamais inventer de données, rester factuel

Si le document n'est pas lisible ou trop flou :
{
  "error": "Document illisible",
  "confidence_score": 0
}
`
}

/**
 * Calcule le coût d'une requête OpenAI
 */
function calculateCost(tokens: number, model: string): number {
  const pricing: Record<string, number> = {
    'gpt-4o-mini': 0.00015, // $0.15 per 1M tokens (input)
    'gpt-4o': 0.0025,       // $2.50 per 1M tokens (input)
    'gpt-4': 0.003          // $3.00 per 1M tokens (input)
  }
  
  const pricePerToken = pricing[model] || pricing['gpt-4o-mini']
  return tokens * pricePerToken
}
