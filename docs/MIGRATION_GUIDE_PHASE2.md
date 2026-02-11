# Guide de Migration Phase 2 - CassKai

**Version source:** 1.x (Phase 1)
**Version cible:** 2.0.0 (Phase 2)
**Difficulté:** ⭐⭐☆☆☆ (Facile - Pas de breaking changes)

---

## 📋 Vue d'ensemble

La migration vers Phase 2 est **100% rétrocompatible**. Aucun code existant ne sera cassé. Ce guide présente les **nouvelles fonctionnalités** à adopter et les **meilleures pratiques** pour tirer parti des améliorations.

**Temps de migration estimé:** 1-2 heures (principalement lecture et compréhension)

---

## ✅ Checklist de migration

### Étape 1: Mise à jour des dépendances

```bash
# 1. Pull les derniers changements
git pull origin main

# 2. Installer nouvelles dépendances
npm install

# 3. Vérifier que tout compile
npm run type-check

# 4. Vérifier que les tests passent
npm run test
npm run test:e2e:phase2
```

**Nouvelles dépendances production:**
```json
{
  "@floating-ui/react": "^0.27.15",
  "react-resizable": "^3.0.5",
  "simple-statistics": "^7.8.8"
}
```

**Nouvelles dépendances dev:**
```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "rollup-plugin-visualizer": "^6.0.3"
}
```

### Étape 2: Activer le PWA

**1. Vérifier la présence du manifest:**
```html
<!-- public/index.html -->
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2563EB" />
```

**2. Enregistrer le Service Worker (déjà fait dans `main.tsx`):**
```typescript
// src/main.tsx
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('✅ SW registered:', reg.scope))
      .catch((err) => console.error('❌ SW registration failed:', err));
  });
}
```

**3. Tester l'installation PWA:**
```bash
# Build production
npm run build

# Servir localement
npm run preview

# Ouvrir Chrome DevTools > Application > Manifest
# Vérifier "Installable" ✅
```

### Étape 3: Utiliser les nouveaux composants premium

**AdvancedDataTable** (remplace les tables basiques):

```typescript
// ❌ AVANT (table basique)
<table className="min-w-full">
  <thead>
    <tr>
      <th>Nom</th>
      <th>Email</th>
    </tr>
  </thead>
  <tbody>
    {data.map((row) => (
      <tr key={row.id}>
        <td>{row.name}</td>
        <td>{row.email}</td>
      </tr>
    ))}
  </tbody>
</table>

// ✅ APRÈS (AdvancedDataTable)
import { AdvancedDataTable } from '@/components/ui/AdvancedDataTable';

<AdvancedDataTable
  data={data}
  columns={[
    { key: 'name', label: 'Nom', type: 'text', sortable: true, filterable: true },
    { key: 'email', label: 'Email', type: 'text', sortable: true, filterable: true },
  ]}
  searchable
  exportable
  exportFilename="clients"
  onRowClick={(row) => console.log('Selected:', row)}
/>
```

**RichTextEditor** (remplace textarea):

```typescript
// ❌ AVANT (textarea simple)
<textarea
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  className="w-full border rounded"
/>

// ✅ APRÈS (RichTextEditor)
import { RichTextEditor } from '@/components/ui/RichTextEditor';

<RichTextEditor
  value={description}
  onChange={setDescription}
  placeholder="Entrez une description..."
  enableImages
  enableTables
/>
```

**FileUploader** (remplace input file):

```typescript
// ❌ AVANT (input file basique)
<input
  type="file"
  onChange={(e) => handleFileChange(e.target.files?.[0])}
  accept="image/*"
/>

// ✅ APRÈS (FileUploader)
import { FileUploader } from '@/components/ui/FileUploader';
import { useSupabaseUpload } from '@/components/ui/FileUploader';

const uploadToSupabase = useSupabaseUpload('invoices', 'attachments');

<FileUploader
  onUpload={async (files) => {
    for (const file of files) {
      const url = await uploadToSupabase(file, (progress) => {
        console.log(`Upload: ${progress}%`);
      });
      console.log('Uploaded:', url);
    }
  }}
  maxFiles={5}
  maxSize={10} // MB
  accept={{ 'image/*': ['.png', '.jpg'], 'application/pdf': ['.pdf'] }}
  compressImages
/>
```

