# Exemples Concrets d'Intégration - Auto-Génération Écritures

## 🎯 Objectif

Ce fichier contient des **exemples de code prêts à copier-coller** pour intégrer l'auto-génération d'écritures comptables dans vos modules.

---

## 📦 1. MODULE FACTURATION

### Fichier : `src/pages/InvoicingPage.tsx`

```typescript
import { useAutoAccounting } from '@/hooks/useAutoAccounting';

export default function InvoicingPage() {
  const { generateFromInvoice, isGenerating } = useAutoAccounting();

  // Fonction appelée après validation/émission d'une facture
  const handleInvoiceValidation = async (invoice: any) => {
    try {
      // 1. Valider la facture (logique existante)
      await invoicingService.validateInvoice(invoice.id);

      // 2. ✅ NOUVEAU : Générer automatiquement l'écriture comptable
      await generateFromInvoice({
        id: invoice.id,
        company_id: currentCompany.id,
        third_party_id: invoice.client_id || invoice.supplier_id,
        third_party_name: invoice.client_name || invoice.supplier_name,
        invoice_number: invoice.invoice_number,
        type: invoice.type === 'client' ? 'sale' : 'purchase',
        invoice_date: invoice.invoice_date,
        subtotal_excl_tax: invoice.subtotal_excl_tax,
        total_tax_amount: invoice.total_tax_amount,
        total_incl_tax: invoice.total_incl_tax,
        lines: invoice.lines?.map((line: any) => ({
          account_id: line.account_id,
          description: line.description,
          subtotal_excl_tax: line.subtotal_excl_tax,
          tax_amount: line.tax_amount || 0,
        })) || [],
      });

      // 3. Rafraîchir la liste
      await loadInvoices();
    } catch (error) {
      console.error('Error validating invoice:', error);
    }
  };

  return (
    <div>
      {/* Votre UI existante */}
      <Button
        onClick={() => handleInvoiceValidation(selectedInvoice)}
        disabled={isGenerating}
      >
        {isGenerating ? 'Génération en cours...' : 'Valider la facture'}
      </Button>
    </div>
  );
}
```

### Alternative : Intégration dans le Service

**Fichier : `src/services/invoicingService.ts`**

```typescript
import { autoAccountingService } from '@/services/autoAccountingIntegrationService';

export class InvoicingService {
  async validateInvoice(invoiceId: string) {
    // 1. Logique de validation existante
    const invoice = await this.getInvoiceById(invoiceId);
    await this.updateInvoiceStatus(invoiceId, 'validated');

    // 2. ✅ NOUVEAU : Générer l'écriture automatiquement
    try {
      const result = await autoAccountingService.generateInvoiceJournalEntry({
        id: invoice.id,
        company_id: invoice.company_id,
        third_party_id: invoice.client_id || invoice.supplier_id,
        third_party_name: invoice.client_name,
        invoice_number: invoice.invoice_number,
        type: invoice.type === 'client' ? 'sale' : 'purchase',
        invoice_date: invoice.invoice_date,
        subtotal_excl_tax: invoice.subtotal_excl_tax,
        total_tax_amount: invoice.total_tax_amount,
        total_incl_tax: invoice.total_incl_tax,
        lines: invoice.lines,
      });

      if (result.success) {
        console.log('✅ Journal entry created:', result.entryId);
      } else {
        console.warn('⚠️ Journal entry not created:', result.error);
      }
    } catch (error) {
      console.error('Error generating journal entry:', error);
      // Ne pas bloquer la validation de la facture
    }

    return invoice;
  }
}
```

---

## 🏦 2. MODULE BANQUES

### Fichier : `src/pages/BanksPage.tsx`

