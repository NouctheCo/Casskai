/**
 * CassKai - Service d'Intégration Automatique Comptable Multi-Modules
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Ce service génère automatiquement des écritures comptables depuis :
 * - Module Facturation (factures clients/fournisseurs)
 * - Module Achats (factures fournisseurs, bons de commande)
 * - Module Banques (transactions bancaires, rapprochements)
 * - Module Paie (salaires, charges sociales)
 *
 * Les règles comptables sont UNIVERSELLES et s'appliquent quel que soit
 * le référentiel (PCG, SYSCOHADA, IFRS, etc.)
 */
import { supabase } from '@/lib/supabase';
import { journalEntriesService } from './journalEntriesService';
import { JournalType } from './accountingRulesService';
import AccountMappingService, { UniversalAccountType } from './accountMappingService';
import { bankAccountBalanceService } from './bankAccountBalanceService';
import type { JournalEntryPayload } from '@/types/journalEntries.types';
import { logger } from '@/lib/logger';
/**
 * ========================================================================
 * MODULE FACTURATION - Génération automatique d'écritures
 * ========================================================================
 */
export interface InvoiceData {
  id: string;
  company_id: string;
  third_party_id: string;
  third_party_name?: string;
  invoice_number: string;
  type: 'sale' | 'purchase'; // Vente ou Achat
  invoice_date: string;
  subtotal_excl_tax: number; // HT
  total_tax_amount: number;  // TVA
  total_incl_tax: number;    // TTC
  lines: InvoiceLineData[];
}
export interface InvoiceLineData {
  account_id?: string;
  description: string;
  subtotal_excl_tax: number;
  tax_amount: number;
}
/**
 * Génère automatiquement une écriture comptable depuis une facture
 *
 * PRINCIPE UNIVERSEL (valable dans tous les pays) :
 *
 * FACTURE DE VENTE :
 *   Débit   411 Clients          1200€
 *     Crédit  707 Ventes                1000€
 *     Crédit  44571 TVA collectée        200€
 *
 * FACTURE D'ACHAT :
 *   Débit   607 Achats           1000€
 *   Débit   44566 TVA déductible  200€
 *     Crédit  401 Fournisseurs          1200€
 */
export async function generateInvoiceJournalEntry(
  invoice: InvoiceData
): Promise<{ success: boolean; entryId?: string; error?: string }> {
  try {
    const { company_id, type, third_party_id, invoice_date } = invoice;
    // 1. Récupérer le journal approprié
    const journalType = type === 'sale' ? JournalType.SALE : JournalType.PURCHASE;
    const journal = await getJournalByType(company_id, journalType);
    if (!journal) {
      return {
        success: false,
        error: `Journal ${journalType} non trouvé pour cette entreprise`,
      };
    }
    // 2. Récupérer le compte du tiers (411 clients ou 401 fournisseurs)
    const thirdPartyAccount = await getThirdPartyAccount(
      company_id,
      third_party_id,
      type
    );
    if (!thirdPartyAccount) {
      return {
        success: false,
        error: `Compte ${type === 'sale' ? 'client (411)' : 'fournisseur (401)'} non trouvé`,
      };
    }
    // 3. Construire les lignes d'écriture
    const lines = [];
    if (type === 'sale') {
      // === FACTURE DE VENTE ===
      // Débit 411 Clients (TTC)
      lines.push({
        accountId: thirdPartyAccount.id,
        debitAmount: invoice.total_incl_tax,
        creditAmount: 0,
        description: `Client ${invoice.third_party_name || ''} - ${invoice.invoice_number}`,
      });
      // Crédit 707 Ventes (HT) - une ligne par ligne de facture
      // Si account_id absent, fallback sur compte de vente par défaut
      let defaultSalesAccount = null;
      for (const line of invoice.lines) {
        if (line.subtotal_excl_tax > 0) {
          let accId = line.account_id;
          if (!accId) {
            if (!defaultSalesAccount) {
              const acc = await AccountMappingService.findAccountByType(company_id, UniversalAccountType.SALES);
              defaultSalesAccount = acc?.id;
            }
            accId = defaultSalesAccount;
          }
          if (accId) {
            lines.push({
              accountId: accId,
              debitAmount: 0,
              creditAmount: line.subtotal_excl_tax,
              description: line.description,
            });
          }
        }
      }
      // Crédit TVA collectée (44571 PCG, 4433 SYSCOHADA, VAT Payable IFRS)
      if (invoice.total_tax_amount > 0) {
        const vatAccount = await AccountMappingService.findAccountByType(
          company_id,
          UniversalAccountType.VAT_COLLECTED
        );
        if (!vatAccount) {
          return { success: false, error: 'Compte TVA collectée non trouvé dans le plan comptable' };
        }
        lines.push({
          accountId: vatAccount.id,
          debitAmount: 0,
          creditAmount: invoice.total_tax_amount,
          description: 'TVA collectée',
        });
      }
    } else {
      // === FACTURE D'ACHAT ===
      // Débit 607 Achats (HT)
      // Si account_id absent, fallback sur compte d'achat par défaut
      let defaultPurchaseAccount = null;
      for (const line of invoice.lines) {
        if (line.subtotal_excl_tax > 0) {
          let accId = line.account_id;
          if (!accId) {
            if (!defaultPurchaseAccount) {
              const acc = await AccountMappingService.findAccountByType(company_id, UniversalAccountType.PURCHASES);
              defaultPurchaseAccount = acc?.id;
            }
            accId = defaultPurchaseAccount;
          }
          if (accId) {
            lines.push({
              accountId: accId,
              debitAmount: line.subtotal_excl_tax,
              creditAmount: 0,
              description: line.description,
            });
          }
        }
      }
      // Débit TVA déductible (44566 PCG, 4431 SYSCOHADA, VAT Receivable IFRS)
      if (invoice.total_tax_amount > 0) {
        const vatAccount = await AccountMappingService.findAccountByType(
          company_id,
          UniversalAccountType.VAT_DEDUCTIBLE
        );
        if (!vatAccount) {
          return { success: false, error: 'Compte TVA déductible non trouvé dans le plan comptable' };
        }
        lines.push({
          accountId: vatAccount.id,
          debitAmount: invoice.total_tax_amount,
          creditAmount: 0,
          description: 'TVA déductible',
        });
      }
      // Crédit 401 Fournisseurs (TTC)
      lines.push({
        accountId: thirdPartyAccount.id,
        debitAmount: 0,
        creditAmount: invoice.total_incl_tax,
        description: `Fournisseur ${invoice.third_party_name || ''} - ${invoice.invoice_number}`,
      });
    }
    // 4. Créer l'écriture comptable
    const payload: JournalEntryPayload = {
      companyId: company_id,
      entryDate: invoice_date,
      description: `Facture ${type === 'sale' ? 'vente' : 'achat'} ${invoice.invoice_number}`,
      referenceNumber: invoice.invoice_number,
      journalId: journal.id,
      status: 'draft', // En brouillon, l'utilisateur valide ensuite
      items: lines,
    };
    const result = await journalEntriesService.createJournalEntry(payload);
    if (result.success && result.data) {
      return {
        success: true,
        entryId: result.data.id,
      };
    }
    return {
      success: false,
      error: ('error' in result ? result.error : 'Erreur lors de la création de l\'écriture'),
    };
  } catch (error) {
    logger.error('AutoAccountingIntegration', 'Error generating invoice journal entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
/**
 * ========================================================================
 * MODULE BANQUES - Génération automatique d'écritures
 * ========================================================================
 */
export interface BankTransactionData {
  id: string;
  company_id: string;
  bank_account_id: string; // 512xxx
  transaction_date: string;
  amount: number;
  type: 'debit' | 'credit'; // Débit = sortie, Crédit = entrée
  description: string;
  counterpart_account_id?: string; // Compte de contrepartie (ex: 411, 401, 607, 707)
  third_party_id?: string;
  reference?: string;
}
/**
 * Génère automatiquement une écriture bancaire
 *
 * PRINCIPE UNIVERSEL :
 *
 * ENCAISSEMENT (entrée d'argent) :
 *   Débit   512 Banque      1200€
 *     Crédit  411 Clients         1200€
 *
 * DÉCAISSEMENT (sortie d'argent) :
 *   Débit   401 Fournisseurs  1200€
 *     Crédit  512 Banque            1200€
 */
export async function generateBankTransactionEntry(
  transaction: BankTransactionData
): Promise<{ success: boolean; entryId?: string; error?: string }> {
  try {
    const { company_id, bank_account_id, transaction_date, amount, type, counterpart_account_id, description, reference, third_party_id } = transaction;
    // Récupérer le journal banque
    const journal = await getJournalByType(company_id, JournalType.BANK);
    if (!journal) {
      return { success: false, error: 'Journal banque non trouvé' };
    }
    // Récupérer le compte bancaire
    const bankAccount = await getAccountById(company_id, bank_account_id);
    if (!bankAccount) {
      return { success: false, error: 'Compte bancaire non trouvé' };
    }
    // Déterminer le compte de contrepartie si non fourni
    let mappedCounterpartId = counterpart_account_id;
    if (!mappedCounterpartId) {
      if (type === 'credit') {
        // Encaissement : contrepartie = client
        if (third_party_id) {
          const clientAccount = await AccountMappingService.findAccountByType(company_id, UniversalAccountType.CUSTOMERS);
          mappedCounterpartId = clientAccount?.id;
        }
      } else {
        // Décaissement : contrepartie = fournisseur
        if (third_party_id) {
          const supplierAccount = await AccountMappingService.findAccountByType(company_id, UniversalAccountType.SUPPLIERS);
          mappedCounterpartId = supplierAccount?.id;
        }
      }
    }
    // Construire les lignes
    const lines = [];
    if (type === 'credit') {
      // ENCAISSEMENT (entrée d'argent sur le compte)
      lines.push({
        accountId: bank_account_id,
        debitAmount: amount,
        creditAmount: 0,
        description,
      });
      if (mappedCounterpartId) {
        lines.push({
          accountId: mappedCounterpartId,
          debitAmount: 0,
          creditAmount: amount,
          description,
        });
      }
    } else {
      // DÉCAISSEMENT (sortie d'argent du compte)
      if (mappedCounterpartId) {
        lines.push({
          accountId: mappedCounterpartId,
          debitAmount: amount,
          creditAmount: 0,
          description,
        });
      }
      lines.push({
        accountId: bank_account_id,
        debitAmount: 0,
        creditAmount: amount,
        description,
      });
    }
    const payload: JournalEntryPayload = {
      companyId: company_id,
      entryDate: transaction_date,
      description,
      referenceNumber: reference || undefined,
      journalId: journal.id,
      status: 'draft',
      items: lines,
    };
    const result = await journalEntriesService.createJournalEntry(payload);
    if (result.success && result.data) {
      // ✅ MISE À JOUR AUTOMATIQUE DU SOLDE BANCAIRE
      // Dès qu'une écriture banque est créée, on met à jour le solde du compte
      await bankAccountBalanceService.updateBalancesFromJournalEntry(company_id, result.data.id);
      return { success: true, entryId: result.data.id };
    }
    return { success: false, error: ('error' in result ? result.error : 'Erreur lors de la création de l\'écriture') };
  } catch (error) {
    logger.error('AutoAccountingIntegration', 'Error generating bank transaction entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
/**
 * ========================================================================
 * MODULE ACHATS - Génération automatique d'écritures
 * ========================================================================
 */
export interface PurchaseOrderData {
  id: string;
  company_id: string;
  supplier_id: string;
  supplier_name?: string;
  order_number: string;
  order_date: string;
  total_excl_tax: number;
  total_tax: number;
  total_incl_tax: number;
  items: Array<{
    account_id?: string;
    description: string;
    amount_excl_tax: number;
  }>;
}
/**
 * Génère automatiquement une écriture d'achat
 * (Similaire à une facture d'achat, utilise le même principe)
 */
export async function generatePurchaseOrderEntry(
  purchase: PurchaseOrderData
): Promise<{ success: boolean; entryId?: string; error?: string }> {
  // Convertir en format InvoiceData et utiliser la même logique
  const invoiceData: InvoiceData = {
    id: purchase.id,
    company_id: purchase.company_id,
    third_party_id: purchase.supplier_id,
    third_party_name: purchase.supplier_name,
    invoice_number: purchase.order_number,
    type: 'purchase',
    invoice_date: purchase.order_date,
    subtotal_excl_tax: purchase.total_excl_tax,
    total_tax_amount: purchase.total_tax,
    total_incl_tax: purchase.total_incl_tax,
    lines: purchase.items.map(item => ({
      account_id: item.account_id,
      description: item.description,
      subtotal_excl_tax: item.amount_excl_tax,
      tax_amount: 0, // Calculé globalement
    })),
  };
  return generateInvoiceJournalEntry(invoiceData);
}
/**
 * ========================================================================
 * FONCTIONS UTILITAIRES
 * ========================================================================
 */
/**
 * Récupère un journal par son type
 */
async function getJournalByType(companyId: string, type: JournalType) {
  const { data, error } = await supabase
    .from('journals')
    .select('*')
    .eq('company_id', companyId)
    .eq('type', type)
    .eq('is_active', true)
    .limit(1)
    .single();
  if (error) {
    logger.error('AutoAccountingIntegration', 'Error fetching journal:', error);
    return null;
  }
  return data;
}
/**
 * Récupère le compte d'un tiers (client ou fournisseur)
 * ✅ Utilise le mapping automatique multi-référentiels
 */
async function getThirdPartyAccount(
  companyId: string,
  thirdPartyId: string,
  type: 'sale' | 'purchase'
) {
  // ✅ Utiliser le type universel selon vente ou achat
  const accountType = type === 'sale'
    ? UniversalAccountType.CUSTOMERS    // 411 (PCG), Receivables (IFRS)
    : UniversalAccountType.SUPPLIERS;   // 401 (PCG), Payables (IFRS)
  // ✅ Le service trouve automatiquement le bon compte selon le référentiel
  return await AccountMappingService.findAccountByType(companyId, accountType);
}
/**
 * Récupère un compte par son numéro
 */
async function _getAccountByNumber(companyId: string, accountNumber: string) {
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('company_id', companyId)
    .eq('account_number', accountNumber)
    .eq('is_active', true)
    .single();
  if (error) {
    logger.error('AutoAccountingIntegration', `Error fetching account ${accountNumber}:`, error);
    return null;
  }
  return data;
}
/**
 * Récupère un compte par son ID
 */
async function getAccountById(companyId: string, accountId: string) {
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('company_id', companyId)
    .eq('id', accountId)
    .eq('is_active', true)
    .single();
  if (error) {
    logger.error('AutoAccountingIntegration', `Error fetching account ${accountId}:`, error);
    return null;
  }
  return data;
}
/**
 * ========================================================================
 * EXPORTS
 * ========================================================================
 */
export const autoAccountingService = {
  generateInvoiceJournalEntry,
  generateBankTransactionEntry,
  generatePurchaseOrderEntry,
};
export default autoAccountingService;