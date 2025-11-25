import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = 'CassKai - Plateforme de gestion financière et comptable tout-en-un pour PME et indépendants. Facturation, comptabilité, reporting en temps réel.',
  keywords = [
    'comptabilité',
    'gestion financière',
    'facturation',
    'PME',
    'indépendants',
    'logiciel comptable',
    'SaaS comptable',
    'FEC',
    'RGPD',
  ],
  ogImage = '/og-image.png',
  ogType = 'website',
  canonical,
  noindex = false,
  jsonLd,
}) => {
  const location = useLocation();

  const fullTitle = title ? `${title} | CassKai` : 'CassKai - Gestion Financière pour PME';
  const baseUrl = 'https://casskai.fr';
  const currentUrl = canonical || `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', description, false);
    updateMetaTag('keywords', keywords.join(', '), false);

    // Open Graph tags
    updateMetaTag('og:title', fullTitle);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', `${baseUrl}${ogImage}`);
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:type', ogType);
    updateMetaTag('og:site_name', 'CassKai');
    updateMetaTag('og:locale', 'fr_FR');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', false);
    updateMetaTag('twitter:title', fullTitle, false);
    updateMetaTag('twitter:description', description, false);
    updateMetaTag('twitter:image', `${baseUrl}${ogImage}`, false);

    // Robots
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow', false);
    } else {
      updateMetaTag('robots', 'index, follow', false);
    }

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = currentUrl;

    // JSON-LD structured data
    if (jsonLd) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }
  }, [fullTitle, description, keywords, ogImage, ogType, currentUrl, noindex, jsonLd]);

  return null;
};

// Pre-configured SEO for common pages
export const LandingPageSEO = () => (
  <SEO
    title="Accueil"
    description="CassKai - La solution complète de gestion financière pour les PME et indépendants. Facturation intelligente, comptabilité automatisée, reporting en temps réel. Essai gratuit 14 jours."
    keywords={[
      'logiciel comptable',
      'gestion PME',
      'facturation en ligne',
      'comptabilité automatisée',
      'SaaS comptabilité',
      'gestion financière',
    ]}
    jsonLd={{
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'CassKai',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '29',
        priceCurrency: 'EUR',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '127',
      },
    }}
  />
);

export const PricingPageSEO = () => (
  <SEO
    title="Tarifs"
    description="Tarifs transparents pour CassKai. Essai gratuit 14 jours, puis 29€/mois pour les 100 premiers clients Beta. Sans engagement, annulation à tout moment."
    keywords={['prix logiciel comptable', 'tarif comptabilité', 'abonnement casskai']}
  />
);

export const FAQPageSEO = () => (
  <SEO
    title="FAQ - Questions fréquentes"
    description="Trouvez rapidement des réponses à vos questions sur CassKai : facturation, comptabilité, RGPD, abonnement, et support technique."
    keywords={['faq comptabilité', 'questions casskai', 'aide logiciel comptable']}
    jsonLd={{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Qu'est-ce que CassKai ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'CassKai est une plateforme SaaS complète de gestion financière pour les PME et indépendants.',
          },
        },
      ],
    }}
  />
);

export const LegalPageSEO = () => (
  <SEO
    title="Mentions Légales"
    description="Mentions légales, CGU, politique de confidentialité et informations RGPD de CassKai. Noutche Conseil SAS - 12 rue Jean-Baptiste Charcot, 91300 Massy."
    keywords={['mentions légales casskai', 'cgu', 'rgpd', 'confidentialité']}
    noindex={true}
  />
);

export const RoadmapPageSEO = () => (
  <SEO
    title="Roadmap - Feuille de route"
    description="Découvrez les fonctionnalités à venir sur CassKai : application mobile, OCR IA, multi-sociétés, synchronisation bancaire. Votez pour vos fonctionnalités préférées !"
    keywords={['roadmap casskai', 'fonctionnalités à venir', 'nouveautés comptabilité']}
  />
);
