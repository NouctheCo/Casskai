/**
 * Configuration centralisée de tous les liens de l'application
 * Utiliser ces constantes pour éviter les liens cassés
 */

export const EXTERNAL_LINKS = {
  // Documentation
  documentation: '/docs',
  documentationGettingStarted: '/docs/premiers-pas',
  documentationApi: '/docs/api-et-webhooks',
  apiDocs: 'https://docs.casskai.app/api',

  // Support & Aide
  support: '/support',
  helpCenter: '/help',
  faq: '/faq',
  tutorials: '/tutorials',

  // Social & Communauté
  youtubeChannel: 'https://youtube.com/@casskai_app',
  community: 'https://community.casskai.app',
  betaForm: 'https://docs.google.com/forms/d/e/1FAIpQLSeP1H29iZLZ7CgEnJz-Mey9wZDWij0NVZ42EK-mqmbjb5vqzg/viewform',

  // Légal
  legal: '/legal',
  terms: '/terms-of-service',
  termsOfSale: '/terms-of-sale',
  privacy: '/privacy-policy',
  cookies: '/cookies-policy',
  gdpr: '/gdpr',

  // Autre
  roadmap: '/roadmap',
  pricing: '/pricing',
  systemStatus: '/system-status',

  // Contact
  supportEmail: 'support@casskai.app',
  supportPhone: '+33752027198',
  feedbackEmail: 'feedback@casskai.com',
  dpoEmail: 'dpo@casskai.com',

  // Site web
  website: 'https://casskai.app',
} as const;

/**
 * Ouvre un lien externe dans un nouvel onglet de manière sécurisée
 * Pour les liens internes, retourne simplement le chemin
 */
export const openExternalLink = (url: string): void | string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  return url;
};

/**
 * Vérifie si un lien est externe
 */
export const isExternalLink = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

/**
 * Crée un lien mailto sécurisé
 */
export const createMailtoLink = (
  email: string,
  subject?: string,
  body?: string
): string => {
  let link = `mailto:${email}`;
  const params = new URLSearchParams();

  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);

  const queryString = params.toString();
  if (queryString) {
    link += `?${queryString}`;
  }

  return link;
};

/**
 * Crée un lien tel sécurisé
 */
export const createTelLink = (phone: string): string => {
  return `tel:${phone.replace(/\s/g, '')}`;
};
