# 🚀 PLAN D'IMPLÉMENTATION IA - CASSKAI
**Deadline:** Février 2026  
**Objectif:** Faire de CassKai l'appli IA la plus utile au monde  

---

## 📋 QUICK WINS (À faire CETTE SEMAINE - 10h travail)

### 1. **Intégrer Document Analysis dans JournalEntryForm** ✨
**Fichier:** `src/components/accounting/JournalEntryForm.tsx`  
**Effort:** 3h  
**ROI:** +20% productivité  

**À implémenter:**
```typescript
// Importer le service
import { aiDocumentAnalysisService } from '@/services/ai/aiDocumentAnalysisService';

// Ajouter state
const [aiAnalyzing, setAiAnalyzing] = useState(false);
const [aiSuggestion, setAiSuggestion] = useState(null);

// Handler upload
const handleDocumentUpload = async (file: File) => {
  setAiAnalyzing(true);
  try {
    const result = await aiDocumentAnalysisService.analyzeDocument(
      file,
      currentCompany!.id,
      'invoice'
    );

    if (result.success && result.data) {
      // Pré-remplir les champs
      form.setValue('description', result.data.description);
      form.setValue('entryDate', new Date(result.data.entry_date));
      
      // Ajouter les lignes
      result.data.lines.forEach((line, idx) => {
        form.setValue(`lines.${idx}.debitAmount`, line.debit_amount);
        form.setValue(`lines.${idx}.creditAmount`, line.credit_amount);
      });
      
      setAiSuggestion(result.data);
      toastSuccess(`✨ ${result.data.confidence_score}% confiance`);
    }
  } finally {
    setAiAnalyzing(false);
  }
};

// UI avant le champ de description
<div className="col-span-2 border-2 border-dashed border-purple-200 rounded-lg p-4 bg-purple-50">
  <div className="flex items-center gap-2 mb-2">
    <Sparkles className="w-5 h-5 text-purple-600" />
    <h3 className="font-semibold text-purple-900">Analyse automatique par IA</h3>
  </div>
  <p className="text-sm text-purple-700 mb-3">
    Uploadez une facture (PDF, JPG, PNG) pour pré-remplir automatiquement.
  </p>
  
  <input
    type="file"
    id="ai-doc-upload"
    accept=".pdf,.jpg,.jpeg,.png"
    className="hidden"
    onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0])}
    disabled={aiAnalyzing || !currentCompany}
  />
  
  <Button asChild variant="outline">
    <label htmlFor="ai-doc-upload" className="cursor-pointer">
      {aiAnalyzing ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyse...</>
      ) : (
        <><Upload className="w-4 h-4 mr-2" /> Choisir document</>
      )}
    </label>
  </Button>

  {aiSuggestion && (
    <Alert className="mt-3 bg-purple-100 border-purple-300">
      <AlertCircle className="w-4 h-4" />
      <AlertDescription className="text-sm">
        <strong>Facture {aiSuggestion.raw_extraction.invoice_number}</strong><br/>
        Fournisseur: {aiSuggestion.raw_extraction.supplier_name}<br/>
        Montant: {aiSuggestion.raw_extraction.total_ttc}€<br/>
        <span className="text-purple-700 font-medium">
          Confiance: {aiSuggestion.confidence_score}%
        </span>
      </AlertDescription>
    </Alert>
  )}
</div>
```

**Tests à passer:**
- [ ] Upload PDF → pré-remplissage OK
- [ ] Upload JPG → pré-remplissage OK
- [ ] Fichier invalide → erreur gracieuse
- [ ] Timeout → message d'erreur

---

### 2. **Créer tests E2E Chat Assistant** 🧪
**Fichier:** `e2e/ai-assistant.spec.ts` (déjà créé!)  
**Effort:** 2h  
**ROI:** Confiance production  

**À faire:**
```bash
# Exécuter les tests
npm run test:e2e -- e2e/ai-assistant.spec.ts

# Ou en watch mode
npm run test:e2e:ui -- e2e/ai-assistant.spec.ts
```

