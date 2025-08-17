import { useSEO } from '@/hooks/useSEO';
import React from 'react';

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
  structuredData?: Record<string, unknown>;
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
// useDynamicSEOHead hook moved to '@/hooks/useDynamicSEOHead'

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