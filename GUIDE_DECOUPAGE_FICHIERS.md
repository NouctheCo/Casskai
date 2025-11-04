# 📋 GUIDE DE DÉCOUPAGE - Fichiers Volumineux CassKai

## Objectif
Découper les 4 fichiers >1200 lignes en composants modulaires <300 lignes chacun.

---

## 1. DocumentationArticlesData.tsx (1870 lignes)

### État Actuel
- **Problème**: Base de données d'articles hardcodée dans un composant React
- **Impact**: Fichier énorme, difficile à maintenir, non scalable

### Solution
```bash
# Créer le fichier JSON
src/data/documentation.json

# Structure
{
  "categories": [...],
  "articles": [...]
}
```

### Actions
1. Extraire toutes les données articles vers JSON
2. Créer types TypeScript `Documentation`, `Article`, `Category`
3. Modifier composant pour charger depuis JSON
4. Ajouter search index pour performance

### Résultat
- `DocumentationArticlesData.tsx`: 1870 → 50 lignes (-97%)
- `documentation.json`: Nouveau fichier data
- `types/documentation.types.ts`: Types

---

## 2. BanksPage.tsx (1446 lignes)

### État Actuel
- **Problème**: Gestion bancaire complète dans 1 fichier
- **Responsabilités**: Connexion, sync, catégorisation, rapprochement, webhooks

### Découpage Proposé
```
src/pages/BanksPage.tsx (200 lignes - orchestrateur)
src/components/banks/
├── BankConnectionPanel.tsx (250 lignes)
│   └── Gestion connexions Bridge/Plaid
├── BankTransactionsList.tsx (250 lignes)
│   └── Affichage et filtrage transactions
├── BankSyncManager.tsx (200 lignes)
│   └── Synchronisation automatique
├── BankCategorizationEngine.tsx (200 lignes)
│   └── Catégorisation AI/règles
└── BankWebhooksPanel.tsx (150 lignes)
    └── Gestion webhooks bancaires

src/hooks/
├── useBankConnection.ts (100 lignes)
├── useBankSync.ts (100 lignes)
└── useBankTransactions.ts (150 lignes)
```

### Actions
1. Créer la structure de dossiers
2. Extraire chaque section vers son composant
3. Créer hooks personnalisés pour logique réutilisable
4. Simplifier BanksPage en orchestrateur
5. Ajouter tests unitaires par composant

### Résultat
- `BanksPage.tsx`: 1446 → 200 lignes (-86%)
- 5 nouveaux composants modulaires
- 3 hooks réutilisables

---

## 3. OptimizedInvoicesTab.tsx (1277 lignes)

### État Actuel
- **Problème**: Tab de facturation monolithique
- **Responsabilités**: Formulaires, listes, filtres, stats, modals

### Découpage Proposé
```
src/components/invoicing/OptimizedInvoicesTab.tsx (150 lignes)
src/components/invoicing/invoices/
├── InvoiceList.tsx (300 lignes)
│   └── Liste avec pagination
├── InvoiceFilters.tsx (150 lignes)
│   └── Barre de recherche et filtres
├── InvoiceForm.tsx (250 lignes)
│   └── Création/édition facture
├── InvoiceStats.tsx (100 lignes)
│   └── Statistiques et KPIs
└── InvoiceActions.tsx (100 lignes)
    └── Actions bulk et exports

src/hooks/
├── useInvoices.ts (150 lignes)
│   └── CRUD et état
├── useInvoiceFilters.ts (80 lignes)
│   └── Logique filtrage
└── useInvoiceForm.ts (100 lignes)
    └── Validation et soumission
```

### Actions
1. Identifier les sections du tab actuel
2. Créer composants indépendants
3. Extraire hooks pour logique réutilisable
4. Simplifier tab en container/orchestrateur
5. Ajouter types partagés

