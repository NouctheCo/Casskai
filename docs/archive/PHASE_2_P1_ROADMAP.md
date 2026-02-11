# 🚀 Phase 2 (P1) - Roadmap High-Impact Features

**Date:** 2026-02-08
**Objectif:** Atteindre parité UX avec leaders + différenciateurs premium
**Durée estimée:** 1-3 mois
**Statut:** ▶️ **DÉMARRAGE**

---

## 📋 Vue d'Ensemble Phase 2

### Tâches Phase 2 (P1)

| # | Tâche | Priorité | Temps | Impact Business |
|---|-------|----------|-------|-----------------|
| **#27** | Mobile PWA | UX CRITICAL | 1-2 semaines | Installation mobile + offline |
| **#28** | Rapports interactifs drill-down | UX PREMIUM | 2 semaines | Analyse approfondie financière |
| **#29** | Dashboard temps réel Websockets | PERFORMANCE | 1 semaine | KPIs live <500ms |
| **#30** | Optimisation UX formulaires | ADHÉSION USER | 2 semaines | Productivité saisie x2 |

**Temps total Phase 2 :** 6-7 semaines (1.5-2 mois)

---

## 🎯 Tâche #27 - Mobile PWA

### Objectif

**Rendre CassKai installable sur mobile** (iOS/Android) via Progressive Web App.

### Problème résolu

**Avant :**
- ❌ Pas d'application mobile native
- ❌ Consultation rapports uniquement sur desktop
- ❌ Pas de notifications push
- ❌ Pas d'accès offline

**Après :**
- ✅ PWA installable iOS/Android (1 clic)
- ✅ Consultation rapports offline
- ✅ Push notifications (échéances, alertes trésorerie)
- ✅ UX mobile optimisée

### Livrables

#### 1. Configuration PWA

**Fichier :** `public/manifest.json`

```json
{
  "name": "CassKai - Gestion Financière PME",
  "short_name": "CassKai",
  "description": "Plateforme complète de gestion financière pour PME et indépendants",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563EB",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 2. Service Worker

**Fichier :** `src/sw.ts`

```typescript
/// <reference lib="webworker" />

