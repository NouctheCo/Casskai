# 🚀 Audit Multi-Documents - Developer Quick Reference

## 📍 Fichiers Clés

| Fichier | Responsabilité | Type |
|---------|-----------------|------|
| `src/services/extendedPaymentTermsAuditService.ts` | Audit core logic (5 types) | Service |
| `src/services/extendedAutoAuditService.ts` | Fire-and-forget auto-audit | Service |
| `src/components/compliance/ExtendedPaymentTermsAuditPanel.tsx` | UI dashboard | Component |
| `src/components/invoicing/InvoiceComplianceSettings.tsx` | Settings tabs (MODIFIED) | Component |
| `src/services/autoAuditService.ts` | Invoice auto-audit (MODIFIED) | Service |
| `src/services/invoicingService.ts` | Invoice creation (MODIFIED) | Service |
| `src/hooks/trial.hooks.ts` | Trial hook (FIXED) | Hook |

---

## 💻 Code Patterns

### Pattern 1: Utiliser l'audit global

```typescript
import { extendedPaymentTermsAuditService } from '@/services/extendedPaymentTermsAuditService';

// Lancer audit complet
const report = await extendedPaymentTermsAuditService.auditAllDocuments(companyId);
console.log(`${report.compliantCount}/${report.totalDocuments} conforme`);
```

### Pattern 2: Auto-audit à la création

```typescript
import { getExtendedAutoAuditHook } from '@/services/extendedAutoAuditService';

async function createDocument(...) {
  // ... create logic ...
  
  // Fire-and-forget audit (never blocks)
  const autoAuditHook = getExtendedAutoAuditHook(companyId);
  autoAuditHook();
  
  return result;
}
```

### Pattern 3: Audit un document unique

```typescript
import { autoAuditDocument } from '@/services/extendedAutoAuditService';

const { compliant, warnings } = await autoAuditDocument(
  'purchase_order',      // document type
  companyId,
  orderNumber,
  'USD',                 // currency
  'Payment terms...'     // content
);

if (!compliant) {
  toastWarning(`⚠️ ${warnings.length} problèmes`);
}
```

---

## 🔄 Types Principaux

### ExtendedAuditReport
```typescript
interface ExtendedAuditReport {
  companyId: string;
  auditDate: Date;
  totalDocuments: number;
  compliantCount: number;
  nonCompliantCount: number;
  byType: {
    invoices: { checked: number; compliant: number; nonCompliant: number };
    quotes: { checked: number; compliant: number; nonCompliant: number };
    purchaseOrders: { checked: number; compliant: number; nonCompliant: number };
    creditNotes: { checked: number; compliant: number; nonCompliant: number };
    debitNotes: { checked: number; compliant: number; nonCompliant: number };
  };
  findings: ExtendedAuditFinding[];
  summary: string;
}
```

### ExtendedAuditFinding
```typescript
interface ExtendedAuditFinding {
  documentType: 'invoice' | 'quote' | 'purchase_order' | 'credit_note' | 'debit_note';
  documentId: string;
  documentNumber: string;
  currency: string;
  compliant: boolean;
  issues: string[];
  correctedTerms?: string[];
}
```

---

## 🎯 Types de Documents Supportés

| Type | invoice_type | Fonction Audit |
|------|--------------|----------------|
| Facture | `'sale'` | `auditInvoices()` |
| Devis | `'quote'` | `auditQuotes()` |
| Bon Commande | `'purchase'` | `auditPurchaseOrders()` |
| Avoir | `'credit_note'` | `auditCreditNotes()` |
| Note Débit | `'debit_note'` | `auditDebitNotes()` |

---

## 📍 Points d'Intégration

### 1. Invoice Creation
**Fichier:** `src/services/invoicingService.ts:357`
```typescript
// Step 6: Auto-audit
try {
  await autoAuditService.autoAuditInvoice(createdInvoice as any);
} catch (auditError) {
  logger.error('InvoicingService: Failed to auto-audit...', auditError);
}
```

### 2. Settings UI
**Fichier:** `src/components/invoicing/InvoiceComplianceSettings.tsx:185`
```tsx
<TabsContent value="audit-extended">
  {currentCompany?.id && (
    <ExtendedPaymentTermsAuditPanel companyId={currentCompany.id} />
  )}
</TabsContent>
```

---

## 🧩 Extensions Futures

### Ajouter un nouveau type de document
1. Créer `auditNewType()` dans `extendedPaymentTermsAuditService.ts`
2. Ajouter dans `auditAllDocuments()` 
3. Ajouter dans `byType` du rapport
4. Ajouter tab dans UI

### Ajouter une nouvelle devise
1. Éditer `paymentTermsComplianceService.ts`
2. Ajouter entrée dans `PAYMENT_TERMS_BY_CURRENCY`
3. Tester avec `autoAuditDocument()`

---

## ⚠️ Patterns à Respecter

### ✅ DO
- Fire-and-forget pour auto-audit
- Never throw from audit functions
- Always use graceful degradation
- Log warnings but don't block

### ❌ DON'T
- Synchronous audit in critical path
- Throw errors on non-compliance
- Block invoice creation
- Hardcode currencies

---

## 🧪 Vérifications Avant Commit

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Optional: Unit tests
npm run test

# Optional: E2E tests
npm run test:e2e
```

---

## 📚 Documentation

- **Full Docs:** `docs/EXTENDED_PAYMENT_TERMS_AUDIT.md`
- **Implementation:** `docs/AUDIT_MULTI_DOCUMENTS_IMPLEMENTATION_SUMMARY.md`
- **Testing:** `docs/AUDIT_MULTI_DOCUMENTS_QUICK_TEST.md`

---

## 🆘 Common Issues

| Issue | Fix |
|-------|-----|
| `Cannot find module @/types/invoices.types` | Use `@/types/database/invoices.types` |
| Audit too slow | Implement pagination or caching |
| Toast not appearing | Check sonner setup |
| Type errors on Invoice | Use `as any` for InvoiceWithDetails |

---

## 📞 Support

For questions or issues, check:
1. Type definitions in `src/types/database/invoices.types.ts`
2. Service exports in `extendedPaymentTermsAuditService.ts`
3. Component props in `ExtendedPaymentTermsAuditPanel.tsx`
4. Integration point in `invoicingService.ts`

---

**Last Updated:** 30 Janvier 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
