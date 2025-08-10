import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  Star, 
  BookOpen,
  ArrowRight,
  Search,
  Filter,
  Zap,
  CreditCard,
  Settings,
  Users,
  Shield,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui';
import { useState } from 'react';

const categoriesData = {
  'premiers-pas': {
    id: 'premiers-pas',
    title: 'Premiers pas',
    description: 'Configuration initiale et prise en main',
    icon: Zap,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    articles: [
      {
        id: 'creer-votre-premier-compte',
        title: 'Créer votre premier compte',
        description: 'Guide complet pour créer votre compte CassKai et commencer à utiliser la plateforme',
        readTime: '5 min',
        difficulty: 'Débutant',
        popular: true,
        views: 1205
      },
      {
        id: 'configuration-de-entreprise',
        title: 'Configuration de l\'entreprise',
        description: 'Paramétrer les informations de votre entreprise et les données de base',
        readTime: '7 min',
        difficulty: 'Débutant',
        popular: true,
        views: 980
      },
      {
        id: 'invitation-des-collaborateurs',
        title: 'Invitation des collaborateurs',
        description: 'Ajouter et gérer les accès de votre équipe sur CassKai',
        readTime: '4 min',
        difficulty: 'Débutant',
        popular: false,
        views: 650
      },
      {
        id: 'tour-d-horizon-de-interface',
        title: 'Tour d\'horizon de l\'interface',
        description: 'Découvrir les principales fonctionnalités et la navigation dans CassKai',
        readTime: '10 min',
        difficulty: 'Débutant',
        popular: true,
        views: 1450
      },
      {
        id: 'parametrage-initial-comptabilite',
        title: 'Paramétrage initial de la comptabilité',
        description: 'Configurer votre plan comptable et vos journaux de base',
        readTime: '12 min',
        difficulty: 'Intermédiaire',
        popular: false,
        views: 420
      }
    ]
  },
  
  'facturation': {
    id: 'facturation',
    title: 'Facturation',
    description: 'Créer, envoyer et gérer vos factures',
    icon: CreditCard,
    color: 'bg-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    articles: [
      {
        id: 'creer-une-facture',
        title: 'Comment créer votre première facture',
        description: 'Guide complet pour créer et envoyer votre première facture avec CassKai',
        readTime: '5 min',
        difficulty: 'Débutant',
        popular: true,
        views: 2540
      },
      {
        id: 'personnaliser-les-modeles',
        title: 'Personnaliser les modèles',
        description: 'Adapter vos factures à l\'image de votre entreprise',
        readTime: '8 min',
        difficulty: 'Intermédiaire',
        popular: true,
        views: 1230
      },
      {
        id: 'suivi-des-paiements',
        title: 'Suivi des paiements',
        description: 'Gérer les encaissements et suivre les impayés',
        readTime: '6 min',
        difficulty: 'Débutant',
        popular: true,
        views: 890
      },
      {
        id: 'factures-recurrentes',
        title: 'Factures récurrentes',
        description: 'Automatiser la facturation de vos abonnements',
        readTime: '7 min',
        difficulty: 'Intermédiaire',
        popular: false,
        views: 620
      },
      {
        id: 'relances-automatiques',
        title: 'Relances automatiques',
        description: 'Configurer les rappels de paiement automatisés',
        readTime: '5 min',
        difficulty: 'Intermédiaire',
        popular: false,
        views: 445
      }
    ]
  },

  'comptabilite': {
    id: 'comptabilite',
    title: 'Comptabilité',
    description: 'Gestion comptable et rapports',
    icon: Settings,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    articles: [
      {
        id: 'configuration-plan-comptable-syscohada',
        title: 'Configuration des plans comptables',
        description: 'Paramétrer votre plan comptable selon vos normes locales',
        readTime: '8 min',
        difficulty: 'Intermédiaire',
        popular: true,
        views: 890
      },
      {
        id: 'ecritures-automatiques',
        title: 'Écritures automatiques',
        description: 'Automatiser la saisie comptable depuis vos opérations',
        readTime: '12 min',
        difficulty: 'Avancé',
        popular: false,
        views: 340
      },
      {
        id: 'rapports-financiers',
        title: 'Rapports financiers',
        description: 'Générer et personnaliser vos états financiers',
        readTime: '10 min',
        difficulty: 'Intermédiaire',
        popular: true,
        views: 1120
      },
      {
        id: 'export-fec',
        title: 'Export FEC',
        description: 'Exporter votre comptabilité au format FEC pour l\'administration',
        readTime: '4 min',
        difficulty: 'Débutant',
        popular: false,
        views: 275
      }
    ]
  },

  'gestion-equipe': {
    id: 'gestion-equipe',
    title: 'Gestion d\'équipe',
    description: 'Utilisateurs, rôles et permissions',
    icon: Users,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    articles: [
      {
        id: 'invitation-et-gestion-des-utilisateurs',
        title: 'Invitation et gestion des utilisateurs',
        description: 'Ajouter des collaborateurs et définir leurs permissions',
        readTime: '6 min',
        difficulty: 'Débutant',
        popular: false,
        views: 1450
      },
      {
        id: 'definir-les-roles',
        title: 'Définir les rôles',
        description: 'Créer et personnaliser les profils d\'accès utilisateur',
        readTime: '8 min',
        difficulty: 'Intermédiaire',
        popular: false,
        views: 680
      },
      {
        id: 'permissions-avancees',
        title: 'Permissions avancées',
        description: 'Configuration fine des droits d\'accès aux données',
        readTime: '12 min',
        difficulty: 'Avancé',
        popular: false,
        views: 290
      },
      {
        id: 'securite-des-acces',
        title: 'Sécurité des accès',
        description: 'Mettre en place l\'authentification 2FA et les bonnes pratiques',
        readTime: '7 min',
        difficulty: 'Intermédiaire',
        popular: true,
        views: 820
      }
    ]
  },

  'securite': {
    id: 'securite',
    title: 'Sécurité',
    description: 'Protection des données et confidentialité',
    icon: Shield,
    color: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    articles: [
      {
        id: 'authentification-2fa',
        title: 'Authentification 2FA',
        description: 'Sécuriser vos comptes avec l\'authentification à deux facteurs',
        readTime: '5 min',
        difficulty: 'Débutant',
        popular: true,
        views: 950
      },
      {
        id: 'gestion-des-sessions',
        title: 'Gestion des sessions',
        description: 'Contrôler et sécuriser vos sessions de connexion',
        readTime: '4 min',
        difficulty: 'Débutant',
        popular: false,
        views: 380
      },
      {
        id: 'sauvegarde-des-donnees',
        title: 'Sauvegarde des données',
        description: 'Comprendre et utiliser les sauvegardes automatiques',
        readTime: '6 min',
        difficulty: 'Débutant',
        popular: false,
        views: 520
      },
      {
        id: 'conformite-rgpd',
        title: 'Conformité RGPD',
        description: 'Respecter le règlement européen sur la protection des données',
        readTime: '15 min',
        difficulty: 'Intermédiaire',
        popular: false,
        views: 670
      }
    ]
  },

  'integrations': {
    id: 'integrations',
    title: 'Intégrations',
    description: 'Connecter CassKai à vos outils',
    icon: Settings,
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    articles: [
      {
        id: 'connexion-bancaire-automatique',
        title: 'Connexion bancaire automatique',
        description: 'Synchroniser vos comptes bancaires pour un rapprochement automatique',
        readTime: '10 min',
        difficulty: 'Intermédiaire',
        popular: true,
        views: 756
      },
      {
        id: 'api-et-webhooks',
        title: 'API et webhooks',
        description: 'Intégrer CassKai avec vos applications tierces',
        readTime: '20 min',
        difficulty: 'Avancé',
        popular: false,
        views: 145
      },
      {
        id: 'import-export',
        title: 'Import/Export',
        description: 'Échanger des données avec d\'autres logiciels comptables',
        readTime: '8 min',
        difficulty: 'Intermédiaire',
        popular: false,
        views: 420
      },
      {
        id: 'applications-tierces',
        title: 'Applications tierces',
        description: 'Connecter vos outils de CRM, e-commerce et autres',
        readTime: '12 min',
        difficulty: 'Intermédiaire',
        popular: false,
        views: 320
      }
    ]
  }
};

const DocumentationCategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // popular, views, title

  const category = categoriesData[categoryId];

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Catégorie non trouvée
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            La catégorie demandée n'existe pas ou a été déplacée.
          </p>
          <Button onClick={() => navigate('/help')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au centre d'aide
          </Button>
        </div>
      </div>
    );
  }

  // Filtrer et trier les articles
  const filteredArticles = category.articles
    .filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           article.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = !difficultyFilter || article.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.popular - a.popular || b.views - a.views;
        case 'views':
          return b.views - a.views;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Débutant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermédiaire':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Avancé':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const CategoryIcon = category.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className={`${category.bgColor} py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/help')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Centre d'aide
            </Button>
          </div>
          
          <div className="flex items-center mb-6">
            <div className={`w-16 h-16 ${category.color} rounded-xl flex items-center justify-center mr-6`}>
              <CategoryIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {category.title}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {category.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              {category.articles.length} articles
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              {category.articles.filter(a => a.popular).length} populaires
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Rechercher dans cette catégorie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filtre par difficulté */}
            <div>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="">Toutes difficultés</option>
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Avancé">Avancé</option>
              </select>
            </div>
            
            {/* Tri */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              >
                <option value="popular">Plus populaires</option>
                <option value="views">Plus vus</option>
                <option value="title">Titre A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={getDifficultyColor(article.difficulty)}>
                        {article.difficulty}
                      </Badge>
                      {article.popular && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Star className="w-3 h-3 mr-1" />
                          Populaire
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  
                  <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                    {article.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {article.readTime}
                    </div>
                    <div className="flex items-center">
                      <span>{article.views} vues</span>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => navigate(`/docs/${article.id}`)}
                  >
                    Lire l'article
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Aucun article trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Essayez de modifier vos critères de recherche ou parcourez d'autres catégories.
            </p>
            <Button onClick={() => {setSearchQuery(''); setDifficultyFilter('');}}>
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentationCategoryPage;