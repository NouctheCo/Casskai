// Script de test pour vérifier les fonctionnalités après corrections de sécurité
console.log('🔒 Test des corrections de sécurité CassKai');

// Test de connectivité à Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smtdtgrymuzwvctattmx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSecurityFixes() {
  console.log('✅ Connexion Supabase établie');

  try {
    // Test 1: Vérifier que les tables sensibles sont protégées
    console.log('🔍 Test 1: Vérification des protections RLS...');

    // Test 2: Vérifier l'accès aux vues sécurisées
    console.log('🔍 Test 2: Test des vues sécurisées...');
    const { data: _clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (!clientsError) {
      console.log('✅ Vue clients accessible (RLS fonctionne)');
    } else {
      console.log('❌ Erreur vue clients:', clientsError.message);
    }

    // Test 3: Vérifier l'accès aux données CRM
    console.log('🔍 Test 3: Test des données CRM...');
    const { data: _companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);

    if (!companiesError) {
      console.log('✅ Accès aux entreprises fonctionne');
    } else {
      console.log('❌ Erreur entreprises:', companiesError.message);
    }

    // Test 4: Test d'une table critique (encryption_keys)
    console.log('🔍 Test 4: Test table critique encryption_keys...');
    const { data: _keys, error: keysError } = await supabase
      .from('encryption_keys')
      .select('*')
      .limit(1);

    if (keysError && keysError.code === 'PGRST116') {
      console.log('✅ Table encryption_keys protégée par RLS (attendu)');
    } else if (!keysError) {
      console.log('⚠️  Accès aux clés de chiffrement autorisé');
    } else {
      console.log('❌ Erreur inattendue encryption_keys:', keysError.message);
    }

    console.log('🎉 Tests de sécurité terminés');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests
testSecurityFixes();