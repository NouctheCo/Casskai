#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase
const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU3NjAyMywiZXhwIjoyMDcwMTUyMDIzfQ.N8dxZVFNqp_qbkGD3oEAYCNrRFvb7yW4tW8nrUVR5yI';

// Créer le client avec la clé service
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('🔧 Correction urgente des politiques user_companies...');

try {
  // 1. Vérifier l'état actuel
  console.log('📊 Vérification de l\'état actuel...');

  // Test simple de lecture user_companies
  const { data: testData, error: testError } = await supabase
    .from('user_companies')
    .select('id')
    .limit(1);

  console.log('Test lecture:', testError ? `❌ ${testError.message}` : '✅ OK');

  // 2. Appliquer les corrections via RPC si possible
  console.log('🛠️ Application des corrections...');

  // Essayer d'activer RLS sur user_companies via SQL
  const sqlCommands = [
    'ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;',

    // Supprimer les anciennes politiques
    'DROP POLICY IF EXISTS user_companies_select ON public.user_companies;',
    'DROP POLICY IF EXISTS user_companies_insert ON public.user_companies;',
    'DROP POLICY IF EXISTS user_companies_update ON public.user_companies;',
    'DROP POLICY IF EXISTS user_companies_delete ON public.user_companies;',

    // Créer les nouvelles politiques
    `CREATE POLICY user_companies_select ON public.user_companies
     FOR SELECT TO authenticated
     USING (user_id = auth.uid());`,

    `CREATE POLICY user_companies_insert ON public.user_companies
     FOR INSERT TO authenticated
     WITH CHECK (user_id = auth.uid());`,

    `CREATE POLICY user_companies_update ON public.user_companies
     FOR UPDATE TO authenticated
     USING (user_id = auth.uid())
     WITH CHECK (user_id = auth.uid());`,

    `CREATE POLICY user_companies_delete ON public.user_companies
     FOR DELETE TO authenticated
     USING (
       user_id = auth.uid()
       OR EXISTS (
         SELECT 1 FROM user_companies uc2
         WHERE uc2.user_id = auth.uid()
         AND uc2.role IN ('admin', 'owner')
         AND uc2.company_id = user_companies.company_id
       )
     );`,

    // Créer les index
    'CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);'
  ];

  for (const sql of sqlCommands) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.log(`⚠️ ${sql.substring(0, 50)}... - ${error.message}`);
      } else {
        console.log(`✅ ${sql.substring(0, 50)}...`);
      }
    } catch (e) {
      console.log(`⚠️ Erreur exec: ${e.message}`);
    }
  }

  // 3. Test final
  console.log('🧪 Test final...');
  const { data: finalTest, error: finalError } = await supabase
    .from('user_companies')
    .select('id, user_id, company_id')
    .limit(1);

  console.log('Test final:', finalError ? `❌ ${finalError.message}` : `✅ OK - ${finalTest?.length || 0} rows`);

  console.log('✅ Correction terminée !');

} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}