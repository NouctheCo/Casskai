/**
 * Fix script to activate unaccent extension on Supabase
 * Fixes: Error during onboarding - "function unaccent(text) does not exist"
 * 
 * Run this script from the browser console or as a Node.js script to apply the fix
 */
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
const SUPABASE_URL = 'https://smtdtgrymuzwvctattmx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdGR0Z3J5bXV6d3ZjdGF0dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzYwMjMsImV4cCI6MjA3MDE1MjAyM30.7SefKj_zSbmaYNbrai9sKeGqcPZtcaXENdA4bNrXa5I';
export async function fixUnaccentExtension() {
  try {
    logger.debug('FixUnaccentExtension', '🔧 Activating unaccent extension on Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    });
    // We'll need to use a service role key to execute SQL directly
    // For now, this is a placeholder - the actual fix needs to be done via Supabase CLI or service_role_key
    logger.debug('FixUnaccentExtension', '⚠️ NOTE: This fix requires service_role access');
    logger.debug('FixUnaccentExtension', '📋 The following SQL needs to be executed in Supabase SQL Editor:');
    logger.debug('fixUnaccentExtension', `
-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;
-- Create the unaccent extension
CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA extensions;
-- Ensure search_path includes extensions
ALTER ROLE postgres SET search_path = public, extensions, auth, storage;
-- Test the extension
SELECT unaccent('Créée');
    `);
    return {
      success: false,
      message: 'Service role key required - please run SQL in Supabase console',
      requiresManualFix: true
    };
  } catch (error) {
    logger.error('FixUnaccentExtension', '❌ Error fixing unaccent:', error);
    throw error;
  }
}
// If running in browser, make function globally available
if (typeof window !== 'undefined') {
  window.fixUnaccentExtension = fixUnaccentExtension;
  logger.debug('FixUnaccentExtension', '✅ fixUnaccentExtension available as window.fixUnaccentExtension()');
}
