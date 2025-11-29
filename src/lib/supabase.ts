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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {

  throw new Error('Missing environment variable: VITE_SUPABASE_URL');

}



if (!supabaseAnonKey) {

  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY');

}



// Create Supabase client with proper configuration

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {

  auth: {

    autoRefreshToken: true,

    persistSession: true,

    detectSessionInUrl: true,

  },

  db: {

    schema: 'public',

  },

  global: {

    headers: {

      'x-application-name': 'CassKai',

    },

  },

});



// Utility function to handle Supabase errors

export const handleSupabaseError = (error: unknown) => {

  console.error('Supabase error:', error);

  

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

      console.warn('🔄 RLS/Policy error in getUserCompanies - returning empty array for onboarding');

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
