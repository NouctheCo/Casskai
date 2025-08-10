import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, TrendingUp, Shield, Users, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const WelcomeStep = ({ onNext }) => {
  const { t } = useTranslation();

  const features = [
    {
      icon: TrendingUp,
      title: t('onboarding.welcome.features.accounting.title', 'Comptabilité Simplifiée'),
      description: t('onboarding.welcome.features.accounting.description', 'Gérez votre comptabilité en toute simplicité avec nos outils intuitifs'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Users,
      title: t('onboarding.welcome.features.team.title', 'Collaboration'),
      description: t('onboarding.welcome.features.team.description', 'Travaillez en équipe avec des accès sécurisés et des rôles personnalisés'),
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Shield,
      title: t('onboarding.welcome.features.security.title', 'Sécurité'),
      description: t('onboarding.welcome.features.security.description', 'Vos données sont protégées avec un chiffrement de niveau bancaire'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: Clock,
      title: t('onboarding.welcome.features.automation.title', 'Automatisation'),
      description: t('onboarding.welcome.features.automation.description', 'Automatisez vos tâches récurrentes et gagnez du temps'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];\

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('onboarding.welcome.title', 'Bienvenue sur CassKai')}
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          {t('onboarding.welcome.subtitle', 'La solution comptable moderne qui simplifie la gestion de votre entreprise')}
        </p>

        <div className="flex justify-center items-center space-x-1 mb-8">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
            </motion.div>
          ))}
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {t('onboarding.welcome.rating', 'Plus de 10,000+ entreprises nous font confiance')}
          </span>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="h-full border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${feature.bgColor} dark:bg-opacity-20`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Getting Started Section */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 border-blue-200 dark:border-blue-700">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('onboarding.welcome.getStarted.title', 'Commençons ensemble')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              {t('onboarding.welcome.getStarted.description', 'Notre assistant vous guidera à travers quelques étapes simples pour configurer votre espace de travail. Cela ne prendra que quelques minutes.')}
            </p>
            
            <div className="flex justify-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{t('onboarding.welcome.benefits.time', '5 minutes')}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{t('onboarding.welcome.benefits.steps', '4 étapes simples')}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>{t('onboarding.welcome.benefits.ready', 'Prêt à utiliser')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        variants={itemVariants}
        className="text-center mt-12"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={onNext}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            {t('onboarding.welcome.startButton', 'Commencer la configuration')}
          </Button>
        </motion.div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          {t('onboarding.welcome.skipNote', 'Vous pourrez modifier ces paramètres à tout moment')}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeStep;