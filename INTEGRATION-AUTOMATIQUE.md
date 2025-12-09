# Guide d'Intégration Automatique Comptable Multi-Modules

## 🌍 Principes Comptables Universels

### ✅ Ce qui est UNIVERSEL (même partout dans le monde)

Les règles implémentées dans CassKai sont basées sur des **principes comptables fondamentaux** valables dans **TOUS les pays** :

#### 1. **Principe de la Partie Double**
> "Pour chaque opération, un débit égale un crédit"

```
DÉBIT = CRÉDIT (toujours, sans exception)
```

#### 2. **Équation Fondamentale**
```
ACTIF = PASSIF + CAPITAUX PROPRES
```

#### 3. **Nature des Comptes**

| Type de Compte | Nature | Augmente au | Diminue au | Exemples |
|----------------|--------|-------------|------------|----------|
| **ACTIF** | Débitrice | DÉBIT | CRÉDIT | Immobilisations, Stocks, Banque, Clients |
| **PASSIF** | Créditrice | CRÉDIT | DÉBIT | Capital, Emprunts, Fournisseurs |
| **CHARGES** | Débitrice | DÉBIT | - | Achats, Salaires, Loyers |
| **PRODUITS** | Créditrice | CRÉDIT | - | Ventes, Prestations |

### ⚠️ Ce qui VARIE selon les pays

| Aspect | France (PCG) | SYSCOHADA | IFRS | US GAAP |
|--------|-------------|-----------|------|---------|
| **Structure** | Classes 1-8 | Classes 1-9 | Flexible | Flexible |
| **Clients** | 411xxx | 411xxx | Receivables | Accounts Receivable |
| **Fournisseurs** | 401xxx | 401xxx | Payables | Accounts Payable |
| **Ventes** | 707xxx | 707xxx | Revenue | Sales Revenue |
| **Achats** | 607xxx | 607xxx | Purchases | Cost of Goods Sold |
| **TVA collectée** | 44571 | 4433 | VAT Payable | Sales Tax Payable |
| **TVA déductible** | 44566 | 4431 | VAT Receivable | Sales Tax Receivable |

**IMPORTANT :** Les **numéros** changent, mais les **RÈGLES** restent identiques !

---

## 🔄 Intégrations Automatiques Disponibles

### 1. Module Facturation → Écritures Comptables

#### A. Facture de VENTE (Client)

**Schéma comptable universel :**
```
Débit   411 Clients              1200,00 €
  Crédit  707 Ventes                        1000,00 €
  Crédit  44571 TVA collectée                 200,00 €
```

**Code d'intégration :**

```typescript
import { autoAccountingService } from '@/services/autoAccountingIntegrationService';

// Après création/validation d'une facture de vente
const result = await autoAccountingService.generateInvoiceJournalEntry({
  id: invoice.id,
  company_id: currentCompany.id,
  third_party_id: client.id,
  third_party_name: client.name,
  invoice_number: 'FAC-2025-001',
  type: 'sale', // ⚠️ 'sale' = vente
  invoice_date: '2025-12-09',
  subtotal_excl_tax: 1000.00,  // HT
  total_tax_amount: 200.00,    // TVA
  total_incl_tax: 1200.00,     // TTC
  lines: [
    {
      account_id: accountVentes707.id,
      description: 'Vente produit A',
      subtotal_excl_tax: 1000.00,
      tax_amount: 200.00,
    }
  ],
});

if (result.success) {
  console.log('✅ Écriture créée:', result.entryId);
} else {
  console.error('❌ Erreur:', result.error);
}
```

#### B. Facture d'ACHAT (Fournisseur)

**Schéma comptable universel :**
```
Débit   607 Achats               1000,00 €
Débit   44566 TVA déductible       200,00 €
  Crédit  401 Fournisseurs                  1200,00 €
```

**Code d'intégration :**

```typescript
const result = await autoAccountingService.generateInvoiceJournalEntry({
  id: purchase.id,
  company_id: currentCompany.id,
  third_party_id: supplier.id,
  third_party_name: supplier.name,
  invoice_number: 'ACH-2025-001',
  type: 'purchase', // ⚠️ 'purchase' = achat
  invoice_date: '2025-12-09',
  subtotal_excl_tax: 1000.00,
  total_tax_amount: 200.00,
  total_incl_tax: 1200.00,
  lines: [
    {
      account_id: accountAchats607.id,
      description: 'Achat marchandises',
      subtotal_excl_tax: 1000.00,
      tax_amount: 200.00,
    }
  ],
});
```

---

### 2. Module Banques → Écritures Comptables

#### A. ENCAISSEMENT (Entrée d'argent)

**Schéma comptable universel :**
```
Débit   512 Banque               1200,00 €
  Crédit  411 Clients                       1200,00 €
```

**Code d'intégration :**

```typescript
const result = await autoAccountingService.generateBankTransactionEntry({
  id: transaction.id,
  company_id: currentCompany.id,
  bank_account_id: bankAccount512.id,
  transaction_date: '2025-12-09',
  amount: 1200.00,
  type: 'credit', // ⚠️ 'credit' = entrée d'argent
  description: 'Règlement client FAC-2025-001',
  counterpart_account_id: clientAccount411.id,
  reference: 'VIR-2025-001',
});
```

