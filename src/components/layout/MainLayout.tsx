/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React, { useState, useEffect, useContext } from 'react';

import { Outlet, useLocation } from 'react-router-dom';

import { Header } from '@/components/layout/Header';

import { useLocalStorage } from '@/hooks/useLocalStorage';

import { useModulesSafe, useModules } from '@/hooks/modules.hooks';

import { useAuth } from '@/contexts/AuthContext';

import { cn } from '@/lib/utils';

import { motion, AnimatePresence } from 'framer-motion';

import { Loader2 } from 'lucide-react';

import { useLocale } from '@/contexts/LocaleContext';

import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';

import { useScrollRestoration } from '@/hooks/useScrollRestoration';

import { PageTransition } from '@/components/ui/PageTransition';

import TrialExpirationNotice from '@/components/subscription/TrialExpirationNotice';

import { NotificationProvider } from '@/components/notifications/NotificationSystem';

import { Sidebar } from '@/components/layout/Sidebar';

import { useContextualTheme } from '@/hooks/useContextualTheme';

import { AIAssistant } from '@/components/ai/AIAssistant';



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

  const isE2EMinimal = (import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_E2E_MINIMAL === 'true';

  

  // Hooks must be called before any conditional returns

  const [isSidebarStoredCollapsed, _setIsSidebarStoredCollapsed] = useLocalStorage('sidebarCollapsed', false);

  const isMobile = useIsMobile();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const location = useLocation();

  const { user, loading: authLoading, onboardingCompleted, currentCompany } = useAuth();

  

  // Activer la restauration du scroll pour améliorer l'UX

  useScrollRestoration();

  const { t } = useLocale();

  const { currentModule } = useContextualTheme();



  const { isLoading: modulesLoading } = useModulesSafe();



  // Pages qui ne nécessitent pas la sidebar

  const publicPages = ['/landing', '/auth', '/login', '/register'];

  const onboardingPages = ['/onboarding'];

  const isPublicPage = publicPages.includes(location.pathname);

  const isOnboardingPage = onboardingPages.some(page => location.pathname.startsWith(page));

  const showSidebar = user && !isPublicPage && !isOnboardingPage;



  // Fermer la sidebar mobile quand on change de route ou quand on passe en mode desktop

  useEffect(() => {

    setIsMobileSidebarOpen(false);

  }, [location.pathname, isMobile]);



  // Gestion du collapse sur desktop

  const [isDesktopCollapsed, _setIsDesktopCollapsed] = useState(isSidebarStoredCollapsed);



  if (isE2EMinimal) {

    return (

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

        <div className="flex-1 flex flex-col overflow-hidden">

          <main className="main-content flex-1 overflow-y-auto">

            <div className="page-content container mx-auto px-4 sm:px-6 lg:px-8 py-8">

              <PageTransition>

                <Outlet />

              </PageTransition>

            </div>

          </main>

        </div>

      </div>

    );

  }



  // Loading state

  if (modulesLoading || authLoading) {

    return (

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">

        <div className="flex items-center space-x-2">

          <img src="/logo.png" alt="CassKai" className="w-16 h-16 animate-pulse" />

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

      <AnalyticsProvider domain="app.casskai.fr" showConsentBanner={true}>

        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">

          <PageTransition>

            <Outlet />

          </PageTransition>

        </div>

      </AnalyticsProvider>

    );

  }



  // Layout principal avec nouvelle sidebar flottante
  return (
    <AnalyticsProvider domain="app.casskai.fr" showConsentBanner={true}>
      <NotificationProvider>
        <div className="flex h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-950" data-module={currentModule}>
          {/* Sidebar Floating Cards - Desktop uniquement */}
          {showSidebar && !isMobile && (
            <Sidebar />
          )}

          {/* Sidebar Mobile - Overlay */}
          {showSidebar && isMobile && (
            <AnimatePresence>
              {isMobileSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 z-50 bg-black bg-opacity-50"
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <motion.div
                    initial={{ x: -300 }}
                    animate={{ x: 0 }}
                    exit={{ x: -300 }}
                    transition={{ duration: 0.3 }}
                    className="w-80 h-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Sidebar />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Main content area avec glassmorphism */}
          <div className="flex-1 flex flex-col m-3 ml-0 overflow-hidden">
            {/* Header avec glassmorphism */}
            {showSidebar && (
              <Header
                onMenuClick={() => setIsMobileSidebarOpen(true)}
                isMobile={isMobile}
                isDesktopSidebarCollapsed={false}
              />
            )}

            {/* Page content avec glassmorphism */}
            <main className="flex-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white/50 dark:border-gray-700/50 overflow-auto mt-3">
              <div className="p-6">
                {/* Notification d'expiration d'essai */}
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

          {/* Assistant IA - Floating button accessible partout */}
          {showSidebar && <AIAssistant />}
        </div>
      </NotificationProvider>
    </AnalyticsProvider>
  );
}
