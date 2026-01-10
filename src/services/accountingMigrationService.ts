/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import { supabase } from '@/lib/supabase';
import { onInvoiceCreated } from './invoiceJournalEntryService';
import { logger } from '@/lib/logger';

/**
 * Génère les écritures comptables pour toutes les factures qui n'en ont pas
 */
export async function generateMissingJournalEntries(companyId: string): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const result = { success: 0, failed: 0, errors: [] as string[] };

  try {
    // Récupérer les factures sans écriture comptable
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, status')
      .eq('company_id', companyId)
      .is('journal_entry_id', null)
      .neq('status', 'draft')
      .neq('status', 'cancelled');

    if (error || !invoices) {
      throw new Error(`Erreur récupération factures: ${error?.message}`);
    }

    logger.info('AccountingMigration', `${invoices.length} factures sans écriture comptable`);

    for (const invoice of invoices) {
      try {
        await onInvoiceCreated(invoice.id);
        result.success++;
        logger.info('AccountingMigration', `✅ Écriture générée pour ${invoice.invoice_number}`);
      } catch (err: any) {
        result.failed++;
        result.errors.push(`${invoice.invoice_number}: ${err.message}`);
        logger.error('AccountingMigration', `❌ Erreur pour ${invoice.invoice_number}:`, err);
      }
    }

    return result;
  } catch (error: any) {
    logger.error('AccountingMigration', 'Erreur migration:', error);
    throw error;
  }
}