#### B. DÉCAISSEMENT (Sortie d'argent)

**Schéma comptable universel :**
```
Débit   401 Fournisseurs         1200,00 €
  Crédit  512 Banque                        1200,00 €
```

**Code d'intégration :**

```typescript
const result = await autoAccountingService.generateBankTransactionEntry({
  id: transaction.id,
  company_id: currentCompany.id,
  bank_account_id: bankAccount512.id,
  transaction_date: '2025-12-09',
  amount: 1200.00,
  type: 'debit', // ⚠️ 'debit' = sortie d'argent
  description: 'Paiement fournisseur ACH-2025-001',
  counterpart_account_id: supplierAccount401.id,
  reference: 'VIR-2025-002',
});
```

---

### 3. Module Achats → Écritures Comptables

**Code d'intégration :**

```typescript
const result = await autoAccountingService.generatePurchaseOrderEntry({
  id: purchase.id,
  company_id: currentCompany.id,
  supplier_id: supplier.id,
  supplier_name: supplier.name,
  order_number: 'BC-2025-001',
  order_date: '2025-12-09',
  total_excl_tax: 1000.00,
  total_tax: 200.00,
  total_incl_tax: 1200.00,
  items: [
    {
      account_id: accountAchats607.id,
      description: 'Achat produit B',
      amount_excl_tax: 1000.00,
    }
  ],
});
```

---

## 🎯 Points d'Intégration dans Votre Code

### A. Dans le Module Facturation

**Fichier :** `src/pages/InvoicingPage.tsx` ou `src/services/invoicingService.ts`

```typescript
// Après validation/émission d'une facture
async function handleInvoiceValidation(invoice: Invoice) {
  // 1. Valider la facture (logique existante)
  await validateInvoice(invoice);

  // 2. ✅ NOUVEAU : Générer automatiquement l'écriture comptable
  const result = await autoAccountingService.generateInvoiceJournalEntry({
    ...invoice,
    type: invoice.type === 'client' ? 'sale' : 'purchase',
  });

  if (result.success) {
    toast({
      title: "✅ Facture validée",
      description: `Écriture comptable créée automatiquement (${result.entryId})`,
    });
  } else {
    toast({
      title: "⚠️ Attention",
      description: `Facture validée mais écriture non créée : ${result.error}`,
      variant: "warning",
    });
  }
}
```

### B. Dans le Module Banques

**Fichier :** `src/pages/BanksPage.tsx` ou `src/services/bankService.ts`

```typescript
// Après rapprochement d'une transaction
async function handleTransactionReconciliation(transaction: BankTransaction) {
  // 1. Rapprocher la transaction (logique existante)
  await reconcileTransaction(transaction);

  // 2. ✅ NOUVEAU : Générer l'écriture automatiquement
  const result = await autoAccountingService.generateBankTransactionEntry({
    ...transaction,
    type: transaction.amount > 0 ? 'credit' : 'debit',
  });

  if (result.success) {
    toast({
      title: "✅ Transaction rapprochée",
      description: `Écriture comptable créée (${result.entryId})`,
    });
  }
}
```

### C. Dans le Module Achats

**Fichier :** `src/pages/PurchasesPage.tsx` ou `src/services/purchasesService.ts`

```typescript
// Après validation d'un bon de commande / facture fournisseur
async function handlePurchaseValidation(purchase: Purchase) {
  // 1. Valider l'achat (logique existante)
  await validatePurchase(purchase);

  // 2. ✅ NOUVEAU : Générer l'écriture automatiquement
  const result = await autoAccountingService.generatePurchaseOrderEntry(purchase);

  if (result.success) {
    toast({
      title: "✅ Achat validé",
      description: `Écriture comptable créée (${result.entryId})`,
    });
  }
}
```

---

## 🔍 Workflow Complet

```
┌─────────────────┐
│  Module Source  │  (Facturation, Banques, Achats)
└────────┬────────┘
         │
         │ 1. Validation de l'opération
         ▼
┌─────────────────────────────────┐
│ autoAccountingService            │
│ - Récupère les comptes           │
│ - Applique les règles comptables│
│ - Génère les lignes d'écriture  │
└────────┬────────────────────────┘
         │
         │ 2. Création de l'écriture
         ▼
┌─────────────────────────────────┐
│ journalEntriesService            │
│ - Valide l'équilibre             │
│ - Génère le numéro automatique   │
│ - Enregistre en base             │
└────────┬────────────────────────┘
         │
         │ 3. Résultat
         ▼
┌─────────────────────────────────┐
│ Écriture en brouillon            │
│ - Visible dans module Accounting│
│ - Prête à être validée           │
│ - Peut être modifiée/supprimée  │
└─────────────────────────────────┘
```

---

## ⚠️ Points Importants

### 1. Écritures en Brouillon
Les écritures générées automatiquement sont créées avec le statut `draft` (brouillon).
L'utilisateur doit les **valider manuellement** depuis le module Accounting.

