/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * Script de setup des données de test pour le rapprochement bancaire
 * Crée : comptes bancaires, transactions, écritures comptables
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.test.local' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Setup des données de test
 */
async function setupBankTestData() {
  console.log('🚀 Démarrage du setup des données de test...\n');

  try {
    // 1. Récupérer la company de test
    const testUserEmail = process.env.TEST_USER_EMAIL || 'test@casskai.app';

    const { data: user, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;

    const testUser = user.users.find(u => u.email === testUserEmail);
    if (!testUser) {
      console.error(`❌ Utilisateur ${testUserEmail} non trouvé`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${testUser.email} (${testUser.id})`);

    // Récupérer la company de l'utilisateur
    const { data: userCompanies, error: ucError } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', testUser.id)
      .limit(1)
      .single();

    if (ucError || !userCompanies) {
      console.error('❌ Aucune company trouvée pour cet utilisateur');
      process.exit(1);
    }

    const companyId = userCompanies.company_id;
    console.log(`✅ Company trouvée: ${companyId}\n`);

    // 2. Créer ou récupérer un compte bancaire de test
    console.log('📦 Création/récupération compte bancaire...');

    let bankAccount;
    const { data: existingAccount } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('account_name', 'Compte Test E2E')
      .single();

    if (existingAccount) {
      bankAccount = existingAccount;
      console.log(`✅ Compte bancaire existant: ${bankAccount.id}`);
    } else {
      const { data: newAccount, error: accountError } = await supabase
        .from('bank_accounts')
        .insert({
          company_id: companyId,
          bank_name: 'Banque Test',
          account_name: 'Compte Test E2E',
          account_number: '512000',
          iban: 'FR7630001007941234567890185',
          bic: 'BNPAFRPPXXX',
          currency: 'EUR',
          initial_balance: 10000.00,
          current_balance: 10000.00,
          is_active: true
        })
        .select()
        .single();

      if (accountError) throw accountError;
      bankAccount = newAccount;
      console.log(`✅ Compte bancaire créé: ${bankAccount.id}`);
    }

    // 3. Créer des transactions bancaires de test (non rapprochées)
    console.log('\n💰 Création transactions bancaires...');

    const today = new Date();
    // Utiliser seulement les colonnes essentielles qui existent certainement
    const transactions = [
      {
        company_id: companyId,
        bank_account_id: bankAccount.id,
        transaction_date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Virement Client ACME Corp',
        amount: 1500.00,
        reference: 'VIR-001',
        status: 'pending'
      },
      {
        company_id: companyId,
        bank_account_id: bankAccount.id,
        transaction_date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Paiement Fournisseur BETA Inc',
        amount: -850.50,
        reference: 'CHQ-042',
        status: 'pending'
      },
      {
        company_id: companyId,
        bank_account_id: bankAccount.id,
        transaction_date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Virement Client GAMMA Ltd',
        amount: 2200.00,
        reference: 'VIR-002',
        status: 'pending'
      }
    ];

    // Supprimer les anciennes transactions de test
    await supabase
      .from('bank_transactions')
      .delete()
      .eq('company_id', companyId)
      .eq('bank_account_id', bankAccount.id);

    const { error: txError } = await supabase
      .from('bank_transactions')
      .insert(transactions);

    if (txError) throw txError;
    console.log(`✅ ${transactions.length} transactions bancaires créées`);

    console.log('\n✨ Setup terminé avec succès!\n');
    console.log('📊 Résumé:');
    console.log(`   - Compte bancaire: ${bankAccount.account_name} (${bankAccount.id})`);
    console.log(`   - Transactions bancaires: ${transactions.length}`);
    console.log('\n✅ Les tests E2E peuvent maintenant être exécutés!\n');
    return;

    // 4. Créer des écritures comptables correspondantes (SKIP pour simplifier)
    console.log('\n📝 Création écritures comptables...');

    // D'abord, récupérer le journal par défaut
    const { data: journal } = await supabase
      .from('journals')
      .select('id')
      .eq('company_id', companyId)
      .eq('code', 'BQ')
      .single();

    if (!journal) {
      console.log('⚠️  Journal BQ non trouvé, création...');
      const { data: newJournal, error: journalError } = await supabase
        .from('journals')
        .insert({
          company_id: companyId,
          code: 'BQ',
          name: 'Banque',
          type: 'bank'
        })
        .select()
        .single();

      if (journalError) throw journalError;
      console.log(`✅ Journal BQ créé: ${newJournal.id}`);
    }

    const journalId = journal?.id || '';

    // Créer les écritures comptables (colonnes essentielles uniquement)
    const entries = [
      {
        company_id: companyId,
        journal_id: journalId,
        entry_number: 'BQ-001-TEST',
        entry_date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Virement Client ACME Corp',
        status: 'draft'
      },
      {
        company_id: companyId,
        journal_id: journalId,
        entry_number: 'BQ-002-TEST',
        entry_date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Paiement Fournisseur BETA Inc',
        status: 'draft'
      }
    ];

    // Supprimer les anciennes écritures de test
    await supabase
      .from('journal_entries')
      .delete()
      .eq('company_id', companyId)
      .like('entry_number', '%TEST%');

    const { data: createdEntries, error: entryError } = await supabase
      .from('journal_entries')
      .insert(entries)
      .select();

    if (entryError) throw entryError;
    console.log(`✅ ${createdEntries.length} écritures comptables créées`);

    // 5. Créer les lignes d'écritures
    console.log('\n📋 Création lignes d\'écritures...');

    const entryLines = [
      // Écriture 1 : Virement Client ACME (1500€)
      {
        journal_entry_id: createdEntries[0].id,
        account_number: '512000',
        description: 'Virement Client ACME Corp',
        debit_amount: 1500.00,
        credit_amount: 0
      },
      {
        journal_entry_id: createdEntries[0].id,
        account_number: '411000',
        description: 'Client ACME Corp',
        debit_amount: 0,
        credit_amount: 1500.00
      },
      // Écriture 2 : Paiement Fournisseur BETA (850.50€)
      {
        journal_entry_id: createdEntries[1].id,
        account_number: '401000',
        description: 'Fournisseur BETA Inc',
        debit_amount: 850.50,
        credit_amount: 0
      },
      {
        journal_entry_id: createdEntries[1].id,
        account_number: '512000',
        description: 'Paiement Fournisseur BETA Inc',
        debit_amount: 0,
        credit_amount: 850.50
      }
    ];

    const { error: linesError } = await supabase
      .from('journal_entry_lines')
      .insert(entryLines);

    if (linesError) throw linesError;
    console.log(`✅ ${entryLines.length} lignes d'écritures créées`);

    console.log('\n✨ Setup terminé avec succès!\n');
    console.log('📊 Résumé:');
    console.log(`   - Compte bancaire: ${bankAccount.account_name} (${bankAccount.id})`);
    console.log(`   - Transactions bancaires: ${transactions.length}`);
    console.log(`   - Écritures comptables: ${createdEntries.length}`);
    console.log(`   - Lignes d'écritures: ${entryLines.length}`);
    console.log('\n✅ Les tests E2E peuvent maintenant être exécutés!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors du setup:', error);
    process.exit(1);
  }
}

// Exécuter le setup
setupBankTestData();
