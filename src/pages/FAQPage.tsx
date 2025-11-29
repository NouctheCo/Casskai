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
import { ChevronDown, ChevronUp, Search, MessageCircle, Mail, Phone, FileText, HelpCircle, Shield, CreditCard, Database, BarChart3, FileCheck, Users, Clock } from 'lucide-react';
import { FAQPageSEO } from '@/components/SEO/SEOHelmet';
import { EmptySearch } from '@/components/ui/EmptyState';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'compte' | 'comptabilite' | 'facturation' | 'rgpd' | 'abonnement' | 'technique';
  keywords: string[];
}

const faqData: FAQItem[] = [
  // Général (4 questions)
  {
    id: 'g1',
    category: 'general',
    question: 'Qu\'est-ce que CassKai et à qui s\'adresse cette solution ?',
    answer: 'CassKai est une plateforme tout-en-un de gestion financière pour PME et indépendants. Elle combine comptabilité, facturation, synchronisation bancaire, reporting et conformité RGPD. Idéale pour les TPE/PME, freelances, auto-entrepreneurs et cabinets comptables qui cherchent une solution moderne, automatisée et conforme.',
    keywords: ['casskai', 'présentation', 'c\'est quoi', 'pour qui', 'solution', 'cible']
  },
  {
    id: 'g2',
    category: 'general',
    question: 'CassKai remplace-t-il mon expert-comptable ?',
    answer: 'Non, CassKai est un complément à votre expert-comptable, pas un remplacement. La plateforme vous permet de gérer votre comptabilité au quotidien et de gagner du temps, puis d\'exporter un FEC conforme pour transmettre à votre EC. Vous gardez la maîtrise de vos données tout en bénéficiant de l\'expertise d\'un professionnel pour la clôture annuelle et les conseils fiscaux.',
    keywords: ['expert-comptable', 'ec', 'comptable', 'remplacer', 'complément']
  },
  {
    id: 'g3',
    category: 'general',
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Oui, absolument. CassKai utilise le chiffrement AES-256 pour toutes les données sensibles, hébergement en Europe (conformité RGPD), sauvegardes automatiques 3x par jour, authentification à deux facteurs (2FA) disponible, et infrastructure Supabase (certifiée SOC 2 Type II). Vos données ne sont jamais vendues à des tiers.',
    keywords: ['sécurité', 'données', 'chiffrement', 'protection', 'sauvegarde', 'rgpd']
  },
  {
    id: 'g4',
    category: 'general',
    question: 'Puis-je essayer CassKai gratuitement avant de m\'abonner ?',
    answer: 'Oui ! Pendant la phase Beta (jusqu\'au 31 décembre 2025), vous bénéficiez d\'un accès complet gratuit pendant 14 jours. Aucune carte bancaire requise pour l\'inscription. Après l\'essai, vous pouvez choisir le plan qui vous convient (Starter 39€, Pro 89€, Enterprise 159€/mois).',
    keywords: ['essai', 'gratuit', 'test', 'trial', 'période d\'essai', 'beta']
  },

  // Compte & Connexion (3 questions)
  {
    id: 'c1',
    category: 'compte',
    question: 'Comment créer mon compte CassKai ?',
    answer: 'Rendez-vous sur la page d\'inscription (/register), renseignez votre email professionnel, créez un mot de passe sécurisé (min. 8 caractères), confirmez votre email via le lien reçu, et complétez votre profil entreprise. Vous accédez immédiatement au tableau de bord.',
    keywords: ['inscription', 'créer compte', 'sign up', 'enregistrement']
  },
  {
    id: 'c2',
    category: 'compte',
    question: 'J\'ai oublié mon mot de passe, que faire ?',
    answer: 'Cliquez sur "Mot de passe oublié ?" sur la page de connexion, renseignez votre email, vous recevrez un lien de réinitialisation valide 1 heure. Créez un nouveau mot de passe et reconnectez-vous. Si vous ne recevez pas l\'email, vérifiez vos spams ou contactez support@casskai.com.',
    keywords: ['mot de passe', 'oublié', 'réinitialisation', 'reset', 'connexion']
  },
  {
    id: 'c3',
    category: 'compte',
    question: 'Puis-je gérer plusieurs entreprises avec un seul compte ?',
    answer: 'Oui, avec le plan Pro ou Enterprise. Vous pouvez créer plusieurs "espaces entreprise" sous le même compte et basculer facilement entre eux via le sélecteur en haut de l\'interface. Le plan Starter est limité à 1 entreprise.',
    keywords: ['multi-sociétés', 'plusieurs entreprises', 'multi-company', 'switch']
  },

  // Comptabilité (4 questions)
  {
    id: 'co1',
    category: 'comptabilite',
    question: 'Comment importer mes écritures comptables existantes ?',
    answer: 'Allez dans Comptabilité > Importer, choisissez le format (FEC, CSV, Excel), téléchargez votre fichier (max 50 Mo), mappez les colonnes si nécessaire, validez. L\'import se fait en arrière-plan et vous recevez une notification. Vous pouvez aussi synchroniser automatiquement vos relevés bancaires.',
    keywords: ['import', 'écritures', 'fec', 'csv', 'excel', 'migration']
  },
  {
    id: 'co2',
    category: 'comptabilite',
    question: 'Le plan comptable est-il personnalisable ?',
    answer: 'Oui. CassKai propose par défaut le Plan Comptable Général (PCG) français, mais vous pouvez ajouter, modifier ou masquer des comptes selon vos besoins. Allez dans Paramètres > Plan comptable pour personnaliser. Les modifications ne suppriment jamais les écritures existantes.',
    keywords: ['plan comptable', 'pcg', 'comptes', 'personnaliser', 'ajouter compte']
  },
  {
    id: 'co3',
    category: 'comptabilite',
    question: 'Comment exporter mon FEC pour mon expert-comptable ?',
    answer: 'Dans Rapports > Export FEC, sélectionnez l\'exercice comptable, choisissez le format (TXT ou XML), cliquez sur "Générer FEC". Le fichier est conforme DGFiP et téléchargeable immédiatement. Vous pouvez aussi programmer un export automatique mensuel.',
    keywords: ['fec', 'export', 'expert-comptable', 'dgfip', 'fichier']
  },
  {
    id: 'co4',
    category: 'comptabilite',
    question: 'CassKai gère-t-il la TVA automatiquement ?',
    answer: 'Oui. La TVA est calculée automatiquement sur chaque facture selon le taux configuré (20%, 10%, 5.5%, 2.1% ou exonéré). Vous pouvez générer une déclaration de TVA (CA3) en un clic dans Rapports > TVA. Les écritures de TVA collectée/déductible sont créées automatiquement.',
    keywords: ['tva', 'taxe', 'ca3', 'déclaration', 'automatique']
  },

  // Facturation (3 questions)
  {
    id: 'f1',
    category: 'facturation',
    question: 'Comment créer et envoyer une facture ?',
    answer: 'Allez dans Factures > Nouvelle facture, renseignez le client (ou créez-le), ajoutez les lignes (produits/services, quantité, prix, TVA), prévisualisez en PDF, cliquez sur "Envoyer". Le client reçoit la facture par email avec un lien de paiement en ligne (si Stripe configuré).',
    keywords: ['facture', 'créer', 'envoyer', 'devis', 'facturation']
  },
  {
    id: 'f2',
    category: 'facturation',
    question: 'Puis-je personnaliser mes factures (logo, couleurs, mentions) ?',
    answer: 'Oui, totalement. Dans Paramètres > Facturation, uploadez votre logo, choisissez les couleurs de votre marque, ajoutez des mentions légales personnalisées (conditions de paiement, CGV, coordonnées bancaires). Un aperçu en temps réel est disponible.',
    keywords: ['personnaliser', 'facture', 'logo', 'template', 'modèle']
  },
  {
    id: 'f3',
    category: 'facturation',
    question: 'Les numéros de facture sont-ils conformes (sans trou) ?',
    answer: 'Oui, absolument. CassKai garantit la continuité des numéros de facture (obligation légale). Format : FAC-YYYY-NNNN (ex: FAC-2025-0001). Impossible de supprimer une facture validée, seule l\'annulation par avoir est permise. Les factures brouillon ne consomment pas de numéro.',
    keywords: ['numérotation', 'numéro facture', 'séquence', 'continuité', 'conforme']
  },

  // RGPD & Confidentialité (3 questions)
  {
    id: 'r1',
    category: 'rgpd',
    question: 'Comment exercer mon droit d\'accès à mes données (RGPD) ?',
    answer: 'Allez dans Mon Compte > Confidentialité RGPD, cliquez sur "Demander mes données". Vous recevrez un export complet au format JSON dans les 48h (délai légal : 30 jours). Le fichier contient toutes vos données personnelles et d\'utilisation.',
    keywords: ['rgpd', 'données', 'export', 'droit d\'accès', 'confidentialité']
  },
  {
    id: 'r2',
    category: 'rgpd',
    question: 'Comment supprimer définitivement mon compte et mes données ?',
    answer: 'Dans Mon Compte > Supprimer mon compte, confirmez avec votre mot de passe. Toutes vos données sont supprimées sous 7 jours (conformité RGPD). Vous pouvez demander un export avant suppression. Les données de facturation légales (factures émises) sont conservées 10 ans (obligation légale article L123-22).',
    keywords: ['supprimer', 'compte', 'données', 'effacer', 'droit à l\'oubli']
  },
  {
    id: 'r3',
    category: 'rgpd',
    question: 'CassKai utilise-t-il des cookies publicitaires ?',
    answer: 'Non. CassKai n\'utilise aucun cookie publicitaire ou de tracking tiers. Seuls des cookies essentiels (session, préférences) et analytics anonymisés (Plausible, sans cookies) sont utilisés. Vous pouvez refuser les cookies analytics dans le bandeau de consentement sans limiter les fonctionnalités.',
    keywords: ['cookies', 'tracking', 'publicité', 'consentement', 'analytics']
  },

  // Abonnement & Paiement (3 questions)
  {
    id: 'a1',
    category: 'abonnement',
    question: 'Quels sont les tarifs et les modes de paiement acceptés ?',
    answer: 'Plans : Starter 39€/mois (1 entreprise, 50 factures/mois), Pro 89€/mois (3 entreprises, factures illimitées, multi-devises), Enterprise 159€/mois (entreprises illimitées, API, support prioritaire). Paiements acceptés : CB (Visa, Mastercard), SEPA, PayPal. Réduction -20% sur abonnement annuel.',
    keywords: ['tarifs', 'prix', 'paiement', 'abonnement', 'plan', 'formule']
  },
  {
    id: 'a2',
    category: 'abonnement',
    question: 'Puis-je changer de plan à tout moment ?',
    answer: 'Oui, sans engagement. Upgrade immédiat (facturation au prorata), downgrade à la fin du cycle en cours. Différence remboursée au prorata si passage annuel → mensuel. Aucun frais de changement. Allez dans Mon Compte > Abonnement > Changer de plan.',
    keywords: ['changer plan', 'upgrade', 'downgrade', 'modifier abonnement']
  },
  {
    id: 'a3',
    category: 'abonnement',
    question: 'Que se passe-t-il si j\'annule mon abonnement ?',
    answer: 'Vous gardez l\'accès jusqu\'à la fin de la période payée. Après expiration, votre compte passe en "lecture seule" : vous pouvez consulter et exporter vos données mais plus créer de nouvelles factures/écritures. Données conservées 90 jours avant archivage. Ré-abonnement possible à tout moment.',
    keywords: ['annuler', 'résilier', 'abonnement', 'fin', 'expiration']
  },

  // Technique & Support (3 questions)
  {
    id: 't1',
    category: 'technique',
    question: 'CassKai est-il accessible sur mobile (smartphone/tablette) ?',
    answer: 'Oui, CassKai est 100% responsive et fonctionne sur tous les navigateurs modernes (Chrome, Firefox, Safari, Edge). Interface adaptée tactile pour tablettes/smartphones. Une application mobile native iOS/Android est prévue pour Q1 2026 (voir la roadmap publique).',
    keywords: ['mobile', 'smartphone', 'tablette', 'ios', 'android', 'responsive']
  },
  {
    id: 't2',
    category: 'technique',
    question: 'Quels navigateurs sont compatibles avec CassKai ?',
    answer: 'Navigateurs supportés : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Résolution minimale : 1280x720px. JavaScript doit être activé. Pour une expérience optimale, utilisez la dernière version de votre navigateur.',
    keywords: ['navigateur', 'compatibilité', 'chrome', 'firefox', 'safari', 'edge']
  },
  {
    id: 't3',
    category: 'technique',
    question: 'Comment contacter le support si j\'ai un problème ?',
    answer: 'Plusieurs options : Chat en direct (icône en bas à droite, réponse < 5 min en heures ouvrées 9h-18h), Email support@casskai.com (réponse < 24h), Téléphone +33 7 52 02 71 98 (lun-ven 9h-18h), Centre d\'aide /faq. Pour les plans Pro/Enterprise, support prioritaire < 2h.',
    keywords: ['support', 'aide', 'contact', 'problème', 'assistance', 'chat']
  },
];

