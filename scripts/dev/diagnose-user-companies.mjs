#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Configuration avec la clé anon (lecture seule)
const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Diagnostic des problèmes user_companies...');
console.log('='.repeat(50));

// Test 1: Vérifier que la table existe
console.log('📋 Test 1: Existence de la table user_companies...');
try {
  const { data, error } = await supabase
    .from('user_companies')
    .select('count')
    .single();

  console.log('✅ Table user_companies existe');
} catch (error) {
  console.log('❌ Erreur sur table user_companies:', error.message);
}

// Test 2: Vérifier les tables liées
console.log('\n📋 Test 2: Tables liées...');

const tables = ['companies', 'subscriptions', 'subscription_plans'];
for (const table of tables) {
  try {
    const { error } = await supabase
      .from(table)
      .select('id')
      .limit(1);

    console.log(`✅ Table ${table}: OK`);
  } catch (error) {
    console.log(`❌ Table ${table}: ${error.message}`);
  }
}

// Test 3: Vérifier l'authentification (sans utilisateur réel)
console.log('\n📋 Test 3: État d\'authentification...');
const { data: { user } } = await supabase.auth.getUser();
console.log('Utilisateur connecté:', user ? `✅ ${user.email}` : '❌ Aucun');

console.log('\n🎯 DIAGNOSTIC TERMINÉ');
console.log('='.repeat(50));

if (user) {
  console.log('🧪 Test avec utilisateur authentifié...');
  try {
    const { data, error } = await supabase
      .from('user_companies')
      .select('*')
      .limit(5);

    console.log('Résultat user_companies:', error ? `❌ ${error.message}` : `✅ ${data?.length || 0} rows`);
  } catch (error) {
    console.log('❌ Erreur final:', error.message);
  }
}