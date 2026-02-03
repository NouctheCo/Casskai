/**
 * CassKai - Auto-Audit des Conditions de Paiement
 * S'exécute automatiquement à la création d'une facture
 */

import { paymentTermsComplianceService } from '@/services/paymentTermsComplianceService';
import { paymentTermsAuditService } from '@/services/paymentTermsAuditService';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { Invoice } from '@/types/database/invoices.types';

/**
 * Audit automatique lors de la création d'une facture
 * À appeler après creation_invoice
 */
export async function autoAuditInvoice(invoice: Invoice): Promise<{
  compliant: boolean;
  warnings: string[];
  suggestions?: string[];
}> {
  try {
    const content = `${String(invoice.notes || '')} ${String(invoice.terms || '')}`;
    const currency = String(invoice.currency || 'EUR');

    // Audit des conditions de paiement
    const { compliant, warnings } = paymentTermsComplianceService.auditPaymentTerms(
      currency,
      content
    );

    if (!compliant || warnings.length > 0) {
      logger.warn(
        'AutoAuditInvoice',
        `⚠️ Facture ${invoice.invoice_number} a des problèmes de conformité`,
        {
          currency,
          warnings,
          invoice_id: invoice.id,
        }
      );

      // Notifier l'utilisateur
      if (warnings.length > 0) {
        // Afficher un toast informatif (non bloquant)
        const warningText = warnings
          .map((w) => w.replace(/^[\s]+/, ''))
          .join('\n');

        toast.info('📋 Audit Conditions de Paiement', {
          description: warningText,
          duration: 5000,
        });
      }

      // Retourner les suggestions
      const suggestions = paymentTermsComplianceService.buildPaymentTermsText(currency);

      return {
        compliant: false,
        warnings,
        suggestions,
      };
    }

    logger.info('AutoAuditInvoice', `✅ Facture ${invoice.invoice_number} conforme`, {
      currency,
      invoice_id: invoice.id,
    });

    return { compliant: true, warnings: [] };
  } catch (error) {
    logger.error('AutoAuditInvoice', 'Erreur lors de l\'audit automatique:', error);
    // Ne pas bloquer la création de facture en cas d'erreur d'audit
    return { compliant: true, warnings: [] };
  }
}

/**
 * Audit en arrière-plan pour toutes les factures
 * À exécuter périodiquement (cron job)
 */
export async function backgroundAuditAllInvoices(companyId: string): Promise<void> {
  try {
    logger.info('BackgroundAudit', `Lancement audit en arrière-plan pour entreprise ${companyId}`);

    const report = await paymentTermsAuditService.auditAllInvoices(companyId);

    if (report.nonCompliantCount > 0) {
      logger.warn(
        'BackgroundAudit',
        `${report.nonCompliantCount} factures non-conformes détectées`,
        {
          companyId,
          findings: report.findings.slice(0, 5), // Les 5 premiers
        }
      );
    } else {
      logger.info(
        'BackgroundAudit',
        `✅ Toutes les ${report.documentsChecked} factures sont conformes`,
        { companyId }
      );
    }
  } catch (error) {
    logger.error('BackgroundAudit', 'Erreur audit en arrière-plan:', error);
  }
}

/**
 * Intégration avec invoicingService.createInvoice()
 * À appeler APRÈS la création de la facture
 */
export function getAutoAuditHook() {
  return {
    /**
     * Hook à intégrer dans createInvoice()
     */
    onInvoiceCreated: async (invoice: Invoice): Promise<void> => {
      const result = await autoAuditInvoice(invoice);
      if (!result.compliant) {
        logger.debug(
          'AutoAuditHook',
          `Facture créée avec warnings: ${result.warnings.length} avertissements`
        );
      }
    },
  };
}

export const autoAuditService = {
  autoAuditInvoice,
  backgroundAuditAllInvoices,
  getAutoAuditHook,
};
