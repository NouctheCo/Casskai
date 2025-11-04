import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  url?: string;
  siteName?: string;
  locale?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  canonical?: string;
  robots?: string;
  structuredData?: Record<string, any>;
}

const DEFAULT_SEO: SEOConfig = {
  title: 'CassKai - Gestion Financière PME',
  description: 'Solution complète de gestion financière pour PME et indépendants. Comptabilité, facturation, banque, fiscalité tout-en-un.',
  keywords: ['comptabilité', 'facturation', 'gestion financière', 'PME', 'ERP', 'supabase'],
  image: '/og-image.png',
  type: 'website',
  siteName: 'CassKai',
  locale: 'fr_FR',
  robots: 'index, follow',
};

// Configuration SEO par route
const ROUTE_SEO_CONFIG: Record<string, Partial<SEOConfig>> = {
  '/': {
    title: 'CassKai - Accueil | Gestion Financière PME',
    description: 'Découvrez CassKai, la solution complète de gestion financière pour PME. Comptabilité, facturation, analyses financières en un seul outil.',
    keywords: ['accueil', 'CassKai', 'gestion PME', 'solution financière'],
    type: 'website',
  },
  '/landing': {
    title: 'CassKai - Solution de Gestion Financière pour PME',
    description: 'Simplifiez la gestion de votre entreprise avec CassKai. Comptabilité automatisée, facturation intelligente, tableau de bord en temps réel.',
    keywords: ['PME', 'gestion d\'entreprise', 'comptabilité automatisée', 'facturation'],
    type: 'website',
  },
  '/dashboard': {
    title: 'Tableau de Bord - CassKai',
    description: 'Vue d\'ensemble de votre activité financière. Indicateurs clés, graphiques de performance et alertes en temps réel.',
    keywords: ['tableau de bord', 'KPI', 'indicateurs financiers', 'performance'],
    robots: 'noindex, nofollow', // Page privée
  },
  '/accounting': {
    title: 'Comptabilité - CassKai',
    description: 'Gestion comptable complète : plan comptable, écritures, journaux, balance et grand livre. Conforme aux normes françaises.',
    keywords: ['comptabilité', 'plan comptable', 'écritures comptables', 'journaux', 'balance'],
    robots: 'noindex, nofollow',
  },
  '/invoicing': {
    title: 'Facturation - CassKai',
    description: 'Créez et gérez vos devis et factures facilement. Suivi des paiements, relances automatiques et conformité légale.',
    keywords: ['facturation', 'devis', 'factures', 'paiements', 'relances'],
    robots: 'noindex, nofollow',
  },
  '/banks': {
    title: 'Rapprochement Bancaire - CassKai',
    description: 'Synchronisez vos comptes bancaires, automatisez le rapprochement et suivez vos flux de trésorerie en temps réel.',
    keywords: ['banque', 'rapprochement bancaire', 'trésorerie', 'flux financiers'],
    robots: 'noindex, nofollow',
  },
  '/reports': {
    title: 'Rapports Financiers - CassKai',
    description: 'Générez des rapports financiers détaillés : bilan, compte de résultat, tableau de flux de trésorerie.',
    keywords: ['rapports financiers', 'bilan', 'compte de résultat', 'analyse financière'],
    robots: 'noindex, nofollow',
  },
  '/tax': {
    title: 'Gestion Fiscale - CassKai',
    description: 'Préparez vos déclarations fiscales, calculez la TVA et optimisez votre fiscalité d\'entreprise.',
    keywords: ['fiscalité', 'TVA', 'déclarations fiscales', 'optimisation fiscale'],
    robots: 'noindex, nofollow',
  },
  '/auth': {
    title: 'Connexion - CassKai',
    description: 'Connectez-vous à votre compte CassKai pour accéder à votre espace de gestion financière sécurisé.',
    keywords: ['connexion', 'authentification', 'compte utilisateur'],
    robots: 'noindex, nofollow',
  },
  '/settings': {
    title: 'Paramètres - CassKai',
    description: 'Configurez votre compte et personnalisez votre expérience CassKai selon vos besoins.',
    keywords: ['paramètres', 'configuration', 'personnalisation'],
    robots: 'noindex, nofollow',
  },
};

export const useSEO = (config?: Partial<SEOConfig>) => {
  const location = useLocation();

  useEffect(() => {
    const routeConfig = ROUTE_SEO_CONFIG[location.pathname] || {};
    const finalConfig = { ...DEFAULT_SEO, ...routeConfig, ...config };

    updateMetaTags(finalConfig);
    updateStructuredData(finalConfig);

    // Clean up function pour restaurer les tags par défaut si nécessaire
    return () => {
      // Optionnel: restaurer les meta tags par défaut
    };
  }, [location.pathname, config]);
};

