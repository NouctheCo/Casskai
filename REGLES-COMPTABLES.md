# Règles Comptables Implémentées - CassKai

## 📋 Vue d'ensemble

CassKai implémente les **règles comptables françaises** (Plan Comptable Général - PCG) et internationales (SYSCOHADA) selon les normes professionnelles.

## ✅ Corrections Apportées

### 1. **Bug de Réinitialisation du Formulaire** ✅ CORRIGÉ

**Problème :** Lorsqu'on cliquait sur "Nouvelle écriture", le formulaire affichait les données de la dernière écriture passée.

**Solution :**
- Ajout d'un `useEffect` dans `EntryFormDialog` qui réinitialise complètement le formulaire
- Génération automatique d'une nouvelle référence à chaque ouverture
- Les champs sont maintenant vierges pour chaque nouvelle écriture

**Fichier modifié :** `src/components/accounting/OptimizedJournalEntriesTab.tsx`

---

### 2. **Règles Débit/Crédit Selon la Nature des Comptes** ✅ IMPLÉMENTÉ

**Problème :** L'utilisateur pouvait mettre n'importe quel compte au débit ou au crédit, sans respect des principes comptables.

**Solution :** Création du service `AccountingRulesService` qui implémente :

#### Classes de Comptes (PCG)

| Classe | Type | Nature | Côté habituel | Exemples |
|--------|------|--------|---------------|----------|
| **1** | Capitaux | CRÉDIT | Créditeur | 101-Capital, 164-Emprunts |
| **2** | Immobilisations | DÉBIT | Débiteur | 211-Terrains, 218-Matériel |
| **3** | Stocks | DÉBIT | Débiteur | 31-Matières, 37-Marchandises |
| **4** | Tiers | **MIXTE** | Variable | 411-Clients (D), 401-Fournisseurs (C) |
| **5** | Financiers | DÉBIT | Débiteur | 512-Banque, 53-Caisse |
| **6** | Charges | DÉBIT | Toujours débit | 607-Achats, 641-Salaires |
| **7** | Produits | CRÉDIT | Toujours crédit | 707-Ventes |

#### Règles de Validation

##### ⚠️ Avertissements (non bloquants)
L'application affiche un **avertissement visuel** quand :
- Un compte de classe 6 (charges) est crédité
- Un compte de classe 7 (produits) est débité
- Un compte d'immobilisation (2) est crédité
- Etc.

**Exemple :**
```
⚠️ Attention: Ce compte est habituellement au DÉBIT (Comptes de charges)
Ce type de compte (classe 6) est généralement débité. Vérifiez votre saisie.
```

##### ❌ Erreurs (bloquantes)
- **Débit ET crédit simultanés** : Impossible de remplir les deux colonnes pour la même ligne
- **Écriture non équilibrée** : Total débit ≠ Total crédit
- **Minimum 2 lignes** : Une écriture doit avoir au moins 2 lignes

**Fichier créé :** `src/services/accountingRulesService.ts`

---

### 3. **Empêcher Débit + Crédit Simultanés** ✅ IMPLÉMENTÉ

**Règle comptable :** Une ligne d'écriture ne peut PAS avoir simultanément un montant au débit ET au crédit.

**Solution :**
- Quand l'utilisateur remplit le débit, le crédit se vide automatiquement
- Quand l'utilisateur remplit le crédit, le débit se vide automatiquement

**Implémentation :**
```typescript
// ✅ RÈGLE COMPTABLE: Si on remplit le débit, on vide le crédit (et inversement)
if (field === 'debit' && parseFloat(value) > 0) {
  updatedLine.credit = '';
}
if (field === 'credit' && parseFloat(value) > 0) {
  updatedLine.debit = '';
}
```

**Fichier modifié :** `src/components/accounting/OptimizedJournalEntriesTab.tsx` (fonction `updateLine`)

---

### 4. **Numérotation Automatique des Écritures** ✅ IMPLÉMENTÉ

**Problème :** Pas de numérotation séquentielle automatique par journal et par année.

**Solution :** Format standardisé : `[CODE_JOURNAL]-[ANNÉE]-[NUMÉRO]`