```typescript
import { useAutoAccounting } from '@/hooks/useAutoAccounting';

export default function BanksPage() {
  const { generateFromBankTransaction, isGenerating } = useAutoAccounting();

  // Fonction appelée après rapprochement d'une transaction
  const handleTransactionReconciliation = async (transaction: any) => {
    try {
      // 1. Rapprocher la transaction (logique existante)
      await bankService.reconcileTransaction(transaction.id);

      // 2. ✅ NOUVEAU : Générer automatiquement l'écriture comptable
      await generateFromBankTransaction({
        id: transaction.id,
        company_id: currentCompany.id,
        bank_account_id: transaction.bank_account_id,
        transaction_date: transaction.transaction_date,
        amount: Math.abs(transaction.amount),
        type: transaction.amount > 0 ? 'credit' : 'debit', // credit = entrée, debit = sortie
        description: transaction.description || transaction.label,
        counterpart_account_id: transaction.counterpart_account_id, // Optionnel
        reference: transaction.reference,
      });

      // 3. Rafraîchir la liste
      await loadTransactions();
    } catch (error) {
      console.error('Error reconciling transaction:', error);
    }
  };

  return (
    <div>
      {/* Votre UI existante */}
      <Button
        onClick={() => handleTransactionReconciliation(selectedTransaction)}
        disabled={isGenerating}
      >
        {isGenerating ? 'Génération en cours...' : 'Rapprocher'}
      </Button>
    </div>
  );
}
```

### Détection Automatique Encaissement/Décaissement

```typescript
// Le type est détecté automatiquement selon le signe du montant
const transactionType = transaction.amount > 0 ? 'credit' : 'debit';

// credit (> 0) = ENCAISSEMENT → Débit Banque / Crédit Client
// debit  (< 0) = DÉCAISSEMENT → Débit Fournisseur / Crédit Banque
```

---

## 🛒 3. MODULE ACHATS

### Fichier : `src/pages/PurchasesPage.tsx`

```typescript
import { useAutoAccounting } from '@/hooks/useAutoAccounting';

export default function PurchasesPage() {
  const { generateFromPurchase, isGenerating } = useAutoAccounting();

  // Fonction appelée après validation d'un bon de commande / facture fournisseur
  const handlePurchaseValidation = async (purchase: any) => {
    try {
      // 1. Valider l'achat (logique existante)
      await purchasesService.validatePurchase(purchase.id);

      // 2. ✅ NOUVEAU : Générer automatiquement l'écriture comptable
      await generateFromPurchase({
        id: purchase.id,
        company_id: currentCompany.id,
        supplier_id: purchase.supplier_id,
        supplier_name: purchase.supplier_name,
        order_number: purchase.order_number || purchase.invoice_number,
        order_date: purchase.order_date || purchase.purchase_date,
        total_excl_tax: purchase.total_excl_tax,
        total_tax: purchase.total_tax,
        total_incl_tax: purchase.total_incl_tax,
        items: purchase.items?.map((item: any) => ({
          account_id: item.account_id,
          description: item.description,
          amount_excl_tax: item.amount_excl_tax,
        })) || [],
      });

      // 3. Rafraîchir la liste
      await loadPurchases();
    } catch (error) {
      console.error('Error validating purchase:', error);
    }
  };

  return (
    <div>
      {/* Votre UI existante */}
      <Button
        onClick={() => handlePurchaseValidation(selectedPurchase)}
        disabled={isGenerating}
      >
        {isGenerating ? 'Génération en cours...' : 'Valider l\'achat'}
      </Button>
    </div>
  );
}
```

---

## ⚙️ 4. INTÉGRATION AVEC WORKFLOW APPROBATION

### Exemple : Générer l'écriture uniquement après approbation

```typescript
const handleWorkflowApproval = async (document: any) => {
  // 1. Mettre à jour le statut
  await updateStatus(document.id, 'approved');

  // 2. Si c'est une facture et qu'elle est approuvée, générer l'écriture
  if (document.type === 'invoice' && document.status === 'approved') {
    await generateFromInvoice({
      ...document,
      type: document.invoice_type === 'client' ? 'sale' : 'purchase',
    });
  }

  // 3. Si c'est une transaction bancaire rapprochée, générer l'écriture
  if (document.type === 'bank_transaction' && document.status === 'reconciled') {
    await generateFromBankTransaction({
      ...document,
      type: document.amount > 0 ? 'credit' : 'debit',
    });
  }
};
```

