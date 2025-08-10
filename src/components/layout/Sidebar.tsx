import React, { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Briefcase, Landmark, FileText, ShoppingCart, Users, UsersRound, KanbanSquare, Archive, BarChart3, Zap, Users2, Settings, Sparkles, Bell, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useModules } from '@/contexts/ModulesContext';
import { useTranslation } from 'react-i18next';
import { tSafe } from '@/i18n/i18n';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapse: () => void;
  activeModules: any[];
  isMobile?: boolean;
}

// Mapping des icônes avec nouvelles icônes modernes
const iconMap = {
  Home,
  Briefcase,
  Landmark,
  FileText,
  ShoppingCart,
  Users,
  UsersRound,
  KanbanSquare,
  Archive,
  BarChart3,
  Zap,
  Users2,
  Settings,
  Sparkles,
  Bell,
  Shield
};

export function Sidebar({ isCollapsed, onCollapse, activeModules, isMobile = false }: SidebarProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const { allModules, isLoading } = useModules();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Fonction de traduction personnalisée avec fallbacks pour la sidebar
  const getSidebarTranslation = (key: string, fallback?: string) => {
    // Mapping des clés de modules vers les clés de traduction du JSON
    const keyMappings: Record<string, string> = {
      'dashboard': 'sidebar.dashboard',
      'accounting': 'sidebar.accounting',
      'accountingPageTitle': 'sidebar.accounting',
      'banking': 'sidebar.banking',
      'bankConnections': 'sidebar.banking',
      'invoicing': 'sidebar.invoicing',
      'purchases': 'sidebar.purchases',
      'sales': 'sidebar.sales',
      'salesCrm': 'sidebar.sales',
      'humanResources': 'sidebar.humanResources',
      'projects': 'sidebar.projects',
      'inventory': 'sidebar.inventory',
      'reports': 'sidebar.reports',
      'financialReports': 'sidebar.reports',
      'forecasts': 'sidebar.forecasts',
      'thirdParties': 'sidebar.thirdParties',
      'tax': 'sidebar.tax',
      'security': 'sidebar.security',
      'settings': 'sidebar.settings'
    };

    // Utiliser le mapping si disponible
    const mappedKey = keyMappings[key] || key;
    
    // Essayer avec la clé mappée
    let translation = tSafe(mappedKey, '');
    if (translation && translation !== mappedKey) {
      return translation;
    }

    // Essayer avec la clé originale
    translation = tSafe(key, '');
    if (translation && translation !== key) {
      return translation;
    }

    // Essayer dans common
    translation = tSafe(`common.${key}`, '');
    if (translation && translation !== `common.${key}`) {
      return translation;
    }

    // Utiliser le fallback ou la clé
    return fallback || key;
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <Home className="h-5 w-5" />;
  };

  const NavItem = ({ module }: { module: any }) => {
    const isActive = location.pathname === module.path;
    const Icon = iconMap[module.icon as keyof typeof iconMap] || Home;
    const isHovered = hoveredItem === module.key;

    const navItem = (
      <motion.div
        className="relative"
        onMouseEnter={() => setHoveredItem(module.key)}
        onMouseLeave={() => setHoveredItem(null)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <NavLink
          to={module.path}
          className={cn(
            "nav-item relative group min-h-[44px] touch-manipulation flex items-center gap-[5px]",
            isActive
              ? "nav-item-active"
              : "nav-item-inactive"
          )}
        >
          {/* Active indicator */}
          {isActive && (
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full"
              layoutId="activeIndicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}

          {/* Glow effect on hover */}
          <AnimatePresence>
            {isHovered && !isActive && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>

          {/* Icon with animation */}
          <motion.div
            className="relative z-10 flex-shrink-0"
            animate={{
              rotate: isActive ? [0, 5, -5, 0] : 0,
              scale: isHovered ? 1.1 : 1
            }}
            transition={{ 
              rotate: { duration: 0.5, ease: "easeInOut" },
              scale: { duration: 0.2 }
            }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>

          {/* Text with slide animation */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                className="truncate relative z-10 flex-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {getSidebarTranslation(module.nameKey, module.label)}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Notification badge */}
          {module.hasNotifications && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </NavLink>
      </motion.div>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {navItem}
            </TooltipTrigger>
            <TooltipContent side="right" className="glass-card">
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
              >
                {getSidebarTranslation(module.nameKey, module.label)}
              </motion.div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return navItem;
  };

  return (
    <motion.div
      className={cn(
        "glass-nav flex flex-col h-full transition-all duration-300 shadow-xl",
        isMobile ? "w-64 fixed inset-y-0 left-0 z-50" : 
          isCollapsed ? "sidebar-collapsed w-16" : "sidebar-expanded w-64"
      )}
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header with modern design */}
      <div className="p-4 border-b border-white/20 dark:border-gray-800/20">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">CK</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white gradient-text">
                  CassKai
                </h2>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isMobile && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onCollapse}
                className="h-8 w-8 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors"
              >
                <motion.div
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </motion.div>
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation with modern scrollbar */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
          >
            {allModules
              .filter(module => !module.isGlobal)
              .map((module, index) => (
                <motion.div
                  key={module.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NavItem module={module} />
                </motion.div>
              ))}
          </motion.div>
        )}
      </nav>

      {/* Footer with global modules */}
      <div className="p-4 border-t border-white/20 dark:border-gray-800/20 space-y-2">
        {allModules
          .filter(module => module.isGlobal)
          .map((module, index) => (
            <motion.div
              key={module.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <NavItem module={module} />
            </motion.div>
          ))}
      </div>

      {/* Bottom gradient decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
    </motion.div>
  );
}