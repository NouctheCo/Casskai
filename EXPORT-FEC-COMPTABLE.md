# Export FEC (Fichier des Écritures Comptables)

## 🇫🇷 Conformité Légale Française

Le FEC est obligatoire en France pour les entreprises soumises à un contrôle fiscal (article A47 A-1 du LPF).

## 📋 Format FEC

Format texte délimité par pipe `|` ou tabulation, 18 colonnes obligatoires :

```
JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise
```

## ⚙️ Service d'Export FEC

### Créer `src/services/fecExportService.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export interface FECLine {
  JournalCode: string;        // Code journal (VE, AC, BQ, OD...)
  JournalLib: string;         // Libellé journal
  EcritureNum: string;        // Numéro d'écriture
  EcritureDate: string;       // Date écriture (YYYYMMDD)
  CompteNum: string;          // Numéro de compte
  CompteLib: string;          // Libellé compte
  CompAuxNum: string;         // Compte auxiliaire (client/fournisseur)
  CompAuxLib: string;         // Libellé auxiliaire
  PieceRef: string;           // Référence pièce
  PieceDate: string;          // Date pièce (YYYYMMDD)
  EcritureLib: string;        // Libellé écriture
  Debit: string;              // Montant débit (format: 123,45)
  Credit: string;             // Montant crédit (format: 123,45)
  EcritureLet: string;        // Lettrage
  DateLet: string;            // Date lettrage
  ValidDate: string;          // Date validation
  Montantdevise: string;      // Montant devise
  Idevise: string;            // Code devise
}

export class FECExportService {
  /**
   * Génère un export FEC pour une période donnée
   */
  static async generateFEC(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
    try {
      // 1. Récupérer toutes les écritures de la période
      const { data: entries, error: entriesError } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journals(*),
          journal_entry_lines(
            *,
            chart_of_accounts(*)
          )
        `)
        .eq('company_id', companyId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .eq('status', 'posted') // Seulement les écritures validées
        .order('entry_date', { ascending: true })
        .order('entry_number', { ascending: true });

      if (entriesError || !entries) {
        return { success: false, error: 'Erreur lors de la récupération des écritures' };
      }

      // 2. Récupérer les informations de l'entreprise
      const { data: company } = await supabase
        .from('companies')
        .select('siren, name')
        .eq('id', companyId)
        .single();

      // 3. Générer les lignes FEC
      const fecLines: FECLine[] = [];

      for (const entry of entries) {
        const journalCode = entry.journals?.code || 'OD';
        const journalLib = entry.journals?.name || 'Opérations Diverses';
        const ecritureNum = entry.entry_number || '';
        const ecritureDate = format(new Date(entry.entry_date), 'yyyyMMdd');
        const pieceDate = ecritureDate;
        const validDate = entry.posted_at ? format(new Date(entry.posted_at), 'yyyyMMdd') : '';

        for (const line of entry.journal_entry_lines || []) {
          const account = line.chart_of_accounts;

          fecLines.push({
            JournalCode: journalCode,
            JournalLib: journalLib,
            EcritureNum: ecritureNum,
            EcritureDate: ecritureDate,
            CompteNum: account?.account_number || '',
            CompteLib: account?.account_name || '',
            CompAuxNum: '', // À remplir si compte auxiliaire
            CompAuxLib: '',
            PieceRef: entry.reference_number || '',
            PieceDate: pieceDate,
            EcritureLib: line.description || '',
            Debit: this.formatAmount(line.debit_amount || 0),
            Credit: this.formatAmount(line.credit_amount || 0),
            EcritureLet: '', // Lettrage non géré pour l'instant
            DateLet: '',
            ValidDate: validDate,
            Montantdevise: '',
            Idevise: 'EUR'
          });
        }
      }

      // 4. Générer le fichier FEC
      const fecContent = this.generateFECFile(fecLines);

      // 5. Nom du fichier : SIREN + FEC + date début + date fin + .txt
      const siren = company?.siren || '000000000';
      const filename = `${siren}FEC${format(new Date(startDate), 'yyyyMMdd')}${format(new Date(endDate), 'yyyyMMdd')}.txt`;

      return {
        success: true,
        data: fecContent,
        filename
      };
    } catch (error) {
      console.error('Error generating FEC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Génère le contenu du fichier FEC
   */
  private static generateFECFile(lines: FECLine[]): string {
    // En-tête
    const header = [
      'JournalCode',
      'JournalLib',
      'EcritureNum',
      'EcritureDate',
      'CompteNum',
      'CompteLib',
      'CompAuxNum',
      'CompAuxLib',
      'PieceRef',
      'PieceDate',
      'EcritureLib',
      'Debit',
      'Credit',
      'EcritureLet',
      'DateLet',
      'ValidDate',
      'Montantdevise',
      'Idevise'
    ].join('|');

    // Lignes
    const content = lines.map(line => [
      line.JournalCode,
      line.JournalLib,
      line.EcritureNum,
      line.EcritureDate,
      line.CompteNum,
      line.CompteLib,
      line.CompAuxNum,
      line.CompAuxLib,
      line.PieceRef,
      line.PieceDate,
      line.EcritureLib,
      line.Debit,
      line.Credit,
      line.EcritureLet,
      line.DateLet,
      line.ValidDate,
      line.Montantdevise,
      line.Idevise
    ].join('|')).join('\n');

    return `${header}\n${content}`;
  }

  /**
   * Formate un montant au format FEC (virgule comme séparateur décimal)
   */
  private static formatAmount(amount: number): string {
    return amount.toFixed(2).replace('.', ',');
  }

  /**
   * Télécharge le fichier FEC
   */
  static downloadFEC(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export default FECExportService;
```

## 🔄 Intégration UI

### Ajouter un bouton dans le module Accounting

```typescript
import FECExportService from '@/services/fecExportService';

const handleExportFEC = async () => {
  try {
    setExporting(true);

    const result = await FECExportService.generateFEC(
      currentCompany.id,
      '2025-01-01',
      '2025-12-31'
    );

    if (result.success && result.data && result.filename) {
      FECExportService.downloadFEC(result.data, result.filename);
      toast({
        title: "✅ Export FEC réussi",
        description: `Fichier ${result.filename} téléchargé`
      });
    } else {
      throw new Error(result.error || 'Erreur inconnue');
    }
  } catch (error) {
    toast({
      title: "❌ Erreur",
      description: "Impossible d'exporter le FEC",
      variant: "destructive"
    });
  } finally {
    setExporting(false);
  }
};
```

## ✅ Validation FEC

Le fichier doit :
- ✅ Être encodé en UTF-8
- ✅ Avoir 18 colonnes séparées par `|`
- ✅ Format de date : YYYYMMDD
- ✅ Montants avec virgule comme séparateur décimal
- ✅ Nom de fichier : SIRENFECYYYYMMDDYYYYMMDD.txt
- ✅ Écritures équilibrées (Débit = Crédit)
- ✅ Ordre chronologique

---

**Date** : 9 décembre 2025
**Status** : Service complet prêt à intégrer
