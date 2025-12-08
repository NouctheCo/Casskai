# 🔧 Plan de Corrections TypeScript - 69 Erreurs

## 📊 Résumé par Catégorie

| Catégorie | Nombre | Criticité | Temps estimé |
|-----------|--------|-----------|--------------|
| **1. Types Database manquants** | 6 | 🔴 Haute | 30 min |
| **2. Types Assets (export)** | 16 | 🔴 Haute | 15 min |
| **3. DashboardMetric/Chart** | 24 | 🟠 Moyenne | 45 min |
| **4. OpenAIService (account_code)** | 5 | 🟠 Moyenne | 30 min |
| **5. HR Service (méthodes manquantes)** | 2 | 🔴 Haute | 1h |
| **6. Invoices (issue_date)** | 5 | 🟠 Moyenne | 20 min |
| **7. RGPD/Team Services** | 6 | 🟡 Faible | 20 min |
| **8. CRM Opportunity** | 1 | 🟡 Faible | 10 min |
| **9. AcceptInvitationPage** | 1 | 🟡 Faible | 5 min |
| **10. TimeSeriesData** | 3 | 🟠 Moyenne | 15 min |

**Total : 69 erreurs | Temps estimé : 4h**

---

## 🎯 Ordre de Correction (Priorité)

### Phase 1 - Quick Wins (1h)
1. ✅ **Company.industry_type** - Déjà corrigé
2. **Types Assets export** (16 erreurs) - 15 min
3. **DashboardMetric units** (6 erreurs) - 15 min
4. **TimeSeriesData** (3 erreurs) - 15 min
5. **Invoices issue_date → invoice_date** (5 erreurs) - 15 min

### Phase 2 - Modules Critiques (2h)
6. **HR Service méthodes** (2 erreurs) - 1h
7. **OpenAIService account_code** (5 erreurs) - 30 min
8. **DashboardMetric propriétés** (18 erreurs) - 30 min

### Phase 3 - Polissage (1h)
9. **RGPD/Team Services** (6 erreurs) - 20 min
10. **CRM Opportunity** (1 erreur) - 10 min
11. **AcceptInvitationPage** (1 erreur) - 5 min
12. **Autres** - 25 min

---

## 📋 Détail des Corrections

### 1. Types Database Manquants

#### ExportFecModal.tsx (2 erreurs)
```
❌ src/components/accounting/ExportFecModal.tsx(67,25)
❌ src/components/accounting/ExportFecModal.tsx(68,30)

Erreur: Property 'accounting_standard' does not exist on type 'Company'.
```

**Analyse :** La propriété existe dans Supabase ✅
**Solution :** Régénérer les types Supabase

---

#### RealOperationalDashboard.tsx (2 erreurs)
```
❌ src/components/dashboard/RealOperationalDashboard.tsx(88,24)
❌ src/components/dashboard/RealOperationalDashboard.tsx(88,56)

Erreur: Property 'industry_type' does not exist
Erreur: Property 'sector' does not exist
```

**Analyse :** Déjà corrigé avec fallback ✅
**Solution :** Vérifier que le type Company auto-généré inclut ces colonnes

---

#### ThirdPartiesPage.tsx (3 erreurs)
```
❌ src/pages/ThirdPartiesPage.tsx(314,29)
❌ src/pages/ThirdPartiesPage.tsx(316,56)
❌ src/pages/ThirdPartiesPage.tsx(318,53)

Erreur: Property 'current_balance' does not exist on type 'UnifiedThirdParty'.
```

**Analyse :** La propriété existe dans Supabase ✅
**Solution :** Ajouter `current_balance` au type `UnifiedThirdParty`

---

### 2. Types Assets (16 erreurs) 🔴 CRITIQUE

```
❌ src/types/assets.types.ts(390-405)

Erreur: 'AssetCategory' only refers to a type, but is being used as a value here.
```

**Code problématique :**
```typescript
export default {
  AssetCategory,  // ❌ Type used as value
  Asset,
  AssetDepreciationScheduleLine,
  // ... 13 autres
}
```

**Solution :** Supprimer l'export default ou créer des constantes

---

### 3. DashboardMetric/Chart (24 erreurs)

#### Units invalides (6 erreurs)
```
❌ src/services/realDashboardKpiService.ts(349,9)
❌ src/services/realDashboardKpiService.ts(359,9)
❌ src/services/realDashboardKpiService.ts(367,9)
❌ src/services/realDashboardKpiService.ts(375,9)
❌ src/services/realDashboardKpiService.ts(382,9)
❌ src/services/realDashboardKpiService.ts(390,9)

Erreur: Type '"€"' is not assignable to type '"number" | "currency" | "days" | "percentage"'.
```

