# DEBUG: Écritures Comptables Non Générées

**Date**: 2026-01-09
**Statut**: 🔍 **EN COURS DE DEBUG**
**Impact**: 🔴 **BUG CRITIQUE** - Les écritures comptables ne se créent PAS automatiquement

---

## 🐛 Problème Rapporté

L'utilisateur a testé la création d'une facture et son envoi par email → **AUCUNE écriture comptable** n'apparaît dans le module Comptabilité.

---

## 🔍 ÉTAPE 1: Analyse du Flux Complet

### Flux d'envoi de facture par email

**Fichier**: [src/hooks/useInvoiceEmail.ts:462-464](src/hooks/useInvoiceEmail.ts#L462-L464)

```typescript
// 8. Si la facture est en brouillon, la passer à "envoyée"
if (invoice.status === 'draft') {
  await invoicingService.updateInvoiceStatus(invoiceId, 'sent');
}
```

**Fichier**: [src/services/invoicingService.ts:357-427](src/services/invoicingService.ts#L357-L427)

```typescript
async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<InvoiceWithDetails> {
  // 1. Récupérer la facture AVANT mise à jour
  const invoiceBeforeUpdate = await this.getInvoiceById(id);

  // ✅ LOGS DE DEBUG AJOUTÉS
  logger.info('InvoicingService', '=== UPDATE INVOICE STATUS DEBUG ===', {
    invoiceId: id,
    invoiceNumber: invoiceBeforeUpdate.invoice_number,
    currentStatus: invoiceBeforeUpdate.status,
    newStatus: status,
    hasJournalEntry: !!invoiceBeforeUpdate.journal_entry_id,
    journalEntryId: invoiceBeforeUpdate.journal_entry_id,
    hasInvoiceItems: invoiceBeforeUpdate.invoice_items?.length || 0
  });

  // 2. Mettre à jour le statut dans la DB
  await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .eq('company_id', companyId);

  // 3. Récupérer la facture APRÈS mise à jour
  const updatedInvoice = await this.getInvoiceById(id);

  // 4. Vérifier si on doit générer une écriture
  const shouldGenerateEntry = invoiceBeforeUpdate.status === 'draft' &&
                               status !== 'draft' &&
                               !invoiceBeforeUpdate.journal_entry_id;

  logger.info('InvoicingService', 'Should generate journal entry?', {
    shouldGenerateEntry,
    condition1_wasDraft: invoiceBeforeUpdate.status === 'draft',
    condition2_isNotDraft: status !== 'draft',
    condition3_noExistingEntry: !invoiceBeforeUpdate.journal_entry_id
  });

  if (shouldGenerateEntry) {
    logger.info('InvoicingService', '>>> ATTEMPTING TO CREATE JOURNAL ENTRY NOW <<<');
    try {
      await generateInvoiceJournalEntry(updatedInvoice as any, updatedInvoice.invoice_items || []);
      logger.info('InvoicingService', `✅ Journal entry created successfully for invoice ${updatedInvoice.invoice_number}`);
    } catch (journalError) {
      logger.error('InvoicingService', '❌ FAILED to generate journal entry on status update', journalError);
      logger.error('InvoicingService', 'Error details:', {
        errorMessage: journalError instanceof Error ? journalError.message : String(journalError),
        errorStack: journalError instanceof Error ? journalError.stack : undefined,
        invoice: {
          id: updatedInvoice.id,
          invoice_number: updatedInvoice.invoice_number,
          invoice_type: (updatedInvoice as any).type || (updatedInvoice as any).invoice_type,
          third_party_id: updatedInvoice.third_party_id,
          company_id: updatedInvoice.company_id,
          total_incl_tax: updatedInvoice.total_incl_tax,
          total_tax_amount: updatedInvoice.total_tax_amount
        }
      });
      // ❌ L'ERREUR EST AVALÉE ICI - Ne bloque pas l'envoi
    }
  } else {
    logger.info('InvoicingService', '>>> SKIPPING JOURNAL ENTRY CREATION (conditions not met) <<<');
  }

  return updatedInvoice;
}
```

---

## 🔍 ÉTAPE 2: Tests à Effectuer

### Test 1: Ouvrir la Console du Navigateur

1. Aller sur https://casskai.app
2. Ouvrir DevTools (F12)
3. Aller dans l'onglet **Console**
4. Filtrer par "InvoicingService"

### Test 2: Créer et Envoyer une Facture

1. Créer une nouvelle facture en statut **"Brouillon"**
2. Ajouter des lignes avec montants
3. Cliquer sur **"Envoyer par email"**
4. **REGARDER LES LOGS DANS LA CONSOLE**

### Logs Attendus

Si tout fonctionne:
```
InvoicingService: === UPDATE INVOICE STATUS DEBUG ===
{
  invoiceId: "xxx",
  invoiceNumber: "F-2026-001",
  currentStatus: "draft",
  newStatus: "sent",
  hasJournalEntry: false,
  journalEntryId: undefined,
  hasInvoiceItems: 2
}

InvoicingService: Should generate journal entry?
{
  shouldGenerateEntry: true,
  condition1_wasDraft: true,
  condition2_isNotDraft: true,
  condition3_noExistingEntry: true
}

InvoicingService: >>> ATTEMPTING TO CREATE JOURNAL ENTRY NOW <<<

InvoicingService: ✅ Journal entry created successfully for invoice F-2026-001
```

Si ça échoue:
```
InvoicingService: === UPDATE INVOICE STATUS DEBUG ===
{...}

InvoicingService: Should generate journal entry?
{
  shouldGenerateEntry: false, // ❌ OU true
  condition1_wasDraft: ?, // Vérifier
  condition2_isNotDraft: ?, // Vérifier
  condition3_noExistingEntry: ? // Vérifier
}

InvoicingService: ❌ FAILED to generate journal entry on status update
InvoicingService: Error details:
{
  errorMessage: "...", // ❌ ERREUR ICI
  errorStack: "...",
  invoice: {...}
}
```

---

## 🔍 ÉTAPE 3: Cas Possibles

### Cas 1: `shouldGenerateEntry = false`

**Problème**: Une des 3 conditions n'est pas remplie

**Causes possibles**:
1. La facture n'était PAS en "draft" avant l'envoi
2. Le nouveau statut EST "draft" (impossible normalement)
3. La facture AVAIT déjà un `journal_entry_id` (doublon)

**Solution**: Vérifier les logs pour identifier quelle condition échoue

---

### Cas 2: `shouldGenerateEntry = true` mais erreur

**Problème**: La fonction `generateInvoiceJournalEntry()` échoue

**Causes possibles**:

#### A. Journal manquant
```
errorMessage: "Journal des ventes (type: sale) non trouvé pour cette entreprise"
```

**Solution**: Créer un journal de type "sale" dans les paramètres comptables

#### B. Compte tiers manquant
```
errorMessage: "Compte client non trouvé pour le tiers"
```

**Solution**: Vérifier que le client a un `third_party_id` valide

#### C. Compte de vente manquant
```
errorMessage: "Compte de vente (707000) non trouvé"
```

**Solution**: La fonction `getOrCreateDefaultSalesAccount()` devrait le créer automatiquement. Si ça échoue, il y a un problème de permissions Supabase.

#### D. Compte TVA manquant
```
errorMessage: "Compte TVA collectée (44571) non trouvé"
```

**Solution**: Même chose que pour 707000, devrait être créé automatiquement.

#### E. Erreur lors de la création de l'écriture
```
errorMessage: "..." (provient de journalEntriesService.createJournalEntry)
```

**Solution**: Vérifier les permissions RLS (Row Level Security) sur la table `journal_entries`

---

## 🔍 ÉTAPE 4: Vérifications Supplémentaires

### Vérifier la structure de la facture

```sql
SELECT
  id,
  invoice_number,
  status,
  type,
  third_party_id,
  company_id,
  total_incl_tax,
  total_tax_amount,
  journal_entry_id
FROM invoices
WHERE invoice_number = 'F-2026-001';
```

**Vérifier**:
- ✅ `type` = "sale" (pas "purchase" ou autre)
- ✅ `third_party_id` n'est PAS NULL
- ✅ `company_id` n'est PAS NULL
- ✅ `total_incl_tax` > 0
- ✅ `journal_entry_id` = NULL (avant envoi)

### Vérifier les lignes de facture

```sql
SELECT
  id,
  invoice_id,
  quantity,
  unit_price,
  discount_rate,
  tax_rate
FROM invoice_items
WHERE invoice_id = 'xxx';
```

**Vérifier**:
- ✅ Au moins 1 ligne existe
- ✅ `quantity` > 0
- ✅ `unit_price` > 0

### Vérifier le journal de ventes

```sql
SELECT
  id,
  code,
  name,
  type
FROM journals
WHERE company_id = 'xxx' AND type = 'sale';
```

**Vérifier**:
- ✅ Au moins 1 journal de type "sale" existe

---

## 📊 Diagnostic Automatique

Exécuter cette requête pour diagnostiquer:

```sql
SELECT
  'Invoice' as check_type,
  CASE
    WHEN i.type = 'sale' THEN '✅'
    ELSE '❌ type=' || i.type
  END as check_type_ok,
  CASE
    WHEN i.third_party_id IS NOT NULL THEN '✅'
    ELSE '❌ third_party_id is NULL'
  END as check_third_party_ok,
  CASE
    WHEN i.total_incl_tax > 0 THEN '✅'
    ELSE '❌ total_incl_tax=' || i.total_incl_tax
  END as check_total_ok,
  CASE
    WHEN (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) > 0 THEN '✅'
    ELSE '❌ No invoice_items'
  END as check_items_ok,
  CASE
    WHEN (SELECT COUNT(*) FROM journals WHERE company_id = i.company_id AND type = 'sale') > 0 THEN '✅'
    ELSE '❌ No sales journal'
  END as check_journal_ok
FROM invoices i
WHERE i.invoice_number = 'F-2026-001';
```

---

## 🛠️ Corrections Possibles

### Si journal manquant

Créer un journal de ventes:

```sql
INSERT INTO journals (company_id, code, name, type, is_active)
VALUES ('xxx', 'VE', 'Journal des ventes', 'sale', true);
```

### Si compte 707000 manquant

```sql
INSERT INTO chart_of_accounts (
  company_id,
  account_number,
  account_name,
  account_type,
  account_class,
  is_detail_account,
  is_active
)
VALUES (
  'xxx',
  '707000',
  'Ventes de marchandises',
  'revenue',
  7,
  true,
  true
);
```

### Si compte 44571 manquant

```sql
INSERT INTO chart_of_accounts (
  company_id,
  account_number,
  account_name,
  account_type,
  account_class,
  is_detail_account,
  is_active
)
VALUES (
  'xxx',
  '44571',
  'TVA collectée',
  'liability',
  4,
  true,
  true
);
```

---

## 🎯 Prochaines Étapes

1. **TESTER** l'envoi d'une facture en regardant la console
2. **COPIER** tous les logs de la console ici
3. **IDENTIFIER** quel cas correspond (voir ÉTAPE 3)
4. **APPLIQUER** la correction appropriée

---

**Fichiers modifiés**:
- [src/services/invoicingService.ts](src/services/invoicingService.ts) - Ajout de logs de debug (lignes 367-427)

**Build**: ✅ Déployé sur https://casskai.app
**Date**: 2026-01-09

**IMPORTANT**: Les logs apparaissent UNIQUEMENT dans la console du navigateur (DevTools F12), pas dans les toasts ou l'interface utilisateur.
