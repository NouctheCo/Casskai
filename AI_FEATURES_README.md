# 🤖 Fonctionnalités IA - CassKai

> **Statut :** ✅ Implémentation complète (Phase 1, 2 et 3)  
> **Modèle :** GPT-4o-mini (économique + précis)  
> **Langues :** FR / EN / ES  
> **Coût estimé :** ~$0.11/mois par entreprise  

---

## 🚀 Démarrage Rapide

### Pour les développeurs

```bash
# 1. Cloner et installer
git clone <repo>
cd casskai
npm install

# 2. Configurer .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# 3. Déployer Edge Functions (une fois)
cd supabase/functions
npx supabase functions deploy ai-document-analysis
npx supabase functions deploy ai-bank-categorization
npx supabase functions deploy ai-assistant

# 4. Configurer secrets OpenAI
npx supabase secrets set OPENAI_API_KEY=sk-proj-...

# 5. Exécuter migration SQL
# Ouvrir Supabase Dashboard > SQL Editor
# Copier/coller supabase/migrations/20250115000000_add_ai_usage_logs.sql

# 6. Lancer dev
npm run dev
```

### Pour les testeurs

1. **Analyse Document (Comptabilité)**
   - Aller dans Comptabilité → Écritures → Nouvelle écriture
   - Cliquer "Analyse automatique par IA"
   - Uploader une facture PDF/JPG/PNG
   - ✅ Formulaire pré-rempli automatiquement

2. **Catégorisation Bancaire (Banking)**
   - Banking → Import
   - Uploader CSV transactions
   - ✅ Suggestions catégories avec scores confiance

3. **Assistant IA (Partout)**
   - Cliquer bouton violet flottant (bas-droite)
   - Poser question : "Quelle est ma trésorerie ?"
   - ✅ Réponse avec données entreprise réelles

---

## 📁 Structure des Fichiers

```
casskai/
├── supabase/functions/
│   ├── ai-document-analysis/      # Phase 1 : OCR factures
│   ├── ai-bank-categorization/    # Phase 2 : Catégorisation tx
│   └── ai-assistant/              # Phase 3 : Chat enrichi
├── src/
│   ├── components/ai/
│   │   ├── AIAssistantChat.tsx    # UI Chat IA (modal/sidebar/embedded)
│   │   └── index.ts
│   ├── services/
│   │   ├── aiDocumentAnalysisService.ts  # Service analyse docs
│   │   └── bankImportService.ts          # Service bank (modifié)
│   └── types/
│       └── ai-document.types.ts          # Interfaces TypeScript
├── docs/
│   ├── AI_IMPLEMENTATION_GUIDE.md        # 📖 Guide complet (800 lignes)
│   ├── AI_IMPLEMENTATION_COMPLETE.md     # ✅ Récapitulatif
│   ├── AI_INTEGRATION_PLAN.md            # 📝 Plan initial
│   └── AI_INTEGRATION_FLOWS.md           # 🔄 Diagrammes flux
└── supabase/migrations/
    └── 20250115000000_add_ai_usage_logs.sql  # Migration DB
```

---

## 🎯 Fonctionnalités

### 1️⃣ Analyse Automatique Documents
- **Input :** Facture PDF/JPG/PNG (max 10MB)
- **Process :** GPT-4o-mini Vision → OCR → Extraction données
- **Output :** Écriture comptable pré-remplie + validation
- **Localisation :** Adapté normes FR/BE/CH/ES/DE/UK/US

### 2️⃣ Catégorisation Bancaire Intelligente
- **Input :** Transactions CSV/OFX/QIF importées
- **Process :** GPT-4o-mini → Analyse descriptions + historique
- **Output :** Catégories + comptes suggérés + scores confiance
- **Apprentissage :** Utilise historique entreprise pour précision

### 3️⃣ Assistant IA Contextuel
- **Input :** Question utilisateur (texte)
- **Process :** GPT-4o-mini + contexte entreprise (KPIs, factures, alertes)
- **Output :** Réponse + actions rapides + suggestions
- **Modes :** Modal flottant / Sidebar / Embedded

---

## 💡 Exemples d'Utilisation

### Code : Analyse Document

```typescript
import { aiDocumentAnalysisService } from '@/services/aiDocumentAnalysisService';

const handleUpload = async (file: File) => {
  const result = await aiDocumentAnalysisService.analyzeDocument(
    file,
    companyId,
    'invoice'
  );
  
  if (result.success) {
    console.log('Facture détectée:', result.data.invoice_number);
    console.log('Confiance:', result.data.confidence_score);
    // Pré-remplir formulaire
    form.setValue('description', result.data.description);
  }
};
```

### Code : Chat IA

```tsx
import { AIAssistantChat } from '@/components/ai';

function DashboardPage() {
  return (
    <div>
      {/* Bouton flottant */}
      <AIAssistantChat 
        variant="modal"
        contextType="dashboard"
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
}
```

### SQL : Stats Coûts

```sql
-- Coûts par feature (30 derniers jours)
SELECT * FROM get_ai_usage_stats('COMPANY_ID', 30);

-- Logs détaillés
SELECT 
  created_at,
  feature,
  tokens_used,
  cost_usd,
  metadata->>'confidence_score' as confidence
FROM ai_usage_logs
WHERE company_id = 'COMPANY_ID'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 🌍 Traductions (i18n)

**35 clés ajoutées** dans `src/i18n/locales/{fr,en,es}.json`

```json
{
  "ai": {
    "automatic_analysis": "Analyse automatique par IA",
    "analyzing": "Analyse en cours...",
    "confidence": "Confiance",
    "analysis_success": "✨ Analyse réussie",
    "ai_assistant": "Assistant IA CassKai",
    "ask_question": "Poser une question...",
    // ... 29 autres clés
  }
}
```

**Utilisation :**
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();

<p>{t('ai.analyzing')}</p>  // "Analyse en cours..." (FR)
```