**Exemples :**
- `VE-2025-00001` : Première vente de 2025
- `AC-2025-00123` : 123ème achat de 2025
- `BQ-2025-00456` : 456ème opération bancaire de 2025

**Avantages :**
- ✅ Traçabilité parfaite
- ✅ Conformité FEC (Fichier des Écritures Comptables)
- ✅ Numérotation séquentielle par journal
- ✅ Reset automatique chaque année

**Fichier :** `src/services/accountingRulesService.ts` (méthode `generateEntryNumber`)

---

### 5. **Affectation Automatique aux Journaux** ✅ IMPLÉMENTÉ

**Problème :** L'utilisateur devait choisir manuellement le journal pour chaque écriture.

**Solution :** Détection automatique selon les comptes utilisés.

#### Règles d'Affectation

| Journal | Code | Détection | Exemple |
|---------|------|-----------|---------|
| **Ventes** | VE | 411 (Clients) + 707 (Ventes) | Facture client |
| **Achats** | AC | 401 (Fournisseurs) + 607 (Achats) | Facture fournisseur |
| **Banque** | BQ | 512 (Banque) | Virement, prélèvement |
| **Caisse** | CA | 53 (Caisse) | Paiement espèces |
| **Opérations Diverses** | OD | Par défaut | Autres opérations |

**Méthode :** `AccountingRulesService.suggestJournal(accountNumbers[])`

---

### 6. **Templates d'Écritures Type** ✅ IMPLÉMENTÉ

Le service fournit des templates pour les opérations courantes :

#### Exemple : Vente de marchandises TTC
```typescript
411 - Clients                    1200,00 €  (DÉBIT)
  707 - Ventes                               1000,00 € (CRÉDIT)
  44571 - TVA collectée                       200,00 € (CRÉDIT)
```

#### Exemple : Achat de marchandises TTC
```typescript
607 - Achats                     1000,00 €  (DÉBIT)
44566 - TVA déductible            200,00 €  (DÉBIT)
  401 - Fournisseurs                        1200,00 € (CRÉDIT)
```

**Fichier :** `src/services/accountingRulesService.ts` (constante `JOURNAL_ENTRY_TEMPLATES`)

---

## 🔄 Intégration avec les Modules

### Modules déjà intégrés :
- ✅ **Module Accounting** : Saisie manuelle avec validation
- ✅ **Module FEC** : Import FEC avec validation des écritures

### À intégrer :
- ⏳ **Module Achats** : Génération automatique d'écritures lors de la saisie d'une facture fournisseur
- ⏳ **Module Banques** : Génération automatique lors des rapprochements bancaires
- ⏳ **Module Facturation** : Génération automatique lors de l'émission d'une facture client

---

## 📊 Validation Complète d'une Écriture

Quand une écriture est créée, les vérifications suivantes sont effectuées :

### Vérifications Automatiques

1. ✅ **Équilibre** : Total Débit = Total Crédit (tolérance 0,01€)
2. ✅ **Nombre de lignes** : Minimum 2 lignes
3. ✅ **Comptes valides** : Tous les comptes doivent exister dans le plan comptable
4. ✅ **Débit/Crédit exclusif** : Une ligne ne peut avoir les deux remplis
5. ⚠️ **Nature des comptes** : Avertissement si usage inhabituel (ex: charge créditée)

### Exemple de Validation

```typescript
const validation = AccountingRulesService.validateJournalEntry({
  lines: [
    { accountNumber: '411', debitAmount: 1200, creditAmount: 0 },
    { accountNumber: '707', debitAmount: 0, creditAmount: 1000 },
    { accountNumber: '44571', debitAmount: 0, creditAmount: 200 },
  ]
});

// Résultat :
// valid: true
// errors: []
// warnings: []
```

---

## 🚀 Utilisation

### Pour les Développeurs

