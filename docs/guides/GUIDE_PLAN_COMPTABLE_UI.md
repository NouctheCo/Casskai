# Guide d'Utilisation - Plan Comptable avec Mappings Budgétaires

## 🎯 Nouveau Composant Créé

**Fichier**: `src/components/accounting/ChartOfAccountsEnhanced.tsx`

Ce composant remplace l'ancien `ChartOfAccounts.tsx` et ajoute la gestion des mappings entre comptes comptables et catégories budgétaires.

## ✨ Nouvelles Fonctionnalités

### 1. Initialisation Automatique du Plan Comptable

**Avant**: L'utilisateur devait créer manuellement tous les comptes

**Maintenant**: Un bouton "Initialiser plan standard" qui:
- Détecte automatiquement le pays de l'entreprise
- Appelle la fonction SQL `initialize_company_chart_of_accounts()`
- Crée tous les comptes standard du pays (150-200 comptes selon le pays)
- Affiche un message de succès avec le nombre de comptes créés

**Pays supportés**:
- 🇫🇷 France (PCG)
- 🇧🇯 Bénin (SYSCOHADA)
- 🇨🇮 Côte d'Ivoire (SYSCOHADA)
- 🇹🇬 Togo (SYSCOHADA)
- 🇨🇲 Cameroun (SYSCOHADA)
- 🇬🇦 Gabon (SYSCOHADA)
- 🇬🇭 Ghana (Ghana GAAP)
- 🇳🇬 Nigeria (Nigerian GAAP)
- 🇺🇸 États-Unis (US GAAP)
- 🇬🇧 Royaume-Uni (UK GAAP)

### 2. Colonne "Catégorie Budget"

**Nouvelle colonne** dans le tableau du plan comptable:

```
┌─────────┬──────────────────┬─────────┬────────┬──────────────────────────┐
│ Compte  │ Libellé          │ Type    │ Classe │ Catégorie Budget         │
├─────────┼──────────────────┼─────────┼────────┼──────────────────────────┤
│ 701000  │ Ventes produits  │ revenue │   7    │ [💰 Ventes de produits] │
│ 6411    │ Salaires         │ expense │   6    │ [📉 Salaires et...    ] │
│ 512000  │ Banque           │ asset   │   5    │ [❌ Non mappé         ] │
└─────────┴──────────────────┴─────────┴────────┴──────────────────────────┘
```

**Fonctionnalités**:
- Select déroulant pour chaque compte
- Catégories groupées par type (Revenus / Charges / Investissements)
- Badge coloré selon le type:
  - 💰 Vert: Revenus
  - 📉 Rouge: Charges
  - 🏗️ Bleu: Investissements
- Indicateur visuel si non mappé

### 3. Sauvegarde Automatique des Mappings

**Comportement**:
- Dès que l'utilisateur sélectionne une catégorie → Sauvegarde automatique dans `category_account_map`
- Message toast de confirmation
- Mise à jour en temps réel de l'interface
- Possibilité de supprimer un mapping en sélectionnant "Aucune catégorie"

**Données sauvegardées**:
```sql
INSERT INTO category_account_map (company_id, category_id, account_code)
VALUES ('uuid-company', 'uuid-category', '701000');
```

## 📊 Workflow Utilisateur

### Scénario 1: Nouvelle Entreprise

1. ✅ **Création de l'entreprise** dans l'onboarding
   - Sélectionner le pays (important!)

2. ✅ **Accéder à Comptabilité > Plan Comptable**
   - L'utilisateur voit le message "Aucun compte"
   - Un bouton "Initialiser plan standard" est affiché

3. ✅ **Cliquer sur "Initialiser plan standard"**
   - Le système détecte le pays (ex: Bénin)
   - Crée automatiquement ~150 comptes SYSCOHADA
   - Affiche "150 comptes standard ont été créés"

4. ✅ **Mapper les comptes aux catégories budgétaires**
   - Pour chaque compte, sélectionner une catégorie dans le dropdown
   - La sauvegarde est automatique
   - Un badge coloré apparaît

5. ✅ **Créer un budget**
   - Les catégories sont déjà pré-remplies (si migration budget exécutée)
   - Les mappings comptables sont déjà en place

6. ✅ **Le forecast fonctionne immédiatement**
   - Les écritures comptables sont automatiquement associées aux catégories budgétaires
   - Le forecast calcule Real YTD + Prorata + Budget restant

### Scénario 2: Import FEC

1. ✅ L'utilisateur a déjà un plan comptable initialisé
2. ✅ Import FEC ajoute des comptes supplémentaires (codes personnalisés)
3. ✅ L'utilisateur mappe manuellement ces nouveaux comptes
4. ✅ Le forecast intègre automatiquement ces nouveaux comptes

### Scénario 3: Entreprise Multi-Pays

```
Entreprise A (France)
└── Initialiser plan FR → 200 comptes PCG
    └── Mapper vers catégories budgétaires FR

Entreprise B (Bénin)
└── Initialiser plan BJ → 150 comptes SYSCOHADA
    └── Mapper vers catégories budgétaires SYSCOHADA
```

## 🎨 Interface Utilisateur

### État Vide
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                         📋                              │
│                    Aucun compte                         │
│                                                         │
│   Commencez par initialiser le plan comptable          │
│           standard de votre pays                        │
│                                                         │
│        [📥 Initialiser plan standard]                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### État Chargé
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Plan Comptable                                       │
│ Gérez vos comptes et associez-les à vos catégories     │
│                                                         │
│ [🔍 Rechercher...]  [Classe ▼]  [Type ▼]              │
│                                                         │
│ 150 comptes • 45 mappés sur 150                        │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Compte │ Libellé        │ Type    │ Catégorie    │  │
│ ├───────────────────────────────────────────────────┤  │
│ │ 701000 │ Ventes produit │ revenue │ [Select ▼]   │  │
│ │ 706000 │ Prestations    │ revenue │ [Select ▼]   │  │
│ │ 6411   │ Salaires       │ expense │ [Select ▼]   │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Select Catégorie Budget
```
┌─────────────────────────────────────────┐
│  Aucune catégorie                       │
│                                         │
│  💰 REVENUS                             │
│    ├─ Ventes de produits               │
│    ├─ Ventes de marchandises           │
│    ├─ Prestations de services          │
│    └─ Produits financiers              │
│                                         │
│  📉 CHARGES                             │
│    ├─ Achats de marchandises           │
│    ├─ Salaires et traitements          │
│    ├─ Charges sociales                 │
│    ├─ Loyers et charges locatives      │
│    ├─ Télécommunications               │
│    └─ Frais bancaires                  │
│                                         │
│  🏗️ INVESTISSEMENTS                    │
│    ├─ Immobilisations incorporelles    │
│    ├─ Immobilisations corporelles      │
│    └─ Matériel de transport            │
└─────────────────────────────────────────┘
```

## 🔧 Modifications Techniques

### Fichiers Modifiés

1. **`src/components/accounting/AccountingPage.tsx`**
   - Ligne 21: Import `ChartOfAccountsEnhanced`
   - Ligne 376: Utilisation du nouveau composant

2. **Nouveau fichier**: `src/components/accounting/ChartOfAccountsEnhanced.tsx`
   - Composant complet avec gestion mappings
   - ~450 lignes

### Connexions Supabase

**Tables utilisées**:
- ✅ `accounts` - Plan comptable de l'entreprise
- ✅ `chart_of_accounts_templates` - Référentiel des comptes standards
- ✅ `budget_categories` - Catégories budgétaires
- ✅ `category_account_map` - Mappings comptes ↔ catégories
- ✅ `companies` - Info entreprise (notamment `country_code`)

**Fonctions RPC**:
- ✅ `initialize_company_chart_of_accounts(p_company_id, p_country_code)`
  - Retourne le nombre de comptes créés

