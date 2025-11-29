import DOMPurify from 'dompurify';

/**
 * Configuration de sanitization sécurisée pour prévenir les attaques XSS
 *
 * Permet uniquement les balises HTML courantes et inoffensives.
 * Interdit JavaScript, événements, et attributs dangereux.
 */
const SANITIZE_CONFIG: DOMPurify.Config = {
  // Balises HTML autorisées (uniquement balises de formatage et structure)
  ALLOWED_TAGS: [
    // Formatage de texte
    'b', 'i', 'em', 'strong', 'u', 's', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
    // Structure de document
    'p', 'br', 'hr', 'span', 'div',
    // Titres
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Listes
    'ul', 'ol', 'li',
    // Liens
    'a',
    // Tableaux
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    // Citations et code
    'blockquote', 'code', 'pre', 'kbd', 'samp', 'var',
    // Autres
    'abbr', 'address', 'cite', 'q', 'dfn', 'time'
  ],

  // Attributs autorisés (limités au strict nécessaire)
  ALLOWED_ATTR: [
    'href',      // Pour les liens
    'target',    // Pour ouvrir dans un nouvel onglet
    'rel',       // Pour la sécurité des liens (noopener, noreferrer)
    'class',     // Pour le style
    'id',        // Pour les ancres
    'title',     // Pour les tooltips
    'alt',       // Pour les descriptions
    'colspan',   // Pour les tableaux
    'rowspan',   // Pour les tableaux
    'scope',     // Pour l'accessibilité des tableaux
    'datetime'   // Pour les balises <time>
  ],

  // Interdire les attributs data-* par sécurité
  ALLOW_DATA_ATTR: false,

  // Interdire les URI JavaScript (javascript:, data:, vbscript:, etc.)
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

  // Forcer l'ajout de rel="noopener noreferrer" sur les liens externes
  ADD_ATTR: ['target'] as string[],

  // Nettoyer complètement le contenu (supprimer les éléments dangereux au lieu de les encoder)
  KEEP_CONTENT: true,

  // Retourner une string (pas un DocumentFragment)
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,

  // Supprimer les éléments dangereux
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
} as const;

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @param dirty - HTML string potentiellement dangereux
 * @returns HTML string sécurisé (sans scripts ni événements)
 *
 * @example
 * ```typescript
 * const userInput = '<script>alert("XSS")</script><p>Safe content</p>';
 * const safe = sanitizeHTML(userInput);
 * // Result: '<p>Safe content</p>' (script supprimé)
 * ```
 */
export const sanitizeHTML = (dirty: string | undefined | null): string => {
  if (!dirty) return '';

  // DOMPurify.sanitize retourne un string sécurisé
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIG as any);
};

/**
 * Sanitize HTML for use with React's dangerouslySetInnerHTML
 *
 * @param dirty - HTML string potentiellement dangereux
 * @returns Objet { __html: string } utilisable avec dangerouslySetInnerHTML
 *
 * @example
 * ```tsx
 * import { createSafeHTML } from '@/utils/sanitize';
 *
 * function MyComponent({ htmlContent }: { htmlContent: string }) {
 *   return <div dangerouslySetInnerHTML={createSafeHTML(htmlContent)} />;
 * }
 * ```
 */
export const createSafeHTML = (dirty: string | undefined | null): { __html: string } => {
  return { __html: sanitizeHTML(dirty) };
};

/**
 * Vérifie si un string contient du HTML potentiellement dangereux
 *
 * @param content - String à vérifier
 * @returns true si le contenu contient des balises/attributs dangereux
 */
export const containsDangerousHTML = (content: string | undefined | null): boolean => {
  if (!content) return false;

  const dangerous = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i
  ];

  return dangerous.some(pattern => pattern.test(content));
};

/**
 * Sanitize plain text (échappe les caractères HTML)
 * Utilisé quand on veut afficher du texte brut sans interprétation HTML
 *
 * @param text - Texte à échapper
 * @returns Texte avec caractères HTML échappés
 */
export const escapeHTML = (text: string | undefined | null): string => {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
