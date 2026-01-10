/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { articlesService, ArticleWithRelations } from '@/services/articlesService';
import { useAuth } from '@/contexts/AuthContext';
import NewArticleModal from './NewArticleModal';
import { logger } from '@/lib/logger';
interface ArticleSelectorProps {
  value: string;
  onChange: (articleId: string) => void;
  onArticleSelected?: (article: ArticleWithRelations) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  includeInactive?: boolean;
}
const ArticleSelector: React.FC<ArticleSelectorProps> = ({
  value,
  onChange,
  onArticleSelected,
  label = 'Article',
  placeholder = 'Sélectionner un article',
  required = false,
  className = '',
  includeInactive = false
}) => {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const [articles, setArticles] = useState<ArticleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // ✅ BON : Chargement automatique au montage (pas de condition if (open))
  useEffect(() => {
    const fetchArticles = async () => {
      if (!currentCompany?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const filters = includeInactive ? undefined : { is_active: true };
        const articlesData = await articlesService.getArticles(currentCompany.id, filters);
        setArticles(articlesData || []);
      } catch (error) {
        logger.error('ArticleSelector', 'Error fetching articles:', error);
        // ⚠️ Ne pas afficher de toast si liste vide (c'est normal pour une nouvelle entreprise)
        if (articles.length === 0) {
          setArticles([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [currentCompany?.id, includeInactive, toast]);
  const handleArticleChange = (articleId: string) => {
    onChange(articleId);
    // Si un callback est fourni, passer les données complètes de l'article
    if (onArticleSelected) {
      const selectedArticle = articles.find(a => a.id === articleId);
      if (selectedArticle) {
        onArticleSelected(selectedArticle);
      }
    }
  };
  const handleArticleCreated = async (articleId: string) => {
    // Recharger la liste des articles
    if (!currentCompany?.id) return;
    try {
      const filters = includeInactive ? undefined : { is_active: true };
      const articlesData = await articlesService.getArticles(currentCompany.id, filters);
      setArticles(articlesData || []);
      // Auto-sélectionner l'article créé
      onChange(articleId);
      // Si un callback est fourni, passer les données complètes de l'article
      if (onArticleSelected) {
        const createdArticle = articlesData.find(a => a.id === articleId);
        if (createdArticle) {
          onArticleSelected(createdArticle);
        }
      }
      toast({
        title: 'Article créé',
        description: 'L\'article a été créé avec succès et sélectionné',
      });
    } catch (error) {
      logger.error('ArticleSelector', 'Error reloading articles:', error);
    }
  };
  if (loading) {
    return (
      <div className={className}>
        {label && (
          <Label>
            {label} {required && '*'}
          </Label>
        )}
        <div className="flex items-center justify-center py-3 border rounded-md">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Chargement des articles...</span>
        </div>
      </div>
    );
  }
  return (
    <div className={className}>
      {label && (
        <Label>
          {label} {required && '*'}
        </Label>
      )}
      <div className="flex gap-2">
        <Select value={value} onValueChange={handleArticleChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {articles.length === 0 ? (
              <SelectItem value="none" disabled>
                Aucun article disponible
              </SelectItem>
            ) : (
              articles.map((article) => (
                <SelectItem key={article.id} value={article.id}>
                  {article.name} ({article.reference}) - Stock: {article.stock_quantity} {article.unit}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsModalOpen(true)}
          title="Créer un nouvel article"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <NewArticleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleArticleCreated}
      />
    </div>
  );
};
export default ArticleSelector;