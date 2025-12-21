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
import { ThumbsUp, ThumbsDown, Share2, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DocumentationArticleContentProps {
  content: string[];
  hasRated: boolean;
  userRating: 'positive' | 'negative' | null;
  onRating: (rating: 'positive' | 'negative') => void;
  onShare: () => void;
  onCopyLink: () => void;
}

export const DocumentationArticleContent: React.FC<DocumentationArticleContentProps> = ({
  content,
  hasRated,
  userRating,
  onRating,
  onShare,
  onCopyLink
}) => {
  const renderContent = (contentLines: string[]) => {
    return contentLines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-3xl font-bold text-gray-900 dark:text-white mb-6 mt-8">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8">{line.substring(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">{line.substring(4)}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={index} className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">{line.substring(5)}</h4>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={index} className="text-gray-700 dark:text-gray-300 mb-1 ml-4">{line.substring(2)}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="font-semibold text-gray-900 dark:text-white mb-2">{line.slice(2, -2)}</p>;
      }
      return <p key={index} className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="lg:col-span-3">
      <Card>
        <CardContent className="p-8">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {renderContent(content)}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Cet article vous a-t-il été utile ?
          </span>
          <Button
            variant={userRating === 'positive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRating('positive')}
            disabled={hasRated}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Oui
          </Button>
          <Button
            variant={userRating === 'negative' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRating('negative')}
            disabled={hasRated}
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            Non
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Partager
          </Button>
          <Button variant="outline" size="sm" onClick={onCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copier le lien
          </Button>
        </div>
      </div>
    </div>
  );
};
