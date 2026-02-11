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

/**
 * Service de validation comptable SYSCOHADA (17 pays OHADA)
 * Vérifie conformité règles comptables zone FCFA
 *
 * @module syscohadaValidationService
 * @priority P0 - Compliance critique pour marché africain
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getFiscalYearDatesForCompany } from './fiscalYearHelpers';

/**
 * Erreur de validation SYSCOHADA
 */
export interface SyscohadaValidationError {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  affected_account?: string;
  affected_entry?: string;
  suggestion?: string;
  article_reference?: string; // Référence article SYSCOHADA
}

/**
 * Résultat de validation globale
 */
export interface ValidationResult {
  is_valid: boolean;
  total_errors: number;
  total_warnings: number;
  errors: SyscohadaValidationError[];
  checked_at: string;
  compliance_score: number; // 0-100
}

/**
 * Statistiques TAFIRE (Tableau de flux de trésorerie)
 */
export interface TAFIREStats {
  activites_exploitation: number;
  activites_investissement: number;
  activites_financement: number;
  variation_tresorerie: number;
  tresorerie_debut: number;
  tresorerie_fin: number;
  is_balanced: boolean;
}

/**
 * Service de validation SYSCOHADA
 */
class SyscohadaValidationService {
  /**
   * Plan comptable SYSCOHADA (8 classes)
   */
  private readonly SYSCOHADA_CLASSES: Record<string, string> = {
    '1': 'Comptes de ressources durables',
    '2': 'Comptes d\'actif immobilisé',
    '3': 'Comptes de stocks',
    '4': 'Comptes de tiers',
    '5': 'Comptes de trésorerie',
    '6': 'Comptes de charges des activités ordinaires',
    '7': 'Comptes de produits des activités ordinaires',
    '8': 'Comptes des autres charges et produits (HAO)'
  };

  /**
   * Validation complète SYSCOHADA pour une entreprise
   *
   * @param companyId - ID de l'entreprise
   * @param fiscalYear - Exercice fiscal (optionnel, défaut: année courante)
   * @returns Résultat de validation avec liste d'erreurs
   */
  async validateCompany(companyId: string, fiscalYear?: number): Promise<ValidationResult> {
    logger.info('SyscohadaValidation', `Validation SYSCOHADA pour entreprise ${companyId}`);

    const errors: SyscohadaValidationError[] = [];
    const year = fiscalYear || new Date().getFullYear();

    try {
      // 1. Vérifier plan comptable conforme
      const chartErrors = await this.validateChartOfAccounts(companyId);
      errors.push(...chartErrors);

      // 2. Vérifier séparation HAO (Hors Activités Ordinaires)
      const haoErrors = await this.validateHAO(companyId, year);
      errors.push(...haoErrors);

      // 3. Vérifier cohérence TAFIRE
      const tafireErrors = await this.validateTAFIRE(companyId, year);
      errors.push(...tafireErrors);

      // 4. Vérifier balances (équilibre débit/crédit)
      const balanceErrors = await this.validateBalances(companyId, year);
      errors.push(...balanceErrors);

      // 5. Vérifier comptes obligatoires
      const mandatoryErrors = await this.validateMandatoryAccounts(companyId);
      errors.push(...mandatoryErrors);

      // Calculer score de conformité
      const totalErrors = errors.filter(e => e.severity === 'error').length;
      const totalWarnings = errors.filter(e => e.severity === 'warning').length;
      const complianceScore = this.calculateComplianceScore(totalErrors, totalWarnings);

      const result: ValidationResult = {
        is_valid: totalErrors === 0,
        total_errors: totalErrors,
        total_warnings: totalWarnings,
        errors: errors,
        checked_at: new Date().toISOString(),
        compliance_score: complianceScore
      };

      logger.info('SyscohadaValidation', `Validation terminée: ${totalErrors} erreurs, ${totalWarnings} avertissements`);
      return result;

    } catch (error) {
      logger.error('SyscohadaValidation', 'Erreur validateCompany:', error);
      errors.push({
        code: 'VALIDATION_ERROR',
        severity: 'error',
        message: 'Erreur système lors de la validation',
        suggestion: 'Veuillez contacter le support technique'
      });

      return {
        is_valid: false,
        total_errors: 1,
        total_warnings: 0,
        errors: errors,
        checked_at: new Date().toISOString(),
        compliance_score: 0
      };
    }
  }

