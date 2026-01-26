/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import { createClient } from '@supabase/supabase-js';

import { logger } from '@/lib/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');
}

// Conservative custom fetch wrapper to rewrite problematic PostgREST `select=` embeds
// This avoids PGRST200/PGRST201 errors when the DB schema or relationship cache
// does not contain the expected FK relationships. It rewrites only a few
// well-known cases (invoices -> suppliers, journal_entries -> journals, contacts->customers)
// to safer selects (use foreign key id fields instead of embedded relations).
const customFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> = async (input, init) => {
  try {
    const original = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
    let url = original;
    try {
      const u = new URL(original);
      const sel = u.searchParams.get('select');
      if (sel) {
        const decoded = decodeURIComponent(sel);
        let replaced = decoded;
        // invoices embedding suppliers -> many apps used supplier:suppliers(name) etc.
        if (u.pathname.includes('/rest/v1/invoices') && /(?:\w+:)?suppliers(?:![\w_]+)?\([^)]*\)/.test(decoded)) {
          // Replace any suppliers(...) embed with supplier_id to avoid FK dependency
          replaced = replaced.replace(/(?:\w+:)?suppliers(?:![\w_]+)?\([^)]*\)/g, 'supplier_id');
        }
        // journal_entries embedding journals -> force using journal_id instead of embedded journal object
        if (u.pathname.includes('/rest/v1/journal_entries') && /journals\(/.test(decoded)) {
          replaced = replaced.replace(/journals\([^)]*\)/g, 'journal_id');
        }
        // legacy contacts embed -> use customer_id
        if (u.pathname.includes('/rest/v1/invoices') && /contacts\(/.test(decoded)) {
          replaced = replaced.replace(/contacts\([^)]*\)/g, 'customer_id');
        }
        if (replaced !== decoded) {
          u.searchParams.set('select', encodeURIComponent(replaced));
          url = u.toString();
        }
      }
    } catch (_err) {
      // ignore URL parsing errors and fall back to original
      url = original;
    }
    const fetchInput = typeof input === 'string' ? url : new Request(url, init ?? (input as Request).clone());
    return await (globalThis.fetch as typeof fetch)(fetchInput, init);
  } catch (_err) {
    return await (globalThis.fetch as typeof fetch)(input, init);
  }
};

// Create Supabase client with proper configuration and attach custom fetch
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: { schema: 'public' },
  global: {
    headers: {
      'x-application-name': 'CassKai',
      apikey: supabaseAnonKey,
    },
  },
  fetch: customFetch as unknown as typeof fetch,
} as unknown as any);

// Export raw values for services needing explicit headers (fallback fetch)
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;



// Utility function to handle Supabase errors

export const handleSupabaseError = (error: unknown) => {

  logger.error('Supabase', 'Supabase error', error);



  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {

    if (error.message.includes('JWT')) {

      return 'Session expired. Please log in again.';

    }



    if (error.message.includes('Row Level Security')) {

      return 'Access denied. You don\'t have permission for this operation.';

    }



    return error.message;

  }



  return 'An unexpected error occurred.';

};



// Helper function to get current user's companies

export const getUserCompanies = async (userId?: string) => {

  let resolvedUserId = userId;

  if (!resolvedUserId) {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {

      throw new Error('User not authenticated');

    }

    resolvedUserId = user.id;

  }



  const { data, error } = await supabase

    .from('user_companies')

    .select(`

      *,

      companies:company_id (

        id,

        name,

        country,

        default_currency,

        default_locale,

        timezone,

        is_active

      )

    `)

  .eq('user_id', resolvedUserId);



  if (error) {

    // Gestion gracieuse des erreurs RLS/500 - permet l'onboarding

    if (error.message?.includes('500') ||

        error.message?.includes('policy') ||

        error.message?.includes('RLS') ||

        error.code === '42P17') {

      logger.warn('Supabase', 'RLS/Policy error in getUserCompanies - returning empty array for onboarding');

      return [];

    }

    throw new Error(handleSupabaseError(error));

  }



  return data || [];

};



// Helper function to get current user's default company

export const getCurrentCompany = async (userId?: string) => {

  const companies = await getUserCompanies(userId);

  const defaultCompany = companies.find(uc => uc.is_default);

  return defaultCompany?.companies || companies[0]?.companies || null;

};



export default supabase;

// Normalize Supabase responses that sometimes return parser error strings
export function normalizeData<T>(maybeData: unknown): T[] {
  if (!maybeData) return [];
  // If it's an array, filter out any parser-error-like entries
  if (Array.isArray(maybeData)) {
    return maybeData.filter(item => {
      if (!item) return false;
      if (typeof item === 'object') {
        // Parser errors sometimes are { error: true } & string-like; treat those as invalid
        // Keep items that have own properties beyond 'error'
        const keys = Object.keys(item as Record<string, unknown>);
        if (keys.length === 1 && keys[0] === 'error') return false;
        return true;
      }
      // Strings/other primitives are not valid data rows
      return false;
    }) as unknown as T[];
  }
  // If a single object was returned (RPC or .single()), normalize it into an array
  if (typeof maybeData === 'object') {
    const obj = maybeData as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 1 && keys[0] === 'error') return [];
    return [maybeData as T];
  }
  return [];
}
