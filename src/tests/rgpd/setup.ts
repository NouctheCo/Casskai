/**
 * 🧪 SETUP TESTS RGPD
 * Configuration spécifique pour tests de conformité RGPD
 */

import { beforeAll, afterAll } from 'vitest';
import { config } from 'dotenv';

// Charger variables d'environnement test
config({ path: '.env.test' });

// Configuration Supabase Test
export const TEST_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
export const TEST_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';

// Vérifier que les variables d'environnement sont présentes
if (!TEST_SUPABASE_URL || !TEST_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Variables Supabase test non configurées. Tests RGPD seront skippés.');
}

// Setup avant tous les tests
beforeAll(async () => {
  console.log('🧪 Setup tests RGPD...');
  
  // Vérifier connexion Supabase
  try {
    const response = await fetch(`${TEST_SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: TEST_SUPABASE_ANON_KEY,
      },
    });
    
    if (response.ok) {
      console.log('✅ Connexion Supabase test OK');
    } else {
      console.warn('⚠️ Connexion Supabase test échouée:', response.status);
    }
  } catch (error) {
    console.warn('⚠️ Impossible de se connecter à Supabase test:', error);
  }
});

// Cleanup après tous les tests
afterAll(async () => {
  console.log('🧹 Cleanup tests RGPD...');
  // Pas de cleanup nécessaire - fait dans chaque test
});

// Helper: Skip tests si Supabase non disponible
export function skipIfNoSupabase() {
  if (!TEST_SUPABASE_URL || TEST_SUPABASE_URL === 'http://localhost:54321') {
    return true;
  }
  return false;
}
