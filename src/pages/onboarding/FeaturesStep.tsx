import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Calculator,
  FileText,
  Users2,
  Package,
  CreditCard,
  Building2,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Star,
  Zap
} from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTranslation } from 'react-i18next';

const modules = [
  {
    key: 'accounting',
    icon: Calculator,
    title: 'Comptabilité & Finances',
    description: 'Gestion complète de votre comptabilité avec plans comptables internationaux',
    features: ['Écritures automatisées', 'Plan comptable personnalisable', 'Rapports en temps réel', 'Export FEC'],
    recommended: true,
    category: 'Essentiel'
  },
  {
    key: 'invoicing',
    icon: FileText,
    title: 'Facturation',
    description: 'Créez et gérez vos factures, devis et avoirs facilement',
    features: ['Factures personnalisées', 'Relances automatiques', 'Suivi des paiements', 'Devis interactifs'],
    recommended: true,
    category: 'Essentiel'
  },
  {
    key: 'crm',
    icon: Users2,
    title: 'CRM & Ventes',
    description: 'Gérez vos prospects, clients et opportunités commerciales',
    features: ['Pipeline de ventes', 'Historique client', 'Suivi des opportunités', 'Rapports commerciaux'],
    recommended: false,
    category: 'Commercial'
  },
  {
    key: 'inventory',
    icon: Package,
    title: 'Stocks & Inventaire',
    description: 'Suivez vos stocks, commandes et mouvements d\'inventaire',
    features: ['Suivi en temps réel', 'Alertes de stock', 'Valorisation FIFO/LIFO', 'Inventaires périodiques'],
    recommended: false,
    category: 'Logistique'
  },
  {
    key: 'purchases',
    icon: CreditCard,
    title: 'Achats & Fournisseurs',
    description: 'Gérez vos commandes, réceptions et relations fournisseurs',
    features: ['Bons de commande', 'Suivi des livraisons', 'Évaluation fournisseurs', 'Contrôle budgétaire'],
    recommended: false,
    category: 'Achats'
  },
  {
    key: 'projects',
    icon: Building2,
    title: 'Gestion de Projets',
    description: 'Planifiez, suivez et gérez vos projets et équipes',
    features: ['Planning Gantt', 'Suivi du temps', 'Allocation des ressources', 'Facturation projet'],
    recommended: false,
    category: 'Projets'
  },
  {
    key: 'reports',
    icon: TrendingUp,
    title: 'Rapports & Analytics',
    description: 'Tableaux de bord et analyses avancées de votre activité',
    features: ['Dashboards interactifs', 'KPIs personnalisés', 'Export Excel/PDF', 'Rapports programmés'],
    recommended: true,
    category: 'Analyse'
  },
  {
    key: 'banking',
    icon: DollarSign,
    title: 'Connexions Bancaires',
    description: 'Synchronisez automatiquement vos comptes bancaires',
    features: ['Import automatique', 'Rapprochement bancaire', 'Catégorisation IA', 'Multi-banques'],
    recommended: false,
    category: 'Finance'
  }
];

export default function FeaturesStep() {
  const { nextStep, prevStep, modules: selectedModules, setModules } = useOnboarding();
  const { t } = useTranslation();

  const toggleModule = (moduleKey: string) => {
    setModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  const enableRecommended = () => {
    const recommendedModules = modules.filter(m => m.recommended).map(m => m.key);
    setModules(prev => {
      const updated = { ...prev };
      recommendedModules.forEach(key => {
        updated[key] = true;
      });
      return updated;
    });
  };

  const selectedCount = Object.values(selectedModules).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto"
    >
      <Card className="glass-card">
        <CardHeader className="text-center pb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
          >
            <Zap className="w-8 h-8 text-white" />
          </motion.div>
          
          <CardTitle className="text-2xl font-bold gradient-text mb-2">
            {t('onboarding.features.title', {
              defaultValue: 'Choisissez vos fonctionnalités'
            })}
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('onboarding.features.subtitle', {
              defaultValue: 'Sélectionnez les modules qui correspondent à vos besoins. Vous pourrez toujours les modifier plus tard.'
            })}
          </CardDescription>
          
          <div className="flex justify-center mt-4 space-x-4">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} module{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={enableRecommended}
              className="text-xs"
            >
              <Star className="w-3 h-3 mr-1" />
              Sélection recommandée
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
            {modules.map((module, index) => (
              <motion.div
                key={module.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                  selectedModules[module.key]
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => toggleModule(module.key)}
              >
                {module.recommended && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Recommandé
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedModules[module.key]
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <module.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {module.title}
                      </h3>
                      <Badge variant="outline" className="text-xs mt-1">
                        {module.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <Switch
                    checked={selectedModules[module.key] || false}
                    onCheckedChange={() => toggleModule(module.key)}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                  {module.description}
                </p>
                
                <div className="space-y-1">
                  {module.features.slice(0, 2).map((feature, idx) => (
                    <div key={idx} className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                  {module.features.length > 2 && (
                    <div className="text-xs text-gray-400">
                      +{module.features.length - 2} autres fonctionnalités
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Information sur la personnalisation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 mb-6 border border-green-200 dark:border-green-800"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-400 text-sm mb-1">
                  Évolutif et personnalisable
                </h4>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Vous pouvez activer ou désactiver ces modules à tout moment depuis les paramètres. 
                  Votre plan tarifaire s'adaptera automatiquement à vos besoins.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </Button>
            
            <Button
              onClick={nextStep}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center space-x-2"
            >
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}