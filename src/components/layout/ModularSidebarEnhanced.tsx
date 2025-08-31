import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useModules } from '@/contexts/ModulesContext';
import { icons, getModuleIcon, iconSizes } from '@/lib/icons';

// Import direct des icônes spécifiques utilisées
import { 
  LayoutDashboard,
  Calculator,
  Building,
  Users,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Zap,
  Star,
  Store,
  UserCog,
  Briefcase,
  CreditCard,
  BarChart3,
  Calendar,
  Target,
  Shield,
  Plus,
  Sparkles,
  Search,
  Clock,
  Workflow,
  Package
} from 'lucide-react';

// Configuration de base de la navigation (modules core toujours visibles)
const coreNavItems = [
  {
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
    moduleId: null, // Pas de module requis
    description: 'Vue d\'ensemble de votre activité',
  },
  {
    title: 'Comptabilité',
    href: '/accounting',
    icon: Calculator,
    moduleId: 'accounting-core', // Module core
    description: 'Gestion comptable complète',
    children: [
      { title: 'Plan comptable', href: '/accounting/chart', icon: FileText },
      { title: 'Écritures', href: '/accounting/entries', icon: Calculator },
      { title: 'Journaux', href: '/accounting/journals', icon: FileText },
      { title: 'Import FEC', href: '/accounting/import', icon: FileText },
    ],
  },
  {
    title: 'Banques',
    href: '/banks',
    icon: Building,
    moduleId: 'banking-core', // Module core
    description: 'Gestion bancaire et rapprochements',
  },
  {
    title: 'Tiers',
    href: '/third-parties',
    icon: Users,
    moduleId: 'accounting-core', // Module core
    description: 'Clients, fournisseurs et contacts',
  },
  {
    title: 'Rapports',
    href: '/reports',
    icon: FileText,
    moduleId: 'accounting-core', // Module core
    description: 'États financiers et analyses',
  },
];

// Mapping entre les clés simples des modules et les IDs complexes de navigation
const moduleKeyMapping: Record<string, string> = {
  'crm': 'crm-sales',
  'hr': 'hr-light', 
  'projects': 'projects-management',
  'marketplace': 'marketplace'
};

// Configuration des modules premium avec leurs éléments de navigation
const moduleNavItems = {
  'crm-sales': {
    title: 'CRM & Ventes',
    href: '/crm',
    icon: Target,
    badge: 'Premium',
    color: 'blue',
    description: 'Pipeline commercial et gestion clients',
    children: [
      { title: 'Dashboard CRM', href: '/crm', icon: LayoutDashboard },
      { title: 'Contacts', href: '/crm/contacts', icon: Users },
      { title: 'Pipeline', href: '/crm/pipeline', icon: Workflow },
      { title: 'Devis', href: '/crm/quotes', icon: FileText },
      { title: 'Affaires', href: '/crm/deals', icon: Target },
    ],
  },
  'hr-light': {
    title: 'RH Light',
    href: '/hr',
    icon: UserCog,
    badge: 'Premium',
    color: 'green',
    description: 'Gestion des ressources humaines',
    children: [
      { title: 'Dashboard RH', href: '/hr', icon: LayoutDashboard },
      { title: 'Employés', href: '/hr/employees', icon: Users },
      { title: 'Congés', href: '/hr/leaves', icon: Calendar },
      { title: 'Notes de frais', href: '/hr/expenses', icon: CreditCard },
      { title: 'Paie', href: '/hr/payroll', icon: Calculator },
    ],
  },
  'projects-management': {
    title: 'Projets',
    href: '/projects',
    icon: Briefcase,
    badge: 'Premium',
    color: 'purple',
    description: 'Gestion de projets et timetracking',
    children: [
      { title: 'Dashboard Projets', href: '/projects', icon: LayoutDashboard },
      { title: 'Liste des projets', href: '/projects/list', icon: Package },
      { title: 'Timetracking', href: '/timetracking', icon: Clock },
      { title: 'Rapports projets', href: '/projects/reports', icon: BarChart3 },
    ],
  },
  'marketplace': {
    title: 'Marketplace',
    href: '/marketplace',
    icon: Store,
    badge: 'Nouveau',
    color: 'orange',
    description: 'Extensions et templates',
    children: [
      { title: 'Découvrir', href: '/marketplace/browse', icon: Search },
      { title: 'Mes extensions', href: '/marketplace/installed', icon: Package },
      { title: 'Publier', href: '/marketplace/publish', icon: Plus },
    ],
  },
};

