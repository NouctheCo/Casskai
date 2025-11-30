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

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Clock,
  Eye,
  BookOpen,
  Filter,
  Search,
  Youtube,
  Bell,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EXTERNAL_LINKS } from '@/config/links';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  views: number;
  thumbnail: string;
  category: string;
  level: 'débutant' | 'intermédiaire' | 'avancé';
  youtubeId?: string;
  status: 'available' | 'coming_soon';
}

const TutorialsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [emailSubscription, setEmailSubscription] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Tutoriels (structure préparée pour YouTube)
  const tutorials: Tutorial[] = [
    {
      id: 'getting-started',
      title: 'Démarrage rapide avec CassKai',
      description: 'Découvrez comment configurer votre compte et créer votre première facture en moins de 10 minutes',
      duration: '8:45',
      views: 1250,
      thumbnail: '/tutorials/getting-started.jpg',
      category: 'Premiers pas',
      level: 'débutant',
      status: 'coming_soon',
    },
    {
      id: 'accounting-basics',
      title: 'Comptabilité: Les bases',
      description: 'Maîtrisez les fondamentaux de la comptabilité dans CassKai',
      duration: '12:30',
      views: 980,
      thumbnail: '/tutorials/accounting-basics.jpg',
      category: 'Comptabilité',
      level: 'débutant',
      status: 'coming_soon',
    },
    {
      id: 'invoice-workflow',
      title: 'Workflow de facturation complet',
      description: 'Du devis à la facture: automatisez votre processus',
      duration: '15:20',
      views: 1540,
      thumbnail: '/tutorials/invoice-workflow.jpg',
      category: 'Facturation',
      level: 'intermédiaire',
      status: 'coming_soon',
    },
    {
      id: 'bank-sync',
      title: 'Synchronisation bancaire',
      description: 'Connectez vos comptes bancaires et automatisez le rapprochement',
      duration: '10:15',
      views: 875,
      thumbnail: '/tutorials/bank-sync.jpg',
      category: 'Banque',
      level: 'intermédiaire',
      status: 'coming_soon',
    },
    {
      id: 'advanced-reporting',
      title: 'Rapports financiers avancés',
      description: 'Créez des rapports personnalisés et analysez vos données',
      duration: '18:45',
      views: 620,
      thumbnail: '/tutorials/advanced-reporting.jpg',
      category: 'Rapports',
      level: 'avancé',
      status: 'coming_soon',
    },
    {
      id: 'crm-setup',
      title: 'Configuration du CRM',
      description: 'Organisez votre base clients et gérez votre pipeline',
      duration: '13:30',
      views: 740,
      thumbnail: '/tutorials/crm-setup.jpg',
      category: 'CRM',
      level: 'intermédiaire',
      status: 'coming_soon',
    },
    {
      id: 'inventory-management',
      title: 'Gestion de stock optimale',
      description: 'Gérez votre inventaire et vos mouvements de stock',
      duration: '16:00',
      views: 560,
      thumbnail: '/tutorials/inventory.jpg',
      category: 'Inventaire',
      level: 'intermédiaire',
      status: 'coming_soon',
    },
    {
      id: 'automation-workflows',
      title: 'Automatisation avancée',
      description: 'Créez des workflows personnalisés pour gagner du temps',
      duration: '20:15',
      views: 430,
      thumbnail: '/tutorials/automation.jpg',
      category: 'Automatisation',
      level: 'avancé',
      status: 'coming_soon',
    },
  ];

  const categories = ['all', ...Array.from(new Set(tutorials.map((t) => t.category)))];

  // Filtrage
  const filteredTutorials = useMemo(() => {
    return tutorials.filter((tutorial) => {
      const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, tutorials]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implémenter l'abonnement newsletter
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'débutant':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'intermédiaire':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'avancé':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Play className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                Tutoriels Vidéo
              </h1>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-500 mt-1">
                Apprenez à maîtriser CassKai avec nos tutoriels pas-à-pas
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Rechercher un tutoriel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:border-gray-700"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-12 pr-8 py-3 bg-white dark:bg-gray-800 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 dark:border-gray-700 rounded-xl text-sm font-medium appearance-none cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                <option value="all">Toutes les catégories</option>
                {categories.filter((c) => c !== 'all').map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* YouTube Channel CTA */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Youtube className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  Abonnez-vous à notre chaîne YouTube
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  Ne manquez aucun tutoriel et restez informé des nouveautés
                </p>
              </div>
            </div>
            <Button
              onClick={() => window.open(EXTERNAL_LINKS.youtubeChannel, '_blank')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Youtube className="h-4 w-4 mr-2" />
              S'abonner
            </Button>
          </div>
        </div>

        {/* Tutorials Grid */}
        {filteredTutorials.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <Search className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
              Aucun tutoriel trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Essayez avec d'autres mots-clés ou catégories
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial) => (
              <div
                key={tutorial.id}
                className="group bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 hover:shadow-xl transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                  {tutorial.status === 'coming_soon' ? (
                    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30">
                      <div className="text-center">
                        <Clock className="h-12 w-12 text-white mx-auto mb-2" />
                        <p className="text-white font-semibold">Bientôt disponible</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-white ml-1" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tutorial.duration}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-lg ${getLevelColor(tutorial.level)}`}>
                      {tutorial.level}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-500 text-xs rounded-lg">
                      {tutorial.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {tutorial.title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-500 mb-4 line-clamp-2">
                    {tutorial.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {tutorial.views.toLocaleString()} vues
                    </div>
                    {tutorial.status === 'available' && (
                      <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">
                        <Play className="h-3.5 w-3.5 mr-1" />
                        Regarder
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Newsletter Subscription */}
        <div className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
              Soyez notifié des nouveaux tutoriels
            </h3>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-500 mb-6">
              Recevez un email chaque fois qu'un nouveau tutoriel est publié
            </p>

            {subscribed ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-medium">
                <Check className="h-5 w-5" />
                Merci pour votre inscription !
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={emailSubscription}
                  onChange={(e) => setEmailSubscription(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  S'inscrire
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Help Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-500 mb-4">
            Vous préférez la documentation écrite ?
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(EXTERNAL_LINKS.documentation)}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Documentation
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(EXTERNAL_LINKS.support)}
            >
              Contacter le support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialsPage;
