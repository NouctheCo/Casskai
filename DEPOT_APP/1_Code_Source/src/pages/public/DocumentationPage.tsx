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
  BookOpen,
  Search,
  Calculator,
  FileText,
  CreditCard,
  BarChart3,
  Users,
  Package,
  Settings,
  Shield,
  Clock,
  Tag,
  ChevronRight,
  ExternalLink,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EXTERNAL_LINKS } from '@/config/links';

interface Article {
  id: string;
  title: string;
  description: string;
  readTime: string;
  tags: string[];
  sectionId: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  articles: Article[];
}

const DocumentationPage: React.FC = () => {
  const { t: _t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Structure de la documentation
  const sections: Section[] = [
    {
      id: 'getting-started',
      title: 'Premiers pas',
      icon: Home,
      color: 'from-blue-400 to-blue-600',
      articles: [
        {
          id: 'quick-start',
          title: 'Guide de démarrage rapide',
          description: 'Commencez avec CassKai en moins de 5 minutes',
          readTime: '5 min',
          tags: ['Débutant', 'Setup'],
          sectionId: 'getting-started',
        },
        {
          id: 'onboarding',
          title: 'Processus d\'onboarding',
          description: 'Configuration initiale de votre entreprise',
          readTime: '10 min',
          tags: ['Débutant', 'Configuration'],
          sectionId: 'getting-started',
        },
        {
          id: 'dashboard-overview',
          title: 'Vue d\'ensemble du tableau de bord',
          description: 'Comprendre votre dashboard et les KPIs',
          readTime: '8 min',
          tags: ['Interface', 'Analytics'],
          sectionId: 'getting-started',
        },
      ],
    },
    {
      id: 'accounting',
      title: 'Comptabilité',
      icon: Calculator,
      color: 'from-emerald-400 to-emerald-600',
      articles: [
        {
          id: 'chart-of-accounts',
          title: 'Plan comptable',
          description: 'Configurer et gérer votre plan comptable',
          readTime: '12 min',
          tags: ['Comptabilité', 'Configuration'],
          sectionId: 'accounting',
        },
        {
          id: 'journal-entries',
          title: 'Écritures comptables',
          description: 'Créer et gérer vos écritures comptables',
          readTime: '15 min',
          tags: ['Comptabilité', 'Opérations'],
          sectionId: 'accounting',
        },
        {
          id: 'letterage',
          title: 'Lettrage automatique',
          description: 'Automatiser le lettrage de vos comptes',
          readTime: '10 min',
          tags: ['Automatisation', 'Avancé'],
          sectionId: 'accounting',
        },
        {
          id: 'fec-import',
          title: 'Import FEC',
          description: 'Importer vos données comptables au format FEC',
          readTime: '8 min',
          tags: ['Import', 'FEC'],
          sectionId: 'accounting',
        },
      ],
    },
    {
      id: 'invoicing',
      title: 'Facturation',
      icon: FileText,
      color: 'from-purple-400 to-purple-600',
      articles: [
        {
          id: 'create-invoice',
          title: 'Créer une facture',
          description: 'Guide complet de création de factures',
          readTime: '7 min',
          tags: ['Facturation', 'Débutant'],
          sectionId: 'invoicing',
        },
        {
          id: 'quotes',
          title: 'Devis et propositions',
          description: 'Gérer vos devis et les convertir en factures',
          readTime: '10 min',
          tags: ['Devis', 'Commercial'],
          sectionId: 'invoicing',
        },
        {
          id: 'recurring-invoices',
          title: 'Facturation récurrente',
          description: 'Automatiser vos factures d\'abonnement',
          readTime: '8 min',
          tags: ['Automatisation', 'Abonnement'],
          sectionId: 'invoicing',
        },
        {
          id: 'payment-tracking',
          title: 'Suivi des paiements',
          description: 'Gérer et suivre vos encaissements',
          readTime: '6 min',
          tags: ['Trésorerie', 'Paiements'],
          sectionId: 'invoicing',
        },
      ],
    },
    {
      id: 'banking',
      title: 'Banque & Trésorerie',
      icon: CreditCard,
      color: 'from-cyan-400 to-cyan-600',
      articles: [
        {
          id: 'bank-sync',
          title: 'Synchronisation bancaire',
          description: 'Connecter vos comptes bancaires',
          readTime: '10 min',
          tags: ['Banque', 'Configuration'],
          sectionId: 'banking',
        },
        {
          id: 'reconciliation',
          title: 'Rapprochement bancaire',
          description: 'Rapprocher vos transactions automatiquement',
          readTime: '12 min',
          tags: ['Banque', 'Opérations'],
          sectionId: 'banking',
        },
        {
          id: 'cash-flow',
          title: 'Prévisions de trésorerie',
          description: 'Anticiper votre flux de trésorerie',
          readTime: '15 min',
          tags: ['Trésorerie', 'Prévisions'],
          sectionId: 'banking',
        },
      ],
    },
    {
      id: 'crm',
      title: 'CRM & Ventes',
      icon: Users,
      color: 'from-pink-400 to-pink-600',
      articles: [
        {
          id: 'clients-management',
          title: 'Gestion des clients',
          description: 'Organiser votre base clients',
          readTime: '8 min',
          tags: ['CRM', 'Clients'],
          sectionId: 'crm',
        },
        {
          id: 'opportunities',
          title: 'Pipeline de ventes',
          description: 'Gérer votre pipeline commercial',
          readTime: '12 min',
          tags: ['Commercial', 'Ventes'],
          sectionId: 'crm',
        },
        {
          id: 'contracts',
          title: 'Gestion des contrats',
          description: 'Créer et suivre vos contrats',
          readTime: '10 min',
          tags: ['Contrats', 'Juridique'],
          sectionId: 'crm',
        },
      ],
    },
    {
      id: 'inventory',
      title: 'Stock & Inventaire',
      icon: Package,
      color: 'from-orange-400 to-orange-600',
      articles: [
        {
          id: 'products',
          title: 'Gestion des produits',
          description: 'Créer et organiser votre catalogue',
          readTime: '10 min',
          tags: ['Stock', 'Produits'],
          sectionId: 'inventory',
        },
        {
          id: 'stock-movements',
          title: 'Mouvements de stock',
          description: 'Suivre vos entrées et sorties',
          readTime: '8 min',
          tags: ['Stock', 'Opérations'],
          sectionId: 'inventory',
        },
        {
          id: 'production',
          title: 'Ordres de production',
          description: 'Gérer votre production',
          readTime: '12 min',
          tags: ['Production', 'Avancé'],
          sectionId: 'inventory',
        },
      ],
    },
    {
      id: 'reports',
      title: 'Rapports & Analytics',
      icon: BarChart3,
      color: 'from-amber-400 to-amber-600',
      articles: [
        {
          id: 'financial-reports',
          title: 'Rapports financiers',
          description: 'Bilan, compte de résultat, trésorerie',
          readTime: '15 min',
          tags: ['Rapports', 'Finance'],
          sectionId: 'reports',
        },
        {
          id: 'custom-reports',
          title: 'Rapports personnalisés',
          description: 'Créer vos propres rapports',
          readTime: '10 min',
          tags: ['Rapports', 'Personnalisation'],
          sectionId: 'reports',
        },
        {
          id: 'exports',
          title: 'Exports de données',
          description: 'Exporter vos données (Excel, PDF, CSV)',
          readTime: '6 min',
          tags: ['Export', 'Données'],
          sectionId: 'reports',
        },
      ],
    },
    {
      id: 'settings',
      title: 'Configuration',
      icon: Settings,
      color: 'from-slate-400 to-slate-600',
      articles: [
        {
          id: 'company-settings',
          title: 'Paramètres entreprise',
          description: 'Configurer les informations de votre société',
          readTime: '8 min',
          tags: ['Configuration', 'Entreprise'],
          sectionId: 'settings',
        },
        {
          id: 'user-management',
          title: 'Gestion des utilisateurs',
          description: 'Inviter et gérer les accès',
          readTime: '10 min',
          tags: ['Utilisateurs', 'Permissions'],
          sectionId: 'settings',
        },
        {
          id: 'modules',
          title: 'Gestion des modules',
          description: 'Activer et configurer les modules',
          readTime: '7 min',
          tags: ['Modules', 'Configuration'],
          sectionId: 'settings',
        },
      ],
    },
    {
      id: 'security',
      title: 'Sécurité & RGPD',
      icon: Shield,
      color: 'from-red-400 to-red-600',
      articles: [
        {
          id: 'security-overview',
          title: 'Vue d\'ensemble sécurité',
          description: 'Comprendre notre infrastructure de sécurité',
          readTime: '10 min',
          tags: ['Sécurité', 'Infrastructure'],
          sectionId: 'security',
        },
        {
          id: 'data-privacy',
          title: 'Protection des données (RGPD)',
          description: 'Conformité RGPD et gestion des données',
          readTime: '12 min',
          tags: ['RGPD', 'Confidentialité'],
          sectionId: 'security',
        },
        {
          id: 'backups',
          title: 'Sauvegardes et restauration',
          description: 'Politique de sauvegarde de vos données',
          readTime: '8 min',
          tags: ['Sauvegarde', 'Sécurité'],
          sectionId: 'security',
        },
      ],
    },
  ];

  // Filtrage des articles basé sur la recherche
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) {
      return selectedSection
        ? sections.filter((s) => s.id === selectedSection)
        : sections;
    }

    const query = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        articles: section.articles.filter(
          (article) =>
            article.title.toLowerCase().includes(query) ||
            article.description.toLowerCase().includes(query) ||
            article.tags.some((tag) => tag.toLowerCase().includes(query))
        ),
      }))
      .filter((section) => section.articles.length > 0);
  }, [searchQuery, selectedSection, sections]);

  const handleArticleClick = (articleId: string) => {
    navigate(`/docs/${articleId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                Documentation CassKai
              </h1>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-300 mt-1">
                Tout ce dont vous avez besoin pour maîtriser CassKai
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Rechercher dans la documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 w-full text-base rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Sections */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-600 dark:border-gray-700 sticky top-4">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wide mb-4">
                Sections
              </h2>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedSection(null)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    !selectedSection
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Toutes les sections
                </button>
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setSelectedSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedSection === section.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {section.title}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content - Articles */}
          <div className="col-span-12 lg:col-span-9">
            {filteredSections.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-600 dark:border-gray-700">
                <Search className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-500 dark:text-gray-300">
                  Essayez avec d'autres mots-clés
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id}>
                      {/* Section Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                          {section.title}
                        </h2>
                      </div>

                      {/* Articles Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.articles.map((article) => (
                          <button
                            key={article.id}
                            type="button"
                            onClick={() => handleArticleClick(article.id)}
                            className="group bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-600 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all text-left"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {article.title}
                              </h3>
                              <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-4">
                              {article.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                                <Clock className="h-3.5 w-3.5" />
                                {article.readTime}
                              </div>
                              <div className="flex items-center gap-2">
                                {article.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 dark:text-gray-300 text-xs rounded-lg"
                                  >
                                    <Tag className="h-3 w-3" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA Section */}
            <div className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
                    Besoin d'aide supplémentaire ?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-4">
                    Consultez nos tutoriels vidéo ou contactez notre équipe de support.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => navigate(EXTERNAL_LINKS.tutorials)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Voir les tutoriels
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate(EXTERNAL_LINKS.support)}
                    >
                      Contacter le support
                    </Button>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <ExternalLink className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
