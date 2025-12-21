/**
 * Service pour génération automatique des écritures comptables depuis les factures
 * Implémente l'automatisation Facture → Écriture comptable
 */

import { supabase } from '../lib/supabase';
import { journalEntriesService } from './journalEntriesService';
import { AccountingService } from './accountingService';
import { auditService } from './auditService';

const accountingService = AccountingService.getInstance();

interface Invoice {
  id: string;
  company_id: string;
  third_party_id: string;
  third_party_name?: string;
  invoice_number: string;
  type: 'sale' | 'purchase' | 'credit_note' | 'debit_note';
  invoice_date: string;
  subtotal_excl_tax: number;
  total_tax_amount: number;
  total_incl_tax: number;
  status: string;
}

interface InvoiceLine {
  id: string;
  invoice_id: string;
  account_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  tax_rate?: number;
  subtotal_excl_tax?: number;
  line_total: number;
}

/**
 * Génère automatiquement l'écriture comptable pour une facture
 */
export async function generateInvoiceJournalEntry(
  invoice: Invoice,
  lines: InvoiceLine[]
): Promise<string> {
  try {
    const { company_id, type, third_party_id } = invoice;

    // 1. Récupérer le journal approprié selon le type de facture
    // ✅ On récupère l'ID du journal (UUID), pas le code !
    const journalType = type === 'sale' ? 'sale' : 'purchase';
    const journal = await getJournalByType(company_id, journalType);

    if (!journal) {
      throw new Error(
        `Journal ${journalType === 'sale' ? 'des ventes (VTE)' : 'des achats (ACH)'} non trouvé pour cette entreprise`
      );
    }

    // 2. Récupérer le compte du tiers (client ou fournisseur)
    const thirdPartyAccount = await getThirdPartyAccount(
      company_id,
      third_party_id,
      type
    );

    if (!thirdPartyAccount) {
      throw new Error(
        `Compte ${type === 'sale' ? 'client' : 'fournisseur'} non trouvé pour le tiers`
      );
    }

    // 3. Construire les lignes d'écriture comptable
    const journalLines = [];

    if (type === 'sale') {
      // === FACTURE DE VENTE ===

      // Débit 411xxx Clients (montant TTC)
      journalLines.push({
        accountId: thirdPartyAccount.id,
        debitAmount: invoice.total_incl_tax,
        creditAmount: 0,
        description: `Client ${invoice.third_party_name || ''}`,
      });

      // Crédit 707xxx Ventes par ligne (montant HT)
      for (const line of lines) {
        journalLines.push({
          accountId: line.account_id,
          debitAmount: 0,
          creditAmount: line.subtotal_excl_tax,
          description: line.description,
        });
      }

      // Crédit 44571 TVA collectée
      if (invoice.total_tax_amount > 0) {
        const vatAccount = accountingService.getAccountByNumber('44571');

        if (!vatAccount) {
          throw new Error('Compte TVA collectée (44571) non trouvé');
        }

        journalLines.push({
          accountId: vatAccount.number,
          debitAmount: 0,
          creditAmount: invoice.total_tax_amount,
          description: 'TVA collectée',
        });
      }
    } else if (type === 'purchase') {
      // === FACTURE D'ACHAT ===

      // Débit 6xxx Charges par ligne (montant HT)
      for (const line of lines) {
        journalLines.push({
          accountId: line.account_id,
          debitAmount: line.subtotal_excl_tax,
          creditAmount: 0,
          description: line.description,
        });
      }

      // Débit 44566 TVA déductible
      if (invoice.total_tax_amount > 0) {
        const vatAccount = accountingService.getAccountByNumber('44566');

        if (!vatAccount) {
          throw new Error('Compte TVA déductible (44566) non trouvé');
        }

        journalLines.push({
          accountId: vatAccount.number,
          debitAmount: invoice.total_tax_amount,
          creditAmount: 0,
          description: 'TVA déductible',
        });
      }

      // Crédit 401xxx Fournisseurs (montant TTC)
      journalLines.push({
        accountId: thirdPartyAccount.id,
        debitAmount: 0,
        creditAmount: invoice.total_incl_tax,
        description: `Fournisseur ${invoice.third_party_name || ''}`,
      });
    } else {
      throw new Error(`Type de facture non supporté: ${type}`);
    }

    // 4. Créer l'écriture comptable
    const journalEntryResult = await journalEntriesService.createJournalEntry({
      companyId: company_id,
      journalId: journal.id, // ✅ On passe l'ID du journal (UUID), pas le code
      entryDate: invoice.invoice_date,
      description: `Facture ${invoice.invoice_number}`,
      referenceNumber: invoice.invoice_number,
      status: invoice.status === 'draft' ? 'draft' : 'posted',
      items: journalLines,
    });

    if (!journalEntryResult.success) {
      throw new Error('error' in journalEntryResult ? journalEntryResult.error : 'Unknown error');
    }

    const journalEntry = journalEntryResult.data;

    // 5. Lier l'écriture à la facture
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ journal_entry_id: journalEntry.id })
      .eq('id', invoice.id);

    if (updateError) {
      console.error('Erreur lors de la liaison facture/écriture:', updateError);
    }

    // 6. Audit log
    await auditService.logAsync({
      action: 'generate_invoice_journal_entry',
      entityType: 'journal_entry',
      entityId: journalEntry.id,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        type: invoice.type,
        total_incl_tax: invoice.total_incl_tax,
      },
    });

    return journalEntry.id;
  } catch (error) {
    console.error('Erreur génération écriture comptable facture:', error);
    throw error;
  }
}

