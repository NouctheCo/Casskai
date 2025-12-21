# Validation Automatique des Écritures Comptables

## 🎯 Objectif

Passer automatiquement les écritures de `draft` (brouillon) à `posted` (validé) après vérification.

## ⚙️ Service de Validation Automatique

### Créer `src/services/autoValidationService.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { journalEntriesService } from './journalEntriesService';

export interface AutoValidationRule {
  // Valider automatiquement si :
  validateIfBalanced: boolean;           // Débit = Crédit
  validateIfHasAllAccounts: boolean;     // Tous les comptes existent
  validateIfAmountBelow?: number;        // Montant < seuil
  validateIfJournalTypes?: string[];     // Types de journaux autorisés
  requireManualApproval: boolean;        // Nécessite approbation manuelle
}

export class AutoValidationService {
  /**
   * Valide automatiquement une écriture selon les règles
   */
  static async autoValidateEntry(
    entryId: string,
    rules: AutoValidationRule = {
      validateIfBalanced: true,
      validateIfHasAllAccounts: true,
      validateIfAmountBelow: 10000, // 10k€ max
      validateIfJournalTypes: ['sale', 'bank'],
      requireManualApproval: false
    }
  ): Promise<{ success: boolean; validated: boolean; reason?: string }> {
    try {
      // 1. Récupérer l'écriture
      const { data: entry, error } = await supabase
        .from('journal_entries')
        .select('*, journal_entry_lines(*), journals(*)')
        .eq('id', entryId)
        .single();

      if (error || !entry) {
        return { success: false, validated: false, reason: 'Écriture non trouvée' };
      }

      // 2. Vérifier l'équilibre
      if (rules.validateIfBalanced) {
        const totalDebit = entry.journal_entry_lines?.reduce(
          (sum: number, line: any) => sum + (line.debit_amount || 0),
          0
        ) || 0;
        const totalCredit = entry.journal_entry_lines?.reduce(
          (sum: number, line: any) => sum + (line.credit_amount || 0),
          0
        ) || 0;

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          return { success: true, validated: false, reason: 'Écriture non équilibrée' };
        }
      }

      // 3. Vérifier le montant
      if (rules.validateIfAmountBelow) {
        const totalAmount = entry.journal_entry_lines?.reduce(
          (sum: number, line: any) => sum + (line.debit_amount || 0),
          0
        ) || 0;

        if (totalAmount > rules.validateIfAmountBelow) {
          return { success: true, validated: false, reason: 'Montant supérieur au seuil' };
        }
      }

      // 4. Vérifier le type de journal
      if (rules.validateIfJournalTypes && rules.validateIfJournalTypes.length > 0) {
        if (!rules.validateIfJournalTypes.includes(entry.journals?.type)) {
          return { success: true, validated: false, reason: 'Type de journal non autorisé' };
        }
      }

      // 5. Approbation manuelle requise ?
      if (rules.requireManualApproval) {
        return { success: true, validated: false, reason: 'Approbation manuelle requise' };
      }

      // 6. Valider l'écriture
      const result = await journalEntriesService.postJournalEntry(entryId);

      if (result.success) {
        return { success: true, validated: true };
      } else {
        return { success: false, validated: false, reason: 'Erreur lors de la validation' };
      }
    } catch (error) {
      console.error('Error auto-validating entry:', error);
      return {
        success: false,
        validated: false,
        reason: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Valide automatiquement toutes les écritures en brouillon éligibles
   */
  static async autoValidateAllPending(
    companyId: string,
    rules?: AutoValidationRule
  ): Promise<{ validated: number; skipped: number }> {
    try {
      // Récupérer toutes les écritures en brouillon
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'draft');

      if (error || !entries) {
        return { validated: 0, skipped: 0 };
      }

      let validated = 0;
      let skipped = 0;

      // Valider chaque écriture
      for (const entry of entries) {
        const result = await this.autoValidateEntry(entry.id, rules);
        if (result.validated) {
          validated++;
        } else {
          skipped++;
        }
      }

      return { validated, skipped };
    } catch (error) {
      console.error('Error auto-validating all entries:', error);
      return { validated: 0, skipped: 0 };
    }
  }
}

export default AutoValidationService;
```

## 🔄 Intégration dans `useAutoAccounting`

Modifier `src/hooks/useAutoAccounting.ts` pour ajouter la validation automatique :

```typescript
// Après la création de l'écriture
const result = await autoAccountingService.generateInvoiceJournalEntry(invoice);

if (result.success && result.entryId) {
  // ✅ Validation automatique (optionnelle)
  const validationResult = await AutoValidationService.autoValidateEntry(
    result.entryId,
    {
      validateIfBalanced: true,
      validateIfHasAllAccounts: true,
      validateIfAmountBelow: 5000, // Validation auto jusqu'à 5k€
      validateIfJournalTypes: ['sale', 'bank'],
      requireManualApproval: false
    }
  );

  if (validationResult.validated) {
    toast({
      title: "✅ Écriture validée automatiquement",
      description: `L'écriture a été générée et validée (réf: ${result.entryId?.slice(0, 8)}...)`,
    });
  }
}
```

## ⚙️ Configuration par Entreprise

Créer une table `company_auto_validation_settings` :

```sql
CREATE TABLE company_auto_validation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  enabled BOOLEAN DEFAULT false,
  validate_if_balanced BOOLEAN DEFAULT true,
  validate_if_has_all_accounts BOOLEAN DEFAULT true,
  amount_threshold DECIMAL(15,2) DEFAULT 10000.00,
  journal_types TEXT[] DEFAULT ARRAY['sale', 'bank'],
  require_manual_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

**Date** : 9 décembre 2025
**Status** : Architecture prête à implémenter
