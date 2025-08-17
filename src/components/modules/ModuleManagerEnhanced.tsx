import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui';
import { Skeleton } from '@/components/ui/skeleton';
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
  RefreshCw,
  Search,
  Filter,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Play,
  Pause,
  X
} from 'lucide-react';

// Hooks pour l'intégration avec l'architecture modulaire
import { useModules } from '@/contexts/ModulesContext';
import { ModuleDefinition } from '@/types/modules.types';

interface ActivationStatus {
  moduleId: string;
  isActivating: boolean;
  progress: number;
  error?: string;
  step?: string;
}

interface SearchFilters {
  category: string;
  status: string;
  pricing: string;
  query: string;
}

const ModuleManagerEnhanced: React.FC = () => {
  // État du gestionnaire de modules
  const {
    availableModules,
    activeModules,
    isLoading: modulesLoading,
    error: modulesError,
    activateModule,
    deactivateModule,
    isModuleActive,
    canActivateModule,
    refreshModules
  } = useModules();

  // État local
  const [activationStatuses, setActivationStatuses] = useState<Map<string, ActivationStatus>>(new Map());
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    category: 'all',
    status: 'all',
    pricing: 'all',
    query: ''
  });
  const [selectedModule, setSelectedModule] = useState<ModuleDefinition | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'downloads' | 'updated'>('name');

  // Effets
  useEffect(() => {
    // Actualiser les modules au montage
    refreshModules();
  }, []);

  // Handlers
  const handleToggleModule = async (moduleId: string, activate: boolean) => {
    const module = availableModules.find(m => m.id === moduleId);
    if (!module) return;

    // Vérifications préalables
    if (activate) {
      const canActivate = canActivateModule(moduleId);
      if (!canActivate.canActivate) {
        // eslint-disable-next-line no-alert
        alert(canActivate.reason || 'Impossible d\'activer ce module');
        return;
      }
    }

    // Démarrer le processus d'activation/désactivation
    setActivationStatuses(prev => new Map(prev.set(moduleId, {
      moduleId,
      isActivating: true,
      progress: 0,
      step: activate ? 'Préparation...' : 'Désactivation...'
    })));

    try {
      if (activate) {
        // Simulation du processus d'activation avec étapes
        const steps = [
          { name: 'Vérification des prérequis', duration: 800 },
          { name: 'Téléchargement des ressources', duration: 1200 },
          { name: 'Installation', duration: 1500 },
          { name: 'Configuration', duration: 800 },
          { name: 'Activation finale', duration: 500 }
        ];
        
        let totalProgress = 0;
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          
          setActivationStatuses(prev => new Map(prev.set(moduleId, {
            moduleId,
            isActivating: true,
            progress: totalProgress,
            step: step.name
          })));

          await new Promise(resolve => setTimeout(resolve, step.duration));
          totalProgress = ((i + 1) / steps.length) * 100;
        }

        await activateModule(moduleId);
      } else {
        // Processus de désactivation plus simple
        const steps = [
          { name: 'Arrêt des services', duration: 500 },
          { name: 'Nettoyage', duration: 800 },
          { name: 'Finalisation', duration: 300 }
        ];
        
        let totalProgress = 0;
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          
          setActivationStatuses(prev => new Map(prev.set(moduleId, {
            moduleId,
            isActivating: true,
            progress: totalProgress,
            step: step.name
          })));

          await new Promise(resolve => setTimeout(resolve, step.duration));
          totalProgress = ((i + 1) / steps.length) * 100;
        }

        await deactivateModule(moduleId);
      }

      // Nettoyer le statut d'activation
      setActivationStatuses(prev => {
        const newMap = new Map(prev);
        newMap.delete(moduleId);
        return newMap;
      });

    } catch (error) {
      console.error('Erreur lors de l\'opération:', error);
      
      setActivationStatuses(prev => new Map(prev.set(moduleId, {
        moduleId,
        isActivating: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })));

      // Auto-nettoyage après 5 secondes
      setTimeout(() => {
        setActivationStatuses(prev => {
          const newMap = new Map(prev);
          newMap.delete(moduleId);
          return newMap;
        });
      }, 5000);
    }
  };

  const handleSearch = (query: string) => {
    setSearchFilters(prev => ({ ...prev, query }));
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchFilters({
      category: 'all',
      status: 'all',
      pricing: 'all',
      query: ''
    });
  };

  // Fonctions utilitaires
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

  const getStatusBadge = (module: ModuleDefinition) => {
    const isActive = isModuleActive(module.id);
    
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Activé
        </Badge>
      );
    }
    
    switch (module.status) {
      case 'available':
        return <Badge variant="outline">Disponible</Badge>;
      case 'beta':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <Clock className="w-3 h-3 mr-1" />
            Bêta
          </Badge>
        );
      case 'coming_soon':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Calendar className="w-3 h-3 mr-1" />
            Bientôt
          </Badge>
        );
      case 'deprecated':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Obsolète
          </Badge>
        );
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const formatPrice = (pricing: ModuleDefinition['pricing']) => {
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

  // Filtrage des modules
  const filteredModules = availableModules.filter(module => {
    // Filtre par catégorie
    if (searchFilters.category !== 'all' && module.category !== searchFilters.category) {
      return false;
    }
    
    // Filtre par statut
    if (searchFilters.status !== 'all') {
      if (searchFilters.status === 'active' && !isModuleActive(module.id)) return false;
      if (searchFilters.status === 'inactive' && isModuleActive(module.id)) return false;
      if (searchFilters.status !== 'active' && searchFilters.status !== 'inactive' && module.status !== searchFilters.status) return false;
    }
    
    // Filtre par prix
    if (searchFilters.pricing !== 'all') {
      const isFree = !module.pricing || module.pricing.type === 'free';
      if (searchFilters.pricing === 'free' && !isFree) return false;
      if (searchFilters.pricing === 'paid' && isFree) return false;
    }
    
    // Filtre par recherche textuelle
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      return (
        module.name.toLowerCase().includes(query) ||
        module.description.toLowerCase().includes(query) ||
        module.author.toLowerCase().includes(query)
      );
    }
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rating':
        return (b.pricing?.features?.length || 0) - (a.pricing?.features?.length || 0);
      case 'downloads':
        return 0; // Pas de données de téléchargement dans ModuleDefinition
      case 'updated':
        return new Date(b.changelog?.[0]?.date || 0).getTime() - new Date(a.changelog?.[0]?.date || 0).getTime();
      default:
        return 0;
    }
  });

  // Statistiques
  const stats = {
    total: availableModules.length,
    active: activeModules.filter(m => !m.isCore).length,
    beta: availableModules.filter(m => m.status === 'beta').length,
    premium: availableModules.filter(m => m.isPremium).length,
  };

  const categories = [
    { id: 'all', name: 'Tous', count: availableModules.length },
    { id: 'business', name: 'Business', count: availableModules.filter(m => m.category === 'business').length },
    { id: 'hr', name: 'RH', count: availableModules.filter(m => m.category === 'hr').length },
    { id: 'project', name: 'Projets', count: availableModules.filter(m => m.category === 'project').length },
    { id: 'integration', name: 'Intégrations', count: availableModules.filter(m => m.category === 'integration').length },
    { id: 'marketplace', name: 'Marketplace', count: availableModules.filter(m => m.category === 'marketplace').length },
  ];

  if (modulesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Modules</h1>
          <p className="text-gray-600 mt-1">
            {stats.active} module{stats.active > 1 ? 's' : ''} activé{stats.active > 1 ? 's' : ''} sur {stats.total}
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={refreshModules} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
            <Info className="w-4 h-4 mr-2" />
            {showDetails ? 'Masquer' : 'Détails'}
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Bêta</p>
                <p className="text-2xl font-bold text-gray-900">{stats.beta}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Premium</p>
                <p className="text-2xl font-bold text-gray-900">{stats.premium}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un module..."
                value={searchFilters.query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <select
              value={searchFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="all">Toutes catégories</option>
              {categories.slice(1).map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>
            
            <select
              value={searchFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="available">Disponibles</option>
              <option value="beta">Bêta</option>
            </select>
            
            <select
              value={searchFilters.pricing}
              onChange={(e) => handleFilterChange('pricing', e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="all">Tous prix</option>
              <option value="free">Gratuit</option>
              <option value="paid">Payant</option>
            </select>

            {(searchFilters.query || searchFilters.category !== 'all' || searchFilters.status !== 'all' || searchFilters.pricing !== 'all') && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Effacer
              </Button>
            )}
          </div>
        </div>

        {/* Tri */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Trier par:</span>
          <div className="flex gap-1">
            {[
              { key: 'name', label: 'Nom' },
              { key: 'rating', label: 'Popularité' },
              { key: 'updated', label: 'Mis à jour' }
            ].map(option => (
              <Button
                key={option.key}
                variant={sortBy === option.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setSortBy(option.key as any)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Alertes d'erreur */}
      {modulesError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {modulesError}
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredModules.map(module => {
          const activationStatus = activationStatuses.get(module.id);
          const isActive = isModuleActive(module.id);
          const canActivate = canActivateModule(module.id);
          
          return (
            <Card 
              key={module.id} 
              className={`transition-all duration-200 hover:shadow-lg ${
                isActive ? 'ring-2 ring-green-200 shadow-md' : 'hover:ring-1 hover:ring-gray-200'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {getModuleIcon(module.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{module.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {getStatusBadge(module)}
                        {module.isPremium && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            <Star className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                        {module.isCore && (
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                            <Shield className="w-3 h-3 mr-1" />
                            Core
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-600">
                      v{module.version}
                    </div>
                  </div>
                </div>
                
                <CardDescription className="mt-2 leading-relaxed">
                  {module.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informations du module */}
                {showDetails && (
                  <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="text-gray-600">Catégorie</p>
                      <div className="flex items-center gap-1 font-medium">
                        {getCategoryIcon(module.category)}
                        <span className="capitalize">{module.category}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600">Prix</p>
                      <p className="font-medium">{formatPrice(module.pricing)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Auteur</p>
                      <p className="font-medium">{module.author}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Statut</p>
                      <p className="font-medium capitalize">{module.status}</p>
                    </div>
                  </div>
                )}

                {/* Dépendances et conflits */}
                {showDetails && (module.dependencies.length > 0 || module.conflicts.length > 0) && (
                  <div className="space-y-2">
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
                    
                    {module.conflicts.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Conflits:</p>
                        <div className="flex flex-wrap gap-1">
                          {module.conflicts.map(conflict => (
                            <Badge key={conflict} variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
                              {conflict}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Barre de progression pour l'activation */}
                {activationStatus?.isActivating && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600 font-medium">{activationStatus.step}</span>
                      <span className="text-gray-500">{Math.round(activationStatus.progress)}%</span>
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

                {/* Avertissement si impossible d'activer */}
                {!isActive && !canActivate.canActivate && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      {canActivate.reason}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {module.status === 'available' && (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={isActive}
                          onCheckedChange={(checked) => handleToggleModule(module.id, checked)}
                          disabled={activationStatus?.isActivating || module.isCore || (!canActivate.canActivate && !isActive)}
                          aria-label={`${isActive ? 'Désactiver' : 'Activer'} ${module.name}`}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {isActive ? 'Activé' : 'Désactivé'}
                          </span>
                          {activationStatus?.isActivating && (
                            <span className="text-xs text-gray-500">En cours...</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" aria-label={`Paramètres de ${module.name}`}>
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" aria-label={`Plus d'infos sur ${module.name}`}>
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
                  
                  {module.status === 'beta' && !isActive && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleToggleModule(module.id, true)}
                      disabled={activationStatus?.isActivating || !canActivate.canActivate}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Installer (Bêta)
                    </Button>
                  )}
                </div>

                {/* Essai gratuit */}
                {module.pricing?.trialDays && !isActive && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800 font-medium">
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

      {/* Message si aucun module trouvé */}
      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun module trouvé
          </h3>
          <p className="text-gray-600 mb-4">
            Aucun module ne correspond à vos critères de recherche.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Effacer les filtres
          </Button>
        </div>
      )}
    </div>
  );
};

export default ModuleManagerEnhanced;