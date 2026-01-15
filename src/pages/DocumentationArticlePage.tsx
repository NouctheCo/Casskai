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
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Copy,
  MessageCircle,
  Share2,
  Star,
  ThumbsDown,
  ThumbsUp,
  User
} from 'lucide-react';

import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WhatsAppChat } from '@/components/chat/WhatsAppChat';

import { toastSuccess } from '@/lib/toast-helpers';
import { logger } from '@/lib/logger';

import { categoriesData } from './DocumentationCategoryPage';
import { articlesDatabase as docsArticlesDatabase, type ArticleData } from '@/pages/documentation/DocumentationArticlesData';

type DocumentationArticle = ArticleData;

const articlesDatabase: Record<string, DocumentationArticle> = docsArticlesDatabase;

const DocumentationArticlePage = () => {
  const { category: categoryParam, article: articleParam, slug } = useParams();
  const articleId = articleParam ?? slug;
  const navigate = useNavigate();
  const { t: _t } = useTranslation();

  const [hasRated, setHasRated] = useState(false);
  const [userRating, setUserRating] = useState<'positive' | 'negative' | null>(null);

  const getArticle = (): DocumentationArticle | null => {
    if (articleId && articlesDatabase[articleId]) {
      return articlesDatabase[articleId];
    }

    if (categoryParam && categoriesData[categoryParam as keyof typeof categoriesData]) {
      const categoryArticles = categoriesData[categoryParam as keyof typeof categoriesData].articles;
      const foundArticle = categoryArticles.find((article: any) => article.id === articleId);

      if (foundArticle) {
        return {
          id: foundArticle.id,
          title: foundArticle.title,
          category: categoriesData[categoryParam as keyof typeof categoriesData].title,
          description: foundArticle.description,
          readTime: foundArticle.readTime,
          difficulty: foundArticle.difficulty,
          lastUpdated: '2025-01-15',
          author: 'Équipe CassKai',
          rating: 4.5,
          views: foundArticle.views,
          content: [
            `# ${foundArticle.title}`,
            '',
            foundArticle.description,
            '',
            '## Contenu en cours de développement',
            '',
            'Cette section sera bientôt complétée avec des informations détaillées.'
          ],
          relatedArticles: []
        };
      }
    }

    return null;
  };

  const article = getArticle();

  const handleRating = (rating: 'positive' | 'negative') => {
    setHasRated(true);
    setUserRating(rating);

    toastSuccess(
      rating === 'positive'
        ? "Nous sommes ravis que cet article vous ait été utile."
        : "Merci pour votre retour, nous allons améliorer cet article."
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title || 'Article CassKai',
          text: article?.description || '',
          url: window.location.href
        });
      } catch (_error) {
        logger.debug('DocumentationArticle', 'Partage annulé');
      }
    } else {
      toastSuccess('Fonctionnalité de partage non disponible sur votre navigateur');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toastSuccess("Le lien de l'article a été copié dans le presse-papiers");
    } catch (_error) {
      toastSuccess('Impossible de copier le lien');
    }
  };

  const handleContactSupport = () => {
    window.open(
      `mailto:support@casskai.app?subject=${encodeURIComponent(`Question sur: ${article?.title || 'Documentation'}`)}`
    );
    toastSuccess("Votre client email va s'ouvrir");
  };

  const renderContent = (contentLines: string[]) => {
    return contentLines.map((line: string, index: number) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-6 mt-8">
            {line.substring(2)}
          </h1>
        );
      }

      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4 mt-8">
            {line.substring(3)}
          </h2>
        );
      }

      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-3 mt-6">
            {line.substring(4)}
          </h3>
        );
      }

      if (line.startsWith('#### ')) {
        return (
          <h4 key={index} className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2 mt-4">
            {line.substring(5)}
          </h4>
        );
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={index} className="text-gray-700 dark:text-gray-300 mb-1 ml-4">
            {line.substring(2)}
          </li>
        );
      }

      if (line.trim() === '') {
        return <br key={index} />;
      }

      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={index} className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
            {line.slice(2, -2)}
          </p>
        );
      }

      return (
        <p key={index} className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <PublicNavigation variant="legal" />
        <div className="pt-24 pb-16">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4">
                Article non trouvé
              </h1>
              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-8">
                L'article demandé n'existe pas ou a été déplacé.
              </p>
              <Button onClick={() => navigate('/help')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au centre d'aide
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <PublicNavigation variant="legal" />
      <div className="pt-24 pb-16">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center mb-6">
              <Button variant="ghost" onClick={() => navigate('/help')} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Centre d'aide
              </Button>
              <Badge variant="outline">{article.category}</Badge>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4">{article.title}</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-6">{article.description}</p>
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

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-8">
                  <div className="prose prose-lg dark:prose-invert max-w-none">{renderContent(article.content)}</div>
                </CardContent>
              </Card>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300">
                    Cet article vous a-t-il été utile ?
                  </span>
                  <Button
                    variant={userRating === 'positive' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRating('positive')}
                    disabled={hasRated}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Oui
                  </Button>
                  <Button
                    variant={userRating === 'negative' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRating('negative')}
                    disabled={hasRated}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Non
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copier le lien
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Articles liés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {article.relatedArticles?.map((relatedId: string, index: number) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-3"
                        onClick={() => navigate(`/docs/${relatedId}`)}
                      >
                        <ArrowRight className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">{relatedId.replace(/-/g, ' ')}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Besoin d'aide ?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-4">
                    Vous ne trouvez pas la réponse à votre question ?
                  </p>
                  <WhatsAppChat
                    messageType="documentation"
                    message={`Bonjour ! J'ai une question sur l'article "${article.title}" de votre documentation CassKai.`}
                    className="w-full mb-3"
                  />
                  <Button variant="outline" className="w-full" onClick={handleContactSupport}>
                    Contacter le support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationArticlePage;
