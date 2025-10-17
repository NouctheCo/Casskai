/**
 * @deprecated This file is kept for backwards compatibility.
 * New code should import from '@/lib/supabase' which uses the modular structure.
 *
 * Migration path:
 * - import { supabase } from '@/lib/supabase.ts' -> import { supabase } from '@/lib/supabase'
 * - import supabase from '@/lib/supabase.ts' -> import supabase from '@/lib/supabase'
 */

// Re-export from the new modular structure
export { supabase, supabase as default } from './supabase/index';
export { handleSupabaseError, isRLSError } from './supabase/index';
export { getUserCompanies, getCurrentCompany } from './supabase/index';