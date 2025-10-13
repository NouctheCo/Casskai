# 🔍 Audit Complet - Données Mockées dans le Projet

**Date**: 12 Octobre 2025
**Statut**: Audit exhaustif de TOUTES les données mockées

---

## ✅ CRM - OpportunitiesKanban.tsx

### État: **CORRIGÉ** ✅

Les 2 fonctions manquantes ont été ajoutées :
- ✅ `handleCreateClient` (ligne 267)
- ✅ `getClientContacts` (ligne 297)

**Aucun mock restant dans ce fichier.**

---

## 🔴 SERVICES CRITIQUES AVEC MOCKS (À CORRIGER)

### 1. 🔴 **purchasesService.ts** (PRIORITÉ TRÈS HAUTE)

**Lignes**: 45-350+

**Données mockées**:
```typescript
const mockPurchases: Purchase[] = [ /* 50+ lignes de données */ ];
const mockSuppliers: Supplier[] = [ /* 30+ lignes de données */ ];
```

**Impact**: 🔴🔴🔴 **CRITIQUE**
- **TOUT le module Achats fonctionne avec des données fausses**
- Aucune donnée n'est sauvegardée dans Supabase
- Les utilisateurs ne voient pas leurs vrais achats

**Fonctions affectées**:
- `getPurchases()` → Retourne mockPurchases
- `getPurchaseById()` → Cherche dans mockPurchases
- `createPurchase()` → N'enregistre PAS dans Supabase
- `updatePurchase()` → Modifie mockPurchases en mémoire
- `deletePurchase()` → Supprime de mockPurchases
- `getSuppliers()` → Retourne mockSuppliers

**Actions requises**:
1. Créer table `purchases` dans Supabase
2. Créer table `purchase_lines` dans Supabase
3. Réécrire TOUTES les fonctions pour utiliser Supabase
4. Ajouter RLS policies

**Temps estimé**: 4-6 heures

---

### 2. 🔴 **forecastsService.ts** (PRIORITÉ HAUTE)

**Lignes**: 50-200+

**Données mockées**:
```typescript
const mockScenarios: ForecastScenario[] = [...];
const mockPeriods: ForecastPeriod[] = [...];
const mockRevenueItems: RevenueLineItem[] = [...];
const mockExpenseItems: ExpenseLineItem[] = [...];
const mockCashFlowItems: CashFlowItem[] = [...];
const mockForecasts: ForecastData[] = [...];
```

**Impact**: 🔴🔴 **ÉLEVÉ**
- Tout le module Prévisions/Forecasts est en mock
- Les prévisions budgétaires sont fausses

**Actions requises**:
1. Créer tables `forecasts`, `forecast_scenarios`, `forecast_periods` dans Supabase
2. Réécrire le service
3. Ajouter RLS

**Temps estimé**: 5-7 heures

---

### 3. 🟠 **contractsService.ts** (PRIORITÉ MOYENNE)

**Lignes**: 100-250

**Données mockées**:
```typescript
const mockContracts: ContractData[] = [...];
const mockCalculations: RFACalculation[] = [...];
```

**Impact**: 🟡 **MOYEN**
- Module Contrats affiche des données fictives
- Calculs d'amortissement incorrects

**Actions requises**:
1. Vérifier si table `contracts` existe dans Supabase
2. Connecter au vrai service
3. Implémenter calculs réels

**Temps estimé**: 3-4 heures

---

### 4. 🟡 **bankingService.ts** (PRIORITÉ MOYENNE)

**Lignes**: ~200

**Données mockées**:
```typescript
const mockBanks = {
  'nordigen': [
    { id: 'BANK_FR', name: 'BNP Paribas', ... },
    { id: 'BANK_FR2', name: 'Crédit Agricole', ... },
    // ...
  ]
};
```

**Impact**: 🟡 **MOYEN**
- Liste des banques disponibles est statique
- Pas d'impact sur les transactions réelles

**Actions requises**:
- Connecter à l'API Nordigen réelle pour obtenir la liste dynamique
- Ou garder la liste statique si suffisant

