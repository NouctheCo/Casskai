/**
 * CassKai Landing V2 - Hero Chat Assistant
 * Interface de chat moderne et user-friendly pour démontrer l'IA
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Play, Send, Bot, User, TrendingUp, TrendingDown, Minus, BarChart3, Receipt, Wallet, PieChart, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/contexts/LocaleContext';

interface ChatMessage {
  type: 'user' | 'assistant' | 'typing';
  content: string;
  metrics?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
    percentage?: string;
  }[];
}

// Demo questions will be loaded from translations in the component

// Base de connaissances étendue pour la démo
interface ResponseData {
  content: string;
  metrics: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
    percentage?: string;
  }[];
}

const KNOWLEDGE_BASE: Record<string, { keywords: string[]; response: ResponseData }> = {
  tresorerie: {
    keywords: ['tresorerie', 'cash', 'argent', 'liquide', 'banque', 'compte', 'solde', 'disponible', 'fonds'],
    response: {
      content: "Votre trésorerie est en bonne santé ! Voici le résumé :",
      metrics: [
        { label: "Trésorerie actuelle", value: "127 500 €", trend: 'up', percentage: "+12%" },
        { label: "CA en cours", value: "89 200 €", trend: 'up', percentage: "+8%" },
        { label: "Marge brute", value: "34.2%", trend: 'up', percentage: "+2.1%" },
        { label: "Conformité", value: "100%", trend: 'neutral' },
      ]
    }
  },
  factures: {
    keywords: ['facture', 'retard', 'impaye', 'creance', 'recouvrement', 'client', 'paiement', 'relance', 'echeance', 'du'],
    response: {
      content: "Vous avez quelques factures à relancer. Voici le détail :",
      metrics: [
        { label: "Factures en retard", value: "3", trend: 'down', percentage: "-2" },
        { label: "Montant total", value: "15 420 €", trend: 'down' },
        { label: "Retard moyen", value: "12 jours", trend: 'neutral' },
        { label: "Taux recouvrement", value: "94%", trend: 'up', percentage: "+3%" },
      ]
    }
  },
  chiffre_affaires: {
    keywords: ['chiffre', 'affaires', 'ca', 'vente', 'revenu', 'mois', 'recette', 'encaissement', 'performance', 'resultat'],
    response: {
      content: "Votre CA progresse bien ce mois-ci !",
      metrics: [
        { label: "CA Janvier 2026", value: "89 200 €", trend: 'up', percentage: "+15%" },
        { label: "Objectif mensuel", value: "100 000 €", trend: 'neutral' },
        { label: "Progression", value: "89%", trend: 'up' },
        { label: "Prévision fin mois", value: "98 500 €", trend: 'up' },
      ]
    }
  },
  depenses: {
    keywords: ['depense', 'cout', 'charge', 'frais', 'sortie', 'achat', 'fournisseur', 'payer', 'budget'],
    response: {
      content: "Voici la répartition de vos dépenses ce mois :",
      metrics: [
        { label: "Salaires", value: "42 000 €", trend: 'neutral', percentage: "48%" },
        { label: "Loyer & Charges", value: "8 500 €", trend: 'neutral', percentage: "10%" },
        { label: "Fournisseurs", value: "23 400 €", trend: 'down', percentage: "-5%" },
        { label: "Marketing", value: "6 200 €", trend: 'up', percentage: "+12%" },
      ]
    }
  },
  rentabilite: {
    keywords: ['rentable', 'rentabilite', 'profit', 'benefice', 'marge', 'gain', 'pertes', 'resultat'],
    response: {
      content: "Votre rentabilité est excellente ! Voici les indicateurs clés :",
      metrics: [
        { label: "Marge nette", value: "18.5%", trend: 'up', percentage: "+2.3%" },
        { label: "ROI", value: "24%", trend: 'up', percentage: "+5%" },
        { label: "EBITDA", value: "45 600 €", trend: 'up', percentage: "+8%" },
        { label: "Point mort", value: "Atteint", trend: 'neutral' },
      ]
    }
  },
  tva: {
    keywords: ['tva', 'taxe', 'fiscal', 'impot', 'declaration', 'urssaf', 'social', 'cotisation'],
    response: {
      content: "Vos obligations fiscales sont à jour. Voici le récapitulatif :",
      metrics: [
        { label: "TVA à payer", value: "12 450 €", trend: 'neutral' },
        { label: "Échéance", value: "15 Fév", trend: 'neutral' },
        { label: "Déclarations", value: "100%", trend: 'up', percentage: "À jour" },
        { label: "Prochaine DSN", value: "5 Fév", trend: 'neutral' },
      ]
    }
  },
  salaires: {
    keywords: ['salaire', 'paie', 'employe', 'collaborateur', 'equipe', 'rh', 'personnel', 'masse'],
    response: {
      content: "Voici la situation de votre masse salariale :",
      metrics: [
        { label: "Masse salariale", value: "42 000 €", trend: 'neutral' },
        { label: "Effectif", value: "12", trend: 'up', percentage: "+1" },
        { label: "Coût moyen", value: "3 500 €", trend: 'neutral' },
        { label: "Bulletins prêts", value: "100%", trend: 'up' },
      ]
    }
  },
  previsions: {
    keywords: ['prevision', 'futur', 'projection', 'anticiper', 'prochain', 'trimestre', 'annee', 'forecast'],
    response: {
      content: "Voici vos prévisions financières pour les 3 prochains mois :",
      metrics: [
        { label: "CA prévu T1", value: "285 000 €", trend: 'up', percentage: "+18%" },
        { label: "Trésorerie prévue", value: "145 000 €", trend: 'up', percentage: "+14%" },
        { label: "Investissements", value: "25 000 €", trend: 'neutral' },
        { label: "Risque détecté", value: "Faible", trend: 'up' },
      ]
    }
  },
  stock: {
    keywords: ['stock', 'inventaire', 'marchandise', 'produit', 'approvisionnement', 'rupture'],
    response: {
      content: "État de vos stocks et approvisionnements :",
      metrics: [
        { label: "Valeur stock", value: "67 800 €", trend: 'neutral' },
        { label: "Rotation", value: "4.2x", trend: 'up', percentage: "+0.3" },
        { label: "Alertes rupture", value: "2", trend: 'down' },
        { label: "Commandes en cours", value: "8 500 €", trend: 'neutral' },
      ]
    }
  }
};

// Réponses par défaut pour les questions non reconnues (variées)
const DEFAULT_RESPONSES: ResponseData[] = [
  {
    content: "Je suis en mode démo sur cet espace public. Une fois connecté, je pourrai analyser vos vraies données ! Essayez plutôt : \"Comment va ma trésorerie ?\"",
    metrics: [
      { label: "Mode", value: "Démo", trend: 'neutral' },
      { label: "Fonctionnalités", value: "9+", trend: 'up' },
      { label: "Connecté", value: "Non", trend: 'neutral' },
      { label: "Essai gratuit", value: "30 jours", trend: 'up' },
    ]
  },
  {
    content: "Cette démo montre un aperçu limité. Avec vos données réelles, je réponds à toutes vos questions ! Testez : \"Mes factures en retard ?\"",
    metrics: [
      { label: "Questions possibles", value: "Illimitées", trend: 'up' },
      { label: "Précision", value: "99%", trend: 'up' },
      { label: "Temps réponse", value: "<2s", trend: 'up' },
      { label: "Langues", value: "FR/EN", trend: 'neutral' },
    ]
  },
  {
    content: "Je fonctionne en mode démonstration ici. Créez votre compte pour des analyses personnalisées ! Essayez : \"Quelle est ma rentabilité ?\"",
    metrics: [
      { label: "Données", value: "Démo", trend: 'neutral' },
      { label: "IA", value: "Active", trend: 'up' },
      { label: "Sécurité", value: "100%", trend: 'up' },
      { label: "Support", value: "24/7", trend: 'up' },
    ]
  },
  {
    content: "Sur cet espace public, mes réponses sont limitées aux exemples. Inscrivez-vous pour exploiter tout mon potentiel ! Testez : \"Ma TVA à payer ?\"",
    metrics: [
      { label: "Catégories", value: "9", trend: 'up' },
      { label: "Normes", value: "PCG/OHADA", trend: 'up' },
      { label: "Multi-devises", value: "Oui", trend: 'up' },
      { label: "Prévisions", value: "12 mois", trend: 'up' },
    ]
  }
];

// Compteur pour varier les réponses par défaut
let defaultResponseIndex = 0;

function getDefaultResponse(): ResponseData {
  const response = DEFAULT_RESPONSES[defaultResponseIndex];
  defaultResponseIndex = (defaultResponseIndex + 1) % DEFAULT_RESPONSES.length;
  return response;
}

// Fonction pour normaliser les questions (ignorer accents, casse, ponctuation)
function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?!.,;:'"-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fonction intelligente de matching avec scoring
function findBestResponse(input: string): ResponseData {
  const normalizedInput = normalizeText(input);
  const words = normalizedInput.split(' ').filter(w => w.length > 2);

  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, data] of Object.entries(KNOWLEDGE_BASE)) {
    let score = 0;
    for (const keyword of data.keywords) {
      // Score exact match plus élevé
      if (normalizedInput.includes(keyword)) {
        score += 2;
      }
      // Score partiel pour les mots similaires
      for (const word of words) {
        if (keyword.includes(word) || word.includes(keyword)) {
          score += 1;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // Si score suffisant, retourner la réponse correspondante
  if (bestCategory && bestScore >= 2) {
    return KNOWLEDGE_BASE[bestCategory].response;
  }

  // Sinon, retourner une réponse par défaut variée
  return getDefaultResponse();
}

export function HeroTerminal() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Load demo questions from translations
  const DEMO_QUESTIONS = useMemo(() => [
    t('landing.hero.chat.demoQuestions.treasury'),
    t('landing.hero.chat.demoQuestions.invoices'),
    t('landing.hero.chat.demoQuestions.revenue'),
    t('landing.hero.chat.demoQuestions.expenses'),
  ], [t]);

  const handleQuestionSubmit = useCallback(async (question: string) => {
    if (isTyping || !question.trim()) return;

    setShowSuggestions(false);
    setIsTyping(true);

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: question }]);
    setCurrentInput('');

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Add typing indicator
    setMessages(prev => [...prev, { type: 'typing', content: '' }]);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Trouver la meilleure réponse via le système de matching intelligent
    const responseData = findBestResponse(question);
    const response: ChatMessage = {
      type: 'assistant',
      content: responseData.content,
      metrics: responseData.metrics
    };

    // Replace typing with response
    setMessages(prev => {
      const newMessages = prev.filter(m => m.type !== 'typing');
      return [...newMessages, response];
    });

    setIsTyping(false);

    // Scroll to bottom
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [isTyping, chatRef]);

  // Auto-demo on load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length === 0) {
        handleQuestionSubmit(DEMO_QUESTIONS[0]);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [messages.length, DEMO_QUESTIONS, handleQuestionSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      handleQuestionSubmit(currentInput.trim());
    }
  };

  const TrendIcon = ({ trend }: { trend?: 'up' | 'down' | 'neutral' }) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT COLUMN - Text Content */}
          <div className="space-y-6">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center lg:justify-start mb-6"
            >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">{t('landing.hero.badge')}</span>
          </div>
        </motion.div>

            {/* Main headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center lg:text-left mb-10"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
                {t('landing.hero.newTitle')}
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {t('landing.hero.newTitleHighlight')}
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto lg:mx-0">
                {t('landing.hero.newSubtitle')}
              </p>

              {/* Quick Features Pills */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap justify-center lg:justify-start gap-3 mt-6"
              >
            {[
              { icon: BarChart3, label: t('landing.hero.features.dashboard') },
              { icon: Receipt, label: t('landing.hero.features.invoicing') },
              { icon: Wallet, label: t('landing.hero.features.treasury') },
              { icon: Calculator, label: t('landing.hero.features.accounting') },
              { icon: PieChart, label: t('landing.hero.features.analytics') },
              { icon: FileText, label: t('landing.hero.features.reports') },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50 text-xs text-slate-300"
              >
                <feature.icon className="w-3.5 h-3.5 text-blue-400" />
                <span>{feature.label}</span>
              </div>
            ))}
              </motion.div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 mt-10"
            >
              <Button
                size="lg"
                type="button"
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
              >
                {t('landing.hero.newCta.primary')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                type="button"
                variant="outline"
                onClick={() => {
                  const featuresSection = document.getElementById('features');
                  featuresSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-6 text-lg rounded-xl"
              >
                <Play className="mr-2 w-5 h-5" />
                {t('landing.hero.newCta.secondary')}
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-8 sm:gap-12 mt-14 text-center lg:text-left"
            >
              {[
                { value: '26+', label: t('landing.hero.stats.countries') },
                { value: '5', label: t('landing.hero.stats.standards') },
                { value: '99.9%', label: t('landing.hero.stats.availability') },
                { value: '24/7', label: t('landing.hero.stats.support') },
              ].map((stat, index) => (
                <div key={index} className="px-2">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT COLUMN - Chat Demo */}
          <div>
            {/* Chat Interface */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
          {/* Glow effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-60" />

          {/* Chat window */}
          <div className="relative bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-slate-800/80 to-slate-800/60 border-b border-slate-700/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm">{t('landing.hero.chat.assistantName')}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-400">{t('landing.hero.chat.online')}</span>
                </div>
              </div>
            </div>

            {/* Chat content */}
            <div
              ref={chatRef}
              className="p-5 min-h-[320px] max-h-[380px] overflow-y-auto space-y-4"
            >
              {/* Welcome message */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-800/60 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {t('landing.hero.chat.welcome')}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {message.type === 'user' && (
                      <div className="flex gap-3 justify-end">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%]">
                          <p className="text-white text-sm">{message.content}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                    )}

                    {message.type === 'typing' && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-slate-800/60 rounded-2xl rounded-tl-md px-4 py-3">
                          <div className="flex gap-1.5 items-center h-5">
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {message.type === 'assistant' && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 space-y-3 max-w-[90%]">
                          <div className="bg-slate-800/60 rounded-2xl rounded-tl-md px-4 py-3">
                            <p className="text-slate-300 text-sm leading-relaxed">{message.content}</p>
                          </div>

                          {message.metrics && (
                            <div className="grid grid-cols-2 gap-2">
                              {message.metrics.map((metric, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.08 }}
                                  className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30"
                                >
                                  <div className="text-xs text-slate-500 mb-1">{metric.label}</div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-base font-semibold text-white">{metric.value}</span>
                                    {metric.percentage && (
                                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                        metric.trend === 'up' ? 'bg-green-500/15 text-green-400' :
                                        metric.trend === 'down' ? 'bg-amber-500/15 text-amber-400' :
                                        'bg-slate-500/15 text-slate-400'
                                      }`}>
                                        <TrendIcon trend={metric.trend} />
                                        {metric.percentage}
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-3"
                >
                  <div className="text-xs text-slate-500 mb-2">{t('landing.hero.chat.suggestions')}</div>
                  <div className="flex flex-wrap gap-2">
                    {DEMO_QUESTIONS.map((question, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleQuestionSubmit(question)}
                        className="px-3 py-2 text-xs bg-slate-800/50 hover:bg-slate-700/60 text-slate-400 hover:text-white rounded-xl border border-slate-700/40 transition-all hover:border-slate-600/60"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input area */}
            <div className="p-4 bg-slate-800/30 border-t border-slate-700/30">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('landing.hero.chat.placeholder')}
                  className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isTyping}
                />
                <button
                  type="button"
                  onClick={() => currentInput.trim() && handleQuestionSubmit(currentInput.trim())}
                  disabled={isTyping || !currentInput.trim()}
                  aria-label="Send message"
                  className="w-11 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-slate-600/50 flex items-start justify-center p-2"
        >
          <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

export default HeroTerminal;
