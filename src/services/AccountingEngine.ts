// src/services/AccountingEngine.ts
// import { AccountingService } from './accountingService'; // REMOVED: Legacy service
import { IntegratedAccountingService } from './integratedAccountingService';
import { AccountingValidationService } from './accountingValidationService';
import { JournalsService } from './journalsService';
import { ChartOfAccountsService } from './chartOfAccountsService';
import { VATCalculationService } from './vatCalculationService';
import { AutomaticLetterageService } from './automaticLetterageService';
import { EntryTemplatesService } from './entryTemplatesService';
import { AdvancedBusinessValidationService } from './AdvancedBusinessValidationService';
// NOTE: Ces services n'existent pas - fonctionnalités désactivées jusqu'à leur implémentation
// import { AccountingIntegrityService, IntegrityResult } from './AccountingIntegrityService';
// import { AccountingNotificationService } from './AccountingNotificationService';

import { supabase } from '../lib/supabase';

/**
 * Moteur Comptable Central - Point d'entrée unifié pour toutes les opérations comptables
 *
 * Fonctionnalités :
 * - Consolidation de tous les services comptables
 * - Orchestration des workflows comptables
 * - Gestion centralisée des erreurs
 * - Interface unifiée pour l'application
 */
export class AccountingEngine {
  private static instance: AccountingEngine;

  // Services consolidés
  // private accountingService: AccountingService; // REMOVED: Legacy service
  private integratedService: IntegratedAccountingService;
  private validationService: typeof AccountingValidationService;
  private advancedValidationService: AdvancedBusinessValidationService;
  private journalsService: JournalsService;
  private chartOfAccountsService: ChartOfAccountsService;
  private vatService: VATCalculationService;
  private letterageService: AutomaticLetterageService;
  private templatesService: EntryTemplatesService;
  // NOTE: Services désactivés - à implémenter
  // private integrityService: AccountingIntegrityService;
  // private notificationService: AccountingNotificationService;

  private constructor() {
    // this.accountingService = AccountingService.getInstance(); // REMOVED: Legacy service
    this.integratedService = new IntegratedAccountingService();
    this.validationService = AccountingValidationService;
    this.advancedValidationService = AdvancedBusinessValidationService.getInstance();
    this.journalsService = JournalsService.getInstance();
    this.chartOfAccountsService = ChartOfAccountsService.getInstance();
    this.vatService = new VATCalculationService();
    this.letterageService = new AutomaticLetterageService();
    this.templatesService = new EntryTemplatesService();
    // NOTE: Services désactivés - à implémenter
    // this.integrityService = AccountingIntegrityService.getInstance();
    // this.notificationService = AccountingNotificationService.getInstance();
  }

  static getInstance(): AccountingEngine {
    if (!AccountingEngine.instance) {
      AccountingEngine.instance = new AccountingEngine();
    }
    return AccountingEngine.instance;
  }

  // ============================================================================
  // INITIALISATION ET CONFIGURATION
  // ============================================================================

  /**
   * Initialise le moteur comptable pour une entreprise
   */
  async initializeForCompany(companyId: string): Promise<{
    success: boolean;
    initialized: string[];
    errors: string[];
  }> {
    const result = {
      success: true,
      initialized: [] as string[],
      errors: [] as string[]
    };

    try {
      // 1. Vérifier la configuration de l'entreprise
      const company = await this.getCompanyConfig(companyId);
      if (!company) {
        throw new Error(`Entreprise ${companyId} non trouvée`);
      }

      // 2. Initialiser le plan comptable selon le pays
      await this.initializeChartOfAccounts(companyId, company.country_code);
      result.initialized.push('chart_of_accounts');

      // 3. Créer les journaux par défaut
      await this.initializeJournals(companyId);
      result.initialized.push('journals');

      // 4. Créer les templates d'écritures par défaut
      await this.initializeEntryTemplates(companyId);
      result.initialized.push('entry_templates');

      // 5. Configurer les règles TVA par défaut
      await this.initializeVATRules(companyId, company.country_code);
      result.initialized.push('vat_rules');

    } catch (error: unknown) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      result.errors.push(errorMessage);
    }

