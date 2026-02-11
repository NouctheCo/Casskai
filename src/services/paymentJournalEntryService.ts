/**
 * Service pour génération automatique des écritures comptables depuis les paiements
 * Implémente l'automatisation Paiement → Écriture comptable
 */
import { supabase } from '../lib/supabase';
import { journalEntriesService } from './journalEntriesService';
import { auditService } from './auditService';
import { logger } from '@/lib/logger';

interface PaymentData {
  id: string;
  company_id: string;
  third_party_id: string;
  reference: string;
  amount: number;
  payment_date: string;
  payment_method: 'card' | 'bank_transfer' | 'cash' | 'check' | 'sepa' | 'other';
  type: 'income' | 'expense';
  description?: string;
}

/**
 * Génère automatiquement l'écriture comptable pour un paiement
 */
export async function generatePaymentJournalEntry(payment: PaymentData): Promise<string> {
  try {
    const { company_id, third_party_id, type, payment_method, amount, payment_date, reference } = payment;

    // 1. Récupérer le journal approprié selon le type
    const journalType = type === 'income' ? 'bank' : 'cash';
    const journal = await getJournalByType(company_id, journalType);
    if (!journal) {
      throw new Error(
        `Journal ${journalType === 'bank' ? 'bancaire' : 'caisse'} non trouvé pour cette entreprise. Veuillez créer un journal de type "${journalType}" dans les paramètres comptables.`
      );
    }

    // 2. Récupérer le compte du tiers (client ou fournisseur)
    const thirdPartyAccount = await getThirdPartyAccount(company_id, third_party_id, type);
    if (!thirdPartyAccount) {
      throw new Error(
        `Compte ${type === 'income' ? 'client' : 'fournisseur'} non trouvé pour le tiers`
      );
    }

    // 3. Récupérer le compte bancaire
    const bankAccount = await getBankAccount(company_id, payment_method);
    if (!bankAccount) {
      throw new Error(
        `Compte bancaire/caisse pour mode "${payment_method}" non trouvé`
      );
    }

    // 4. Construire les lignes d'écriture comptable
    const journalLines = [];

    if (type === 'income') {
      // === ENCAISSEMENT (Recette) ===
      // Débit : Compte bancaire (montant collecté)
      journalLines.push({
        accountId: bankAccount.id,
        debitAmount: amount,
        creditAmount: 0,
        description: `Encaissement client - ${reference}`,
      });

      // Crédit : Compte client (411xxx)
      journalLines.push({
        accountId: thirdPartyAccount.id,
        debitAmount: 0,
        creditAmount: amount,
        description: `Client - ${reference}`,
      });
    } else {
      // === DÉCAISSEMENT (Dépense) ===
      // Débit : Compte de charge/dépense
      const expenseAccount = await getOrCreateDefaultExpenseAccount(company_id);
      if (!expenseAccount) {
        throw new Error('Compte de charge (607000) non trouvé');
      }

      journalLines.push({
        accountId: expenseAccount.id,
        debitAmount: amount,
        creditAmount: 0,
        description: `Dépense - ${reference}`,
      });

      // Crédit : Compte bancaire (ou fournisseur si applicable)
      journalLines.push({
        accountId: bankAccount.id,
        debitAmount: 0,
        creditAmount: amount,
        description: `Décaissement - ${reference}`,
      });
    }

    // 5. Créer l'écriture comptable
    const journalEntryResult = await journalEntriesService.createJournalEntry({
      companyId: company_id,
      journalId: journal.id,
      entryDate: payment_date,
      description: `Paiement ${reference} - ${type === 'income' ? 'Encaissement' : 'Décaissement'}`,
      referenceNumber: reference,
      status: 'posted',
      items: journalLines,
    });

    if (!journalEntryResult.success) {
      throw new Error(
        'error' in journalEntryResult ? journalEntryResult.error : 'Erreur lors de la création de l\'écriture'
      );
    }

    const journalEntry = journalEntryResult.data;

    // 6. Lier l'écriture au paiement (si la table a un champ journal_entry_id)
    try {
      const { error: updateError } = await supabase
        .from('payments')
        .update({ journal_entry_id: journalEntry.id })
        .eq('id', payment.id);

      if (updateError) {
        logger.error('PaymentJournalEntry', 'Erreur lors de la liaison paiement/écriture:', updateError);
      }
    } catch (error) {
      logger.warn('PaymentJournalEntry', 'Impossible de lier le paiement à l\'écriture (champ journal_entry_id absent)');
    }

    // 7. Audit log
    await auditService.logAsync({
      action: 'generate_payment_journal_entry',
      entityType: 'journal_entry',
      entityId: journalEntry.id,
      metadata: {
        payment_id: payment.id,
        reference: payment.reference,
        type,
        amount,
        payment_method,
      },
    });

    logger.info('PaymentJournalEntry', `Écriture comptable créée pour paiement ${reference}: ${journalEntry.id}`);

    return journalEntry.id;
  } catch (error) {
    logger.error('PaymentJournalEntry', 'Erreur génération écriture comptable paiement:', error);
    throw error;
  }
}

