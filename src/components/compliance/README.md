# Compliance Components

## 📦 Composants

### ExtendedPaymentTermsAuditPanel

**Fichier:** `ExtendedPaymentTermsAuditPanel.tsx`

**Description:** Dashboard d'audit des conditions de paiement pour tous les types de documents (factures, devis, bons de commande, avoirs, notes de débit).

**Usage:**
```tsx
import { ExtendedPaymentTermsAuditPanel } from '@/components/compliance/ExtendedPaymentTermsAuditPanel';

<ExtendedPaymentTermsAuditPanel companyId={companyId} />
```

**Props:**
```typescript
interface ExtendedPaymentTermsAuditPanelProps {
  companyId: string;  // ID de l'entreprise à auditer
}
```

**Fonctionnalités:**
- 🚀 Bouton "Lancer Audit Complet"
- 📊 Graphique Recharts (compliant vs non-compliant par type)
- 📈 Stats en boxes (Total, Conformes, Non-conformes, Taux %, Date)
- 📭 Tabs interactifs (Tous / Factures / Devis / Bons / Avoirs / Notes Débit)
- 📥 Export CSV des problèmes
- 🎯 Affichage détaillé de chaque problème + suggestions

**Dépendances:**
- React (hooks: useState)
- Recharts (BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer)
- lucide-react (AlertCircle, CheckCircle2, Download)
- @/services/extendedPaymentTermsAuditService
- @/lib/toast-helpers
- @/components/ui (Button, Tabs, TabsContent, TabsList, TabsTrigger)

**Styles:**
- Tailwind CSS (bg-white, p-6, grid-cols-5, etc.)
- États visuels: vert (✅), rouge (❌), bleu (info)

---

## 🚀 Intégration

Ce composant est intégré dans `InvoiceComplianceSettings.tsx`:

```tsx
<TabsContent value="audit-extended">
  {currentCompany?.id && (
    <ExtendedPaymentTermsAuditPanel companyId={currentCompany.id} />
  )}
</TabsContent>
```

---

## 📝 Fichiers Associés

### Services
- `src/services/extendedPaymentTermsAuditService.ts` - Logique d'audit
- `src/services/extendedAutoAuditService.ts` - Auto-audit fire-and-forget

### Documentation
- `docs/EXTENDED_PAYMENT_TERMS_AUDIT.md` - Documentation complète
- `docs/AUDIT_MULTI_DOCUMENTS_IMPLEMENTATION_SUMMARY.md` - Détails techniques
- `docs/AUDIT_DEV_QUICK_REF.md` - Quick reference

---

**Version:** 1.0  
**Status:** Production Ready  
**Last Updated:** 30 Janvier 2025
