# AUDIT COMPLET DE L'ARCHITECTURE COMPTABLE ET FINANCIÈRE - CASSKAI

**Date** : 30 novembre 2025
**Version** : 1.0
**Périmètre** : Comptabilité, Facturation, Fiscal, Banques, Contrôle de gestion
**Évaluateur** : Claude (Anthropic)

---

## RÉSUMÉ EXÉCUTIF

### Note Globale : 7/10 ⭐⭐⭐⭐⭐⭐⭐

**Verdict** : CassKai possède une **architecture comptable solide et intelligente** avec des fondations robustes. L'outil respecte majoritairement le principe d'**unicité des données** (Single Source of Truth). Cependant, **3 lacunes critiques** empêchent l'automatisation complète du flux comptable.

### Points Forts ✅
- Architecture modulaire bien conçue
- Unicité des données comptables garantie
- Rapprochement bancaire intelligent avec matching automatique
- Rapports financiers générés depuis source unique
- Support multi-normes (PCG, SYSCOHADA)
- Audit trail complet sur toutes les opérations

### Points Faibles Critiques ❌
1. **Génération automatique des écritures comptables manquante** : Les factures ne créent PAS d'écritures automatiquement
2. **Déclarations TVA manuelles** : Pas de génération automatique depuis la comptabilité
3. **Lettrage factures/paiements absent** : Pas de gestion des paiements partiels

---

## 1. SCHÉMA DU FLUX DE DONNÉES

### Architecture Globale des Modules

```
┌─────────────────────┐
│   FACTURATION       │ invoices, invoice_lines, payments
└──────────┬──────────┘
           │
           ↓ ❌ GÉNÉRATION AUTO MANQUANTE
┌─────────────────────┐
│   COMPTABILITÉ      │ journal_entries, journal_entry_lines
└──────────┬──────────┘
           │
           ├──→ chart_of_accounts (Plan comptable unique)
           │
           ├──→ RAPPROCHEMENT BANCAIRE (bank_transactions ↔ journal_entry_lines)
           │
           ├──→ TAXES/FISCAL ❌ (génération manuelle)
           │
           └──→ RAPPORTS FINANCIERS ✅ (génération auto via RPC)
```

### Flux Idéal (Avec automatisations manquantes)

```
1. Facture créée (invoices)
   ↓
2. Génération auto écritures comptables ❌ MANQUANT
   - Débit 411 Clients (total)
   - Crédit 707 Ventes (HT)
   - Crédit 44571 TVA collectée
   ↓
3. Paiement reçu (payments)
   ↓
4. Rapprochement bancaire (bank_reconciliation)
   - Match transaction bancaire ↔ écriture 512 Banque
   ↓
5. Génération rapports financiers ✅ EXISTANT
   - Bilan (generate_balance_sheet)
   - Compte de résultat (generate_income_statement)
   - Trésorerie (generate_cash_flow_statement)
   ↓
6. Génération déclaration TVA ❌ MANQUANT
   - Agrégation 44571 (TVA collectée) - 44566 (TVA déductible)
```

---

## 2. ANALYSE DÉTAILLÉE PAR MODULE

### A. MODULE COMPTABILITÉ (CORE)

**Services analysés** :
- [src/services/journalEntriesService.ts](src/services/journalEntriesService.ts)
- [src/services/accountingService.ts](src/services/accountingService.ts)
- [src/services/journalsService.ts](src/services/journalsService.ts)

**Architecture des données** :
```typescript
journal_entries {
  id, company_id, journal_id, entry_number, entry_date,
  description, reference_number, status: 'draft' | 'posted' | 'cancelled'
}
  ↓ Foreign Key
journal_entry_lines {
  id, journal_entry_id, account_id,
  debit_amount, credit_amount,
  account_number, account_name // Dénormalisé (acceptable)
}
  ↓ Foreign Key
chart_of_accounts {
  id, company_id, account_number, account_name,
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
  account_class: 1..9, parent_account_id
}
```

#### Points Forts ✅

1. **Unicité du plan comptable** :
   - Source unique : `chart_of_accounts`
   - Tous les modules référencent cette table via `account_id`

2. **Validation comptable rigoureuse** :
   ```typescript
   // Vérification équilibre débit/crédit
   const BALANCE_TOLERANCE = 0.01;
   const totalDebits = items.reduce((sum, item) => sum + (item.debitAmount || 0), 0);
   const totalCredits = items.reduce((sum, item) => sum + (item.creditAmount || 0), 0);
   if (Math.abs(totalDebits - totalCredits) > BALANCE_TOLERANCE) {
     throw new Error('Écriture déséquilibrée');
   }
   ```

3. **Support multi-standards** :
   - PCG (France) : 8 classes
   - SYSCOHADA (Afrique) : 9 classes
   - Extensible GAAP/IFRS

4. **Numérotation automatique** :
   ```typescript
   async function generateEntryNumber(companyId, journalId, year) {
     const count = await getEntriesCount(companyId, journalId, year);
     return `${journalId}-${year}-${String(count + 1).padStart(5, '0')}`;
   }
   ```

5. **Hiérarchie comptable** :
   - Comptes généraux (compte parent)
   - Comptes auxiliaires (comptes clients/fournisseurs)
   - Via `parent_account_id`

#### Points d'Attention ⚠️