### Étape 4: Ajouter Undo/Redo aux formulaires

**Pour les formulaires critiques (écritures, factures):**

```typescript
// 1. Wrapper le formulaire avec UndoRedoProvider
import { UndoRedoProvider, useUndoRedo } from '@/contexts/UndoRedoContext';

export function MyFormPage() {
  return (
    <UndoRedoProvider>
      <MyForm />
    </UndoRedoProvider>
  );
}

// 2. Dans le formulaire, utiliser useUndoRedo
function MyForm() {
  const { pushState, undo, redo, canUndo, canRedo } = useUndoRedo();
  const [formData, setFormData] = useState(initialData);

  const handleChange = (newData: typeof formData) => {
    pushState(formData); // Sauvegarder état avant modification
    setFormData(newData);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && canUndo) {
        e.preventDefault();
        const previousState = undo();
        if (previousState) setFormData(previousState);
      }
      if (e.ctrlKey && e.key === 'y' && canRedo) {
        e.preventDefault();
        const nextState = redo();
        if (nextState) setFormData(nextState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return (
    <div>
      <Button disabled={!canUndo} onClick={() => setFormData(undo()!)}>
        ↶ Annuler (Ctrl+Z)
      </Button>
      <Button disabled={!canRedo} onClick={() => setFormData(redo()!)}>
        ↷ Refaire (Ctrl+Y)
      </Button>
      {/* Formulaire */}
    </div>
  );
}
```

### Étape 5: Implémenter le monitoring de performance

**Ajouter le monitoring dans `App.tsx`:**

```typescript
// src/App.tsx
import { PerformanceMonitor } from '@/lib/performance-monitor';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const monitor = PerformanceMonitor.getInstance();

    // Optionnel: Envoyer métriques à analytics
    const unsubscribe = monitor.subscribe((metrics) => {
      console.log('Web Vitals:', metrics);

      // Envoyer à votre service analytics
      // analytics.track('web_vitals', metrics);
    });

    return () => unsubscribe();
  }, []);

  return <RouterProvider router={router} />;
}
```

**Consulter les métriques:**
```typescript
import { PerformanceMonitor } from '@/lib/performance-monitor';

const monitor = PerformanceMonitor.getInstance();
const metrics = monitor.getMetrics();

console.log('LCP:', metrics.find((m) => m.name === 'LCP')?.value);
console.log('FID:', metrics.find((m) => m.name === 'FID')?.value);
console.log('CLS:', metrics.find((m) => m.name === 'CLS')?.value);
```

### Étape 6: Utiliser lazy loading avec retry

**Pour les imports de modules lourds:**

```typescript
// ❌ AVANT (lazy simple)
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// ✅ APRÈS (lazy avec retry)
import { lazyWithRetry } from '@/lib/lazy-loader';

const HeavyComponent = lazyWithRetry(() => import('./HeavyComponent'), {
  retryCount: 3,
  retryDelay: 1000,
  timeout: 10000,
});

// Dans le composant parent
<Suspense fallback={<LoadingFallback />}>
  <HeavyComponent />
</Suspense>
```

**Précharger des modules:**
```typescript
import { preloadModule } from '@/lib/lazy-loader';

// Au survol d'un bouton, précharger le module
<Button
  onMouseEnter={() => preloadModule(() => import('./HeavyComponent'))}
  onClick={() => navigate('/heavy-page')}
>
  Ouvrir page lourde
</Button>
```

### Étape 7: Optimiser les images

**Pour les images uploadées par les utilisateurs:**

