/**
 * FEC Validation Service
 * Service de validation conforme aux normes DGFiP (Direction Générale des Finances Publiques)
 * Implémente toutes les règles de validation pour les fichiers FEC
 */

import { FECEntry, ImportError, ImportWarning } from '../types/accounting-import.types';

export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
  stats: ValidationStats;
}

export interface ValidationStats {
  totalEntries: number;
  validEntries: number;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  accountsUsed: string[];
  journalsUsed: string[];
}

export interface FECBusinessRules {
  fiscalYearStart: string; // YYYYMMDD
  fiscalYearEnd: string;   // YYYYMMDD
  companyName: string;
  siret: string;
  chartOfAccounts: string[]; // Valid account numbers
  allowedJournals: string[]; // Valid journal codes
}

class FECValidationService {
  private static instance: FECValidationService;

  // Plan Comptable Général - Principaux préfixes valides
  private readonly VALID_ACCOUNT_PREFIXES = [
    '1', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', // Classe 1: Capitaux
    '2', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', // Classe 2: Immobilisations
    '3', '31', '32', '33', '34', '35', '36', '37', '38', '39', // Classe 3: Stocks
    '4', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', // Classe 4: Tiers
    '5', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', // Classe 5: Financiers
    '6', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', // Classe 6: Charges
    '7', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', // Classe 7: Produits
  ];

  // Codes journaux courants
  private readonly STANDARD_JOURNAL_CODES = [
    'AC', 'ACH', // Achats
    'VE', 'VT', 'VEN', // Ventes
    'BQ', 'BA', // Banque
    'CA', 'CAIS', // Caisse
    'OD', // Opérations diverses
    'AN', // À-nouveaux
    'EXT', // Extourne
    'PAIE', // Paie
    'TVA', // TVA
    'INV', // Inventaire
  ];

  private constructor() {}

  public static getInstance(): FECValidationService {
    if (!FECValidationService.instance) {
      FECValidationService.instance = new FECValidationService();
    }
    return FECValidationService.instance;
  }

  /**
   * Validation complète d'un fichier FEC
   */
  validateFEC(
    entries: FECEntry[],
    businessRules?: Partial<FECBusinessRules>
  ): ValidationResult {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    // 1. Validation du format de chaque écriture
    entries.forEach((entry, index) => {
      const formatErrors = this.validateEntryFormat(entry, index);
      errors.push(...formatErrors);
    });

    // 2. Validation des règles métier
    const businessErrors = this.validateBusinessRules(entries, businessRules);
    errors.push(...businessErrors.errors);
    warnings.push(...businessErrors.warnings);

    // 3. Validation de l'équilibre comptable
    const balanceErrors = this.validateBalance(entries);
    errors.push(...balanceErrors);

    // 4. Validation de la cohérence temporelle
    const chronoWarnings = this.validateChronology(entries);
    warnings.push(...chronoWarnings);

    // 5. Validation des doublons
    const duplicateWarnings = this.validateDuplicates(entries);
    warnings.push(...duplicateWarnings);

    // Calcul des statistiques
    const stats = this.calculateStats(entries);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  }