// Couleurs pour les badges
const badgeColors = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
};

const ModularSidebarEnhanced: React.FC = () => {
  const location = useLocation();
  const { activeModules, isModuleActive, availableModules } = useModules();
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['Comptabilité']); // Par défaut, expandre la comptabilité

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems(prev => 
      prev.includes(itemTitle)
        ? prev.filter(t => t !== itemTitle)
        : [...prev, itemTitle]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || 
           (href !== '/' && location.pathname.startsWith(href));
  };

  const renderNavItem = (item: any, isChild: boolean = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const itemIsActive = isActive(item.href);

    if (hasChildren) {
      return (
        <Collapsible key={item.title} open={isExpanded} onOpenChange={() => toggleExpanded(item.title)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start group hover:bg-gray-50 transition-all duration-200',
                isChild ? 'pl-8 py-2' : 'py-3 px-3',
                itemIsActive && 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
              )}
            >
              {item.icon && (
                <item.icon className={cn(
                  'mr-3 h-4 w-4 transition-colors',
                  itemIsActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                )} />
              )}
              <div className="flex-1 text-left">
                <div className="font-medium">{item.title}</div>
                {!isChild && item.description && (
                  <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                )}
              </div>
              
              {item.badge && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'ml-2 text-xs',
                    badgeColors[item.color] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {item.badge}
                </Badge>
              )}
              
              <div className="ml-2 transition-transform duration-200">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {item.children.map((child: any) => renderNavItem(child, true))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.title}
        variant="ghost"
        className={cn(
          'w-full justify-start group hover:bg-gray-50 transition-all duration-200',
          isChild ? 'pl-10 py-2 text-sm' : 'py-3 px-3',
          itemIsActive && 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
        )}
        asChild
      >
        <Link to={item.href}>
          {item.icon && (
            <item.icon className={cn(
              'mr-3 h-4 w-4 transition-colors',
              isChild ? 'h-3 w-3' : 'h-4 w-4',
              itemIsActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
            )} />
          )}
          <div className="flex-1 text-left">
            <div className="font-medium">{item.title}</div>
            {!isChild && item.description && (
              <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
            )}
          </div>
          {item.badge && (
            <Badge 
              variant="secondary" 
              className={cn(
                'ml-2 text-xs',
                badgeColors[item.color] || 'bg-gray-100 text-gray-800'
              )}
            >
              {item.badge}
            </Badge>
          )}
        </Link>
      </Button>
    );
  };

  // Construire la navigation complète
  const buildNavigation = () => {
    const navigation: any[] = [];

    // Ajouter les éléments core (toujours visibles)
    coreNavItems.forEach(item => {
      // Vérifier si le module core est nécessaire et actif
      if (item.moduleId && !isModuleActive(item.moduleId)) {
        return; // Skip si le module core n'est pas actif
      }
      navigation.push(item);
    });

    // Ajouter un séparateur si des modules premium sont disponibles
    const hasActiveModules = activeModules.some(m => !m.isCore);
    if (hasActiveModules) {
      navigation.push({ 
        type: 'separator', 
        title: 'Modules Premium',
        icon: Sparkles
      });
    }

    // Ajouter les modules actifs depuis localStorage (modules sélectionnés lors de l'onboarding)
    const savedModules = localStorage.getItem('casskai_modules');
    if (savedModules) {
      try {
        const activeModulesFromStorage = JSON.parse(savedModules);
        Object.keys(activeModulesFromStorage).forEach(moduleId => {
          if (activeModulesFromStorage[moduleId] && moduleNavItems[moduleId as keyof typeof moduleNavItems]) {
            const moduleNav = moduleNavItems[moduleId as keyof typeof moduleNavItems];
            // Éviter les doublons
            if (!navigation.some(item => item.href === moduleNav.href)) {
              navigation.push(moduleNav);
            }
          }
        });
      } catch (error) {
        console.error('[ModularSidebarEnhanced] Erreur parsing localStorage modules:', error);
      }
    }

    // Ajouter les modules actifs du contexte (système de modules)
    activeModules.forEach(module => {
      if (module.isCore) return; // Skip les modules core (déjà ajoutés)

      // Utiliser le mapping pour convertir la clé simple en clé complexe
      const mappedKey = moduleKeyMapping[module.id] || module.id;
      const moduleNav = moduleNavItems[mappedKey as keyof typeof moduleNavItems];
      if (moduleNav) {
        // Éviter les doublons
        if (!navigation.some(item => item.href === moduleNav.href)) {
          navigation.push(moduleNav);
        }
      } else {
        console.warn(`[ModularSidebarEnhanced] Module ${module.id} (mapped to ${mappedKey}) not found in moduleNavItems`);
      }
    });

    return navigation;
  };

  const navigation = buildNavigation();
  const inactiveModulesCount = availableModules.filter(m => !m.isCore && !isModuleActive(m.id)).length;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* En-tête de la sidebar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">CassKai</h2>
            <p className="text-xs text-gray-500">Gestion d'entreprise</p>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item, index) => {
          if (item.type === 'separator') {
            return (
              <div key={`separator-${index}`} className="py-3">
                <div className="flex items-center gap-2 px-3">
                  <item.icon className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {item.title}
                  </span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              </div>
            );
          }
          return renderNavItem(item);
        })}
      </nav>

      {/* Section modules inactifs et paramètres */}
      <div className="border-t border-gray-200 p-3 space-y-2">
        {inactiveModulesCount > 0 && (
          <Button
            variant="ghost"
            className="w-full justify-start py-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
            asChild
          >
            <Link to="/settings/modules">
              <div className="p-1.5 bg-blue-100 rounded-md mr-3">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Extensions disponibles</div>
                <div className="text-xs text-blue-500">
                  {inactiveModulesCount} module{inactiveModulesCount > 1 ? 's' : ''} à découvrir
                </div>
              </div>
              <Badge variant="outline" className="ml-2 text-xs border-blue-200 text-blue-600 bg-blue-50">
                {inactiveModulesCount}
              </Badge>
            </Link>
          </Button>
        )}

        {/* Marketplace (si actif) */}
        {isModuleActive('marketplace') && (
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start py-3 hover:bg-gray-50 transition-all duration-200',
              isActive('/marketplace') && 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
            )}
            asChild
          >
            <Link to="/marketplace">
              <div className="p-1.5 bg-orange-100 rounded-md mr-3">
                <Store className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Marketplace</div>
                <div className="text-xs text-gray-500">Extensions et templates</div>
              </div>
              <Badge className="ml-2 text-xs bg-orange-100 text-orange-800 border-orange-200">
                Nouveau
              </Badge>
            </Link>
          </Button>
        )}

        {/* Paramètres */}
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start py-3 hover:bg-gray-50 transition-all duration-200',
            isActive('/settings') && 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
          )}
          asChild
        >
          <Link to="/settings">
            <div className="p-1.5 bg-gray-100 rounded-md mr-3">
              <Settings className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Paramètres</div>
              <div className="text-xs text-gray-500">Configuration générale</div>
            </div>
          </Link>
        </Button>
      </div>

      {/* Footer avec statut */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Système opérationnel</span>
        </div>
      </div>
    </div>
  );
};

export default ModularSidebarEnhanced;