```typescript
import { optimizeImage } from '@/lib/image-optimizer';

async function handleImageUpload(file: File) {
  // Optimiser avant upload
  const optimized = await optimizeImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'jpeg', // ou 'png', 'webp'
  });

  // Upload l'image optimisée
  const url = await uploadToSupabase(optimized, ...);
  return url;
}
```

### Étape 8: Activer les caches strategies

**Pour les API calls fréquents:**

```typescript
import { CacheManager } from '@/lib/cache-manager';

const cacheManager = CacheManager.getInstance();

async function fetchData(key: string) {
  // 1. Essayer le cache d'abord
  const cached = await cacheManager.get(key);
  if (cached) return cached;

  // 2. Fetch depuis l'API
  const data = await fetch('/api/data').then((r) => r.json());

  // 3. Stocker en cache (TTL 5 minutes)
  await cacheManager.set(key, data, { ttl: 300000 });

  return data;
}

// Invalider cache après mutation
async function updateData(id: string, newData: any) {
  await supabase.from('table').update(newData).eq('id', id);

  // Invalider les caches liés
  await cacheManager.invalidateByPattern('data-*');
}
```

---

## 🔧 Refactoring recommandé

### Pattern 1: Remplacer les tables HTML par AdvancedDataTable

**Rechercher dans votre codebase:**
```bash
grep -r "<table" src/components/
```

**Critères de remplacement:**
- Table avec >10 lignes de données
- Besoin de tri/filtrage
- Export Excel souhaité
- Sélection multiple nécessaire

**Effort:** ~30 min par table

### Pattern 2: Ajouter Undo/Redo aux formulaires critiques

**Formulaires prioritaires:**
1. `JournalEntryForm.tsx` (écritures comptables) - ✅ Déjà fait
2. `InvoiceFormPremium.tsx` (factures) - ✅ Déjà fait
3. `ClientFormPremium.tsx` (clients) - ✅ Déjà fait
4. Formulaires RH (employés, congés)
5. Formulaires stock (mouvements, inventaires)

**Effort:** ~45 min par formulaire

### Pattern 3: Lazy load des routes lourdes

**Routes à lazy-loader en priorité:**

```typescript
// src/App.tsx ou router.tsx
import { lazyWithRetry } from '@/lib/lazy-loader';

const AccountingPage = lazyWithRetry(() => import('./pages/AccountingPage'));
const ReportsPage = lazyWithRetry(() => import('./pages/ReportsPage'));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));

const router = createBrowserRouter([
  {
    path: '/accounting',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AccountingPage />
      </Suspense>
    ),
  },
  // ...
]);
```

**Gain estimé:** -200 KB sur bundle initial

### Pattern 4: Ajouter monitoring Web Vitals

**Déjà implémenté dans `App.tsx`, mais vérifier:**

```typescript
// src/App.tsx
useEffect(() => {
  const monitor = PerformanceMonitor.getInstance();
  const unsubscribe = monitor.subscribe((metrics) => {
    // Envoyer à analytics (Sentry, Datadog, etc.)
    if (import.meta.env.PROD) {
      sendToAnalytics('web_vitals', metrics);
    }
  });
  return () => unsubscribe();
}, []);
```

---

## 🧪 Tests de régression

### Tester les fonctionnalités clés

**1. Comptabilité:**
```bash
npm run test:e2e -- e2e/accounting.spec.ts
```

Vérifier:
- ✅ Création écriture comptable
- ✅ Génération rapports (Bilan, P&L)
- ✅ Export FEC
- ✅ Drill-down interactif (nouveau)

**2. Facturation:**
```bash
npm run test:e2e -- e2e/invoicing.spec.ts
```

Vérifier:
- ✅ Création facture
- ✅ Export PDF
- ✅ Envoi email
- ✅ Undo/Redo (nouveau)

**3. Dashboard:**
```bash
npm run test:e2e:phase2 -- e2e/phase2/realtime-dashboard.spec.ts
```

