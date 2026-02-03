/**
 * CassKai - Audit des Conditions de Paiement Multi-Devise
 * Vérifie la conformité légale sur tous les documents
 */

import { supabase } from '@/lib/supabase';
import { paymentTermsComplianceService } from '@/services/paymentTermsComplianceService';
import { logger } from '@/lib/logger';

export interface AuditFinding {
  documentType: 'invoice' | 'quote' | 'po' | 'credit_note';
  documentId: string;
  documentNumber: string;
  currency: string;
  countryCode?: string;
  compliant: boolean;
  issues: string[];
  correctedTerms?: string[];
}

export interface AuditReport {
  companyId: string;
  auditDate: Date;
  documentsChecked: number;
  compliantCount: number;
  nonCompliantCount: number;
  findings: AuditFinding[];
  summary: string;
}

class PaymentTermsAuditService {
  /**
   * Audit les conditions de paiement sur toutes les factures d'une entreprise
   */
  async auditAllInvoices(companyId: string): Promise<AuditReport> {
    const findings: AuditFinding[] = [];

    try {
      // Récupérer toutes les factures
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, currency, notes, total_incl_tax')
        .eq('company_id', companyId)
        .limit(500);

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        return {
          companyId,
          auditDate: new Date(),
          documentsChecked: 0,
          compliantCount: 0,
          nonCompliantCount: 0,
          findings: [],
          summary: 'Aucune facture trouvée pour cet audit.',
        };
      }

      // Auditer chaque facture
      for (const invoice of invoices) {
        const content = `${invoice.notes || ''}`;
        const { compliant, warnings } = paymentTermsComplianceService.auditPaymentTerms(
          invoice.currency || 'EUR',
          content
        );

        if (!compliant || warnings.length > 0) {
          findings.push({
            documentType: 'invoice',
            documentId: invoice.id,
            documentNumber: invoice.invoice_number,
            currency: invoice.currency || 'EUR',
            compliant,
            issues: warnings,
            correctedTerms: paymentTermsComplianceService.buildPaymentTermsText(
              invoice.currency || 'EUR'
            ),
          });
        }
      }

      const compliantCount = invoices.length - findings.length;
      const nonCompliantCount = findings.length;

      return {
        companyId,
        auditDate: new Date(),
        documentsChecked: invoices.length,
        compliantCount,
        nonCompliantCount,
        findings,
        summary: `${compliantCount}/${invoices.length} factures conformes. ${nonCompliantCount} à corriger.`,
      };
    } catch (error) {
      logger.error('PaymentTermsAudit', 'Erreur lors de l\'audit des factures:', error);
      throw error;
    }
  }

  /**
   * Audit les conditions sur les devis
   */
  async auditAllQuotes(companyId: string): Promise<AuditReport> {
    const findings: AuditFinding[] = [];

    try {
      // Récupérer tous les devis (via la table invoices avec quote_type='quote')
      const { data: quotes, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, currency, notes')
        .eq('company_id', companyId)
        .eq('invoice_type', 'quote')
        .limit(500);

      if (error) throw error;

      if (!quotes || quotes.length === 0) {
        return {
          companyId,
          auditDate: new Date(),
          documentsChecked: 0,
          compliantCount: 0,
          nonCompliantCount: 0,
          findings: [],
          summary: 'Aucun devis trouvé pour cet audit.',
        };
      }

      for (const quote of quotes) {
        const content = `${quote.notes || ''}`;
        const { compliant, warnings } = paymentTermsComplianceService.auditPaymentTerms(
          quote.currency || 'EUR',
          content
        );

        if (!compliant || warnings.length > 0) {
          findings.push({
            documentType: 'quote',
            documentId: quote.id,
            documentNumber: quote.invoice_number,
            currency: quote.currency || 'EUR',
            compliant,
            issues: warnings,
            correctedTerms: paymentTermsComplianceService.buildPaymentTermsText(
              quote.currency || 'EUR'
            ),
          });
        }
      }

      const compliantCount = quotes.length - findings.length;
      const nonCompliantCount = findings.length;

      return {
        companyId,
        auditDate: new Date(),
        documentsChecked: quotes.length,
        compliantCount,
        nonCompliantCount,
        findings,
        summary: `${compliantCount}/${quotes.length} devis conformes. ${nonCompliantCount} à corriger.`,
      };
    } catch (error) {
      logger.error('PaymentTermsAudit', 'Erreur lors de l\'audit des devis:', error);
      throw error;
    }
  }

  /**
   * Audit GLOBAL: Toutes les factures et devis
   */
  async auditCompanyPaymentTerms(companyId: string): Promise<{
    invoices: AuditReport;
    quotes: AuditReport;
    combined: AuditReport;
  }> {
    try {
      const invoiceAudit = await this.auditAllInvoices(companyId);
      const quoteAudit = await this.auditAllQuotes(companyId);

      const totalChecked = invoiceAudit.documentsChecked + quoteAudit.documentsChecked;
      const totalCompliant = invoiceAudit.compliantCount + quoteAudit.compliantCount;
      const totalNonCompliant = invoiceAudit.nonCompliantCount + quoteAudit.nonCompliantCount;

      const combined: AuditReport = {
        companyId,
        auditDate: new Date(),
        documentsChecked: totalChecked,
        compliantCount: totalCompliant,
        nonCompliantCount: totalNonCompliant,
        findings: [...invoiceAudit.findings, ...quoteAudit.findings],
        summary: `Audit Global: ${totalCompliant}/${totalChecked} documents conformes (${Math.round((totalCompliant / totalChecked) * 100)}%). ${totalNonCompliant} à corriger.`,
      };

      logger.info('PaymentTermsAudit', '✅ Audit global terminé', {
        companyId,
        totalChecked,
        totalCompliant,
        totalNonCompliant,
      });

      return { invoices: invoiceAudit, quotes: quoteAudit, combined };
    } catch (error) {
      logger.error('PaymentTermsAudit', 'Erreur lors de l\'audit global:', error);
      throw error;
    }
  }

  /**
   * Suggestion de correction automatique pour un document
   */
  getSuggestionForDocument(
    documentId: string,
    currency: string,
    currentTerms?: string
  ): { suggested: string[]; explanation: string } {
    const suggested = paymentTermsComplianceService.buildPaymentTermsText(
      currency,
      currentTerms
    );

    const explanation =
      `Conditions suggérées pour ${currency}:\n${suggested.map((term) => `• ${term}`).join('\n')}`;

    return { suggested, explanation };
  }
}

export const paymentTermsAuditService = new PaymentTermsAuditService();
