/**
 * Utility functions for generating URL-friendly slugs
 */

/**
 * Converts a string to a URL-friendly slug
 * @param text - The input text to convert
 * @returns A clean, URL-friendly slug
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove accents and special characters
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Remove apostrophes and quotes
    .replace(/['''""]/g, '')
    // Keep only alphanumeric characters and hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts a title to a documentation URL path
 * @param title - The article or category title
 * @param type - The type of content ('article' | 'category')
 * @returns A complete URL path
 */
export function generateDocPath(title: string, type: 'article' | 'category' = 'article'): string {
  const slug = generateSlug(title);
  return `/docs/${type}/${slug}`;
}

/**
 * Extracts the slug from a URL path
 * @param path - The URL path
 * @returns The slug portion of the path
 */
export function extractSlugFromPath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * Validates if a string is a valid slug
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  
  // A valid slug should only contain lowercase letters, numbers, and hyphens
  // It should not start or end with a hyphen
  const slugRegex = /^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100;
}

/**
 * Creates a unique slug by appending a number if the slug already exists
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 */
export function createUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = generateSlug(baseSlug);
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${generateSlug(baseSlug)}-${counter}`;
    counter++;
  }
  
  return slug;
}