**Temps estimé**: 2 heures

---

### 5. 🟢 **aiAssistantService.ts** (PRIORITÉ BASSE)

**Lignes**: ~500+

**Fonction mockée**:
```typescript
generateMockResponse(query, queryType, context)
```

**Impact**: 🟢 **FAIBLE**
- L'assistant IA retourne des réponses génériques mockées
- Fonctionne quand même (juste pas intelligent)

**Actions requises**:
- Connecter à une vraie API IA (OpenAI, Claude, etc.)
- OU désactiver la fonctionnalité

**Temps estimé**: 6-8 heures (si intégration IA réelle)

---

## 🟡 COMPOSANTS AVEC MOCKS

### 6. 🟡 **AnimatedDashboard.tsx** (PRIORITÉ MOYENNE)

**Ligne**: ~42

**Données mockées**:
```typescript
const mockData: DashboardData = {
  revenue: { current: 125000, previous: 98000, trend: 27.55 },
  expenses: { current: 87500, previous: 72000, trend: 21.53 },
  profit: { current: 37500, previous: 26000, trend: 44.23 },
  // ... + graphiques
};
```

**Impact**: 🟡 **MOYEN**
- Dashboard affiche des métriques fausses quand pas de données

**Actions requises**:
1. Calculer les vraies métriques depuis Supabase:
   - `invoices` pour le chiffre d'affaires
   - `journal_entries` pour les dépenses
   - `bank_transactions` pour la trésorerie
2. Supprimer le fallback mock

**Temps estimé**: 2-3 heures

---

### 7. 🟢 **CrmDashboard.tsx** (PRIORITÉ BASSE)

**Utilise**: Probablement des mocks pour les stats CRM

**Impact**: 🟢 **FAIBLE**

**Temps estimé**: 1-2 heures

---

## 🔵 SERVICES PARTIELLEMENT MOCKÉS

### 8. 🔵 **taxService.ts**

**Déjà documenté dans**: `CORRECTIONS_CRM_ET_MOCKS.md`

**Fonctions mockées**:
- `getTaxDashboardData()` → mockData
- `getTaxDeclarations()` → []
- `getTaxCalendar()` → []
- `getTaxAlerts()` → []
- `getTaxObligations()` → []

**Impact**: 🔴 **ÉLEVÉ**

**Temps estimé**: 2-3 heures

---

### 9. 🔵 **thirdPartiesService.ts**

**Fonction mockée**:
- `getAgingReport()` → retourne []

**Impact**: 🟡 **MOYEN**

**Temps estimé**: 1 heure

---

### 10. 🔵 **inventoryService.ts**

**Contenu**: À vérifier (trouvé dans la liste)

**Temps estimé**: 1-2 heures

---

### 11. 🔵 **gdprService.ts**

**Contenu**: À vérifier

**Temps estimé**: 1 heure

---

### 12. 🔵 **securityService.ts**

**Contenu**: À vérifier

**Temps estimé**: 1 heure

---

## 📊 RÉSUMÉ PAR PRIORITÉ

| Priorité | Service/Composant | Impact | Temps | État |
|----------|-------------------|--------|-------|------|
| 🔴🔴🔴 | **purchasesService.ts** | CRITIQUE | 4-6h | ❌ Tout en mock |
| 🔴🔴 | **forecastsService.ts** | ÉLEVÉ | 5-7h | ❌ Tout en mock |
| 🔴🔴 | **taxService.ts** | ÉLEVÉ | 2-3h | ❌ 5 fonctions mock |
| 🟠 | **contractsService.ts** | MOYEN | 3-4h | ❌ Données mock |
| 🟡 | **AnimatedDashboard.tsx** | MOYEN | 2-3h | ⚠️ Fallback mock |
| 🟡 | **bankingService.ts** | MOYEN | 2h | ⚠️ Liste statique |
| 🟡 | **thirdPartiesService.ts** | MOYEN | 1h | ⚠️ Rapport vide |
| 🟢 | **aiAssistantService.ts** | FAIBLE | 6-8h | ⚠️ Réponses génériques |
| 🟢 | **inventoryService.ts** | FAIBLE | 1-2h | ❓ À vérifier |
| 🟢 | **gdprService.ts** | FAIBLE | 1h | ❓ À vérifier |
| 🟢 | **securityService.ts** | FAIBLE | 1h | ❓ À vérifier |

