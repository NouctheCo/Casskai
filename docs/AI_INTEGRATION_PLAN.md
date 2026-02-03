# 🤖 Plan d'Intégration IA - CassKai

**Date:** 29 janvier 2026  
**Objectif:** Exploiter l'API OpenAI existante pour automatiser la saisie comptable et améliorer l'assistant IA.

---

## 📊 État des lieux (Audit)

### ✅ **Ce qui existe déjà**

#### 1. **Infrastructure OpenAI en place**
- **Localisation:** `supabase/functions/` (Edge Functions Deno)
- **Fichiers clés:**
  - `ai-assistant/index.ts` — Assistant conversationnel (674 lignes)
  - `ai-kpi-analysis/index.ts` — Analyse KPIs
  - `ai-report-analysis/index.ts` — Analyse rapports
  - `ai-dashboard-analysis/index.ts` — Analyse tableaux de bord
- **Frontend:** `src/services/aiService.ts` — Appelle les Edge Functions
- **Modèle:** OpenAI GPT-4 (configurable)
- **Clé API:** Stockée dans Supabase Secrets (`OPENAI_API_KEY`)

#### 2. **Saisie comptable existante**
- **Composant:** `src/components/accounting/JournalEntryForm.tsx` (641 lignes)
- **Fonctionnalité actuelle:**
  - Formulaire manuel avec lignes débit/crédit
  - Validation Zod (équilibre débit=crédit)
  - Support pièces jointes (JournalEntryAttachments)
  - Minimum 2 lignes requises
- **Service:** `src/services/journalEntriesService.ts` — CRUD écritures
- **Génération auto depuis factures:** `src/services/invoiceJournalEntryService.ts` (533 lignes)
  - ✅ Factures ventes → Écriture automatique (411 / 707 / 44571)
  - ✅ Factures achats → Écriture automatique (401 / 607 / 44566)
  - ✅ Liaison facture ↔ écriture comptable

#### 3. **Import bancaire existant**
- **Service:** `src/services/bankImportService.ts` (648 lignes)
- **Formats supportés:** CSV, OFX, QIF
- **Workflow actuel:**
  1. Upload fichier bancaire
  2. Détection automatique colonnes (date, montant, description)
  3. Import dans table `bank_transactions`
  4. Pré-catégorisation basique (champ `category`)
  5. **Pas de génération automatique d'écritures** ❌
- **Tables:** `bank_transactions`, `bank_accounts`

#### 4. **Assistant CassKai**
- **Edge Function:** `supabase/functions/ai-assistant/index.ts`
- **Frontend:** Composant non trouvé (probablement dans roadmap)
- **Features actuelles:**
  - Détection contexte (dashboard/accounting/invoicing/reports)
  - Suggestions dynamiques selon la requête
  - Filtrage sécurité (refuse code source, clés API)
  - Support multi-langues (FR prioritaire)
  - Actions UI (navigate, create, search, explain)
- **Limitations détectées:**
  - Pas de context de l'entreprise enrichi ⚠️
  - Pas d'accès au plan comptable dans les prompts ⚠️
  - Suggestions génériques (pas personnalisées) ⚠️

---

## 🎯 Plan d'Implémentation (3 phases)

### 📌 **Phase 1: Analyse de documents → Écritures comptables** ⭐ PRIORITAIRE

#### **Use Case:**
> L'utilisateur upload une facture (PDF/image) → L'IA extrait les données → Pré-remplit le formulaire d'écriture comptable → L'utilisateur valide.

#### **Composants à créer:**

##### 1.1. **Edge Function:** `supabase/functions/ai-document-analysis/index.ts`

