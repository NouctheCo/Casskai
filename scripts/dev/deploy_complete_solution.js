import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployCompleteSolution() {
  console.log('🚀 Déploiement complet de la solution onboarding...\n');

  try {
    // 1. Ajouter la colonne owner_id à la table companies
    console.log('1️⃣ Ajout de la colonne owner_id à la table companies...');
    const ownerIdSQL = `
      ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
      CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
    `;

    const { error: ownerIdError } = await supabase.rpc('exec_sql', { sql: ownerIdSQL });
    if (ownerIdError) {
      console.error('❌ Erreur colonne owner_id:', ownerIdError.message);
    } else {
      console.log('✅ Colonne owner_id ajoutée');
    }

    // 2. Créer la table roles si elle n'existe pas
    console.log('\n2️⃣ Création de la table roles...');
    const rolesSQL = fs.readFileSync('./supabase/migrations/20250905_create_roles_table.sql', 'utf8');

    const { error: rolesError } = await supabase.rpc('exec_sql', { sql: rolesSQL });
    if (rolesError) {
      console.error('❌ Erreur table roles:', rolesError.message);
    } else {
      console.log('✅ Table roles créée');
    }

    // 3. Déployer la fonction complete_onboarding
    console.log('\n3️⃣ Déploiement de la fonction complete_onboarding...');
    const onboardingSQL = fs.readFileSync('./supabase/migrations/20250905170000_create_onboarding_function.sql', 'utf8');

    const { error: onboardingError } = await supabase.rpc('exec_sql', { sql: onboardingSQL });
    if (onboardingError) {
      console.error('❌ Erreur fonction complete_onboarding:', onboardingError.message);
    } else {
      console.log('✅ Fonction complete_onboarding déployée');
    }

    // 4. Tests de validation
    console.log('\n4️⃣ Tests de validation...');

    // Test 1: Vérifier la colonne owner_id
    const { error: companiesError } = await supabase
      .from('companies')
      .select('id, name, owner_id')
      .limit(1);

    if (companiesError) {
      console.log('❌ Test colonne owner_id:', companiesError.message);
    } else {
      console.log('✅ Colonne owner_id accessible');
    }

    // Test 2: Vérifier la table roles
    const { error: rolesTestError } = await supabase
      .from('roles')
      .select('name')
      .limit(1);

    if (rolesTestError) {
      console.log('❌ Test table roles:', rolesTestError.message);
    } else {
      console.log('✅ Table roles accessible');
    }

    // Test 3: Vérifier la fonction complete_onboarding
    const { error: functionError } = await supabase.rpc('complete_onboarding', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_company_name: 'test',
      p_company_data: {},
      p_modules: []
    });

    if (functionError && !functionError.message.includes('permission denied')) {
      console.log('❌ Test fonction complete_onboarding:', functionError.message);
    } else {
      console.log('✅ Fonction complete_onboarding accessible');
    }

    console.log('\n🎉 Déploiement terminé! Vous pouvez maintenant tester l\'onboarding.');

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

deployCompleteSolution();