/**
 * Récupère ou crée le compte auxiliaire du tiers (411xxx client ou 401xxx fournisseur)
 */
interface ChartAccount {
  id: string;
  account_number: string;
}

async function getThirdPartyAccount(
  companyId: string,
  thirdPartyId: string,
  type: 'income' | 'expense'
): Promise<ChartAccount | null> {
  try {
    const { data: thirdParty, error: tpError } = await supabase
      .from('third_parties')
      .select('id, third_party_account_id')
      .eq('id', thirdPartyId)
      .eq('company_id', companyId)
      .single();

    if (tpError || !thirdParty) {
      logger.warn('PaymentJournalEntry', 'Tiers non trouvé:', thirdPartyId);
      // Créer un compte auxiliaire par défaut
      const defaultAccountNumber = type === 'income' ? '411000' : '401000';
      const defaultAccountName = type === 'income' ? 'Clients' : 'Fournisseurs';

      // Chercher ou créer le compte existant
      const { data: account } = await supabase
        .from('chart_of_accounts')
        .select('id, account_number')
        .eq('company_id', companyId)
        .eq('account_number', defaultAccountNumber)
        .maybeSingle();

      if (account) {
        return account as ChartAccount;
      }

      // Créer le compte s'il n'existe pas
      const { data: newAccount, error: createError } = await supabase
        .from('chart_of_accounts')
        .insert({
          company_id: companyId,
          account_number: defaultAccountNumber,
          account_name: defaultAccountName,
          account_type: 'auxiliary',
          is_active: true,
        })
        .select('id, account_number')
        .single();

      if (createError || !newAccount) {
        logger.error('PaymentJournalEntry', 'Erreur création compte tiers:', createError);
        return null;
      }

        return newAccount as ChartAccount;
    }

    // Si le tiers a déjà un compte, le retourner
    if (thirdParty.third_party_account_id) {
        const { data: account } = await supabase
          .from('chart_of_accounts')
          .select('id, account_number')
          .eq('id', thirdParty.third_party_account_id)
          .maybeSingle();

        if (account) return account as ChartAccount;

      if (account) return account;
    }

    // Créer un compte auxiliaire pour ce tiers
    const accountNumber = type === 'income' ? `411${thirdPartyId.slice(0, 3)}` : `401${thirdPartyId.slice(0, 3)}`;
    const accountName = `${type === 'income' ? 'Client' : 'Fournisseur'} - ${thirdPartyId}`;

    const { data: account } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number')
      .eq('company_id', companyId)
      .eq('account_number', accountNumber)
      .maybeSingle() as { data: ChartAccount | null; error: any };
    if (account) {
      return account;
    }
      if (account) {
        return account as ChartAccount;
      }

    // Créer le compte s'il n'existe pas
    const { data: newAccount, error: createError } = await supabase
      .from('chart_of_accounts')
      .insert({
        company_id: companyId,
        account_number: accountNumber,
        account_name: accountName,
        account_type: 'auxiliary',
        is_active: true,
      })
      .select('id, account_number')
        .single();

    if (createError || !newAccount) {
      logger.error('PaymentJournalEntry', 'Erreur création compte auxiliaire:', createError);
      return null;
    }

    return newAccount;
  } catch (error) {
    logger.error('PaymentJournalEntry', 'Erreur récupération compte tiers:', error);
    return null;
  }
}