Vérifier:
- ✅ KPIs temps réel
- ✅ Refresh automatique <500ms
- ✅ Alertes visuelles

**4. Performance:**
```bash
npm run test:e2e:phase2 -- e2e/phase2/performance.spec.ts
```

Vérifier:
- ✅ LCP < 2.5s
- ✅ FID < 100ms
- ✅ CLS < 0.1

### Tester sur devices multiples

```bash
# Desktop
npm run test:e2e:phase2 -- --project=chromium
npm run test:e2e:phase2 -- --project=firefox
npm run test:e2e:phase2 -- --project=webkit

# Mobile
npm run test:e2e:phase2 -- --project="Mobile Chrome"
npm run test:e2e:phase2 -- --project="Mobile Safari"

# Tablet
npm run test:e2e:phase2 -- --project=iPad
```

---

## 🔍 Debugging et troubleshooting

### Problème: Service Worker ne s'enregistre pas

**Symptôme:** `navigator.serviceWorker.register()` échoue

**Solutions:**
1. Vérifier HTTPS activé (requis sauf localhost)
2. Vérifier `sw.js` accessible à la racine
3. Vérifier pas de `skipWaiting()` manquant
4. Consulter Chrome DevTools > Application > Service Workers

```javascript
// Logs debugging SW
navigator.serviceWorker.register('/sw.js', { scope: '/' })
  .then((reg) => {
    console.log('✅ SW registered:', reg);
    reg.update(); // Force update
  })
  .catch((err) => {
    console.error('❌ SW error:', err);
    console.error('Scope:', err.scope);
    console.error('State:', err.state);
  });
```

### Problème: Performance monitoring ne détecte pas les métriques

**Symptôme:** `PerformanceMonitor.getMetrics()` retourne tableau vide

**Solutions:**
1. Vérifier PerformanceObserver supporté: `'PerformanceObserver' in window`
2. Attendre que la page soit complètement chargée
3. Vérifier métriques dans `window.performance.getEntriesByType('navigation')`

```typescript
// Debug performance observer
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    console.log('🔍 Performance entries:', list.getEntries());
  });
  observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
} else {
  console.warn('⚠️ PerformanceObserver not supported');
}
```

### Problème: Lazy loading échoue avec "ChunkLoadError"

**Symptôme:** Erreur `Loading chunk X failed` lors navigation

**Solutions:**
1. Augmenter `retryCount` dans `lazyWithRetry()` (3 → 5)
2. Vérifier fichiers chunks générés dans `dist/assets/`
3. Vérifier CDN ou serveur sert correctement les chunks
4. Forcer reload page après erreur

```typescript
import { lazyWithRetry } from '@/lib/lazy-loader';

const Component = lazyWithRetry(() => import('./Component'), {
  retryCount: 5, // Augmenté
  retryDelay: 2000, // 2s entre retries
  timeout: 15000, // 15s timeout
  onError: (error) => {
    console.error('❌ Lazy load failed:', error);
    // Forcer reload si échec persistant
    if (error.message.includes('ChunkLoadError')) {
      window.location.reload();
    }
  },
});
```

### Problème: Undo/Redo ne fonctionne pas

**Symptôme:** Ctrl+Z/Ctrl+Y ne restaurent pas l'état

**Solutions:**
1. Vérifier `UndoRedoProvider` wrap le composant
2. Vérifier `pushState()` appelé AVANT modification
3. Vérifier pas de mutation directe d'état (utiliser spread operator)
4. Limiter taille historique (50 par défaut)

```typescript
// ❌ MAUVAIS - Mutation directe
const handleChange = (key: string, value: any) => {
  formData[key] = value; // Mutation directe
  setFormData(formData);
};

// ✅ BON - Spread operator
const handleChange = (key: string, value: any) => {
  pushState(formData); // Sauvegarder état
  setFormData({ ...formData, [key]: value }); // Nouvelle référence
};
```

