import React, { useMemo, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useModules } from '@/contexts/ModulesContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ModuleRendererProps {
  moduleId: string;
}

// Pages principales uniquement
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const HumanResourcesPage = lazy(() => import('@/pages/HumanResourcesPage'));
const SalesCrmPage = lazy(() => import('@/pages/SalesCrmPage'));

// Mapping des routes vers les composants (uniquement pour sous-routes spécifiques si nécessaire)
const moduleComponents: Record<string, Record<string, React.ComponentType<any>>> = {
  // Routes pour les modules principaux (si besoin de sous-routes spécifiques)
  'crm': {
    '/modules/crm': SalesCrmPage,
  },
  'hr': {
    '/modules/hr': HumanResourcesPage,
  },
  'projects': {
    '/modules/projects': ProjectsPage,
  }
};

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="flex items-center space-x-3">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
      <p className="text-gray-600 dark:text-gray-300">Chargement du module...</p>
    </div>
  </div>
);

const ModuleRenderer: React.FC<ModuleRendererProps> = ({ moduleId }) => {
  const location = useLocation();
  const { activeModules, isModuleActive } = useModules();

  const moduleComponent = useMemo(() => {
    if (!isModuleActive(moduleId)) {
      return (
        <Card className="m-6">
          <CardContent className="p-6">
            <div className="flex items-center text-orange-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>Le module {moduleId} n'est pas activé. Veuillez l'activer dans les paramètres.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const currentPath = location.pathname;
    const moduleRoutes = moduleComponents[moduleId];
    
    if (!moduleRoutes) {
      return (
        <Card className="m-6">
          <CardContent className="p-6">
            <div className="flex items-center text-yellow-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>Module {moduleId} en cours de développement. Interface bientôt disponible.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Trouver le composant correspondant à la route
    const Component = moduleRoutes[currentPath] || moduleRoutes[Object.keys(moduleRoutes)[0]];
    
    if (!Component) {
      return (
        <Card className="m-6">
          <CardContent className="p-6">
            <div className="flex items-center text-yellow-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>Aucun composant trouvé pour la route {currentPath} du module {moduleId}.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Suspense fallback={<LoadingFallback />}>
        <Component />
      </Suspense>
    );
  }, [moduleId, location.pathname, activeModules, isModuleActive]);

  return moduleComponent;
};

export default ModuleRenderer;