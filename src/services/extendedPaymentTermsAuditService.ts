/**
 * CassKai - Service d'Audit Étendu
 * Couvre factures, devis, bons de commande, avoirs
 */

import { supabase } from '@/lib/supabase';
import { paymentTermsComplianceService } from '@/services/paymentTermsComplianceService';
import { logger } from '@/lib/logger';

export interface ExtendedAuditFinding {
  documentType: 'invoice' | 'quote' | 'purchase_order' | 'credit_note' | 'debit_note';
  documentId: string;
  documentNumber: string;
  currency: string;
  compliant: boolean;
  issues: string[];
  correctedTerms?: string[];
}

export interface ExtendedAuditReport {
  companyId: string;
  auditDate: Date;
  totalDocuments: number;
  compliantCount: number;
  nonCompliantCount: number;
  byType: {
    invoices: { checked: number; compliant: number; nonCompliant: number };
    quotes: { checked: number; compliant: number; nonCompliant: number };
    purchaseOrders: { checked: number; compliant: number; nonCompliant: number };
    creditNotes: { checked: number; compliant: number; nonCompliant: number };
    debitNotes: { checked: number; compliant: number; nonCompliant: number };
  };
  findings: ExtendedAuditFinding[];
  summary: string;
}

class ExtendedPaymentTermsAuditService {
  /**
   * Audit toutes les factures (invoice_type = 'sale')
   */
  private async auditInvoices(companyId: string): Promise<{
    findings: ExtendedAuditFinding[];
    checked: number;
  }> {
    const findings: ExtendedAuditFinding[] = [];
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, currency, notes, terms')
      .eq('company_id', companyId)
      .eq('invoice_type', 'sale')
      .limit(500);

    if (error) throw error;
    if (!invoices) return { findings, checked: 0 };

    for (const inv of invoices) {
      const content = `${inv.notes || ''} ${inv.terms || ''}`;
      const { compliant, warnings } = paymentTermsComplianceService.auditPaymentTerms(
        inv.currency || 'EUR',
        content
      );

      if (!compliant || warnings.length > 0) {
        findings.push({
          documentType: 'invoice',
          documentId: inv.id,
          documentNumber: inv.invoice_number,
          currency: inv.currency || 'EUR',
          compliant,
          issues: warnings,
          correctedTerms: paymentTermsComplianceService.buildPaymentTermsText(
            inv.currency || 'EUR'
          ),
        });
      }
    }

    return { findings, checked: invoices.length };
  }