1. **Dénormalisation partielle** :
   - `account_number` et `account_name` stockés dans `journal_entry_lines`
   - **Justification** : Performance (évite JOIN systématique)
   - **Acceptable** SI synchronisation garantie

2. **Absence de contrôle cohérence tiers** :
   - Pas de vérification que compte 411xxx correspond bien au client
   - **Recommandation** : Ajouter validation `third_party_id` ↔ `account_id`

---

### B. MODULE FACTURATION

**Service analysé** : [src/services/invoicingService.ts](src/services/invoicingService.ts)

**Architecture des données** :
```typescript
invoices {
  id, company_id, third_party_id, invoice_number,
  type: 'sale' | 'purchase' | 'credit_note',
  subtotal, tax_amount, total_amount, paid_amount,
  status: 'draft' | 'sent' | 'paid' | 'overdue'
}
  ↓
invoice_lines {
  description, quantity, unit_price,
  discount_percent, tax_rate, line_total,
  account_id // Lien vers plan comptable ✅
}
  ↓
payments {
  invoice_id, amount, payment_date,
  payment_method: 'bank_transfer' | 'check' | 'cash' | 'credit_card',
  status: 'pending' | 'completed' | 'failed'
}
```

#### Points Forts ✅

1. **Calcul TVA intégré** :
   ```typescript
   const lineTotal = quantity * unitPrice * (1 - discountPercent / 100);
   const taxAmount = lineTotal * (taxRate / 100);
   const totalAmount = lineTotal + taxAmount;
   ```

2. **Lien vers plan comptable** :
   - Chaque ligne de facture référence `account_id`
   - Permet future génération d'écritures

3. **Audit trail** :
   ```typescript
   await auditService.logAsync({
     action: 'create_invoice',
     entityType: 'invoice',
     entityId: invoice.id,
     metadata: { invoice_number, total_amount }
   });
   ```

#### Points Faibles Critiques ❌

**PROBLÈME N°1 : ABSENCE DE GÉNÉRATION AUTOMATIQUE D'ÉCRITURES COMPTABLES**

**Constat** :
- Les factures sont créées dans `invoices` table
- AUCUN code ne génère automatiquement les écritures dans `journal_entries`

**Impact** :
- 🔴 **Désynchronisation comptabilité/facturation** : La comptabilité est incomplète si saisie manuelle
- 🔴 **Rapports erronés** : Bilan et compte de résultat incomplets
- 🔴 **TVA incorrecte** : Déclarations TVA basées sur factures et non sur écritures

**Solution Recommandée** :

```typescript
// À ajouter dans invoicingService.ts

async function createInvoiceJournalEntry(invoice: Invoice, lines: InvoiceLine[]) {
  // Déterminer le journal selon le type
  const journalCode = invoice.type === 'sale' ? 'VT' : 'AC'; // VT=Ventes, AC=Achats

  // Construire les lignes d'écriture
  const journalLines = [];

  if (invoice.type === 'sale') {
    // Facture de vente
    // Débit 411xxx Clients
    journalLines.push({
      account_id: await getClientAccountId(invoice.third_party_id), // 411xxx
      debit_amount: invoice.total_amount,
      credit_amount: 0,
      description: `Client ${invoice.third_party_name}`
    });

    // Crédit 707xxx Ventes par ligne
    for (const line of lines) {
      journalLines.push({
        account_id: line.account_id, // 707xxx selon produit
        debit_amount: 0,
        credit_amount: line.subtotal,
        description: line.description
      });
    }

    // Crédit 44571 TVA collectée
    if (invoice.tax_amount > 0) {
      journalLines.push({
        account_id: await getAccountByNumber('44571'), // TVA collectée
        debit_amount: 0,
        credit_amount: invoice.tax_amount,
        description: 'TVA collectée'
      });
    }
  } else {
    // Facture d'achat (logique inverse)
    // Débit 6xxx Charges + 44566 TVA déductible
    // Crédit 401xxx Fournisseurs
    // ... (code similaire inversé)
  }

  // Créer l'écriture comptable
  await journalEntriesService.createJournalEntry({
    companyId: invoice.company_id,
    journalId: journalCode,
    entryDate: invoice.issue_date,
    description: `Facture ${invoice.invoice_number}`,
    referenceNumber: invoice.invoice_number,
    status: invoice.status === 'draft' ? 'draft' : 'posted',
    items: journalLines
  });

  // Lier l'écriture à la facture
  await supabase
    .from('invoices')
    .update({ journal_entry_id: journalEntry.id })
    .eq('id', invoice.id);
}

// Hook après création facture
export async function createInvoice(data: InvoiceCreateData) {
  // ... code existant création facture

  // AJOUT : Générer l'écriture comptable automatiquement
  if (data.status === 'sent' || data.status === 'paid') {
    await createInvoiceJournalEntry(invoice, lines);
  }

  return invoice;
}
```

**PROBLÈME N°2 : DUPLICATION TVA**

**Constat** :
- TVA calculée et stockée dans `invoices.tax_amount`
- TVA devrait être recalculée depuis `journal_entry_lines` (compte 44571)

**Impact** :
- ⚠️ Risque de décalage entre TVA facturée et TVA comptabilisée

**Solutions** :
1. **Option A (Rapide)** : Conserver `tax_amount` comme cache, synchroniser via trigger
2. **Option B (Recommandée)** : Calculer TVA uniquement depuis écritures comptables

