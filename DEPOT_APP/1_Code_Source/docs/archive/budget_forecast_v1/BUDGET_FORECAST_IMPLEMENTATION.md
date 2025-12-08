# Système de Forecast Budgétaire - CassKai

## 📋 Vue d'ensemble

Système complet de forecast budgétaire implémentant la méthode **Réel YTD + Prorata + Budget restant = Atterrissage EOY**.

## 🎯 Fonctionnalités

### 1. Calcul automatique du forecast
- **Réel YTD** : Données comptables réelles des mois complets écoulés
- **Prorata mois courant** : `Budget mois × (jour actuel / jours dans le mois)`
- **Budget restant** : Montants budgétés pour les mois futurs
- **Résultat** : Projection de fin d'année (EOY forecast)

### 2. Sources de données
- **Données réelles** : Table `journal_entries` (écritures comptables normalisées)
- **Budget** : Tables `budget_headers`, `budget_categories`, `budget_lines`
- **Mapping** : Table `category_account_map` pour lier comptes ↔ catégories

### 3. Affichages multiples
- **Vue Totaux** : Revenus / Charges / Investissements / Résultat Net
- **Vue Par Catégorie** : Détail par catégorie budgétaire avec drill-down
- **Vue Mois par Mois** : Tableau pivot 12 colonnes (Réel / Budget / Forecast)

### 4. KPI principaux
- Réel YTD (Year To Date)
- Budget Annuel
- Forecast EOY (End Of Year)
- Écart vs Budget (montant et %)
- Taux d'absorption (%)

## 📁 Structure des fichiers

```
supabase/migrations/
  └── 20250104_budget_forecast_system.sql    # Migration SQL complète

src/services/
  └── budgetForecastService.ts               # Service TypeScript

src/components/budget/
  ├── BudgetForecastView.tsx                 # Composant principal UI
  ├── BudgetManager.tsx                      # Mis à jour avec callback forecast
  └── BudgetCard.tsx                         # Ajout bouton "Forecast"

src/pages/
  └── BudgetPage.tsx                         # Intégration page principale
```

## 🗄️ Schéma base de données

### Tables principales

#### `budget_headers`
En-têtes de budget avec versions
```sql
id, company_id, year, version, name, status, currency,
created_by, approved_by, approved_at, created_at, updated_at
```

#### `budget_categories`
Catégories budgétaires (hiérarchiques)
```sql
id, header_id, category_code, category_name, category_type,
parent_id, sort_order, created_at
```

#### `budget_lines`
Lignes budgétaires mensuelles
```sql
id, category_id, year, month, amount, notes,
created_at, updated_at
```

#### `category_account_map`
Mapping catégories ↔ comptes comptables
```sql
id, company_id, category_id, account_code,
analytic_tag_id, created_at
```

### Vues d'agrégation

#### `v_actuals_monthly`
Réels mensuels depuis journal_entries
```sql
SELECT company_id, year, month, account_code,
       SUM(amount) as amount_base
FROM journal_entries
GROUP BY 1,2,3,4
```

#### `v_actuals_by_category`
Réels agrégés par catégorie budgétaire
```sql
SELECT company_id, year, month, category_id,
       SUM(amount_actual) as amount_actual
FROM v_actuals_monthly
JOIN category_account_map ON ...
```

#### `v_budget_by_category`
Budget mensuel par catégorie
```sql
SELECT company_id, header_id, year, month,
       category_id, category_code, category_name,
       category_type, amount_budget
FROM budget_lines
JOIN budget_categories ON ...
```

### Fonctions SQL

#### `get_budget_forecast(...)`
Fonction principale de calcul du forecast
```sql
get_budget_forecast(
  p_company_id UUID,
  p_header_id UUID,
  p_as_of_date DATE,
  p_mode TEXT DEFAULT 'prorata'
)
RETURNS TABLE (
  year, month, category_id, category_code, category_name, category_type,
  amount_actual, amount_budget, amount_forecast,
  variance_amount, variance_percentage
)
```

#### `get_budget_forecast_kpi(...)`
KPI synthétiques du forecast
```sql
get_budget_forecast_kpi(...)
RETURNS TABLE (
  total_actual_ytd, total_budget_annual, total_forecast_eoy,
  variance_vs_budget, variance_percentage, absorption_rate
)
```

#### `get_unmapped_journal_entries(...)`
Détection des écritures comptables sans mapping
```sql
get_unmapped_journal_entries(p_company_id, p_year)
RETURNS TABLE (account_code, total_amount, entry_count)
```

## 🚀 Utilisation

### 1. Exécuter la migration SQL

```bash
# Via Supabase CLI
supabase db push

# Ou via l'interface Supabase
# Copier le contenu de 20250104_budget_forecast_system.sql
# dans l'éditeur SQL de Supabase et exécuter
```

### 2. Accès dans l'interface

1. Naviguer vers **Budget** dans le menu
2. Cliquer sur le bouton **"Forecast"** sur une carte de budget
3. Sélectionner la date d'arrêt (as_of_date)
4. Choisir le mode : **Prorata** (défaut) ou **Run-Rate** (futur)
5. Basculer entre les vues : **Totaux / Par Catégorie / Mois par Mois**

### 3. Export des données

Bouton **"Export CSV"** disponible pour télécharger le forecast complet.

