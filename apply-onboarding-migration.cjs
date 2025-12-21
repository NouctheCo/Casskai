/**
 * Script pour appliquer la migration onboarding_completed_at
 * directement sur la base de données de production
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (depuis .env)
require('dotenv').config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseServiceKey = process.env.VITE_TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY ou VITE_TEST_SUPABASE_SERVICE_ROLE_KEY manquante dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Application de la migration onboarding_completed_at...\n');

  try {
    // 1. Vérifier si la colonne existe déjà
    console.log('1️⃣ Vérification de la colonne onboarding_completed_at...');
    const { data: columns, error: checkError } = await supabase
      .from('companies')
      .select('onboarding_completed_at')
      .limit(1);

    if (checkError && checkError.code === '42703') {
      // Column doesn't exist - need to add it
      console.log('   ⚠️  Colonne non trouvée, ajout nécessaire');
      console.log('   ℹ️  Cette opération nécessite des droits superuser');
      console.log('   ℹ️  Veuillez exécuter manuellement la migration via Supabase Dashboard');
      console.log('\n📄 Migration à exécuter dans SQL Editor de Supabase:\n');
      console.log('-- Ajouter la colonne');
      console.log('ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;');
      console.log('\n-- Mettre à jour les entreprises existantes');
      console.log('UPDATE public.companies');
      console.log('SET onboarding_completed_at = created_at');
      console.log('WHERE onboarding_completed_at IS NULL AND owner_id IS NOT NULL AND created_at < NOW() - INTERVAL \'1 hour\';');
      console.log('\n-- Créer un index');
      console.log('CREATE INDEX IF NOT EXISTS idx_companies_onboarding_completed ON public.companies (onboarding_completed_at) WHERE onboarding_completed_at IS NOT NULL;');
      process.exit(1);
    } else if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
      process.exit(1);
    }

    console.log('   ✅ Colonne existe déjà');

    // 2. Compter les entreprises sans onboarding_completed_at
    console.log('\n2️⃣ Vérification des entreprises à mettre à jour...');
    const { data: companiesNeedUpdate, error: countError } = await supabase
      .from('companies')
      .select('id, created_at, owner_id', { count: 'exact', head: false })
      .is('onboarding_completed_at', null)
      .not('owner_id', 'is', null);

    if (countError) {
      console.error('❌ Erreur lors du comptage:', countError);
      process.exit(1);
    }

    const count = companiesNeedUpdate?.length || 0;
    console.log(`   📊 ${count} entreprise(s) à mettre à jour`);

    if (count === 0) {
      console.log('\n✅ Aucune mise à jour nécessaire - toutes les entreprises ont déjà onboarding_completed_at');
      process.exit(0);
    }

    // 3. Mettre à jour les entreprises une par une
    console.log('\n3️⃣ Mise à jour des entreprises...');
    let updated = 0;
    let errors = 0;

    for (const company of companiesNeedUpdate) {
      const { error: updateError } = await supabase
        .from('companies')
        .update({ onboarding_completed_at: company.created_at })
        .eq('id', company.id);

      if (updateError) {
        console.error(`   ❌ Erreur pour entreprise ${company.id}:`, updateError);
        errors++;
      } else {
        updated++;
        if (updated % 10 === 0) {
          console.log(`   📝 ${updated}/${count} entreprises mises à jour...`);
        }
      }
    }

    console.log(`\n✅ Migration terminée!`);
    console.log(`   📊 ${updated} entreprise(s) mise(s) à jour`);
    if (errors > 0) {
      console.log(`   ⚠️  ${errors} erreur(s) rencontrée(s)`);
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    process.exit(1);
  }
}

// Exécution
applyMigration();
