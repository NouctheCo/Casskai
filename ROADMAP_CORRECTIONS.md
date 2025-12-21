# 🗓️ ROADMAP CORRECTIONS - CASSKAI ERP

## Vue d'Ensemble

**Objectif:** Rendre CassKai commercialisable dans 15-20 jours  
**Équipe:** 2-3 développeurs + 1 designer  
**Budget Estimé:** €28,000  
**Méthodologie:** Sprints Agile de 3-5 jours

---

## 🔥 SPRINT 0: CORRECTIONS CRITIQUES
**Durée:** 7 jours (Jours 1-7)  
**Effort:** 112 heures dev  
**Équipe:** 2 devs full-time  
**Priorité:** BLOQUANT

### 🎯 Objectifs Sprint
1. ✅ Application conforme RGPD
2. ✅ Traductions fonctionnelles EN/ES
3. ✅ SYSCOHADA opérationnel
4. ✅ TypeScript strict phase 1
5. ✅ Marketing aligné avec réalité produit

### 📋 Tâches Détaillées

#### Tâche 1.1: Cookie Consent Banner (RGPD)
**Assigné à:** Dev Frontend  
**Effort:** 8h  
**Priorité:** 🔥 CRITIQUE

```typescript
// Fichier: src/components/CookieConsentBanner.tsx
import CookieConsent from 'react-cookie-consent';

export const CookieBanner = () => {
  return (
    <CookieConsent
      location="bottom"
      buttonText="J'accepte"
      declineButtonText="Je refuse"
      enableDeclineButton
      cookieName="casskai_cookie_consent"
      onAccept={() => {
        initAnalytics();
        logConsent('accepted');
      }}
      onDecline={() => {
        disableAnalytics();
        logConsent('declined');
      }}
    >
      Nous utilisons des cookies pour améliorer votre expérience.
      <a href="/privacy">En savoir plus</a>
    </CookieConsent>
  );
};
```

**Tests:**
- [ ] Banner s'affiche première visite
- [ ] Accepter → Analytics activés
- [ ] Refuser → Analytics désactivés
- [ ] Consentement persisté en localStorage
- [ ] Conforme RGPD (révocable)

---

#### Tâche 1.2: Traductions Complètes EN/ES
**Assigné à:** Dev Backend + Traducteur  
**Effort:** 12h  
**Priorité:** 🔥 CRITIQUE

```bash
# Script automation traduction
# Fichier: scripts/translate-missing-keys.js

const { Translator } = require('@deepl/translate');
const fs = require('fs');

const translator = new Translator(process.env.DEEPL_API_KEY);

async function translateMissingKeys() {
  const fr = JSON.parse(fs.readFileSync('src/i18n/locales/fr.json'));
  const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json'));
  const es = JSON.parse(fs.readFileSync('src/i18n/locales/es.json'));
  
  // Identifier clés manquantes
  const missingEN = findMissingKeys(fr, en);
  const missingES = findMissingKeys(fr, es);
  
  // Traduire automatiquement
  for (const key of missingEN) {
    const translated = await translator.translateText(
      getNestedValue(fr, key),
      'fr',
      'en-US'
    );
    setNestedValue(en, key, translated.text);
  }
  
  // Même process pour ES
  // ...
  
  // Sauvegarder
  fs.writeFileSync('src/i18n/locales/en.json', JSON.stringify(en, null, 2));
  fs.writeFileSync('src/i18n/locales/es.json', JSON.stringify(es, null, 2));
}
```

**Tests:**
- [ ] EN.json = 100% des clés FR
- [ ] ES.json = 100% des clés FR
- [ ] Validation native speaker (EN + ES)
- [ ] Test interface dans les 3 langues
- [ ] Pas de clés manquantes dans console

**Ressources:**
- Budget DeepL: €20/500k caractères
- Validation native: 2h x €50/h = €100

---

#### Tâche 1.3: Implémentation SYSCOHADA
**Assigné à:** Dev Backend  
**Effort:** 20h  
**Priorité:** 🔥 CRITIQUE

