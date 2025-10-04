# Module Budget - CassKai

## 📋 Vue d'ensemble

Module modernisé de gestion des budgets annuels avec interface professionnelle et fonctionnalités complètes.

## 🎨 Composants

### 1. **BudgetPage.tsx**
Page principale avec gestion des vues (liste/création/édition).
- Design moderne avec cards Shadcn/UI
- Message élégant si aucune entreprise sélectionnée
- Gestion du dark mode

### 2. **BudgetManager.tsx**
Gestionnaire principal de la liste des budgets.

**Fonctionnalités:**
- 📊 Statistiques visuelles (KPIs)
- 🔍 Recherche et filtres avancés
- 📥 Import/Export de budgets
- ✏️ CRUD complet avec confirmations
- 🔄 Duplication de budgets
- 🎯 Workflow de statuts (draft → review → approved → active)

**UI/UX:**
- Cards interactives avec hover effects
- Toasts pour les notifications
- Dialogs modernes pour confirmations
- Loading states élégants
- Filtres réinitialisables

### 3. **BudgetFormModern.tsx**
Formulaire simplifié de création/édition de budget.

**Fonctionnalités:**
- 📝 Saisie par catégories (revenus/charges/capex)
- 💰 Calcul automatique des totaux et marges
- 📊 Résumé visuel en temps réel
- ✅ Validation des données
- 💾 Sauvegarde avec feedback

**UI/UX:**
- Cards colorées pour les KPIs
- Formulaire responsive
- Labels clairs avec aide contextuelle
- Boutons d'action visibles

### 4. **BudgetCard.tsx**
Carte individuelle de budget pour la liste.

**Affichage:**
- Année et version du budget
- Badge de statut coloré
- Métriques principales (revenus/charges/bénéfice/marge)
- Dates de création/modification
- Actions rapides (éditer/dupliquer/supprimer)

**Interactions:**
- Boutons contextuels selon le statut
- Hover effects
- Actions de workflow intégrées

### 5. **BudgetStats.tsx**
Composant de statistiques agrégées.

**KPIs affichés:**
- 🎯 Nombre de budgets actifs/totaux
- 💵 Revenus totaux
- 📉 Charges totales
- 💰 Bénéfice prévu
- 📊 Marge moyenne

**Design:**
- Cards colorées par métrique
- Icônes Lucide cohérentes
- Format responsive (grid adaptatif)

### 6. **BudgetStatusBadge.tsx**
Badge de statut réutilisable.

**Statuts:**
- `draft` - Brouillon (gris)
- `under_review` - En révision (orange)
- `approved` - Approuvé (vert)
- `active` - Actif (bleu)
- `archived` - Archivé (gris foncé)

**Caractéristiques:**
- Icône + label
- Couleurs cohérentes
- Dark mode support

## 🛠️ Services

### budgetService.ts
Service singleton pour toutes les opérations backend.

**Méthodes principales:**
- `getBudgets()` - Liste avec filtres
- `getBudgetById()` - Détails complets
- `createBudget()` - Création avec validation
- `updateBudget()` - Mise à jour
- `deleteBudget()` - Suppression
- `updateBudgetStatus()` - Changement de statut
- `duplicateBudget()` - Duplication avec croissance
- `analyzeBudgetVariances()` - Analyse des écarts
- `compareBudgets()` - Comparaison N vs N-1

## 📊 Types

### budget.types.ts
Types TypeScript complets.

**Principaux types:**
- `Budget` - Structure du budget
- `BudgetCategory` - Catégorie budgétaire
- `BudgetAssumption` - Hypothèse budgétaire
- `BudgetStatus` - États du workflow
- `BudgetFormData` - Données de formulaire
- `BudgetValidationResult` - Résultat de validation

## 🎯 Workflow

### États du budget

```
draft → under_review → approved → active
                ↓
            archived
```

