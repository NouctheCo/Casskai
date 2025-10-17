/**
 * Supabase module - Organized exports
 *
 * This module provides a clean interface to Supabase functionality:
 * - config: Supabase client configuration and initialization
 * - errors: Error handling utilities
 * - helpers: Common helper functions for database operations
 */

// Export the main Supabase client
export { supabase, supabase as default } from './config';

// Export error handling utilities
export { handleSupabaseError, isRLSError } from './errors';

// Export helper functions
export { getUserCompanies, getCurrentCompany } from './helpers';