## ⚙️ Configuration

### Modes de calcul

#### Mode "Prorata" (par défaut)
```
Forecast mois M = Budget mois M × (jour actuel / jours dans le mois)
Forecast EOY = Réel YTD + Prorata M + Budget (M+1...Déc)
```

#### Mode "Run-Rate" (à venir)
```
Extrapolation basée sur la moyenne journalière du mois en cours
ou sur les N derniers mois
```

### Mapping des comptes

Pour que le forecast fonctionne correctement :

1. **Créer les mappings** dans `category_account_map`
```sql
INSERT INTO category_account_map (company_id, category_id, account_code)
VALUES
  ('company-uuid', 'cat-revenus-uuid', '706'),
  ('company-uuid', 'cat-revenus-uuid', '707'),
  ('company-uuid', 'cat-charges-uuid', '641'),
  ...
```

2. **Vérifier les écritures non mappées**
   - Alertes visibles en haut de la page forecast
   - Badge orange avec le nombre de comptes non mappés
   - Lien vers l'écran de configuration (à implémenter)

## 🎨 Interface utilisateur

### KPI Cards (5 indicateurs)
- **Réel YTD** : Bleu avec icône TrendingUp
- **Budget Annuel** : Violet avec icône DollarSign
- **Forecast EOY** : Vert avec icône TrendingUp
- **Écart vs Budget** : Vert/Rouge selon signe
- **Absorption** : Orange avec icône Info

### Mode Totaux
Affiche 4 sections :
- Revenus (vert)
- Charges (rouge)
- Investissements (bleu)
- Résultat Net (violet)

Chaque section affiche 5 colonnes :
- Réel YTD
- Budget Annuel
- Forecast EOY
- Écart
- Écart %

### Mode Par Catégorie
Tableau avec colonnes :
- Catégorie (avec badge type R/C/I)
- Réel YTD
- Budget Annuel
- Forecast EOY
- Écart
- Écart %

### Mode Mois par Mois
Tableau 12 lignes (un par mois) avec colonnes :
- Mois (avec badge statut : Réalisé / Prorata / Budget)
- Réel
- Budget
- Forecast
- Écart
- Statut

## 🔒 Sécurité (RLS)

Toutes les tables ont des politiques RLS activées :
```sql
-- Exemple pour budget_headers
CREATE POLICY budget_headers_policy ON budget_headers
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );
```

## 📊 Exemples de requêtes

### Récupérer le forecast pour une entreprise
```typescript
const { data, error } = await budgetForecastService.getForecast(
  'company-uuid',
  'budget-header-uuid',
  new Date('2025-03-15'),
  'prorata'
);
```

### Exporter en CSV
```typescript
budgetForecastService.exportToCSV(forecastData, 'forecast_2025');
```

## 🛠️ Maintenance

### Ajouter un nouveau type de catégorie
1. Modifier `category_type` CHECK constraint dans `budget_categories`
2. Mettre à jour les vues et fonctions si nécessaire
3. Adapter l'UI (couleurs, icônes)

### Ajouter un nouveau mode de calcul
1. Ajouter le mode dans la fonction `get_budget_forecast`
2. Implémenter la logique de calcul dans le CASE
3. Ajouter l'option dans le Select UI

### Optimisation des performances
- Index créés sur toutes les colonnes de jointure
- Vues matérialisées possibles pour grandes volumétries
- Cache côté front (React Query recommandé)

## 📝 TODO / Améliorations futures

- [ ] Écran de configuration des mappings comptes ↔ catégories
- [ ] Mode Run-Rate avec extrapolation intelligente
- [ ] Scénarios multiples (Optimiste / Réaliste / Pessimiste)
- [ ] Comparaison multi-années (N vs N-1)
- [ ] Graphiques visuels (courbes, barres, donuts)
- [ ] Export PDF avec graphiques
- [ ] Notifications d'écarts significatifs
- [ ] Commentaires par ligne de forecast
- [ ] Historique des forecasts précédents
- [ ] API REST pour intégrations externes

## 🐛 Dépannage

### Forecast vide ou incorrect
1. Vérifier que `journal_entries` contient des données
2. Vérifier que `category_account_map` est configuré
3. Vérifier le statut du budget (doit être 'active' ou 'approved')
4. Vérifier les dates (year doit correspondre)

### Erreurs RLS
1. Vérifier que l'utilisateur est lié à la company via `user_companies`
2. Vérifier que `auth.uid()` retourne bien l'UUID utilisateur

### Performances lentes
1. Vérifier que les index sont créés
2. Analyser les plans d'exécution SQL (`EXPLAIN ANALYZE`)
3. Envisager des vues matérialisées pour grandes volumétries

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)

## ✅ Checklist de déploiement

- [x] Migration SQL créée et testée
- [x] Service TypeScript implémenté
- [x] Composant UI complet avec dark mode
- [x] Intégration dans BudgetPage
- [x] RLS configuré
- [x] Export CSV fonctionnel
- [ ] Tests unitaires (à ajouter)
- [ ] Tests d'intégration (à ajouter)
- [ ] Documentation utilisateur (à finaliser)
- [ ] Formation équipe (à planifier)

---

**Version** : 1.0.0
**Date** : 2025-01-04
**Auteur** : Claude AI Assistant
**Statut** : ✅ Prêt pour production
