import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Singleton Supabase client for tests to avoid multiple GoTrueClient instances
let client: SupabaseClient | null = null;

export const getSupabaseTestClient = (): SupabaseClient => {
  if (client) return client;
  const url = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
  const anon = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';
  client = createClient(url, anon);
  return client;
};

export default getSupabaseTestClient;