**PROBLÈME N°3 : ABSENCE DE LETTRAGE**

**Constat** :
- Paiements liés aux factures via `payments.invoice_id`
- Pas de support pour :
  - Paiements partiels (1 facture payée en 3 fois)
  - Paiements multiples (1 paiement pour 3 factures)
  - Avoirs appliqués à factures

**Solution Recommandée** :

```sql
CREATE TABLE invoice_payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_amount CHECK (allocated_amount > 0)
);

-- Trigger : Vérifier que sum(allocated_amount) <= payment.amount
CREATE FUNCTION check_allocation_total() RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COALESCE(SUM(allocated_amount), 0)
      FROM invoice_payment_allocations
      WHERE payment_id = NEW.payment_id) >
     (SELECT amount FROM payments WHERE id = NEW.payment_id) THEN
    RAISE EXCEPTION 'Montant total alloué dépasse le montant du paiement';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### C. MODULE TAXES/FISCAL

**Service analysé** : [src/services/taxService.ts](src/services/taxService.ts)

**Architecture des données** :
```typescript
company_tax_rates {
  id, company_id, name, rate, type: 'VAT' | 'sales_tax',
  is_default, effective_date
}
  ↓ Utilisé dans
invoice_lines.tax_rate
  ↓ Génère
company_tax_declarations {
  id, company_id, type: 'vat' | 'income_tax',
  period_start, period_end, amount, status, submitted_date
}
  ↓
company_tax_payments {
  id, declaration_id, amount, payment_date, status
}
```

#### Points Forts ✅

1. **Configuration flexible** :
   - Taux TVA multiples par entreprise
   - Taux par défaut configurable
   - Historique des taux (via `effective_date`)

2. **Calcul simple** :
   ```typescript
   function calculateTax(amount: number, rate: number): number {
     return amount * (rate / 100);
   }
   ```

#### Points Faibles Critiques ❌

**PROBLÈME N°4 : GÉNÉRATION DÉCLARATION TVA NON AUTOMATISÉE**

**Constat** :
- Les déclarations TVA sont créées manuellement
- AUCUNE fonction RPC pour agréger automatiquement :
  - TVA collectée (compte 44571)
  - TVA déductible (compte 44566)
  - TVA à payer = Collectée - Déductible

**Impact** :
- 🔴 **Risque d'erreurs** : Calcul manuel sujet à erreurs
- 🔴 **Perte de temps** : Pas d'automatisation

**Solution Recommandée** :

```sql
-- Migration : Ajouter fonction RPC génération déclaration TVA
CREATE OR REPLACE FUNCTION generate_vat_declaration(
  company_id_param UUID,
  period_start_param DATE,
  period_end_param DATE
) RETURNS jsonb AS $$
DECLARE
  v_tva_collectee DECIMAL(15,2);
  v_tva_deductible DECIMAL(15,2);
  v_tva_a_payer DECIMAL(15,2);