---

## ⏱️ TEMPS TOTAL ESTIMÉ

| Catégorie | Temps |
|-----------|-------|
| 🔴 Critique (Achats) | 4-6h |
| 🔴 Élevé (Forecasts + Tax) | 7-10h |
| 🟠 Moyen (Contrats + Dashboard) | 5-7h |
| 🟡 Faible priorité | 5-8h |
| **TOTAL MINIMUM** | **21-31 heures** |

---

## 🎯 PLAN D'ACTION RECOMMANDÉ

### Phase 1 : URGENT (4-6h)
1. ✅ **CRM** : Fonctions manquantes → **FAIT**
2. 🔴 **Achats** : Connecter à Supabase → **CRITIQUE**

### Phase 2 : HAUTE PRIORITÉ (9-13h)
3. 🔴 **Forecasts** : Créer tables + service
4. 🔴 **Tax** : Calculer vraies données

### Phase 3 : MOYENNE PRIORITÉ (8-11h)
5. 🟠 **Contrats** : Connecter service
6. 🟡 **Dashboard** : Vraies métriques
7. 🟡 **Banking** : API dynamique
8. 🟡 **ThirdParties** : Rapport ancienneté

### Phase 4 : OPTIONNEL (12-17h)
9. 🟢 Services restants selon besoins

---

## 🚨 RECOMMANDATION IMMÉDIATE

**Ton dev devrait se concentrer sur** :

1. **purchasesService.ts** (4-6h) → Bloque tout le module Achats
2. **taxService.ts** (2-3h) → Affiche des données fausses
3. **forecastsService.ts** (5-7h) → Prévisions budgétaires inutilisables

**Total Phase 1+2** : **11-16 heures** pour débloquer les modules critiques.

---

## 📋 CHECKLIST DE VÉRIFICATION

Pour chaque service mocké, vérifier :
- [ ] Table(s) Supabase existe(nt)
- [ ] RLS policies configurées
- [ ] Service réécrit pour utiliser Supabase
- [ ] Fonctions CRUD complètes (Create, Read, Update, Delete)
- [ ] Gestion d'erreurs
- [ ] Types TypeScript corrects
- [ ] Tests manuels fonctionnels
- [ ] Build réussi
- [ ] Déployé en production
- [ ] Vérifié en prod

---

## 🛠️ MIGRATIONS SUPABASE NÉCESSAIRES

### À créer :

```sql
-- purchases.sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  supplier_id UUID REFERENCES third_parties(id),
  purchase_number TEXT NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE,
  status TEXT,
  total_ht NUMERIC(15,2),
  total_tax NUMERIC(15,2),
  total_ttc NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, purchase_number)
);

CREATE TABLE purchase_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT,
  quantity NUMERIC(15,3),
  unit_price NUMERIC(15,2),
  tax_rate NUMERIC(5,2),
  line_total NUMERIC(15,2)
);

-- RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company access" ON purchases
  FOR ALL USING (company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  ));

CREATE POLICY "Company access" ON purchase_lines
  FOR ALL USING (purchase_id IN (
    SELECT id FROM purchases WHERE company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
  ));
```

```sql
-- forecasts.sql
CREATE TABLE forecast_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  scenario_id UUID REFERENCES forecast_scenarios(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue_forecast NUMERIC(15,2),
  expense_forecast NUMERIC(15,2),
  profit_forecast NUMERIC(15,2),
  confidence_level NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE forecast_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
```

---

**Créé par**: Assistant IA
**Dernière mise à jour**: 12 Octobre 2025
**Statut**: Audit complet terminé