  /**
   * Valide plan comptable conforme SYSCOHADA (8 classes)
   */
  async validateChartOfAccounts(companyId: string): Promise<SyscohadaValidationError[]> {
    const errors: SyscohadaValidationError[] = [];

    try {
      const { data: accounts, error } = await supabase
        .from('chart_of_accounts')
        .select('account_number, account_name, account_type')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error || !accounts) {
        errors.push({
          code: 'CHART_NOT_FOUND',
          severity: 'error',
          message: 'Plan comptable non trouvé',
          suggestion: 'Créer le plan comptable SYSCOHADA'
        });
        return errors;
      }

      // Vérifier que tous les comptes commencent par 1-8
      for (const account of accounts) {
        const firstDigit = account.account_number[0];
        if (!/^[1-8]/.test(account.account_number)) {
          errors.push({
            code: 'INVALID_ACCOUNT_CLASS',
            severity: 'error',
            message: `Compte ${account.account_number} invalide: doit commencer par 1-8`,
            affected_account: account.account_number,
            suggestion: 'Utiliser uniquement classes 1 à 8 SYSCOHADA',
            article_reference: 'Plan comptable SYSCOHADA art. 31'
          });
        }

        // Vérifier longueur (SYSCOHADA: min 2 chiffres, max 6)
        if (account.account_number.length < 2 || account.account_number.length > 6) {
          errors.push({
            code: 'INVALID_ACCOUNT_LENGTH',
            severity: 'warning',
            message: `Compte ${account.account_number}: longueur incorrecte`,
            affected_account: account.account_number,
            suggestion: 'Longueur recommandée: 2 à 6 chiffres'
          });
        }
      }

      // Vérifier présence des classes obligatoires
      const presentClasses = new Set(accounts.map(a => a.account_number[0]));
      for (const requiredClass of ['1', '2', '4', '5', '6', '7']) {
        if (!presentClasses.has(requiredClass)) {
          errors.push({
            code: 'MISSING_MANDATORY_CLASS',
            severity: 'warning',
            message: `Classe ${requiredClass} manquante: ${(this.SYSCOHADA_CLASSES as Record<string, string>)[requiredClass]}`,
            suggestion: `Créer au moins un compte de classe ${requiredClass}`
          });
        }
      }

    } catch (error) {
      logger.error('SyscohadaValidation', 'Erreur validateChartOfAccounts:', error);
    }

