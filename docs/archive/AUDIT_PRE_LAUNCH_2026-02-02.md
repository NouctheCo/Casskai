# 🔍 AUDIT PRÉ-LANCEMENT - 02 FÉVRIER 2026

## 📊 RÉSUMÉ EXÉCUTIF

**Status Global:** 🔴 **BLOCAGE CRITIQUE** - Lancement impossible sans corrections

- **Score Sécurité:** 3/10 ❌ (5 vulnerabilités npm détectées)
- **Score Code:** 8/10 ⚠️ (Lint OK, Types OK, mais sécurité faible)
- **Score Métier:** 5/10 ⚠️ (Devises + doublon de code)
- **Score Responsivité:** 7/10 ✅ (Modal amélioré, reste audit)
- **Score A11y:** 6/10 ⚠️ (À auditer complètement)

---

## 🚨 CRITIQUES À CORRIGER AVANT LANCEMENT

### 1. **Vulnerabilités de Sécurité NPM (BLOCKER)**

| Package | Severity | Issue | Solution |
|---------|----------|-------|----------|
| **jsPDF** | 🔴 CRITICAL | Local File Inclusion, XMP Injection, DOS | ⚠️ Upgrade to 4.1.0 (breaking) |
| **expr-eval** | 🟠 HIGH | Prototype Pollution x2 | ⚠️ No fix available - **REMPLACER** |
| **xlsx** | 🟠 HIGH | Prototype Pollution + ReDoS | ⚠️ No fix available - **REMPLACER** |
| **lodash** | 🟡 MODERATE | Prototype Pollution | ✅ Upgrade available |
| **lodash-es** | 🟡 MODERATE | Prototype Pollution | ✅ Upgrade available |

**ACTION IMMÉDIATE:**
```bash
# 1. Remplacer expr-eval (utilisé ?)
grep -r "expr-eval" src/

# 2. Évaluer remplacement xlsx → alternative
grep -r "xlsx\|sheetjs" src/

# 3. Patcher jsPDF (breaking change !)
npm audit fix --force

# 4. Upgrader lodash
npm install lodash@latest lodash-es@latest
```

---

### 2. **Duplication de Code DEVISES (Architecture)**

**Problème:** 4 services parallèles pour les devises + hooks contradictoires

```
src/services/
  ├─ currencyService.ts (✅ Bonne impl - SINGLETON)
  ├─ currencyIntegration.ts (❌ Duplication de logique)
  ├─ currencyConversionService.ts (❌ Duplication + rates approximatifs)
  ├─ exchangeRateService.ts (?)
  └─ pricingMultiCurrency.ts (❌ Duplication)

src/hooks/
  ├─ useCompanyCurrency.ts (✅ Bonne)
  ├─ useCurrency.ts (⚠️ 2 versions avec logique différente)
  └─ src/components/hooks/useCurrency.ts (❌ DUPLICATE BUGUÉ)
```

**Taux de change:**
- ✅ `currencyService.ts`: Taux via API (exchangerate-api.com)
- ❌ `currencyConversionService.ts`: Taux hardcodés approximatifs (**JAMAIS À JOUR**)
- ❌ `pricingMultiCurrency.ts`: Autre impl avec conversions

**ACTION:**
```
1. Garder: currencyService.ts (singleton) + useCompanyCurrency.ts
2. Supprimer: currencyConversionService.ts, pricingMultiCurrency.ts (DEAD CODE)
3. Fusionner: hooks useCurrency + s/components/hooks/useCurrency.ts
4. Uniformiser: Tous les composants → useCompanyCurrency() + currencyService.getInstance()
```

---

### 3. **Taux de Change Critiques = HARDCODÉS**

**Ligne 655.957 (EUR → XOF/XAF)** trouvée dans :
- `src/config/currencies.ts`
- `src/services/currencyConversionService.ts`
- `src/services/currencyService.ts`

**Risque:** Taux complètement obsolète → **Erreurs de calcul**

**ACTION:**
- Vérifier que `currencyService.ts` utilise l'API + cache (pas hardcoding)
- **Jamais** afficher prix EUR hardcodé → toujours calculer avec taux live

---

### 4. **Responsivité - AUDIT COMPLET REQUIS**

Composants à vérifier (ScheduleReportModal amélioré, mais reste travail):

```
src/components/
├─ accounting/ 
│  ├─ PeriodClosurePanel.tsx - Audit mobile/tablet
│  ├─ JournalEntryForm.tsx - Audit mobile/tablet
│  └─ OptimizedJournalEntriesTab.tsx - Audit mobile/tablet
├─ reports/
│  ├─ ScheduleReportModal.tsx ✅ Amélioré (w-[95vw] max-w-2xl)
│  └─ ReportGeneratorModal.tsx - À auditer
├─ invoicing/
│  ├─ InvoiceBuilder.tsx - À auditer
│  └─ InvoicePreview.tsx - À auditer (surtout PDF preview)
└─ ui/
   └─ Tous les modals génériques - À auditer
```

