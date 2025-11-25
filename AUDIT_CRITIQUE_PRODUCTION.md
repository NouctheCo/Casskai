# AUDIT CRITIQUE - CASSKAI PRODUCTION
## Date: 2025-11-07
## Statut: URGENT - DONNÉES MOCKÉES EN PRODUCTION

---

## 🚨 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. DASHBOARD - Données mockées au lieu de vraies données
**Fichier**: `src/components/dashboard/AnimatedDashboard.tsx`
**Ligne**: 151-220
**Problème**: Le dashboard affiche des données mockées hardcodées au lieu de vraies données comptables
```typescript
const mockData: DashboardData = {
  revenue: { current: 87500, change: 12.5 },
  clients: { current: 1245, change: 8.3 },
  // ... TOUTES LES DONNÉES SONT FAUSSES
}
const dashboardData = data || mockData; // Utilise les fausses données si pas de vraies
```
**Impact**: 🔴 CRITIQUE - L'utilisateur voit de fausses données financières
**Solution requise**: Remplacer par appels réels à `useDashboardData` avec gestion d'erreur appropriée

---

### 2. SERVICE FISCAL - Toutes les fonctions retournent des tableaux vides
**Fichier**: `src/services/taxService.ts`
**Lignes**: 474-568
**Problème**: TOUTES les fonctions fiscales sont des stubs qui retournent des données vides
```typescript
// Ligne 476: getTaxDashboardData() - retourne mockData vide
// Ligne 507: getTaxDeclarations() - retourne []
// Ligne 525: getTaxCalendar() - retourne []
// Ligne 543: getTaxAlerts() - retourne []
// Ligne 561: getTaxObligations() - retourne []
```
**Impact**: 🔴 CRITIQUE - Module fiscal complètement non fonctionnel
**Solution requise**: Implémenter chaque fonction avec vraies requêtes Supabase

---

### 3. SERVICE TIERS - Aging Report non implémenté
**Fichier**: `src/services/thirdPartiesService.ts`
**Ligne**: 349-358
**Problème**: La fonction d'aging report (balance âgée) retourne toujours un tableau vide
```typescript
const mockData: AgingReport[] = [];
return { data: mockData };
```
**Impact**: 🟠 IMPORTANT - Fonctionnalité comptable clé manquante
**Solution requise**: Implémenter calcul réel de la balance âgée clients/fournisseurs

---

### 4. PLAN COMPTABLE - Initialisation par pays NON AUTOMATIQUE
**Fichier**: `src/components/accounting/ChartOfAccountsEnhanced.tsx`
**Ligne**: 103-153
**Problème**: Le plan comptable doit être initialisé MANUELLEMENT par l'utilisateur
- La fonction RPC Supabase existe: `initialize_company_chart_of_accounts`
- Mais elle n'est JAMAIS appelée automatiquement à la création d'entreprise
- L'utilisateur doit cliquer sur "Initialiser plan standard"

**Impact**: 🔴 CRITIQUE - Règle métier fondamentale non respectée
**Règle métier attendue**:
```
Lors de la création d'une entreprise avec pays = "FR"
→ Le plan comptable français (PCG) doit être automatiquement initialisé
→ Pour BE: plan belge, pour CH: plan suisse, etc.
```

**Solution requise**:
1. Hook dans `enterpriseService.createEnterprise()` ou `onboardingService`
2. Appeler automatiquement `initialize_company_chart_of_accounts(company_id, country_code)`
3. Gérer les erreurs et notifier l'utilisateur

---

### 5. DONNÉES PCG - Seulement dans le code frontend
**Fichier**: `src/data/pcg.ts`
**Problème**: Le Plan Comptable Général existe dans le code TypeScript mais pas complètement en base
- Table `chart_of_accounts_templates` existe dans Supabase
- Mais les données du PCG français doivent être insérées en base
- Actuellement le PCG existe uniquement côté client

**Impact**: 🟠 IMPORTANT - Incohérence données frontend/backend
**Solution requise**: Migration Supabase pour peupler `chart_of_accounts_templates` avec pcg.ts

---

### 6. AUTRES SERVICES AVEC MOCK DATA

**Services identifiés avec données mockées**:
- `src/services/reportsService.ts` - Reports financiers
- `src/services/purchasesService.ts` - Achats
- `src/services/forecastsService.ts` - Prévisions
- `src/services/budgetService.test.ts` - Budget (test file mais utilisé?)
- `src/services/inventoryService.ts` - Inventaire
- `src/services/contractsService.ts` - Contrats
- `src/services/accountingDataService.ts` - Données comptables
- `src/pages/ProjectsPage.tsx` - Projets
- `src/pages/InventoryPage.tsx` - Page inventaire

