import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ModularSidebarEnhanced from '@/components/layout/ModularSidebarEnhanced';
import { Header } from '@/components/layout/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useModules } from '@/contexts/ModulesContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import { PageTransition } from '@/components/ui/PageTransition';
import TrialExpirationNotice from '@/components/subscription/TrialExpirationNotice';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

export function MainLayout() {
  const [isSidebarStoredCollapsed] = useLocalStorage('sidebarCollapsed', false);
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // const navigate = useNavigate();
  const location = useLocation();
  const { isLoading: modulesLoading } = useModules();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLocale();

  // Pages qui ne nécessitent pas la sidebar
  const publicPages = ['/landing', '/auth', '/login', '/register'];
  const isPublicPage = publicPages.includes(location.pathname);
  const showSidebar = user && !isPublicPage;

  // Fermer la sidebar mobile quand on change de route ou quand on passe en mode desktop
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Gestion du collapse sur desktop
  const [isDesktopCollapsed] = useState(isSidebarStoredCollapsed);

  // Collapse handled via UI; keep hook state only

  // Loading state
  if (modulesLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {t('common.loading', { defaultValue: 'Chargement...' })}
          </span>
        </div>
      </div>
    );
  }

  // Layout pour les pages publiques (sans sidebar)
  if (isPublicPage) {
    return (
  <AnalyticsProvider domain={import.meta.env?.VITE_PLAUSIBLE_DOMAIN || window.location.host} showConsentBanner={true}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </AnalyticsProvider>
    );
  }

  // Layout principal avec sidebar pour les utilisateurs connectés
  return (
  <AnalyticsProvider domain={import.meta.env?.VITE_PLAUSIBLE_DOMAIN || window.location.host} showConsentBanner={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Sidebar Desktop */}
        {showSidebar && (
          <div className={cn(
            "hidden md:block transition-all duration-300",
            isDesktopCollapsed ? "w-16" : "w-64"
          )}>
            <div className={cn(
              "fixed top-0 left-0 h-full z-20 transition-all duration-300",
              isDesktopCollapsed ? "w-16" : "w-64"
            )}>
              <ModularSidebarEnhanced />
            </div>
          </div>
        )}

        {/* Sidebar Mobile */}
        {showSidebar && (
          <AnimatePresence>
            {isMobileSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <motion.div
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  transition={{ duration: 0.3 }}
                  className="w-64 h-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ModularSidebarEnhanced />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {showSidebar && (
            <Header
              onMenuClick={() => setIsMobileSidebarOpen(true)}
              isMobile={isMobile}
              isDesktopSidebarCollapsed={isDesktopCollapsed}
            />
          )}
          
          <main className={cn(
            "main-content flex-1 overflow-y-auto",
            showSidebar ? "bg-gray-50 dark:bg-gray-900" : "",
            showSidebar && !isDesktopCollapsed ? "main-content" : "",
            showSidebar && isDesktopCollapsed ? "main-content-collapsed" : ""
          )}>
            <div className={cn(
              showSidebar ? "page-content container mx-auto px-4 sm:px-6 lg:px-8 py-8" : ""
            )}>
              {/* Notification d'expiration d'essai pour les utilisateurs connectés */}
              {showSidebar && (
                <div className="mb-6">
                  <TrialExpirationNotice />
                </div>
              )}
              
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </main>
        </div>
      </div>
    </AnalyticsProvider>
  );
}