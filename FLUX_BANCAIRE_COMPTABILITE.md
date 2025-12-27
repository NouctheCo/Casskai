# 🔄 Flux Complet : Module Banque → Module Comptabilité

## Vue d'ensemble

Ce document décrit comment les transactions bancaires validées en Banque arrivent dans la Comptabilité sous forme d'écritures modifiables.

```
┌────────────────────────────────────────┐
│     MODULE BANQUE                      │
│  (TransactionCategorization)           │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────▼─────────┐
         │ Transaction       │
         │ En attente        │
         │ (pending)         │
         └────────┬──────────┘
                  │
         ┌────────▼──────────┐
         │ 1️⃣ Utilisateur    │
         │ sélectionne       │
         │ - Compte de charge│
         │   (607, 401, etc) │
         │ - Compte 512 (si  │
         │   plusieurs)      │
         └────────┬──────────┘
                  │
         ┌────────▼──────────────────────┐
         │ 2️⃣ Création Écriture          │
         │                               │
         │ Journal: Banque               │
         │ Date: Date transaction        │
         │ Statut: DRAFT ✏️              │
         └────────┬──────────────────────┘
                  │
         ┌────────▼──────────────────────┐
         │ 3️⃣ Création Lignes d'écriture │
         │                               │
         │ Ligne 1:                      │
         │ - Compte: 607 (ou sélectionné)│
         │ - Débit: XXX €                │
         │ - Crédit: 0 €                 │
         │                               │
         │ Ligne 2:                      │
         │ - Compte: 512 (Banque)        │
         │ - Débit: 0 €                  │
         │ - Crédit: XXX €               │
         │                               │
         │ (Exemple: Dépense)            │
         └────────┬──────────────────────┘
                  │
         ┌────────▼──────────────────────┐
         │ 4️⃣ Transaction passe à:       │
         │ status = 'reconciled' ✅      │
         │ matched_entry_id = entry_id   │
         └────────┬──────────────────────┘
                  │
┌─────────────────▼──────────────────────┐
│  MODULE COMPTABILITÉ                   │
│  (AccountingPage)                      │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────▼─────────────────┐
         │ Écriture affichée:        │
         │ ✏️ BROUILLON (orange)      │
         │ Journal: Banque           │
         │ Montants: Équilibrés      │
         │ Modifiable jusqu'à        │
         │ validation définitive     │
         └────────┬─────────────────┘
                  │
         ┌────────▼──────────────────┐
         │ 5️⃣ Comptable peut:       │
         │                          │
         │ ✏️ Modifier              │
         │ - Montants              │
         │ - Description           │
         │ - Comptes (si besoin)   │
         │ - Ajouter/supprimer     │
         │   des lignes (TVA, etc) │
         │                          │
         │ ✅ Valider              │
         │ - Passer à 'posted'     │
         │ - Intégrer comptabilité │
         │ - Verrouiller l'écriture│
         └──────────────────────────┘
```

---

## 📋 Détails par étape

### Étape 1️⃣ : Sélection en Banque

**Module** : `src/components/banking/TransactionCategorization.tsx`

**Actions utilisateur** :
```tsx
{
  bankingAccountOptions.length > 1 && (
    // Sélecteur du compte 512
    // "Quel compte bancaire utiliser ?"
  )
}

// Interface TransactionRow
{
  selectedAccount,      // ex: "607 - Fournitures"
  customDescription     // Optionnel
}
```

**Validation** :
- ✅ Un compte 512 doit être sélectionné
- ✅ Un compte de contrepartie doit être choisi (607, 401, 411, etc)

---

### Étape 2️⃣ : Création Écriture en Draft

**Code** : `TransactionCategorization.tsx:230-240`

```typescript
const journalEntry = {
  company_id: currentCompany.id,
  journal_id: bankJournal.id,
  entry_date: transaction.transaction_date,
  description: customDescription || transaction.description,
  reference_number: transaction.reference,
  status: 'draft',  // 📋 BROUILLON - Modifiable en comptabilité
};

const { data: entry } = await supabase
  .from('journal_entries')
  .insert(journalEntry)
  .select()
  .single();
```