### Problème: AdvancedDataTable export Excel vide

**Symptôme:** Fichier `.xlsx` généré mais vide

**Solutions:**
1. Vérifier données non nulles: `data.length > 0`
2. Vérifier colonnes ont `key` valide correspondant aux données
3. Vérifier `XLSX` (SheetJS) importé: `import * as XLSX from 'xlsx'`
4. Vérifier `file-saver` installé: `npm install file-saver`

```typescript
// Debug export Excel
const handleExport = () => {
  console.log('📊 Export data:', data);
  console.log('📊 Columns:', columns);

  if (data.length === 0) {
    console.warn('⚠️ No data to export');
    return;
  }

  // Vérifier structure
  const firstRow = data[0];
  columns.forEach((col) => {
    if (!(col.key in firstRow)) {
      console.warn(`⚠️ Column key "${col.key}" not found in data`);
    }
  });
};
```

---

## 📚 Ressources additionnelles

### Documentation Phase 2
- **Guide utilisateur:** `docs/GUIDE_UTILISATEUR_PHASE2.md`
- **Changelog:** `CHANGELOG_PHASE2.md`
- **FAQ:** `docs/FAQ_PHASE2.md`
- **Quick reference:** `docs/QUICK_REFERENCE_PHASE2.md`

### Documentation technique
- **Performance optimization:** `docs/PERFORMANCE_GUIDE.md`
- **PWA implementation:** `docs/PWA_IMPLEMENTATION.md`
- **Web Vitals:** https://web.dev/vitals/
- **Service Workers:** https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

### Exemples de code
- **Lazy loading:** `src/lib/lazy-loader.tsx`
- **Performance monitor:** `src/lib/performance-monitor.ts`
- **Cache manager:** `src/lib/cache-manager.ts`
- **Image optimizer:** `src/lib/image-optimizer.ts`
- **Undo/Redo:** `src/contexts/UndoRedoContext.tsx`

### Tests
- **E2E Phase 2:** `e2e/phase2/*.spec.ts`
- **Config Playwright:** `playwright.phase2.config.ts`

---

## 🎯 Checklist finale

Avant de déployer en production, vérifier:

- [ ] ✅ Toutes dépendances installées (`npm install`)
- [ ] ✅ Type-check passe (`npm run type-check`)
- [ ] ✅ Tests unitaires passent (`npm run test`)
- [ ] ✅ Tests E2E Phase 2 passent (`npm run test:e2e:phase2`)
- [ ] ✅ Build production réussit (`npm run build`)
- [ ] ✅ Service Worker enregistré (`chrome://serviceworker-internals`)
- [ ] ✅ Manifest PWA valide (DevTools > Application > Manifest)
- [ ] ✅ Performance Lighthouse >90 (`npm run build && npm run preview` puis Lighthouse)
- [ ] ✅ Web Vitals monitoring actif (console logs)
- [ ] ✅ Lazy loading routes lourdes implémenté
- [ ] ✅ Images optimisées (compression activée)
- [ ] ✅ Undo/Redo ajouté aux formulaires critiques
- [ ] ✅ AdvancedDataTable remplace tables basiques
- [ ] ✅ Tests de régression passés (comptabilité, facturation, CRM)
- [ ] ✅ Documentation mise à jour
- [ ] ✅ Changelog communiqué à l'équipe
- [ ] ✅ Webinaire utilisateurs planifié (optionnel)

---

## 💬 Support

**Questions ou problèmes durant la migration ?**

- **Email:** contact@casskai.app
- **Documentation:** https://docs.casskai.app
- **Status:** https://status.casskai.app
- **Slack:** #casskai-dev (équipe interne)

**Webinaires de support:**
- **15 février 2026, 14h CET:** "Migration Phase 2 - Questions/Réponses"
- **22 février 2026, 14h CET:** "Performance Best Practices"

---

**Bonne migration ! 🚀**

**© 2026 Noutche Conseil SAS - Tous droits réservés**