```typescript
import AccountingRulesService from '@/services/accountingRulesService';

// 1. Valider le côté d'un compte
const validation = AccountingRulesService.validateAccountSide('607', 1000, 0);
// valid: true (les achats vont au débit)

// 2. Générer un numéro d'écriture
const entryNumber = await AccountingRulesService.generateEntryNumber(
  companyId,
  journalId,
  '2025-12-09'
);
// Résultat : "VE-2025-00123"

// 3. Suggérer un journal
const journalType = AccountingRulesService.suggestJournal(['411', '707']);
// Résultat : JournalType.SALE

// 4. Obtenir la nature d'un compte
const nature = AccountingRulesService.getAccountNature('607');
// Résultat : AccountNature.DEBIT
```

---

## 📚 Références Comptables

### Plan Comptable Général (PCG)
- Classe 1 : Comptes de capitaux
- Classe 2 : Comptes d'immobilisations
- Classe 3 : Comptes de stocks
- Classe 4 : Comptes de tiers
- Classe 5 : Comptes financiers
- Classe 6 : Comptes de charges
- Classe 7 : Comptes de produits

### Principe de la Partie Double
> "Toute opération comptable se traduit par une double écriture :
> - Un débit dans un ou plusieurs comptes
> - Un crédit d'égal montant dans un ou plusieurs autres comptes"

### Équation Fondamentale
```
ACTIF = PASSIF + CAPITAUX PROPRES
```

---

## 🔧 Fichiers Modifiés/Créés

### Créés
- ✅ `src/services/accountingRulesService.ts` - Service de règles comptables
- ✅ `REGLES-COMPTABLES.md` - Cette documentation

### Modifiés
- ✅ `src/components/accounting/OptimizedJournalEntriesTab.tsx`
  - Correction bug réinitialisation
  - Validation débit/crédit
  - Empêcher débit+crédit simultanés
  - Affichage des avertissements

- ✅ `src/services/journalEntriesService.ts`
  - Import AccountingRulesService
  - Utilisation de `generateEntryNumber`
  - Ajout méthode `validateJournalEntry`

---

## ⚠️ Points d'Attention

### Comptes de Classe 4 (Tiers)
Les comptes de classe 4 sont **MIXTES** :
- **411** (Clients) : Nature DÉBITRICE → Les créances clients sont à l'actif
- **401** (Fournisseurs) : Nature CRÉDITRICE → Les dettes fournisseurs sont au passif
- **43** (Sécurité sociale) : Nature CRÉDITRICE → Dettes sociales
- **44** (État, TVA) : MIXTE selon le sous-compte

### Comptes « flexibles » (aucun avertissement côté Débit/Crédit)
Certains comptes sont **couramment mouvementés** au débit comme au crédit selon l'opération. Afin d'éviter des avertissements inutiles, CassKai les traite comme **flexibles** :

- **512** Banque (et sous-comptes)
- **53** Caisse
- **411** Clients (auxiliaires)
- **401** Fournisseurs (auxiliaires)
- **467** Autres débiteurs/créditeurs
- **44*** État, TVA et assimilés

Ces comptes ne déclenchent **pas d'avertissement** pour l'utilisation du côté **Débit/Crédit**. Les règles bloquantes continuent de s'appliquer (pas de débit+crédit sur la même ligne, écriture équilibrée, etc.).

#### Personnalisation par standard ou société
La liste des préfixes « flexibles » est **configurable** côté code si besoin.

- API : `AccountingRulesService.setFlexibleAccountPrefixes([ '512', '411', '401', ... ])`
- Lecture actuelle (par défaut) : `['512','53','411','401','467','44']`

Cette personnalisation permet d'adapter les règles aux pratiques spécifiques (PCG, SYSCOHADA, conventions internes) **sans modifier la logique de validation**.

### Conformité FEC
La numérotation automatique respecte les exigences du FEC :
- ✅ Numérotation séquentielle
- ✅ Pas de trous dans la numérotation par journal
- ✅ Format standardisé
- ✅ Traçabilité complète

---

## 📞 Support

Pour toute question sur les règles comptables :
- 📧 Contact : NOUTCHE CONSEIL
- 📄 SIREN : 909 672 685
- 🌐 Documentation complète dans le code source

---

**Date de mise à jour :** 9 décembre 2025
**Version :** 1.0.0
**Auteur :** NOUTCHE CONSEIL - Expert-Comptable IA
