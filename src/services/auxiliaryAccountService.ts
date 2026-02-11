/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Service de création automatique des comptes auxiliaires
 *
 * Règle métier :
 * - Client → 411XXXX (ex: 4110001, 4110002...)
 * - Fournisseur → 401XXXX (ex: 4010001, 4010002...)
 * - Format : préfixe 3 chiffres + séquentiel 4 chiffres (total 7 chiffres)
 * - Création automatique dès la création d'un tiers dans n'importe quel module
 */
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface AuxiliaryAccountResult {
  id: string;
  account_number: string;
  account_name: string;
}

/**
 * Crée ou récupère le compte auxiliaire pour un tiers
 *
 * Appelé automatiquement après la création d'un tiers dans :
 * - Module Tiers (ThirdPartyFormDialog)
 * - Module CRM (NewClientModal)
 * - Module Facturation (invoicingService)
 * - Module Achats (purchaseService)
 * - Import de tiers (ImportTab)
 * - Hook useThirdParties
 */
export async function ensureAuxiliaryAccount(
  companyId: string,
  thirdPartyId: string,
  thirdPartyType: 'customer' | 'supplier' | 'both' | 'partner' | 'prospect',
  thirdPartyName: string
): Promise<{ customer_account?: AuxiliaryAccountResult; supplier_account?: AuxiliaryAccountResult }> {
  const result: { customer_account?: AuxiliaryAccountResult; supplier_account?: AuxiliaryAccountResult } = {};

  try {
    // Récupérer les comptes existants du tiers
    const { data: thirdParty } = await supabase
      .from('third_parties')
      .select('id, customer_account_id, supplier_account_id')
      .eq('id', thirdPartyId)
      .single();

    if (!thirdParty) {
      logger.warn('AuxiliaryAccount', `Tiers ${thirdPartyId} non trouvé`);
      return result;
    }

    // Créer le compte client (411xxxx) si type = customer ou both
    if (thirdPartyType === 'customer' || thirdPartyType === 'both') {
      result.customer_account = await getOrCreateAccount(
        companyId,
        thirdPartyId,
        thirdPartyName,
        '411',
        'customer_account_id',
        thirdParty.customer_account_id
      );
    }

    // Créer le compte fournisseur (401xxxx) si type = supplier ou both
    if (thirdPartyType === 'supplier' || thirdPartyType === 'both') {
      result.supplier_account = await getOrCreateAccount(
        companyId,
        thirdPartyId,
        thirdPartyName,
        '401',
        'supplier_account_id',
        thirdParty.supplier_account_id
      );
    }
  } catch (error) {
    logger.error('AuxiliaryAccount', 'Erreur ensureAuxiliaryAccount:', error instanceof Error ? error.message : String(error));
  }

  return result;
}

/**
 * Récupère un compte existant ou en crée un nouveau
 */
