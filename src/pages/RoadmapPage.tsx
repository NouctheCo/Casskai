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

/**
 * 🗺️ Roadmap Publique CassKai
 * 
 * Timeline interactive Q4 2025 - Q3 2026
 * - Fonctionnalités planifiées
 * - Vote utilisateurs
 * - Changelog
 */

import { useState } from 'react';
import { Calendar, TrendingUp, CheckCircle, Clock, Lightbulb, ThumbsUp, MessageSquare } from 'lucide-react';
import { RoadmapPageSEO } from '@/components/SEO/SEOHelmet';

interface Feature {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned' | 'backlog';
  quarter: 'Q4-2025' | 'Q1-2026' | 'Q2-2026' | 'Q3-2026';
  votes: number;
  comments: number;
  category: 'compta' | 'ia' | 'rgpd' | 'ui' | 'mobile';
}

const features: Feature[] = [
  // Q4 2025 (Décembre)
  {
    id: 'beta-launch',
    title: '🚀 Lancement Beta Publique',
    description: 'Ouverture de la plateforme en Beta avec tarifs early-bird',
    status: 'in-progress',
    quarter: 'Q4-2025',
    votes: 156,
    comments: 23,
    category: 'ui'
  },
  {
    id: 'rgpd-complete',
    title: '🔒 Conformité RGPD 100%',
    description: 'Export données, suppression compte, logs audit',
    status: 'completed',
    quarter: 'Q4-2025',
    votes: 89,
    comments: 12,
    category: 'rgpd'
  },
  {
    id: 'legal-docs',
    title: '📄 Documents Légaux Finalisés',
    description: 'CGU, Privacy Policy, CGV validés par avocat',
    status: 'completed',
    quarter: 'Q4-2025',
    votes: 45,
    comments: 5,
    category: 'rgpd'
  },

  // Q1 2026 (Janvier-Mars)
  {
    id: 'mobile-app',
    title: '📱 Application Mobile iOS/Android',
    description: 'Consultation factures, validation dépenses en déplacement',
    status: 'planned',
    quarter: 'Q1-2026',
    votes: 234,
    comments: 45,
    category: 'mobile'
  },
  {
    id: 'ai-ocr',
    title: '🤖 OCR Intelligent Factures',
    description: 'Scan automatique factures avec extraction données IA',
    status: 'planned',
    quarter: 'Q1-2026',
    votes: 189,
    comments: 34,
    category: 'ia'
  },
  {
    id: 'multi-company',
    title: '🏢 Multi-Sociétés Avancé',
    description: 'Gestion consolidée de plusieurs entreprises',
    status: 'planned',
    quarter: 'Q1-2026',
    votes: 156,
    comments: 28,
    category: 'compta'
  },

  // Q2 2026 (Avril-Juin)
  {
    id: 'bank-sync-v2',
    title: '🏦 Synchronisation Bancaire Temps Réel',
    description: 'Intégration Bridge API + Budget Insight',
    status: 'planned',
    quarter: 'Q2-2026',
    votes: 312,
    comments: 67,
    category: 'compta'
  },
  {
    id: 'ai-predictions',
    title: '📊 Prédictions Trésorerie IA',
    description: 'Prévisions trésorerie J+30/J+60/J+90',
    status: 'planned',
    quarter: 'Q2-2026',
    votes: 267,
    comments: 52,
    category: 'ia'
  },
  {
    id: 'chorus-pro',
    title: '🏛️ Chorus Pro Auto',
    description: 'Facturation publique automatisée',
    status: 'planned',
    quarter: 'Q2-2026',
    votes: 98,
    comments: 15,
    category: 'compta'
  },

  // Q3 2026 (Juillet-Septembre)
  {
    id: 'ai-assistant',
    title: '💬 Assistant IA Comptable',
    description: 'ChatGPT intégré pour questions comptables',
    status: 'backlog',
    quarter: 'Q3-2026',
    votes: 423,
    comments: 89,
    category: 'ia'
  },
  {
    id: 'api-public',
    title: '🔌 API Publique REST',
    description: 'Intégration avec outils externes (Zapier, Make)',
    status: 'backlog',
    quarter: 'Q3-2026',
    votes: 178,
    comments: 31,
    category: 'ui'
  },
  {
    id: 'white-label',
    title: '🎨 Version White-Label',
    description: 'Marque blanche pour cabinets comptables',
    status: 'backlog',
    quarter: 'Q3-2026',
    votes: 67,
    comments: 12,
    category: 'ui'
  }
];

const statusConfig = {
  completed: {
    label: 'Terminé',
    color: 'bg-green-500',
    textColor: 'text-green-700 dark:text-green-300',
    icon: CheckCircle
  },
  'in-progress': {
    label: 'En cours',
    color: 'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300',
    icon: TrendingUp
  },
  planned: {
    label: 'Planifié',
    color: 'bg-purple-500',
    textColor: 'text-purple-700 dark:text-purple-300',
    icon: Calendar
  },
  backlog: {
    label: 'Backlog',
    color: 'bg-gray-400',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: Clock
  }
};

const categoryConfig = {
  compta: { label: 'Comptabilité', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  ia: { label: 'Intelligence Artificielle', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  rgpd: { label: 'RGPD & Sécurité', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  ui: { label: 'Interface & UX', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  mobile: { label: 'Mobile', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' }
};

export default function RoadmapPage() {
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [votedFeatures, setVotedFeatures] = useState<Set<string>>(new Set());

  const quarters = ['Q4-2025', 'Q1-2026', 'Q2-2026', 'Q3-2026'];

  const filteredFeatures = selectedQuarter === 'all'
    ? features
    : features.filter(f => f.quarter === selectedQuarter);

  const handleVote = (featureId: string) => {
    setVotedFeatures(prev => {
      const newSet = new Set(prev);
      if (newSet.has(featureId)) {
        newSet.delete(featureId);
      } else {
        newSet.add(featureId);
      }
      return newSet;
    });
  };

  return (
    <>
      <RoadmapPageSEO />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-4">
            Roadmap CassKai 2025-2026
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Découvrez nos prochaines fonctionnalités et votez pour vos priorités
          </p>
          
          {/* CTA Vote */}
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Vos votes influencent directement nos priorités !
            </span>
          </div>
        </div>

        {/* Quarter Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button
            onClick={() => setSelectedQuarter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedQuarter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Toutes les périodes
          </button>
          {quarters.map(quarter => (
            <button
              key={quarter}
              onClick={() => setSelectedQuarter(quarter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedQuarter === quarter
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {quarter}
            </button>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredFeatures.map(feature => {
            const StatusIcon = statusConfig[feature.status].icon;
            const hasVoted = votedFeatures.has(feature.id);
            
            return (
              <div
                key={feature.id}
                className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all p-6 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[feature.status].color} text-white`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[feature.status].label}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                    {feature.quarter}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 text-sm mb-4 flex-grow">
                  {feature.description}
                </p>

                {/* Category */}
                <div className="mb-4">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${categoryConfig[feature.category].color}`}>
                    {categoryConfig[feature.category].label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">
                  <button
                    onClick={() => handleVote(feature.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      hasVoted
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                    <span>{feature.votes + (hasVoted ? 1 : 0)}</span>
                  </button>
                  
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-400">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">{feature.comments}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {features.filter(f => f.status === 'completed').length}
            </div>
            <div className="text-gray-600 dark:text-gray-400 dark:text-gray-300 text-sm">Terminées</div>
          </div>
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {features.filter(f => f.status === 'in-progress').length}
            </div>
            <div className="text-gray-600 dark:text-gray-400 dark:text-gray-300 text-sm">En cours</div>
          </div>
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {features.filter(f => f.status === 'planned').length}
            </div>
            <div className="text-gray-600 dark:text-gray-400 dark:text-gray-300 text-sm">Planifiées</div>
          </div>
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-2">
              {features.filter(f => f.status === 'backlog').length}
            </div>
            <div className="text-gray-600 dark:text-gray-400 dark:text-gray-300 text-sm">Backlog</div>
          </div>
        </div>

        {/* Feedback CTA */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            Une idée de fonctionnalité ?
          </h2>
          <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
            Nous sommes à l'écoute de vos suggestions ! Proposez-nous vos idées pour améliorer CassKai.
          </p>
          <a
            href="mailto:feedback@casskai.com?subject=Suggestion de fonctionnalité"
            className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors"
          >
            <Lightbulb className="w-5 h-5" />
            Proposer une fonctionnalité
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
