/**
 * Service pour génération automatique des écritures comptables depuis les factures
 * Implémente l'automatisation Facture → Écriture comptable
 */
import { supabase } from '../lib/supabase';
import { journalEntriesService } from './journalEntriesService';
import { AccountingService } from './accountingService';
import { auditService } from './auditService';
import { logger } from '@/lib/logger';
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
  description?: string;
  name?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  discount_rate?: number;
  tax_rate?: number;
  subtotal_excl_tax?: number;
  line_total?: number;
}
/**
 * Génère automatiquement l'écriture comptable pour une facture
 */
export async function generateInvoiceJournalEntry(
  invoice: Invoice,
  lines: InvoiceLine[]
): Promise<string> {
  try {
    const { company_id, third_party_id } = invoice;
    // ✅ FIX: Le champ s'appelle 'invoice_type' dans la DB, pas 'type'
    const type = (invoice as any).invoice_type || (invoice as any).type || 'sale';
    // 1. Récupérer le journal approprié selon le type de facture
    // ✅ On récupère l'ID du journal (UUID), pas le code !
    const journalType = type === 'sale' ? 'sale' : 'purchase';
    const journal = await getJournalByType(company_id, journalType);
    if (!journal) {
      throw new Error(
        `Journal ${journalType === 'sale' ? 'des ventes' : 'des achats'} (type: ${journalType}) non trouvé pour cette entreprise. Veuillez créer un journal de type "${journalType}" dans les paramètres comptables.`
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
      // ✅ Les lignes de facture n'ont pas d'account_id, on utilise le compte de vente par défaut
      const salesAccount = await getOrCreateDefaultSalesAccount(company_id);
      if (!salesAccount) {
        throw new Error('Compte de vente (707000) non trouvé');
      }

      // Calculer le total HT de toutes les lignes
      const totalHT = lines.reduce((sum, line) => {
        const discount = (line.discount_percent ?? line.discount_rate ?? 0) / 100;
        const lineHT = (line.quantity * line.unit_price) * (1 - discount);
        return sum + lineHT;
      }, 0);

      // Créer une seule ligne de vente avec le total HT
      journalLines.push({
        accountId: salesAccount.id,
        debitAmount: 0,
        creditAmount: totalHT,
        description: `Vente ${invoice.invoice_number}`,
      });
      // Crédit 44571 TVA collectée
      if (invoice.total_tax_amount > 0) {
        const vatAccount = await getOrCreateVATAccount(company_id, '44571', 'TVA collectée');
        if (!vatAccount) {
          throw new Error('Compte TVA collectée (44571) non trouvé');
        }
        journalLines.push({
          accountId: vatAccount.id,
          debitAmount: 0,
          creditAmount: invoice.total_tax_amount,
          description: 'TVA collectée',
        });
      }
    } else if (type === 'purchase') {
      // === FACTURE D'ACHAT ===
      // Débit 6xxx Charges - compte par défaut
      const expenseAccount = await getOrCreateDefaultExpenseAccount(company_id);
      if (!expenseAccount) {
        throw new Error('Compte de charge (607000) non trouvé');
      }

      // Calculer le total HT de toutes les lignes
      const totalHT = lines.reduce((sum, line) => {
        const discount = (line.discount_percent ?? line.discount_rate ?? 0) / 100;
        const lineHT = (line.quantity * line.unit_price) * (1 - discount);
        return sum + lineHT;
      }, 0);

      journalLines.push({
        accountId: expenseAccount.id,
        debitAmount: totalHT,
        creditAmount: 0,
        description: `Achat ${invoice.invoice_number}`,
      });

      // Débit 44566 TVA déductible
      if (invoice.total_tax_amount > 0) {
        const vatAccount = await getOrCreateVATAccount(company_id, '44566', 'TVA déductible');
        if (!vatAccount) {
          throw new Error('Compte TVA déductible (44566) non trouvé');
        }
        journalLines.push({
          accountId: vatAccount.id,
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
      logger.error('InvoiceJournalEntry', 'Erreur lors de la liaison facture/écriture:', updateError);
    }
    // 6. Audit log
    await auditService.logAsync({
      action: 'generate_invoice_journal_entry',
      entityType: 'journal_entry',
      entityId: journalEntry.id,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        type, // ✅ Utilise la variable 'type' au lieu de invoice.type
        total_incl_tax: invoice.total_incl_tax,
      },
    });
    return journalEntry.id;
  } catch (error) {
    logger.error('InvoiceJournalEntry', 'Erreur génération écriture comptable facture:', error);
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
    const tableName = invoiceType === 'sale' ? 'customers' : 'suppliers';

    // Chercher si le client/fournisseur a déjà un compte auxiliaire
    const { data: thirdParty } = await supabase
      .from(tableName)
      .select('id, name, accounting_account_id')
      .eq('id', thirdPartyId)
      .single();

    if (!thirdParty) {
      throw new Error(`${invoiceType === 'sale' ? 'Client' : 'Fournisseur'} non trouvé`);
    }

    // Si le compte existe déjà, le retourner
    if (thirdParty.accounting_account_id) {
      const { data: account } = await supabase
        .from('chart_of_accounts')
        .select('id, account_number')
        .eq('id', thirdParty.accounting_account_id)
        .maybeSingle();
      if (account) return account;
    }

    // Sinon, créer le compte auxiliaire automatiquement
    const accountNumber = await generateAuxiliaryAccountNumber(
      companyId,
      accountPrefix,
      thirdParty.id // Utiliser l'ID comme code
    );

    const { data: newAccount, error } = await supabase
      .from('chart_of_accounts')
      .insert({
        company_id: companyId,
        account_number: accountNumber,
        account_name: thirdParty.name,
        account_type: invoiceType === 'sale' ? 'asset' : 'liability',
        account_class: 4,
        parent_account_id: null,
        is_detail_account: true,
        is_active: true,
      })
      .select('id, account_number')
      .single();

    if (error) throw error;

    // Mettre à jour le client/fournisseur avec le nouveau compte
    await supabase
      .from(tableName)
      .update({ accounting_account_id: newAccount!.id })
      .eq('id', thirdPartyId);

    return newAccount;
  } catch (error) {
    logger.error('InvoiceJournalEntry', 'Erreur récupération compte tiers:', error);
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
    // Récupérer la facture avec le client
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, customer:customers(name)')
      .eq('id', invoiceId)
      .single();
    if (invoiceError || !invoice) {
      throw new Error('Facture non trouvée');
    }
    // Vérifier si l'écriture n'a pas déjà été générée
    if (invoice.journal_entry_id) {
      logger.debug('InvoiceJournalEntry', 'Écriture comptable déjà générée pour cette facture');
      return;
    }
    // Récupérer les lignes
    const { data: lines, error: linesError } = await supabase
      .from('invoice_items')
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
          third_party_name: invoice.customer?.name || 'Client',
        },
        lines
      );
    }
  } catch (error) {
    logger.error('InvoiceJournalEntry', 'Erreur hook onInvoiceCreated:', error);
    throw error;
  }
}
/**
 * Récupère ou crée le compte de vente par défaut (707000)
 */