const updateMetaTags = (config: SEOConfig) => {
  // Title
  if (config.title) {
    document.title = config.title;
    setMetaProperty('og:title', config.title);
    setMetaProperty('twitter:title', config.title);
  }

  // Description
  if (config.description) {
    setMetaContent('description', config.description);
    setMetaProperty('og:description', config.description);
    setMetaProperty('twitter:description', config.description);
  }

  // Keywords
  if (config.keywords?.length) {
    setMetaContent('keywords', config.keywords.join(', '));
  }

  // Image
  if (config.image) {
    const fullImageUrl = config.image.startsWith('http') 
      ? config.image 
      : `${window.location.origin}${config.image}`;
    
    setMetaProperty('og:image', fullImageUrl);
    setMetaProperty('twitter:image', fullImageUrl);
    setMetaProperty('twitter:card', 'summary_large_image');
  }

  // URL
  const currentUrl = config.url || window.location.href;
  setMetaProperty('og:url', currentUrl);
  setMetaProperty('twitter:url', currentUrl);

  // Type
  if (config.type) {
    setMetaProperty('og:type', config.type);
  }

  // Site Name
  if (config.siteName) {
    setMetaProperty('og:site_name', config.siteName);
  }

  // Locale
  if (config.locale) {
    setMetaProperty('og:locale', config.locale);
  }

  // Author
  if (config.author) {
    setMetaContent('author', config.author);
    setMetaProperty('article:author', config.author);
  }

  // Published/Modified Time
  if (config.publishedTime) {
    setMetaProperty('article:published_time', config.publishedTime);
  }

  if (config.modifiedTime) {
    setMetaProperty('article:modified_time', config.modifiedTime);
  }

  // Section
  if (config.section) {
    setMetaProperty('article:section', config.section);
  }

  // Tags
  if (config.tags?.length) {
    config.tags.forEach(tag => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'article:tag');
      meta.setAttribute('content', tag);
      document.head.appendChild(meta);
    });
  }

  // Canonical URL
  if (config.canonical) {
    setLinkRel('canonical', config.canonical);
  }

  // Robots
  if (config.robots) {
    setMetaContent('robots', config.robots);
  }

  // Additional Twitter meta
  setMetaContent('twitter:site', '@CassKaiApp');
  setMetaContent('twitter:creator', '@CassKaiApp');

  // Viewport (important pour mobile)
  setMetaContent('viewport', 'width=device-width, initial-scale=1.0, viewport-fit=cover');

  // Theme color
  setMetaContent('theme-color', '#3b82f6');

  // App-specific meta
  setMetaContent('application-name', 'CassKai');
  setMetaContent('apple-mobile-web-app-title', 'CassKai');
  setMetaContent('apple-mobile-web-app-capable', 'yes');
  setMetaContent('apple-mobile-web-app-status-bar-style', 'default');
};

const updateStructuredData = (config: SEOConfig) => {
  // Supprimer les anciennes données structurées
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
  existingScripts.forEach(script => script.remove());

  // Organisation Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CassKai',
    description: config.description,
    url: window.location.origin,
    logo: `${window.location.origin}/logo.png`,
    sameAs: [
      'https://www.linkedin.com/company/casskai',
      'https://twitter.com/CassKaiApp',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+33-1-XX-XX-XX-XX',
      contactType: 'customer support',
      availableLanguage: 'French'
    }
  };

  // Website Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.siteName || 'CassKai',
    description: config.description,
    url: window.location.origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${window.location.origin}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  // Software Application Schema (pour les pages d'application)
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CassKai',
    description: config.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/OnlineOnly'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150'
    }
  };

  // Service Schema (pour les pages de services)
  if (config.section === 'service') {
    const serviceSchema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: config.title,
      description: config.description,
      provider: {
        '@type': 'Organization',
        name: 'CassKai'
      },
      areaServed: {
        '@type': 'Country',
        name: 'France'
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Services de Gestion Financière',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Comptabilité',
              description: 'Gestion comptable complète'
            }
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Facturation',
              description: 'Création et gestion de factures'
            }
          }
        ]
      }
    };

    addStructuredData(serviceSchema);
  }

  // Breadcrumb Schema
  const pathSegments = location.pathname.split('/').filter(Boolean);
  if (pathSegments.length > 0) {
    const breadcrumbItems = pathSegments.map((segment, index) => ({
      '@type': 'ListItem',
      position: index + 2, // +2 because home is position 1
      name: segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' '),
      item: `${window.location.origin}/${pathSegments.slice(0, index + 1).join('/')}`
    }));

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Accueil',
          item: window.location.origin
        },
        ...breadcrumbItems
      ]
    };

    addStructuredData(breadcrumbSchema);
  }

  // Custom structured data
  if (config.structuredData) {
    addStructuredData(config.structuredData);
  }

  // Ajouter les schémas principaux
  addStructuredData(organizationSchema);
  addStructuredData(websiteSchema);
  
  if (location.pathname === '/' || location.pathname === '/landing') {
    addStructuredData(softwareSchema);
  }
};

// Utilitaires pour manipuler les meta tags
const setMetaContent = (name: string, content: string) => {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

const setMetaProperty = (property: string, content: string) => {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

const setLinkRel = (rel: string, href: string) => {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

const addStructuredData = (data: Record<string, any>) => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

// Hook pour générer des meta tags dynamiques basés sur les données
export const useDynamicSEO = (
  data?: {
    title?: string;
    description?: string;
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    tags?: string[];
    image?: string;
  }
) => {
  const updateSEO = (newData: typeof data) => {
    const config: Partial<SEOConfig> = {};
    
    if (newData?.title) {
      config.title = `${newData.title} - CassKai`;
    }
    
    if (newData?.description) {
      config.description = newData.description;
    }
    
    if (newData?.author) {
      config.author = newData.author;
    }
    
    if (newData?.publishedTime) {
      config.publishedTime = newData.publishedTime;
      config.type = 'article';
    }
    
    if (newData?.modifiedTime) {
      config.modifiedTime = newData.modifiedTime;
    }
    
    if (newData?.tags) {
      config.tags = newData.tags;
      config.keywords = [...(DEFAULT_SEO.keywords || []), ...newData.tags];
    }
    
    if (newData?.image) {
      config.image = newData.image;
    }
    
    updateMetaTags({ ...DEFAULT_SEO, ...config });
  };

  return { updateSEO };
};