  /**
   * Validation du format d'une écriture
   */
  private validateEntryFormat(entry: FECEntry, rowIndex: number): ImportError[] {
    const errors: ImportError[] = [];
    const row = rowIndex + 2; // +2 car ligne 1 = header, index 0 = ligne 2

    // 1. Code journal
    if (!entry.journalCode || entry.journalCode.trim().length === 0) {
      errors.push({
        row,
        field: 'journalCode',
        message: 'Code journal obligatoire',
        type: 'validation',
        severity: 'error'
      });
    } else if (entry.journalCode.length > 20) {
      errors.push({
        row,
        field: 'journalCode',
        message: 'Code journal trop long (max 20 caractères)',
        type: 'validation',
        severity: 'error'
      });
    }

    // 2. Libellé journal
    if (!entry.journalName || entry.journalName.trim().length === 0) {
      errors.push({
        row,
        field: 'journalName',
        message: 'Libellé journal obligatoire',
        type: 'validation',
        severity: 'error'
      });
    }

    // 3. Numéro d'écriture
    if (!entry.entryNumber || entry.entryNumber.trim().length === 0) {
      errors.push({
        row,
        field: 'entryNumber',
        message: 'Numéro d\'écriture obligatoire',
        type: 'validation',
        severity: 'error'
      });
    }

    // 4. Date d'écriture (format YYYYMMDD)
    if (!this.isValidFECDate(entry.date)) {
      errors.push({
        row,
        field: 'date',
        message: `Date invalide: "${entry.date}". Format attendu: AAAAMMJJ (ex: 20250104)`,
        type: 'format',
        severity: 'error'
      });
    }

    // 5. Numéro de compte
    if (!entry.accountNumber || entry.accountNumber.trim().length < 3) {
      errors.push({
        row,
        field: 'accountNumber',
        message: 'Numéro de compte obligatoire (minimum 3 caractères)',
        type: 'validation',
        severity: 'error'
      });
    } else if (entry.accountNumber.length > 20) {
      errors.push({
        row,
        field: 'accountNumber',
        message: 'Numéro de compte trop long (max 20 caractères)',
        type: 'validation',
        severity: 'error'
      });
    } else if (!this.isValidAccountNumber(entry.accountNumber)) {
      errors.push({
        row,
        field: 'accountNumber',
        message: `Numéro de compte "${entry.accountNumber}" ne correspond pas au Plan Comptable Général`,
        type: 'business',
        severity: 'error'
      });
    }

    // 6. Libellé de compte
    if (!entry.accountName || entry.accountName.trim().length === 0) {
      errors.push({
        row,
        field: 'accountName',
        message: 'Libellé de compte obligatoire',
        type: 'validation',
        severity: 'error'
      });
    }

    // 7. Référence pièce
    if (!entry.reference || entry.reference.trim().length === 0) {
      errors.push({
        row,
        field: 'reference',
        message: 'Référence de pièce obligatoire',
        type: 'validation',
        severity: 'error'
      });
    }

    // 8. Libellé d'écriture
    if (!entry.label || entry.label.trim().length === 0) {
      errors.push({
        row,
        field: 'label',
        message: 'Libellé d\'écriture obligatoire',
        type: 'validation',
        severity: 'error'
      });
    }

    // 9. Montants (débit et crédit ne peuvent pas être tous les deux > 0)
    if (entry.debit < 0 || entry.credit < 0) {
      errors.push({
        row,
        field: 'debit/credit',
        message: 'Montants négatifs non autorisés',
        type: 'validation',
        severity: 'error'
      });
    }

    if (entry.debit > 0 && entry.credit > 0) {
      errors.push({
        row,
        field: 'debit/credit',
        message: 'Une ligne ne peut avoir à la fois un débit ET un crédit',
        type: 'business',
        severity: 'error'
      });
    }

    if (entry.debit === 0 && entry.credit === 0) {
      errors.push({
        row,
        field: 'debit/credit',
        message: 'Au moins un montant (débit ou crédit) doit être supérieur à 0',
        type: 'validation',
        severity: 'error'
      });
    }

    // 10. Devise (si présente, doit être ISO 4217)
    if (entry.currency && entry.currency.length !== 3) {
      errors.push({
        row,
        field: 'currency',
        message: `Code devise invalide: "${entry.currency}". Format attendu: 3 lettres ISO 4217 (ex: EUR, USD)`,
        type: 'format',
        severity: 'error'
      });
    }

    return errors;
  }

  /**
   * Validation des règles métier
   */
  private validateBusinessRules(
    entries: FECEntry[],
    businessRules?: Partial<FECBusinessRules>
  ): { errors: ImportError[]; warnings: ImportWarning[] } {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    entries.forEach((entry, index) => {
      const row = index + 2;

      // 1. Vérifier si le journal est dans la liste autorisée
      if (businessRules?.allowedJournals && businessRules.allowedJournals.length > 0) {
        if (!businessRules.allowedJournals.includes(entry.journalCode)) {
          warnings.push({
            row,
            field: 'journalCode',
            message: `Code journal "${entry.journalCode}" non reconnu dans la liste des journaux autorisés`,
            suggestion: `Codes attendus: ${businessRules.allowedJournals.join(', ')}`
          });
        }
      } else {
        // Vérifier contre les codes standards si pas de règle spécifique
        if (!this.STANDARD_JOURNAL_CODES.includes(entry.journalCode.toUpperCase())) {
          warnings.push({
            row,
            field: 'journalCode',
            message: `Code journal "${entry.journalCode}" non standard`,
            suggestion: `Codes courants: ${this.STANDARD_JOURNAL_CODES.slice(0, 5).join(', ')}, ...`
          });
        }
      }

      // 2. Vérifier si la date est dans l'exercice fiscal
      if (businessRules?.fiscalYearStart && businessRules?.fiscalYearEnd) {
        const entryDate = entry.date;
        if (entryDate < businessRules.fiscalYearStart || entryDate > businessRules.fiscalYearEnd) {
          warnings.push({
            row,
            field: 'date',
            message: `Date "${this.formatDate(entryDate)}" hors de l'exercice fiscal`,
            suggestion: `Exercice: ${this.formatDate(businessRules.fiscalYearStart)} - ${this.formatDate(businessRules.fiscalYearEnd)}`
          });
        }
      }

      // 3. Vérifier si le compte est dans le plan comptable
      if (businessRules?.chartOfAccounts && businessRules.chartOfAccounts.length > 0) {
        if (!businessRules.chartOfAccounts.includes(entry.accountNumber)) {
          warnings.push({
            row,
            field: 'accountNumber',
            message: `Compte "${entry.accountNumber}" non trouvé dans le plan comptable de l'entreprise`,
            suggestion: 'Vérifier le numéro de compte ou mettre à jour le plan comptable'
          });
        }
      }
    });

    return { errors, warnings };
  }

