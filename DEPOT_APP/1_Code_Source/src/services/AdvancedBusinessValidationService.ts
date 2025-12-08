/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

// src/services/AdvancedBusinessValidationService.ts
import { supabase } from '../lib/supabase';
import type { ValidationResult, JournalEntry } from '../types/accounting';

export interface BusinessValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'temporal' | 'sectorial' | 'compliance' | 'consistency' | 'balance';
  enabled: boolean;
  parameters?: Record<string, unknown>;
}

export interface ValidationContext {
  companyId: string;
  countryCode: string;
  sector: string;
  fiscalYearStart: Date;
  entryDate: Date;
  journalType: string;
}

/**
 * Service de validations métier avancées
 * Implémente les règles complexes de validation comptable
 */
export class AdvancedBusinessValidationService {
  private static instance: AdvancedBusinessValidationService;

  static getInstance(): AdvancedBusinessValidationService {
    if (!AdvancedBusinessValidationService.instance) {
      AdvancedBusinessValidationService.instance = new AdvancedBusinessValidationService();
    }
    return AdvancedBusinessValidationService.instance;
  }

  /**
   * Valide une écriture selon toutes les règles métier avancées
   */
  async validateBusinessRules(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // 1. Validation temporelle avancée
    const temporalValidation = await this.validateTemporalRules(entry, context);
    errors.push(...temporalValidation.errors);
    warnings.push(...temporalValidation.warnings);

    // 2. Validation sectorielle
    const sectorValidation = await this.validateSectorRules(entry, context);
    errors.push(...sectorValidation.errors);
    warnings.push(...sectorValidation.warnings);

    // 3. Validation de conformité (TVA, normes comptables)
    const complianceValidation = await this.validateComplianceRules(entry, context);
    errors.push(...complianceValidation.errors);
    warnings.push(...complianceValidation.warnings);

    // 4. Validation de cohérence inter-périodes
    const consistencyValidation = await this.validateInterPeriodConsistency(entry, context);
    errors.push(...consistencyValidation.errors);
    warnings.push(...consistencyValidation.warnings);

    // 5. Validation des balances et équilibres
    const balanceValidation = await this.validateBalanceRules(entry, context);
    errors.push(...balanceValidation.errors);
    warnings.push(...balanceValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validation des règles temporelles avancées
   */
  private async validateTemporalRules(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    const entryDate = new Date(entry.date);

    // Vérifier que la date n'est pas dans le futur
    const now = new Date();
    if (entryDate > now) {
      errors.push({
        field: 'date',
        message: 'La date de l\'écriture ne peut pas être dans le futur',
        severity: 'error'
      });
    }

    // Vérifier la période comptable
    const periodValidation = await this.validateAccountingPeriod(entryDate, context.companyId);
    if (!periodValidation.isValid) {
      errors.push(...periodValidation.errors);
    }

    // Vérifier la cohérence avec l'exercice fiscal
    const fiscalYearValidation = this.validateFiscalYearConsistency(entryDate, context.fiscalYearStart);
    if (!fiscalYearValidation.isValid) {
      warnings.push(...fiscalYearValidation.warnings);
    }

    // Vérifier les dates limites de déclaration
    const deadlineValidation = await this.validateDeclarationDeadlines(entry, context);
    if (!deadlineValidation.isValid) {
      warnings.push(...deadlineValidation.warnings);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validation des règles sectorielles
   */
  private async validateSectorRules(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    switch (context.sector) {
      case 'RESTAURATION': {
        const restaurantValidation = await this.validateRestaurantRules(entry, context);
        errors.push(...restaurantValidation.errors);
        warnings.push(...restaurantValidation.warnings);
        break;
      }

      case 'COMMERCE': {
        const commerceValidation = await this.validateCommerceRules(entry, context);
        errors.push(...commerceValidation.errors);
        warnings.push(...commerceValidation.warnings);
        break;
      }

      case 'SERVICES_PROF': {
        const professionalValidation = await this.validateProfessionalServicesRules(entry, context);
        errors.push(...professionalValidation.errors);
        warnings.push(...professionalValidation.warnings);
        break;
      }

      case 'MANUFACTURING': {
        const manufacturingValidation = await this.validateManufacturingRules(entry, context);
        errors.push(...manufacturingValidation.errors);
        warnings.push(...manufacturingValidation.warnings);
        break;
      }

      default:
        // Règles générales pour les autres secteurs
        break;
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validation des règles de conformité
   */
  private async validateComplianceRules(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Validation TVA selon la législation du pays
    const vatValidation = await this.validateVATCompliance(entry, context);
    if (!vatValidation.isValid) {
      errors.push(...vatValidation.errors);
      warnings.push(...vatValidation.warnings);
    }

    // Validation des normes comptables (PCG/SYSCOHADA)
    const standardValidation = await this.validateAccountingStandards(entry, context);
    if (!standardValidation.isValid) {
      errors.push(...standardValidation.errors);
      warnings.push(...standardValidation.warnings);
    }

    // Validation des seuils et limites légales
    const thresholdValidation = await this.validateLegalThresholds(entry, context);
    if (!thresholdValidation.isValid) {
      warnings.push(...thresholdValidation.warnings);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validation de cohérence inter-périodes
   */
  private async validateInterPeriodConsistency(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Vérifier la continuité des soldes
    const balanceValidation = await this.validateBalanceContinuity(entry, context);
    if (!balanceValidation.isValid) {
      errors.push(...balanceValidation.errors);
    }

    // Vérifier la cohérence des amortissements
    const depreciationValidation = await this.validateDepreciationConsistency(entry, context);
    if (!depreciationValidation.isValid) {
      warnings.push(...depreciationValidation.warnings);
    }

    // Vérifier les provisions inter-périodes
    const provisionValidation = await this.validateProvisionConsistency(entry, context);
    if (!provisionValidation.isValid) {
      warnings.push(...provisionValidation.warnings);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validation des règles de balance
   */
  private async validateBalanceRules(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Calcul de l'équilibre de l'écriture
    const balanceCheck = this.checkEntryBalance(entry);
    if (!balanceCheck.isBalanced) {
      errors.push({
        field: 'balance',
        message: `Écriture non équilibrée: différence de ${balanceCheck.difference}€`,
        severity: 'error'
      });
    }

    // Validation des soldes débiteurs/créditeurs par compte
    const accountBalanceValidation = await this.validateAccountBalances(entry, context);
    if (!accountBalanceValidation.isValid) {
      warnings.push(...accountBalanceValidation.warnings);
    }

    // Vérification des anomalies de montant
    const amountValidation = this.validateAmounts(entry);
    if (!amountValidation.isValid) {
      warnings.push(...amountValidation.warnings);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES DE VALIDATION
  // ============================================================================

  private async validateAccountingPeriod(date: Date, companyId: string): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];

    const { data: periods } = await supabase
      .from('accounting_periods')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_open', true)
      .lte('start_date', date.toISOString())
      .gte('end_date', date.toISOString());

    if (!periods || periods.length === 0) {
      errors.push({
        field: 'date',
        message: 'La date ne correspond à aucune période comptable ouverte',
        severity: 'error'
      });
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private validateFiscalYearConsistency(entryDate: Date, fiscalYearStart: Date): ValidationResult {
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Vérifier si la date est proche de la fin d'exercice
    const fiscalYearEnd = new Date(fiscalYearStart);
    fiscalYearEnd.setFullYear(fiscalYearEnd.getFullYear() + 1);
    fiscalYearEnd.setDate(fiscalYearEnd.getDate() - 1);

    const daysToFiscalYearEnd = Math.ceil((fiscalYearEnd.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysToFiscalYearEnd <= 30 && daysToFiscalYearEnd > 0) {
      warnings.push({
        field: 'date',
        message: `Attention: ${daysToFiscalYearEnd} jours avant la clôture de l'exercice fiscal`,
        severity: 'warning'
      });
    }

    return { isValid: true, errors: [], warnings };
  }

  private async validateDeclarationDeadlines(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Logique simplifiée - à adapter selon les pays
    const entryDate = new Date(entry.date);
    const currentMonth = entryDate.getMonth();

    // Exemple: vérification TVA mensuelle
    if (context.countryCode === 'FR' && entry.lines?.some((line) => (line as { account_number?: string }).account_number?.startsWith('445'))) {
      const nextMonth = new Date(entryDate);
      nextMonth.setMonth(currentMonth + 1, 20); // 20ème jour du mois suivant

      const daysToDeadline = Math.ceil((nextMonth.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysToDeadline <= 15 && daysToDeadline > 0) {
        warnings.push({
          field: 'date',
          message: `Rappel: déclaration TVA dans ${daysToDeadline} jours`,
          severity: 'info'
        });
      }
    }

    return { isValid: true, errors: [], warnings };
  }

  // ============================================================================
  // VALIDATIONS SECTORIELLES
  // ============================================================================

  private async validateRestaurantRules(
    entry: JournalEntry,
    _context: ValidationContext
  ): Promise<ValidationResult> {
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Vérifier les comptes spécifiques à la restauration
    const hasFoodPurchases = entry.lines?.some((line) =>
      (line as { account_number?: string }).account_number?.startsWith('60') || (line as { account_number?: string }).account_number?.startsWith('61')
    );

    if (hasFoodPurchases) {
      // Vérifier si les achats alimentaires sont correctement catégorisés
      const foodAccounts = ['601', '602', '603']; // Exemple de comptes alimentaires
      const hasProperFoodAccount = entry.lines?.some((line) =>
        foodAccounts.some(account => (line as { account_number?: string }).account_number?.startsWith(account))
      );

      if (!hasProperFoodAccount) {
        warnings.push({
          field: 'accounts',
          message: 'Considérez utiliser un compte spécifique pour les achats alimentaires',
          severity: 'info'
        });
      }
    }

    return { isValid: true, errors: [], warnings };
  }

  private async validateCommerceRules(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Validation des stocks et inventaires
    const hasInventoryMovement = entry.lines?.some((line) =>
      (line as { account_number?: string }).account_number?.startsWith('3') // Comptes de stocks
    );

    if (hasInventoryMovement) {
      // Vérifier la cohérence des mouvements de stock
      const stockValidation = await this.validateStockMovements(entry, context);
      if (!stockValidation.isValid) {
        warnings.push(...stockValidation.warnings);
      }
    }

    return { isValid: true, errors: [], warnings };
  }

  private async validateProfessionalServicesRules(
    entry: JournalEntry,
    _context: ValidationContext
  ): Promise<ValidationResult> {
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Validation spécifique aux services professionnels
    const hasServiceRevenue = entry.lines?.some((line) =>
      (line as { account_number?: string }).account_number?.startsWith('70') || (line as { account_number?: string }).account_number?.startsWith('71')
    );

    if (hasServiceRevenue) {
      // Vérifier la TVA applicable aux services
      const vatCheck = this.checkServiceVAT(entry);
      if (!vatCheck.isValid) {
        warnings.push(...vatCheck.warnings);
      }
    }

    return { isValid: true, errors: [], warnings };
  }

  private async validateManufacturingRules(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Validation de la production et des coûts
    const hasProductionCosts = entry.lines?.some((line) =>
      (line as { account_number?: string }).account_number?.startsWith('6') && !(line as { account_number?: string }).account_number?.startsWith('60') && !(line as { account_number?: string }).account_number?.startsWith('61')
    );

    if (hasProductionCosts) {
      // Vérifier l'imputation correcte des coûts de production
      const productionValidation = await this.validateProductionCosts(entry, context);
      if (!productionValidation.isValid) {
        warnings.push(...productionValidation.warnings);
      }
    }

    return { isValid: true, errors: [], warnings };
  }

  // ============================================================================
  // VALIDATIONS DE CONFORMITÉ
  // ============================================================================

  private async validateVATCompliance(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Validation TVA selon le pays
    const vatValidations = await Promise.all(
      (entry.lines || [])
        .filter(line => (line as { vat_rate?: unknown }).vat_rate !== undefined)
        .map(line => this.validateVATRate((line as unknown as { vat_rate: number }).vat_rate, context.countryCode, new Date(entry.date)))
    );

    for (const vatValidation of vatValidations) {
      if (!vatValidation.isValid) {
        errors.push(...vatValidation.errors);
      }
    }

    // Vérifier l'équilibre TVA
    const vatBalanceCheck = this.checkVATBalance(entry);
    if (!vatBalanceCheck.isBalanced) {
      warnings.push({
        field: 'vat',
        message: 'Écart détecté dans les comptes TVA',
        severity: 'warning'
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private async validateAccountingStandards(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Validation selon PCG ou SYSCOHADA
    const standard = context.countryCode === 'FR' ? 'PCG' : 'SYSCOHADA';

    const accountValidations = await Promise.all(
      (entry.lines || []).map(line =>
        this.validateAccountByStandard((line as { account_number?: string }).account_number || '', standard)
      )
    );

    for (const accountValidation of accountValidations) {
      if (!accountValidation.isValid) {
        errors.push(...accountValidation.errors);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private async validateLegalThresholds(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Calcul du montant total de l'écriture
    const totalAmount = Math.abs(
      (entry.lines || []).reduce((sum: number, line) => sum + ((line as { debit?: number }).debit || 0) + ((line as { credit?: number }).credit || 0), 0)
    );

    // Seuils selon le pays (exemple simplifié)
    const thresholds = {
      'FR': 10000, // 10 000€
      'BE': 2500,  // 2 500€
      'CH': 100000 // 100 000CHF
    };

    const threshold = thresholds[context.countryCode as keyof typeof thresholds] || 10000;

    if (totalAmount > threshold) {
      warnings.push({
        field: 'amount',
        message: `Montant élevé détecté: ${totalAmount}€ (seuil: ${threshold}€)`,
        severity: 'warning'
      });
    }

    return { isValid: true, errors: [], warnings };
  }

  // ============================================================================
  // VALIDATIONS DE COHÉRENCE
  // ============================================================================

  private async validateBalanceContinuity(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];

    // Vérifier la continuité des soldes pour les comptes de bilan
    const balanceLines = (entry.lines || []).filter(line =>
      (line as { account_number?: string }).account_number?.startsWith('1') ||
      (line as { account_number?: string }).account_number?.startsWith('2') ||
      (line as { account_number?: string }).account_number?.startsWith('3') ||
      (line as { account_number?: string }).account_number?.startsWith('4') ||
      (line as { account_number?: string }).account_number?.startsWith('5')
    );

    const continuityChecks = await Promise.all(
      balanceLines.map(line =>
        this.checkAccountBalanceContinuity(
          (line as { account_number?: string }).account_number || '',
          context.companyId,
          new Date(entry.date)
        )
      )
    );

    for (const continuityCheck of continuityChecks) {
      if (!continuityCheck.isValid) {
        errors.push(...continuityCheck.errors);
      }
    }

    return { isValid: errors.length === 0, errors, warnings: [] };
  }

  private async validateDepreciationConsistency(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Vérifier la cohérence des amortissements
    const hasDepreciation = entry.lines?.some((line) =>
      (line as { account_number?: string }).account_number?.startsWith('68') || (line as { account_number?: string }).account_number?.startsWith('28')
    );

    if (hasDepreciation) {
      const depreciationCheck = await this.checkDepreciationLogic(entry, context);
      if (!depreciationCheck.isValid) {
        warnings.push(...depreciationCheck.warnings);
      }
    }

    return { isValid: true, errors: [], warnings };
  }

  private async validateProvisionConsistency(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Vérifier la cohérence des provisions
    const hasProvisions = entry.lines?.some((line) =>
      (line as { account_number?: string }).account_number?.startsWith('15') || (line as { account_number?: string }).account_number?.startsWith('49')
    );

    if (hasProvisions) {
      const provisionCheck = await this.checkProvisionLogic(entry, context);
      if (!provisionCheck.isValid) {
        warnings.push(...provisionCheck.warnings);
      }
    }

    return { isValid: true, errors: [], warnings };
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  private checkEntryBalance(entry: JournalEntry): { isBalanced: boolean; difference: number } {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of entry.lines || []) {
      totalDebit += (line as { debit?: number }).debit || 0;
      totalCredit += (line as { credit?: number }).credit || 0;
    }

    const difference = Math.abs(totalDebit - totalCredit);
    return {
      isBalanced: difference < 0.01, // Tolérance de 1 centime
      difference
    };
  }

  private async validateAccountBalances(
    entry: JournalEntry,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    // Vérifier les anomalies de solde par compte
    const balanceChecks = await Promise.all(
      (entry.lines || []).map(async (line, index) => {
        const accountBalance = await this.getAccountBalance((line as { account_number?: string }).account_number || '', context.companyId, new Date(entry.date));

        // Vérifier si le solde devient négatif pour un compte qui ne devrait pas l'être
        if (accountBalance < 0 && this.shouldAccountBePositive((line as { account_number?: string }).account_number || '')) {
          return {
            field: `lines[${index}].account_number`,
            message: `Le compte ${(line as { account_number?: string }).account_number} a un solde négatif inhabituel`,
            severity: 'warning' as const
          };
        }
        return null;
      })
    );

    for (const warning of balanceChecks.filter((w): w is NonNullable<typeof w> => w !== null)) {
      warnings.push(warning);
    }

    return { isValid: true, errors: [], warnings };
  }

  private validateAmounts(entry: JournalEntry): ValidationResult {
    const warnings: Array<{ field: string; message: string; severity: 'warning' | 'info' }> = [];

    for (const line of entry.lines || []) {
      const amount = ((line as { debit?: number }).debit || 0) + ((line as { credit?: number }).credit || 0);

      // Détecter les montants ronds suspects
      if (amount > 1000 && amount % 1000 === 0) {
        warnings.push({
          field: `lines[${entry.lines.indexOf(line)}].amount`,
          message: 'Montant rond détecté - vérifiez la saisie',
          severity: 'info'
        });
      }

      // Détecter les montants très élevés
      if (amount > 100000) {
        warnings.push({
          field: `lines[${entry.lines.indexOf(line)}].amount`,
          message: `Montant très élevé: ${amount}€`,
          severity: 'warning'
        });
      }
    }

    return { isValid: true, errors: [], warnings };
  }

  // Méthodes auxiliaires simplifiées (à implémenter complètement)
  private async validateVATRate(_rate: number, _countryCode: string, _date: Date): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [] };
  }

  private async validateAccountByStandard(_accountNumber: string, _standard: string): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [] };
  }

  private async validateStockMovements(_entry: JournalEntry, _context: ValidationContext): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [] };
  }

  private checkServiceVAT(_entry: JournalEntry): ValidationResult {
    return { isValid: true, errors: [], warnings: [] };
  }

  private async validateProductionCosts(_entry: JournalEntry, _context: ValidationContext): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [] };
  }

  private checkVATBalance(_entry: JournalEntry): { isBalanced: boolean } {
    return { isBalanced: true };
  }

  private async checkAccountBalanceContinuity(_accountNumber: string, _companyId: string, _date: Date): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [] };
  }

  private async checkDepreciationLogic(_entry: JournalEntry, _context: ValidationContext): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [] };
  }

  private async checkProvisionLogic(_entry: JournalEntry, _context: ValidationContext): Promise<ValidationResult> {
    return { isValid: true, errors: [], warnings: [] };
  }

  private async getAccountBalance(_accountNumber: string, _companyId: string, _date: Date): Promise<number> {
    return 0;
  }

  private shouldAccountBePositive(_accountNumber: string): boolean {
    // Comptes qui devraient normalement être positifs
    const positiveAccounts = ['40', '41', '42', '43', '44']; // Fournisseurs, clients, etc.
    return positiveAccounts.some(prefix => _accountNumber.startsWith(prefix));
  }
}

// Export de l'instance singleton
export const advancedBusinessValidationService = AdvancedBusinessValidationService.getInstance();
