/**
 * CassKai - Service Auto-Audit Étendu
 * Audit automatique pour tous les types de documents
 */

import { extendedPaymentTermsAuditService } from '@/services/extendedPaymentTermsAuditService';
import { toastWarning, toastInfo } from '@/lib/toast-helpers';
import { logger } from '@/lib/logger';

/**
 * Hook pour auto-audit lors de la création de TOUT document
 * Pattern: fire-and-forget, never blocks caller
 */
export function getExtendedAutoAuditHook(companyId: string) {
  return async () => {
    try {
      // Fire and forget: Don't wait for result
      setTimeout(async () => {
        try {
          const report = await extendedPaymentTermsAuditService.auditAllDocuments(companyId);

          if (report.nonCompliantCount > 0) {
            const percentage = ((report.compliantCount / report.totalDocuments) * 100).toFixed(0);
            toastWarning(
              `⚠️ ${report.nonCompliantCount} document(s) non-conforme(s) - ${percentage}% de conformité`
            );
            logger.warn('ExtendedAutoAudit', 'Documents non-conformes détectés:', {
              companyId,
              nonCompliant: report.nonCompliantCount,
              total: report.totalDocuments,
            });
          } else {
            toastInfo('✅ Tous les documents sont conformes !');
          }
        } catch (error) {
          logger.error('ExtendedAutoAudit', 'Erreur audit étendu:', error);
          // Silently fail - never interrupt user workflow
        }
      }, 0);
    } catch (error) {
      logger.error('ExtendedAutoAudit', 'Erreur hook audit:', error);
      // Never throw
    }
  };
}

/**
 * Auto-audit unique pour un document spécifique
 * Retourne l'état de conformité immédiatement
 */
export async function autoAuditDocument(
  documentType: 'invoice' | 'quote' | 'purchase_order' | 'credit_note' | 'debit_note',
  companyId: string,
  documentNumber: string,
  currency: string,
  content: string
): Promise<{ compliant: boolean; warnings: string[] }> {
  try {
    const { paymentTermsComplianceService } = await import('@/services/paymentTermsComplianceService');
    const { compliant, warnings } = paymentTermsComplianceService.auditPaymentTerms(currency, content);

    if (!compliant || warnings.length > 0) {
      logger.warn('ExtendedAutoAudit', `Document ${documentType} ${documentNumber} non-conforme:`, {
        companyId,
        warnings,
      });
    }

    return { compliant, warnings };
  } catch (error) {
    logger.error('ExtendedAutoAudit', 'Erreur audit document:', error);
    return { compliant: true, warnings: [] }; // Fail open - assume compliant
  }
}
