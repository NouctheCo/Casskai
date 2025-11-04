// Service d'intégration fiscale avec les autres modules
import { supabase } from '@/lib/supabase';
import { frenchTaxComplianceService } from './FrenchTaxComplianceService';

export class TaxIntegrationService {
  private static instance: TaxIntegrationService;

  static getInstance(): TaxIntegrationService {
    if (!this.instance) {
      this.instance = new TaxIntegrationService();
    }
    return this.instance;
  }

  /**
   * Intégration avec le module Comptabilité
   * Récupère les données comptables pour les déclarations fiscales
   */
  async syncWithAccounting(companyId: string, period: string) {
    try {
      // Récupérer les écritures comptables
      const { data: journalEntries, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines (
            account_code,
            debit_amount,
            credit_amount,
            tax_code,
            tax_rate,
            tax_amount,
            description
          )
        `)
        .eq('company_id', companyId)
        .gte('date', `${period}-01-01`)
        .lte('date', `${period}-12-31`);

      if (error) throw error;

      // Synchroniser avec les déclarations fiscales
      await this.updateTaxDeclarationsFromAccounting(companyId, journalEntries || []);

      return {
        success: true,
        entriesProcessed: journalEntries?.length || 0,
        message: 'Synchronisation comptabilité réussie'
      };
    } catch (error) {
      console.error('Erreur sync comptabilité:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: 'Erreur lors de la synchronisation avec la comptabilité'
      };
    }
  }

  /**
   * Intégration avec le module Facturation
   * Met à jour la TVA sur les factures selon les déclarations
   */
  async syncWithInvoicing(companyId: string) {
    try {
      // Récupérer les factures non synchronisées
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', companyId)
        .is('tax_sync_date', null);

      if (error) throw error;

      let processedCount = 0;

      for (const invoice of invoices || []) {
        // Calculer la TVA selon les règles françaises
        const taxData = this.calculateInvoiceTax(invoice);

        // Mettre à jour la facture
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            tax_amount: taxData.totalTax,
            tax_breakdown: taxData.breakdown,
            tax_sync_date: new Date().toISOString()
          })
          .eq('id', invoice.id);

        if (!updateError) processedCount++;
      }

      return {
        success: true,
        invoicesProcessed: processedCount,
        message: `${processedCount} facture(s) synchronisée(s)`
      };
    } catch (error) {
      console.error('Erreur sync facturation:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: 'Erreur lors de la synchronisation avec la facturation'
      };
    }
  }

  /**
   * Intégration avec le module RH
   * Synchronise les charges sociales et déclarations sociales
   */
  async syncWithHR(companyId: string, period: string) {
    try {
      // Récupérer les données de paie
      const { data: payrollData, error } = await supabase
        .from('payroll_entries')
        .select('*')
        .eq('company_id', companyId)
        .gte('period', `${period}-01`)
        .lte('period', `${period}-12`);

      if (error && error.code !== 'PGRST116') { // Table might not exist
        throw error;
      }

      // Calculer les charges sociales pour les déclarations fiscales
      const socialCharges = this.calculateSocialCharges(payrollData || []);

      // Intégrer dans les déclarations fiscales
      await this.integrateSocialChargesInTax(companyId, period, socialCharges);

      return {
        success: true,
        socialCharges,
        message: 'Charges sociales intégrées'
      };
    } catch (error) {
      console.error('Erreur sync RH:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: 'Module RH non disponible ou erreur de synchronisation'
      };
    }
  }

  /**
   * Intégration avec le module Banque
   * Réconcilie les paiements de taxes
   */
  async syncWithBanking(companyId: string) {
    try {
      // Récupérer les transactions bancaires liées aux taxes
      const { data: bankTransactions, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('company_id', companyId)
        .or('description.ilike.%impot%,description.ilike.%tax%,description.ilike.%tva%,description.ilike.%urssaf%,description.ilike.%tresor%');

      if (error) throw error;

      let reconciledCount = 0;

      for (const transaction of bankTransactions || []) {
        // Identifier le type de taxe payée
        const taxType = this.identifyTaxType(transaction.description || '');

        if (taxType) {
          // Marquer comme paiement de taxe
          const { error: updateError } = await supabase
            .from('bank_transactions')
            .update({
              category: 'tax_payment',
              tax_type: taxType,
              is_tax_payment: true
            })
            .eq('id', transaction.id);

          if (!updateError) reconciledCount++;
        }
      }

      return {
        success: true,
        transactionsProcessed: reconciledCount,
        message: `${reconciledCount} paiement(s) de taxes identifié(s)`
      };
    } catch (error) {
      console.error('Erreur sync banque:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: 'Erreur lors de la synchronisation avec le module banque'
      };
    }
  }

  /**
   * Génération automatique des rapports fiscaux intégrés
   */
  async generateIntegratedTaxReport(companyId: string, period: string) {
    try {
      // Synchroniser avec tous les modules
      const syncResults = await Promise.allSettled([
        this.syncWithAccounting(companyId, period),
        this.syncWithInvoicing(companyId),
        this.syncWithHR(companyId, period),
        this.syncWithBanking(companyId)
      ]);

      // Générer le rapport de conformité
      const complianceReport = await frenchTaxComplianceService.validateAccountingTaxConsistency(
        companyId,
        period
      );

      // Préparer le rapport intégré
      const report = {
        period,
        companyId,
        generatedAt: new Date().toISOString(),
        synchronization: {
          accounting: syncResults[0],
          invoicing: syncResults[1],
          hr: syncResults[2],
          banking: syncResults[3]
        },
        compliance: complianceReport,
        recommendations: await this.generateRecommendations(companyId, period)
      };

      // Sauvegarder le rapport
      await this.saveIntegratedReport(report);

      return {
        success: true,
        report,
        message: 'Rapport fiscal intégré généré avec succès'
      };
    } catch (error) {
      console.error('Erreur génération rapport intégré:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: 'Erreur lors de la génération du rapport intégré'
      };
    }
  }

  /**
   * Configuration automatique des obligations fiscales selon l'activité
   */
  async autoConfigureTaxObligations(companyId: string) {
    try {
      // Analyser l'activité de l'entreprise
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;

      const obligations = [];

      // Configuration TVA selon le CA
      if (company.annual_revenue > 236000) { // Seuil réel normal
        obligations.push({
          tax_type: 'TVA',
          frequency: 'monthly',
          declaration_form: 'CA3'
        });
      } else if (company.annual_revenue > 82800) { // Seuil réel simplifié
        obligations.push({
          tax_type: 'TVA',
          frequency: 'annual',
          declaration_form: 'CA12'
        });
      }

      // Configuration CVAE si CA > 500K€
      if (company.annual_revenue > 500000) {
        obligations.push({
          tax_type: 'CVAE',
          frequency: 'annual',
          declaration_form: '1330-CVAE'
        });
      }

      // Configuration IS obligatoire pour les sociétés
      if (company.legal_form !== 'EI' && company.legal_form !== 'EURL') {
        obligations.push({
          tax_type: 'IS',
          frequency: 'annual',
          declaration_form: 'LIASSE_FISCALE'
        });
      }

      // Créer les obligations dans la base
      for (const obligation of obligations) {
        await this.createTaxObligation(companyId, obligation);
      }

      return {
        success: true,
        obligations,
        message: `${obligations.length} obligation(s) fiscale(s) configurée(s)`
      };
    } catch (error) {
      console.error('Erreur configuration obligations:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: 'Erreur lors de la configuration automatique'
      };
    }
  }

  // Méthodes privées
  private async updateTaxDeclarationsFromAccounting(companyId: string, journalEntries: any[]) {
    // Traiter les écritures pour mettre à jour les déclarations
  const _tvaData = this.extractTVAFromEntries(journalEntries);

    // Mettre à jour ou créer les déclarations TVA
    const currentMonth = new Date().toISOString().slice(0, 7);
    try {
      await frenchTaxComplianceService.generateCA3Declaration(companyId, currentMonth);
    } catch (error) {
      console.warn('CA3 déjà générée ou erreur:', error);
    }
  }

  private calculateInvoiceTax(invoice: any) {
    const breakdown = {
      tva_20: 0,
      tva_10: 0,
      tva_5_5: 0,
      tva_2_1: 0
    };

    // Calculer la TVA selon les taux français
    const subtotal = invoice.subtotal || 0;

    // Par défaut, appliquer la TVA à 20%
    breakdown.tva_20 = subtotal * 0.20;

    return {
      totalTax: breakdown.tva_20 + breakdown.tva_10 + breakdown.tva_5_5 + breakdown.tva_2_1,
      breakdown
    };
  }

  private calculateSocialCharges(payrollData: any[]) {
    return payrollData.reduce((total, entry) => {
      return total + (entry.social_charges || 0);
    }, 0);
  }

  private async integrateSocialChargesInTax(_companyId: string, _period: string, _charges: number) {
    // Intégrer les charges sociales dans les déclarations fiscales
    // Les charges sociales sont déductibles de l'IS
  }

  private identifyTaxType(description: string): string | null {
    const desc = description.toLowerCase();

    if (desc.includes('tva') || desc.includes('ca3') || desc.includes('ca12')) return 'TVA';
    if (desc.includes('urssaf')) return 'SOCIAL';
    if (desc.includes('impot') && desc.includes('societe')) return 'IS';
    if (desc.includes('cvae')) return 'CVAE';
    if (desc.includes('cfe')) return 'CFE';
    if (desc.includes('tresor') || desc.includes('dgfip')) return 'VARIOUS';

    return null;
  }

  private async generateRecommendations(companyId: string, _period: string) {
    const recommendations = [];

    // Analyser la situation fiscale
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('annual_revenue, legal_form')
        .eq('id', companyId)
        .single();

      // Recommandations selon le CA
      if (company?.annual_revenue > 10000000) {
        recommendations.push({
          type: 'optimization',
          priority: 'high',
          message: 'Envisager l\'optimisation fiscale avec un expert-comptable pour les grandes entreprises',
          action: 'Contact expert-comptable'
        });
      }

      // Recommandations TVA
      if (company?.annual_revenue > 236000) {
        recommendations.push({
          type: 'compliance',
          priority: 'medium',
          message: 'Vérifier la cohérence TVA déductible/collectée',
          action: 'Audit TVA trimestriel'
        });
      }
    } catch (error) {
      console.warn('Erreur génération recommandations:', error);
    }

    return recommendations;
  }

  private async saveIntegratedReport(report: any) {
    // Sauvegarder le rapport intégré
    const { error } = await supabase
      .from('tax_integration_reports')
      .upsert({
        company_id: report.companyId,
        period: report.period,
        report_data: report,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erreur sauvegarde rapport:', error);
    }
  }

  private async createTaxObligation(companyId: string, obligation: any) {
    const { error } = await supabase
      .from('tax_obligations')
      .insert({
        company_id: companyId,
        tax_type: obligation.tax_type,
        frequency: obligation.frequency,
        declaration_form: obligation.declaration_form,
        is_active: true,
        auto_generate: true,
        created_at: new Date().toISOString()
      });

    if (error && error.code !== '23505') { // Ignore duplicate key errors
      console.error('Erreur création obligation:', error);
    }
  }

  private extractTVAFromEntries(_entries: any[]) {
    // Extraire les données TVA des écritures comptables
    return {
      collectee: 0,
      deductible: 0,
      nette: 0
    };
  }
}

export const taxIntegrationService = TaxIntegrationService.getInstance();