```typescript
// Fichier: src/data/syscohada.ts
export const SYSCOHADA_REVISED_2017 = {
  classe1: {
    name: 'Comptes de ressources durables',
    accounts: {
      '10': {
        code: '10',
        name: 'Capital',
        children: {
          '101': 'Capital social',
          '1011': 'Capital souscrit, appelé, versé',
          '1012': 'Capital souscrit, non appelé',
          // ... 200+ comptes
        }
      },
      // ...
    }
  },
  // Classes 2-8 complètes
};

// Adapter formulaires
export const getChartTemplateByCountry = (country: string) => {
  const ohada = ['BJ', 'BF', 'CI', 'ML', 'NE', 'SN', 'TG', 'CM', 'CF', 'TD', 'CG', 'GQ', 'GA'];
  
  if (ohada.includes(country)) {
    return SYSCOHADA_REVISED_2017;
  }
  
  return PCG_FRANCE; // Défaut
};
```

**Livrables:**
- [ ] Fichier syscohada.ts complet (200+ comptes)
- [ ] Adaptation formulaires création compte
- [ ] Détection automatique pays OHADA
- [ ] Import/Export FEC adapté SYSCOHADA
- [ ] Documentation PDF SYSCOHADA pour users

**Ressources:**
- Référence: Plan SYSCOHADA révisé 2017 (OHADA)
- Validation: Expert-comptable Afrique (3h x €80/h = €240)

---

#### Tâche 1.4: TypeScript Strict Mode Phase 1
**Assigné à:** Dev Lead  
**Effort:** 16h  
**Priorité:** ⚠️ HAUTE

```typescript
// tsconfig.json - Avant
{
  "compilerOptions": {
    "strict": false  // ❌
  }
}

// tsconfig.json - Après
{
  "compilerOptions": {
    "strict": true,  // ✅
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Stratégie Migration:**
1. Activer strict dans tsconfig
2. Fix erreurs par ordre de priorité:
   - `/src/services` (30+ erreurs estimées)
   - `/src/contexts` (15+ erreurs)
   - `/src/hooks` (10+ erreurs)
3. Remplacer `any` par types précis
4. Ajouter eslint rule `no-explicit-any: error`

**Tests:**
- [ ] Build TypeScript sans erreurs
- [ ] Aucun `any` explicite restant
- [ ] Tests unitaires passent
- [ ] Application fonctionne identiquement

---

#### Tâche 1.5: Marketing Aligné Réalité
**Assigné à:** Product Owner  
**Effort:** 6h  
**Priorité:** ⚠️ HAUTE

**Actions:**
- [ ] Audit landing page vs features réelles
- [ ] Retirer "IA avancée" (temporaire)
- [ ] Ajouter "Beta" sur modules incomplets
- [ ] Roadmap publique Q1 2026
- [ ] Mise à jour pitch deck
- [ ] Brief équipe commerciale

**Livrables:**
- Landing page honnête
- Documentation commerciale ajustée
- FAQ avec roadmap transparente

---

#### Tâche 1.6: RGPD Compliance Tests
**Assigné à:** Dev Backend + Legal  
**Effort:** 10h  
**Priorité:** 🔥 CRITIQUE

```typescript
// Tests RGPD
describe('RGPD Compliance', () => {
  test('Export données utilisateur', async () => {
    const userId = 'test-user';
    const data = await exportUserData(userId);
    
    expect(data).toHaveProperty('profile');
    expect(data).toHaveProperty('companies');
    expect(data).toHaveProperty('transactions');
    expect(data).toHaveProperty('invoices');
    // Format JSON téléchargeable
  });
  
  test('Suppression compte complète', async () => {
    const userId = 'test-user';
    await deleteUserAccount(userId);
    
    // Vérifier cascade delete
    const profile = await supabase.from('user_profiles').select().eq('id', userId);
    expect(profile.data).toHaveLength(0);
    
    // Anonymisation données comptables (légal)
    const entries = await supabase.from('journal_entries').select().eq('created_by', userId);
    entries.forEach(entry => {
      expect(entry.created_by).toBe('DELETED_USER');
    });
  });
});
```

**Tests Requis:**
- [ ] Export données JSON complet
- [ ] Suppression compte + cascade
- [ ] Anonymisation données liées
- [ ] Révocation consentement cookies
- [ ] Registre des traitements à jour

---

### 📊 Métriques Success Sprint 0

| Métrique | Avant | Cible | Critique |
|----------|-------|-------|----------|
| Cookie Consent | ❌ Absent | ✅ Actif | 🔥 |
| Traductions EN | 27% | 95%+ | 🔥 |
| Traductions ES | 25% | 95%+ | 🔥 |
| SYSCOHADA | 0% | 100% | 🔥 |
| TypeScript Strict | 0% | 80%+ | ⚠️ |
| RGPD Tests | 0/2 | 2/2 | 🔥 |

**Définition of Done:**
✅ Toutes métriques cibles atteintes  
✅ Tests end-to-end passent  
✅ Validation avocat CGU/CGV reçue  
✅ Demo fonctionnelle 3 langues

---

## ⚠️ SPRINT 1: CORRECTIONS MAJEURES
**Durée:** 10 jours (Jours 8-17)  
**Effort:** 160 heures dev  
**Équipe:** 2 devs + 1 designer  
**Priorité:** HAUTE

### 🎯 Objectifs Sprint
1. ✅ Bundle size < 800 KB
2. ✅ Open Banking MVP fonctionnel
3. ✅ IA catégorisation basique
4. ✅ Lighthouse score ≥ 90
5. ✅ Onboarding interactif

### 📋 Tâches Détaillées

#### Tâche 2.1: Optimisation Bundle
**Assigné à:** Dev Frontend  
**Effort:** 12h  
**Priorité:** ⚠️ HAUTE

```typescript
// vite.config.ts - Optimisations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Lazy load librairies lourdes
          'pdf': ['jspdf', 'jspdf-autotable'],
          'excel': ['exceljs'],
          'ml': ['@tensorflow/tfjs'],
          'charts': ['recharts', 'd3']
        }
      }
    }
  }
});