async function getOrCreateDefaultSalesAccount(
  companyId: string
): Promise<{ id: string; account_number: string } | null> {
  try {
    // Chercher le compte existant
    const { data: account } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number')
      .eq('company_id', companyId)
      .eq('account_number', '707000')
      .maybeSingle();

    if (account) return account;

    // Créer le compte s'il n'existe pas
    const { data: newAccount, error } = await supabase
      .from('chart_of_accounts')
      .insert({
        company_id: companyId,
        account_number: '707000',
        account_name: 'Ventes de marchandises',
        account_type: 'revenue',
        account_class: 7,
        is_detail_account: true,
        is_active: true,
      })
      .select('id, account_number')
      .single();

    if (error) {
      logger.error('InvoiceJournalEntry', 'Erreur création compte vente:', error);
      return null;
    }

    return newAccount;
  } catch (error) {
    logger.error('InvoiceJournalEntry', 'Exception getOrCreateDefaultSalesAccount:', error);
    return null;
  }
}

/**
 * Récupère ou crée le compte de charge par défaut (607000)
 */
async function getOrCreateDefaultExpenseAccount(
  companyId: string
): Promise<{ id: string; account_number: string } | null> {
  try {
    // Chercher le compte existant
    const { data: account } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number')
      .eq('company_id', companyId)
      .eq('account_number', '607000')
      .maybeSingle();

    if (account) return account;

    // Créer le compte s'il n'existe pas
    const { data: newAccount, error } = await supabase
      .from('chart_of_accounts')
      .insert({
        company_id: companyId,
        account_number: '607000',
        account_name: 'Achats de marchandises',
        account_type: 'expense',
        account_class: 6,
        is_detail_account: true,
        is_active: true,
      })
      .select('id, account_number')
      .single();

    if (error) {
      logger.error('InvoiceJournalEntry', 'Erreur création compte charge:', error);
      return null;
    }

    return newAccount;
  } catch (error) {
    logger.error('InvoiceJournalEntry', 'Exception getOrCreateDefaultExpenseAccount:', error);
    return null;
  }
}