**Actions par statut:**
- **Draft**: Éditer, Supprimer, Soumettre pour révision
- **Under Review**: Approuver, Rejeter (→ draft)
- **Approved**: Activer, Modifier
- **Active**: Archiver, Consulter
- **Archived**: Consulter uniquement

## 🚀 Utilisation

### Import dans l'application

```typescript
import BudgetPage from '@/pages/BudgetPage';
import { BudgetManager, BudgetFormModern } from '@/components/budget';
```

### Route

```typescript
<Route path="/budget" element={
  <ProtectedRoute>
    <Suspense fallback={<LoadingFallback />}>
      <LazyBudgetPage />
    </Suspense>
  </ProtectedRoute>
} />
```

### Utilisation du service

```typescript
import { budgetService } from '@/services/budgetService';

// Charger les budgets
const { data, error } = await budgetService.getBudgets(companyId, {
  years: [2025],
  status: ['active']
});

// Créer un budget
const budgetData: BudgetFormData = {
  year: 2025,
  categories: [...],
  assumptions: [...]
};
const result = await budgetService.createBudget(companyId, budgetData);
```

## 🎨 Design System

### Couleurs

- **Revenus**: Vert (`green-500`, `green-50`)
- **Charges**: Rouge (`red-500`, `red-50`)
- **Bénéfice**: Bleu (`blue-500`, `blue-50`)
- **Marge**: Violet (`purple-500`, `purple-50`)
- **Neutre**: Gris (`gray-500`, `gray-50`)

### Composants Shadcn/UI utilisés

- ✅ Card / CardHeader / CardContent / CardTitle
- ✅ Button (variants: default, outline, ghost, destructive)
- ✅ Input / Label / Textarea
- ✅ Select / SelectTrigger / SelectContent / SelectItem
- ✅ Dialog / DialogHeader / DialogTitle / DialogFooter
- ✅ Badge
- ✅ Tabs / TabsList / TabsTrigger / TabsContent
- ✅ Toast (via useToast)

### Icônes Lucide

- `Target` - Budget
- `Calculator` - Calculs
- `TrendingUp` - Revenus
- `TrendingDown` - Charges
- `DollarSign` - Montants
- `BarChart3` - Statistiques
- `CheckCircle` - Validation
- `AlertCircle` - Alertes
- `Edit` - Édition
- `Copy` - Duplication
- `Trash2` - Suppression
- `Plus` - Ajout
- `Save` - Sauvegarde

## 📱 Responsive Design

- **Mobile**: Stack vertical, actions simplifiées
- **Tablet**: Grid 2 colonnes
- **Desktop**: Grid 4-5 colonnes, toutes les fonctionnalités

## ♿ Accessibilité

- Labels explicites sur tous les inputs
- Boutons avec texte ou aria-label
- Contraste de couleurs respecté (WCAG AA)
- Navigation au clavier
- États de focus visibles

## 🔄 État actuel

✅ **Implémenté:**
- BudgetPage avec routing
- BudgetManager avec liste complète
- BudgetFormModern simplifié
- BudgetCard avec actions
- BudgetStats avec KPIs
- BudgetStatusBadge réutilisable
- Service complet avec API
- Types TypeScript complets

⏳ **À améliorer:**
- Graphiques visuels (charts)
- Export Excel/PDF
- Import depuis fichiers
- Comparaison visuelle N vs N-1
- Workflow d'approbation multi-niveaux
- Notifications automatiques
- Historique des modifications

## 🐛 Tests

Tests recommandés:
1. Création d'un budget vierge
2. Ajout/suppression de catégories
3. Calcul automatique des totaux
4. Duplication d'un budget existant
5. Changement de statut
6. Filtres et recherche
7. Responsive sur mobile/tablet
8. Dark mode

## 📚 Documentation

- [Types Budget](../../types/budget.types.ts)
- [Service Budget](../../services/budgetService.ts)
- [Page Budget](../../pages/BudgetPage.tsx)

---

**Version**: 1.0.0 (Modernisée)
**Date**: Janvier 2025
**Auteur**: CassKai Team