### Résultat
- `OptimizedInvoicesTab.tsx`: 1277 → 150 lignes (-88%)
- 5 composants spécialisés
- 3 hooks métier

---

## 4. LandingPage.tsx (1231 lignes)

### État Actuel
- **Problème**: Page marketing monolithique
- **Responsabilités**: Hero, features, pricing, testimonials, FAQ, CTA

### Découpage Proposé
```
src/pages/LandingPage.tsx (150 lignes - layout)
src/components/landing/sections/
├── HeroSection.tsx (200 lignes)
│   └── Header, titre, CTA principal
├── FeaturesSection.tsx (200 lignes)
│   └── Grille de fonctionnalités
├── PricingSection.tsx (200 lignes)
│   └── Plans et tarifs
├── TestimonialsSection.tsx (150 lignes)
│   └── Témoignages clients
├── StatsSection.tsx (100 lignes)
│   └── Chiffres clés
├── FAQSection.tsx (150 lignes)
│   └── Questions fréquentes
└── CTASection.tsx (100 lignes)
    └── Call-to-action final

src/components/landing/shared/
├── SectionContainer.tsx (50 lignes)
├── SectionHeader.tsx (50 lignes)
└── AnimatedCard.tsx (100 lignes)
```

### Actions
1. Identifier chaque section visuelle
2. Créer composants par section
3. Extraire composants partagés (headers, cards)
4. Simplifier LandingPage en layout
5. Optimiser animations (lazy loading)

### Résultat
- `LandingPage.tsx`: 1231 → 150 lignes (-88%)
- 7 sections indépendantes
- 3 composants réutilisables

---

## Principes de Découpage

### 1. Single Responsibility
Chaque composant = 1 responsabilité claire

### 2. Taille Cible
- Composants: 100-300 lignes
- Hooks: 50-150 lignes
- Pages: <200 lignes (orchestration)

### 3. Réutilisabilité
Extraire éléments communs vers `/shared`

### 4. Testabilité
Composants petits = tests simples

### 5. Performance
- Lazy loading pour sections lourdes
- Mémoization stratégique
- Code splitting automatique

---

## Checklist par Fichier

### Avant Découpage
- [ ] Lire fichier complet
- [ ] Identifier sections/responsabilités
- [ ] Dessiner architecture cible
- [ ] Lister imports nécessaires
- [ ] Identifier états partagés

### Pendant Découpage
- [ ] Créer structure dossiers
- [ ] Créer fichiers types
- [ ] Extraire composant par composant
- [ ] Créer hooks si logique réutilisable
- [ ] Mettre à jour imports

### Après Découpage
- [ ] Vérifier build sans erreurs
- [ ] Tester fonctionnalités
- [ ] Ajouter tests unitaires
- [ ] Optimiser performance
- [ ] Documenter architecture

---

## Commandes

```bash
# Vérifier structure avant
Get-ChildItem -Path src -Recurse -File | Where-Object { $_.Length -gt 100000 }

# Build et test après découpage
npm run type-check
npm run build
npm run test

# Vérifier taille bundle
npm run build -- --analyze
```

---

## Estimation Temps

| Fichier | Complexité | Temps |
|---------|-----------|-------|
| DocumentationArticlesData | Faible (data) | 1h |
| BanksPage | Élevée (logique) | 2.5h |
| OptimizedInvoicesTab | Moyenne | 2h |
| LandingPage | Faible (UI) | 1.5h |

**Total**: ~7h pour les 4 fichiers

---

## Résultat Final

### Métriques
- **Fichiers >700 lignes**: 4 → 0 ✅
- **Nouveaux composants**: ~25
- **Nouveaux hooks**: ~10
- **Maintenabilité**: +300% 📈
- **Testabilité**: +400% 📈

### Architecture
```
Avant: 4 fichiers monolithiques
Après: 35+ fichiers modulaires, testables, maintenables
```

---

*Guide pour Phase 2B - GitHub Copilot CLI*
