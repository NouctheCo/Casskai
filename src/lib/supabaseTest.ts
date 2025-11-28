/**
 * 🧪 Client Supabase pour tests E2E
 * Utilise TEST_SUPABASE_URL et SERVICE_ROLE_KEY (bypass RLS)
 * 
 * ⚠️ ATTENTION: Le SERVICE_ROLE_KEY contourne TOUS les RLS.
 * À utiliser UNIQUEMENT pour les tests E2E, jamais en production.
 */

import { createClient } from '@supabase/supabase-js';

const testUrl = import.meta.env.TEST_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;

// ⚠️ FALLBACK: Si import.meta.env ne charge pas la variable, on utilise process.env
// (Vitest parfois ne charge pas les variables VITE_ correctement)
let testKey = import.meta.env.VITE_TEST_SUPABASE_SERVICE_ROLE_KEY;

// Fallback pour Node.js/Vitest (process.env au lieu de import.meta.env)
if (!testKey && typeof process !== 'undefined' && process.env) {
  testKey = process.env.VITE_TEST_SUPABASE_SERVICE_ROLE_KEY;
}

// Si toujours pas de clé, utiliser ANON_KEY (mais RLS sera actif)
if (!testKey) {
  testKey = import.meta.env.TEST_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
}

console.log('🧪 Test Supabase config:', {
  url: testUrl,
  keyType: testKey?.includes('service_role') ? 'SERVICE_ROLE ✅ (RLS bypass)' : 'ANON_KEY ⚠️ (RLS active)',
  keyPrefix: testKey?.substring(0, 20) + '...'
});

if (!testUrl || !testKey) {
  throw new Error('Missing TEST_SUPABASE_URL or TEST_SUPABASE_SERVICE_ROLE_KEY in .env');
}

export const supabaseTest = createClient(testUrl, testKey, {
  auth: {
    autoRefreshToken: true,  // ✅ Activer pour tests E2E avec vraie auth
    persistSession: true,     // ✅ CRITIQUE: Persister la session pour RLS
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'CassKai-Test',
    },
  },
});

export default supabaseTest;