// Lazy loading dans composants
const PDFGenerator = lazy(() => import('@/services/pdfService'));
const ExcelExport = lazy(() => import('@/services/excelService'));
```

**Objectifs:**
- vendor.js: 1.97 MB → < 800 KB
- documents.js: 652 KB → < 400 KB
- Lighthouse Performance: ~78 → ≥ 90

**Tests:**
- [ ] Build size total < 2 MB (gzipped)
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Pas de régression fonctionnelle

---

#### Tâche 2.2: Open Banking Integration (MVP)
**Assigné à:** Dev Backend  
**Effort:** 24h  
**Priorité:** ⚠️ HAUTE

```typescript
// Edge Function Supabase: bridge-connect
import { Bridge } from 'bridge-api-client';

export async function connectBankAccount(userId: string) {
  const bridge = new Bridge({
    clientId: process.env.BRIDGE_CLIENT_ID!,
    clientSecret: process.env.BRIDGE_CLIENT_SECRET!
  });
  
  // 1. Créer session utilisateur
  const session = await bridge.connect.createSession({
    user_uuid: userId,
    prefill_email: user.email
  });
  
  // 2. Retourner URL connexion banque
  return {
    connect_url: session.redirect_url,
    session_id: session.id
  };
}

// Webhook réception transactions
export async function onTransactionsReceived(payload: BridgeWebhook) {
  const { transactions, account_id } = payload;
  
  // 3. Sauvegarder transactions en base
  await supabase.from('bank_transactions').insert(
    transactions.map(t => ({
      account_id,
      amount: t.amount,
      description: t.description,
      date: t.date,
      category: await categorizeWithAI(t.description) // 🤖 IA
    }))
  );
}
```

**Livrables:**
- [ ] Connexion 3 banques françaises (test)
- [ ] Import automatique transactions
- [ ] Webhook Bridge configuré
- [ ] UI connexion bancaire
- [ ] Tests avec compte sandbox

**Budget:**
- Bridge API: €99/mois (plan Starter)
- Tests: 100 connexions incluses

---

#### Tâche 2.3: IA Catégorisation Transactions
**Assigné à:** Dev Backend  
**Effort:** 16h  
**Priorité:** ⚠️ HAUTE

```typescript
// Edge Function: categorize-transaction
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const CATEGORIES_COMPTABLES = [
  '6061 - Fournitures non stockables (eau, énergie)',
  '6064 - Fournitures administratives',
  '6226 - Honoraires',
  '6251 - Voyages et déplacements',
  '6256 - Missions',
  // ... 50+ catégories PCG
];