  /**
   * Audit tous les devis (invoice_type = 'quote')
   */
  private async auditQuotes(companyId: string): Promise<{
    findings: ExtendedAuditFinding[];
    checked: number;
  }> {
    const findings: ExtendedAuditFinding[] = [];
    const { data: quotes, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, currency, notes, terms')
      .eq('company_id', companyId)
      .eq('invoice_type', 'quote')
      .limit(500);

    if (error) throw error;
    if (!quotes) return { findings, checked: 0 };

    for (const quote of quotes) {
      const content = `${quote.notes || ''} ${quote.terms || ''}`;
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

    return { findings, checked: quotes.length };
  }

  /**
   * Audit tous les bons de commande (purchase_orders)
   * Note: Stockés comme invoices avec invoice_type = 'purchase'
   */
  private async auditPurchaseOrders(companyId: string): Promise<{
    findings: ExtendedAuditFinding[];
    checked: number;
  }> {
    const findings: ExtendedAuditFinding[] = [];
    const { data: pos, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, currency, notes, terms')
      .eq('company_id', companyId)
      .eq('invoice_type', 'purchase')
      .limit(500);

    if (error) throw error;
    if (!pos) return { findings, checked: 0 };

    for (const po of pos) {
      const content = `${po.notes || ''} ${po.terms || ''}`;
      const { compliant, warnings } = paymentTermsComplianceService.auditPaymentTerms(
        po.currency || 'EUR',
        content
      );

      if (!compliant || warnings.length > 0) {
        findings.push({
          documentType: 'purchase_order',
          documentId: po.id,
          documentNumber: po.invoice_number,
          currency: po.currency || 'EUR',
          compliant,
          issues: warnings,
          correctedTerms: paymentTermsComplianceService.buildPaymentTermsText(
            po.currency || 'EUR'
          ),
        });
      }
    }

    return { findings, checked: pos.length };
  }

  /**
   * Audit tous les avoirs (credit_notes)
   */
  private async auditCreditNotes(companyId: string): Promise<{
    findings: ExtendedAuditFinding[];
    checked: number;
  }> {
    const findings: ExtendedAuditFinding[] = [];
    const { data: creditNotes, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, currency, notes, terms')
      .eq('company_id', companyId)
      .eq('invoice_type', 'credit_note')
      .limit(500);

    if (error) throw error;
    if (!creditNotes) return { findings, checked: 0 };

    for (const cn of creditNotes) {
      const content = `${cn.notes || ''} ${cn.terms || ''}`;
      const { compliant, warnings } = paymentTermsComplianceService.auditPaymentTerms(
        cn.currency || 'EUR',
        content
      );

      if (!compliant || warnings.length > 0) {
        findings.push({
          documentType: 'credit_note',
          documentId: cn.id,
          documentNumber: cn.invoice_number,
          currency: cn.currency || 'EUR',
          compliant,
          issues: warnings,
          correctedTerms: paymentTermsComplianceService.buildPaymentTermsText(
            cn.currency || 'EUR'
          ),
        });
      }
    }

    return { findings, checked: creditNotes.length };
  }

  /**
   * Audit tous les notes de débit (debit_notes)
   */
  private async auditDebitNotes(companyId: string): Promise<{
    findings: ExtendedAuditFinding[];
    checked: number;
  }> {
    const findings: ExtendedAuditFinding[] = [];
    const { data: debitNotes, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, currency, notes, terms')
      .eq('company_id', companyId)
      .eq('invoice_type', 'debit_note')
      .limit(500);

    if (error) throw error;
    if (!debitNotes) return { findings, checked: 0 };

    for (const dn of debitNotes) {
      const content = `${dn.notes || ''} ${dn.terms || ''}`;
      const { compliant, warnings } = paymentTermsComplianceService.auditPaymentTerms(
        dn.currency || 'EUR',
        content
      );

      if (!compliant || warnings.length > 0) {
        findings.push({
          documentType: 'debit_note',
          documentId: dn.id,
          documentNumber: dn.invoice_number,
          currency: dn.currency || 'EUR',
          compliant,
          issues: warnings,
          correctedTerms: paymentTermsComplianceService.buildPaymentTermsText(
            dn.currency || 'EUR'
          ),
        });
      }
    }

    return { findings, checked: debitNotes.length };
  }

  /**
   * Audit COMPLET: Tous les documents
   */
  async auditAllDocuments(companyId: string): Promise<ExtendedAuditReport> {
    try {
      logger.info('ExtendedAudit', `Démarrage audit complet pour ${companyId}`);

      const [invoicesResult, quotesResult, posResult, creditNotesResult, debitNotesResult] =
        await Promise.all([
          this.auditInvoices(companyId),
          this.auditQuotes(companyId),
          this.auditPurchaseOrders(companyId),
          this.auditCreditNotes(companyId),
          this.auditDebitNotes(companyId),
        ]);

      const allFindings = [
        ...invoicesResult.findings,
        ...quotesResult.findings,
        ...posResult.findings,
        ...creditNotesResult.findings,
        ...debitNotesResult.findings,
      ];

      const totalChecked =
        invoicesResult.checked +
        quotesResult.checked +
        posResult.checked +
        creditNotesResult.checked +
        debitNotesResult.checked;

      const compliantCount = totalChecked - allFindings.length;
      const nonCompliantCount = allFindings.length;

      const report: ExtendedAuditReport = {
        companyId,
        auditDate: new Date(),
        totalDocuments: totalChecked,
        compliantCount,
        nonCompliantCount,
        byType: {
          invoices: {
            checked: invoicesResult.checked,
            compliant: invoicesResult.checked - invoicesResult.findings.length,
            nonCompliant: invoicesResult.findings.length,
          },
          quotes: {
            checked: quotesResult.checked,
            compliant: quotesResult.checked - quotesResult.findings.length,
            nonCompliant: quotesResult.findings.length,
          },
          purchaseOrders: {
            checked: posResult.checked,
            compliant: posResult.checked - posResult.findings.length,
            nonCompliant: posResult.findings.length,
          },
          creditNotes: {
            checked: creditNotesResult.checked,
            compliant: creditNotesResult.checked - creditNotesResult.findings.length,
            nonCompliant: creditNotesResult.findings.length,
          },
          debitNotes: {
            checked: debitNotesResult.checked,
            compliant: debitNotesResult.checked - debitNotesResult.findings.length,
            nonCompliant: debitNotesResult.findings.length,
          },
        },
        findings: allFindings,
        summary: `Audit complet: ${compliantCount}/${totalChecked} documents conformes. ${nonCompliantCount} à corriger.`,
      };

      logger.info('ExtendedAudit', '✅ Audit complet terminé', {
        companyId,
        totalChecked,
        compliantCount,
        nonCompliantCount,
      });

      return report;
    } catch (error) {
      logger.error('ExtendedAudit', 'Erreur audit complet:', error);
      throw error;
    }
  }
}

export const extendedPaymentTermsAuditService = new ExtendedPaymentTermsAuditService();