**Pourquoi ?**
- ✅ Permet une vérification humaine
- ✅ Évite les erreurs automatiques non détectées
- ✅ Respect des bonnes pratiques comptables

### 2. Gestion des Erreurs
Le service retourne toujours un objet structuré :
```typescript
{
  success: boolean;
  entryId?: string;  // Si succès
  error?: string;    // Si échec
}
```

**Gestion recommandée :**
```typescript
const result = await autoAccountingService.generateInvoiceJournalEntry(invoice);

if (!result.success) {
  // Logger l'erreur mais ne pas bloquer l'opération principale
  console.error('Écriture comptable non créée:', result.error);

  // Notifier l'utilisateur
  toast({
    title: "⚠️ Attention",
    description: "Facture créée mais écriture comptable à générer manuellement",
    variant: "warning",
  });
}
```

### 3. Plans Comptables Personnalisés
Le service s'adapte automatiquement :
- Cherche les comptes 411, 401, 607, 707 dans votre plan comptable
- Si un compte n'existe pas, retourne une erreur explicite
- Supporte les variations (41100001, 40100001, etc.)

---

## 📚 Exemples Complets

### Exemple 1 : Intégration Complète Module Facturation

```typescript
// src/pages/InvoicingPage.tsx

import { autoAccountingService } from '@/services/autoAccountingIntegrationService';

async function onInvoiceSubmit(formData: InvoiceFormData) {
  try {
    // 1. Créer la facture (logique existante)
    const invoice = await invoicingService.createInvoice(formData);

    if (!invoice) {
      throw new Error('Erreur création facture');
    }

    // 2. ✅ Générer automatiquement l'écriture comptable
    const entryResult = await autoAccountingService.generateInvoiceJournalEntry({
      id: invoice.id,
      company_id: currentCompany.id,
      third_party_id: formData.clientId,
      third_party_name: formData.clientName,
      invoice_number: invoice.number,
      type: 'sale',
      invoice_date: invoice.date,
      subtotal_excl_tax: invoice.totalHT,
      total_tax_amount: invoice.totalTVA,
      total_incl_tax: invoice.totalTTC,
      lines: invoice.lines.map(line => ({
        account_id: line.accountId,
        description: line.description,
        subtotal_excl_tax: line.amountHT,
        tax_amount: line.taxAmount,
      })),
    });

    // 3. Notifier l'utilisateur
    if (entryResult.success) {
      toast({
        title: "✅ Facture créée avec succès",
        description: `Écriture comptable générée automatiquement (réf: ${entryResult.entryId})`,
      });
    } else {
      toast({
        title: "⚠️ Facture créée",
        description: `Écriture comptable à créer manuellement : ${entryResult.error}`,
        variant: "warning",
      });
    }

    // 4. Rafraîchir la liste
    await loadInvoices();

  } catch (error) {
    console.error('Erreur:', error);
    toast({
      title: "❌ Erreur",
      description: "Impossible de créer la facture",
      variant: "destructive",
    });
  }
}
```

---

## 🚀 Activation de l'Intégration

### Étape 1 : Importer le Service

```typescript
import { autoAccountingService } from '@/services/autoAccountingIntegrationService';
```

### Étape 2 : Appeler au Bon Moment

**Après validation :** ✅ Recommandé
```typescript
// Après que l'utilisateur ait validé l'opération
await handleValidation();
await autoAccountingService.generateXXX();
```

**Avant validation :** ❌ Déconseillé
```typescript
// Ne pas générer l'écriture si l'opération n'est pas finalisée
```

### Étape 3 : Tester

1. Créer une facture de vente
2. Aller dans le module Accounting
3. Vérifier que l'écriture apparaît en brouillon
4. Valider l'écriture

---

## 📊 Support Multi-Pays

Le service s'adapte automatiquement à votre plan comptable :

| Pays | Plan Comptable | Comptes Clients | Comptes Fournisseurs | TVA |
|------|----------------|-----------------|----------------------|-----|
| 🇫🇷 France | PCG | 411xxx | 401xxx | 44566/44571 |
| 🇨🇮 Côte d'Ivoire | SYSCOHADA | 411xxx | 401xxx | 4431/4433 |
| 🇸🇳 Sénégal | SYSCOHADA | 411xxx | 401xxx | 4431/4433 |
| 🇨🇲 Cameroun | SYSCOHADA | 411xxx | 401xxx | 4431/4433 |
| 🌍 Autres | Personnalisé | À configurer | À configurer | À configurer |

**Le service cherche automatiquement les comptes correspondants dans votre plan.**

---

## 🎓 Formation

### Pour les Comptables
- Les écritures générées sont en **brouillon**
- Toujours **vérifier** avant de valider
- Les règles respectent le **PCG** et **SYSCOHADA**

### Pour les Développeurs
- Le service est **modulaire** et **extensible**
- Les règles comptables sont dans `accountingRulesService.ts`
- L'intégration est dans `autoAccountingIntegrationService.ts`

---

**Date :** 9 décembre 2025
**Version :** 1.0.0
**Auteur :** NOUTCHE CONSEIL
