# 🔍 Audit Multi-Documents - Documentation Complète

## 📋 Vue d'ensemble

L'extension d'audit couvre désormais **5 types de documents** pour une conformité complète des conditions de paiement :

1. **Factures** (`invoice_type = 'sale'`)
2. **Devis** (`invoice_type = 'quote'`)
3. **Bons de commande** (`invoice_type = 'purchase'`)
4. **Avoirs** (`invoice_type = 'credit_note'`)
5. **Notes de débit** (`invoice_type = 'debit_note'`)

---

## 🏗️ Architecture

### Services

#### 1. **extendedPaymentTermsAuditService.ts**
**Responsabilité:** Audit complet de tous les types de documents

```typescript
// ✅ Audit synchronisé pour un document spécifique
auditInvoices(companyId: string)
auditQuotes(companyId: string)
auditPurchaseOrders(companyId: string)
auditCreditNotes(companyId: string)
auditDebitNotes(companyId: string)

// ✅ Audit global retournant rapport détaillé
auditAllDocuments(companyId: string): Promise<ExtendedAuditReport>
```

**Retours:**
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

#### 2. **extendedAutoAuditService.ts**
**Responsabilité:** Auto-audit fire-and-forget lors de la création

```typescript
// ✅ Hook d'auto-audit global (fire-and-forget)
getExtendedAutoAuditHook(companyId: string): () => Promise<void>

// ✅ Audit d'un document unique
autoAuditDocument(
  documentType: 'invoice' | 'quote' | 'purchase_order' | 'credit_note' | 'debit_note',
  companyId: string,
  documentNumber: string,
  currency: string,
  content: string
): Promise<{ compliant: boolean; warnings: string[] }>
```

### UI Components

#### **ExtendedPaymentTermsAuditPanel.tsx**
Composant React avec:
- 🚀 Bouton "Lancer Audit Complet"
- 📊 Graphiques par type de document (Recharts)
- 📭 Tabs pour filtrer par type (Factures/Devis/Bons/Avoirs/Notes Débit)
- 📥 Export CSV des problèmes
- 🎯 Suggestions de correction pour chaque document non-conforme

---

## 🔧 Intégration

### Étape 1: Dans la création de facture
```typescript
// src/services/invoicingService.ts
import { getExtendedAutoAuditHook } from '@/services/extendedAutoAuditService';

async function createInvoice(...) {
  // ... création du document ...
  
  // Auto-audit fire-and-forget
  const autoAuditHook = getExtendedAutoAuditHook(companyId);
  autoAuditHook();
  
  return result;
}
```

### Étape 2: Dans le bon de commande
```typescript
// src/services/purchaseOrderService.ts (si séparé)
import { autoAuditDocument } from '@/services/extendedAutoAuditService';

async function createPurchaseOrder(po: PurchaseOrderData) {
  // ... création du PO ...
  
  // Audit immédiat pour ce document
  const { compliant, warnings } = await autoAuditDocument(
    'purchase_order',
    po.company_id,
    po.order_number,
    po.currency,
    po.terms
  );
  
  if (!compliant) {
    toastWarning(`⚠️ ${warnings.length} problème(s) détecté(s)`);
  }
}
```

### Étape 3: Dans l'avoirService
```typescript
// src/services/creditNoteService.ts
import { autoAuditDocument } from '@/services/extendedAutoAuditService';

async function createCreditNote(creditNote: CreditNoteData) {
  // ... création de l'avoir ...
  
  const { compliant } = await autoAuditDocument(
    'credit_note',
    creditNote.company_id,
    creditNote.note_number,
    creditNote.currency,
    creditNote.terms
  );
}
```

---

## 📊 Rapport d'Audit

### Exemple de rapport complet