/**
 * Récupère ou crée un compte de TVA (44571 ou 44566)
 */
async function getOrCreateVATAccount(
  companyId: string,
  accountNumber: string,
  accountName: string
): Promise<{ id: string; account_number: string } | null> {
  try {
    // Chercher le compte existant
    const { data: account } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number')
      .eq('company_id', companyId)
      .eq('account_number', accountNumber)
      .maybeSingle();

    if (account) return account;

    // Créer le compte s'il n'existe pas
    const { data: newAccount, error } = await supabase
      .from('chart_of_accounts')
      .insert({
        company_id: companyId,
        account_number: accountNumber,
        account_name: accountName,
        account_type: accountNumber === '44571' ? 'liability' : 'asset',
        account_class: 4,
        is_detail_account: true,
        is_active: true,
      })
      .select('id, account_number')
      .single();

    if (error) {
      logger.error('InvoiceJournalEntry', 'Erreur création compte TVA:', error);
      return null;
    }

    return newAccount;
  } catch (error) {
    logger.error('InvoiceJournalEntry', 'Exception getOrCreateVATAccount:', error);
    return null;
  }
}

/**
 * Récupère ou crée le journal approprié selon son type
 */
async function getJournalByType(
  companyId: string,
  type: 'sale' | 'purchase' | 'bank' | 'cash' | 'miscellaneous'
): Promise<{ id: string; code: string; name: string } | null> {
  try {
    // Chercher le journal existant
    const { data, error } = await supabase
      .from('journals')
      .select('id, code, name')
      .eq('company_id', companyId)
      .eq('type', type)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (data) {
      return data;
    }

    // Si pas trouvé, le créer automatiquement
    logger.warn('InvoiceJournalEntry', `Journal ${type} non trouvé, création automatique...`);

    const journalConfig = {
      sale: { code: 'VE', name: 'Journal des ventes' },
      purchase: { code: 'AC', name: 'Journal des achats' },
      bank: { code: 'BQ', name: 'Journal de banque' },
      cash: { code: 'CA', name: 'Journal de caisse' },
      miscellaneous: { code: 'OD', name: 'Opérations diverses' }
    };

    const config = journalConfig[type];
    const { data: newJournal, error: createError } = await supabase
      .from('journals')
      .insert({
        company_id: companyId,
        code: config.code,
        name: config.name,
        type,
        is_active: true
      })
      .select('id, code, name')
      .single();

    if (createError) {
      logger.error('InvoiceJournalEntry', `Erreur création journal ${type}:`, createError);
      return null;
    }

    logger.info('InvoiceJournalEntry', `✅ Journal ${type} créé automatiquement: ${config.name}`);
    return newJournal;
  } catch (error) {
    logger.error('InvoiceJournalEntry', 'Exception récupération/création journal:', error);
    return null;
  }
}
export const invoiceJournalEntryService = {
  generateInvoiceJournalEntry,
  onInvoiceCreated,
};