/**
 * Récupère le compte bancaire approprié selon le mode de paiement
 */
async function getBankAccount(
  companyId: string,
  paymentMethod: PaymentData['payment_method']
): Promise<ChartAccount | null> {
  try {
    // Mapper les méthodes de paiement aux numéros de compte
    const accountMapping: Record<string, string> = {
      'card': '512000', // Compte carte bancaire
      'bank_transfer': '512001', // Compte courant
      'check': '512002', // Chèques en attente
      'cash': '530000', // Caisse
      'sepa': '512001', // SEPA virement
      'other': '512000', // Par défaut
    };

    const accountNumber = accountMapping[paymentMethod] || '512000';

    const { data: account } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number')
      .eq('company_id', companyId)
      .eq('account_number', accountNumber)
      .maybeSingle();

    if (account) {
      return account as ChartAccount;
    }

    // Créer le compte s'il n'existe pas
    const accountName = `Compte ${paymentMethod === 'cash' ? 'Caisse' : 'Bancaire'} - ${paymentMethod}`;
    const { data: newAccount, error: createError } = await supabase
      .from('chart_of_accounts')
      .insert({
        company_id: companyId,
        account_number: accountNumber,
        account_name: accountName,
        account_type: paymentMethod === 'cash' ? 'asset' : 'asset',
        is_active: true,
      })
      .select('id, account_number')
      .single();

    if (createError || !newAccount) {
      logger.error('PaymentJournalEntry', 'Erreur création compte bancaire:', createError);
      return null;
    }

    return newAccount as ChartAccount;
  } catch (error) {
    logger.error('PaymentJournalEntry', 'Erreur récupération compte bancaire:', error);
    return null;
  }
}

/**
 * Récupère ou crée le compte de charge par défaut (607000)
 */
async function getOrCreateDefaultExpenseAccount(
  companyId: string
): Promise<ChartAccount | null> {
  try {
    const { data: account } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number')
      .eq('company_id', companyId)
      .eq('account_number', '607000')
      .maybeSingle();

      if (account) {
        return account as ChartAccount;
      }

    // Créer le compte s'il n'existe pas
    const { data: newAccount, error: createError } = await supabase
      .from('chart_of_accounts')
      .insert({
        company_id: companyId,
        account_number: '607000',
        account_name: 'Achats de marchandises',
        account_type: 'expense',
        is_active: true,
      })
      .select('id, account_number')
        .single();

    if (createError || !newAccount) {
      logger.error('PaymentJournalEntry', 'Erreur création compte charge:', createError);
      return null;
    }

    return newAccount;
  } catch (error) {
    logger.error('PaymentJournalEntry', 'Erreur récupération compte charge:', error);
    return null;
  }
}

/**
 * Récupère ou crée le journal approprié selon son type
 */
async function getJournalByType(
  companyId: string,
  type: 'bank' | 'cash' | 'miscellaneous'
): Promise<{ id: string; code: string; name: string } | null> {
  try {
    let journalCode = '';
    let journalName = '';

    switch (type) {
      case 'bank':
        journalCode = 'BQ';
        journalName = 'Banque';
        break;
      case 'cash':
        journalCode = 'CA';
        journalName = 'Caisse';
        break;
      case 'miscellaneous':
        journalCode = 'OD';
        journalName = 'Opérations Diverses';
        break;
    }

    const { data: journal, error } = await supabase
      .from('journals')
      .select('id, code, name')
      .eq('company_id', companyId)
      .eq('code', journalCode)
      .limit(1);

    if (error || !journal || journal.length === 0) {
      logger.warn('PaymentJournalEntry', `Journal ${journalCode} non trouvé pour la compagnie ${companyId}`);
      return null;
    }

    return journal[0];
  } catch (error) {
    logger.error('PaymentJournalEntry', 'Erreur récupération journal:', error);
    return null;
  }
}

export const paymentJournalEntryService = {
  generatePaymentJournalEntry,
};

export default paymentJournalEntryService;
