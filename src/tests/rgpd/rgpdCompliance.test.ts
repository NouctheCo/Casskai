/**
 * 🧪 TESTS RGPD COMPLIANCE
 * 
 * Tests conformité Règlement Général sur la Protection des Données
 * Articles testés: 15, 17, 20
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  exportUserData,
  deleteUserAccount,
  revokeCookieConsent,
  type UserDataExport,
  type AccountDeletionResult
} from '@/services/rgpdService';
import { supabaseTest as supabase } from '@/lib/supabaseTest';

const RUN_RGPD_TESTS =
  import.meta.env.RUN_RGPD_TESTS === 'true' ||
  import.meta.env.VITE_RUN_RGPD_TESTS === 'true' ||
  import.meta.env.CI_RGPD_TESTS === 'true';

const describeRgpd = RUN_RGPD_TESTS ? describe : describe.skip;

// ========================================
// FIXTURES
// ========================================

// Utiliser email/password depuis .env pour vrai user auth
const TEST_USER_EMAIL = import.meta.env.TEST_USER_EMAIL || 'rgpd.test@casskai.com';
const TEST_USER_PASSWORD = import.meta.env.TEST_USER_PASSWORD || 'Test123456!';
let TEST_USER_ID: string; // UUID dynamique récupéré après login

async function createTestUser() {
  // ⚠️ CRITIQUE: S'authentifier sur le client supabase global pour que toutes les requêtes suivantes
  // utilisent cette session (important pour RLS)
  let authData = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  // Si échec login, créer le user
  if (authData.error) {
    console.log('⚠️ User not found, creating test user...');
    const signupResult = await supabase.auth.signUp({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'RGPD'
        }
      }
    });

    if (signupResult.error) {
      throw new Error(`Cannot create test user: ${signupResult.error.message}`);
    }

    authData = signupResult;
    
    // ✅ IMPORTANT: Après signup, se reconnecter pour obtenir une session valide
    const loginResult = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });
    
    if (loginResult.error) {
      throw new Error(`Cannot sign in after signup: ${loginResult.error.message}`);
    }
    
    authData = loginResult;
  }

  if (!authData.data.user) {
    throw new Error('No user returned from auth');
  }

  TEST_USER_ID = authData.data.user.id;
  
  // ✅ Vérifier que la session est bien active
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session after authentication');
  }
  
  console.log(`✅ Test user ready: ${TEST_USER_ID} (session active: ${!!session})`);

  // Vérifier/créer profil
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', TEST_USER_ID)
    .single();

  if (!profile) {
    await supabase
      .from('user_profiles')
      .insert({
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        first_name: 'Test',
        last_name: 'RGPD',
      });
  }

  return authData.data.user;
}

async function createTestData(userId: string) {
  // ⚠️ IMPORTANT: Utiliser supabaseTest avec la session authentifiée de l'utilisateur
  // Les RLS policies permettront l'insertion car l'utilisateur est connecté
  
  // ✅ Chercher via user_companies (car RLS bloque SELECT direct sur companies)
  const { data: userCompanyData, error: fetchError } = await supabase
    .from('user_companies')
    .select('company_id, companies(*)')
    .eq('user_id', userId)
    .limit(1)
    .single();
  
  if (fetchError) {
    console.error('❌ Failed to fetch user companies:', fetchError);
  }
  
  let company;
  
  if (userCompanyData && userCompanyData.companies) {
    // Utiliser company existante
    company = userCompanyData.companies as any;
    console.log(`✅ Using existing company: ${company.id} (${company.name})`);
  } else {
    // Aucune company trouvée - essayer d'en créer une
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Test Company RGPD',
        country: 'FR',
        created_by: userId,
      })
      .select()
      .single();

    if (companyError || !newCompany) {
      console.error('❌ Company creation failed:', companyError);
      throw new Error(`Cannot find or create test company. 
      
⚠️ Vérifier que l'utilisateur ${userId} (necete8238@okcdeals.com) a bien une company associée dans user_companies.`);
    }
    
    company = newCompany;
    console.log(`✅ Test company created: ${company.id}`);

    // Associer user à company
    await supabase
      .from('user_companies')
      .insert({
        user_id: userId,
        company_id: company.id,
        role: 'owner'
      });
  }

  // Créer écriture comptable
  await supabase
    .from('journal_entries')
    .insert({
      company_id: company!.id,
      journal_id: 'test-journal',
      entry_number: 'TEST001',
      entry_date: new Date().toISOString(),
      fiscal_year: new Date().getFullYear().toString(),
      description: 'Test entry',
      debit_amount: 100,
      credit_amount: 100,
      created_by: userId
    });

  // Créer facture
  await supabase
    .from('invoices')
    .insert({
      company_id: company!.id,
      invoice_number: 'INV-TEST-001',
      invoice_date: new Date().toISOString(),
      total_ht: 100,
      total_ttc: 120,
      currency: 'EUR',
      status: 'draft',
      created_by: userId
    });

  return company;
}

async function cleanupTestData() {
  // Supprimer toutes les données de test
  await supabase.from('journal_entries').delete().eq('created_by', TEST_USER_ID);
  await supabase.from('invoices').delete().eq('created_by', TEST_USER_ID);
  await supabase.from('user_companies').delete().eq('user_id', TEST_USER_ID);
  // Supprimer directement les companies créées pour ce test (simplification)
  // On ne filtre plus par nom pour éviter les problèmes de méthodes manquantes
  await supabase.from('user_profiles').delete().eq('id', TEST_USER_ID);
}

// ========================================
// TESTS ARTICLE 15 - DROIT D'ACCÈS
// ========================================

describeRgpd('RGPD - Article 15: Droit d\'accès', () => {
  beforeEach(async () => {
    await cleanupTestData();
    await createTestUser();
    await createTestData(TEST_USER_ID);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('✅ Exporte toutes les données personnelles utilisateur', async () => {
    const exportData = await exportUserData(TEST_USER_ID);

    expect(exportData).toBeDefined();
    expect(exportData.profile.email).toBe(TEST_USER_EMAIL);
    expect(exportData.profile.first_name).toBe('Test');
    expect(exportData.profile.last_name).toBe('RGPD');
  });

  it('✅ Export contient les entreprises associées', async () => {
    const exportData = await exportUserData(TEST_USER_ID);

    expect(exportData.companies).toBeDefined();
    expect(exportData.companies.length).toBeGreaterThan(0);
    expect(exportData.companies[0]).toHaveProperty('name');
    expect(exportData.companies[0]).toHaveProperty('role');
  });

  it('✅ Export contient les statistiques données métier', async () => {
    const exportData = await exportUserData(TEST_USER_ID);

    expect(exportData.business_data).toBeDefined();
    expect(exportData.business_data.invoices_count).toBeGreaterThanOrEqual(0);
    expect(exportData.business_data.journal_entries_count).toBeGreaterThanOrEqual(0);
    expect(exportData.business_data.contacts_count).toBeGreaterThanOrEqual(0);
  });

  it('✅ Export contient métadonnées RGPD', async () => {
    const exportData = await exportUserData(TEST_USER_ID);

    expect(exportData.export_metadata).toBeDefined();
    expect(exportData.export_metadata.format).toBe('JSON');
    expect(exportData.export_metadata.rgpd_article).toBe('Article 15 & 20');
    expect(exportData.export_metadata.requested_at).toBeDefined();
  });

  it('✅ Export au format JSON valide', async () => {
    const exportData = await exportUserData(TEST_USER_ID);
    const jsonString = JSON.stringify(exportData);
    const parsed = JSON.parse(jsonString);

    expect(parsed).toEqual(exportData);
  });
});

// ========================================
// TESTS ARTICLE 17 - DROIT À L'EFFACEMENT
// ========================================

describeRgpd('RGPD - Article 17: Droit à l\'effacement', () => {
  beforeEach(async () => {
    await cleanupTestData();
    await createTestUser();
    await createTestData(TEST_USER_ID);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('✅ Supprime le profil utilisateur', async () => {
    const result = await deleteUserAccount(TEST_USER_ID);

    expect(result.success).toBe(true);
    expect(result.deleted_items.profile).toBe(true);

    // Vérifier suppression en base
    const { data } = await supabase
      .from('user_profiles')
      .select()
      .eq('id', TEST_USER_ID);

    expect(data).toHaveLength(0);
  });

  it('✅ Anonymise les écritures comptables (obligation légale)', async () => {
    const result = await deleteUserAccount(TEST_USER_ID);

    expect(result.success).toBe(true);
    expect(result.anonymized_items.journal_entries).toBeGreaterThan(0);

    // Vérifier anonymisation
    const { data: entries } = await supabase
      .from('journal_entries')
      .select('created_by')
      .eq('entry_number', 'TEST001');

    if (entries && entries.length > 0) {
      expect(entries[0].created_by).toBe('00000000-0000-0000-0000-000000000000');
    }
  });

  it('✅ Anonymise les factures', async () => {
    const result = await deleteUserAccount(TEST_USER_ID);

    expect(result.success).toBe(true);
    expect(result.anonymized_items.invoices).toBeGreaterThan(0);

    // Vérifier anonymisation
    const { data: invoices } = await supabase
      .from('invoices')
      .select('created_by')
      .eq('invoice_number', 'INV-TEST-001');

    if (invoices && invoices.length > 0) {
      expect(invoices[0].created_by).toBe('00000000-0000-0000-0000-000000000000');
    }
  });

  it('✅ Supprime les relations user_companies', async () => {
    const result = await deleteUserAccount(TEST_USER_ID);

    expect(result.success).toBe(true);
    expect(result.deleted_items.user_companies).toBeGreaterThan(0);

    // Vérifier suppression
    const { data } = await supabase
      .from('user_companies')
      .select()
      .eq('user_id', TEST_USER_ID);

    expect(data).toHaveLength(0);
  });

  it('✅ Retourne statistiques suppression détaillées', async () => {
    const result = await deleteUserAccount(TEST_USER_ID);

    expect(result).toHaveProperty('deleted_items');
    expect(result).toHaveProperty('anonymized_items');
    expect(result.deleted_items.profile).toBe(true);
    expect(typeof result.deleted_items.user_companies).toBe('number');
    expect(typeof result.anonymized_items.journal_entries).toBe('number');
  });
});

// ========================================
// TESTS RÉVOCATION CONSENTEMENT
// ========================================

describeRgpd('RGPD - Révocation consentement cookies', () => {
  it('✅ Révoque le consentement analytics', async () => {
    const success = await revokeCookieConsent(TEST_USER_ID);
    expect(success).toBe(true);
  });

  it('✅ Supprime les préférences localStorage', async () => {
    // Mock localStorage
    const localStorageMock = {
      store: {} as Record<string, string>,
      removeItem(key: string) {
        delete this.store[key];
      },
      getItem(key: string) {
        return this.store[key] || null;
      }
    };

    global.localStorage = localStorageMock as any;
    localStorageMock.store['casskai_cookie_preferences'] = '{"analytics":true}';

    await revokeCookieConsent(TEST_USER_ID);

    expect(localStorageMock.getItem('casskai_cookie_preferences')).toBeNull();
  });
});

// ========================================
// TESTS PERFORMANCES
// ========================================

describeRgpd('RGPD - Performances', () => {
  beforeEach(async () => {
    await cleanupTestData();
    await createTestUser();
    await createTestData(TEST_USER_ID);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('⚡ Export données < 3 secondes', async () => {
    const start = Date.now();
    await exportUserData(TEST_USER_ID);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000);
  }, 5000);

  it('⚡ Suppression compte < 5 secondes', async () => {
    const start = Date.now();
    await deleteUserAccount(TEST_USER_ID);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  }, 10000);
});

// ========================================
// TESTS ERREURS
// ========================================

describeRgpd('RGPD - Gestion erreurs', () => {
  it('❌ Export échoue si user inexistant', async () => {
    await expect(exportUserData('user-inexistant-999')).rejects.toThrow();
  });

  it('❌ Suppression échoue proprement si erreur', async () => {
    const result = await deleteUserAccount('user-inexistant-999');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
