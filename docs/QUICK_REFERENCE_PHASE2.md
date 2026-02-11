# Quick Reference Phase 2 - CassKai

**Version:** 2.0.0 | **Date:** 8 février 2026

---

## ⌨️ Raccourcis clavier globaux

| Raccourci | Action |
|-----------|--------|
| `Ctrl + K` | Ouvrir barre de recherche rapide |
| `Ctrl + S` | Sauvegarder formulaire |
| `Ctrl + Enter` | Soumettre formulaire |
| `Ctrl + Z` | Annuler (Undo) |
| `Ctrl + Y` | Refaire (Redo) |
| `Échap` | Fermer modal/dialogue |
| `Ctrl + /` | Afficher aide raccourcis |
| `Ctrl + B` | Basculer sidebar |
| `Ctrl + ,` | Ouvrir paramètres |

---

## 🚀 Quick Actions Bar (Ctrl+K)

**Actions fréquentes:**
- `Nouvelle facture` - Créer facture
- `Nouveau client` - Ajouter client
- `Nouvelle écriture` - Saisir écriture comptable
- `Nouveau paiement` - Enregistrer paiement
- `Dashboard` - Aller au tableau de bord
- `Rapports` - Accéder rapports comptables

**Recherche universelle:**
- Taper n'importe quel terme → résultats fuzzy
- Support: clients, factures, écritures, articles
- Navigation directe par flèches ↑↓ + Enter

---

## 📊 Rapports interactifs - Drill-down

**Niveaux de navigation:**

1. **Niveau 1: Bilan/P&L**
   - Clic sur ligne → Affiche détail auxiliaire
   - Export Excel multi-feuilles
   - Graphiques interactifs

2. **Niveau 2: Auxiliaire**
   - Détail par tiers/compte
   - Tri/filtrage avancé
   - Breadcrumb pour remonter

3. **Niveau 3: Écritures source**
   - Écritures comptables complètes
   - Modification directe possible
   - Lien vers documents source

**Exports disponibles:**
- Excel (`.xlsx`) avec macros
- PDF avec graphiques vectoriels
- CSV pour traitement externe

---

## 📱 Installation PWA

### iOS (iPhone/iPad)

1. Ouvrir Safari → casskai.app
2. Taper icône Partager 🔽
3. "Sur l'écran d'accueil"
4. Confirmer "Ajouter"
5. ✅ App installée !

### Android

1. Ouvrir Chrome → casskai.app
2. Menu ⋮ → "Installer l'application"
3. Confirmer "Installer"
4. ✅ App installée !

**Fonctionnalités offline:**
- ✅ Consultation rapports (cache 7j)
- ✅ Dashboard KPIs (dernière version)
- ❌ Saisie formulaires (nécessite connexion)

---

## 🎨 Composants UI Premium

### AdvancedDataTable

```typescript
import { AdvancedDataTable } from '@/components/ui/AdvancedDataTable';

<AdvancedDataTable
  data={myData}
  columns={[
    { key: 'name', label: 'Nom', type: 'text', sortable: true },
    { key: 'amount', label: 'Montant', type: 'currency', sortable: true },
  ]}
  searchable
  exportable
  exportFilename="data"
/>
```

**Features:**
- Tri multi-colonnes (Shift+Clic)
- Recherche globale fuzzy
- Filtres par colonne
- Export Excel formaté
- Sélection multiple
- Pagination optimisée

### RichTextEditor

```typescript
import { RichTextEditor } from '@/components/ui/RichTextEditor';

<RichTextEditor
  value={content}
  onChange={setContent}
  placeholder="Entrez du texte..."
  enableImages
  enableTables
/>
```

**Toolbar:**
- B/I/U - Gras/Italique/Souligné
- Liste bullets/numéros
- Tableaux
- Images (drag & drop)
- Liens hypertextes
- Undo/Redo

### FileUploader

```typescript
import { FileUploader, useSupabaseUpload } from '@/components/ui/FileUploader';

const upload = useSupabaseUpload('bucket', 'folder');

<FileUploader
  onUpload={upload}
  maxFiles={5}
  maxSize={10} // MB
  compressImages
/>
```

**Features:**
- Drag & drop multi-fichiers
- Compression auto images (JPEG 80%)
- Preview avant upload
- Progress bars
- Validation taille/type

---

## ⚡ Performance optimizations

### Lazy Loading avec retry

```typescript
import { lazyWithRetry } from '@/lib/lazy-loader';

const HeavyPage = lazyWithRetry(() => import('./HeavyPage'), {
  retryCount: 3,
  timeout: 10000,
});
```

### Image Optimization

```typescript
import { optimizeImage } from '@/lib/image-optimizer';

const optimized = await optimizeImage(file, {
  maxWidth: 1920,
  quality: 0.8,
});
```

### Cache Management

```typescript
import { CacheManager } from '@/lib/cache-manager';

const cache = CacheManager.getInstance();

// Set avec TTL 5min
await cache.set('key', data, { ttl: 300000 });

// Get
const data = await cache.get('key');

// Invalider pattern
await cache.invalidateByPattern('data-*');
```

---

## 🔄 Undo/Redo système

### Setup dans composant

```typescript
import { UndoRedoProvider, useUndoRedo } from '@/contexts/UndoRedoContext';

// Wrapper composant
<UndoRedoProvider>
  <MyForm />
</UndoRedoProvider>

// Dans formulaire
const { pushState, undo, redo, canUndo, canRedo } = useUndoRedo();

const handleChange = (newData) => {
  pushState(formData); // Sauvegarder avant modification
  setFormData(newData);
};
```