const categoryConfig = {
  general: { label: 'Général', color: 'blue', icon: HelpCircle },
  compte: { label: 'Compte & Connexion', color: 'green', icon: Users },
  comptabilite: { label: 'Comptabilité', color: 'purple', icon: BarChart3 },
  facturation: { label: 'Facturation', color: 'orange', icon: FileText },
  rgpd: { label: 'RGPD & Confidentialité', color: 'red', icon: Shield },
  abonnement: { label: 'Abonnement & Paiement', color: 'yellow', icon: CreditCard },
  technique: { label: 'Technique & Support', color: 'gray', icon: Database },
};

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter FAQ items
  const filteredFAQ = faqData.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <>
      <FAQPageSEO />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <HelpCircle className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Centre d'aide CassKai
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Trouvez rapidement des réponses à vos questions. Utilisez la recherche ou parcourez par catégorie.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans la FAQ... (ex: 'import facture', 'RGPD', 'tarifs')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Toutes ({faqData.length})
            </button>
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon;
              const count = faqData.filter((item) => item.category === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === key
                      ? `bg-${config.color}-600 text-white shadow-lg`
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="mb-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {filteredFAQ.length} résultat{filteredFAQ.length !== 1 ? 's' : ''} pour "{searchQuery}"
            </p>
          </div>
        )}

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQ.length === 0 ? (
            <EmptySearch
              icon={HelpCircle}
              title="Aucun résultat trouvé"
              description="Essayez avec d'autres mots-clés ou contactez notre support."
            />
          ) : (
            filteredFAQ.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              const categoryInfo = categoryConfig[item.category];
              const CategoryIcon = categoryInfo.icon;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg bg-${categoryInfo.color}-100 dark:bg-${categoryInfo.color}-900/30`}>
                        <CategoryIcon className={`h-5 w-5 text-${categoryInfo.color}-600 dark:text-${categoryInfo.color}-400`} />
                      </div>
                      <div className="flex-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded bg-${categoryInfo.color}-100 dark:bg-${categoryInfo.color}-900/30 text-${categoryInfo.color}-700 dark:text-${categoryInfo.color}-300`}>
                          {categoryInfo.label}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                          {item.question}
                        </h3>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2">
                      <div className="ml-14 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {item.answer}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact Support Section */}
        <div className="mt-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Vous ne trouvez pas votre réponse ?</h2>
            <p className="text-blue-100 text-lg">
              Notre équipe est là pour vous aider. Contactez-nous via votre canal préféré.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Chat */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all">
              <MessageCircle className="h-10 w-10 mb-4 text-blue-200" />
              <h3 className="text-xl font-semibold mb-2">Chat en direct</h3>
              <p className="text-blue-100 mb-4 text-sm">Réponse en moins de 5 minutes</p>
              <p className="text-xs text-blue-200">Lun-Ven 9h-18h CET</p>
            </div>

            {/* Email */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all">
              <Mail className="h-10 w-10 mb-4 text-blue-200" />
              <h3 className="text-xl font-semibold mb-2">Email</h3>
              <a
                href="mailto:support@casskai.com"
                className="text-blue-100 hover:text-white mb-4 text-sm block underline"
              >
                support@casskai.com
              </a>
              <p className="text-xs text-blue-200">Réponse sous 24h</p>
            </div>

            {/* Phone */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all">
              <Phone className="h-10 w-10 mb-4 text-blue-200" />
              <h3 className="text-xl font-semibold mb-2">Téléphone</h3>
              <a
                href="tel:+33752027198"
                className="text-blue-100 hover:text-white mb-4 text-sm block underline"
              >
                +33 7 52 02 71 98
              </a>
              <p className="text-xs text-blue-200">Lun-Ven 9h-18h CET</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-blue-100 text-sm">
              <Clock className="inline h-4 w-4 mr-1" />
              Plans Pro et Enterprise : Support prioritaire avec réponse garantie sous 2h
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-4 gap-6">
          <a
            href="/legal"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all group"
          >
            <FileCheck className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Documents légaux</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">CGU, CGV, Confidentialité</p>
          </a>

          <a
            href="/roadmap"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all group"
          >
            <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Roadmap</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Prochaines fonctionnalités</p>
          </a>

          <a
            href="/gdpr"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all group"
          >
            <Shield className="h-8 w-8 text-green-600 dark:text-green-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Mes données RGPD</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Exporter, supprimer</p>
          </a>

          <a
            href="/pricing"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-lg transition-all group"
          >
            <CreditCard className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tarifs</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Voir tous les plans</p>
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
