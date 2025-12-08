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
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArticleData } from './DocumentationArticlesData';

interface DocumentationArticleHeaderProps {
  article: ArticleData;
}

export const DocumentationArticleHeader: React.FC<DocumentationArticleHeaderProps> = ({ article }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 dark:border-gray-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/help')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Centre d'aide
          </Button>
          <Badge variant="outline">{article.category}</Badge>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4">
          {article.title}
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-6">
          {article.description}
        </p>

        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {article.readTime}
          </div>
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            {article.author}
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {article.lastUpdated}
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            {article.rating}/5
          </div>
        </div>
      </div>
    </div>
  );
};
