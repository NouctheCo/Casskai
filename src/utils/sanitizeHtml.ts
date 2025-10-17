import DOMPurify from 'dompurify';

// Derive the Config type from the DOMPurify.sanitize function parameter
type Config = Parameters<typeof DOMPurify.sanitize>[1];

/**
 * Sanitize HTML content in a way that is safe for both browser and SSR contexts.
 * When server-side rendering (no window object), we simply return the original
 * string so that sanitation can happen client-side once the DOM is available.
 */
export function sanitizeHtml(content: string, config?: Config): string {
  if (typeof window === 'undefined') {
    return content;
  }

  return DOMPurify.sanitize(content, config);
}

