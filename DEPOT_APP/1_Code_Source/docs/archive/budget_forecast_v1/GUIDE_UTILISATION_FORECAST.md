# Guide d'Utilisation du Forecast Budgétaire

## 🎯 Comment accéder au Forecast dans l'application

### Étape 1: Accéder à la page Budgets
1. Connectez-vous à l'application
2. Dans le menu latéral, cliquez sur **"Budgets"**
3. Vous verrez la liste de vos budgets sous forme de cartes

### Étape 2: Cliquer sur le bouton Forecast
Sur chaque carte de budget, vous verrez un bouton **"Forecast"** avec une icône 📈 (TrendingUp):

```
┌─────────────────────────────────────────┐
│  Budget 2025 - Version 1                │
│  ──────────────────────────────────────  │
│                                          │
│  Revenus:      1 500 000 €              │
│  Charges:      1 200 000 €              │
│  Résultat Net:   300 000 €              │
│                                          │
│  ──────────────────────────────────────  │
│  Créé le 04/01/2025                      │
│                                          │
│                     [📈 Forecast] [✏️ Modifier] │
└─────────────────────────────────────────┘
```

### Étape 3: Visualiser le Forecast
Après avoir cliqué sur **"Forecast"**, vous accédez à une nouvelle vue avec:

## 📊 Les 5 KPI en haut de page

```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   Réel YTD   │Budget Annuel │Forecast EOY  │    Écart     │  Taux Abs.   │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│  450 000 €   │ 1 500 000 €  │ 1 520 000 €  │ +20 000 €    │    30%       │
│              │              │              │   (+1.3%)    │              │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

**Explication des KPI**:
- **Réel YTD**: Montant réalisé depuis le début de l'année (Year To Date)
- **Budget Annuel**: Budget total prévu pour l'année
- **Forecast EOY**: Prévision d'atterrissage fin d'année (End Of Year)
- **Écart**: Différence entre forecast et budget (montant et %)
- **Taux Absorption**: Réalisé / Budget (en %)

## 🔍 Les 3 Modes de Visualisation

### Mode 1: Vue "Totaux" (par défaut)

Affiche 4 blocs agrégés:

```
┌─────────────────────────────────────┐
│ 💰 REVENUS                          │
├─────────────────────────────────────┤
│ Réel YTD:        450 000 €          │
│ Budget Annuel: 1 500 000 €          │
│ Forecast EOY:  1 520 000 €          │
│ Écart:          +20 000 € (+1.3%)   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📉 CHARGES                          │
├─────────────────────────────────────┤
│ Réel YTD:        380 000 €          │
│ Budget Annuel: 1 200 000 €          │
│ Forecast EOY:  1 180 000 €          │
│ Écart:          -20 000 € (-1.7%)   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🏗️ INVESTISSEMENTS                  │
├─────────────────────────────────────┤
│ Réel YTD:         30 000 €          │
│ Budget Annuel:   150 000 €          │
│ Forecast EOY:    145 000 €          │
│ Écart:           -5 000 € (-3.3%)   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📊 RÉSULTAT NET                     │
├─────────────────────────────────────┤
│ Réel YTD:         40 000 €          │
│ Budget Annuel:   150 000 €          │
│ Forecast EOY:    195 000 €          │
│ Écart:          +45 000 € (+30%)    │
└─────────────────────────────────────┘
```

### Mode 2: Vue "Par Catégorie"

Détail par catégorie budgétaire:

```
┌────────────────────────────────────────────────────────────────────┐
│ CATÉGORIE          │ Réel YTD │ Budget   │ Forecast │ Écart       │
├────────────────────────────────────────────────────────────────────┤
│ 💰 REVENUS                                                         │
├────────────────────────────────────────────────────────────────────┤
│ Ventes             │ 300 000€ │ 900 000€ │ 910 000€ │ +10 000€    │
│ Prestations        │ 150 000€ │ 600 000€ │ 610 000€ │ +10 000€    │
├────────────────────────────────────────────────────────────────────┤
│ 📉 CHARGES                                                         │
├────────────────────────────────────────────────────────────────────┤
│ Salaires           │ 250 000€ │ 800 000€ │ 780 000€ │ -20 000€    │
│ Loyers             │  80 000€ │ 240 000€ │ 240 000€ │       0€    │
│ Marketing          │  50 000€ │ 160 000€ │ 160 000€ │       0€    │
└────────────────────────────────────────────────────────────────────┘
```

### Mode 3: Vue "Mois par Mois"

Vision mensuelle complète:

```
┌──────────────────────────────────────────────────────────────────┐
│ MOIS       │  Réel    │  Budget  │ Forecast │ Écart     │ Statut │
├──────────────────────────────────────────────────────────────────┤
│ Janvier    │ 120 000€ │ 125 000€ │ 120 000€ │ -5 000€   │ ✅ Passé│
│ Février    │ 110 000€ │ 125 000€ │ 110 000€ │-15 000€   │ ✅ Passé│
│ Mars       │ 130 000€ │ 125 000€ │ 130 000€ │ +5 000€   │ ✅ Passé│
│ Avril      │  90 000€ │ 125 000€ │ 115 000€ │-10 000€   │ 🔵 En cours│
│ Mai        │       0€ │ 125 000€ │ 125 000€ │      0€   │ ⏳ Futur│
│ Juin       │       0€ │ 125 000€ │ 125 000€ │      0€   │ ⏳ Futur│
│ ...        │      ... │      ... │      ... │      ...  │    ...  │
│ Décembre   │       0€ │ 125 000€ │ 125 000€ │      0€   │ ⏳ Futur│
└──────────────────────────────────────────────────────────────────┘
```

**Légende**:
- ✅ **Passé**: Montants réalisés depuis `journal_entries`
- 🔵 **En cours**: Réel + Prorata du budget
- ⏳ **Futur**: Budget complet

## 🔧 Fonctionnalités Supplémentaires

### Bouton "Rafraîchir"
- Recharge les données en temps réel
- Utile après ajout d'écritures comptables

### Mode de Calcul
Sélecteur avec 2 options:
- **Prorata**: Budget × (jour_actuel / jours_dans_mois)
- **Run Rate**: Basé sur la tendance actuelle

### Export CSV
- Bouton pour télécharger le forecast
- Format CSV pour Excel/Google Sheets

### Écritures Non Mappées
Si des écritures comptables ne sont pas associées à une catégorie budgétaire, un bandeau d'alerte s'affiche:

```
⚠️ Attention: 15 écritures comptables (45 000€) ne sont pas mappées
│ Compte 706000: 25 000€ (10 écritures)
│ Compte 641200: 15 000€ (3 écritures)
│ Compte 613100:  5 000€ (2 écritures)
```

## ⚙️ Configuration Requise (pour l'admin)

### 1. Créer des Budgets
- Aller dans "Budgets" > "Nouveau Budget"
- Définir les catégories (Revenus, Charges, Investissements)
- Saisir les montants mensuels

### 2. Mapper les Comptes Comptables
**IMPORTANT**: Pour que le forecast fonctionne, il faut associer les comptes comptables aux catégories budgétaires.

Exemple de mapping à créer en SQL:

```sql
INSERT INTO category_account_map (company_id, category_id, account_code)
VALUES
  -- Revenus
  ('votre-company-id', 'category-ventes-id', '706000'),
  ('votre-company-id', 'category-ventes-id', '707000'),

  -- Charges
  ('votre-company-id', 'category-salaires-id', '641000'),
  ('votre-company-id', 'category-salaires-id', '645000'),
  ('votre-company-id', 'category-loyers-id', '613000');