  /**
   * Validation de l'équilibre comptable
   */
  private validateBalance(entries: FECEntry[]): ImportError[] {
    const errors: ImportError[] = [];

    // 1. Équilibre global
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
    const difference = Math.abs(totalDebit - totalCredit);

    // Tolérance de 0.01€ pour les arrondis
    if (difference > 0.01) {
      errors.push({
        row: 0,
        message: `Fichier non équilibré: Débit total = ${totalDebit.toFixed(2)}€, Crédit total = ${totalCredit.toFixed(2)}€, Différence = ${difference.toFixed(2)}€`,
        type: 'business',
        severity: 'error'
      });
    }

    // 2. Équilibre par écriture (groupe par numéro d'écriture)
    const entriesByNumber = this.groupByEntryNumber(entries);

    Object.entries(entriesByNumber).forEach(([entryNumber, entryLines]) => {
      const debit = entryLines.reduce((sum, e) => sum + e.debit, 0);
      const credit = entryLines.reduce((sum, e) => sum + e.credit, 0);
      const diff = Math.abs(debit - credit);

      if (diff > 0.01) {
        const firstRow = entries.findIndex(e => e.entryNumber === entryNumber) + 2;
        errors.push({
          row: firstRow,
          field: 'entryNumber',
          message: `Écriture "${entryNumber}" non équilibrée: Débit = ${debit.toFixed(2)}€, Crédit = ${credit.toFixed(2)}€, Différence = ${diff.toFixed(2)}€`,
          type: 'business',
          severity: 'error'
        });
      }
    });

    return errors;
  }

  /**
   * Validation de la chronologie
   */
  private validateChronology(entries: FECEntry[]): ImportWarning[] {
    const warnings: ImportWarning[] = [];

    // Vérifier que les écritures sont triées par date
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].date < entries[i - 1].date) {
        warnings.push({
          row: i + 2,
          field: 'date',
          message: `Ordre chronologique non respecté: ${this.formatDate(entries[i].date)} < ${this.formatDate(entries[i - 1].date)}`,
          suggestion: 'Les écritures doivent être triées par date croissante'
        });
      }
    }

    return warnings;
  }

  /**
   * Détection des doublons
   */
  private validateDuplicates(entries: FECEntry[]): ImportWarning[] {
    const warnings: ImportWarning[] = [];
    const seen = new Set<string>();

    entries.forEach((entry, index) => {
      // Clé unique: journal + numéro écriture + date + compte + montant
      const key = `${entry.journalCode}|${entry.entryNumber}|${entry.date}|${entry.accountNumber}|${entry.debit}|${entry.credit}`;

      if (seen.has(key)) {
        warnings.push({
          row: index + 2,
          message: `Possible doublon détecté: Journal=${entry.journalCode}, Écriture=${entry.entryNumber}, Compte=${entry.accountNumber}`,
          suggestion: 'Vérifier s\'il s\'agit bien d\'une écriture différente'
        });
      }

      seen.add(key);
    });

    return warnings;
  }

  /**
   * Calcul des statistiques
   */
  private calculateStats(entries: FECEntry[]): ValidationStats {
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.01;

    const dates = entries.map(e => e.date).sort();
    const accountsUsed = Array.from(new Set(entries.map(e => e.accountNumber))).sort();
    const journalsUsed = Array.from(new Set(entries.map(e => e.journalCode))).sort();

    return {
      totalEntries: entries.length,
      validEntries: entries.length, // Sera ajusté après validation
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      isBalanced,
      dateRange: {
        start: dates[0] || '',
        end: dates[dates.length - 1] || ''
      },
      accountsUsed,
      journalsUsed
    };
  }

  // Méthodes utilitaires

  private isValidFECDate(date: string): boolean {
    if (!date || date.length !== 8) return false;
    if (!/^\d{8}$/.test(date)) return false;

    const year = parseInt(date.substring(0, 4), 10);
    const month = parseInt(date.substring(4, 6), 10);
    const day = parseInt(date.substring(6, 8), 10);

    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Vérification plus stricte avec Date
    const dateObj = new Date(year, month - 1, day);
    return (
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day
    );
  }

  private isValidAccountNumber(accountNumber: string): boolean {
    // Vérifier si le compte commence par un préfixe valide du PCG
    const prefix = accountNumber.substring(0, 1);
    return this.VALID_ACCOUNT_PREFIXES.some(p => accountNumber.startsWith(p));
  }

  private formatDate(fecDate: string): string {
    if (!fecDate || fecDate.length !== 8) return fecDate;
    return `${fecDate.substring(6, 8)}/${fecDate.substring(4, 6)}/${fecDate.substring(0, 4)}`;
  }

  private groupByEntryNumber(entries: FECEntry[]): Record<string, FECEntry[]> {
    return entries.reduce((groups, entry) => {
      const key = entry.entryNumber;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
      return groups;
    }, {} as Record<string, FECEntry[]>);
  }
}

// Export singleton instance
export const fecValidationService = FECValidationService.getInstance();
export default fecValidationService;
