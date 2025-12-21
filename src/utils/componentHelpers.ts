/**
 * Common utility functions to improve component readability
 */

/**
 * Formats error messages consistently
 */
export function formatError(error: unknown, context?: string): string {
  if (error instanceof Error) {
    return context ? `${context}: ${error.message}` : error.message;
  }
  return context ? `${context}: Erreur inconnue` : 'Erreur inconnue';
}

/**
 * Safely gets nested object properties
 */
export function safeGet<T>(obj: Record<string, unknown>, path: string, defaultValue: T): T {
  return path.split('.').reduce((current, key) => {
    return (current as Record<string, unknown>)?.[key];
  }, obj) as T ?? defaultValue;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Classnames utility for conditional CSS classes
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Validates required fields
 */
export function validateRequired(fields: Record<string, unknown>): string[] {
  const errors: string[] = [];
  
  Object.entries(fields).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      errors.push(`${key} est requis`);
    }
  });
  
  return errors;
}

/**
 * Truncates text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Formats currency amounts
 */
export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Formats percentages
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}