**Opérations CRUD**:
- ✅ SELECT sur `accounts`, `budget_categories`, `category_account_map`
- ✅ INSERT/UPDATE sur `category_account_map` (upsert)
- ✅ DELETE sur `category_account_map` (unmapping)

### Hooks Utilisés

- ✅ `useAccounting(companyId)` - Gestion des comptes
- ✅ `useAuth()` - Authentification
- ✅ `useToast()` - Notifications
- ✅ `useLocale()` - i18n (partiellement)

### États React

```typescript
const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
const [accountMappings, setAccountMappings] = useState<Map<string, string>>(new Map());
const [searchTerm, setSearchTerm] = useState('');
const [classFilter, setClassFilter] = useState('');
const [typeFilter, setTypeFilter] = useState('');
const [initializingChart, setInitializingChart] = useState(false);
const [savingMapping, setSavingMapping] = useState<string | null>(null);
```

## 🐛 Points d'Attention

### 1. Catégories Budgétaires Pré-Requises

Pour que les mappings fonctionnent, il faut que:
- ✅ Les catégories budgétaires existent dans `budget_categories`
- ✅ Un budget ait été créé pour l'entreprise

**Solution**: Exécuter la migration `20250104_seed_budget_mappings.sql` qui crée les catégories standards

### 2. Country Code de l'Entreprise

Le pays doit être renseigné dans `companies.country_code`:
- Utiliser les codes ISO 3166-1 alpha-2 (FR, BJ, CI, TG, CM, GA, GH, NG, US, UK)

### 3. Performance avec Beaucoup de Comptes

Si une entreprise a >500 comptes:
- Implémenter la pagination
- Ou lazy loading
- Ou virtualisation (react-window)

### 4. Comptes Sans Catégorie

C'est normal pour:
- Comptes de bilan (actif, passif, capitaux propres)
- Comptes de trésorerie
- Comptes techniques

Seuls les comptes de charges (classe 6) et produits (classe 7) doivent être mappés pour le forecast.

## 📝 TODO (Améliorations Futures)

### Court Terme
- [ ] Ajouter un filtre "Non mappés uniquement"
- [ ] Afficher le pourcentage de comptes mappés
- [ ] Bouton "Mapper automatiquement" basé sur les noms de comptes
- [ ] Export CSV du plan comptable avec mappings

### Moyen Terme
- [ ] Suggérer des mappings intelligents (ML/IA)
- [ ] Historique des modifications de mappings
- [ ] Gestion des comptes inactifs/archivés
- [ ] Validation des mappings (alertes si incohérent)

### Long Terme
- [ ] Templates de mappings par secteur d'activité
- [ ] Import/Export de configurations de mappings
- [ ] Duplication de mappings entre entreprises
- [ ] API pour synchroniser avec logiciels externes

## ✅ Checklist de Déploiement

- [x] Migration SQL `20250104_seed_chart_of_accounts.sql` exécutée
- [x] Migration SQL `20250104_seed_international_charts.sql` exécutée
- [x] Migration SQL `20250104_seed_budget_mappings.sql` exécutée
- [x] Migration SQL `20250104_budget_forecast_adapted.sql` exécutée
- [x] Composant `ChartOfAccountsEnhanced.tsx` créé
- [x] `AccountingPage.tsx` mis à jour
- [ ] Test avec une vraie entreprise
- [ ] Vérifier que le forecast fonctionne avec les mappings
- [ ] Tester sur mobile/tablette
- [ ] Ajouter traductions manquantes (i18n)

## 🎓 Formation Utilisateur

**Message d'onboarding suggéré**:

> 💡 **Conseil**: Pour utiliser le forecast budgétaire, associez vos comptes comptables à vos catégories budgétaires dans Comptabilité > Plan Comptable.
>
> Cliquez sur "Initialiser plan standard" pour créer automatiquement les comptes de votre pays, puis associez chaque compte à une catégorie via le menu déroulant.

---

*Date: 2025-01-04*
*Version: 1.0*
