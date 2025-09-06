// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CountrySelector } from '@/components/ui/CountrySelector';
import { getMarketPricing, formatMarketPrice, getDefaultCountryCode } from '@/services/marketPricingService';
import { changeLanguageAndDetectCountry } from '@/i18n/i18n';
import { PageContainer } from '@/components/ui/PageContainer';
import { 
  Calculator, 
  FileText, 
  PieChart, 
  Users, 
  Shield, 
  Globe,
  Zap,
  ArrowRight,
  Play,
  CheckCircle,
  Star,
  Menu,
  X,
  MessageCircle,
  MapPin,
  Mail,
  Phone,
  Building,
  CreditCard,
  Banknote,
  TrendingUp,
  BarChart3,
  Clock,
  Lock,
  Database,
  CloudUpload,
  Smartphone,
  Laptop,
  Tablet,
  Award,
  Target,
  Briefcase,
  DollarSign,
  Euro,
  Quote
} from 'lucide-react';

// Composant d'animation au scroll
const AnimatedSection = ({ children, className = "" }) => {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Composant de navigation moderne
const Navigation = ({ isScrolled }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { key: 'features', label: t('landing.nav.features', 'Fonctionnalités') },
    { key: 'pricing', label: t('landing.nav.pricing', 'Tarifs') },
    { key: 'testimonials', label: t('landing.nav.testimonials', 'Témoignages') },
    { key: 'contact', label: t('landing.nav.contact', 'Contact') }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg border-b border-gray-200/20 dark:border-gray-700/20' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo avec effet premium */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-2.5 rounded-xl shadow-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                CassKai
              </span>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Business Suite
              </div>
            </div>
          </motion.div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.button
                key={item.key}
                onClick={() => scrollToSection(item.key)}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium relative group"
                whileHover={{ y: -1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {item.label}
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></div>
              </motion.button>
            ))}
          </div>

          {/* Actions Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {t('landing.nav.login', 'Connexion')}
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Zap className="w-4 h-4 mr-2" />
                {t('landing.nav.signup', 'Commencer')}
              </Button>
            </motion.div>
          </div>

          {/* Menu mobile */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200/20 dark:border-gray-700/20 rounded-b-lg shadow-lg"
          >
            <div className="py-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => scrollToSection(item.key)}
                  className="block w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg mx-2 transition-colors font-medium"
                >
                  {item.label}
                </button>
              ))}
              <div className="px-4 py-2 space-y-3 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  {t('landing.nav.login', 'Connexion')}
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {t('landing.nav.signup', 'Commencer')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

// Hero Section améliorée
const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      
      {/* Arrière-plan animé */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/5 to-blue-400/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            {/* Badge de nouveauté */}
            <motion.div 
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium mb-8 rounded-full border border-blue-200/50 dark:border-blue-700/50 shadow-sm"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Zap className="w-4 h-4 mr-2 animate-pulse" />
              {t('landing.hero.badge', '🚀 Nouvelle génération de gestion d\'entreprise')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </motion.div>
            
            {/* Titre principal */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {t('landing.hero.title', 'Gérez votre entreprise')}
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {t('landing.hero.subtitle', 'en toute simplicité')}
              </span>
            </h1>
            
            {/* Description */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              {t('landing.hero.description', 'CassKai révolutionne la gestion d\'entreprise avec une suite complète : comptabilité, facturation, CRM, projets, RH et bien plus. Tout en un, simple et puissant.')}
            </p>
          </motion.div>

          {/* Boutons CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate('/register')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-6 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-xl"
              >
                <Zap className="mr-3 w-6 h-6" />
                {t('landing.hero.cta.start', 'Essai gratuit 14 jours')}
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-6 text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl"
              >
                <Play className="mr-3 w-6 h-6" />
                {t('landing.hero.cta.demo', 'Voir la démo')}
              </Button>
            </motion.div>
          </motion.div>

          {/* Statistiques améliorées */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
          >
            {[
              { number: '10,000+', label: t('landing.hero.stats.companies', 'Entreprises'), icon: Building, color: 'text-blue-600' },
              { number: '99.9%', label: t('landing.hero.stats.uptime', 'Disponibilité'), icon: Shield, color: 'text-green-600' },
              { number: '24/7', label: t('landing.hero.stats.support', 'Support'), icon: MessageCircle, color: 'text-purple-600' },
              { number: '5★', label: t('landing.hero.stats.rating', 'Satisfaction'), icon: Star, color: 'text-yellow-600' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Section des fonctionnalités complète
const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Calculator,
      title: t('landing.features.accounting.title', 'Comptabilité & Finances'),
      description: t('landing.features.accounting.description', 'Gestion complète de votre comptabilité avec écritures automatisées, plan comptable personnalisable et rapports financiers en temps réel.'),
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      details: ['Écritures automatisées', 'Plans comptables internationaux (PCG, SYSCOHADA, IFRS...)', 'Rapports en temps réel', 'Export FEC']
    },
    {
      icon: FileText,
      title: t('landing.features.invoicing.title', 'Facturation & CRM'),
      description: t('landing.features.invoicing.description', 'Créez et envoyez vos factures en quelques clics. Gérez vos clients, suivez vos ventes et automatisez vos relances.'),
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      details: ['Factures personnalisées', 'Suivi des paiements', 'CRM intégré', 'Relances automatiques']
    },
    {
      icon: PieChart,
      title: t('landing.features.analytics.title', 'Analyses & Rapports'),
      description: t('landing.features.analytics.description', 'Tableaux de bord interactifs, analyses prédictives et rapports personnalisables pour piloter votre entreprise en toute connaissance.'),
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      details: ['Tableaux de bord interactifs', 'Analyses prédictives', 'Rapports personnalisés', 'KPIs en temps réel']
    },
    {
      icon: Users,
      title: t('landing.features.hr.title', 'Ressources Humaines'),
      description: t('landing.features.hr.description', 'Gestion complète de vos employés : paie, congés, absences, formations et déclarations sociales simplifiées.'),
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      details: ['Gestion des employés', 'Paie automatisée', 'Suivi des congés', 'Déclarations sociales']
    },
    {
      icon: Briefcase,
      title: t('landing.features.projects.title', 'Gestion de Projets'),
      description: t('landing.features.projects.description', 'Planifiez, suivez et livrez vos projets à temps. Gestion d\'équipes, budgets et échéances dans une interface intuitive.'),
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      details: ['Planification projet', 'Suivi équipes', 'Gestion budgets', 'Échéances intelligentes']
    },
    {
      icon: CreditCard,
      title: t('landing.features.banking.title', 'Gestion Bancaire'),
      description: t('landing.features.banking.description', 'Connectez vos comptes bancaires, automatisez les rapprochements et suivez votre trésorerie en temps réel.'),
      color: 'from-indigo-500 to-blue-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      details: ['Connexion bancaire', 'Rapprochement auto', 'Suivi trésorerie', 'Prévisions cash-flow']
    }
  ];

  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-20">
          <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-200 border-blue-200/50 dark:border-blue-700/50">
            <Star className="w-4 h-4 mr-2" />
            {t('landing.features.badge', 'Suite complète')}
          </Badge>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t('landing.features.title', 'Tout ce dont vous avez besoin')}
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('landing.features.subtitle', 'dans une seule application')}
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('landing.features.description', 'CassKai réunit tous les outils essentiels à la gestion de votre entreprise dans une interface moderne et intuitive.')}
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <AnimatedSection key={index}>
              <motion.div
                className="group h-full"
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm group-hover:bg-white dark:group-hover:bg-gray-800">
                  <CardHeader className="pb-4">
                    <div className={`w-16 h-16 rounded-xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`w-10 h-10 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        {/* Section avantages supplémentaires */}
        <AnimatedSection className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: t('landing.features.security.title', 'Sécurité maximale'),
                description: t('landing.features.security.description', 'Données chiffrées, sauvegardes automatiques et conformité RGPD.'),
                color: 'text-green-600'
              },
              {
                icon: Globe,
                title: t('landing.features.access.title', 'Accès partout'),
                description: t('landing.features.access.description', 'Application web responsive accessible depuis tous vos appareils.'),
                color: 'text-blue-600'
              },
              {
                icon: Zap,
                title: t('landing.features.automation.title', 'Automatisation'),
                description: t('landing.features.automation.description', 'Workflows intelligents qui vous font gagner du temps au quotidien.'),
                color: 'text-purple-600'
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <benefit.icon className={`w-12 h-12 ${benefit.color} mx-auto mb-4`} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

// Section de tarification complète
const PricingSection = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(() => 
    getDefaultCountryCode(navigator.language)
  );

  // Gérer le changement de pays
  const handleCountryChange = async (countryCode: string) => {
    setSelectedCountry(countryCode);
    // Changer la langue de l'application si nécessaire
    const marketPricing = getMarketPricing(countryCode);
    if (marketPricing && i18n.language !== marketPricing.language) {
      await changeLanguageAndDetectCountry(countryCode);
    }
  };

  // Obtenir les données de tarification du marché actuel
  const currentMarket = getMarketPricing(selectedCountry);
  
  if (!currentMarket) {
    return <div>Erreur de tarification</div>;
  }

  // Plans avec tarification locale
  const basePlans = [
    {
      name: t('landing.pricing.starter.name', 'Starter'),
      description: t('landing.pricing.starter.description', 'Parfait pour débuter'),
      pricing: currentMarket.starter,
      popular: false,
      features: [
        t('landing.pricing.starter.features.invoicing', 'Facturation illimitée'),
        t('landing.pricing.starter.features.clients', 'Jusqu\'à 100 clients'),
        t('landing.pricing.starter.features.accounting', 'Comptabilité de base'),
        t('landing.pricing.starter.features.reports', '10 rapports standards'),
        t('landing.pricing.starter.features.support', 'Support email'),
        t('landing.pricing.starter.features.storage', '5 GB de stockage')
      ],
      color: 'from-gray-600 to-gray-800',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      textColor: 'text-gray-900 dark:text-white'
    },
    {
      name: t('landing.pricing.professional.name', 'Professionnel'),
      description: t('landing.pricing.professional.description', 'Pour les entreprises en croissance'),
      pricing: currentMarket.professional,
      popular: true,
      features: [
        t('landing.pricing.professional.features.everything', 'Tout du plan Starter'),
        t('landing.pricing.professional.features.clients', 'Clients illimités'),
        t('landing.pricing.professional.features.advanced', 'Comptabilité avancée'),
        t('landing.pricing.professional.features.crm', 'CRM complet'),
        t('landing.pricing.professional.features.projects', 'Gestion de projets'),
        t('landing.pricing.professional.features.hr', 'RH de base'),
        t('landing.pricing.professional.features.reports', 'Rapports illimités'),
        t('landing.pricing.professional.features.api', 'API Access'),
        t('landing.pricing.professional.features.storage', '50 GB de stockage'),
        t('landing.pricing.professional.features.support', 'Support prioritaire')
      ],
      color: 'from-blue-600 to-purple-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20',
      textColor: 'text-blue-900 dark:text-blue-100'
    },
    {
      name: t('landing.pricing.enterprise.name', 'Entreprise'),
      description: t('landing.pricing.enterprise.description', 'Solution complète sur mesure'),
      pricing: currentMarket.enterprise,
      popular: false,
      features: [
        t('landing.pricing.enterprise.features.everything', 'Tout du plan Professionnel'),
        t('landing.pricing.enterprise.features.users', 'Utilisateurs illimités'),
        t('landing.pricing.enterprise.features.hr_advanced', 'RH avancées'),
        t('landing.pricing.enterprise.features.banking', 'Connexions bancaires'),
        t('landing.pricing.enterprise.features.forecasting', 'Prévisions financières'),
        t('landing.pricing.enterprise.features.audit', 'Piste d\'audit complète'),
        t('landing.pricing.enterprise.features.integrations', 'Intégrations personnalisées'),
        t('landing.pricing.enterprise.features.storage', 'Stockage illimité'),
        t('landing.pricing.enterprise.features.support', 'Support dédié 24/7'),
        t('landing.pricing.enterprise.features.onboarding', 'Formation incluse')
      ],
      color: 'from-purple-600 to-indigo-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-900 dark:text-purple-100'
    }
  ];

  // Calculer les prix selon la période (mensuel/annuel)
  const plans = basePlans.map(plan => {
    // Utiliser les prix optimisés du marché
    const pricing = plan.pricing;
    
    // Prix selon la période sélectionnée
    const currentPrice = isAnnual ? pricing.annual : pricing.monthly;
    const currentOriginalPrice = isAnnual ? pricing.annualOriginal : pricing.monthlyOriginal;
    
    // Pour l'affichage annuel, calculer le prix mensuel équivalent
    const displayMonthlyPrice = isAnnual ? Math.round(pricing.annual / 12) : pricing.monthly;
    const displayMonthlyOriginalPrice = isAnnual ? Math.round(pricing.annualOriginal / 12) : pricing.monthlyOriginal;
    
    return {
      ...plan,
      price: currentPrice,
      originalPrice: currentOriginalPrice,
      displayMonthlyPrice,
      displayMonthlyOriginalPrice,
      period: isAnnual ? t('landing.pricing.period.annual', '/an') : t('landing.pricing.period', '/mois'),
      currency: currentMarket.currency,
      currencySymbol: currentMarket.currencySymbol,
      countryFlag: currentMarket.flag
    };
  });

  return (
    <section id="pricing" className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-20">
          <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 text-green-800 dark:text-green-200 border-green-200/50 dark:border-green-700/50">
            <DollarSign className="w-4 h-4 mr-2" />
            {t('landing.pricing.badge', 'Tarifs transparents')}
          </Badge>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t('landing.pricing.title', 'Choisissez votre plan')}
            <br />
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {t('landing.pricing.subtitle', 'et démarrez aujourd\'hui')}
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            {t('landing.pricing.description', 'Tous nos plans incluent un essai gratuit de 14 jours, sans engagement et sans carte bancaire.')}
          </p>

          {/* Sélecteur de pays avec drapeaux */}
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountryChange={handleCountryChange}
            className="mb-8"
            showAfricanFirst={true}
          />

          {/* Toggle annuel/mensuel */}
          <div className="inline-flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
                !isAnnual 
                  ? 'text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('landing.pricing.monthly', 'Mensuel')}
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
                isAnnual 
                  ? 'text-gray-900 dark:text-white bg-white dark:bg-gray-700 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('landing.pricing.annual', 'Annuel')}
              <Badge className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs">
                -20%
              </Badge>
            </button>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {plans.map((plan, index) => (
            <AnimatedSection key={index}>
              <motion.div
                className="relative group h-full"
                whileHover={{ y: plan.popular ? -16 : -8, scale: plan.popular ? 1.05 : 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg">
                      <Star className="w-4 h-4 mr-2" />
                      {t('landing.pricing.popular', 'Plus populaire')}
                    </Badge>
                  </div>
                )}
                
                <Card className={`h-full border-2 ${plan.popular ? 'border-blue-200 dark:border-blue-700 shadow-2xl' : 'border-gray-200 dark:border-gray-700 shadow-lg'} hover:shadow-2xl transition-all duration-300 ${plan.bgColor} group-hover:border-blue-300 dark:group-hover:border-blue-600`}>
                  <CardHeader className="text-center pb-8">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${plan.color} mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    
                    <CardTitle className={`text-2xl font-bold ${plan.textColor} mb-2`}>
                      {plan.name}
                    </CardTitle>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {plan.description}
                    </p>
                    
                    <div className="mb-6">
                      {isAnnual ? (
                        // Affichage pour les prix annuels
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <span className="text-lg text-gray-500 mr-2">{plan.countryFlag}</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                              {formatMarketPrice(plan.displayMonthlyPrice, plan.currency, plan.currencySymbol)}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300 ml-2">
                              /mois
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Facturé {formatMarketPrice(plan.price, plan.currency, plan.currencySymbol)} annuellement
                          </div>
                          <div className="flex items-center justify-center mt-2">
                            <span className="text-sm text-gray-500 line-through mr-2">
                              {formatMarketPrice(plan.displayMonthlyOriginalPrice, plan.currency, plan.currencySymbol)}/mois
                            </span>
                            <Badge className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                              -20%
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        // Affichage pour les prix mensuels
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <span className="text-lg text-gray-500 mr-2">{plan.countryFlag}</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                              {formatMarketPrice(plan.price, plan.currency, plan.currencySymbol)}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300 ml-2">
                              {plan.period}
                            </span>
                          </div>
                          <div className="flex items-center justify-center mt-2">
                            <span className="text-sm text-gray-500 line-through mr-2">
                              {formatMarketPrice(plan.originalPrice, plan.currency, plan.currencySymbol)}
                            </span>
                            <Badge className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                              -{Math.round((1 - plan.price / plan.originalPrice) * 100)}%
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => navigate(`/register?plan=${  plan.name.toLowerCase()}`)}
                        className={`w-full py-3 text-lg font-semibold ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg' 
                            : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                        } transition-all duration-300`}
                      >
                        {t('landing.pricing.cta', 'Commencer l\'essai gratuit')}
                      </Button>
                    </motion.div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-4">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        {/* Garantie et sécurité */}
        <AnimatedSection className="mt-20 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: t('landing.pricing.guarantee.security.title', 'Sécurité garantie'),
                description: t('landing.pricing.guarantee.security.description', 'Vos données sont chiffrées et sauvegardées quotidiennement')
              },
              {
                icon: Clock,
                title: t('landing.pricing.guarantee.trial.title', '14 jours gratuits'),
                description: t('landing.pricing.guarantee.trial.description', 'Testez toutes les fonctionnalités sans engagement')
              },
              {
                icon: MessageCircle,
                title: t('landing.pricing.guarantee.support.title', 'Support expert'),
                description: t('landing.pricing.guarantee.support.description', 'Notre équipe vous accompagne dans votre réussite')
              }
            ].map((guarantee, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center p-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <guarantee.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {guarantee.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {guarantee.description}
                </p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

// Section témoignages
const TestimonialsSection = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: "Marie Dubois",
      position: "CEO, TechStart",
      company: "Startup Tech",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1-5c",
      content: t('landing.testimonials.marie.content', "CassKai a révolutionné notre gestion financière. L'interface est intuitive et nous fait gagner un temps précieux chaque jour."),
      rating: 5
    },
    {
      name: "Pierre Martin",
      position: "Comptable",
      company: "Cabinet Martin & Associés",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
      content: t('landing.testimonials.pierre.content', "Excellent outil pour mes clients PME. Les rapports automatisés et la conformité fiscale sont parfaits."),
      rating: 5
    },
    {
      name: "Sophie Laurent",
      position: "Directrice Financière",
      company: "Retail Plus",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
      content: t('landing.testimonials.sophie.content', "La gestion multi-entités et les tableaux de bord nous donnent une vision claire de nos performances."),  
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-20">
          <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200/50 dark:border-yellow-700/50">
            <Quote className="w-4 h-4 mr-2" />
            {t('landing.testimonials.badge', 'Témoignages clients')}
          </Badge>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t('landing.testimonials.title', 'Ils nous font confiance')}
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('landing.testimonials.subtitle', 'et réussissent avec CassKai')}
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('landing.testimonials.description', 'Découvrez comment CassKai transforme la gestion d\'entreprise pour des milliers de professionnels.')}
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <AnimatedSection key={index}>
              <motion.div
                className="group h-full"
                whileHover={{ y: -8, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm group-hover:bg-white dark:group-hover:bg-gray-800">
                  <CardContent className="p-8">
                    {/* Étoiles */}
                    <div className="flex items-center mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    {/* Témoignage */}
                    <blockquote className="text-gray-700 dark:text-gray-300 mb-8 text-lg leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    
                    {/* Profil */}
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {testimonial.position}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

// Section contact
const ContactSection = () => {
  const { t } = useTranslation();

  return (
    <section id="contact" className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-20">
          <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-200 border-blue-200/50 dark:border-blue-700/50">
            <MessageCircle className="w-4 h-4 mr-2" />
            {t('landing.contact.badge', 'Nous contacter')}
          </Badge>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            {t('landing.contact.title', 'Une question ?')}
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('landing.contact.subtitle', 'Nous sommes là pour vous')}
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('landing.contact.description', 'Notre équipe d\'experts est disponible pour répondre à toutes vos questions et vous accompagner dans votre réussite.')}
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Mail,
              title: t('landing.contact.email.title', 'Email'),
              content: 'contact@casskai.app',
              description: t('landing.contact.email.description', 'Réponse sous 24h'),
              color: 'from-blue-500 to-blue-600'
            },
            {
              icon: Phone,
              title: t('landing.contact.phone.title', 'Téléphone'),
              content: '+336 88 89 33 72 (Europe) / +229 01 69 18 76 03 (Afrique)',
              description: t('landing.contact.phone.description', 'Lun-Ven 9h-18h'),
              color: 'from-green-500 to-green-600'
            },
            {
              icon: MessageCircle,
              title: t('landing.contact.chat.title', 'Chat en direct'),
              content: t('landing.contact.chat.content', 'Support instantané'),
              description: t('landing.contact.chat.description', 'Disponible 24/7'),
              color: 'from-purple-500 to-purple-600'
            }
          ].map((contact, index) => (
            <AnimatedSection key={index}>
              <motion.div
                className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-all duration-300 group"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${contact.color} rounded-xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <contact.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {contact.title}
                </h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                  {contact.content}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {contact.description}
                </p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">CassKai</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {t('landing.footer.description', 'La solution complète de gestion d\'entreprise pour les PME et indépendants.')}
            </p>
            <div className="flex space-x-4">
              {/* Social media icons */}
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                <Globe className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Produit */}
          <div>
            <h3 className="text-lg font-semibold mb-6">{t('landing.footer.product.title', 'Produit')}</h3>
            <ul className="space-y-3">
              {[
                { key: 'features', label: t('landing.footer.product.features', 'Fonctionnalités'), type: 'scroll' },
                { key: 'pricing', label: t('landing.footer.product.pricing', 'Tarifs'), type: 'scroll' },
                { key: 'security-info', label: t('landing.footer.product.security', 'Sécurité'), type: 'navigate' }
              ].map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => {
                      if (item.type === 'navigate') {
                        navigate(`/${item.key}`);
                      } else {
                        document.getElementById(item.key)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6">{t('landing.footer.support.title', 'Support')}</h3>
            <ul className="space-y-3">
              {[
                { label: t('landing.footer.support.help', 'Centre d\'aide'), href: '/help' },
                { label: t('landing.footer.support.documentation', 'Documentation'), href: '/docs' },
                { label: t('landing.footer.support.api', 'API'), href: '/api' },
                { label: t('landing.footer.support.status', 'Statut'), href: '/status' }
              ].map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(item.href)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-lg font-semibold mb-6">{t('landing.footer.legal.title', 'Légal')}</h3>
            <ul className="space-y-3">
              {[
                { label: t('landing.footer.legal.privacy', 'Confidentialité'), href: '/privacy' },
                { label: t('landing.footer.legal.terms', 'Conditions'), href: '/terms' },
                { label: t('landing.footer.legal.cookies', 'Cookies'), href: '/cookies' },
                { label: t('landing.footer.legal.gdpr', 'RGPD'), href: '/gdpr' }
              ].map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => navigate(item.href)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Informations entreprise */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Entreprise</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Noutche Conseil SASU</p>
                <p>SIREN: 909 672 685</p>
                <p>SIRET: 909 672 685 00023</p>
                <p>{t('landing.footer.company.capitalSocial')}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Fiscal</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>{t('landing.footer.company.tva')}</p>
                <p>{t('landing.footer.company.rcs')}</p>
                <p>{t('landing.footer.company.nafCode')}</p>
                <p>{t('landing.footer.company.activity')}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">{t('landing.footer.compliance.title')}</h4>
              <div className="space-y-2">
                <Badge className="px-2 py-1 bg-green-900/50 text-green-400 border-green-700/50 text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  {t('landing.footer.compliance.ssl')}
                </Badge>
                <Badge className="px-2 py-1 bg-blue-900/50 text-blue-400 border-blue-700/50 text-xs">
                  <Database className="w-3 h-3 mr-1" />
                  {t('landing.footer.compliance.gdpr')}
                </Badge>
                <Badge className="px-2 py-1 bg-purple-900/50 text-purple-400 border-purple-700/50 text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  {t('landing.footer.compliance.iso')}
                </Badge>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">{t('landing.footer.convention.title')}</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <p>{t('landing.footer.convention.description1')}</p>
                <p>{t('landing.footer.convention.description2')}</p>
                <p>{t('landing.footer.convention.idcc')}</p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              <p>© {new Date().getFullYear()} CassKai - Édité par Noutche Conseil SASU. {t('landing.footer.copyright', 'Tous droits réservés.')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('landing.footer.legalNotice')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="px-3 py-1 bg-gray-800/50 text-gray-400 border-gray-700/50 text-xs">
                {t('landing.footer.version')}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Composant principal de la Landing Page
const LandingPage = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <PageContainer variant="landing" className="overflow-x-hidden">
      <Navigation isScrolled={isScrolled} />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <ContactSection />
      <Footer />
    </PageContainer>
  );
};

export default LandingPage;