```

### 3. Avoir des Écritures Comptables
- Les écritures doivent avoir le statut `posted` (validées)
- Elles doivent être dans `journal_entries` + `journal_entry_lines`

## 🎨 Navigation

**Retour à la liste**: Bouton "← Retour à la liste" en haut à gauche

## 📱 Responsive

Le forecast fonctionne sur:
- 💻 Desktop
- 📱 Tablette
- 📱 Mobile (vue adaptée)

## 🌙 Mode Sombre

Tout l'interface du forecast est compatible avec le mode sombre de l'application.

## 🚨 Dépannage

**Problème**: Le bouton "Forecast" n'apparaît pas
- ✅ Vérifier que la migration SQL a été appliquée
- ✅ Vérifier que `onViewForecast` est bien passé dans `BudgetManager`

**Problème**: Le forecast affiche "0€" partout
- ✅ Vérifier qu'il y a des écritures comptables avec `status = 'posted'`
- ✅ Vérifier que les mappings `category_account_map` existent
- ✅ Vérifier que les comptes correspondent

**Problème**: Erreur au chargement
- ✅ Ouvrir la console (F12) pour voir l'erreur
- ✅ Vérifier que les fonctions SQL existent: `get_budget_forecast`, `get_budget_forecast_kpi`

---

*Pour toute question technique, consulter `BUDGET_FORECAST_READY.md`*