**Résultat** :
- ✅ Écriture créée avec `status = 'draft'`
- ✅ ID de l'écriture conservé pour les lignes

---

### Étape 3️⃣ : Création Lignes Équilibrées

**Logique** :

**Si DÉPENSE** (montant négatif) :
```
Ligne 1 : Débit   607 (Fournitures)    500,00 €
Ligne 2 : Crédit  512 (Banque)               500,00 €
         ─────────────────────────────────────────
         Équilibre : Débit = Crédit ✅
```

**Si RECETTE** (montant positif) :
```
Ligne 1 : Débit   512 (Banque)        2000,00 €
Ligne 2 : Crédit  411 (Clients)             2000,00 €
         ─────────────────────────────────────────
         Équilibre : Débit = Crédit ✅
```

**Code** : `TransactionCategorization.tsx:270-320`

```typescript
const lines = [];

if (isExpense) {
  // Dépense : Débit charge, Crédit banque
  lines.push({
    journal_entry_id: entry.id,
    account_id: accountId,           // 607
    debit_amount: absAmount,         // 500
    credit_amount: 0,
    line_order: 1,
  });
  lines.push({
    journal_entry_id: entry.id,
    account_id: selectedBankingAccount, // 512
    debit_amount: 0,
    credit_amount: absAmount,        // 500
    line_order: 2,
  });
} else {
  // Recette : Débit banque, Crédit produit
  // ...inverse...
}

await supabase
  .from('journal_entry_lines')
  .insert(lines)
  .select();
```

---

### Étape 4️⃣ : Transaction Marquée Réconciliée

**Code** : `TransactionCategorization.tsx:330-340`

```typescript
const { error: updateError } = await supabase
  .from('bank_transactions')
  .update({
    status: 'reconciled',           // ✅ Réconciliée
    is_reconciled: true,
    matched_entry_id: entry.id,     // Lien vers écriture
    reconciliation_date: new Date().toISOString(),
  })
  .eq('id', transactionId);
```

**Résultat** :
- ✅ Transaction bancaire passe de `pending` → `reconciled`
- ✅ Conserve le lien vers l'écriture comptable créée
- ✅ Affichée avec le badge "✅ Rapprochée"

---

## 🔧 En Comptabilité (Module Accounting)

### Affichage

**Fichier** : `src/pages/AccountingPage.tsx:450-465`

```typescript
if (entry.status === 'draft') {
  icon = FileText;
  color = 'orange';           // 🟠 Couleur brouillon
  label = 'brouillon';
} else if (entry.status === 'posted') {
  icon = FileText;
  color = 'green';            // 🟢 Couleur validée
  label = 'validée';
}
```

### Modifications Possibles

**Édition** : `src/components/accounting/OptimizedJournalEntriesTab.tsx`

L'utilisateur comptable peut :

1. **Modifier les montants**
   ```
   Exemple: Ajouter de la TVA
   Avant:  
   - Débit 607 : 500
   - Crédit 512 : 500
   
   Après:
   - Débit 607 : 500
   - Débit 4457 (TVA) : 100
   - Crédit 512 : 600
   ```

2. **Modifier la description**
   ```
   Avant: "PAIEMENT AMAZON"
   Après: "Fournitures bureau - Facture AMZ-001"
   ```

3. **Ajouter des lignes**
   ```
   Ajout TVA collectée, intra-groupe, etc.
   ```

4. **Valider définitivement**
   ```
   Passe status: 'draft' → 'posted'
   Écriture verrouillée ✅
   Modifiable seulement par annulation
   ```

---

## 💡 Cas d'Usage Courants

### Cas 1: Achat avec TVA 20%

**Banque** :
```
Transaction: FOURNITURES OFFICE DEPOT - 600 €
Catégorisée en: 607 (Fournitures)
```

**Comptabilité** (brouillon) :
```
Ligne 1: Débit 607 (Fournitures)          500,00
Ligne 2: Débit 4457 (TVA déductible)      100,00
Ligne 3: Crédit 512 (Banque)                      600,00
                                          ───────────
                                          Équilibre ✅
```