export async function categorizeTransaction(description: string, amount: number) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{
      role: 'system',
      content: `Tu es un expert-comptable. Catégorise cette transaction selon le PCG.
      Retourne: { category: '6XXX - Description', confidence: 0.XX }`
    }, {
      role: 'user',
      content: `Transaction: "${description}", Montant: ${amount}€`
    }],
    temperature: 0.3 // Faible = + cohérent
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

**Tests:**
- [ ] 50 transactions types testées
- [ ] Précision ≥ 85% (validation comptable)
- [ ] Temps réponse < 2s
- [ ] Gestion erreurs API
- [ ] UI suggestions + correction utilisateur

**Budget:**
- OpenAI: €20/mois (1M tokens GPT-4-turbo)
- ~$0.01 par catégorisation

---

#### Tâche 2.4: OCR Factures (Rossum.ai)
**Assigné à:** Dev Backend  
**Effort:** 20h  
**Priorité:** ⚠️ MOYENNE

```typescript
// Service: src/services/ocrService.ts
import Rossum from '@rossum/api-client';

export async function extractInvoiceData(pdfFile: File) {
  const rossum = new Rossum(process.env.ROSSUM_API_KEY);
  
  // 1. Upload document
  const document = await rossum.documents.create({
    file: pdfFile,
    queue_id: process.env.ROSSUM_QUEUE_ID
  });
  
  // 2. Attendre extraction (webhook ou polling)
  const annotation = await rossum.annotations.get(document.annotation_id);
  
  // 3. Parser résultats
  return {
    supplier: annotation.content.find(f => f.schema_id === 'supplier_name').value,
    invoice_number: annotation.content.find(f => f.schema_id === 'invoice_id').value,
    date: annotation.content.find(f => f.schema_id === 'date_issue').value,
    total_amount: annotation.content.find(f => f.schema_id === 'amount_total').value,
    vat_amount: annotation.content.find(f => f.schema_id === 'amount_vat').value,
    line_items: parseLineItems(annotation.content)
  };
}
```

**Tests:**
- [ ] 10 factures PDF types testées
- [ ] Précision extraction ≥ 90%
- [ ] Gestion PDF scannés + natifs
- [ ] UI upload + validation
- [ ] Pré-remplissage formulaire facture

**Budget:**
- Rossum.ai: €199/mois (500 documents)
- Alternative gratuite: Mindee (1000 docs/mois)

---

#### Tâche 2.5: Onboarding Interactif
**Assigné à:** Dev Frontend + Designer  
**Effort:** 16h  
**Priorité:** ⚠️ HAUTE

```typescript
// Component: src/components/OnboardingTour.tsx
import Joyride from 'react-joyride';

const ONBOARDING_STEPS = [
  {
    target: '.dashboard',
    content: '👋 Bienvenue sur CassKai ! Voici votre tableau de bord.',
    placement: 'center'
  },
  {
    target: '.sidebar-accounting',
    content: '📊 Accédez à votre comptabilité ici.',
    placement: 'right'
  },
  {
    target: '.quick-actions',
    content: '⚡ Actions rapides : créer une facture, une écriture...',
    placement: 'bottom'
  },
  // ... 10 étapes totales
];

export const OnboardingTour = () => {
  const [run, setRun] = useState(!localStorage.getItem('onboarding_completed'));
  
  return (
    <Joyride
      steps={ONBOARDING_STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={({ status }) => {
        if (status === 'finished' || status === 'skipped') {
          localStorage.setItem('onboarding_completed', 'true');
          setRun(false);
        }
      }}
    />
  );
};
```