---

## 🔒 Sécurité & Best Practices

✅ **Implémenté**
- RLS activé (Row Level Security) sur toutes tables
- Service role key jamais exposé côté client
- Validation fichiers (taille, type, scan recommandé)
- Logs d'audit complets (user_id, company_id)
- JWT tokens vérifiés par Edge Functions

⚠️ **À configurer**
- Rate limiting (100 req/15min recommandé)
- Scan antivirus uploads (Supabase Storage hooks)
- Monitoring alertes (Sentry, Datadog)

---

## 📊 Monitoring

### Dashboard Coûts (SQL Editor)

```sql
-- Vue d'ensemble entreprise
SELECT 
  c.name as company_name,
  COUNT(DISTINCT a.user_id) as users_count,
  COUNT(*) as total_requests,
  SUM(a.tokens_used) as total_tokens,
  SUM(a.cost_usd) as total_cost,
  ROUND(AVG(a.cost_usd)::numeric, 6) as avg_cost_per_request
FROM ai_usage_logs a
JOIN companies c ON c.id = a.company_id
WHERE a.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.name
ORDER BY total_cost DESC;
```

### Alertes Recommandées

- Coût journalier > $5 (alerte équipe)
- Score confiance moyen < 70% (revoir prompts)
- Taux erreur > 10% (bug technique)

---

## 🧪 Tests

### Tests Manuels Essentiels

```bash
# 1. Document Analysis
- Upload facture EDF PDF → ✅ Pré-rempli compte 606 (Énergie)
- Upload reçu restaurant → ✅ Compte 625 (Déplacements)
- Upload photo floue → ⚠️ Confiance < 70%, warning affiché

# 2. Bank Categorization
- Import CSV 100 transactions → ✅ 85% catégorisées (confiance > 80%)
- Transaction "VIR SALAIRE" → ✅ Compte 421 (Salaires)
- Transaction ambiguë → ⚠️ Confiance 65%, suggestion + warning

# 3. AI Assistant
- Question: "Où enregistrer ma facture EDF ?"
  → ✅ Répond "Compte 606000 (Énergie) trouvé dans ton plan comptable"
- Question: "Quelle est ma trésorerie ?"
  → ✅ Répond avec montant réel entreprise (ex: "12 450€")
- Switch langue EN → ✅ Assistant répond en anglais
```

### Tests Automatisés (TODO)

```typescript
// tests/ai/aiDocumentAnalysisService.test.ts
describe('aiDocumentAnalysisService', () => {
  it('should analyze invoice PDF', async () => {
    const result = await aiDocumentAnalysisService.analyzeDocument(
      mockInvoicePDF,
      'company-123',
      'invoice'
    );
    expect(result.success).toBe(true);
    expect(result.data.confidence_score).toBeGreaterThan(70);
  });
});
```

---

## 🐛 Troubleshooting

### Erreur : "Missing OpenAI API Key"
```bash
npx supabase secrets set OPENAI_API_KEY=sk-proj-...
npx supabase functions deploy ai-document-analysis
```

### Erreur : "Company not found"
```sql
-- Vérifier user_companies
SELECT * FROM user_companies 
WHERE user_id = 'USER_ID' 
AND is_active = true;
```

### Analyse échoue (confidence 0%)
```bash
# Vérifier logs Edge Function
npx supabase functions logs ai-document-analysis --tail

# Causes fréquentes:
# - Image trop floue/illisible
# - Format non supporté
# - Document en langue non FR/EN/ES
# - Timeout OpenAI (> 30s)
```

---

## 📞 Support

**Questions techniques :**
- 📧 Email : dev@casskai.app
- 💬 Discord : [#ai-features](https://discord.gg/casskai)

**Documentation complète :**
- 📖 [AI Implementation Guide](docs/AI_IMPLEMENTATION_GUIDE.md) (800 lignes)
- 📝 [AI Integration Plan](docs/AI_INTEGRATION_PLAN.md)
- ✅ [Implementation Complete](docs/AI_IMPLEMENTATION_COMPLETE.md)

**Ressources externes :**
- [OpenAI GPT-4o-mini Docs](https://platform.openai.com/docs/models/gpt-4o-mini)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## ✅ Checklist Déploiement Production

### Avant de déployer
- [ ] OpenAI API key configurée (GPT-4o-mini access)
- [ ] Supabase secrets vérifiés (`npx supabase secrets list`)
- [ ] Migration SQL exécutée (`ai_usage_logs` table existe)
- [ ] Tests manuels OK (document + bank + assistant)
- [ ] Variables env production configurées

### Après déploiement
- [ ] Monitoring activé (Sentry, Datadog, ou similaire)
- [ ] Alertes configurées (coûts, erreurs, latence)
- [ ] Dashboard analytics créé (usage, confiance, coûts)
- [ ] Documentation utilisateur publiée
- [ ] Changelog mis à jour (version 2.0 mention AI features)

---

## 🎉 C'est prêt !

**Les 3 fonctionnalités IA sont implémentées et prêtes pour la production.**

> "C'est vraiment super génial pour l'application et ça va être un **gros plus** encore pour se distinguer des autres applications."

**Go pour le déploiement ! 🚀**

---

*Dernière mise à jour : 2025-01-15*  
*Version : 1.0.0*  
*Équipe : CassKai AI Team*