**Tests inclus:**
- ✅ Widget display & open/close
- ✅ Message send/receive
- ✅ Suggestions display & click
- ✅ Actions navigation
- ✅ Error handling
- ✅ Accessibility (ARIA, keyboard)

**Commits:**
```bash
git add e2e/ai-assistant.spec.ts
git commit -m "test: add E2E tests for AI Chat Assistant"
```

---

### 3. **Implémenter Rate Limiting** 🛡️
**Fichier:** `supabase/functions/ai-assistant/index.ts`  
**Effort:** 2h  
**ROI:** -50% coûts OpenAI  

**À implémenter (après auth check):**
```typescript
// After user auth, add rate limit check
const { count: recentRequests } = await supabaseUser
  .from('ai_interactions')
  .select('*', { count: 'exact' })
  .eq('user_id', user.id)
  .gte('created_at', new Date(Date.now() - 5*60*1000).toISOString());

if (recentRequests && recentRequests > 10) {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please wait 5 minutes.',
      retryAfter: 300
    }),
    {
      status: 429,
      headers: { 
        ...corsHeaders,
        'Retry-After': '300',
        'Content-Type': 'application/json'
      }
    }
  );
}
```

**Tests:**
- [ ] 1ère requête OK
- [ ] 2-10 requêtes OK
- [ ] 11ème requête → 429 error
- [ ] Après 5min → OK

---

### 4. **Ajouter Caching Simple** ⚡
**Fichier:** `supabase/functions/ai-assistant/index.ts`  
**Effort:** 2h  
**ROI:** -70% coûts  

**À implémenter (avant OpenAI call):**
```typescript
// Sanitize query for cache key
const cacheKey = `ai:${company_id}:${query.toLowerCase().substring(0, 100)}`;

// Check cache
const { data: cached } = await supabaseAdmin
  .from('ai_cache')
  .select('response, created_at')
  .eq('key', cacheKey)
  .single();

if (cached) {
  const age = Date.now() - new Date(cached.created_at).getTime();
  if (age < 24 * 60 * 60 * 1000) { // 24h TTL
    console.log('[cache] HIT for:', cacheKey);
    return new Response(JSON.stringify(cached.response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }
}

// Call OpenAI
const aiResponse = await openai.chat.completions.create({...});

// Store in cache
if (aiResponse.choices[0]?.message?.content) {
  const responseData = JSON.parse(aiResponse.choices[0].message.content);
  
  await supabaseAdmin
    .from('ai_cache')
    .upsert({
      key: cacheKey,
      response: responseData,
      company_id,
      user_id: user.id,
      created_at: new Date().toISOString()
    });
}
```

**Migration SQL à créer:**
```sql
-- Create cache table
CREATE TABLE ai_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  response JSONB NOT NULL,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour rapide lookup
CREATE INDEX idx_ai_cache_key ON ai_cache(key);

-- Delete old cache entries (keep 3 mois)
CREATE OR REPLACE FUNCTION cleanup_ai_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_cache
  WHERE created_at < NOW() - INTERVAL '90 days'
  OR accessed_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 MEDIUM PRIORITY (Semaine 2-3 - 12h travail)

### 5. **Bank Categorization UI** 
**Fichier:** `src/components/banking/BankImportPreview.tsx`  
**Effort:** 4h  

Ajouter colonne suggestions dans le tableau import:
```tsx
<TableCell>
  {tx.suggested_account && (
    <Badge className="bg-blue-100 text-blue-900">
      ✨ {tx.suggested_account}
      <span className="text-xs ml-1">({tx.ai_confidence}%)</span>
    </Badge>
  )}