**Actions comptable** :
- ✅ Vérifier le décompte TVA
- ✅ Valider l'écriture
- ✅ Intégrer automatiquement dans les calculs TVA mensuels

---

### Cas 2: Virement Client Multi-Devises

**Banque** :
```
Transaction: VIR CLIENT ABC - 2500 EUR (reçu le 22/12)
Catégorisée en: 411 (Clients)
```

**Comptabilité** (brouillon) :
```
Ligne 1: Débit 512 (Banque EUR)          2500,00
Ligne 2: Crédit 411 (Clients)                    2500,00
                                         ───────────
                                         Équilibre ✅
```

**Actions comptable** :
- ✅ Lettrer contre la facture originale
- ✅ Valider le règlement complet
- ✅ Maj solde client automatique

---

### Cas 3: Transaction à Lettrer (Paiement partiel)

**Banque** :
```
Transaction: VIR ABC PARTIAL - 1000 EUR (sur 2500 facturés)
Catégorisée en: 411 (Clients)
```

**Comptabilité** (brouillon) :
```
Ligne 1: Débit 512 (Banque)               1000,00
Ligne 2: Crédit 411 (Clients)                    1000,00
                                         ───────────
                                         Équilibre ✅
```

**Actions comptable** :
- ✅ Lettrer partiellement contre facture
- ✅ Solde client = 1500 € en attente
- ✅ Relance automatique si délai passé

---

## ✅ Avantages du Statut Draft

| Aspect | Bénéfice |
|--------|----------|
| **Vérification** | Comptable vérifies les montants avant validation |
| **Flexibilité** | Ajout TVA, lettrage, modifications faciles |
| **Traçabilité** | Historique des modifications conservé |
| **Intégrité** | Évite les erreurs automatiques |
| **Conformité** | Respect bonnes pratiques comptables |

---

## 🚨 Flux d'Erreur

### Erreur: "Compte comptable bancaire non configuré"

**Cause** : Aucun compte 512 trouvé en comptabilité

**Solution** :
1. Aller dans Comptabilité > Plan Comptable
2. Créer un compte 512 (ex: "512100 - Compte Courant")
3. Revenir en Banque et catégoriser

**Code d'erreur** : `toast.error('Veuillez sélectionner un compte bancaire (512)')`

---

### Erreur: "Compte introuvable"

**Cause** : Le compte sélectionné n'existe pas

**Solution** :
1. Vérifier que le compte est actif en comptabilité
2. Recharger la page (F5)
3. Sélectionner un nouveau compte

---

## 📊 Statuts de Transaction & Écriture

### Transaction Bancaire

| Statut | Description | Qui change |
|--------|-------------|-----------|
| `pending` | En attente | Initial (import) |
| `categorized` | Catégorisée mais non validée | Utilisateur → Clic catégoriser |
| `reconciled` | Rapprochée avec écriture | Utilisateur → Clic valider |
| `ignored` | Ignorée délibérément | Utilisateur → Clic ignorer |

### Écriture Comptable

| Statut | Description | Éditable | Qui change |
|--------|-------------|----------|-----------|
| `draft` | Brouillon | ✅ Oui | Création automatique |
| `posted` | Validée | ❌ Non | Comptable → Valider |
| `archived` | Archivée | ❌ Non | Admin → Archivage |

---

## 🔗 Références Fichiers

| Fichier | Rôle | Ligne |
|---------|------|-------|
| `TransactionCategorization.tsx` | Interface Banque | 180-350 |
| `AccountingPage.tsx` | Affichage Comptabilité | 450-470 |
| `OptimizedJournalEntriesTab.tsx` | Édition Écriture | 430-470 |
| `journal_entries` (Supabase) | Table écritures | schema |
| `journal_entry_lines` (Supabase) | Table lignes | schema |

---

## 📞 Support

**Questions** : Voir `REGLES-COMPTABLES.md` et `INTEGRATION-AUTOMATIQUE.md`

**Date** : 22 décembre 2025
**Version** : 1.0.0
