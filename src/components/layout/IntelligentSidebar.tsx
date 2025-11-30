import React, { useState, useEffect } from 'react';

import { useLocation, Link } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import { useModulesSafe } from '@/hooks/modules.hooks';

import { useAuth } from '@/contexts/AuthContext';

import { useSubscription } from '@/contexts/SubscriptionContext';

import { 

  Home,

  Calculator,

  FileText,

  Landmark,

  Users,

  ShoppingCart,

  Package,

  Briefcase,

  BarChart3,

  ChevronRight,

  Search,

  Star,

  Clock,

  Zap,

  Crown,

  Sparkles,

  Command

} from 'lucide-react';



// Catégories organisées de manière intuitive

const MODULE_CATEGORIES = {

  finances: {

    label: 'Finances',

    icon: Calculator,

    color: 'blue',

    modules: ['dashboard', 'accounting', 'banking', 'invoicing', 'tax', 'budget'],

    priority: 1

  },

  commercial: {

    label: 'Commercial',

    icon: Users,

    color: 'green',

    modules: ['salesCrm', 'contracts'],

    priority: 2

  },

  gestion: {

    label: 'Gestion',

    icon: Package,

    color: 'purple',

    modules: ['inventory', 'purchases', 'projects', 'thirdParties', 'humanResources'],

    priority: 3

  },

  analyse: {

    label: 'Analyse',

    icon: BarChart3,

    color: 'orange',

    modules: ['reports'],

    priority: 4

  },

  automation: {

    label: 'Automatisation',

    icon: Zap,

    color: 'yellow',

    modules: ['automation'],

    priority: 5

  }

};



const MODULE_ICONS = {

  dashboard: Home,

  accounting: Calculator,

  banking: Landmark,

  invoicing: FileText,

  tax: Calculator,

  budget: Calculator,

  reports: BarChart3,

  salesCrm: Users,

  contracts: Briefcase,

  inventory: Package,

  purchases: ShoppingCart,

  projects: Briefcase,

  analytics: Sparkles,

  humanResources: Users,

  thirdParties: Users,

  automation: Zap

};



interface IntelligentSidebarProps {

  collapsed?: boolean;

  onToggle?: () => void;

}