BEGIN
  -- TVA collectée (44571xxx)
  SELECT COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0)
  INTO v_tva_collectee
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.company_id = company_id_param
    AND coa.account_number LIKE '44571%'
    AND je.entry_date BETWEEN period_start_param AND period_end_param
    AND je.status = 'posted';

  -- TVA déductible (44566xxx)
  SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0)
  INTO v_tva_deductible
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.company_id = company_id_param
    AND coa.account_number LIKE '44566%'
    AND je.entry_date BETWEEN period_start_param AND period_end_param
    AND je.status = 'posted';

  v_tva_a_payer := v_tva_collectee - v_tva_deductible;

  RETURN jsonb_build_object(
    'period_start', period_start_param,
    'period_end', period_end_param,
    'tva_collectee', v_tva_collectee,
    'tva_deductible', v_tva_deductible,
    'tva_a_payer', v_tva_a_payer,
    'details', jsonb_build_object(
      'sales_vat', v_tva_collectee,
      'purchase_vat', v_tva_deductible
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Service TypeScript correspondant** :

```typescript
// Dans taxService.ts
export async function generateVATDeclaration(
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<VATDeclaration> {
  const { data, error } = await supabase.rpc('generate_vat_declaration', {
    company_id_param: companyId,
    period_start_param: periodStart,
    period_end_param: periodEnd
  });

  if (error) throw error;

  // Créer la déclaration dans la table
  const declaration = await supabase
    .from('company_tax_declarations')
    .insert({
      company_id: companyId,
      type: 'vat',
      period_start: periodStart,
      period_end: periodEnd,
      amount: data.tva_a_payer,
      status: 'draft',
      metadata: data
    })
    .select()
    .single();

  return declaration.data;
}
```

---

### D. MODULE BANCAIRE

**Services analysés** :
- [src/services/bankReconciliationService.ts](src/services/bankReconciliationService.ts)
- [src/services/bankImportService.ts](src/services/bankImportService.ts)
- [src/services/bankMatchingService.ts](src/services/bankMatchingService.ts)

**Architecture des données** :
```typescript
bank_accounts {
  id, company_id, account_number, bank_name,
  current_balance, iban, bic
}
  ↓
bank_transactions {
  id, bank_account_id, transaction_date, amount,
  description, reference, reconciled: boolean,
  bank_transaction_id // Lien vers journal_entry_lines
}
  ↓ Rapprochement avec
journal_entry_lines {
  account_id // 512xxx Banque
}
```

#### Points Forts ✅✅✅ (Module Exemplaire)

1. **Matching intelligent multi-niveaux** :
   ```typescript
   // 1. Matching exact (montant + date ±3 jours)
   const exactMatches = transactions.filter(t =>
     Math.abs(t.amount - entry.amount) < 0.01 &&
     Math.abs(daysBetween(t.date, entry.date)) <= 3
   );

   // 2. Matching par référence
   const referenceMatches = transactions.filter(t =>
     t.reference && entry.reference &&
     t.reference.includes(entry.reference)
   );

   // 3. Matching fuzzy (similarité description)
   const fuzzyMatches = transactions.filter(t =>
     stringSimilarity(t.description, entry.description) > 0.8
   );
   ```

2. **Règles de rapprochement personnalisables** :
   ```typescript
   type ReconciliationRule = {
     pattern: string; // Regex
     accountId: string; // Compte comptable cible
     description: string;
   };
   ```

3. **Unicité garantie** :
   - Transaction bancaire = 1 seule écriture comptable
   - Lien bidirectionnel :
     - `bank_transactions.reconciled = true`
     - `journal_entry_lines.bank_transaction_id = transaction.id`

4. **Import automatisé** :
   - Support formats : CSV, OFX, CAMT.053
   - Parsing intelligent avec détection colonnes

#### Architecture Excellente : 10/10 ⭐⭐⭐⭐⭐

**Ce module est un modèle d'intelligence** :
- Pas de duplication : transactions bancaires ≠ écritures comptables
- Rapprochement avec suggestion automatique
- Validation bidirectionnelle

---

### E. MODULE RAPPORTS FINANCIERS

**Service analysé** : [src/services/reportsService.ts](src/services/reportsService.ts)

**Architecture des données** :
```typescript
financial_reports {
  id, company_id, type: 'balance_sheet' | 'income_statement' | 'cash_flow',
  period_start, period_end, file_url, status
}
  ↓ Génération via RPC PostgreSQL
generate_balance_sheet(company_id, end_date)
generate_income_statement(company_id, start_date, end_date)
generate_trial_balance(company_id, end_date)
generate_cash_flow_statement(company_id, start_date, end_date)
```

#### Points Forts ✅

1. **Source unique de données** :
   - Tous les rapports générés depuis `journal_entry_lines`
   - Pas de duplication, pas de cache

2. **RPC PostgreSQL pour performance** :
   ```sql
   CREATE FUNCTION generate_balance_sheet(
     company_id_param UUID,
     end_date_param DATE
   ) RETURNS TABLE (
     account_number VARCHAR,
     account_name VARCHAR,
     balance DECIMAL
   ) AS $$
   BEGIN
     RETURN QUERY
     SELECT
       coa.account_number,
       coa.account_name,
       COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as balance
     FROM chart_of_accounts coa
     LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
     LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
     WHERE coa.company_id = company_id_param
       AND je.entry_date <= end_date_param
       AND je.status = 'posted'
     GROUP BY coa.account_number, coa.account_name
     ORDER BY coa.account_number;
   END;
   $$ LANGUAGE plpgsql;
   ```

3. **Archivage des rapports** :
   - Génération PDF/Excel
   - Stockage URL dans `file_url`

#### Points d'Attention ⚠️

1. **Gestion multi-devises** :
   - Les RPC doivent gérer les conversions si écritures en devises multiples

2. **Écritures de clôture** :
   - Vérifier que les écritures de clôture/réouverture sont bien prises en compte

---

### F. MODULE BUDGET & CONTRÔLE DE GESTION

**Service analysé** : [src/services/budgetService.ts](src/services/budgetService.ts)

**Architecture des données** :
```typescript
budgets {
  id, company_id, year, version,
  total_revenue_budget, total_expense_budget, net_profit_budget,
  status: 'draft' | 'approved' | 'active'
}
  ↓
budget_categories {
  budget_id, category, subcategory,
  category_type: 'revenue' | 'expense' | 'capex',
  annual_amount, monthly_amounts: number[12],
  account_codes: string[] // ✅ Lien vers plan comptable
}
  ↓ Comparaison avec réalisés
analyze_budget_variances(company_id, budget_id, period_start, period_end)
```

#### Points Forts ✅

1. **Liaison plan comptable** :
   ```typescript
   budget_categories.account_codes = ['707001', '707002', '707003'];
   // Permet comparaison avec écritures comptables réelles
   ```

2. **Granularité mensuelle** :
   ```typescript
   monthly_amounts: [10000, 12000, 11000, ...] // 12 mois
   ```

3. **Analyse d'écarts automatisée** :
   ```sql
   CREATE FUNCTION analyze_budget_variances(
     company_id_param UUID,
     budget_id_param UUID,
     period_start_param DATE,
     period_end_param DATE
   ) RETURNS TABLE (
     category VARCHAR,
     budgeted_amount DECIMAL,
     actual_amount DECIMAL,
     variance DECIMAL,
     variance_percent DECIMAL
   ) AS $$
   BEGIN
     RETURN QUERY
     SELECT
       bc.category,
       bc.monthly_amounts[EXTRACT(MONTH FROM period_start_param)::int] as budgeted,
       COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0) as actual,
       -- ... calcul variance
     FROM budget_categories bc
     LEFT JOIN journal_entry_lines jel ON jel.account_number = ANY(bc.account_codes)
     -- ... WHERE clauses
     GROUP BY bc.category;
   END;
   $$ LANGUAGE plpgsql;
   ```

#### Architecture Excellente : 9/10 ⭐⭐⭐⭐⭐⭐⭐⭐⭐

**Ce module utilise parfaitement l'unicité des données** :
- Budget définit les codes comptables
- Réalisés calculés depuis écritures comptables
- Comparaison directe garantie cohérente

---

## 3. VIOLATIONS DU PRINCIPE DRY (Don't Repeat Yourself)

### Violations CRITIQUES ❌

| Donnée | Source 1 | Source 2 | Impact | Priorité |
|--------|----------|----------|--------|----------|
| **TVA** | `invoices.tax_amount` | `journal_entry_lines` (44571) | Décalage possible | HAUTE |
| **Soldes clients** | `invoices.total_amount - paid_amount` | `journal_entry_lines` (411xxx) | Incohérence | HAUTE |
| **Montants factures** | `invoices.total_amount` | Somme écritures journal | Désynchronisation | HAUTE |

### Violations ACCEPTABLES ⚠️ (Cache de performance)

| Donnée | Source 1 | Source 2 | Justification |
|--------|----------|----------|---------------|
| `account_number` | `chart_of_accounts` | `journal_entry_lines` | Performance (évite JOIN) |
| `current_balance` | `bank_accounts` | Somme `bank_transactions` | Cache temps réel |

**Recommandation** : Utiliser des triggers PostgreSQL pour synchroniser les caches automatiquement.

---

## 4. CARTOGRAPHIE DES FOREIGN KEYS (Intégrité Référentielle)

### Schéma Relationnel

```
companies (id)
  ├── chart_of_accounts (company_id) ✅
  ├── invoices (company_id) ✅
  │     ├── invoice_lines (invoice_id) ✅
  │     └── payments (invoice_id) ✅
  ├── journal_entries (company_id) ✅
  │     └── journal_entry_lines (journal_entry_id) ✅
  │           └── account_id → chart_of_accounts ✅
  ├── bank_accounts (company_id) ✅
  │     └── bank_transactions (bank_account_id) ✅
  ├── budgets (company_id) ✅
  │     └── budget_categories (budget_id) ✅
  └── company_tax_declarations (company_id) ✅
        └── company_tax_payments (declaration_id) ✅
```

**Intégrité : 10/10** ✅ Toutes les foreign keys sont correctement définies avec CASCADE.

---

## 5. AUTOMATISATIONS MANQUANTES (Workflows Incomplets)

### Workflow Actuel vs Workflow Idéal

| Étape | Actuel | Idéal | Gap |
|-------|--------|-------|-----|
| 1. Création facture | ✅ Facture créée | ✅ Facture créée | ✅ |
| 2. Écriture comptable | ❌ Manuelle | ✅ Auto-générée | ❌ **CRITIQUE** |
| 3. Paiement facture | ✅ Payment créé | ✅ Payment créé + Écriture banque | ⚠️ Partiel |
| 4. Rapprochement bancaire | ✅ Matching auto | ✅ Matching auto | ✅ |
| 5. Déclaration TVA | ❌ Manuelle | ✅ Auto-générée | ❌ **CRITIQUE** |
| 6. Lettrage factures | ❌ Absent | ✅ Paiements partiels | ❌ Moyen |
| 7. Rapports financiers | ✅ Auto-générés | ✅ Auto-générés | ✅ |

---

## 6. RECOMMANDATIONS PRIORITAIRES

### 🔴 PRIORITÉ CRITIQUE (À implémenter immédiatement)

#### 1. Génération Automatique Écritures Comptables

**Fichier à modifier** : [src/services/invoicingService.ts](src/services/invoicingService.ts)

**Code à ajouter** :
```typescript
import { journalEntriesService } from './journalEntriesService';
import { accountingService } from './accountingService';

async function createInvoiceJournalEntry(
  invoice: Invoice,
  lines: InvoiceLine[]
): Promise<JournalEntry> {
  const journalCode = invoice.type === 'sale' ? 'VT' : 'AC';

  const journalLines = [];

  if (invoice.type === 'sale') {
    // Débit 411xxx Clients
    const clientAccount = await accountingService.getClientAccount(
      invoice.company_id,
      invoice.third_party_id
    );
    journalLines.push({
      account_id: clientAccount.id,
      debit_amount: invoice.total_amount,
      credit_amount: 0,
      description: `Client ${invoice.third_party_name}`
    });

    // Crédit 707xxx Ventes (par ligne)
    for (const line of lines) {
      journalLines.push({
        account_id: line.account_id,
        debit_amount: 0,
        credit_amount: line.subtotal,
        description: line.description
      });
    }

    // Crédit 44571 TVA collectée
    if (invoice.tax_amount > 0) {
      const vatAccount = await accountingService.getAccountByNumber(
        invoice.company_id,
        '44571'
      );
      journalLines.push({
        account_id: vatAccount.id,
        debit_amount: 0,
        credit_amount: invoice.tax_amount,
        description: 'TVA collectée'
      });
    }
  } else {
    // Logique inverse pour achats (401, 6xxx, 44566)
    // ...
  }

  return await journalEntriesService.createJournalEntry({
    companyId: invoice.company_id,
    journalId: journalCode,
    entryDate: invoice.issue_date,
    description: `Facture ${invoice.invoice_number}`,
    referenceNumber: invoice.invoice_number,
    status: invoice.status === 'draft' ? 'draft' : 'posted',
    items: journalLines
  });
}

// Modifier fonction createInvoice existante
export async function createInvoice(data: InvoiceCreateData) {
  // ... code existant

  // AJOUT : Générer écriture comptable
  if (data.status !== 'draft') {
    const journalEntry = await createInvoiceJournalEntry(invoice, lines);

    // Lier l'écriture à la facture
    await supabase
      .from('invoices')
      .update({ journal_entry_id: journalEntry.id })
      .eq('id', invoice.id);
  }

  return invoice;
}
```

**Migration base de données** :
```sql
-- Ajouter colonne journal_entry_id dans invoices
ALTER TABLE invoices
ADD COLUMN journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL;

-- Index pour performance
CREATE INDEX idx_invoices_journal_entry ON invoices(journal_entry_id);
```

**Bénéfices** :
- ✅ Synchronisation automatique facturation ↔ comptabilité
- ✅ Rapports financiers complets
- ✅ TVA cohérente

---

#### 2. Génération Automatique Déclarations TVA

**Fichier à créer** : `supabase/migrations/20251201000000_generate_vat_declaration.sql`

```sql
CREATE OR REPLACE FUNCTION generate_vat_declaration(
  company_id_param UUID,
  period_start_param DATE,
  period_end_param DATE
) RETURNS jsonb AS $$
DECLARE
  v_tva_collectee DECIMAL(15,2);
  v_tva_deductible DECIMAL(15,2);
  v_ventes_base DECIMAL(15,2);
  v_achats_base DECIMAL(15,2);
BEGIN
  -- TVA collectée (44571xxx)
  SELECT COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0)
  INTO v_tva_collectee
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.company_id = company_id_param
    AND coa.account_number LIKE '44571%'
    AND je.entry_date BETWEEN period_start_param AND period_end_param
    AND je.status = 'posted';

  -- TVA déductible (44566xxx)
  SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0)
  INTO v_tva_deductible
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.company_id = company_id_param
    AND coa.account_number LIKE '44566%'
    AND je.entry_date BETWEEN period_start_param AND period_end_param
    AND je.status = 'posted';

  -- Base ventes HT (707xxx)
  SELECT COALESCE(SUM(jel.credit_amount - jel.debit_amount), 0)
  INTO v_ventes_base
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.company_id = company_id_param
    AND coa.account_number LIKE '707%'
    AND je.entry_date BETWEEN period_start_param AND period_end_param
    AND je.status = 'posted';

  -- Base achats HT (6xxx)
  SELECT COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0)
  INTO v_achats_base
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.journal_entry_id
  JOIN chart_of_accounts coa ON coa.id = jel.account_id
  WHERE coa.company_id = company_id_param
    AND coa.account_number LIKE '6%'
    AND je.entry_date BETWEEN period_start_param AND period_end_param
    AND je.status = 'posted';

  RETURN jsonb_build_object(
    'period_start', period_start_param,
    'period_end', period_end_param,
    'tva_collectee', v_tva_collectee,
    'tva_deductible', v_tva_deductible,
    'tva_a_payer', v_tva_collectee - v_tva_deductible,
    'base_ventes_ht', v_ventes_base,
    'base_achats_ht', v_achats_base,
    'taux_moyen_ventes', CASE WHEN v_ventes_base > 0 THEN (v_tva_collectee / v_ventes_base * 100) ELSE 0 END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant à authenticated
GRANT EXECUTE ON FUNCTION generate_vat_declaration TO authenticated;
```

**Fichier à modifier** : [src/services/taxService.ts](src/services/taxService.ts)

```typescript
export async function generateVATDeclaration(
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<TaxDeclaration> {
  // Appeler RPC PostgreSQL
  const { data: vatData, error: rpcError } = await supabase.rpc(
    'generate_vat_declaration',
    {
      company_id_param: companyId,
      period_start_param: periodStart,
      period_end_param: periodEnd
    }
  );

  if (rpcError) throw rpcError;

  // Créer la déclaration
  const { data: declaration, error } = await supabase
    .from('company_tax_declarations')
    .insert({
      company_id: companyId,
      type: 'vat',
      period_start: periodStart,
      period_end: periodEnd,
      amount: vatData.tva_a_payer,
      status: 'draft',
      metadata: vatData
    })
    .select()
    .single();

  if (error) throw error;

  await auditService.logAsync({
    action: 'generate_vat_declaration',
    entityType: 'tax_declaration',
    entityId: declaration.id,
    metadata: { period: `${periodStart} - ${periodEnd}`, amount: vatData.tva_a_payer }
  });

  return declaration;
}
```

**Bénéfices** :
- ✅ Déclarations TVA en 1 clic
- ✅ Calcul depuis comptabilité (source unique)
- ✅ Audit trail automatique

---

#### 3. Système de Lettrage Factures/Paiements

**Migration** : `supabase/migrations/20251201000001_invoice_payment_allocations.sql`

```sql
CREATE TABLE invoice_payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  allocated_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT positive_amount CHECK (allocated_amount > 0),
  CONSTRAINT unique_payment_invoice UNIQUE (payment_id, invoice_id)
);

-- Trigger : Vérifier cohérence montants
CREATE FUNCTION check_allocation_total() RETURNS TRIGGER AS $$
DECLARE
  v_payment_amount DECIMAL(15,2);
  v_total_allocated DECIMAL(15,2);
BEGIN
  -- Montant du paiement
  SELECT amount INTO v_payment_amount
  FROM payments WHERE id = NEW.payment_id;

  -- Total alloué
  SELECT COALESCE(SUM(allocated_amount), 0)
  INTO v_total_allocated
  FROM invoice_payment_allocations
  WHERE payment_id = NEW.payment_id;

  -- Vérification
  IF v_total_allocated > v_payment_amount THEN
    RAISE EXCEPTION 'Montant total alloué (%) dépasse le paiement (%)',
      v_total_allocated, v_payment_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_allocation
  BEFORE INSERT OR UPDATE ON invoice_payment_allocations
  FOR EACH ROW EXECUTE FUNCTION check_allocation_total();

-- Vue : Soldes factures avec paiements alloués
CREATE VIEW invoice_balances AS
SELECT
  i.id as invoice_id,
  i.invoice_number,
  i.total_amount,
  COALESCE(SUM(ipa.allocated_amount), 0) as paid_amount,
  i.total_amount - COALESCE(SUM(ipa.allocated_amount), 0) as balance_due,
  CASE
    WHEN i.total_amount - COALESCE(SUM(ipa.allocated_amount), 0) <= 0 THEN 'paid'
    WHEN COALESCE(SUM(ipa.allocated_amount), 0) > 0 THEN 'partially_paid'
    ELSE 'unpaid'
  END as payment_status
FROM invoices i
LEFT JOIN invoice_payment_allocations ipa ON ipa.invoice_id = i.id
GROUP BY i.id;
```

**Service TypeScript** : [src/services/paymentAllocationService.ts](src/services/paymentAllocationService.ts)

```typescript
export async function allocatePaymentToInvoices(
  paymentId: string,
  allocations: Array<{ invoiceId: string; amount: number }>
): Promise<void> {
  // Vérifier montant total
  const { data: payment } = await supabase
    .from('payments')
    .select('amount')
    .eq('id', paymentId)
    .single();

  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (totalAllocated > payment.amount) {
    throw new Error(`Montant alloué (${totalAllocated}) > paiement (${payment.amount})`);
  }

  // Insérer allocations
  const { error } = await supabase
    .from('invoice_payment_allocations')
    .insert(
      allocations.map(a => ({
        payment_id: paymentId,
        invoice_id: a.invoiceId,
        allocated_amount: a.amount
      }))
    );

  if (error) throw error;

  // Mettre à jour statut factures
  for (const allocation of allocations) {
    await updateInvoiceStatus(allocation.invoiceId);
  }
}

async function updateInvoiceStatus(invoiceId: string): Promise<void> {
  const { data: balance } = await supabase
    .from('invoice_balances')
    .select('balance_due, payment_status')
    .eq('invoice_id', invoiceId)
    .single();

  await supabase
    .from('invoices')
    .update({
      status: balance.payment_status,
      paid_amount: balance.paid_amount
    })
    .eq('id', invoiceId);
}
```

**Bénéfices** :
- ✅ Support paiements partiels
- ✅ 1 paiement pour N factures
- ✅ Avoirs appliqués automatiquement

---

### 🟠 PRIORITÉ MOYENNE

#### 4. Écritures Paie Automatiques

**Contexte** : Si module RH/Paie existe, générer écritures comptables depuis bulletins de paie.

**Écriture type** :
```
Débit 641 Salaires bruts
Débit 645 Charges sociales patronales
  Crédit 421 Personnel - Rémunérations dues
  Crédit 431 Sécurité sociale
  Crédit 437 Autres organismes sociaux
```

#### 5. Amortissements Automatiques

**Contexte** : Calcul et génération automatique des écritures de dotation aux amortissements.

**RPC PostgreSQL** :
```sql
CREATE FUNCTION generate_depreciation_entries(
  company_id_param UUID,
  period_date DATE
) RETURNS void AS $$
-- Calcul amortissement linéaire/dégressif
-- Génération écritures 681 / 28xxx
$$;
```

---

### 🟢 PRIORITÉ BASSE (Nice to have)

#### 6. Export FEC (Fichier Écritures Comptables)

Format normalisé pour administration fiscale française (DGFiP).

#### 7. Multi-devises

Support écritures en USD, EUR, GBP avec conversion automatique.

#### 8. Tableau de bord temps réel

Cache matérialisé des KPIs principaux (CA, trésorerie, dettes).

---

## 7. TESTS RECOMMANDÉS

### Tests Unitaires à Créer

```typescript
// tests/invoicingService.test.ts
describe('Génération écritures comptables', () => {
  it('doit créer écriture 411/707/44571 pour facture vente', async () => {
    const invoice = await createInvoice({
      type: 'sale',
      subtotal: 1000,
      tax_amount: 200,
      total_amount: 1200
    });

    const journalEntry = await getJournalEntry(invoice.journal_entry_id);

    expect(journalEntry.lines).toHaveLength(3);
    expect(journalEntry.lines[0]).toMatchObject({
      account_number: '411xxx',
      debit_amount: 1200
    });
    expect(journalEntry.lines[1]).toMatchObject({
      account_number: '707xxx',
      credit_amount: 1000
    });
    expect(journalEntry.lines[2]).toMatchObject({
      account_number: '44571',
      credit_amount: 200
    });
  });
});

// tests/taxService.test.ts
describe('Génération déclaration TVA', () => {
  it('doit calculer TVA collectée - déductible', async () => {
    // Créer écritures test
    await createJournalEntry({ account: '44571', credit: 1000 }); // TVA collectée
    await createJournalEntry({ account: '44566', debit: 300 });   // TVA déductible

    const declaration = await generateVATDeclaration(companyId, '2025-01-01', '2025-01-31');

    expect(declaration.amount).toBe(700); // 1000 - 300
  });
});
```

### Tests d'Intégration

```typescript
describe('Flux complet facture → comptabilité → TVA', () => {
  it('doit synchroniser facture, écritures et déclaration TVA', async () => {
    // 1. Créer facture
    const invoice = await createInvoice({ subtotal: 1000, tax_rate: 20 });

    // 2. Vérifier écriture générée
    const journalEntry = await getJournalEntry(invoice.journal_entry_id);
    expect(journalEntry).toBeDefined();

    // 3. Générer déclaration TVA
    const vatDeclaration = await generateVATDeclaration(companyId, startDate, endDate);
    expect(vatDeclaration.tva_collectee).toBeGreaterThan(0);

    // 4. Vérifier cohérence
    expect(vatDeclaration.tva_collectee).toBe(invoice.tax_amount);
  });
});
```

---

## 8. MÉTRIQUES DE QUALITÉ

### Code Coverage Cible

| Module | Coverage Actuel | Cible | Gap |
|--------|-----------------|-------|-----|
| journalEntriesService | ? | 90% | - |
| invoicingService | ? | 85% | - |
| taxService | ? | 80% | - |
| bankReconciliationService | ? | 85% | - |

### Indicateurs de Performance

| Indicateur | Valeur Cible | Méthode Mesure |
|------------|--------------|----------------|
| Temps génération bilan | < 2s | Lighthouse |
| Temps rapprochement bancaire | < 1s pour 100 transactions | Benchmark |
| Latence RPC | < 500ms | Supabase metrics |

---

## 9. CONCLUSION ET SYNTHÈSE

### Architecture Actuelle : 7/10 ⭐⭐⭐⭐⭐⭐⭐

**CassKai est un ERP comptable avancé** avec :
- ✅ Fondations solides et architecture modulaire
- ✅ Unicité des données majoritairement respectée
- ✅ Modules exemplaires (Banques, Rapports, Budget)
- ❌ Automatisations critiques manquantes

### Pour Atteindre 10/10

**Développements Critiques (Estimé : 2-3 semaines)** :
1. Génération auto écritures depuis factures (5 jours)
2. Génération auto déclarations TVA (3 jours)
3. Système de lettrage (5 jours)

### Roadmap Recommandée

**Phase 1 - Automatisations Critiques (Sprint 1-2)**
- ✅ Génération écritures factures
- ✅ Déclarations TVA automatiques
- ✅ Lettrage factures/paiements

**Phase 2 - Consolidation (Sprint 3)**
- Tests unitaires complets
- Tests d'intégration
- Documentation technique

**Phase 3 - Optimisations (Sprint 4)**
- Écritures paie
- Amortissements auto
- Export FEC

**Phase 4 - Évolutions (Sprint 5+)**
- Multi-devises
- Consolidation multi-sociétés
- BI avancé

---

## 10. CHECKLIST DE VALIDATION

### Avant Production

- [ ] Migration génération écritures factures déployée
- [ ] Migration déclaration TVA déployée
- [ ] Migration lettrage déployée
- [ ] Tests unitaires > 80% coverage
- [ ] Tests d'intégration flux complet passés
- [ ] Documentation API mise à jour
- [ ] Formation utilisateurs effectuée
- [ ] Backup base de données pré-déploiement

### Post-Production

- [ ] Monitoring erreurs (Sentry/Rollbar)
- [ ] Audit logs vérifiés
- [ ] Performance RPC validée (< 500ms)
- [ ] Feedback utilisateurs collecté

---

**Rapport généré par** : Claude (Anthropic)
**Date** : 30 novembre 2025
**Contact support** : support@casskai.app

---

## ANNEXES

### A. Glossaire Comptable

- **PCG** : Plan Comptable Général (France)
- **SYSCOHADA** : Système Comptable OHADA (Afrique)
- **FEC** : Fichier des Écritures Comptables (export fiscal France)
- **Lettrage** : Rapprochement factures ↔ paiements
- **Rapprochement bancaire** : Matching transactions bancaires ↔ écritures comptables

### B. Codes Comptables Clés

| Compte | Libellé | Usage |
|--------|---------|-------|
| 411xxx | Clients | Créances clients |
| 401xxx | Fournisseurs | Dettes fournisseurs |
| 44571 | TVA collectée | TVA sur ventes |
| 44566 | TVA déductible | TVA sur achats |
| 512xxx | Banques | Mouvements bancaires |
| 707xxx | Ventes | Produits de ventes |
| 6xxxx | Achats/Charges | Charges d'exploitation |

### C. Références Techniques

- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
- [Plan Comptable Général 2025](https://www.plan-comptable.com/)