---

## 🔄 5. GESTION DES ERREURS

### Pattern Recommandé

```typescript
try {
  // Toujours valider l'opération AVANT de générer l'écriture
  await validateOperation();

  // Générer l'écriture (non bloquant)
  const result = await generateFromInvoice(invoice);

  if (!result.success) {
    // L'écriture n'a pas été créée, mais l'opération principale est OK
    console.warn('⚠️ Manual accounting entry needed:', result.error);

    // Optionnel : Créer une tâche pour l'utilisateur
    await createTask({
      type: 'manual_accounting_entry',
      reference: invoice.invoice_number,
      reason: result.error,
    });
  }
} catch (error) {
  // Erreur sur l'opération principale
  console.error('❌ Operation failed:', error);
  throw error;
}
```

---

## 🎨 6. AFFICHAGE UI - Badge "Écriture Générée"

### Afficher l'état de l'écriture dans la liste

```typescript
<Table>
  <TableRow>
    <TableCell>{invoice.invoice_number}</TableCell>
    <TableCell>
      {invoice.journal_entry_id ? (
        <Badge className="bg-green-100 text-green-800">
          ✓ Écriture générée
        </Badge>
      ) : (
        <Badge variant="outline">
          Écriture manuelle requise
        </Badge>
      )}
    </TableCell>
  </TableRow>
</Table>
```

---

## 🧪 7. TESTS D'INTÉGRATION

### Test Unitaire

```typescript
import { autoAccountingService } from '@/services/autoAccountingIntegrationService';

describe('Auto Accounting Integration', () => {
  it('should generate journal entry from invoice', async () => {
    const invoice = {
      id: 'inv-123',
      company_id: 'company-456',
      third_party_id: 'client-789',
      invoice_number: 'FAC-2025-001',
      type: 'sale' as const,
      invoice_date: '2025-12-09',
      subtotal_excl_tax: 1000,
      total_tax_amount: 200,
      total_incl_tax: 1200,
      lines: [],
    };

    const result = await autoAccountingService.generateInvoiceJournalEntry(invoice);

    expect(result.success).toBe(true);
    expect(result.entryId).toBeDefined();
  });
});
```

---

## 📊 8. MONITORING & ANALYTICS

### Logger les succès/échecs

```typescript
// Après génération
if (result.success) {
  // Analytics
  analytics.track('accounting_entry_generated', {
    source: 'invoice',
    invoice_id: invoice.id,
    entry_id: result.entryId,
  });
} else {
  // Monitoring d'erreur
  errorMonitoring.captureMessage('accounting_entry_failed', {
    source: 'invoice',
    invoice_id: invoice.id,
    error: result.error,
  });
}
```

---

## 🌍 9. SUPPORT MULTI-PAYS - Aucune Adaptation Nécessaire !

**Le système détecte automatiquement le référentiel :**

```typescript
// ✅ Fonctionne avec :
// - PCG (France) : 411, 401, 607, 707, 44566, 44571
// - SYSCOHADA (Afrique) : 411, 401, 607, 707, 4431, 4433
// - IFRS : Receivables, Payables, Revenue, VAT Receivable
// - US GAAP : Accounts Receivable, COGS, Sales Tax

// Aucun code spécifique nécessaire !
await generateFromInvoice(invoice); // ✅ Marche partout
```

---

## ✅ Checklist d'Intégration

- [ ] Importer `useAutoAccounting` dans votre page
- [ ] Appeler `generateFromXXX` après validation de l'opération
- [ ] Gérer les erreurs sans bloquer l'opération principale
- [ ] Afficher un feedback à l'utilisateur (toast)
- [ ] Optionnel : Afficher un badge "Écriture générée" dans la liste
- [ ] Tester avec plusieurs types d'opérations
- [ ] Vérifier dans le module Accounting que les écritures apparaissent

---

**Besoin d'aide ?** Consultez [INTEGRATION-AUTOMATIQUE.md](INTEGRATION-AUTOMATIQUE.md) pour plus de détails.