```json
{
  "companyId": "cmp_12345",
  "auditDate": "2025-01-30T14:32:00Z",
  "totalDocuments": 150,
  "compliantCount": 132,
  "nonCompliantCount": 18,
  "byType": {
    "invoices": {
      "checked": 80,
      "compliant": 75,
      "nonCompliant": 5
    },
    "quotes": {
      "checked": 30,
      "compliant": 28,
      "nonCompliant": 2
    },
    "purchaseOrders": {
      "checked": 25,
      "compliant": 22,
      "nonCompliant": 3
    },
    "creditNotes": {
      "checked": 12,
      "compliant": 7,
      "nonCompliant": 5
    },
    "debitNotes": {
      "checked": 3,
      "compliant": 0,
      "nonCompliant": 3
    }
  },
  "findings": [
    {
      "documentType": "invoice",
      "documentId": "doc_123",
      "documentNumber": "INV-001",
      "currency": "XOF",
      "compliant": false,
      "issues": [
        "Conditions de paiement non valides pour XOF",
        "Référence au BCE manquante pour SYSCOHADA"
      ],
      "correctedTerms": [
        "Conditions standard SYSCOHADA",
        "Intérêt de retard: 6% par an",
        "Frais de recouvrement: À convenir"
      ]
    }
  ],
  "summary": "Audit complet: 132/150 documents conformes. 18 à corriger."
}
```

---

## 🎯 Cas d'utilisation

### 1️⃣ Audit complet mensuéis
```typescript
const report = await extendedPaymentTermsAuditService.auditAllDocuments(companyId);
console.log(`Conformité: ${(report.compliantCount/report.totalDocuments*100).toFixed(1)}%`);
```

### 2️⃣ Audit par type spécifique
```typescript
// Uniquement les bons de commande
const { findings, checked } = await extendedPaymentTermsAuditService.auditPurchaseOrders(companyId);
```

### 3️⃣ Auto-audit à la création
```typescript
// Lors de la création d'un bon de commande
const { compliant, warnings } = await autoAuditDocument(
  'purchase_order',
  companyId,
  orderNumber,
  'USD',
  'Payment terms...'
);
```

---

## 📱 UI - Comment utiliser

### Accès à l'audit complet
1. Aller à **Settings → Invoicing**
2. Cliquer sur l'onglet **"Audit Complet"** (nouveau)
3. Cliquer sur **"🚀 Lancer Audit Complet"**
4. Attendre les résultats (quelques secondes)
5. Explorer les problèmes par type via les **Tabs**
6. **Exporter en CSV** pour analyse Excel

### Interprétation du rapport
- 🟢 **Vert**: Documents conformes
- 🔴 **Rouge**: Documents non-conformes avec suggestions
- 📊 **Graphique**: Vue comparative par type
- 💾 **CSV**: Export pour suivi

---

## ⚙️ Configuration

### Currencies supportées
L'audit couvre **25+ devises** avec leurs règles légales spécifiques:

**Europe:**
- EUR (€), GBP (£), CHF (₣), SEK (kr), NOK (kr)

**Afrique SYSCOHADA:**
- XOF (₣), XAF (₣), MAD (د.م.), TND (د.ت), ZAR (R)

**Moyen-Orient:**
- AED (د.إ), SAR (﷼), JOD (د.ا)

**Afrique anglophone:**
- NGN (₦), GHS (₵), KES (KSh)

**Asie-Pacifique:**
- JPY (¥), CNY (¥), INR (₹), SGD ($), AUD ($), NZD ($)

**Amériques:**
- USD ($), CAD ($), MXN ($), BRL (R$)

---

## 🐛 Dépannage

### Q: L'audit est très lent
**R:** Augmentez la limite `limit(500)` dans les services ou paginez les résultats.

### Q: Les conditions recommandées ne correspondent pas à mon pays
**R:** Mettez à jour `paymentTermsComplianceService.ts` avec les bonnes définitions légales.

### Q: L'auto-audit ne s'affiche pas
**R:** Vérifiez que `extendedAutoAuditService` est importé dans le service de création et utilise le pattern fire-and-forget.

### Q: Certains documents ne sont pas auditéés
**R:** Vérifiez que le `invoice_type` est correct:
- Factures: `'sale'`
- Devis: `'quote'`
- Bons: `'purchase'`
- Avoirs: `'credit_note'`
- Notes Débit: `'debit_note'`

---

## 📝 Modifications futures

- [ ] Ajouter audit des factures de service
- [ ] Audit par client/fournisseur
- [ ] Alerts automatiques si > X% non-conformes
- [ ] Historique des audits
- [ ] Audit API exposée pour intégrations externes

---

**Mise à jour:** 30 janvier 2025
**Version:** 1.0 - Audit Multi-Documents
**Status:** ✅ Production Ready