async function getOrCreateAccount(
  companyId: string,
  thirdPartyId: string,
  thirdPartyName: string,
  prefix: string,
  accountFieldName: 'customer_account_id' | 'supplier_account_id',
  existingAccountId: string | null
): Promise<AuxiliaryAccountResult | undefined> {
  try {
    // 1. Vérifier si le compte existe déjà via le lien dans third_parties
    if (existingAccountId) {
      const { data: existingAccount } = await supabase
        .from('chart_of_accounts')
        .select('id, account_number, account_name')
        .eq('id', existingAccountId)
        .maybeSingle();

      if (existingAccount) {
        logger.debug('AuxiliaryAccount', `Compte ${existingAccount.account_number} déjà lié pour ${thirdPartyName}`);
        return existingAccount;
      }
    }

    // 2. Vérifier si un compte existe déjà pour ce tiers mais n'est pas lié
    //    (cas de migration ou incohérence)
    const { data: orphanAccount } = await supabase
      .from('chart_of_accounts')
      .select('id, account_number, account_name')
      .eq('company_id', companyId)
      .ilike('account_number', `${prefix}%`)
      .eq('account_name', thirdPartyName)
      .eq('is_active', true)
      .maybeSingle();

    if (orphanAccount) {
      // Rattacher le compte orphelin au tiers
      await supabase
        .from('third_parties')
        .update({ [accountFieldName]: orphanAccount.id })
        .eq('id', thirdPartyId);

      logger.info('AuxiliaryAccount', `Compte orphelin ${orphanAccount.account_number} rattaché à ${thirdPartyName}`);
      return orphanAccount;
    }

    // 3. Générer un nouveau numéro séquentiel (format: XXX + 4 chiffres)
    const accountNumber = await generateNextAccountNumber(companyId, prefix);

    // 4. Créer le compte dans le plan comptable
    const isCustomer = prefix === '411';
    const { data: newAccount, error } = await supabase
      .from('chart_of_accounts')
      .insert({
        company_id: companyId,
        account_number: accountNumber,
        account_name: thirdPartyName,
        account_type: isCustomer ? 'asset' : 'liability',
        account_class: 4,
        parent_account_id: null,
        is_detail_account: true,
        is_active: true,
      })
      .select('id, account_number, account_name')
      .single();

    if (error) {
      // Si doublon (race condition), essayer de récupérer l'existant
      if (error.code === '23505') {
        logger.warn('AuxiliaryAccount', `Doublon détecté pour ${accountNumber}, tentative de récupération...`);
        const { data: existing } = await supabase
          .from('chart_of_accounts')
          .select('id, account_number, account_name')
          .eq('company_id', companyId)
          .eq('account_number', accountNumber)
          .single();

        if (existing) {
          await supabase
            .from('third_parties')
            .update({ [accountFieldName]: existing.id })
            .eq('id', thirdPartyId);
          return existing;
        }
      }
      throw error;
    }

    // 5. Lier le compte au tiers
    await supabase
      .from('third_parties')
      .update({ [accountFieldName]: newAccount.id })
      .eq('id', thirdPartyId);

    logger.info('AuxiliaryAccount', `✅ Compte ${accountNumber} créé pour ${thirdPartyName} (${isCustomer ? 'client' : 'fournisseur'})`);
    return newAccount;
  } catch (error) {
    logger.error('AuxiliaryAccount', `Erreur création compte ${prefix}xxxx pour ${thirdPartyName}:`, error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

/**
 * Génère le prochain numéro de compte séquentiel
 * Format : préfixe (3 chiffres) + séquentiel (4 chiffres)
 * Ex: 4110001, 4110002, ..., 4119999
 */
async function generateNextAccountNumber(companyId: string, prefix: string): Promise<string> {
  const { data: lastAccounts } = await supabase
    .from('chart_of_accounts')
    .select('account_number')
    .eq('company_id', companyId)
    .like('account_number', `${prefix}%`)
    .order('account_number', { ascending: false })
    .limit(1);

  if (lastAccounts && lastAccounts.length > 0) {
    const lastNum = lastAccounts[0].account_number;
    // Extraire la partie séquentielle (après le préfixe de 3 chiffres)
    const sequentialPart = lastNum.substring(prefix.length);
    const nextSequential = parseInt(sequentialPart, 10) + 1;

    if (nextSequential > 9999) {
      logger.warn('AuxiliaryAccount', `Numérotation ${prefix}xxxx saturée (>9999), passage à 5 chiffres`);
      return `${prefix}${String(nextSequential).padStart(5, '0')}`;
    }

    return `${prefix}${String(nextSequential).padStart(4, '0')}`;
  }

  // Premier compte : XXX0001
  return `${prefix}0001`;
}

/**
 * Crée les comptes auxiliaires pour tous les tiers existants qui n'en ont pas.
 * Utile en migration / rattrapage.
 */
export async function backfillAuxiliaryAccounts(companyId: string): Promise<{
  created: number;
  skipped: number;
  errors: number;
}> {
  const stats = { created: 0, skipped: 0, errors: 0 };

  try {
    // Récupérer tous les tiers actifs sans comptes auxiliaires
    const { data: thirdParties, error } = await supabase
      .from('third_parties')
      .select('id, name, type, customer_account_id, supplier_account_id')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error || !thirdParties) {
      logger.error('AuxiliaryAccount', 'Erreur récupération tiers pour backfill:', error?.message);
      return stats;
    }

    for (const tp of thirdParties) {
      const needsCustomer = (tp.type === 'customer' || tp.type === 'both') && !tp.customer_account_id;
      const needsSupplier = (tp.type === 'supplier' || tp.type === 'both') && !tp.supplier_account_id;

      if (!needsCustomer && !needsSupplier) {
        stats.skipped++;
        continue;
      }

      try {
        const result = await ensureAuxiliaryAccount(companyId, tp.id, tp.type, tp.name);
        if (result.customer_account || result.supplier_account) {
          stats.created++;
        } else {
          stats.skipped++;
        }
      } catch {
        stats.errors++;
      }
    }

    logger.info('AuxiliaryAccount', `Backfill terminé: ${stats.created} créés, ${stats.skipped} ignorés, ${stats.errors} erreurs`);
  } catch (error) {
    logger.error('AuxiliaryAccount', 'Erreur backfill:', error instanceof Error ? error.message : String(error));
  }

  return stats;
}

export const auxiliaryAccountService = {
  ensureAuxiliaryAccount,
  backfillAuxiliaryAccounts,
};