**Livrables:**
- [ ] 10 étapes tour guidé
- [ ] Tooltips contextuels (20+)
- [ ] Vidéos tutorielles embarquées (3)
- [ ] Option "Refaire le tour"
- [ ] Tests avec 5 nouveaux utilisateurs

---

#### Tâche 2.6: Rate Limiting & Sécurité
**Assigné à:** Dev Backend  
**Effort:** 10h  
**Priorité:** ⚠️ HAUTE

```typescript
// Supabase Edge Function middleware
export const rateLimitMiddleware = async (req: Request) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const key = `ratelimit:${ip}`;
  
  // Redis ou Supabase cache
  const attempts = await redis.incr(key);
  await redis.expire(key, 900); // 15 minutes
  
  if (attempts > 100) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: { 'Retry-After': '900' }
    });
  }
  
  return null; // Continue
};

// Protection brute force login
export const loginRateLimit = async (email: string) => {
  const key = `login:${email}`;
  const attempts = await redis.incr(key);
  
  if (attempts > 5) {
    await redis.expire(key, 1800); // 30 minutes block
    throw new Error('Trop de tentatives. Réessayez dans 30 minutes.');
  }
  
  await redis.expire(key, 300); // 5 minutes window
};
```

**Tests:**
- [ ] 100 requêtes API = OK
- [ ] 101ème requête = 429 Rate Limit
- [ ] 5 tentatives login = blocage 30min
- [ ] Alertes Sentry si abus détecté
- [ ] Whitelist IPs équipe

---

### 📊 Métriques Success Sprint 1

| Métrique | Avant | Cible | Status |
|----------|-------|-------|--------|
| Bundle Size | 1.97 MB | <800 KB | ⚠️ |
| Lighthouse | 78 | ≥90 | ⚠️ |
| Open Banking | 0% | MVP (3 banques) | ⚠️ |
| IA Catégorisation | 0% | ≥85% précision | ⚠️ |
| OCR Factures | 0% | ≥90% précision | ⚠️ |
| Onboarding | Absent | 10 étapes | ⚠️ |
| Rate Limiting | Absent | Actif | ⚠️ |

**Définition of Done:**
✅ Toutes métriques cibles atteintes  
✅ Tests E2E passent (Playwright)  
✅ Beta testeurs (10) satisfaits (≥8/10)  
✅ Pas de régression fonctionnelle

---

## 💡 SPRINT 2: AMÉLIORATIONS CONTINUES
**Durée:** 15 jours (Jours 18-32)  
**Effort:** 240 heures dev  
**Équipe:** 3 devs + 1 designer  
**Priorité:** MOYENNE

### 🎯 Objectifs Sprint
1. ✅ Mobile app React Native (MVP)
2. ✅ Tests coverage ≥ 70%
3. ✅ Documentation API publique
4. ✅ Marketplace extensions (beta)
5. ✅ WhatsApp Business integration

### 📋 Tâches Highlights

#### Tâche 3.1: Mobile App React Native
**Effort:** 80h (2 devs)  
**Budget:** €8,000

- [ ] Init React Native avec Expo
- [ ] Réutiliser services Supabase
- [ ] Navigation native
- [ ] Auth biométrique
- [ ] Notifications push
- [ ] Build iOS + Android beta

#### Tâche 3.2: Tests Coverage
**Effort:** 40h  
**Budget:** €4,000

- [ ] Tests unitaires services (Vitest)
- [ ] Tests E2E flux critiques (Playwright)
- [ ] Tests performance (Lighthouse CI)
- [ ] Tests sécurité (OWASP ZAP)
- [ ] Coverage report automatique

#### Tâche 3.3: Documentation API
**Effort:** 32h  
**Budget:** €3,200