    return result;
  }

  // ============================================================================
  // ACCÈS AUX SERVICES INDIVIDUELS
  // ============================================================================

  /**
   * Accès au service de comptabilité de base
   * @deprecated Legacy service removed. Use ChartOfAccountsService instead.
   */
  // getAccountingService(): AccountingService {
  //   return this.accountingService;
  // }

  /**
   * Accès au service d'import/export intégré
   */
  getIntegratedService(): IntegratedAccountingService {
    return this.integratedService;
  }

  /**
   * Accès au service de validation
   */
  getValidationService(): typeof AccountingValidationService {
    return this.validationService;
  }

  /**
   * Accès au service de validation avancée
   */
  getAdvancedValidationService(): AdvancedBusinessValidationService {
    return this.advancedValidationService;
  }

  /**
   * Accès au service des journaux
   */
  getJournalsService(): JournalsService {
    return this.journalsService;
  }

  /**
   * Accès au service du plan comptable
   */
  getChartOfAccountsService(): ChartOfAccountsService {
    return this.chartOfAccountsService;
  }

  /**
   * Accès au service de calcul TVA
   */
  getVATService(): VATCalculationService {
    return this.vatService;
  }

  /**
   * Accès au service de lettrage automatique
   */
  getLetterageService(): AutomaticLetterageService {
    return this.letterageService;
  }

  /**
   * Accès au service de templates d'écritures
   */
  getTemplatesService(): EntryTemplatesService {
    return this.templatesService;
  }

  // NOTE: Méthodes désactivées - services non implémentés
  /**
   * Accès au service d'intégrité comptable
   * DÉSACTIVÉ: Service AccountingIntegrityService non implémenté
   */
  // getIntegrityService(): AccountingIntegrityService {
  //   return this.integrityService;
  // }

  /**
   * Accès au service de notifications comptables
   * DÉSACTIVÉ: Service AccountingNotificationService non implémenté
   */
  // getNotificationService(): AccountingNotificationService {
  //   return this.notificationService;
  // }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  private async getCompanyConfig(companyId: string) {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    return data;
  }

  private async initializeChartOfAccounts(companyId: string, countryCode: string): Promise<void> {
    await supabase.rpc('initialize_company_chart_of_accounts', {
      p_company_id: companyId,
      p_country_code: countryCode
    });
  }

  private async initializeJournals(companyId: string): Promise<void> {
    await supabase.rpc('create_default_journals', {
      p_company_id: companyId
    });
  }

  private async initializeEntryTemplates(_companyId: string): Promise<void> {
    // Implémentation des templates d'écritures par défaut
  }

  private async initializeVATRules(_companyId: string, _countryCode: string): Promise<void> {
    // Implémentation des règles TVA par défaut
  }

  // NOTE: Méthodes désactivées - services AccountingIntegrityService et AccountingNotificationService non implémentés
  /**
   * Effectue tous les contrôles d'intégrité et envoie des notifications si nécessaire
   * DÉSACTIVÉ: Requiert AccountingIntegrityService et AccountingNotificationService
   */
  /*
  async performIntegrityChecks(companyId: string): Promise<{
    passed: boolean;
    results: IntegrityResult[];
    notifications: string[];
  }> {
    const report = await this.integrityService.runIntegrityChecks(companyId);
    const notifications: string[] = [];

    for (const result of report.checks) {
      if (result.status !== 'passed') {
        const _severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
          'critical': 'critical',
          'major': 'high',
          'minor': 'medium',
          'info': 'low'
        };

        const severity: 'low' | 'medium' | 'high' | 'critical' = result.status === 'failed' ? 'high' : 'medium';

        const notificationId = await this.notificationService.sendIntegrityFailure(
          companyId,
          result.checkName,
          severity,
          result.recommendations?.join(', ') || 'Vérifier les données',
          result.details
        );
        notifications.push(notificationId);
      }
    }

    return {
      passed: report.checks.every((r: {status: string}) => r.status === 'passed'),
      results: report.checks,
      notifications
    };
  }
  */

  /**
   * Valide une transaction avec toutes les règles métier et envoie des notifications
   * DÉSACTIVÉ: Requiert AccountingNotificationService
   */
  /*
  async validateTransactionWithNotifications(
    companyId: string,
    transaction: Record<string, unknown>,
    sector: string
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    notifications: string[];
  }> {
    const validation = await this.advancedValidationService.validateBusinessRules(transaction, {
      sector,
      companyId,
      countryCode: 'FR',
      fiscalYearStart: new Date(),
      entryDate: new Date((transaction.date as string | number) || Date.now()),
      journalType: (transaction.journalType as string) || 'general'
    });
    const notifications: string[] = [];

    for (const error of validation.errors) {
      const notificationId = await this.notificationService.sendValidationError(
        companyId,
        'Erreur de validation de transaction',
        error.message,
        { transaction, sector, field: error.field },
        ['Corriger les données de la transaction', 'Revalider la transaction']
      );
      notifications.push(notificationId);
    }

    for (const warning of validation.warnings) {
      const notificationId = await this.notificationService.sendBusinessRuleWarning(
        companyId,
        warning.message,
        transaction.amount || 'N/A',
        sector,
        ['Vérifier la conformité de la transaction', 'Consulter les règles métier']
      );
      notifications.push(notificationId);
    }

    return {
      valid: validation.isValid,
      errors: validation.errors.map((e: {message: string}) => e.message),
      warnings: validation.warnings.map((w: {message: string}) => w.message),
      notifications
    };
  }
  */

  /**
   * Effectue une clôture de période avec vérifications d'intégrité
   * DÉSACTIVÉ: Requiert AccountingIntegrityService et AccountingNotificationService
   */
  /*
  async closePeriodWithIntegrityChecks(
    companyId: string,
    period: string
  ): Promise<{
    success: boolean;
    integrityPassed: boolean;
    notifications: string[];
  }> {
    const integrityCheck = await this.performIntegrityChecks(companyId);

    if (!integrityCheck.passed) {
      return {
        success: false,
        integrityPassed: false,
        notifications: integrityCheck.notifications
      };
    }

    try {
      return {
        success: false,
        integrityPassed: true,
        notifications: [...integrityCheck.notifications, 'Period closing not implemented']
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorNotificationId = await this.notificationService.sendValidationError(
        companyId,
        'Échec de clôture de période',
        `Erreur lors de la clôture de la période ${period}: ${errorMessage}`,
        { period, error: errorMessage },
        ['Vérifier les données de la période', 'Contacter le support technique']
      );

      return {
        success: false,
        integrityPassed: true,
        notifications: [...integrityCheck.notifications, errorNotificationId]
      };
    }
  }
  */
}

// Export de l'instance singleton
export const accountingEngine = AccountingEngine.getInstance();