**Action requise**: Audit détaillé de chaque service

---

## 📋 RÈGLES MÉTIER MANQUANTES

### 1. Initialisation automatique du plan comptable
- **Quand**: À la création d'entreprise
- **Comment**: Selon country_code de l'entreprise
- **Pays supportés**: FR (PCG), BE, CH, LU, CA, US, UK
- **Statut**: ❌ NON IMPLÉMENTÉ

### 2. Calcul automatique de la TVA
- **Statut**: ⚠️ PARTIELLEMENT IMPLÉMENTÉ
- Taux de TVA par pays manquants
- Règles d'exigibilité non implémentées

### 3. Clôture d'exercice automatique
- **Statut**: ❌ NON IMPLÉMENTÉ
- Report à nouveau
- Calcul résultat fiscal

### 4. Lettrage automatique
- **Statut**: ⚠️ PARTIELLEMENT IMPLÉMENTÉ
- Lettrage clients/fournisseurs
- Rapprochement bancaire

### 5. Gestion multi-devises
- **Statut**: ⚠️ STRUCTURE EXISTE mais pas de calcul de conversion
- Taux de change historiques manquants

---

## 🎯 PLAN D'ACTION PRIORITAIRE

### PHASE 1 - CORRECTIONS CRITIQUES (Urgent)
1. ✅ Supprimer mockData du Dashboard
2. ✅ Implémenter vrai chargement données Dashboard
3. ✅ Implémenter initialisation automatique plan comptable
4. ✅ Implémenter fonctions taxService
5. ✅ Implémenter aging report

### PHASE 2 - RÈGLES MÉTIER (Important)
6. Implémenter calcul TVA automatique
7. Implémenter lettrage automatique
8. Peupler templates plan comptable pour tous les pays
9. Implémenter conversion multi-devises

### PHASE 3 - FONCTIONNALITÉS AVANCÉES
10. Clôture d'exercice
11. Prévisions intelligentes
12. Rapports avancés

---

## 🔍 FICHIERS À AUDITER EN DÉTAIL

### Services critiques
- [x] `taxService.ts` - AUDIT FAIT - 5 fonctions mockées
- [x] `dashboardData` - AUDIT FAIT - mockData hardcodé
- [x] `thirdPartiesService.ts` - AUDIT FAIT - aging report vide
- [ ] `reportsService.ts` - À AUDITER
- [ ] `accountingDataService.ts` - À AUDITER
- [ ] `budgetService.ts` - À AUDITER
- [ ] `forecastsService.ts` - À AUDITER
- [ ] `purchasesService.ts` - À AUDITER
- [ ] `inventoryService.ts` - À AUDITER
- [ ] `contractsService.ts` - À AUDITER

### Pages critiques
- [ ] `ProjectsPage.tsx` - À AUDITER
- [ ] `InventoryPage.tsx` - À AUDITER
- [ ] `TaxPage.tsx` - À AUDITER

---

## 💰 COMPARAISON AVEC CONCURRENTS

### SAP Business One
✅ Plan comptable auto-initialisé par pays
✅ TVA calculée automatiquement
✅ Multi-devises avec taux ECB
✅ Lettrage automatique
✅ Clôture exercice guidée

### Pennylane
✅ Plan comptable pré-rempli
✅ Récupération bancaire auto
✅ TVA pré-calculée
✅ Rapprochement bancaire AI
✅ Exports comptables standards

### **CassKai (état actuel)**
❌ Plan comptable manuel
❌ Dashboard avec fausses données
❌ Module fiscal non fonctionnel
❌ Aging report vide
⚠️ Fonctionnalités basiques seulement

---

## ⚠️ CONCLUSION

**STATUT GLOBAL**: 🔴 NON PRÊT POUR PRODUCTION PROFESSIONNELLE

L'application a une excellente structure et architecture, mais contient trop de données mockées et de fonctionnalités non implémentées pour concurrencer des outils professionnels comme SAP ou Pennylane.

**Actions immédiates requises**:
1. Éliminer TOUTES les données mockées
2. Implémenter l'initialisation automatique du plan comptable
3. Implémenter les fonctions fiscales
4. Tester avec des vraies données d'entreprise

**Estimation**: 3-5 jours de développement intensif pour Phase 1
