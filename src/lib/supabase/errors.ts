import { logger } from '@/utils/logger';
/**
 * Error handling utilities for Supabase operations
 */

/**
 * Handles Supabase errors and converts them to user-friendly messages
 * @param error - The error object from Supabase
 * @returns A user-friendly error message
 */
export const handleSupabaseError = (error: unknown): string => {
  logger.error('Supabase error:', error);

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

/**
 * Checks if an error is related to RLS/Policy issues
 * Useful for graceful handling during onboarding
 * @param error - The error object to check
 * @returns True if the error is RLS/Policy related
 */
export const isRLSError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return false;
  }

  const message = typeof error.message === 'string' ? error.message : '';
  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';

  return (
    message.includes('500') ||
    message.includes('policy') ||
    message.includes('RLS') ||
    code === '42P17'
  );
};