export function IntelligentSidebar({ collapsed = false }: IntelligentSidebarProps) {

  const location = useLocation();

  const { allModules, isModuleActive, activeModules, canAccessModule } = useModulesSafe();

  const { user, currentCompany: _currentCompany } = useAuth();

  const { subscription } = useSubscription();

  

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['finances']));

  const [searchQuery, setSearchQuery] = useState('');

  const [recentModules, setRecentModules] = useState<string[]>([]);

  const [favoriteModules, setFavoriteModules] = useState<Set<string>>(new Set());



  // Charger les favoris et récents depuis localStorage

  useEffect(() => {

    if (!user) return;

    

    const stored = localStorage.getItem(`sidebar-preferences-${user.id}`);

    if (stored) {

      try {

        const prefs = JSON.parse(stored);

        setFavoriteModules(new Set(prefs.favorites || []));

        setRecentModules(prefs.recent || []);

        setExpandedCategories(new Set(prefs.expanded || ['finances']));

      } catch (error) {

        console.error('Error loading sidebar preferences:', error instanceof Error ? error.message : String(error));

      }

    }

  }, [user, activeModules]);



  // Sauvegarder les préférences

  const savePreferences = (updates: Record<string, unknown>) => {

    if (!user) return;

    

    const prefs = {

      favorites: Array.from(favoriteModules),

      recent: recentModules,

      expanded: Array.from(expandedCategories),

      ...updates

    };

    

    localStorage.setItem(`sidebar-preferences-${user.id}`, JSON.stringify(prefs));

  };



  // Tracking des modules récents

  useEffect(() => {

    const currentModule = getCurrentModule();

    if (currentModule && !recentModules.includes(currentModule)) {

      const newRecent = [currentModule, ...recentModules.slice(0, 4)];

      setRecentModules(newRecent);

      savePreferences({ recent: newRecent });

    }

  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps



  const getCurrentModule = () => {

    const path = location.pathname.substring(1);

    return allModules?.find(m => m.path === `/${path}` || (m.path && m.path.includes(path)))?.id;

  };



  const isActive = (modulePath: string) => {

    return location.pathname === modulePath || 

           (modulePath !== '/' && location.pathname.startsWith(modulePath));

  };



  const toggleCategory = (categoryKey: string) => {

    const newExpanded = new Set(expandedCategories);

    if (newExpanded.has(categoryKey)) {

      newExpanded.delete(categoryKey);

    } else {

      newExpanded.add(categoryKey);

    }

    setExpandedCategories(newExpanded);

    savePreferences({ expanded: Array.from(newExpanded) });

  };



  const toggleFavorite = (moduleKey: string) => {

    const newFavorites = new Set(favoriteModules);

    if (newFavorites.has(moduleKey)) {

      newFavorites.delete(moduleKey);

    } else {

      newFavorites.add(moduleKey);

    }

    setFavoriteModules(newFavorites);

    savePreferences({ favorites: Array.from(newFavorites) });

  };



  const getModulesByCategory = (categoryModules: string[]) => {

    return allModules?.filter(module => 

      categoryModules.includes(module.key) &&

      (searchQuery === '' || 

       module.name.toLowerCase().includes(searchQuery.toLowerCase()))

    ) || [];

  };



  const getRecentModulesData = () => {

    return recentModules.map(moduleKey => 

      allModules?.find(m => m.key === moduleKey)

    ).filter(Boolean).slice(0, 3);

  };



  const getFavoriteModulesData = () => {

    return Array.from(favoriteModules).map(moduleKey =>

      allModules?.find(m => m.key === moduleKey)

    ).filter(Boolean);

  };





  // Raccourcis clavier

  useEffect(() => {

    const handleKeyPress = (e: KeyboardEvent) => {

      if (e.ctrlKey && e.shiftKey) {

        switch(e.key) {

          case 'D': window.location.href = '/dashboard'; break;

          case 'C': window.location.href = '/accounting'; break;

          case 'I': window.location.href = '/invoicing'; break;

          case 'R': window.location.href = '/reports'; break;

        }

      }

    };



    window.addEventListener('keydown', handleKeyPress);

    return () => window.removeEventListener('keydown', handleKeyPress);

  }, []);



  if (!allModules) return <div className="p-4">Chargement...</div>;



  return (

    <motion.aside 

      className={cn(

        "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col",

        "transition-all duration-300",

        collapsed ? "w-16" : "w-72"

      )}

      initial={false}

      animate={{ width: collapsed ? 64 : 288 }}

    >

      {/* Logo Header */}

      <div className="p-4 border-b border-gray-200 dark:border-gray-600 dark:border-gray-700">

        <Link to="/dashboard" className="flex items-center justify-center">

          <img 

            src="/logo.png" 

            alt="CassKai" 

            className={cn(

              "transition-all duration-300",

              collapsed ? "h-8 w-8" : "h-10 w-auto"

            )}

          />

        </Link>

      </div>



      {/* Header avec recherche */}

      <div className="p-4 border-b border-gray-200 dark:border-gray-600 dark:border-gray-700">

        {!collapsed && (

          <div className="relative">

            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />

            <input

              id="sidebar-search"

              name="sidebar-search"

              type="text"

              placeholder="Rechercher..."

              value={searchQuery}

              onChange={(e) => setSearchQuery(e.target.value)}

              autoComplete="off"

              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"

            />

          </div>

        )}

        

        {collapsed && (

          <div className="flex justify-center">

            <Command className="h-6 w-6 text-gray-600 dark:text-gray-300 dark:text-gray-300" />

          </div>

        )}

      </div>



      <div className="flex-1 overflow-y-auto p-2">

        <div className="space-y-2">

          {/* Section Favoris */}

          {!collapsed && favoriteModules.size > 0 && (

            <div className="mb-4">

              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wide">

                <Star className="h-3 w-3" />

                Favoris

              </div>

              <div className="space-y-1">

                {getFavoriteModulesData().map((module) => {

                  if (!module) return null;

                  const IconComponent = MODULE_ICONS[module.key] || FileText;

                  const canAccess = canAccessModule(module.id);

                  

                  return (

                    <motion.div

                      key={module.key}

                      whileHover={{ x: 2 }}

                      whileTap={{ scale: 0.98 }}

                    >

                      <Link

                        to={canAccess ? module.path : '#'}

                        className={cn(

                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",

                          isActive(module.path)

                            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"

                            : canAccess

                            ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"

                            : "text-gray-400 dark:text-gray-600 cursor-not-allowed"

                        )}

                      >

                        <IconComponent className="h-4 w-4 flex-shrink-0" />

                        <span className="flex-1 truncate">{module.name}</span>

                        {!canAccess && <Crown className="h-3 w-3 text-amber-500" />}

                      </Link>

                    </motion.div>

                  );

                })}

              </div>

            </div>

          )}



          {/* Section Récents */}

          {!collapsed && recentModules.length > 0 && (

            <div className="mb-4">

              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wide">

                <Clock className="h-3 w-3" />

                Récents

              </div>

              <div className="space-y-1">

                {getRecentModulesData().map((module) => {

                  if (!module) return null;

                  const IconComponent = MODULE_ICONS[module.key] || FileText;

                  const canAccess = canAccessModule(module.id);

                  

                  return (

                    <motion.div

                      key={module.key}

                      whileHover={{ x: 2 }}

                      whileTap={{ scale: 0.98 }}

                    >

                      <Link

                        to={canAccess ? module.path : '#'}

                        className={cn(

                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",

                          isActive(module.path)

                            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"

                            : canAccess

                            ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"

                            : "text-gray-400 dark:text-gray-600 cursor-not-allowed"

                        )}

                      >

                        <IconComponent className="h-4 w-4 flex-shrink-0" />

                        <span className="flex-1 truncate">{module.name}</span>

                      </Link>

                    </motion.div>

                  );

                })}

              </div>

            </div>

          )}



          {/* Catégories principales */}

          {Object.entries(MODULE_CATEGORIES).map(([categoryKey, category]) => {

            const categoryModules = getModulesByCategory(category.modules);

            if (categoryModules.length === 0) return null;

            

            const isExpanded = expandedCategories.has(categoryKey);

            const CategoryIcon = category.icon;

            

            return (

              <div key={categoryKey} className="mb-2">

                {/* En-tête de catégorie */}

                <Button

                  variant="ghost"

                  size="sm"

                  onClick={() => toggleCategory(categoryKey)}

                  className={cn(

                    "w-full justify-between p-2 h-8 text-xs font-semibold",

                    "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"

                  )}

                >

                  <div className="flex items-center gap-2">

                    <CategoryIcon className="h-4 w-4" />

                    {!collapsed && (

                      <>

                        <span>{category.label}</span>

                        <Badge variant="secondary" className="text-xs px-1.5 py-0">

                          {categoryModules.length}

                        </Badge>

                      </>

                    )}

                  </div>

                  {!collapsed && (

                    <motion.div

                      animate={{ rotate: isExpanded ? 90 : 0 }}

                      transition={{ duration: 0.2 }}

                    >

                      <ChevronRight className="h-3 w-3" />

                    </motion.div>

                  )}

                </Button>



                {/* Modules de la catégorie */}

                <AnimatePresence>

                  {(isExpanded || collapsed) && (

                    <motion.div

                      initial={collapsed ? {} : { height: 0, opacity: 0 }}

                      animate={collapsed ? {} : { height: "auto", opacity: 1 }}

                      exit={collapsed ? {} : { height: 0, opacity: 0 }}

                      transition={{ duration: 0.2 }}

                      className="space-y-1 ml-2"

                    >

                      {categoryModules.map((module) => {

                        const IconComponent = MODULE_ICONS[module.key] || FileText;

                        const canAccess = canAccessModule(module.id);

                        const isFavorite = favoriteModules.has(module.key);

                        

                        return (

                          <motion.div

                            key={module.key}

                            whileHover={{ x: 2 }}

                            whileTap={{ scale: 0.98 }}

                            className="relative group"

                          >

                            <Link

                              to={canAccess ? module.path : '#'}

                              className={cn(

                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",

                                isActive(module.path)

                                  ? `bg-${category.color}-100 dark:bg-${category.color}-900/50 text-${category.color}-700 dark:text-${category.color}-300 shadow-sm`

                                  : canAccess

                                  ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"

                                  : "text-gray-400 dark:text-gray-600 cursor-not-allowed"

                              )}

                            >

                              <IconComponent className="h-4 w-4 flex-shrink-0" />

                              {!collapsed && (

                                <>

                                  <span className="flex-1 truncate">{module.name}</span>

                                  <div className="flex items-center gap-1">

                                    {!canAccess && <Crown className="h-3 w-3 text-amber-500" />}

                                    {isActive(module.path) && (

                                      <div className="w-2 h-2 bg-current rounded-full" />

                                    )}

                                  </div>

                                </>

                              )}

                            </Link>

                            

                            {/* Bouton favori au hover */}

                            {!collapsed && (

                              <Button

                                variant="ghost"

                                size="icon"

                                onClick={(e) => {

                                  e.preventDefault();

                                  toggleFavorite(module.key);

                                }}

                                className={cn(

                                  "absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity",

                                  isFavorite && "opacity-100"

                                )}

                              >

                                <Star className={cn(

                                  "h-3 w-3",

                                  isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"

                                )} />

                              </Button>

                            )}

                          </motion.div>

                        );

                      })}

                    </motion.div>

                  )}

                </AnimatePresence>

              </div>

            );

          })}

        </div>

      </div>



      {/* Footer avec raccourcis */}

      {!collapsed && (

        <div className="p-3 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">

          <Button asChild className="w-full mb-2">

            <Link to={subscription ? "/settings?tab=subscription" : "/pricing"}>

              Gérer l'abonnement

            </Link>

          </Button>

          

          

          <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-300 space-y-1">

            <div className="flex items-center gap-2">

              <Zap className="h-3 w-3" />

              <span>Raccourcis clavier</span>

            </div>

            <div className="text-xs opacity-75">

              Ctrl+Shift+D → Dashboard

            </div>

          </div>

        </div>

      )}

    </motion.aside>

  );

}