</TableCell>
```

### 6. **Conversation Persistence** 
**Fichier:** `src/services/aiService.ts`  
**Effort:** 3h  

Sauvegarder conversations dans `ai_conversations` table.

### 7. **Monitoring Dashboard** 
**Fichier:** `src/pages/admin/AIMetrics.tsx`  (nouveau)  
**Effort:** 5h  

Afficher:
- Coûts par jour/semaine/mois
- Top queries
- Error rate
- Cache hit rate

---

## 🚀 ADVANCED FEATURES (Mars - 20h travail)

### 8. **Copilot SDK Integration**
Ajouter explications de code + génération SQL avancée.

### 9. **Fine-tuning Model**
Entraîner sur données CassKai: factures, écritures, plans comptables.

### 10. **Voice Input**
Web Speech API + OpenAI Whisper pour dictée.

### 11. **Knowledge Base Personnalisée**
Chaque company = KB custom (SOPs, règles métier).

---

## ✅ TESTING CHECKLIST

### Avant de merger:
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Tests unitaires (créer si absent)
npm run test

# Tests E2E
npm run test:e2e -- e2e/ai-*.spec.ts

# Build
npm run build

# Vérifier pas de secrets en logs
grep -r "sk-" . --exclude-dir=node_modules
```

### En production:
- [ ] Monitor coûts OpenAI (alert si >$50/jour)
- [ ] Monitor error rate (alert si >5%)
- [ ] Monitor latence (alert si >10s)
- [ ] Checkup weekly usage

---

## 📊 SUCCESS METRICS

### Adoption:
- [ ] >30% utilisateurs ont utilisé Chat
- [ ] >10% utilisateurs ont uploadé documents
- [ ] >5% utilisateurs utilisent categorization suggestions

### Qualité:
- [ ] Confidence score moyen >85%
- [ ] Error rate <2%
- [ ] Support tickets <5/semaine

### Coûts:
- [ ] <$5/utilisateur/mois (vs budget $10)
- [ ] Cache hit rate >60%
- [ ] ROI: +40% productivité

---

## 🎁 BONUS: Revenue Features

Ces features peuvent être **Premium** ($99/mois):

### 1. **Expert Mode**
- Auto-generate journal entries
- Smart tax optimization
- Anomaly detection

### 2. **Autonomous Agent**
- "Generate my monthly entries"
- Automatic bank reconciliation
- Cash flow prediction

### 3. **Knowledge Base Pro**
- Custom KB for company
- AI training on company data
- Personalized suggestions

---

## 📅 TIMELINE

### FEV 4-10 (THIS WEEK) 🔥
- [x] Audit IA complet
- [ ] Intégrer Document Analysis UI (3h)
- [ ] Tests E2E Chat (2h)
- [ ] Rate limiting (2h)
- [ ] Caching (2h)
- **Total:** 9h
- **By:** Feb 10

### FEV 11-24 (NEXT 2 WEEKS)
- [ ] Bank Categorization UI (4h)
- [ ] Conversation persistence (3h)
- [ ] Monitoring dashboard (5h)
- [ ] All tests passing (2h)
- **Total:** 14h
- **By:** Feb 24

### MAR 1-30 (ADVANCED)
- [ ] Copilot SDK (5h)
- [ ] Fine-tuning (10h)
- [ ] Voice input (8h)
- [ ] KB custom (5h)
- **Total:** 28h
- **By:** Mar 30

---

## 🏁 GO-LIVE CHECKLIST

Before announcing to users:

- [ ] All E2E tests passing
- [ ] Zero critical bugs
- [ ] Load tested (100 concurrent users)
- [ ] Security audit passed
- [ ] Monitoring alerts configured
- [ ] Support team trained
- [ ] Documentation updated
- [ ] Demo recorded

---

## 📞 SUPPORT DURING ROLLOUT

**Team assignments:**
- AI bugs → Dev1
- User questions → Support
- Performance issues → Dev2
- Cost overruns → DevOps

**Escalation path:**
- 🟢 Green (normal) → Continue
- 🟡 Yellow (warning) → Investigate
- 🔴 Red (critical) → Pause + Debug

---

## 🎉 EXPECTED OUTCOMES

After implementing all features:

```
Before:          After:
─────────────────────────────────
Time/entry:  15min       →  5min    (-67%)
User smile:  😐          →  😍      (+100%)
Support tics: 😤         →  😎      (resolved)
Market lead: Similar     →  UNIQUE   (+infinity%)
```

**Goal:** CassKai becomes the #1 AI-powered accounting app in the world 🚀

---

**Ready to build?** Let's go! 💪