- [ ] OpenAPI / Swagger spec
- [ ] Documentation endpoints
- [ ] Exemples code (curl, JS, Python)
- [ ] Webhooks documentation
- [ ] Postman collection

#### Tâche 3.4: WhatsApp Business
**Effort:** 56h  
**Budget:** €5,600

- [ ] Intégration WhatsApp Business API
- [ ] Chatbot basique (FAQ)
- [ ] Notifications factures par WhatsApp
- [ ] Support client via WhatsApp
- [ ] Tests avec 20 utilisateurs pilotes

**ROI Potentiel:** +40% engagement en Afrique

---

## 📅 CALENDRIER RÉCAPITULATIF

| Sprint | Dates | Durée | Équipe | Budget | Livrables Clés |
|--------|-------|-------|--------|--------|----------------|
| **Sprint 0** | J1-J7 | 7j | 2 devs | €5,000 | RGPD, Traductions, SYSCOHADA |
| **Sprint 1** | J8-J17 | 10j | 2 devs + 1 designer | €8,000 | Performance, IA, Open Banking |
| **Sprint 2** | J18-J32 | 15j | 3 devs + 1 designer | €15,000 | Mobile, Tests, API, WhatsApp |
| **TOTAL** | - | **32 jours** | - | **€28,000** | Application Production-Ready |

---

## 🚦 JALONS & VALIDATIONS

### Jalon 1: Fin Sprint 0 (Jour 7)
**Validations:**
- [ ] Demo stakeholders
- [ ] Validation avocat CGU/CGV
- [ ] Tests utilisateurs internes (équipe)
- [ ] Go/No-Go Sprint 1

**Critères Go Sprint 1:**
✅ 100% corrections critiques complètes  
✅ Validation légale obtenue  
✅ Aucun bug bloquant

---

### Jalon 2: Fin Sprint 1 (Jour 17)
**Validations:**
- [ ] Beta privée (10 entreprises)
- [ ] Monitoring performances 7 jours
- [ ] Retours beta testeurs analysés
- [ ] Go/No-Go Beta publique

**Critères Go Beta Publique:**
✅ Lighthouse ≥ 90  
✅ Beta testeurs ≥ 8/10 satisfaction  
✅ Uptime ≥ 99%  
✅ Bugs critiques = 0

---

### Jalon 3: Fin Sprint 2 (Jour 32)
**Validations:**
- [ ] Beta publique (100+ entreprises)
- [ ] Mobile app TestFlight/Play Console
- [ ] Documentation complète
- [ ] Go/No-Go Lancement officiel

**Critères Go Lancement:**
✅ NPS Score ≥ 40  
✅ Taux conversion trial ≥ 15%  
✅ Churn mensuel < 5%  
✅ Support < 0.1 ticket/user/mois

---

## 📊 DASHBOARD SUIVI

### KPIs Quotidiens
```
✅ Build CI/CD: Success/Fail
✅ Tests coverage: X%
✅ Lighthouse score: X/100
✅ Bundle size: X KB
✅ Open tickets: X
✅ Vélocité sprint: X story points/jour
```

### KPIs Hebdomadaires
```
📈 Users beta actifs
📈 Feedback score moyen (/10)
📈 Bugs reportés vs résolus
📈 Disponibilité (uptime %)
📈 Temps réponse API (p95)
```

---

## 🎯 DÉFINITION OF DONE GLOBAL

### Application Production-Ready SI:
```
✅ Tous sprints complétés
✅ Toutes validations jalons passées
✅ Tests coverage ≥ 70%
✅ Lighthouse ≥ 90
✅ Uptime 7 jours ≥ 99%
✅ Beta publique 100+ users
✅ NPS Score ≥ 40
✅ 0 bugs critiques open
✅ Documentation complète
✅ Support client opérationnel
```

---

*Roadmap maintenue à jour: 24 Novembre 2025*  
*Responsable: Lead Dev / Product Owner*  
*Prochaine révision: Fin Sprint 0 (Jour 7)*