### Shortcuts
- `Ctrl+Z` - Annuler (50 niveaux max)
- `Ctrl+Y` - Refaire
- Historique automatique sauvegardé

---

## 📈 Web Vitals monitoring

### Métriques clés

| Métrique | Cible | Description |
|----------|-------|-------------|
| **LCP** | <2.5s | Largest Contentful Paint |
| **FID** | <100ms | First Input Delay |
| **CLS** | <0.1 | Cumulative Layout Shift |
| **FCP** | <1.8s | First Contentful Paint |
| **TTFB** | <600ms | Time to First Byte |
| **INP** | <200ms | Interaction to Next Paint |

### Consulter métriques

```typescript
import { PerformanceMonitor } from '@/lib/performance-monitor';

const monitor = PerformanceMonitor.getInstance();
const metrics = monitor.getMetrics();

console.log('Scores:', metrics);
```

### Chrome DevTools

1. F12 → Performance tab
2. Record → Stop
3. Analyser flamegraph
4. Lighthouse → Run audit

---

## 🔧 Bundle analysis

```bash
# Générer visualisation bundle
npm run build:analyze

# Ouvre stats.html dans navigateur
# Identifier chunks >500 KB
```

**Stratégies optimisation:**
- Lazy load routes lourdes
- Code splitting agressif
- Tree shaking activé
- Compression Gzip/Brotli

---

## 🧪 Tests E2E Phase 2

```bash
# Tous les tests Phase 2
npm run test:e2e:phase2

# Tests spécifiques
npm run test:e2e:phase2 -- e2e/phase2/pwa.spec.ts
npm run test:e2e:phase2 -- e2e/phase2/performance.spec.ts

# Mode UI interactif
npm run test:e2e:phase2:ui

# Mode headed (browser visible)
npm run test:e2e:phase2:headed

# Générer rapport HTML
npm run test:e2e:phase2:report
```

**Devices testés:**
- Desktop: Chrome, Firefox, Safari
- Mobile: Chrome (Pixel 5), Safari (iPhone 12)
- Tablet: iPad Pro

---

## 🌐 Service Worker (PWA)

### Vérifier enregistrement

```javascript
// Console navigateur
navigator.serviceWorker.getRegistrations().then((regs) => {
  console.log('SW registered:', regs);
});
```

### Forcer mise à jour

```javascript
navigator.serviceWorker.getRegistration().then((reg) => {
  reg?.update();
});
```

### Désinstaller SW (debugging)

```javascript
navigator.serviceWorker.getRegistration().then((reg) => {
  reg?.unregister();
});
```

**Chrome DevTools:**
- Application tab → Service Workers
- Unregister / Update / Skip waiting

---

## 📊 Dashboard temps réel

### Indicateurs live (<500ms refresh)

- 💰 Chiffre d'affaires (MAJ toutes les 5s)
- 💵 Trésorerie disponible (temps réel)
- 📊 DSO (Days Sales Outstanding)
- ⚠️ Créances échues >90j
- 💳 Dettes fournisseurs

### Alertes visuelles

| Seuil | Alerte |
|-------|--------|
| Trésorerie <10k € | 🔴 Rouge |
| DSO >60 jours | 🟠 Orange |
| Créances échues >90j | 🔴 Rouge |
| Marge brute <30% | 🟠 Orange |

### Websockets Supabase Realtime

```typescript
// Auto-reconnexion si déconnexion
// Pas d'action manuelle nécessaire
// Indicator status: 🟢 Connecté / 🟡 Reconnexion / 🔴 Déconnecté
```

---

## 🎯 Scores Lighthouse

**Cibles Phase 2:**
- ✅ Performance: **>90** (actuel: 94)
- ✅ Accessibility: **>95** (actuel: 96)
- ✅ Best Practices: **100**
- ✅ SEO: **100**
- ✅ PWA: **Installable**

**Vérifier scores:**
```bash
npm run build
npm run preview
# Chrome DevTools → Lighthouse → Generate report
```

---

## 🆘 Dépannage rapide

### Service Worker ne marche pas
```bash
# Vérifier HTTPS (requis sauf localhost)
# Chrome: chrome://serviceworker-internals
# Firefox: about:serviceworkers
# Unregister → Recharger → Réenregistrer
```

### Performance lente
```bash
# 1. Vérifier bundle size
npm run build:analyze

# 2. Identifier bottlenecks
# Chrome DevTools → Performance → Record

# 3. Lazy load routes lourdes
# Utiliser lazyWithRetry()
```

### Undo/Redo ne fonctionne pas
```typescript
// Vérifier wrapper UndoRedoProvider
// Vérifier pushState() appelé AVANT modification
// Vérifier pas de mutation directe (utiliser spread)
```

### Export Excel vide
```typescript
// Vérifier data.length > 0
// Vérifier colonnes key valides
// Vérifier XLSX installé: npm install xlsx
```

---

## 📚 Documentation complète

- **Guide utilisateur:** `docs/GUIDE_UTILISATEUR_PHASE2.md`
- **Migration dev:** `docs/MIGRATION_GUIDE_PHASE2.md`
- **Changelog:** `CHANGELOG_PHASE2.md`
- **FAQ:** `docs/FAQ_PHASE2.md`

---

## 💬 Support

- **Email:** contact@casskai.app
- **Docs:** https://docs.casskai.app
- **Status:** https://status.casskai.app
- **Webinaires:** Tous les vendredis 14h CET

---

**Imprimez cette carte pour référence rapide ! 🚀**

**© 2026 Noutche Conseil SAS**