**Critères:**
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch targets: min 44px x 44px
- Overflow: Max-width wrapper responsive
- Fonts: Scalable sans dépassement

---

### 5. **Accessibilité WCAG 2.1 AA - AUDIT REQUIS**

**Zones à vérifier:**

1. **Navigation au clavier:**
   - Tab order dans tous les modals
   - Focus management (Dialog content focusable ?)
   - Esc key handling

2. **Labels & ARIA:**
   - Tous les inputs ont <label> associée (htmlFor)
   - aria-labels sur icônes seules
   - aria-describedby pour erreurs

3. **Contraste:**
   - Texte normal: 4.5:1 ratio (✅ Radix built-in)
   - Texte gros (18pt+): 3:1 ratio
   - Vérifier dark mode contraste

4. **Sémantique:**
   - Headings: h1 → h6 séquentiels (pas h1 → h3)
   - Listes: <ul>/<ol>/<li> pour listes
   - Buttons vs Links

---

### 6. **Closures de Période - Erreurs Multilangues** ✅

**Status:** Complété dans session précédente

- ✅ i18n translations (FR/EN/ES) pour messages closed period
- ✅ Error mapping in journalEntriesService.ts + useJournalEntries.ts
- ✅ Fallback mechanism

---

## ⚠️ AVERTISSEMENTS

### A. **Stripe Integration**
- Webhook signature verification ✅ en place
- Payment intent validation ✅ OK
- ⚠️ À vérifier: 3D Secure handling pour cartes non-EU
- ⚠️ À tester: Webhook retry logic si DB failure

### B. **RLS Policies**
- Period closure protection ✅ en DB triggers
- User isolation via company_id ✅ OK
- ⚠️ À auditer: ALL RLS policies pour trous de sécurité

### C. **Env Variables**
Critiques manquantes ?
- STRIPE_WEBHOOK_SECRET (prod, pas commit!)
- SUPABASE_SERVICE_KEY (JAMAIS client-side!)
- VITE_DEV_MODE (à OFF en prod!)

---

## 📝 CHECKLIST PRÉ-LANCEMENT

### Phase 1: Sécurité (48h)
- [ ] Fix npm audit vulns (expr-eval replacement, jsPDF upgrade)
- [ ] Remove dead code (currencyConversionService, etc.)
- [ ] RLS audit complet
- [ ] Env vars check (.env.production review)
- [ ] Secrets scan (git-secrets, truffleHog)

### Phase 2: Qualité (24h)
- [ ] Run all tests: `npm run test:run`
- [ ] Run E2E: `npm run test:e2e`
- [ ] Type-check: `npm run type-check`
- [ ] Lint: `npm run lint`
- [ ] Build: `npm run build` → check bundle size

### Phase 3: Accessibilité (24h)
- [ ] WAVE scan de landing page
- [ ] axe DevTools sur tous les modals
- [ ] Keyboard nav test (Tab, Esc, Enter)
- [ ] Screen reader test (NVDA/JAWS)

### Phase 4: Responsivité (16h)
- [ ] Mobile (320px, 375px, 425px)
- [ ] Tablet (768px, 1024px)
- [ ] Desktop (1280px, 1920px)
- [ ] Test sur devices réels (iOS + Android)

### Phase 5: Performance (16h)
- [ ] Lighthouse audit (mobile + desktop)
- [ ] Bundle analysis: `npm run build -- --analyze`
- [ ] Core Web Vitals targets:
  - LCP < 2.5s
  - CLS < 0.1
  - FID/INP < 100ms

### Phase 6: Métier (24h)
- [ ] Comptabilité: Formules + arrondis
- [ ] Facturations: Numéros séquentiels, TVA
- [ ] Devises: Conversions + taux live
- [ ] Paiements: Stripe 3D Secure, webhooks
- [ ] Closures: Period protection RLS

---

## 🚀 PLAN DE LANCEMENT

**Go/No-Go Decision:** Quand tous les critiques sont 🟢

```
T-0: Tous les critiques fixes + tests passent
T-1h: Deployment staging → smoke tests
T-0h: Deployment production
T+1h: Monitoring Sentry, Stripe, Supabase logs
T+24h: User feedback monitoring
```

---

## 📞 QUESTIONS POUR CLARIFIER

1. **Devises:** Continuer avec EUR hardcodé ou migrer 100% API live ?
2. **xlsx:** Remplacer par PapaParse (CSV) + exceljs (Excel) ?
3. **expr-eval:** Où utilisé ? Peut-on refactoriser en fonction pure ?
4. **Stripe:** Single payment model ou subscriptions aussi ?
5. **RLS:** Full audit par expert sécurité recommandé ?

---

**Généré:** 2026-02-02 | **Urgence:** 🚨 BLOCKER
