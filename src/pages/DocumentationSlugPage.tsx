/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import DocumentationCategoryPage, { categoriesData } from '@/pages/DocumentationCategoryPage';
import DocumentationArticlePage from '@/pages/DocumentationArticlePage';

const DocumentationSlugPage: React.FC = () => {
  const { slug } = useParams();

  if (slug && Object.prototype.hasOwnProperty.call(categoriesData, slug)) {
    return <DocumentationCategoryPage />;
  }

  return <DocumentationArticlePage />;
};

export default DocumentationSlugPage;
