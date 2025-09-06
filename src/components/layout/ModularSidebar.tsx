// @ts-nocheck
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useModulesSafe, useModules } from '@/contexts/ModulesContext';
import { 
  LayoutDashboard,
  Calculator,
  Building,
  Users,
  FileText,
  Settings,
  Package,
  Zap,
  Store,
  Briefcase,
  ShoppingCart,
  Archive,
  BarChart3,
  Sparkles,
  UsersRound,
  KanbanSquare,
  Users2,
  Landmark,
  Shield,
  Home
} from 'lucide-react';

// Configuration de base de la navigation (modules core toujours visibles)
const coreNavItems = [
  {
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
    moduleId: null, // Pas de module requis
  },
  {
    title: 'Comptabilité',
    href: '/accounting',
    icon: Calculator,
    moduleId: 'accounting-core', // Module core
    children: [
      { title: 'Plan comptable', href: '/accounting/chart' },
      { title: 'Écritures', href: '/accounting/entries' },
      { title: 'Journaux', href: '/accounting/journals' },
      { title: 'Import FEC', href: '/accounting/import' },
    ],
  },
  {
    title: 'Banques',
    href: '/banks',
    icon: Building,
    moduleId: 'banking-core', // Module core
  },
  {
    title: 'Tiers',
    href: '/third-parties',
    icon: Users,
    moduleId: 'accounting-core', // Module core
  },
  {
    title: 'Rapports',
    href: '/reports',
    icon: FileText,
    moduleId: 'accounting-core', // Module core
  },
];

// Configuration des modules premium avec leurs éléments de navigation
const moduleNavItems = {
  'crm-sales': {
    title: 'CRM & Ventes',
    href: '/crm',
    icon: Users,
    badge: 'Premium',
    children: [
      { title: 'Dashboard CRM', href: '/crm' },
      { title: 'Contacts', href: '/crm/contacts' },
      { title: 'Pipeline', href: '/crm/pipeline' },
      { title: 'Devis', href: '/crm/quotes' },
      { title: 'Affaires', href: '/crm/deals' },
    ],
  },
  'hr-light': {
    title: 'RH Light',
    href: '/hr',
    icon: Users,
    badge: 'Premium',
    children: [
      { title: 'Dashboard RH', href: '/hr' },
      { title: 'Employés', href: '/hr/employees' },
      { title: 'Congés', href: '/hr/leaves' },
      { title: 'Notes de frais', href: '/hr/expenses' },
      { title: 'Paie', href: '/hr/payroll' },
    ],
  },
  'projects-management': {
    title: 'Projets',
    href: '/projects',
    icon: Package,
    badge: 'Premium',
    children: [
      { title: 'Dashboard Projets', href: '/projects' },
      { title: 'Liste des projets', href: '/projects/list' },
      { title: 'Timetracking', href: '/timetracking' },
      { title: 'Rapports projets', href: '/projects/reports' },
    ],
  },
};

const ModularSidebar: React.FC = () => {
  const location = useLocation();
  const { activeModules, isModuleActive, availableModules, allModules } = useModulesSafe();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  // DEBUG: Log pour comprendre le problème
  React.useEffect(() => {
    console.log('🐛 [ModularSidebar] DEBUG:', {
      allModules: allModules?.length || 0,
      activeModules: activeModules?.length || 0,
      availableModules: availableModules?.length || 0,
      allModulesData: allModules
    });
  }, [allModules, activeModules, availableModules]);

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
                'w-full justify-start',
                isChild ? 'pl-8 py-2' : 'py-3',
                itemIsActive && 'bg-accent text-accent-foreground'
              )}
            >
              {item.icon && <item.icon className="mr-3 h-4 w-4" />}
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {item.badge}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 ml-2" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-2" />
              )}
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
          'w-full justify-start',
          isChild ? 'pl-8 py-2' : 'py-3',
          itemIsActive && 'bg-accent text-accent-foreground'
        )}
        asChild
      >
        <Link to={item.href}>
          {item.icon && <item.icon className="mr-3 h-4 w-4" />}
          <span className="flex-1 text-left">{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-2 text-xs">
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
      navigation.push({ type: 'separator', title: 'Modules Premium' });
    }

    // Ajouter les modules actifs
    activeModules.forEach(module => {
      if (module.isCore) return; // Skip les modules core (déjà ajoutés)
      
      const moduleNav = moduleNavItems[module.id as keyof typeof moduleNavItems];
      if (moduleNav) {
        navigation.push(moduleNav);
      }
    });

    return navigation;
  };

  const navigation = buildNavigation();
  const inactiveModulesCount = availableModules.filter(m => !m.isCore && !isModuleActive(m.id)).length;

  return (
    <div className="flex flex-col h-full">
      {/* Navigation principale */}
      <nav className="flex-1 space-y-1 py-4">
        {navigation.map((item, index) => {
          if (item.type === 'separator') {
            return (
              <div key={`separator-${index}`} className="py-2">
                <div className="flex items-center">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
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
      <div className="border-t pt-4 space-y-2">
        {inactiveModulesCount > 0 && (
          <Button
            variant="ghost"
            className="w-full justify-start py-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            asChild
          >
            <Link to="/modules">
              <Zap className="mr-3 h-4 w-4" />
              <span className="flex-1 text-left">Extensions disponibles</span>
              <Badge variant="outline" className="ml-2 text-xs border-blue-200 text-blue-600">
                {inactiveModulesCount}
              </Badge>
            </Link>
          </Button>
        )}


        {/* Paramètres */}
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start py-3',
            isActive('/settings') && 'bg-accent text-accent-foreground'
          )}
          asChild
        >
          <Link to="/settings">
            <Settings className="mr-3 h-4 w-4" />
            <span className="flex-1 text-left">Paramètres</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ModularSidebar;