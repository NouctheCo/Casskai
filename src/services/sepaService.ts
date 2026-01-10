/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
export interface SepaPayment {
  id: string;
  beneficiaryName: string;
  beneficiaryIban: string;
  beneficiaryBic: string;
  amount: number;
  reference: string;
  description: string;
  type: 'supplier_invoice' | 'expense_report';
  sourceId: string; // ID de la facture ou note de frais
}
export interface BankAccount {
  id: string;
  iban: string;
  bic: string;
  account_name: string;
  bank_name: string;
}
export interface SepaXmlGenerationOptions {
  companyId: string;
  companyName: string;
  emitterAccount: BankAccount;
  payments: SepaPayment[];
  executionDate: string; // Format ISO YYYY-MM-DD
  messageId?: string;
  paymentInfoId?: string;
}
export class SepaService {
  /**
   * Génère un ID de message unique pour SEPA
   */
  private static generateMessageId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MSG${timestamp}${random}`;
  }
  /**
   * Génère un ID de lot de paiement unique
   */
  private static generatePaymentInfoId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PMT${timestamp}${random}`;
  }
  /**
   * Génère un ID end-to-end unique pour une transaction
   */
  private static generateEndToEndId(index: number): string {
    const timestamp = Date.now();
    return `E2E${timestamp}${String(index + 1).padStart(4, '0')}`;
  }
  /**
   * Valide un IBAN
   */
  private static validateIban(iban: string): boolean {
    // Enlever les espaces et mettre en majuscules
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    // Vérifier le format basique (longueur minimale et caractères autorisés)
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIban)) {
      return false;
    }
    // Vérifier la longueur selon le pays (France = 27 caractères)
    if (cleanIban.startsWith('FR') && cleanIban.length !== 27) {
      return false;
    }
    return true;
  }
  /**
   * Formate un IBAN pour affichage (avec espaces tous les 4 caractères)
   */
  private static formatIban(iban: string): string {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    return cleanIban.match(/.{1,4}/g)?.join(' ') || cleanIban;
  }
  /**
   * Échappe les caractères XML spéciaux
   */
  private static escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  /**
   * Génère le fichier XML SEPA pain.001.001.03 (virement SEPA)
   */
  static generateSepaXml(options: SepaXmlGenerationOptions): string {
    const {
      companyName,
      emitterAccount,
      payments,
      executionDate,
      messageId = this.generateMessageId(),
      paymentInfoId = this.generatePaymentInfoId(),
    } = options;
    // Validation
    if (payments.length === 0) {
      throw new Error('Aucun paiement à générer');
    }
    if (!this.validateIban(emitterAccount.iban)) {
      throw new Error(`IBAN émetteur invalide: ${emitterAccount.iban}`);
    }
    for (const payment of payments) {
      if (!this.validateIban(payment.beneficiaryIban)) {
        throw new Error(`IBAN bénéficiaire invalide: ${payment.beneficiaryIban} (${payment.beneficiaryName})`);
      }
      if (payment.amount <= 0) {
        throw new Error(`Montant invalide: ${payment.amount} (${payment.beneficiaryName})`);
      }
    }
    // Calculs
    const numberOfTransactions = payments.length;
    const controlSum = payments.reduce((sum, p) => sum + p.amount, 0);
    const creationDateTime = new Date().toISOString();
    // Génération XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${this.escapeXml(messageId)}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${numberOfTransactions}</NbOfTxs>
      <CtrlSum>${controlSum.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${this.escapeXml(companyName)}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${this.escapeXml(paymentInfoId)}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${numberOfTransactions}</NbOfTxs>
      <CtrlSum>${controlSum.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${executionDate}</ReqdExctnDt>
      <Dbtr>
        <Nm>${this.escapeXml(companyName)}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${emitterAccount.iban.replace(/\s/g, '')}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${emitterAccount.bic}</BIC>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>${payments.map((payment, index) => `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${this.escapeXml(payment.reference || this.generateEndToEndId(index))}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${payment.amount.toFixed(2)}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BIC>${payment.beneficiaryBic}</BIC>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>${this.escapeXml(payment.beneficiaryName)}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${payment.beneficiaryIban.replace(/\s/g, '')}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${this.escapeXml(payment.description)}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`).join('')}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
    return xml;
  }
  /**
   * Récupère les factures fournisseurs impayées
   */
  static async getUnpaidSupplierInvoices(companyId: string) {
    // ✅ Utiliser la table suppliers via supplier_id au lieu de la VIEW third_parties
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        supplier_id,
        suppliers!inner(
          id,
          name,
          iban,
          bic
        )
      `)
      .eq('company_id', companyId)
      .eq('invoice_type', 'purchase')
      .eq('status', 'pending')
      .not('suppliers.iban', 'is', null)
      .order('invoice_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(invoice => {
      const supplier = Array.isArray(invoice.suppliers) ? invoice.suppliers[0] : invoice.suppliers;
      return {
        id: invoice.id,
        beneficiaryName: supplier?.name || '',
        beneficiaryIban: supplier?.iban || '',
        beneficiaryBic: supplier?.bic || '',
        amount: invoice.total_amount,
        reference: invoice.invoice_number,
        description: `Facture fournisseur ${invoice.invoice_number}`,
        type: 'supplier_invoice' as const,
        sourceId: invoice.id,
      };
    });
  }
  /**
   * Récupère les notes de frais validées
   */
  static async getApprovedExpenseReports(companyId: string) {
    const { data, error } = await supabase
      .from('expense_reports')
      .select(`
        id,
        report_number,
        total_amount,
        employee_id,
        employees!inner(
          id,
          first_name,
          last_name,
          iban,
          bic
        )
      `)
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .not('employees.iban', 'is', null)
      .order('submission_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(report => {
      const employee = Array.isArray(report.employees) ? report.employees[0] : report.employees;
      return {
        id: report.id,
        beneficiaryName: `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim(),
        beneficiaryIban: employee?.iban || '',
        beneficiaryBic: employee?.bic || '',
        amount: report.total_amount,
        reference: report.report_number,
        description: `Note de frais ${report.report_number}`,
        type: 'expense_report' as const,
        sourceId: report.id,
      };
    });
  }
  /**
   * Récupère les comptes bancaires de l'entreprise
   */
  static async getBankAccounts(companyId: string): Promise<BankAccount[]> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('id, iban, bic, account_name, bank_name')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .not('iban', 'is', null)
      .order('account_name');
    if (error) throw error;
    return data || [];
  }
  /**
   * Met à jour le statut des paiements après génération SEPA
   */
  static async markPaymentsAsPending(payments: SepaPayment[], companyId: string) {
    const supplierInvoiceIds = payments
      .filter(p => p.type === 'supplier_invoice')
      .map(p => p.sourceId);
    const expenseReportIds = payments
      .filter(p => p.type === 'expense_report')
      .map(p => p.sourceId);
    // Mettre à jour les factures fournisseurs
    if (supplierInvoiceIds.length > 0) {
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ status: 'processing', payment_status: 'processing' })
        .in('id', supplierInvoiceIds)
        .eq('company_id', companyId);
      if (invoiceError) {
        logger.error('Sepa', 'Erreur mise à jour factures:', invoiceError);
      }
    }
    // Mettre à jour les notes de frais
    if (expenseReportIds.length > 0) {
      const { error: expenseError } = await supabase
        .from('expense_reports')
        .update({ status: 'processing' })
        .in('id', expenseReportIds)
        .eq('company_id', companyId);
      if (expenseError) {
        logger.error('Sepa', 'Erreur mise à jour notes de frais:', expenseError);
      }
    }
  }
  /**
   * Télécharge le fichier XML SEPA
   */
  static downloadSepaXml(xml: string, filename: string = 'virement_sepa.xml') {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}