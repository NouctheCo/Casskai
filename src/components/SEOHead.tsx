import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';
import { logger } from '@/lib/logger';
interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  keywords?: string[];
  type?: 'website' | 'article' | 'product' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  canonical?: string;
  robots?: string;
  structuredData?: Record<string, any>;
}
export const SEOHead: React.FC<SEOHeadProps> = (props) => {
  useSEO(props);
  return null; // Ce composant ne rend rien, il modifie juste le <head>
};
// Composant pour pages d'article/blog
export const ArticleSEOHead: React.FC<{
  title: string;
  description: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  image?: string;
  tags?: string[];
  section?: string;
}> = ({ title, description, author, publishedTime, modifiedTime, image, tags, section }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: {
      '@type': 'Person',
      name: author
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    image: image ? `${window.location.origin}${image}` : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'CassKai',
      logo: {
        '@type': 'ImageObject',
        url: `${window.location.origin}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': window.location.href
    },
    articleSection: section,
    keywords: tags?.join(', ')
  };
  return (
    <SEOHead
      title={`${title} - CassKai`}
      description={description}
      type="article"
      author={author}
      publishedTime={publishedTime}
      modifiedTime={modifiedTime}
      image={image}
      keywords={tags}
      structuredData={structuredData}
    />
  );
};
// Composant pour pages produit/service
export const ProductSEOHead: React.FC<{
  name: string;
  description: string;
  image?: string;
  price?: string;
  currency?: string;
  availability?: string;
  rating?: {
    value: number;
    count: number;
  };
  brand?: string;
}> = ({ name, description, image, price, currency, availability, rating, brand }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image ? `${window.location.origin}${image}` : undefined,
    brand: {
      '@type': 'Brand',
      name: brand || 'CassKai'
    },
    offers: price ? {
      '@type': 'Offer',
      price,
      priceCurrency: currency || 'EUR',
      availability: availability || 'https://schema.org/OnlineOnly',
      seller: {
        '@type': 'Organization',
        name: 'CassKai'
      }
    } : undefined,
    aggregateRating: rating ? {
      '@type': 'AggregateRating',
      ratingValue: rating.value,
      reviewCount: rating.count
    } : undefined
  };
  return (
    <SEOHead
      title={`${name} - CassKai`}
      description={description}
      type="product"
      image={image}
      structuredData={structuredData}
    />
  );
};
// Hook pour les pages avec données dynamiques
export const useDynamicSEOHead = () => {
  const _location = useLocation();
  // Note: setSEO cannot call useSEO directly as hooks can only be called in React components
  // Use useSEO hook directly in your component instead
  const setSEO = (_config: SEOHeadProps) => {
    // This function is deprecated - use useSEO hook directly
    logger.warn('SEOHead', 'setSEO is deprecated. Use useSEO hook directly in your component.');
  };
  // SEO spécialisé pour les pages d'entreprise
  const setEnterpriseSEO = (enterprise: {
    name: string;
    description?: string;
    sector?: string;
    location?: string;
  }) => {
    setSEO({
      title: `${enterprise.name} - Gestion avec CassKai`,
      description: `Découvrez comment ${enterprise.name} utilise CassKai pour optimiser sa gestion financière${enterprise.sector ? ` dans le secteur ${enterprise.sector}` : ''}.`,
      keywords: ['entreprise', enterprise.sector, 'gestion financière', 'client CassKai'].filter(Boolean) as string[],
      type: 'profile',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: enterprise.name,
        description: enterprise.description,
        location: enterprise.location ? {
          '@type': 'Place',
          name: enterprise.location
        } : undefined,
        makesOffer: {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Gestion Financière avec CassKai'
          }
        }
      }
    });
  };
  // SEO pour les rapports/analyses
  const setReportSEO = (report: {
    title: string;
    description: string;
    type: string;
    dateCreated: string;
    author?: string;
  }) => {
    setSEO({
      title: `${report.title} - Rapport CassKai`,
      description: report.description,
      type: 'article',
      publishedTime: report.dateCreated,
      author: report.author,
      robots: 'noindex, nofollow', // Les rapports sont privés
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Report',
        name: report.title,
        description: report.description,
        dateCreated: report.dateCreated,
        author: report.author ? {
          '@type': 'Person',
          name: report.author
        } : undefined
      }
    });
  };
  // SEO pour les pages d'aide
  const setHelpSEO = (help: {
    title: string;
    description: string;
    category: string;
    lastUpdated: string;
  }) => {
    setSEO({
      title: `${help.title} - Aide CassKai`,
      description: help.description,
      keywords: ['aide', 'support', 'guide', help.category, 'CassKai'],
      type: 'article',
      modifiedTime: help.lastUpdated,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: help.title,
        description: help.description,
        dateModified: help.lastUpdated,
        publisher: {
          '@type': 'Organization',
          name: 'CassKai'
        }
      }
    });
  };
  return {
    setSEO,
    setEnterpriseSEO,
    setReportSEO,
    setHelpSEO,
  };
};
// Composant wrapper pour les pages avec SEO automatique
export const SEOPageWrapper: React.FC<{
  children: React.ReactNode;
  seoConfig?: SEOHeadProps;
}> = ({ children, seoConfig }) => {
  return (
    <>
      {seoConfig && <SEOHead {...seoConfig} />}
      {children}
    </>
  );
};