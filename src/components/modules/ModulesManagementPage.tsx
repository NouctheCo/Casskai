import React, { useState, useMemo, useEffect } from 'react';
import { devLogger } from '@/utils/devLogger';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useModulesSafe } from '@/contexts/ModulesContext';
import { motion } from 'framer-motion';
import { 
  Home,
  Briefcase,
  FileText,
  ShoppingCart,
  Landmark,
  Users,
  Users2,
  KanbanSquare,
  Archive,
  BarChart3,
  Sparkles,
  UsersRound,
  Zap,
  Shield,
  Settings,
  Crown,
  Search,
  CheckCircle,
  Clock,
  ExternalLink,
  Star
} from 'lucide-react';

// Fonction pour obtenir les classes de couleur avec support dark mode
const getColorClasses = (color: string) => {
  const colorMap: Record<string, { background: string; text: string }> = {
    'blue': { background: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    'green': { background: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
    'emerald': { background: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    'purple': { background: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
    'yellow': { background: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' },
    'indigo': { background: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
    'rose': { background: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
    'orange': { background: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
    'teal': { background: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
    'slate': { background: 'bg-slate-100 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-400' },
    'cyan': { background: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
    'amber': { background: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    'red': { background: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
    'gray': { background: 'bg-gray-100 dark:bg-gray-800/50', text: 'text-gray-600 dark:text-gray-400' },
  };
  return colorMap[color] || { background: 'bg-gray-100 dark:bg-gray-800/50', text: 'text-gray-600 dark:text-gray-400' };
};

// Définition des modules avec leurs vraies informations
const MODULES_CONFIG = [
  // FINANCE & COMPTABILITÉ
  {
    key: 'dashboard',
    name: 'Tableau de bord',
    description: 'Vue d\'ensemble de votre activité et indicateurs clés',
    category: 'FINANCE & COMPTABILITÉ',
    icon: Home,
    type: 'core' as const,
    path: '/dashboard',
    color: 'blue'
  },
  {
    key: 'accounting',
    name: 'Comptabilité',
    description: 'Gestion complète de votre comptabilité générale',
    category: 'FINANCE & COMPTABILITÉ',
    icon: Briefcase,
    type: 'starter' as const,
    path: '/accounting',
    color: 'green'
  },
  {
    key: 'banking',
    name: 'Banque',
    description: 'Synchronisation et rapprochement bancaire automatisé',
    category: 'FINANCE & COMPTABILITÉ',
    icon: Landmark,
    type: 'starter' as const,
    path: '/banks',
    color: 'emerald'
  },
  {
    key: 'invoicing',
    name: 'Facturation',
    description: 'Création et gestion de vos factures clients',
    category: 'FINANCE & COMPTABILITÉ',
    icon: FileText,
    type: 'starter' as const,
    path: '/invoicing',
    color: 'purple'
  },
  {
    key: 'purchases',
    name: 'Achats',
    description: 'Gestion des achats et des fournisseurs',
    category: 'FINANCE & COMPTABILITÉ',
    icon: ShoppingCart,
    type: 'starter' as const,
    path: '/purchases',
    color: 'orange'
  },
  {
    key: 'thirdParties',
    name: 'Tiers',
    description: 'Gestion centralisée de tous vos contacts',
    category: 'FINANCE & COMPTABILITÉ',
    icon: UsersRound,
    type: 'starter' as const,
    path: '/sales-crm',
    color: 'amber'
  },
  {
    key: 'reports',
    name: 'Rapports',
    description: 'Génération de rapports financiers détaillés',
    category: 'FINANCE & COMPTABILITÉ',
    icon: BarChart3,
    type: 'pro' as const,
    path: '/reports',
    color: 'indigo'
  },
  {
    key: 'budget',
    name: '💰 Budget & Prévisions',
    description: '🎯 Création et suivi des budgets annuels avec analyses complètes',
    category: 'FINANCE & COMPTABILITÉ',
    icon: BarChart3,
    type: 'pro' as const,
    path: '/budget',
    color: 'amber'
  },
  {
    key: 'tax',
    name: 'Fiscalité',
    description: 'Gestion fiscale et préparation des déclarations',
    category: 'FINANCE & COMPTABILITÉ',
    icon: Zap,
    type: 'pro' as const,
    path: '/tax',
    color: 'yellow'
  },
  {
    key: 'humanResources',
    name: 'Ressources Humaines',
    description: 'Gestion RH complète et paie',
    category: 'FINANCE & COMPTABILITÉ',
    icon: Users2,
    type: 'pro' as const,
    path: '/modules/hr',
    color: 'green'
  },

  // MODULES ENTERPRISE
  {
    key: 'salesCrm',
    name: 'CRM & Ventes',
    description: 'Gestion complète de la relation client',
    category: 'MODULES ENTERPRISE',
    icon: Users,
    type: 'enterprise' as const,
    path: '/modules/crm',
    color: 'rose'
  },
  {
    key: 'inventory',
    name: 'Stock & Inventaire',
    description: 'Suivi des stocks et gestion des inventaires',
    category: 'MODULES ENTERPRISE',
    icon: Archive,
    type: 'enterprise' as const,
    path: '/inventory',
    color: 'teal'
  },
  {
    key: 'projects',
    name: 'Projets',
    description: 'Gestion de projets et suivi des tâches',
    category: 'MODULES ENTERPRISE',
    icon: KanbanSquare,
    type: 'enterprise' as const,
    path: '/modules/projects',
    color: 'blue'
  },
  {
    key: 'contracts',
    name: 'Contrats',
    description: 'Gestion des contrats et documents légaux',
    category: 'MODULES ENTERPRISE',
    icon: FileText,
    type: 'enterprise' as const,
    path: '/contracts',
    color: 'slate'
  },

  // ADMINISTRATION
  {
    key: 'users',
    name: 'Utilisateurs',
    description: 'Gestion des utilisateurs et des permissions',
    category: 'ADMINISTRATION',
    icon: Users,
    type: 'core' as const,
    path: '/user-management',
    color: 'red'
  },
  {
    key: 'security',
    name: 'Sécurité',
    description: 'Paramètres de sécurité et audit système',
    category: 'ADMINISTRATION',
    icon: Shield,
    type: 'core' as const,
    path: '/security',
    color: 'red'
  },
  {
    key: 'settings',
    name: 'Paramètres',
    description: 'Configuration générale de l\'application',
    category: 'ADMINISTRATION',
    icon: Settings,
    type: 'core' as const,
    path: '/settings',
    color: 'gray'
  }
];

interface ModuleCardProps {
  module: typeof MODULES_CONFIG[0];
  isActive: boolean;
  canAccess: boolean;
  isTrialUser: boolean;
  onToggle: (key: string, active: boolean) => void;
  onOpen: (path: string) => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ 
  module, 
  isActive, 
  canAccess, 
  isTrialUser, 
  onToggle, 
  onOpen 
}) => {
  const IconComponent = module.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
    >
      <Card className={`h-full relative overflow-hidden border-2 transition-all duration-200 ${
        isActive 
          ? 'border-green-200 dark:border-green-700 bg-green-50/30 dark:bg-green-900/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}>
        
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-xl ${getColorClasses(module.color).background}`}>
              <IconComponent className={`w-6 h-6 ${getColorClasses(module.color).text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">{module.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {isActive ? (
                  <Badge className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Actif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-gray-300 dark:border-gray-600 dark:border-gray-600 text-gray-600 dark:text-gray-300 dark:text-gray-300">
                    Inactif
                  </Badge>
                )}
                {module.type === 'core' && (
                  <Badge variant="outline" className="border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                    Core
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <CardDescription className="text-sm leading-relaxed">
            {module.description}
          </CardDescription>

          {/* Alertes accès */}
          {!canAccess && !isTrialUser && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-200">
                <Star className="w-4 h-4" />
                <span className="font-medium">Mise à niveau requise</span>
              </div>
            </div>
          )}
          
          {!canAccess && isTrialUser && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Accessible en période d'essai</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => {
                  devLogger.info(`Switch changé pour ${module.key}: ${checked}`);
                  onToggle(module.key, checked);
                }}
                disabled={
                  module.type === 'core' || // Les modules core sont toujours actifs
                  (!canAccess && !isTrialUser) || // Modules non autorisés en plan payant
                  (!isTrialUser && canAccess && isActive) // Modules inclus dans le plan = forcément actifs
                }
              />
              <div className="text-sm">
                <div className="font-medium">
                  {isActive ? 'Activé' : 'Désactivé'}
                </div>
                {module.type === 'core' && (
                  <div className="text-xs text-gray-500 dark:text-gray-300">Module essentiel</div>
                )}
              </div>
            </div>
            
            {isActive && (canAccess || isTrialUser) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpen(module.path)}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir
              </Button>
            )}
            
            {!canAccess && !isTrialUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpen('/settings')}
                className="text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                <Star className="w-4 h-4 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function ModulesManagementPage() {
  const navigate = useNavigate();
  const { currentPlan, isTrialUser, trialDaysRemaining, canAccessModule } = useModulesSafe();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem('casskai-module-states');
    return stored ? JSON.parse(stored) : {};
  });

  // Écouter les changements d'état des modules
  useEffect(() => {
    const handleModuleStateChange = (event: CustomEvent) => {
      devLogger.info('Module state changed:', event.detail);
      const stored = localStorage.getItem('casskai-module-states');
      setModuleStates(stored ? JSON.parse(stored) : {});
    };

    const handleModuleStatesReset = () => {
      devLogger.info('Module states reset');
      const stored = localStorage.getItem('casskai-module-states');
      setModuleStates(stored ? JSON.parse(stored) : {});
    };

    window.addEventListener('module-state-changed', handleModuleStateChange as EventListener);
    window.addEventListener('module-states-reset', handleModuleStatesReset);

    return () => {
      window.removeEventListener('module-state-changed', handleModuleStateChange as EventListener);
      window.removeEventListener('module-states-reset', handleModuleStatesReset);
    };
  }, []);

  // Calcul des statistiques réelles
  const stats = useMemo(() => {
    const activeModules = MODULES_CONFIG.filter(m => moduleStates[m.key] !== false);
    const coreModules = MODULES_CONFIG.filter(m => m.type === 'core');
    const accessibleModules = MODULES_CONFIG.filter(m => canAccessModule(m.key));

    return {
      total: MODULES_CONFIG.length,
      active: activeModules.length,
      core: coreModules.length,
      accessible: accessibleModules.length
    };
  }, [moduleStates, canAccessModule]);

  // Catégories - Toutes les catégories utilisées dans MODULES_CONFIG
  const categories = [
    'FINANCE & COMPTABILITÉ',
    'MODULES ENTERPRISE',
    'ADMINISTRATION'
  ];

  // Filtrage des modules
  const filteredModules = useMemo(() => {
    return MODULES_CONFIG.filter(module => {
      const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           module.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Groupement par catégories
  const modulesByCategory = useMemo(() => {
    const grouped: Record<string, typeof MODULES_CONFIG> = {};
    
    categories.forEach(category => {
      grouped[category] = filteredModules.filter(m => m.category === category);
    });
    
    return grouped;
  }, [filteredModules, categories]);

  const handleToggleModule = (key: string, active: boolean) => {
    devLogger.info(`Tentative de ${active ? 'activation' : 'désactivation'} du module ${key}`);

    // En plan payant : vérifier si le module est autorisé pour ce plan
    if (!isTrialUser) {
      if (active && !canAccessModule(key)) {
        alert('Ce module n\'est pas inclus dans votre abonnement actuel. Veuillez mettre à niveau votre plan.');
        return;
      }

      // En plan payant, on ne peut pas désactiver les modules autorisés
      // Seuls les modules core peuvent être désactivés/activés librement
      const isCoreModule = ['dashboard', 'settings', 'users', 'security'].includes(key);
      if (!isCoreModule && canAccessModule(key)) {
        // Module inclus dans le plan = toujours actif
        if (!active) {
          alert('Ce module est inclus dans votre abonnement et ne peut pas être désactivé.');
          return;
        }
      }
    }

    // En mode essai : libre choix de tous les modules
    // En plan payant : seuls les modules core peuvent être librement activés/désactivés

    // Utiliser localStorage directement pour la logique d'activation/désactivation
    try {
      const currentStates = localStorage.getItem('casskai-module-states');
      const states = currentStates ? JSON.parse(currentStates) : {};

      // Mettre à jour l'état
      states[key] = active;

      // Sauvegarder dans localStorage
      localStorage.setItem('casskai-module-states', JSON.stringify(states));

      // Mettre à jour l'état local immédiatement
      setModuleStates(states);

      // Émettre un événement pour synchroniser avec d'autres composants
      window.dispatchEvent(new CustomEvent('module-state-changed', {
        detail: {
          moduleKey: key,
          isActive: active,
          allStates: states
        }
      }));

      devLogger.info(`Module ${key} ${active ? 'activé' : 'désactivé'} avec succès`);
    } catch (error) {
      devLogger.error('Erreur lors du toggle du module:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleOpenModule = (path: string) => {
    // Vérifier que le chemin n'est pas vide et naviguer correctement
    devLogger.info('Navigation vers:', path);
    
    if (path && path !== '#') {
      // Utiliser React Router pour la navigation au lieu de window.location.href
      // Cela évite les rechargements de page et les redirections non désirées
      navigate(path);
    } else {
      devLogger.warn('Chemin de module invalide:', path);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">Gestion des Modules</h1>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mt-1">
              Gérez l'activation et l'accès à vos modules CassKai
            </p>
          </div>
          
          {/* Statut abonnement */}
          {currentPlan && (
            <div className="text-right">
              {isTrialUser ? (
                <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700 text-sm px-3 py-1">
                  <Clock className="w-4 h-4 mr-2" />
                  Essai - {trialDaysRemaining} jours restants
                </Badge>
              ) : (
                <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700 text-sm px-3 py-1">
                  <Crown className="w-4 h-4 mr-2" />
                  Plan {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Statistiques d'ensemble */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 dark:text-gray-300">Modules Actifs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">{stats.active}/{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 dark:text-gray-300">Accessibles</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">{stats.accessible}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 dark:text-gray-300">Core</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">{stats.core}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 dark:text-gray-300">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher un module..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:bg-gray-700 dark:text-gray-200 min-w-[200px]"
            >
              <option value="all">Toutes catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat} ({modulesByCategory[cat]?.length || 0})
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Modules par catégories */}
      {categories.map((category, categoryIndex) => {
        const categoryModules = modulesByCategory[category] || [];
        if (categoryModules.length === 0) return null;

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100">{category}</h2>
              <Badge variant="outline" className="font-normal">
                {categoryModules.length} module{categoryModules.length > 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryModules.map((module, moduleIndex) => (
                <motion.div
                  key={module.key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: categoryIndex * 0.1 + moduleIndex * 0.05 
                  }}
                >
                  <ModuleCard
                    module={module}
                    isActive={moduleStates[module.key] !== false}
                    canAccess={canAccessModule(module.key)}
                    isTrialUser={isTrialUser}
                    onToggle={handleToggleModule}
                    onOpen={handleOpenModule}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Message si aucun résultat */}
      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 dark:text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-2">
            Aucun module trouvé
          </h3>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-4">
            Aucun module ne correspond à vos critères de recherche.
          </p>
          <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
            Effacer les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