```typescript
import OpenAI from 'https://esm.sh/openai@4.20.1'

interface DocumentAnalysisRequest {
  document_url?: string       // URL Supabase Storage
  document_base64?: string    // Image/PDF en base64
  document_type: 'invoice' | 'receipt' | 'bank_statement'
  company_id: string
  expected_format: 'journal_entry' | 'transaction_categorization'
}

interface JournalEntryExtracted {
  entry_date: string
  description: string
  reference_number: string
  lines: Array<{
    account_suggestion: string  // "411" ou "607" (classe comptable)
    debit_amount: number
    credit_amount: number
    description: string
  }>
  confidence_score: number      // 0-100%
  raw_extraction: {
    supplier_name?: string
    customer_name?: string
    invoice_number?: string
    invoice_date?: string
    total_ht?: number
    total_ttc?: number
    vat_amount?: number
    vat_rate?: number
  }
}

// Prompt OpenAI Vision
const prompt = `
Tu es un expert-comptable français. Analyse ce document et extrais les informations comptables suivantes au format JSON strict :

{
  "document_type": "invoice_sale|invoice_purchase|receipt|bank_statement",
  "supplier_name": "Nom du fournisseur (si facture achat)",
  "customer_name": "Nom du client (si facture vente)",
  "invoice_number": "Numéro de facture",
  "invoice_date": "YYYY-MM-DD",
  "total_ht": 1234.56,
  "total_ttc": 1481.47,
  "vat_amount": 246.91,
  "vat_rate": 20,
  "line_items": [
    {
      "description": "Prestation de service",
      "quantity": 1,
      "unit_price": 1234.56,
      "vat_rate": 20
    }
  ],
  "suggested_journal_entry": {
    "lines": [
      {
        "account_class": "411",
        "account_suggestion": "Clients",
        "debit_amount": 1481.47,
        "credit_amount": 0,
        "description": "Client XYZ"
      },
      {
        "account_class": "707",
        "account_suggestion": "Ventes de prestations de services",
        "debit_amount": 0,
        "credit_amount": 1234.56,
        "description": "Prestation facture F2026-001"
      },
      {
        "account_class": "44571",
        "account_suggestion": "TVA collectée",
        "debit_amount": 0,
        "credit_amount": 246.91,
        "description": "TVA 20%"
      }
    ]
  },
  "confidence_score": 95
}

Règles strictes :
- Montants en décimal (point, pas virgule)
- Dates au format ISO (YYYY-MM-DD)
- Si facture d'achat : compte 401 (crédit) / 607 (débit) / 44566 (débit TVA)
- Si facture de vente : compte 411 (débit) / 707 (crédit) / 44571 (crédit TVA)
- Si reçu : compte 607 (débit) / 512 (crédit banque)
- confidence_score entre 0 et 100 (100 = très confiant)
`
```

**Appel OpenAI Vision:**
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o", // ou "gpt-4-vision-preview"
  messages: [
    {
      role: "system",
      content: prompt
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: documentUrl || `data:image/jpeg;base64,${documentBase64}`
          }
        },
        {
          type: "text",
          text: "Analyse cette facture et extrais les données comptables."
        }
      ]
    }
  ],
  temperature: 0.1, // Faible température = plus déterministe
  response_format: { type: "json_object" }
})
```

##### 1.2. **Service Frontend:** `src/services/aiDocumentAnalysisService.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface DocumentAnalysisResult {
  success: boolean;
  data?: JournalEntryExtracted;
  error?: string;
}

class AIDocumentAnalysisService {
  /**
   * Analyse un document uploadé et retourne une écriture comptable pré-remplie
   */
  async analyzeDocument(
    file: File,
    companyId: string,
    documentType: 'invoice' | 'receipt' | 'bank_statement'
  ): Promise<DocumentAnalysisResult> {
    try {
      // 1. Upload vers Supabase Storage
      const fileName = `ai-analysis/${companyId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      // 2. Obtenir l'URL publique signée (temporaire 5 min)
      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(fileName, 300);

      if (!urlData?.signedUrl) throw new Error('Impossible de générer l\'URL du document');

      // 3. Appeler la Edge Function
      const { data, error } = await supabase.functions.invoke('ai-document-analysis', {
        body: {
          document_url: urlData.signedUrl,
          document_type: documentType,
          company_id: companyId,
          expected_format: 'journal_entry'
        }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      logger.error('AIDocumentAnalysis', 'Erreur analyse document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Valide et corrige les données extraites avant insertion
   */
  validateExtractedEntry(extracted: JournalEntryExtracted): {
    valid: boolean;
    errors: string[];
    corrected?: JournalEntryExtracted;
  } {
    const errors: string[] = [];

    // Vérifier équilibre débit/crédit
    const totalDebit = extracted.lines.reduce((s, l) => s + l.debit_amount, 0);
    const totalCredit = extracted.lines.reduce((s, l) => s + l.credit_amount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      errors.push(`Écriture non équilibrée : Débit ${totalDebit}€ ≠ Crédit ${totalCredit}€`);
    }

    // Vérifier dates valides
    if (!extracted.entry_date || isNaN(Date.parse(extracted.entry_date))) {
      errors.push('Date d\'écriture invalide');
    }

    // Vérifier au moins 2 lignes
    if (extracted.lines.length < 2) {
      errors.push('Minimum 2 lignes d\'écriture requises');
    }

    // Vérifier confidence score
    if (extracted.confidence_score < 70) {
      errors.push(`⚠️ Confiance faible (${extracted.confidence_score}%) - Vérification manuelle recommandée`);
    }

    return {
      valid: errors.length === 0,
      errors,
      corrected: extracted // TODO: implémenter correction auto
    };
  }
}

export const aiDocumentAnalysisService = new AIDocumentAnalysisService();
```

##### 1.3. **Composant UI:** Modifier `JournalEntryForm.tsx`

**Ajouter un bouton "🤖 Analyser avec IA" :**

```tsx
import { Sparkles, Upload } from 'lucide-react';
import { aiDocumentAnalysisService } from '@/services/aiDocumentAnalysisService';

// Dans le composant JournalEntryForm
const [aiAnalyzing, setAiAnalyzing] = useState(false);
const [aiSuggestion, setAiSuggestion] = useState<JournalEntryExtracted | null>(null);

const handleAIAnalysis = async (file: File) => {
  if (!currentCompany?.id) return;

  setAiAnalyzing(true);
  try {
    const result = await aiDocumentAnalysisService.analyzeDocument(
      file,
      currentCompany.id,
      'invoice'
    );

    if (!result.success || !result.data) {
      toast({
        title: 'Analyse échouée',
        description: result.error || 'Impossible d\'analyser le document',
        variant: 'destructive'
      });
      return;
    }

    // Valider les données extraites
    const validation = aiDocumentAnalysisService.validateExtractedEntry(result.data);

    if (!validation.valid) {
      toast({
        title: '⚠️ Données incomplètes',
        description: validation.errors.join(', '),
        variant: 'warning'
      });
    }

    // Pré-remplir le formulaire avec les données extraites
    setAiSuggestion(result.data);

    // Mapper vers le format du formulaire
    const mappedLines = await Promise.all(
      result.data.lines.map(async (line) => {
        // Trouver le compte correspondant dans le plan comptable
        const account = await findAccountByClass(line.account_suggestion);
        
        return {
          accountId: account?.id || '',
          debitAmount: line.debit_amount,
          creditAmount: line.credit_amount,
          description: line.description,
          currency: DEFAULT_CURRENCY
        };
      })
    );

    // Remplir le formulaire
    setValue('entryDate', new Date(result.data.entry_date));
    setValue('description', result.data.description);
    setValue('referenceNumber', result.data.reference_number);
    replace(mappedLines);

    toast({
      title: '✨ Analyse réussie',
      description: `Écriture pré-remplie avec ${result.data.confidence_score}% de confiance`,
      variant: 'success'
    });
  } catch (error) {
    logger.error('JournalEntryForm', 'Erreur analyse IA:', error);
    toast({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de l\'analyse',
      variant: 'destructive'
    });
  } finally {
    setAiAnalyzing(false);
  }
};

// UI - Ajouter après le champ "Date"
<div className="col-span-2 border-2 border-dashed border-primary/20 rounded-lg p-4 bg-primary/5">
  <div className="flex items-center gap-3 mb-2">
    <Sparkles className="w-5 h-5 text-primary" />
    <h3 className="text-sm font-semibold text-primary">
      Analyse automatique par IA
    </h3>
  </div>
  <p className="text-xs text-muted-foreground mb-3">
    Uploadez une facture ou un reçu pour pré-remplir automatiquement l'écriture comptable.
  </p>
  <label htmlFor="ai-upload" className="cursor-pointer">
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={aiAnalyzing || !currentCompany}
      className="w-full"
      asChild
    >
      <div>
        {aiAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Choisir un document (PDF, JPG, PNG)
          </>
        )}
      </div>
    </Button>
    <input
      id="ai-upload"
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleAIAnalysis(file);
      }}
    />
  </label>

  {aiSuggestion && (
    <Alert className="mt-3 bg-primary/10 border-primary/20">
      <AlertCircle className="w-4 h-4 text-primary" />
      <AlertDescription className="text-xs">
        <strong>Données extraites du document :</strong><br />
        • {aiSuggestion.raw_extraction.supplier_name || aiSuggestion.raw_extraction.customer_name}<br />
        • Facture {aiSuggestion.raw_extraction.invoice_number}<br />
        • Montant TTC : {aiSuggestion.raw_extraction.total_ttc}€<br />
        <span className="text-primary font-medium">
          Confiance : {aiSuggestion.confidence_score}%
        </span>
      </AlertDescription>
    </Alert>
  )}
</div>
```

---

### 📌 **Phase 2: Import bancaire intelligent**

#### **Use Case:**
> L'utilisateur importe un relevé CSV → L'IA catégorise automatiquement les transactions → Pré-génère les écritures comptables correspondantes.

#### **Modifications à apporter:**

##### 2.1. **Enrichir le service bancaire:** `bankImportService.ts`

```typescript
// Après l'import des transactions, appeler l'IA pour catégorisation
async categorizeWithAI(
  transactions: BankTransaction[],
  companyId: string
): Promise<BankTransaction[]> {
  const { data, error } = await supabase.functions.invoke('ai-bank-categorization', {
    body: {
      transactions: transactions.map(t => ({
        description: t.description,
        amount: t.amount,
        date: t.transaction_date
      })),
      company_id: companyId
    }
  });

  if (error || !data) return transactions;

  // Appliquer les catégories suggérées
  return transactions.map((t, index) => ({
    ...t,
    category: data.categories[index]?.category,
    suggested_account: data.categories[index]?.account_number,
    ai_confidence: data.categories[index]?.confidence
  }));
}
```

##### 2.2. **Edge Function:** `supabase/functions/ai-bank-categorization/index.ts`

```typescript
const prompt = `
Tu es un expert-comptable. Catégorise ces transactions bancaires selon le plan comptable français (PCG).

Catégories possibles :
- "Ventes" → compte 707xxx
- "Achats fournitures" → compte 607xxx
- "Frais bancaires" → compte 627xxx
- "Salaires" → compte 641xxx
- "Charges sociales" → compte 645xxx
- "Loyer" → compte 613xxx
- "Électricité / Eau" → compte 606xxx
- "Impôts et taxes" → compte 635xxx
- "Remboursement emprunt" → compte 164xxx
- "Autre"

Pour chaque transaction, retourne :
{
  "category": "Catégorie",
  "account_number": "6XXXXX",
  "confidence": 85 (0-100)
}

Transactions :
${transactions.map((t, i) => `${i}. ${t.description} - ${t.amount}€ le ${t.date}`).join('\n')}
`
```

##### 2.3. **UI:** Afficher suggestions dans la table des transactions

```tsx
<TableCell>
  {transaction.suggested_account && (
    <Badge variant="outline" className="bg-primary/5">
      ✨ {transaction.suggested_account}
      <span className="text-xs ml-1">({transaction.ai_confidence}%)</span>
    </Badge>
  )}
</TableCell>
```

---

### 📌 **Phase 3: Assistant CassKai enrichi**

#### **Améliorations à apporter:**

##### 3.1. **Context enrichi du plan comptable**

Modifier `ai-assistant/index.ts` pour injecter le plan comptable dans le prompt système :

```typescript
async function getCompanyContext(companyId: string): Promise<CompanyContext> {
  // Récupérer les comptes actifs
  const { data: accounts } = await supabase
    .from('chart_of_accounts')
    .select('account_number, account_name, account_class')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .limit(50);

  // Récupérer les dernières écritures
  const { data: recentEntries } = await supabase
    .from('journal_entries')
    .select('entry_number, entry_date, description, total_debit')
    .eq('company_id', companyId)
    .order('entry_date', { ascending: false })
    .limit(10);

  return {
    id: companyId,
    accounts: accounts || [],
    recent_entries: recentEntries || [],
    // ... autres données
  };
}

// Dans le système prompt
const enrichedPrompt = `
${SYSTEM_PROMPT}

📊 Contexte entreprise actuel :
- Plan comptable : ${context.accounts.map(a => `${a.account_number} ${a.account_name}`).join(', ')}
- Dernières écritures : ${context.recent_entries.map(e => e.entry_number).join(', ')}
- Alertes en cours : ${context.alerts.length} alertes

Utilise ces données pour personnaliser tes réponses.
`;
```

##### 3.2. **Actions contextuelles avancées**

```typescript
// Exemple d'actions enrichies
if (query.includes('créer écriture') && context.lastInvoice) {
  return {
    message: `Je peux générer l'écriture comptable pour ta dernière facture (${context.lastInvoice.number}). Elle sera équilibrée automatiquement avec les comptes 411, 707 et 44571.`,
    actions: [{
      type: 'generate_journal_entry',
      label: 'Générer l\'écriture automatiquement',
      payload: { invoiceId: context.lastInvoice.id }
    }]
  };
}
```

##### 3.3. **Composant UI Assistant (à créer)**

`src/components/ai/AIAssistantChat.tsx`

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Sparkles, Send } from 'lucide-react';
import { aiService } from '@/services/aiService';

export function AIAssistantChat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    setLoading(true);
    const response = await aiService.sendMessage(conversationId, input);
    setMessages([...messages, { role: 'user', content: input }, { role: 'assistant', content: response.message }]);
    setInput('');
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg">
      <div className="flex items-center gap-2 p-4 border-b bg-primary/5">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Assistant CassKai</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Pose une question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} disabled={loading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📁 Fichiers à créer/modifier

### Nouveaux fichiers

- [ ] `supabase/functions/ai-document-analysis/index.ts` (Edge Function)
- [ ] `supabase/functions/ai-bank-categorization/index.ts` (Edge Function)
- [ ] `src/services/aiDocumentAnalysisService.ts`
- [ ] `src/components/ai/AIAssistantChat.tsx`
- [ ] `src/types/ai-document.types.ts`

### Fichiers à modifier

- [ ] `src/components/accounting/JournalEntryForm.tsx` — Ajouter bouton IA
- [ ] `src/services/bankImportService.ts` — Ajouter catégorisation IA
- [ ] `supabase/functions/ai-assistant/index.ts` — Enrichir context
- [ ] `src/services/aiService.ts` — Ajouter méthodes document analysis

---

## 🔐 Sécurité & Bonnes Pratiques

### 1. **Validation stricte des données extraites**
```typescript
// TOUJOURS valider avant insertion en base
const validation = validateExtractedEntry(aiResult);
if (!validation.valid) {
  // Afficher warning + laisser l'user corriger
}
```

### 2. **Audit trail complet**
```typescript
await auditService.logAsync({
  action: 'ai_document_analysis',
  entityType: 'journal_entry',
  metadata: {
    original_file: fileName,
    confidence_score: result.confidence_score,
    extracted_data: result.raw_extraction,
    manual_edits: userEdits // Si l'user a modifié après
  }
});
```

### 3. **Gestion des coûts OpenAI**
```typescript
// Tracker les tokens utilisés
const usage = {
  prompt_tokens: response.usage.prompt_tokens,
  completion_tokens: response.usage.completion_tokens,
  total_cost: calculateCost(response.usage) // GPT-4: ~$0.03/1K tokens
};

// Stocker dans table `ai_usage_logs`
await supabase.from('ai_usage_logs').insert({
  company_id: companyId,
  feature: 'document_analysis',
  tokens_used: usage.total_cost,
  created_at: new Date()
});
```

### 4. **Fallback si OpenAI est down**
```typescript
try {
  const aiResult = await analyzeWithOpenAI(file);
} catch (error) {
  // Fallback : OCR basique + parsing règles
  const fallbackResult = await basicOCR(file);
  return { ...fallbackResult, confidence_score: 50 }; // Score réduit
}
```

---

## 🚀 Ordre de Priorité

### Sprint 1 (Semaine 1-2) — **Analyse de documents**
1. Créer Edge Function `ai-document-analysis`
2. Créer service frontend `aiDocumentAnalysisService`
3. Modifier `JournalEntryForm` pour ajouter le bouton IA
4. Tests : Upload PDF facture → Vérifier écriture générée

### Sprint 2 (Semaine 3) — **Import bancaire intelligent**
1. Créer Edge Function `ai-bank-categorization`
2. Modifier `bankImportService` pour appeler l'IA
3. UI : Afficher suggestions dans table transactions
4. Tests : Import CSV → Vérifier catégories

### Sprint 3 (Semaine 4) — **Assistant enrichi**
1. Enrichir context dans `ai-assistant/index.ts`
2. Créer composant `AIAssistantChat`
3. Ajouter au layout principal (sidebar/modal)
4. Tests : Questions contextuelles → Vérifier réponses précises

---

## 📊 Métriques de Succès

### KPIs à suivre
- **Taux d'adoption :** % d'utilisateurs utilisant l'analyse IA (objectif >30%)
- **Temps de saisie :** Réduction de 60% du temps de création d'écriture
- **Précision IA :** Confidence score moyen >85%
- **Taux d'édition :** % d'écritures modifiées après pré-remplissage (<20%)
- **Coût OpenAI :** <5€/utilisateur/mois

### Feedback utilisateur
- Ajouter bouton "👍 / 👎" sur chaque suggestion IA
- Stocker dans table `ai_feedback` pour améliorer les prompts

---

## 💡 Extensions Futures

### Phase 4 (Q2 2026)
- **OCR multi-langues** : Support EN, DE, ES
- **Apprentissage personnalisé** : Fine-tuning sur données historiques de l'entreprise
- **Analyse prédictive** : "Cette dépense est inhabituellement élevée"
- **Chatbot vocal** : Dictée des écritures comptables

### Phase 5 (Q3 2026)
- **GitHub Models vs OpenAI** : Comparatif coût/qualité
- **Agents autonomes** : "Génère automatiquement toutes les écritures du mois"
- **Intégration RAG** : Base de connaissance comptable CassKai

---

## ❓ Questions en Suspens

1. **Budget OpenAI mensuel ?** (Recommandation : $500/mois pour 100 users)
2. **Modèle préféré ?** GPT-4o (cher mais précis) vs GPT-4o-mini (rapide et économique)
3. **Stocker les documents uploadés ?** Oui dans Supabase Storage avec politique de suppression 30j
4. **Validation manuelle obligatoire ?** Oui pour écritures >1000€ (compliance)

---

**Prochaine étape :** Valider ce plan avec l'équipe, puis démarrer Sprint 1 !

*Document créé par GitHub Copilot — 29 janvier 2026*