    return errors;
  }

  /**
   * Valide séparation HAO (Comptes 8x - Hors Activités Ordinaires)
   * Règle SYSCOHADA: charges/produits exceptionnels doivent être en classe 8
   */
  async validateHAO(companyId: string, fiscalYear: number): Promise<SyscohadaValidationError[]> {
    const errors: SyscohadaValidationError[] = [];

    try {
      // Récupérer écritures de l'exercice
      const startDate = `${fiscalYear}-01-01`;
      const endDate = `${fiscalYear}-12-31`;

      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_number,
          description,
          journal_entry_lines(
            account_number,
            debit,
            credit
          )
        `)
        .eq('company_id', companyId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (error || !entries) {
        return errors;
      }

      // Analyser écritures pour détecter HAO non correctement classées
      const haoKeywords = [
        'exceptionnel',
        'cession',
        'plus-value',
        'moins-value',
        'pénalité',
        'amendes',
        'dons',
        'subvention exceptionnelle'
      ];

      for (const entry of entries) {
        const description = entry.description?.toLowerCase() || '';
        const isLikelyHAO = haoKeywords.some(keyword => description.includes(keyword));

        if (isLikelyHAO) {
          // Vérifier si écritures utilisent classe 8
          const lines = entry.journal_entry_lines as any[];
          const hasClass8 = lines?.some(line => line.account_number?.startsWith('8'));
          const hasClass6or7 = lines?.some(line =>
            line.account_number?.startsWith('6') || line.account_number?.startsWith('7')
          );

          if (hasClass6or7 && !hasClass8) {
            errors.push({
              code: 'HAO_NOT_IN_CLASS_8',
              severity: 'warning',
              message: `Écriture ${entry.entry_number} semble être HAO mais n'utilise pas classe 8`,
              affected_entry: entry.entry_number,
              suggestion: 'Utiliser comptes 81x (charges HAO) ou 82x (produits HAO)',
              article_reference: 'SYSCOHADA art. 51 - Hors Activités Ordinaires'
            });
          }
        }
      }

      // Vérifier équilibre classe 8 (charges HAO ≈ produits HAO)
      const { data: class8Balance } = await supabase
        .from('journal_entry_lines')
        .select('account_number, debit, credit')
        .eq('company_id', companyId)
        .like('account_number', '8%');

      if (class8Balance && class8Balance.length > 0) {
        let totalChargesHAO = 0;
        let totalProduitsHAO = 0;

        for (const line of class8Balance) {
          if (line.account_number.startsWith('81')) {
            totalChargesHAO += line.debit - line.credit;
          } else if (line.account_number.startsWith('82')) {
            totalProduitsHAO += line.credit - line.debit;
          }
        }

        const resultHAO = totalProduitsHAO - totalChargesHAO;

        // Info: montrer résultat HAO (doit être proche de 0 pour entreprises normales)
        errors.push({
          code: 'HAO_RESULT_INFO',
          severity: 'info',
          message: `Résultat HAO: ${resultHAO.toFixed(2)} FCFA (Produits HAO: ${totalProduitsHAO.toFixed(2)}, Charges HAO: ${totalChargesHAO.toFixed(2)})`,
          suggestion: resultHAO < 0 ? 'Charges HAO supérieures aux produits HAO' : 'Résultat HAO positif',
          article_reference: 'SYSCOHADA - Compte de résultat détaillé'
        });
      }

    } catch (error) {
      logger.error('SyscohadaValidation', 'Erreur validateHAO:', error);
    }

    return errors;
  }

  /**
   * Valide cohérence TAFIRE (Tableau de flux de trésorerie SYSCOHADA)
   * Équation: Trésorerie fin = Trésorerie début + Var. Exploitation + Var. Investissement + Var. Financement
   */
  async validateTAFIRE(companyId: string, fiscalYear: number): Promise<SyscohadaValidationError[]> {
    const errors: SyscohadaValidationError[] = [];

    try {
      const tafireStats = await this.calculateTAFIREStats(companyId, fiscalYear);

      // Vérifier équilibre TAFIRE
      const calculatedTresorerieFin =
        tafireStats.tresorerie_debut +
        tafireStats.activites_exploitation +
        tafireStats.activites_investissement +
        tafireStats.activites_financement;

      const difference = Math.abs(calculatedTresorerieFin - tafireStats.tresorerie_fin);

      if (difference > 1.0) {
        errors.push({
          code: 'TAFIRE_UNBALANCED',
          severity: 'error',
          message: `TAFIRE déséquilibré: écart de ${difference.toFixed(2)} FCFA`,
          suggestion: 'Vérifier flux de trésorerie et soldes bancaires',
          article_reference: 'SYSCOHADA - TAFIRE art. 28'
        });
      }

      // Vérifier variation trésorerie cohérente
      const expectedVariation =
        tafireStats.activites_exploitation +
        tafireStats.activites_investissement +
        tafireStats.activites_financement;

      if (Math.abs(tafireStats.variation_tresorerie - expectedVariation) > 1.0) {
        errors.push({
          code: 'TAFIRE_VARIATION_INCONSISTENT',
          severity: 'warning',
          message: 'Variation trésorerie incohérente avec somme des flux',
          suggestion: 'Revoir calcul flux exploitation/investissement/financement'
        });
      }

      // Info: afficher statistiques TAFIRE
      errors.push({
        code: 'TAFIRE_STATS',
        severity: 'info',
        message: `TAFIRE ${fiscalYear}: Exploitation: ${tafireStats.activites_exploitation.toFixed(2)}, Investissement: ${tafireStats.activites_investissement.toFixed(2)}, Financement: ${tafireStats.activites_financement.toFixed(2)}`,
        suggestion: tafireStats.is_balanced ? 'TAFIRE équilibré ✓' : 'TAFIRE déséquilibré'
      });

    } catch (error) {
      logger.error('SyscohadaValidation', 'Erreur validateTAFIRE:', error);
      errors.push({
        code: 'TAFIRE_ERROR',
        severity: 'warning',
        message: 'Impossible de valider TAFIRE',
        suggestion: 'Vérifier disponibilité des données de trésorerie'
      });
    }

    return errors;
  }

  /**
   * Calcule statistiques TAFIRE complètes (Tableau Flux Trésorerie SYSCOHADA)
   *
   * TAFIRE = 3 sections:
   * 1. Flux exploitation (résultat net + ajustements + Δ BFR)
   * 2. Flux investissement (acquisitions/cessions immobilisations)
   * 3. Flux financement (capital, emprunts, dividendes)
   *
   * Formule: Tréso fin = Tréso début + Flux exploitation + Flux invest + Flux finance
   *
   * @public - Exposé pour génération rapports TAFIRE
   */
  async calculateTAFIREStats(companyId: string, fiscalYear: number): Promise<TAFIREStats> {
    // ✅ DATES FISCALES DYNAMIQUES (plus de hardcodé 01-01 / 31-12)
    const fiscalYearDates = await getFiscalYearDatesForCompany(companyId, fiscalYear);
    const previousYearDates = await getFiscalYearDatesForCompany(companyId, fiscalYear - 1);

    const startDate = fiscalYearDates.startDate;
    const endDate = fiscalYearDates.endDate;
    const previousYearEnd = previousYearDates.endDate;

    try {
      // Récupérer toutes les lignes d'écritures de l'exercice
      const { data: lines, error } = await supabase
        .from('journal_entries')
        .select(`
          entry_date,
          journal_entry_lines (
            account_number,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .in('status', ['posted', 'validated', 'imported'])
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (error || !lines) {
        throw new Error('Impossible de récupérer les écritures');
      }

      // Aplatir les lignes
      const flatLines: Array<{ account_number: string; debit: number; credit: number }> = [];
      lines.forEach((entry: any) => {
        entry.journal_entry_lines?.forEach((line: any) => {
          flatLines.push({
            account_number: line.account_number,
            debit: line.debit_amount || 0,
            credit: line.credit_amount || 0
          });
        });
      });

      // === 1. FLUX DE TRÉSORERIE LIÉS AUX ACTIVITÉS D'EXPLOITATION ===

      // 1.1 Résultat net (Produits classe 7 - Charges classe 6)
      let produits = 0;
      let charges = 0;
      flatLines.forEach(line => {
        if (line.account_number.startsWith('7')) {
          produits += line.credit - line.debit;
        } else if (line.account_number.startsWith('6')) {
          charges += line.debit - line.credit;
        }
      });
      const resultatNet = produits - charges;

      // 1.2 Ajustements (éléments sans décaissement)
      // Amortissements (comptes 68x) et Provisions (comptes 69x)
      let amortissements = 0;
      let provisions = 0;
      flatLines.forEach(line => {
        if (line.account_number.startsWith('68')) {
          amortissements += line.debit - line.credit;
        } else if (line.account_number.startsWith('69')) {
          provisions += line.debit - line.credit;
        }
      });

      // 1.3 Variation BFR (Besoin en Fonds de Roulement)
      // Δ BFR = Δ Stocks + Δ Créances clients - Δ Dettes fournisseurs
      const variationBFR = await this.calculateVariationBFR(companyId, fiscalYear);

      const fluxExploitation = resultatNet + amortissements + provisions - variationBFR;

      // === 2. FLUX DE TRÉSORERIE LIÉS AUX ACTIVITÉS D'INVESTISSEMENT ===

      // Acquisitions immobilisations (augmentation comptes 2x au débit)
      // Cessions immobilisations (diminution comptes 2x au crédit)
      let acquisitionsImmob = 0;
      let cessionsImmob = 0;
      flatLines.forEach(line => {
        if (line.account_number.startsWith('2') && !line.account_number.startsWith('28')) {
          // Classe 2 sauf 28 (amortissements)
          acquisitionsImmob += line.debit;
          cessionsImmob += line.credit;
        }
      });

      const fluxInvestissement = cessionsImmob - acquisitionsImmob;

      // === 3. FLUX DE TRÉSORERIE LIÉS AUX ACTIVITÉS DE FINANCEMENT ===

      // Augmentation capital (crédit comptes 10x)
      // Emprunts (crédit comptes 16x, 17x)
      // Remboursements emprunts (débit comptes 16x, 17x)
      // Dividendes versés (débit compte 46x ou 12x)
      let augmentationCapital = 0;
      let nouveauxEmprunts = 0;
      let remboursementsEmprunts = 0;
      let dividendesVerses = 0;

      flatLines.forEach(line => {
        if (line.account_number.startsWith('10')) {
          // Capital
          augmentationCapital += line.credit - line.debit;
        } else if (line.account_number.startsWith('16') || line.account_number.startsWith('17')) {
          // Emprunts et dettes financières
          nouveauxEmprunts += line.credit;
          remboursementsEmprunts += line.debit;
        } else if (line.account_number === '457' || line.account_number.startsWith('121')) {
          // Dividendes à payer ou résultat distribué
          dividendesVerses += line.debit - line.credit;
        }
      });

      const fluxFinancement = augmentationCapital + nouveauxEmprunts - remboursementsEmprunts - dividendesVerses;

      // === 4. CALCUL TRÉSORERIE DÉBUT ET FIN ===

      // Trésorerie fin exercice N (comptes 5x - banques, caisses)
      const tresorerieFin = await this.calculateTresorerie(companyId, endDate);

      // Trésorerie début exercice N = Trésorerie fin exercice N-1
      const tresorerieDebut = await this.calculateTresorerie(companyId, previousYearEnd);

      // Variation trésorerie calculée
      const variationTresorerie = fluxExploitation + fluxInvestissement + fluxFinancement;

      // Variation trésorerie réelle
      const variationReelle = tresorerieFin - tresorerieDebut;

      // Vérifier équilibre (tolérance 1 FCFA)
      const isBalanced = Math.abs(variationTresorerie - variationReelle) < 1.0;

      return {
        activites_exploitation: fluxExploitation,
        activites_investissement: fluxInvestissement,
        activites_financement: fluxFinancement,
        variation_tresorerie: variationReelle,
        tresorerie_debut: tresorerieDebut,
        tresorerie_fin: tresorerieFin,
        is_balanced: isBalanced
      };

    } catch (error) {
      logger.error('SyscohadaValidation', 'Erreur calculateTAFIREStats:', error);

      // Retourner structure vide en cas d'erreur
      return {
        activites_exploitation: 0,
        activites_investissement: 0,
        activites_financement: 0,
        variation_tresorerie: 0,
        tresorerie_debut: 0,
        tresorerie_fin: 0,
        is_balanced: false
      };
    }
  }

  /**
   * Calcule variation BFR (Besoin en Fonds de Roulement)
   * Δ BFR = (Stocks + Créances clients - Dettes fournisseurs)(N) - (Stocks + Créances - Dettes)(N-1)
   */
  private async calculateVariationBFR(companyId: string, fiscalYear: number): Promise<number> {
    try {
      // ✅ DATES FISCALES DYNAMIQUES
      const fiscalYearDatesN = await getFiscalYearDatesForCompany(companyId, fiscalYear);
      const fiscalYearDatesN1 = await getFiscalYearDatesForCompany(companyId, fiscalYear - 1);

      const endDateN = fiscalYearDatesN.endDate;
      const endDateN1 = fiscalYearDatesN1.endDate;

      const bfrN = await this.calculateBFR(companyId, endDateN);
      const bfrN1 = await this.calculateBFR(companyId, endDateN1);

      return bfrN - bfrN1;
    } catch (error) {
      logger.error('SyscohadaValidation', 'Erreur calculateVariationBFR:', error);
      return 0;
    }
  }

  /**
   * Calcule BFR à une date donnée
   * BFR = Stocks (3x) + Créances clients (41x) - Dettes fournisseurs (40x)
   */
  private async calculateBFR(companyId: string, asOfDate: string): Promise<number> {
    try {
      const { data: lines } = await supabase
        .from('journal_entries')
        .select(`
          journal_entry_lines (
            account_number,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .in('status', ['posted', 'validated', 'imported'])
        .lte('entry_date', asOfDate);

      if (!lines) return 0;

      let stocks = 0;
      let creancesClients = 0;
      let dettesFournisseurs = 0;

      lines.forEach((entry: any) => {
        entry.journal_entry_lines?.forEach((line: any) => {
          const accountNumber = line.account_number;
          const solde = (line.debit_amount || 0) - (line.credit_amount || 0);

          if (accountNumber.startsWith('3')) {
            // Stocks
            stocks += solde;
          } else if (accountNumber.startsWith('41')) {
            // Créances clients
            creancesClients += solde;
          } else if (accountNumber.startsWith('40')) {
            // Dettes fournisseurs (solde créditeur = dette)
            dettesFournisseurs += Math.abs(Math.min(0, solde));
          }
        });
      });

      return stocks + creancesClients - dettesFournisseurs;

    } catch (error) {
      logger.error('SyscohadaValidation', 'Erreur calculateBFR:', error);
      return 0;
    }
  }

  /**
   * Calcule trésorerie à une date donnée
   * Trésorerie = Comptes 5x (Banques, Caisses, Valeurs mobilières)
   */
  private async calculateTresorerie(companyId: string, asOfDate: string): Promise<number> {
    try {
      const { data: lines } = await supabase
        .from('journal_entries')
        .select(`
          journal_entry_lines (
            account_number,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .in('status', ['posted', 'validated', 'imported'])
        .lte('entry_date', asOfDate);

      if (!lines) return 0;

      let tresorerie = 0;

      lines.forEach((entry: any) => {
        entry.journal_entry_lines?.forEach((line: any) => {
          if (line.account_number?.startsWith('5')) {
            tresorerie += (line.debit_amount || 0) - (line.credit_amount || 0);
          }
        });
      });

      return tresorerie;

    } catch (error) {
      logger.error('SyscohadaValidation', 'Erreur calculateTresorerie:', error);
      return 0;
    }
  }

  /**
   * Valide équilibre balances (débit = crédit)
   */
  private async validateBalances(companyId: string, fiscalYear: number): Promise<SyscohadaValidationError[]> {
    const errors: SyscohadaValidationError[] = [];

    try {
      const startDate = `${fiscalYear}-01-01`;
      const endDate = `${fiscalYear}-12-31`;

      const { data: lines, error } = await supabase
        .from('journal_entry_lines')
        .select('debit, credit')
        .eq('company_id', companyId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error || !lines) return errors;

      let totalDebit = 0;
      let totalCredit = 0;

      for (const line of lines) {
        totalDebit += line.debit || 0;
        totalCredit += line.credit || 0;
      }

      const difference = Math.abs(totalDebit - totalCredit);

      if (difference > 0.01) {
        errors.push({
          code: 'BALANCE_UNBALANCED',
          severity: 'error',
          message: `Balance déséquilibrée: Débit ${totalDebit.toFixed(2)} ≠ Crédit ${totalCredit.toFixed(2)} (écart: ${difference.toFixed(2)})`,
          suggestion: 'Vérifier écritures comptables et corriger déséquilibre',
          article_reference: 'Principe comptable fondamental: Partie double'
        });
      }

    } catch (error) {
      logger.error('SyscohadaValidation', 'Erreur validateBalances:', error);
    }

    return errors;
  }

  /**
   * Valide présence comptes obligatoires SYSCOHADA
   */
  private async validateMandatoryAccounts(companyId: string): Promise<SyscohadaValidationError[]> {
    const errors: SyscohadaValidationError[] = [];

    try {
      const { data: accounts } = await supabase
        .from('chart_of_accounts')
        .select('account_number')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (!accounts) return errors;

      const accountNumbers = new Set(accounts.map(a => a.account_number));

      // Comptes obligatoires SYSCOHADA (sélection)
      const mandatoryAccounts = [
        { code: '101', name: 'Capital social' },
        { code: '121', name: 'Résultat net' },
        { code: '401', name: 'Fournisseurs' },
        { code: '411', name: 'Clients' },
        { code: '512', name: 'Banques' },
        { code: '521', name: 'Caisse' },
        { code: '601', name: 'Achats de marchandises' },
        { code: '701', name: 'Ventes de marchandises' }
      ];

      for (const mandatory of mandatoryAccounts) {
        const exists = Array.from(accountNumbers).some(acc => acc.startsWith(mandatory.code));
        if (!exists) {
          errors.push({
            code: 'MISSING_MANDATORY_ACCOUNT',
            severity: 'warning',
            message: `Compte obligatoire manquant: ${mandatory.code} - ${mandatory.name}`,
            affected_account: mandatory.code,
            suggestion: `Créer compte ${mandatory.code} dans le plan comptable`
          });
        }
      }

    } catch (error) {
      logger.error('SyscohadaValidation', 'Erreur validateMandatoryAccounts:', error);
    }

    return errors;
  }

  /**
   * Calcule score de conformité (0-100)
   */
  private calculateComplianceScore(errors: number, warnings: number): number {
    // Formule: 100 - (erreurs * 20) - (warnings * 5)
    // Max pénalité: 100 points
    const penalty = Math.min(100, errors * 20 + warnings * 5);
    return Math.max(0, 100 - penalty);
  }
}

// Export singleton
export const syscohadaValidationService = new SyscohadaValidationService();
export default syscohadaValidationService;
