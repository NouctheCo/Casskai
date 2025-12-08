#!/usr/bin/env node

/**
 * Script pour configurer des données de production réalistes pour CassKai
 * Usage: node scripts/setup-production-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Utiliser les variables du .env ou les valeurs par défaut pour le projet CassKai
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.x-eKFKnPeHBRIeNStGBYuaVGm-qxkkBnFnHuFUQMzYg';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Configuration des données de production pour CassKai');
console.log('📊 Création d\'entreprises et de données réalistes...\n');

// Données d'entreprises réalistes
const sampleCompanies = [
  {
    name: 'TechNova Solutions',
    email: 'contact@technova-solutions.fr',
    phone: '+33 1 42 86 75 30',
    address: '15 Avenue des Champs-Élysées, 75008 Paris',
    activity_sector: 'Conseil en informatique',
    legal_form: 'SAS',
    siret: '12345678901234',
    vat_number: 'FR12345678901'
  },
  {
    name: 'Boulangerie Martin & Fils',
    email: 'martin.boulangerie@gmail.com',
    phone: '+33 4 78 92 45 67',
    address: '23 Rue de la République, 69002 Lyon',
    activity_sector: 'Boulangerie-pâtisserie',
    legal_form: 'SARL',
    siret: '23456789012345',
    vat_number: 'FR23456789012'
  },
  {
    name: 'Cabinet Conseil Durand',
    email: 'contact@cabinet-durand.com',
    phone: '+33 5 61 73 28 45',
    address: '8 Place du Capitole, 31000 Toulouse',
    activity_sector: 'Conseil en gestion',
    legal_form: 'SELARL',
    siret: '34567890123456',
    vat_number: 'FR34567890123'
  },
  {
    name: 'Garage Auto Expert',
    email: 'info@garage-autoexpert.fr',
    phone: '+33 2 98 45 67 89',
    address: '45 Avenue de Bretagne, 29000 Quimper',
    activity_sector: 'Réparation automobile',
    legal_form: 'EURL',
    siret: '45678901234567',
    vat_number: 'FR45678901234'
  },
  {
    name: 'Innovate Africa Consulting',
    email: 'contact@innovate-africa.sn',
    phone: '+221 77 123 45 67',
    address: 'Plateau, Dakar, Sénégal',
    activity_sector: 'Conseil en développement',
    legal_form: 'SARL',
    siret: 'SN56789012345678',
    vat_number: 'SN56789012345'
  }
];

// Plan comptable de base
const baseAccounts = [
  { code: '101000', name: 'Capital social', type: 'equity' },
  { code: '106000', name: 'Réserves', type: 'equity' },
  { code: '120000', name: 'Résultat de l\'exercice', type: 'equity' },
  { code: '164000', name: 'Emprunts bancaires', type: 'liability' },
  { code: '401000', name: 'Fournisseurs', type: 'liability' },
  { code: '411000', name: 'Clients', type: 'asset' },
  { code: '421000', name: 'Salariés - rémunérations dues', type: 'liability' },
  { code: '431000', name: 'Sécurité sociale', type: 'liability' },
  { code: '445660', name: 'TVA déductible', type: 'asset' },
  { code: '445710', name: 'TVA collectée', type: 'liability' },
  { code: '512000', name: 'Banque', type: 'asset' },
  { code: '530000', name: 'Caisse', type: 'asset' },
  { code: '601000', name: 'Achats de marchandises', type: 'expense' },
  { code: '606000', name: 'Achats de fournitures', type: 'expense' },
  { code: '641000', name: 'Salaires', type: 'expense' },
  { code: '645000', name: 'Charges sociales', type: 'expense' },
  { code: '661000', name: 'Charges d\'intérêts', type: 'expense' },
  { code: '701000', name: 'Ventes de marchandises', type: 'revenue' },
  { code: '706000', name: 'Prestations de services', type: 'revenue' },
  { code: '758000', name: 'Produits financiers', type: 'revenue' }
];

async function createCompanyData(company) {
  console.log(`📈 Création des données pour ${company.name}...`);

  try {
    // 1. Créer l'entreprise
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert(company)
      .select()
      .single();

    if (companyError) throw companyError;

    const companyId = companyData.id;
    console.log(`   ✅ Entreprise créée: ${company.name}`);

    // 2. Créer le plan comptable
    const accountsWithCompany = baseAccounts.map(account => ({
      ...account,
      company_id: companyId,
      is_active: true
    }));

    const { error: accountsError } = await supabase
      .from('accounts')
      .insert(accountsWithCompany);

    if (accountsError) throw accountsError;
    console.log(`   ✅ Plan comptable créé (${baseAccounts.length} comptes)`);

    // 3. Créer quelques clients/tiers
    const clients = [
      {
        company_id: companyId,
        type: 'client',
        name: 'Client Premium SA',
        email: 'contact@clientpremium.fr',
        phone: '+33 1 45 67 89 01',
        address: '12 Rue de Rivoli, Paris',
        is_active: true
      },
      {
        company_id: companyId,
        type: 'client',
        name: 'Entreprise Moderne SARL',
        email: 'info@entreprise-moderne.com',
        phone: '+33 4 76 54 32 10',
        address: '25 Avenue Victor Hugo, Grenoble',
        is_active: true
      },
      {
        company_id: companyId,
        type: 'fournisseur',
        name: 'Fournisseur Expert',
        email: 'commandes@fournisseur-expert.fr',
        phone: '+33 2 47 89 65 43',
        address: '8 Place de la Mairie, Tours',
        is_active: true
      }
    ];

    const { error: clientsError } = await supabase
      .from('third_parties')
      .insert(clients);

    if (clientsError) throw clientsError;
    console.log(`   ✅ Tiers créés (${clients.length} clients/fournisseurs)`);

    // 4. Créer quelques écritures comptables d'exemple
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const journalEntries = [
      {
        company_id: companyId,
        date: thisMonth.toISOString().split('T')[0],
        reference: 'VTE001',
        description: 'Vente de prestations - Client Premium SA',
        debit_account: '411000',
        credit_account: '706000',
        amount: 2500.00
      },
      {
        company_id: companyId,
        date: new Date(thisMonth.getTime() + 2*24*60*60*1000).toISOString().split('T')[0],
        reference: 'VTE002',
        description: 'Vente de marchandises - Entreprise Moderne',
        debit_account: '411000',
        credit_account: '701000',
        amount: 1800.00
      },
      {
        company_id: companyId,
        date: new Date(thisMonth.getTime() + 5*24*60*60*1000).toISOString().split('T')[0],
        reference: 'ACH001',
        description: 'Achat de fournitures - Fournisseur Expert',
        debit_account: '606000',
        credit_account: '401000',
        amount: 450.00
      },
      {
        company_id: companyId,
        date: new Date(thisMonth.getTime() + 10*24*60*60*1000).toISOString().split('T')[0],
        reference: 'BQ001',
        description: 'Encaissement client Premium SA',
        debit_account: '512000',
        credit_account: '411000',
        amount: 2500.00
      }
    ];

    const { error: entriesError } = await supabase
      .from('journal_entries')
      .insert(journalEntries);

    if (entriesError) throw entriesError;
    console.log(`   ✅ Écritures comptables créées (${journalEntries.length} écritures)`);

    console.log(`   🎉 Configuration terminée pour ${company.name}\n`);

    return companyId;

  } catch (error) {
    console.error(`   ❌ Erreur pour ${company.name}:`, error.message);
    return null;
  }
}

async function createProductionData() {
  console.log('🎯 Début de la création des données de production...\n');

  let successCount = 0;

  for (const company of sampleCompanies) {
    const result = await createCompanyData(company);
    if (result) {
      successCount++;
    }
  }

  console.log('\n🎊 Configuration terminée !');
  console.log(`✅ ${successCount}/${sampleCompanies.length} entreprises configurées avec succès`);
  console.log('\n📋 Données créées pour chaque entreprise:');
  console.log('   • Plan comptable complet (20 comptes de base)');
  console.log('   • 3 tiers (2 clients + 1 fournisseur)');
  console.log('   • 4 écritures comptables du mois en cours');
  console.log('\n🚀 Votre application CassKai est prête pour les tests avec des données réalistes !');

  return successCount;
}

// Exécution du script
if (import.meta.url === `file://${process.argv[1]}`) {
  createProductionData()
    .then((count) => {
      process.exit(count > 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}