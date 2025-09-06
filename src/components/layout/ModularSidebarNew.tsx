// @ts-nocheck
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useModulesSafe, useModules } from '@/contexts/ModulesContext';
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
  Store,
  Calculator,
  Building,
  Package,
  Lock,
  Crown,
  ArrowUpRight,
  Clock
} from 'lucide-react';

// Mapping des icônes pour les modules
const getModuleIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'Home': Home,
    'Briefcase': Briefcase,
    'FileText': FileText,
    'ShoppingCart': ShoppingCart,
    'Landmark': Landmark,
    'Users': Users,
    'Users2': Users2,
    'KanbanSquare': KanbanSquare,
    'Archive': Archive,
    'BarChart3': BarChart3,
    'Sparkles': Sparkles,
    'UsersRound': UsersRound,
    'Zap': Zap,
    'Shield': Shield,
    'Settings': Settings,
    'Store': Store,
    'Calculator': Calculator,
    'Building': Building,
    'Package': Package
  };
  return iconMap[iconName] || FileText;
};

// Définition des catégories pour organiser les modules
const moduleCategories = {
  'FINANCE & COMPTA': ['dashboard', 'accounting', 'banking', 'invoicing', 'tax', 'reports'],
  'BUSINESS & VENTES': ['salesCrm', 'purchases', 'inventory', 'contracts', 'forecasts'],
  'GESTION & PROJETS': ['projects', 'humanResources', 'thirdParties']
};

const ModularSidebarNew: React.FC = () => {
  const location = useLocation();
  const { allModules, canAccessModule, currentPlan, isTrialUser, trialDaysRemaining } = useModulesSafe();

  // DEBUG: Log pour comprendre le problème
  React.useEffect(() => {
    console.log('🔧 [ModularSidebarNew] Modules disponibles:', {
      total: allModules?.length || 0,
      modules: allModules?.map(m => ({ key: m.key, label: m.label, path: m.path }))
    });
  }, [allModules]);

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  // Séparer les modules principaux des modules globaux et filtrer selon l'abonnement
  const mainModules = (allModules?.filter(m => !m.isGlobal) || [])
    .map(module => ({
      ...module,
      isAccessible: canAccessModule(module.key),
      requiresUpgrade: !canAccessModule(module.key) && !isTrialUser
    }));
  
  const globalModules = (allModules?.filter(m => m.isGlobal) || [])
    .map(module => ({
      ...module,
      isAccessible: canAccessModule(module.key),
      requiresUpgrade: !canAccessModule(module.key) && !isTrialUser
    }));

  // Fonction pour grouper les modules par catégorie
  const getModulesByCategory = () => {
    const categorizedModules: Record<string, any[]> = {};
    
    Object.entries(moduleCategories).forEach(([categoryName, moduleKeys]) => {
      categorizedModules[categoryName] = mainModules.filter(module => 
        moduleKeys.includes(module.key)
      );
    });
    
    return categorizedModules;
  };

  const categorizedModules = getModulesByCategory();

  if (!allModules || allModules.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Chargement des modules...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background w-[280px] fixed left-0 top-0 z-20">
      {/* Subscription Status */}
      {currentPlan && (
        <div className="p-4 border-b">
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg text-sm",
            isTrialUser ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200" : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200"
          )}>
            <div className="flex items-center space-x-2">
              {isTrialUser ? (
                <>
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800 dark:text-orange-200">
                    Essai - {trialDaysRemaining} jours
                  </span>
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    Plan {currentPlan}
                  </span>
                </>
              )}
            </div>
            {isTrialUser && (
              <Link to="/settings" className="text-orange-600 hover:text-orange-700">
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Modules par catégorie */}
        {Object.entries(categorizedModules).map(([categoryName, modules]) => (
          <div key={categoryName} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
              {categoryName}
            </h3>
            <div className="space-y-1">
              {modules.map((module) => {
                const IconComponent = getModuleIcon(module.icon);
                const isModuleActive = isActive(module.path);
                const isAccessible = module.isAccessible;
                const requiresUpgrade = module.requiresUpgrade;
                
                if (!isAccessible && !isTrialUser) {
                  // Module verrouillé - afficher avec indicateur de mise à niveau
                  return (
                    <div
                      key={module.key}
                      className="relative"
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start py-2.5 h-auto font-normal opacity-60 cursor-not-allowed"
                        disabled
                      >
                        <IconComponent className="mr-3 h-4 w-4 flex-shrink-0" />
                        <span className="truncate flex-1 text-left">{module.label}</span>
                        <Lock className="h-3 w-3 text-orange-500 ml-2" />
                      </Button>
                      <div className="absolute right-1 top-1">
                        <Crown className="h-3 w-3 text-amber-500" />
                      </div>
                    </div>
                  );
                }

                return (
                  <Button
                    key={module.key}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start py-2.5 h-auto font-normal relative',
                      isModuleActive && 'bg-accent text-accent-foreground font-medium',
                      !isAccessible && isTrialUser && 'border border-dashed border-orange-300'
                    )}
                    asChild
                  >
                    <Link to={module.path}>
                      <IconComponent className="mr-3 h-4 w-4 flex-shrink-0" />
                      <span className="truncate flex-1">{module.label}</span>
                      {!isAccessible && isTrialUser && (
                        <div className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded ml-2">
                          Essai
                        </div>
                      )}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}


      </div>

      {/* Modules globaux (Administration) */}
      {globalModules.length > 0 && (
        <div className="border-t bg-muted/30 p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            ADMINISTRATION
          </h3>
          <div className="space-y-1">
            {globalModules.map((module) => {
              const IconComponent = getModuleIcon(module.icon);
              const isModuleActive = isActive(module.path);
              const isAccessible = module.isAccessible;
              
              if (!isAccessible && !isTrialUser) {
                return (
                  <div key={module.key} className="relative">
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-2.5 h-auto font-normal opacity-60 cursor-not-allowed"
                      disabled
                    >
                      <IconComponent className="mr-3 h-4 w-4 flex-shrink-0" />
                      <span className="truncate flex-1 text-left">{module.label}</span>
                      <Lock className="h-3 w-3 text-orange-500 ml-2" />
                    </Button>
                    <div className="absolute right-1 top-1">
                      <Crown className="h-3 w-3 text-amber-500" />
                    </div>
                  </div>
                );
              }

              return (
                <Button
                  key={module.key}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start py-2.5 h-auto font-normal',
                    isModuleActive && 'bg-accent text-accent-foreground font-medium',
                    !isAccessible && isTrialUser && 'border border-dashed border-orange-300'
                  )}
                  asChild
                >
                  <Link to={module.path}>
                    <IconComponent className="mr-3 h-4 w-4 flex-shrink-0" />
                    <span className="truncate flex-1">{module.label}</span>
                    {!isAccessible && isTrialUser && (
                      <div className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded ml-2">
                        Essai
                      </div>
                    )}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Module Manager Link */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start py-2.5 h-auto font-normal text-blue-600 dark:text-blue-400',
            isActive('/modules') && 'bg-blue-50 dark:bg-blue-900/50'
          )}
          asChild
        >
          <Link to="/modules">
            <Zap className="mr-3 h-4 w-4 flex-shrink-0" />
            <span className="truncate">Gestionnaire de modules</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ModularSidebarNew;