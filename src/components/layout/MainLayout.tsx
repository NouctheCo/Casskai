import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/contexts/AuthContext';
import { useModules } from '@/contexts/ModulesContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import CompanySelector from '@/components/auth/CompanySelector';
import { useLocale } from '@/contexts/LocaleContext';

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
  const [isSidebarStoredCollapsed, setIsSidebarStoredCollapsed] = useLocalStorage('sidebarCollapsed', false);
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { user, loading: authLoading, currentEnterpriseId, userCompanies, setActiveEnterprise } = useAuth();
  const { loadingModules } = useModules();
  const { t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();

  const [showCompanySelector, setShowCompanySelector] = useState(false);

  const isSidebarEffectivelyCollapsed = isMobile ? false : isSidebarStoredCollapsed;
  const trulyLoading = authLoading || loadingModules;

  useEffect(() => {
    if (!trulyLoading && !user) {
      navigate('/auth', { replace: true });
    } else if (!trulyLoading && user && !currentEnterpriseId) {
      setShowCompanySelector(true);
    } else if (currentEnterpriseId) {
      setShowCompanySelector(false);
    }
  }, [user, trulyLoading, navigate, currentEnterpriseId]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarStoredCollapsed(!isSidebarStoredCollapsed);
    }
  };

  // Close mobile sidebar when clicking backdrop
  const handleBackdropClick = () => {
    if (isMobile && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  };

  const handleCompanySelected = (companyId) => {
    if (typeof setActiveEnterprise === 'function') {
      setActiveEnterprise(companyId);
    }
    setShowCompanySelector(false);
  };

  if (trulyLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (showCompanySelector) {
    return <CompanySelector onCompanySelected={handleCompanySelected} />;
  }

  if (!currentEnterpriseId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-center text-muted-foreground">
        <div>
          <p className="text-lg font-semibold mb-2">{t('mainlayout.aucune_entreprise_slectionne', { defaultValue: 'Aucune entreprise sélectionnée' })}</p>
          <p className="text-sm">{t('mainlayout.veuillez_slectionner_une_entreprise_pour_continuer', { defaultValue: 'Veuillez sélectionner une entreprise pour continuer.' })}</p>
        </div>
      </div>
    );
  }

  // Calculer la largeur du sidebar pour le décalage
  const sidebarWidth = isMobile ? 0 : (isSidebarEffectivelyCollapsed ? 72 : 256); // 4.5rem = 72px, 16rem = 256px

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Dark backdrop for mobile sidebar */}
      <AnimatePresence>
        {isMobile && isMobileSidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarEffectivelyCollapsed}
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* Main content wrapper */}
      <div
        className="flex-1 flex flex-col"
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarWidth}px`,
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`
        }}
      >
        {/* Header */}
        <Header
          toggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarEffectivelyCollapsed}
          isMobile={isMobile}
        />
        
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}