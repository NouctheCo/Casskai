import React, { useEffect } from 'react';
import {
  Menu,
  UserCircle,
  Briefcase,
  LogOut,
  ChevronsRightLeft,
  Layers,
  Settings as SettingsIcon,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EnterpriseSelector from '@/components/enterprise/EnterpriseSelector';

// Logo component simplifié - juste du texte
const Logo = ({ collapsed = false }) => {
  return (
    <div className={cn("font-bold text-primary select-none", collapsed ? "text-lg" : "text-xl")}>
      CK
    </div>
  );
};

// Fonction pour obtenir les initiales d'un nom
const getInitials = (name) => {
  if (!name) return 'U';
  
  const parts = name.split(' ');
  if (parts.length === 1) return name.charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Fonction pour obtenir le nom d'utilisateur
const getUserDisplayName = (user) => {
  if (!user) return null;
  
  // Vérifier les métadonnées utilisateur
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }
  
  if (user.user_metadata?.display_name) {
    return user.user_metadata.display_name;
  }
  
  if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
    return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
  }
  
  if (user.user_metadata?.first_name) {
    return user.user_metadata.first_name;
  }
  
  // Fallback sur l'email
  if (user.email) {
    const emailName = user.email.split('@')[0];
    // Capitaliser la première lettre
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  
  return null;
};

export function Sidebar({ isCollapsed, toggleSidebar, isMobile, isMobileSidebarOpen }) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const {
    user,
    signOut,
    userCompanies = [],
    switchEnterprise,
    currentEnterpriseId,
    currentEnterpriseName
  } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleEnterpriseChange = (company) => {
    switchEnterprise(company.id);
  };

  // Obtenir le nom d'affichage et les initiales
  const userDisplayName = getUserDisplayName(user);
  const userInitials = getInitials(userDisplayName || user?.email);

  return (
    <div className={cn(
      'fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background shadow-xl transition-all duration-300 ease-in-out',
      isMobile ? 'w-64' : (isCollapsed ? 'w-[4.5rem]' : 'w-64'),
      isMobile && !isMobileSidebarOpen && 'translate-x-[-100%]'
    )}>
      <div className={cn(
        "flex items-center border-b h-[60px] px-4",
        isCollapsed && !isMobile ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && !isMobile && (
          <div className="flex items-center gap-3">
            <Logo />
            <span className="font-semibold text-lg text-primary whitespace-nowrap overflow-hidden">
              CassKai
            </span>
          </div>
        )}
        
        {/* Logo collapsed state */}
        {isCollapsed && !isMobile && (
          <div className="flex items-center justify-center">
            <Logo collapsed />
          </div>
        )}
        
        {/* Mobile close button */}
        {(isMobile && isMobileSidebarOpen) && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
            <Menu className="h-6 w-6" />
          </Button>
        )}
        
        {/* Desktop close button */}
        {(!isMobile && !isCollapsed) && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <ChevronsRightLeft className="h-6 w-6" />
          </Button>
        )}
        
        {/* Desktop expand button */}
        {isCollapsed && !isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="text-muted-foreground"
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Profil utilisateur */}
      {!isCollapsed && user && (
        <div className="px-3 py-3 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate max-w-[160px]">
                {userDisplayName || user.email}
              </span>
              {userDisplayName && (
                <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                  {user.email}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Entreprise active */}
      {!isCollapsed && (
        <div className="px-3 py-2 border-b">
          <EnterpriseSelector />
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2 px-3">
        <NavItems isCollapsed={isCollapsed} isMobile={isMobile} />
      </div>

      <div className="mt-auto border-t p-3">
        <NavItem 
          to="/settings" 
          icon={SettingsIcon} 
          label={t('settings', 'Paramètres')} 
          isEffectivelyCollapsed={isCollapsed} 
        />
      </div>
    </div>
  );
}

const NavItems = ({ isCollapsed, isMobile }) => {
  const { t } = useLocale();
  const { ALL_MODULES = [], isModuleActive, loadingModules } = useModules();
  
  // Fonction de traduction sécurisée
  const safeT = (key, fallback = key) => {
    const translation = t(key);
    if (translation && !translation.includes("key '") && !translation.includes("' return")) {
      return translation;
    }
    return fallback;
  };

  // Définir les éléments de navigation avec les traductions correctes
  const baseNavItems = [
    { 
      to: "/", 
      label: safeT('common.dashboard', 'Tableau de bord'), 
      iconName: 'Home', 
      moduleKey: 'dashboard' 
    },
    { 
      to: "/forecasts", 
      label: safeT('financialForecasts', 'Prévisions financières'), 
      iconName: 'Zap', 
      moduleKey: 'forecasts_module' 
    },
    { 
      to: "/third-parties", 
      label: safeT('thirdParties.title', 'Tiers'), 
      iconName: 'Users2', 
      moduleKey: 'third_parties_module' 
    },
  ];

  const additionalNavItems = [
    { to: "/invoicing", label: safeT('invoicing', 'Facturation'), iconName: 'InvoicingIcon', moduleKey: 'invoicing' },
    { to: "/purchases", label: safeT('purchases', 'Achats'), iconName: 'ShoppingCart', moduleKey: 'purchases' },
    { to: "/sales-crm", label: safeT('salesCrm', 'Ventes & CRM'), iconName: 'Users', moduleKey: 'sales_crm' },
    { to: "/human-resources", label: safeT('humanResources', 'Ressources Humaines'), iconName: 'UsersRound', moduleKey: 'human_resources' },
    { to: "/projects", label: safeT('projects', 'Projets'), iconName: 'KanbanSquare', moduleKey: 'projects' },
    { to: "/inventory", label: safeT('inventory', 'Inventaire'), iconName: 'Archive', moduleKey: 'inventory' },
    { to: "/accounting", label: safeT('accountingPageTitle', 'Comptabilité'), iconName: 'Briefcase', moduleKey: 'accounting' },
    { to: "/banking", label: safeT('bankConnections', 'Banques'), iconName: 'Landmark', moduleKey: 'banking' },
    { to: "/reports", label: safeT('financialReports', 'Rapports financiers'), iconName: 'BarChart3', moduleKey: 'reports' },
    { to: "/tax", label: safeT('tax', 'Taxes'), iconName: 'FileText', moduleKey: 'tax_module' },
  ];

  const moduleNavItems = ALL_MODULES
    .filter(mod => typeof mod.path === 'string' && mod.path.startsWith('/'))
    .map(mod => ({
      to: mod.path,
      label: safeT(mod.nameKey, mod.nameKey),
      iconName: mod.icon,
      moduleKey: mod.key,
    }));

  const combinedNavItems = [
    ...baseNavItems,
    ...additionalNavItems,
    ...moduleNavItems
  ];

  const uniqueNavItems = combinedNavItems.reduce((acc, current) => {
    const exists = acc.find(item => item.to === current.to);
    return exists ? acc : [...acc, current];
  }, []);

  // Filtrage sécurisé des navItems
  const navItems = uniqueNavItems
    .filter(item => {
      // Vérification de sécurité pour les routes
      if (!item.to || typeof item.to !== 'string' || item.to.trim() === '' || !item.to.startsWith('/')) {
        console.warn('Filtered out invalid nav item:', item);
        return false;
      }
      return item.moduleKey === 'dashboard' || isModuleActive(item.moduleKey) || ['forecasts_module', 'third_parties_module', 'accounting', 'banking', 'reports', 'tax_module'].includes(item.moduleKey);
    })
    .map(item => ({ ...item, icon: getIcon(item.iconName) }));

  if (loadingModules) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {navItems.map(item => (
        <NavItem 
          key={item.to} 
          to={item.to} 
          icon={item.icon} 
          label={item.label} 
          isEffectivelyCollapsed={isCollapsed && !isMobile} 
        />
      ))}
    </div>
  );
};

const NavItem = ({ to, icon: IconComponent, label, isEffectivelyCollapsed }) => {
  const location = useLocation();
  
  // Vérifications de sécurité simplifiées pour les routes React
  if (!to || typeof to !== 'string' || to.trim() === '') {
    console.warn('NavItem: Invalid to prop', { to, label });
    return null;
  }
  
  if (!IconComponent) {
    console.warn('NavItem: No icon component', { to, label });
    return null;
  }

  // Vérification que la route commence par "/" (route interne React Router)
  if (!to.startsWith('/')) {
    console.error('NavItem: Route must start with /', { to, label });
    return null;
  }

  const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={to}
            className={cn(
              'flex items-center h-10 px-3 rounded-md text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground'
            )}
          >
            <IconComponent className={cn('h-5 w-5', !isEffectivelyCollapsed && 'mr-3')} />
            {!isEffectivelyCollapsed && (
              <span className="whitespace-nowrap overflow-hidden">{label}</span>
            )}
          </NavLink>
        </TooltipTrigger>
        {isEffectivelyCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
};

// Imports manquants
import { useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useModules } from '@/contexts/ModulesContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Home, Landmark, BarChart3, Zap, Users2, ShoppingCart, Users, KeyRound as UsersRound, KanbanSquare, Archive, FileText as InvoiceIcon, Banknote, FileText } from 'lucide-react';

const getIcon = (iconName) => {
  switch (iconName) {
    case 'Home': return Home;
    case 'Briefcase': return Briefcase;
    case 'Landmark': return Landmark;
    case 'BarChart3': return BarChart3;
    case 'Zap': return Zap;
    case 'Users2': return Users2;
    case 'ShoppingCart': return ShoppingCart;
    case 'Users': return Users;
    case 'UsersRound': return UsersRound;
    case 'KanbanSquare': return KanbanSquare;
    case 'Archive': return Archive;
    case 'FileText': return FileText;
    case 'InvoicingIcon': return InvoiceIcon;
    default: return Home;
  }
};