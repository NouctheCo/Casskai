import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Download, 
  Settings, 
  Star, 
  Users, 
  Shield, 
  Zap, 
  Puzzle,
  Store,
  CheckCircle,
  AlertCircle,
  Clock,
  Euro,
  Calendar,
  ExternalLink,
  Trash2,
  RefreshCw
} from 'lucide-react';

// Types pour la gestion des modules
interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'core' | 'business' | 'hr' | 'project' | 'integration' | 'marketplace';
  icon: string;
  status: 'available' | 'beta' | 'coming_soon' | 'deprecated';
  isActive: boolean;
  isPremium: boolean;
  isCore: boolean;
  pricing?: {
    type: 'free' | 'one_time' | 'subscription';
    price: number;
    currency: string;
    billingPeriod?: 'monthly' | 'yearly';
    trialDays?: number;
  };
  author: string;
  rating?: number;
  downloads?: number;
  lastUpdated: Date;
  dependencies: string[];
  conflicts: string[];
  permissions: string[];
}

interface ActivationStatus {
  moduleId: string;
  isActivating: boolean;
  progress: number;
  error?: string;
}

const ModuleManager: React.FC = () => {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [activationStatuses, setActivationStatuses] = useState<Map<string, ActivationStatus>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      // Simulation du chargement des modules
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockModules: ModuleInfo[] = [
        {
          id: 'crm-sales',
          name: 'CRM & Ventes',
          description: 'Pipeline commercial intégré avec devis, factures et signature électronique',
          version: '1.0.0',
          category: 'business',
          icon: 'users',
          status: 'available',
          isActive: false,
          isPremium: true,
          isCore: false,
          pricing: {
            type: 'subscription',
            price: 29,
            currency: 'EUR',
            billingPeriod: 'monthly',
            trialDays: 14,
          },
          author: 'CassKai Team',
          rating: 4.8,
          downloads: 1250,
          lastUpdated: new Date('2024-08-01'),
          dependencies: ['accounting-core'],
          conflicts: [],
          permissions: ['crm:view', 'crm:manage_contacts', 'crm:manage_deals'],
        },
        {
          id: 'hr-light',
          name: 'RH Light',
          description: 'Gestion simplifiée RH : congés, notes de frais avec OCR, fiches de paie',
          version: '1.0.0',
          category: 'hr',
          icon: 'users-cog',
          status: 'available',
          isActive: true,
          isPremium: true,
          isCore: false,
          pricing: {
            type: 'subscription',
            price: 19,
            currency: 'EUR',
            billingPeriod: 'monthly',
            trialDays: 14,
          },
          author: 'CassKai Team',
          rating: 4.6,
          downloads: 890,
          lastUpdated: new Date('2024-07-28'),
          dependencies: ['accounting-core'],
          conflicts: [],
          permissions: ['hr:view', 'hr:manage_employees', 'hr:approve_leaves'],
        },
        {
          id: 'projects-management',
          name: 'Gestion de Projets',
          description: 'Timetracking, rentabilité, Gantt et facturation sur avancement',
          version: '1.0.0',
          category: 'project',
          icon: 'folder-kanban',
          status: 'available',
          isActive: false,
          isPremium: true,
          isCore: false,
          pricing: {
            type: 'subscription',
            price: 25,
            currency: 'EUR',
            billingPeriod: 'monthly',
            trialDays: 14,
          },
          author: 'CassKai Team',
          rating: 4.7,
          downloads: 670,
          lastUpdated: new Date('2024-08-05'),
          dependencies: ['accounting-core', 'crm-sales'],
          conflicts: [],
          permissions: ['project:view', 'project:manage', 'project:track_time'],
        },
        {
          id: 'marketplace',
          name: 'Marketplace',
          description: 'Écosystème d\'extensions : templates sectoriels, connecteurs tiers',
          version: '1.0.0',
          category: 'marketplace',
          icon: 'store',
          status: 'available',
          isActive: true,
          isPremium: false,
          isCore: true,
          pricing: {
            type: 'free',
            price: 0,
            currency: 'EUR',
          },
          author: 'CassKai Team',
          rating: 4.9,
          downloads: 2340,
          lastUpdated: new Date('2024-08-07'),
          dependencies: [],
          conflicts: [],
          permissions: ['marketplace:browse', 'marketplace:install'],
        },
        {
          id: 'advanced-reporting',
          name: 'Rapports Avancés',
          description: 'Tableaux de bord personnalisables et rapports BI avancés',
          version: '1.2.0',
          category: 'business',
          icon: 'chart-bar',
          status: 'beta',
          isActive: false,
          isPremium: true,
          isCore: false,
          pricing: {
            type: 'subscription',
            price: 39,
            currency: 'EUR',
            billingPeriod: 'monthly',
          },
          author: 'CassKai Team',
          rating: 4.4,
          downloads: 420,
          lastUpdated: new Date('2024-08-03'),
          dependencies: ['accounting-core'],
          conflicts: [],
          permissions: ['reports:advanced', 'reports:export'],
        },
        {
          id: 'ai-assistant',
          name: 'Assistant IA',
          description: 'IA pour catégorisation automatique et conseils personnalisés',
          version: '0.8.0',
          category: 'integration',
          icon: 'brain',
          status: 'coming_soon',
          isActive: false,
          isPremium: true,
          isCore: false,
          pricing: {
            type: 'subscription',
            price: 49,
            currency: 'EUR',
            billingPeriod: 'monthly',
          },
          author: 'CassKai Labs',
          lastUpdated: new Date('2024-08-10'),
          dependencies: [],
          conflicts: [],
          permissions: ['ai:use', 'ai:train'],
        },
      ];
      
      setModules(mockModules);
    } catch (error) {
      console.error('Erreur de chargement des modules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleModule = async (moduleId: string, activate: boolean) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    // Vérifications préalables
    if (activate) {
      // Vérifier les dépendances
      const missingDeps = module.dependencies.filter(depId => 
        !modules.find(m => m.id === depId)?.isActive
      );
      
      if (missingDeps.length > 0) {
        alert(`Ce module nécessite les dépendances suivantes : ${missingDeps.join(', ')}`);
        return;
      }

      // Vérifier les conflits
      const conflicts = module.conflicts.filter(conflictId =>
        modules.find(m => m.id === conflictId)?.isActive
      );
      
      if (conflicts.length > 0) {
        alert(`Ce module est en conflit avec : ${conflicts.join(', ')}`);
        return;
      }
    }

    // Démarrer le processus d'activation/désactivation
    setActivationStatuses(prev => new Map(prev.set(moduleId, {
      moduleId,
      isActivating: true,
      progress: 0,
    })));

    try {
      // Simulation du processus d'activation
      const steps = ['Vérification des prérequis', 'Installation', 'Configuration', 'Activation'];
      
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setActivationStatuses(prev => new Map(prev.set(moduleId, {
          moduleId,
          isActivating: true,
          progress: ((i + 1) / steps.length) * 100,
        })));
      }

      // Mettre à jour l'état du module
      setModules(prev => prev.map(m => 
        m.id === moduleId ? { ...m, isActive: activate } : m
      ));

      // Nettoyer le statut d'activation
      setActivationStatuses(prev => {
        const newMap = new Map(prev);
        newMap.delete(moduleId);
        return newMap;
      });

    } catch (error) {
      console.error('Erreur lors de l\'activation:', error);
      
      setActivationStatuses(prev => new Map(prev.set(moduleId, {
        moduleId,
        isActivating: false,
        progress: 0,
        error: 'Erreur lors de l\'activation du module',
      })));
    }
  };

  const getModuleIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      'users': Users,
      'users-cog': Users,
      'folder-kanban': Package,
      'store': Store,
      'chart-bar': Package,
      'brain': Zap,
      'shield': Shield,
      'puzzle': Puzzle,
    };
    
    const Icon = icons[iconName] || Package;
    return <Icon className="w-5 h-5" />;
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800">Activé</Badge>;
    }
    
    switch (status) {
      case 'available':
        return <Badge variant="outline">Disponible</Badge>;
      case 'beta':
        return <Badge className="bg-orange-100 text-orange-800">Bêta</Badge>;
      case 'coming_soon':
        return <Badge className="bg-blue-100 text-blue-800">Bientôt</Badge>;
      case 'deprecated':
        return <Badge className="bg-red-100 text-red-800">Obsolète</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const formatPrice = (pricing: ModuleInfo['pricing']) => {
    if (!pricing || pricing.type === 'free') {
      return 'Gratuit';
    }
    
    const price = `${pricing.price}€`;
    const period = pricing.billingPeriod === 'monthly' ? '/mois' : '/an';
    
    return pricing.type === 'subscription' ? `${price}${period}` : price;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      'business': Users,
      'hr': Users,
      'project': Package,
      'marketplace': Store,
      'integration': Puzzle,
      'core': Shield,
    };
    
    const Icon = icons[category] || Package;
    return <Icon className="w-4 h-4" />;
  };

  const categories = [
    { id: 'all', name: 'Tous les modules', count: modules.length },
    { id: 'business', name: 'Business', count: modules.filter(m => m.category === 'business').length },
    { id: 'hr', name: 'RH', count: modules.filter(m => m.category === 'hr').length },
    { id: 'project', name: 'Projets', count: modules.filter(m => m.category === 'project').length },
    { id: 'integration', name: 'Intégrations', count: modules.filter(m => m.category === 'integration').length },
    { id: 'marketplace', name: 'Marketplace', count: modules.filter(m => m.category === 'marketplace').length },
  ];

  const filteredModules = selectedCategory === 'all' 
    ? modules 
    : modules.filter(m => m.category === selectedCategory);

  const activeModulesCount = modules.filter(m => m.isActive).length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestion des Modules</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Modules</h1>
          <p className="text-gray-600">
            {activeModulesCount} module{activeModulesCount > 1 ? 's' : ''} activé{activeModulesCount > 1 ? 's' : ''} sur {modules.length}
          </p>
        </div>
        <Button onClick={loadModules} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Modules actifs</p>
                <p className="text-xl font-bold">{activeModulesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total disponible</p>
                <p className="text-xl font-bold">{modules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">En bêta</p>
                <p className="text-xl font-bold">{modules.filter(m => m.status === 'beta').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Premium</p>
                <p className="text-xl font-bold">{modules.filter(m => m.isPremium).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.id !== 'all' && getCategoryIcon(category.id)}
            {category.name}
            <Badge variant="outline" className="text-xs">
              {category.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Liste des modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredModules.map(module => {
          const activationStatus = activationStatuses.get(module.id);
          
          return (
            <Card key={module.id} className={`transition-all ${module.isActive ? 'ring-2 ring-green-200' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded">
                      {getModuleIcon(module.icon)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(module.status, module.isActive)}
                        {module.isPremium && (
                          <Badge className="bg-purple-100 text-purple-800">Premium</Badge>
                        )}
                        {module.isCore && (
                          <Badge className="bg-gray-100 text-gray-800">Core</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {module.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{module.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <CardDescription className="mt-2">
                  {module.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informations du module */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Version</p>
                    <p className="font-medium">{module.version}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Prix</p>
                    <p className="font-medium">{formatPrice(module.pricing)}</p>
                  </div>
                  {module.downloads && (
                    <div>
                      <p className="text-gray-600">Téléchargements</p>
                      <p className="font-medium">{module.downloads.toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Auteur</p>
                    <p className="font-medium">{module.author}</p>
                  </div>
                </div>

                {/* Dépendances */}
                {module.dependencies.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dépendances:</p>
                    <div className="flex flex-wrap gap-1">
                      {module.dependencies.map(dep => (
                        <Badge key={dep} variant="outline" className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Barre de progression pour l'activation */}
                {activationStatus?.isActivating && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Activation en cours...</span>
                      <span>{Math.round(activationStatus.progress)}%</span>
                    </div>
                    <Progress value={activationStatus.progress} className="h-2" />
                  </div>
                )}

                {/* Erreur d'activation */}
                {activationStatus?.error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {activationStatus.error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {module.status === 'available' && (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={module.isActive}
                          onCheckedChange={(checked) => handleToggleModule(module.id, checked)}
                          disabled={activationStatus?.isActivating || module.isCore}
                        />
                        <span className="text-sm font-medium">
                          {module.isActive ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {module.status === 'coming_soon' && (
                    <Button disabled className="w-full">
                      <Clock className="w-4 h-4 mr-2" />
                      Bientôt disponible
                    </Button>
                  )}
                  
                  {module.status === 'beta' && !module.isActive && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleToggleModule(module.id, true)}
                      disabled={activationStatus?.isActivating}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Installer (Bêta)
                    </Button>
                  )}
                </div>

                {/* Essai gratuit */}
                {module.pricing?.trialDays && !module.isActive && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        {module.pricing.trialDays} jours d'essai gratuit
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun module trouvé
          </h3>
          <p className="text-gray-600">
            Aucun module ne correspond à vos critères de recherche.
          </p>
        </div>
      )}
    </div>
  );
};

export default ModuleManager;