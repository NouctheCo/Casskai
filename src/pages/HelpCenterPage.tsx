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
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  MessageCircle, 
  Video, 
  FileText, 
  Users, 
  ChevronRight,
  Play,
  Download,
  Clock,
  Star,
  HelpCircle,
  Phone,
  Mail,
  Zap,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Settings,
  CreditCard,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/components/ui/PageContainer';
import { useNavigate } from 'react-router-dom';
import { generateDocPath } from '@/utils/slugUtils';

const HelpCenterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      icon: Zap,
      title: 'Premiers pas',
      description: 'Configuration initiale et prise en main',
      articles: 12,
      popular: true,
      color: 'bg-blue-500',
      topics: [
        'Créer votre premier compte',
        'Configuration de l\'entreprise',
        'Invitation des collaborateurs',
        'Tour d\'horizon de l\'interface'
      ]
    },
    {
      icon: CreditCard,
      title: 'Facturation',
      description: 'Créer, envoyer et gérer vos factures',
      articles: 18,
      popular: true,
      color: 'bg-green-500',
      topics: [
        'Créer une facture',
        'Personnaliser les modèles',
        'Suivi des paiements',
        'Factures récurrentes'
      ]
    },
    {
      icon: Settings,
      title: 'Comptabilité',
      description: 'Gestion comptable et rapports',
      articles: 24,
      popular: false,
      color: 'bg-purple-500',
      topics: [
        'Plan comptable SYSCOHADA',
        'Écritures automatiques',
        'Rapports financiers',
        'Export FEC'
      ]
    },
    {
      icon: Users,
      title: 'Gestion d\'équipe',
      description: 'Utilisateurs, rôles et permissions',
      articles: 8,
      popular: false,
      color: 'bg-orange-500',
      topics: [
        'Ajouter des utilisateurs',
        'Définir les rôles',
        'Permissions avancées',
        'Sécurité des accès'
      ]
    },
    {
      icon: Shield,
      title: 'Sécurité',
      description: 'Protection des données et confidentialité',
      articles: 6,
      popular: false,
      color: 'bg-red-500',
      topics: [
        'Authentification 2FA',
        'Gestion des sessions',
        'Sauvegarde des données',
        'Conformité RGPD'
      ]
    },
    {
      icon: Settings,
      title: 'Intégrations',
      description: 'Connecter CassKai à vos outils',
      articles: 15,
      popular: false,
      color: 'bg-indigo-500',
      topics: [
        'Connexion bancaire',
        'API et webhooks',
        'Import/Export',
        'Applications tierces'
      ]
    }
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'Chat en direct',
      description: 'Obtenez de l\'aide instantanément',
      availability: 'Disponible 24/7',
      action: 'Démarrer un chat',
      color: 'bg-blue-500'
    },
    {
      icon: Mail,
      title: 'Support par email',
      description: 'Envoyez-nous vos questions détaillées',
      availability: 'Réponse sous 24h',
      action: 'Envoyer un email',
      color: 'bg-green-500'
    },
    {
      icon: Phone,
      title: 'Support téléphonique',
      description: 'Parlez directement à un expert',
      availability: 'Lun-Ven 9h-18h',
      action: 'Nous appeler',
      color: 'bg-purple-500'
    },
    {
      icon: Video,
      title: 'Session de formation',
      description: 'Formation personnalisée en visioconférence',
      availability: 'Sur rendez-vous',
      action: 'Réserver',
      color: 'bg-orange-500'
    }
  ];

  const featuredArticles = [
    {
      id: 'creer-une-facture',
      title: 'Comment créer votre première facture',
      description: 'Guide complet pour créer et envoyer votre première facture avec CassKai',
      readTime: '5 min',
      category: 'Facturation',
      popular: true
    },
    {
      id: 'configuration-plan-comptable-syscohada',
      title: 'Configuration des plans comptables',
      description: 'Paramétrer votre plan comptable selon vos normes locales',
      readTime: '8 min',
      category: 'Comptabilité',
      popular: true
    },
    {
      id: 'invitation-et-gestion-des-utilisateurs',
      title: 'Invitation et gestion des utilisateurs',
      description: 'Ajouter des collaborateurs et définir leurs permissions',
      readTime: '6 min',
      category: 'Gestion d\'équipe',
      popular: false
    },
    {
      id: 'connexion-bancaire-automatique',
      title: 'Connexion bancaire automatique',
      description: 'Synchroniser vos comptes bancaires pour un rapprochement automatique',
      readTime: '10 min',
      category: 'Intégrations',
      popular: true
    }
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Event handlers for non-functional buttons
  const handleViewAllArticles = () => {
    navigate('/docs/articles');
  };

  const handleSupportOption = (optionName: string) => {
    console.log(`Support option selected: ${optionName}`);
    // TODO: Implement specific support actions
  };

  const handleViewSchedule = () => {
    navigate('/docs/schedule');
  };

  const handleDownloadGuides = () => {
    // TODO: Implement download functionality
    console.log('Download guides clicked');
  };

  const handleJoinCommunity = () => {
    window.open('https://community.casskai.fr', '_blank');
  };

  const handleContactSupport = () => {
    navigate('/support/contact');
  };

  return (
    <PageContainer variant="default">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <BookOpen className="w-20 h-20 mx-auto mb-6 text-blue-200" />
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Centre d'aide CassKai
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Trouvez rapidement les réponses à vos questions et maîtrisez 
              toutes les fonctionnalités de CassKai.
            </p>
            
            {/* Barre de recherche */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Rechercher dans l'aide..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg bg-white/10 border-white/20 text-white placeholder-white/70 rounded-xl focus:bg-white dark:bg-gray-800 focus:text-gray-900 dark:text-gray-100 transition-colors"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Statistiques d'aide */}
      <div className="py-12 bg-white dark:bg-gray-800 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: '200+', label: 'Articles d\'aide', icon: FileText },
              { number: '50+', label: 'Vidéos tutoriels', icon: Video },
              { number: '< 1h', label: 'Temps de réponse', icon: Clock },
              { number: '98%', label: 'Satisfaction client', icon: Star }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                <stat.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 dark:text-gray-300">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Catégories d'aide */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-6">
              Parcourir par catégorie
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-300 max-w-3xl mx-auto">
              Trouvez l'aide dont vous avez besoin en explorant nos catégories organisées.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(generateDocPath(category.title, 'category'))}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center`}>
                        <category.icon className="w-6 h-6 text-white" />
                      </div>
                      {category.popular && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Star className="w-3 h-3 mr-1" />
                          Populaire
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                      {category.title}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300">
                      {category.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        {category.articles} articles
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <ul className="space-y-2">
                      {category.topics.slice(0, 3).map((topic, idx) => (
                        <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 hover:text-blue-600 cursor-pointer">
                          • {topic}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Articles populaires */}
      <div className="py-16 bg-white dark:bg-gray-800 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 bg-yellow-100 text-yellow-800 border-yellow-200">
              <Star className="w-4 h-4 mr-2" />
              Populaires
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-6">
              Articles les plus consultés
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredArticles.map((article, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/docs/${article.id}`)}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white group-hover:text-blue-600 transition-colors mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-4">
                          {article.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-300">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {article.readTime}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {article.category}
                          </Badge>
                          {article.popular && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                              Populaire
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 transition-colors ml-4 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleViewAllArticles}
            >
              Voir tous les articles
              <BookOpen className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Options de support */}
      <div className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-6">
              Besoin d'aide personnalisée ?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-300 max-w-3xl mx-auto">
              Notre équipe d'experts est là pour vous accompagner à chaque étape.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {supportOptions.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 ${option.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <option.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-3">
                      {option.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-4">
                      {option.description}
                    </p>
                    <div className="text-sm text-gray-500 dark:text-gray-300 mb-6">
                      {option.availability}
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleSupportOption(option.title)}
                    >
                      {option.action}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Section ressources supplémentaires */}
      <div className="py-16 bg-white dark:bg-gray-800 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-6">
              Ressources supplémentaires
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Video className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-3">Webinaires</h3>
                <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-4 text-sm">
                  Sessions de formation en direct sur les nouvelles fonctionnalités.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleViewSchedule}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Voir le planning
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Download className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-3">Guides PDF</h3>
                <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-4 text-sm">
                  Téléchargez nos guides détaillés pour une utilisation hors-ligne.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleDownloadGuides}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-3">Communauté</h3>
                <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 mb-4 text-sm">
                  Échangez avec d'autres utilisateurs et partagez vos conseils.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleJoinCommunity}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Rejoindre
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Vous n'avez pas trouvé ce que vous cherchiez ?
          </h2>
          <p className="text-xl mb-8">
            Notre équipe support est là pour vous aider personnellement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white dark:bg-gray-800 text-blue-600 hover:bg-gray-100 dark:bg-gray-900/50"
              onClick={handleContactSupport}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contacter le support
            </Button>
            <Button
              onClick={() => navigate('/register')}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 dark:bg-gray-800"
            >
              Essayer CassKai gratuitement
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default HelpCenterPage;