/**
 * Récupère ou crée le compte auxiliaire du tiers (411xxx client ou 401xxx fournisseur)
 */
async function getThirdPartyAccount(
  companyId: string,
  thirdPartyId: string,
  invoiceType: 'sale' | 'purchase' | 'credit_note' | 'debit_note'
): Promise<{ id: string; account_number: string } | null> {
  try {
    // Déterminer le préfixe du compte selon le type
    const accountPrefix = invoiceType === 'sale' ? '411' : '401';

    // Chercher si le tiers a déjà un compte auxiliaire
    const { data: thirdParty } = await supabase
      .from('third_parties')
      .select('id, code, name, customer_account_id, supplier_account_id')
      .eq('id', thirdPartyId)
      .single();

    if (!thirdParty) {
      throw new Error('Tiers non trouvé');
    }

    // Si le compte existe déjà, le retourner
    const existingAccountId =
      invoiceType === 'sale'
        ? thirdParty.customer_account_id
        : thirdParty.supplier_account_id;

    if (existingAccountId) {
      const { data: account } = await supabase
        .from('chart_of_accounts')
        .select('id, account_number')
        .eq('id', existingAccountId)
        .single();

      if (account) return account;
    }

    // Sinon, créer le compte auxiliaire automatiquement
    const accountNumber = await generateAuxiliaryAccountNumber(
      companyId,
      accountPrefix,
      thirdParty.code
    );

    const { data: newAccount, error } = await supabase
      .from('chart_of_accounts')
      .insert({
        company_id: companyId,
        account_number: accountNumber,
        account_name: thirdParty.name,
        account_type: invoiceType === 'sale' ? 'asset' : 'liability',
        account_class: invoiceType === 'sale' ? 4 : 4,
        parent_account_id: null, // TODO: Récupérer le compte parent 411/401
        is_detail_account: true,
        is_active: true,
      })
      .select('id, account_number')
      .single();

    if (error) throw error;

    // Mettre à jour le tiers avec le nouveau compte
    const updateField =
      invoiceType === 'sale' ? 'customer_account_id' : 'supplier_account_id';

    await supabase
      .from('third_parties')
      .update({ [updateField]: newAccount!.id })
      .eq('id', thirdPartyId);

    return newAccount;
  } catch (error) {
    console.error('Erreur récupération compte tiers:', error);
    return null;
  }
}

/**
 * Génère un numéro de compte auxiliaire unique
 */
async function generateAuxiliaryAccountNumber(
  companyId: string,
  prefix: string,
  thirdPartyCode: string
): Promise<string> {
  // Format: 411XXX ou 401XXX où XXX = code tiers ou numéro séquentiel
  const cleanCode = thirdPartyCode.replace(/[^0-9]/g, '').slice(0, 5);

  if (cleanCode.length >= 3) {
    return `${prefix}${cleanCode.padStart(5, '0')}`;
  }

  // Sinon, numéro séquentiel
  const { data: accounts } = await supabase
    .from('chart_of_accounts')
    .select('account_number')
    .eq('company_id', companyId)
    .like('account_number', `${prefix}%`)
    .order('account_number', { ascending: false })
    .limit(1);

  if (accounts && accounts.length > 0) {
    const lastNumber = parseInt(accounts[0].account_number.substring(3));
    return `${prefix}${String(lastNumber + 1).padStart(5, '0')}`;
  }

  return `${prefix}00001`;
}

/**
 * Hook : Génère automatiquement l'écriture après création/validation d'une facture
 */
export async function onInvoiceCreated(invoiceId: string): Promise<void> {
  try {
    // Récupérer la facture
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, third_parties(name)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Facture non trouvée');
    }

    // Vérifier si l'écriture n'a pas déjà été générée
    if (invoice.journal_entry_id) {
      console.log('Écriture comptable déjà générée pour cette facture');
      return;
    }

    // Récupérer les lignes
    const { data: lines, error: linesError } = await supabase
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', invoiceId);

    if (linesError || !lines || lines.length === 0) {
      throw new Error('Lignes de facture non trouvées');
    }

    // Générer l'écriture seulement si la facture est validée
    if (invoice.status !== 'draft') {
      await generateInvoiceJournalEntry(
        {
          ...invoice,
          third_party_name: invoice.third_parties?.name,
        },
        lines
      );
    }
  } catch (error) {
    console.error('Erreur hook onInvoiceCreated:', error);
    throw error;
  }
}

/**
 * Récupère le journal approprié selon son type
 */
async function getJournalByType(
  companyId: string,
  type: 'sale' | 'purchase' | 'bank' | 'cash' | 'miscellaneous'
): Promise<{ id: string; code: string; name: string } | null> {
  try {
    const { data, error } = await supabase
      .from('journals')
      .select('id, code, name')
      .eq('company_id', companyId)
      .eq('type', type)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error) {
      console.error('Erreur récupération journal:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception récupération journal:', error);
    return null;
  }
}

export const invoiceJournalEntryService = {
  generateInvoiceJournalEntry,
  onInvoiceCreated,
};