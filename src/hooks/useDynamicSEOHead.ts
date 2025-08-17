import { useState } from 'react';
import { useSEO } from '@/hooks/useSEO';

export interface SEOHeadProps {
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

export const useDynamicSEOHead = () => {
  const [seoConfig, setSeoConfig] = useState<SEOHeadProps | undefined>(undefined);
  useSEO(seoConfig);

  const setSEO = (config: SEOHeadProps) => {
    setSeoConfig(config);
  };

  const setEnterpriseSEO = (enterprise: {
    name: string;
    description?: string;
    sector?: string;
    location?: string;
  }) => {
    setSEO({
      title: `${enterprise.name} - Gestion avec CassKai`,
      description: `Découvrez comment ${enterprise.name} utilise CassKai pour optimiser sa gestion financière${enterprise.sector ? ` dans le secteur ${enterprise.sector}` : ''}.`,
      keywords: ['entreprise', enterprise.sector, 'gestion financière', 'client CassKai'].filter((v): v is string => Boolean(v)),
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
      robots: 'noindex, nofollow',
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
}