const CACHE_NAME = 'casskai-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png'
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Push notifications
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json();

  const options = {
    body: data.message,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
```

#### 3. Configuration Vite

**Fichier :** `vite.config.ts` (MODIFIER)

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CassKai',
        short_name: 'CassKai',
        theme_color: '#2563EB'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24h
              }
            }
          }
        ]
      }
    })
  ]
});
```

#### 4. Responsive Design

**Composants à adapter :**
- `src/components/layout/MainLayout.tsx` - Sidebar collapsible mobile
- `src/components/dashboard/RealOperationalDashboard.tsx` - Cards responsive
- `src/components/accounting/OptimizedReportsTab.tsx` - Tables scrollables
- `src/components/invoicing/OptimizedInvoicesTab.tsx` - Filtres mobile

**Breakpoints Tailwind :**
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Critères de succès

- ✅ **PWA installable** iOS/Android (bouton "Ajouter à l'écran d'accueil")
- ✅ **Lighthouse PWA score >90**
- ✅ **Mode offline** - Rapports consultables sans connexion
- ✅ **Push notifications** - Alertes échéances fonctionnelles
- ✅ **Responsive** - UX fluide mobile/tablet

### Tests

```bash
# Lighthouse audit
npm install -g lighthouse
lighthouse https://casskai.app --view

# Test PWA local
npm run dev
# Ouvrir DevTools → Application → Service Workers
# Vérifier manifest.json et cache
```

---

## 📊 Tâche #28 - Rapports Interactifs Drill-Down

### Objectif

**Rendre les rapports financiers cliquables** avec navigation 3 niveaux.

### Problème résolu

**Avant :**
- ❌ Rapports statiques PDF/Excel
- ❌ Pas de drill-down (ligne bilan → écritures source)
- ❌ Analyse manuelle laborieuse

**Après :**
- ✅ Clic sur ligne bilan → Balance auxiliaire
- ✅ Clic sur compte → Journal détaillé
- ✅ Clic sur écriture → Détail pièce jointe
- ✅ Export Excel interactif (macros, graphiques)

### Architecture Drill-Down

```
Niveau 1 : BILAN
├── Actif Immobilisé: 250 000 €  [CLIC]
│   └─→ Niveau 2 : BALANCE AUXILIAIRE
│       ├── 211000 Terrains: 100 000 €  [CLIC]
│       │   └─→ Niveau 3 : JOURNAL
│       │       ├── 15/01/2024 - Achat terrain Abidjan: +100 000 €
│       │       └── ...
│       ├── 241000 Matériel: 150 000 €  [CLIC]
│           └─→ Niveau 3 : JOURNAL
│               ├── 20/03/2024 - Achat ordinateurs: +50 000 €
│               └── ...
```

### Livrables

#### 1. Service Drill-Down

**Fichier :** `src/services/reportDrillDownService.ts` (NOUVEAU)

```typescript
export class ReportDrillDownService {
  /**
   * Niveau 1 → Niveau 2 : Bilan → Balance Auxiliaire
   */
  async getAuxiliaryBalance(
    companyId: string,
    accountRange: string, // Ex: "2" pour classe 2 (actif immobilisé)
    startDate: string,
    endDate: string
  ): Promise<AuxiliaryBalanceEntry[]> {
    // Récupérer tous les comptes de la classe
    const accounts = await this.getAccountsByRange(companyId, accountRange);

    // Calculer solde de chaque compte
    const balances = await this.calculateAccountBalances(companyId, accounts, startDate, endDate);

    return balances;
  }

  /**
   * Niveau 2 → Niveau 3 : Balance → Journal
   */
  async getAccountJournal(
    companyId: string,
    accountNumber: string,
    startDate: string,
    endDate: string
  ): Promise<JournalEntry[]> {
    // Récupérer écritures du compte
    const { data, error } = await supabase
      .from('journal_entry_lines')
      .select(`
        id,
        debit_amount,
        credit_amount,
        description,
        journal_entries (
          id,
          entry_date,
          entry_number,
          description
        )
      `)
      .eq('company_id', companyId)
      .eq('account_number', accountNumber)
      .gte('journal_entries.entry_date', startDate)
      .lte('journal_entries.entry_date', endDate)
      .order('journal_entries.entry_date', { ascending: false });

    return data || [];
  }
}
```

#### 2. Composant Interface

**Fichier :** `src/components/accounting/InteractiveReportsTab.tsx` (NOUVEAU)

```tsx
export function InteractiveReportsTab() {
  const [drillLevel, setDrillLevel] = useState<1 | 2 | 3>(1);
  const [selectedAccountRange, setSelectedAccountRange] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  const handleBalanceSheetClick = (accountRange: string) => {
    setSelectedAccountRange(accountRange);
    setDrillLevel(2); // Passer à balance auxiliaire
  };

  const handleAuxiliaryBalanceClick = (accountNumber: string) => {
    setSelectedAccount(accountNumber);
    setDrillLevel(3); // Passer au journal
  };

  return (
    <div>
      {/* Breadcrumb navigation */}
      <Breadcrumb>
        <BreadcrumbItem onClick={() => setDrillLevel(1)}>Bilan</BreadcrumbItem>
        {drillLevel >= 2 && (
          <BreadcrumbItem onClick={() => setDrillLevel(2)}>
            Balance Classe {selectedAccountRange}
          </BreadcrumbItem>
        )}
        {drillLevel === 3 && (
          <BreadcrumbItem>Journal {selectedAccount}</BreadcrumbItem>
        )}
      </Breadcrumb>

      {/* Niveau 1 : Bilan */}
      {drillLevel === 1 && (
        <BalanceSheetTable onAccountClick={handleBalanceSheetClick} />
      )}

      {/* Niveau 2 : Balance Auxiliaire */}
      {drillLevel === 2 && (
        <AuxiliaryBalanceTable
          accountRange={selectedAccountRange}
          onAccountClick={handleAuxiliaryBalanceClick}
        />
      )}

      {/* Niveau 3 : Journal */}
      {drillLevel === 3 && (
        <JournalDetailTable accountNumber={selectedAccount} />
      )}
    </div>
  );
}
```

### Critères de succès

- ✅ **Drill-down 3 niveaux opérationnel**
- ✅ **Navigation fluide** (<500ms entre niveaux)
- ✅ **Export Excel interactif** (macros + graphiques)
- ✅ **Graphiques dynamiques** (Chart.js/Recharts)

---

## ⚡ Tâche #29 - Dashboard Temps Réel Websockets

### Objectif

**Afficher KPIs en temps réel** avec Supabase Realtime (Websockets).

### Problème résolu

**Avant :**
- ❌ KPIs refresh manuel (reload page)
- ❌ Latence 5-10 secondes
- ❌ Pas d'alertes temps réel

**Après :**
- ✅ KPIs refresh automatique (<500ms)
- ✅ Websockets Supabase Realtime
- ✅ Alertes visuelles instantanées

### Architecture Realtime

```typescript
// Hook personnalisé
export function useRealtimeKPIs(companyId: string) {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);

  useEffect(() => {
    // Subscribe aux changements
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `company_id=eq.${companyId}`
        },
        payload => {
          // Recalculer KPIs
          refreshKPIs();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `company_id=eq.${companyId}`
        },
        payload => {
          refreshKPIs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  return { kpis, isLoading };
}
```

### Critères de succès

- ✅ **KPIs refresh <500ms**
- ✅ **Websockets stables** (pas de déconnexions)
- ✅ **Alertes visuelles** (trésorerie <10k, DSO >60j)
- ✅ **Performance Lighthouse >90**

---

## 🎨 Tâche #30 - Optimisation UX Formulaires

### Objectif

**Rendre les formulaires ultra-rapides** avec autocomplete, validation inline, shortcuts.

### Problème résolu

**Avant :**
- ❌ Autocomplete lent (>1s)
- ❌ Validation uniquement au submit
- ❌ Pas de shortcuts clavier
- ❌ Pas d'undo/redo

**Après :**
- ✅ Autocomplete <100ms
- ✅ Validation inline temps réel
- ✅ Shortcuts clavier (Ctrl+S, Ctrl+Enter, Ctrl+Z)
- ✅ Undo/Redo opérationnel

### Fonctionnalités

#### 1. Autocomplete Intelligent

```typescript
// Hook personnalisé
export function useAutocomplete(
  entityType: 'clients' | 'fournisseurs' | 'comptes' | 'articles',
  companyId: string
) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) return;

    setIsLoading(true);

    // Fuzzy search avec Supabase
    const { data } = await supabase
      .from(entityType)
      .select('*')
      .ilike('name', `%${query}%`)
      .eq('company_id', companyId)
      .limit(10);

    setSuggestions(data || []);
    setIsLoading(false);
  }, 100); // Debounce 100ms

  return { suggestions, isLoading, search };
}
```

#### 2. Shortcuts Clavier

```typescript
export function useFormShortcuts(handlers: {
  onSave?: () => void;
  onSubmit?: () => void;
  onCancel?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S : Sauvegarder
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
      }

      // Ctrl+Enter : Valider
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handlers.onSubmit?.();
      }

      // Esc : Annuler
      if (e.key === 'Escape') {
        handlers.onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
```

#### 3. Undo/Redo

```typescript
export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setState = (newState: T) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return {
    state: history[currentIndex],
    setState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1
  };
}
```

### Critères de succès

- ✅ **Autocomplete <100ms**
- ✅ **Validation inline temps réel**
- ✅ **Shortcuts opérationnels**
- ✅ **Undo/Redo fonctionnel**
- ✅ **NPS >8.5**

---

## 📈 Impact Business Phase 2

### Métriques Cibles

| Métrique | Avant Phase 2 | Target Phase 2 | Gain |
|----------|---------------|----------------|------|
| **Utilisateurs mobiles** | 0% | 40% | +40% adoption |
| **Temps analyse rapports** | 15 min | 5 min | -67% temps |
| **Latence KPIs** | 5-10s | <500ms | x10-20 rapidité |
| **Temps saisie formulaire** | 2 min | 1 min | -50% temps |
| **NPS Score** | 60 | 75+ | +25% satisfaction |

### ROI Estimé

**Investissement Phase 2 :** ~50 jours-dev (€15k)
**Retour estimé :**
- Réduction churn : 15% → 8% (€50k ARR sauvegardé)
- Adoption accrue : +30% utilisateurs actifs (€100k ARR additionnel)
- **ROI : 10x première année**

---

## 🎯 Livrables Phase 2

### Critères de validation

- ✅ **PWA installable** iOS/Android
- ✅ **Rapports drill-down** 3 niveaux opérationnels
- ✅ **Dashboard temps réel** <500ms refresh
- ✅ **UX formulaires** premium (autocomplete + shortcuts + undo/redo)
- ✅ **Tests E2E** complets pour toutes features
- ✅ **Performance Lighthouse >90**
- ✅ **NPS >8.5**

### Documentation

- Guide installation PWA (utilisateurs)
- Guide navigation drill-down
- Liste shortcuts clavier
- Guide contribution développeurs

---

## 🚀 Prochaines Étapes

**Ordre d'implémentation recommandé :**

1. **#29 - Dashboard temps réel** (1 semaine) - Quick win, haute visibilité
2. **#30 - Optimisation UX formulaires** (2 semaines) - Impact direct productivité
3. **#27 - Mobile PWA** (1-2 semaines) - Différenciateur concurrentiel
4. **#28 - Rapports interactifs** (2 semaines) - Premium feature

**Date cible fin Phase 2 :** 2024-03-15 (1 mois)

---

## ✅ Conclusion

**Phase 2 positionne CassKai comme leader UX** pour PME francophones :

- ✅ **Parité mobile** avec Pennylane/Xero (PWA)
- ✅ **Supériorité analyse** (drill-down 3 niveaux)
- ✅ **Performance temps réel** (<500ms)
- ✅ **UX premium** (autocomplete + shortcuts)

**Après Phase 2 → CassKai = Top 3 outils comptables marché francophone** 🎯

---

**Prochaine action :** Démarrer tâche #29 (Dashboard temps réel) - Quick win haute visibilité