**Code problématique :**
```typescript
unit: '€'      // ❌ Doit être 'currency'
unit: '%'      // ❌ Doit être 'percentage'
unit: 'jours'  // ❌ Doit être 'days'
unit: ''       // ❌ Doit être 'number'
```

**Solution :** Mapper les units vers les valeurs autorisées

---

#### Propriétés manquantes (18 erreurs)
```
❌ src/components/dashboard/RealOperationalDashboard.tsx(136-170)

Erreur: Property 'label' does not exist on type 'DashboardMetric'.
Erreur: Property 'value' does not exist on type 'DashboardMetric'.
Erreur: Property 'trend' does not exist on type 'DashboardMetric'.
Erreur: Property 'change' does not exist on type 'DashboardMetric'.
Erreur: Property 'period' does not exist on type 'DashboardMetric'.
Erreur: Property 'importance' does not exist on type 'DashboardMetric'.
```

**Solution :** Ajouter ces propriétés au type `DashboardMetric`

---

### 4. OpenAIService account_code (5 erreurs)

```
❌ src/services/ai/OpenAIService.ts(164,60)
❌ src/services/ai/OpenAIService.ts(197,57)
❌ src/services/ai/OpenAIService.ts(462,62)
❌ src/services/ai/OpenAIService.ts(467,62)
❌ src/services/ai/OpenAIService.ts(551,60)

Erreur: Property 'account_number' does not exist on type '{ account_code: string; }'.
```

**Analyse :**
- Interface définit `account_code`
- Mais utilise `account_number` dans le code
- Alias SQL : `account_code:account_number`

**Solution :** Uniformiser - soit tout en `account_code`, soit tout en `account_number`

---

### 5. HR Service Méthodes Manquantes (2 erreurs) 🔴 CRITIQUE

```
❌ src/components/hr/TrainingTab.tsx(71,44)
❌ src/components/hr/TrainingTab.tsx(91,44)

Erreur: Property 'createTrainingCatalog' does not exist on type 'HRTrainingService'.
Erreur: Property 'createCertification' does not exist on type 'HRTrainingService'.
```

**Solution :** Implémenter ces 2 méthodes dans `hrTrainingService.ts`

---

### 6. Invoices (5 erreurs)

```
❌ src/components/invoicing/OptimizedInvoicesTab.tsx(1823,46)
❌ src/services/einvoicing/inbound/InboundService.ts(473,7)
❌ src/services/einvoicing/inbound/InboundService.ts(535,7)
❌ src/services/einvoicing/inbound/InboundService.ts(589,18)
❌ src/services/einvoicing/inbound/InboundService.ts(620,37)

Erreur: Property 'issue_date' used but 'invoice_date' required
```

**Solution :** Renommer `issue_date` → `invoice_date` (DB utilise `invoice_date` ✅)

---

### 7. RGPD/Team Services (6 erreurs)

```
❌ src/services/rgpdService.ts(877,24)
❌ src/services/rgpdService.ts(919,24)
❌ src/services/rgpdService.ts(966,24)

Erreur: Property 'logAction' does not exist on type 'AuditService'.

❌ src/services/teamService.ts(105,33)
❌ src/services/teamService.ts(106,40)
❌ src/services/teamService.ts(107,38)

Erreur: Property 'email' does not exist on type '{ email: any; }[]'.
```

**Solution :**
- Ajouter `logAction` à AuditService ou utiliser méthode existante
- Typer correctement le tableau users

---

### 8. CRM Opportunity (1 erreur)

```
❌ src/components/crm/NewActionModal.tsx(124,24)

Erreur: Property 'third_party_id' is missing
```

**Solution :** Ajouter `third_party_id` à l'objet

---

### 9. AcceptInvitationPage (1 erreur)

```
❌ src/pages/AcceptInvitationPage.tsx(97,39)

Erreur: Property 'name' does not exist on type '{ name: any; }[]'.
```

**Solution :** Array vs Object confusion - typer correctement

---

### 10. TimeSeriesData (3 erreurs)

```
❌ src/services/realDashboardKpiService.ts(405,9)
❌ src/services/realDashboardKpiService.ts(415,9)
❌ src/services/realDashboardKpiService.ts(425,9)

Erreur: Type '{ label: string; value: number; }[]' is not assignable to type 'TimeSeriesData[]'.
```

**Code retourné :**
```typescript
{ label: string; value: number; }[]
```

**Code attendu :**
```typescript
{ date: Date; current_year: number; }[]
```

**Solution :** Mapper les données au bon format

---

## ✅ Checklist de Validation

Après chaque correction :
- [ ] Relancer `npm run type-check`
- [ ] Vérifier que l'erreur a disparu
- [ ] Tester le module affecté manuellement
- [ ] Commit avec message descriptif

---

**Prêt à corriger ?** Commençons par les Quick Wins (Phase 1).
