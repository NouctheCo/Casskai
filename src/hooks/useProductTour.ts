import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TourStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
  module?: string;
}

interface ProductTourState {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  hasCompletedTour: boolean;
}

const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    target: '.dashboard-header',
    title: '🎉 Bienvenue sur CassKai !',
    content: 'Découvrez votre tableau de bord personnalisé avec tous vos indicateurs métier en temps réel.',
    position: 'bottom'
  },
  {
    id: 'widgets',
    target: '.dashboard-widgets',
    title: '📊 Widgets Intelligents',
    content: 'Ajoutez, supprimez et organisez vos widgets selon vos besoins. Cliquez sur "+" pour ajouter un nouveau widget.',
    position: 'top'
  },
  {
    id: 'navigation',
    target: '.sidebar-nav',
    title: '🧭 Navigation',
    content: 'Accédez à tous vos modules depuis cette barre latérale. Comptabilité, facturation, CRM... tout est là !',
    position: 'right'
  },
  {
    id: 'notifications',
    target: '.notifications-bell',
    title: '🔔 Notifications',
    content: 'Restez informé de tous les événements importants : paiements reçus, factures en retard, etc.',
    position: 'bottom'
  },
  {
    id: 'settings',
    target: '.user-menu',
    title: '⚙️ Paramètres',
    content: 'Personnalisez votre expérience : thème, langue, préférences métier et bien plus.',
    position: 'bottom'
  }
];

const ACCOUNTING_TOUR_STEPS: TourStep[] = [
  {
    id: 'chart-of-accounts',
    target: '.chart-of-accounts',
    title: '📋 Plan Comptable',
    content: 'Votre plan comptable adapté aux normes de votre pays (PCG, SYSCOHADA, etc.). Modifiez selon vos besoins.',
    position: 'right'
  },
  {
    id: 'journal-entries',
    target: '.journal-entries',
    title: '✍️ Écritures Comptables',
    content: 'Saisissez vos écritures comptables facilement. L\'équilibrage est automatique !',
    position: 'top'
  },
  {
    id: 'reconciliation',
    target: '.bank-reconciliation',
    title: '🏦 Rapprochement',
    content: 'Rapprochez automatiquement vos relevés bancaires avec vos écritures comptables.',
    position: 'left'
  },
  {
    id: 'reports',
    target: '.financial-reports',
    title: '📈 Rapports',
    content: 'Générez bilan, compte de résultat et tous vos états financiers réglementaires.',
    position: 'top'
  }
];

const INVOICING_TOUR_STEPS: TourStep[] = [
  {
    id: 'create-invoice',
    target: '.create-invoice-btn',
    title: '🧾 Nouvelle Facture',
    content: 'Créez vos factures professionnelles en quelques clics. Modèles personnalisables inclus.',
    position: 'bottom'
  },
  {
    id: 'customer-management',
    target: '.customers-list',
    title: '👥 Gestion Clients',
    content: 'Gérez votre base clients : informations, historique, conditions de paiement...',
    position: 'right'
  },
  {
    id: 'payment-tracking',
    target: '.payments-overview',
    title: '💰 Suivi Paiements',
    content: 'Suivez vos paiements en cours, relancez automatiquement et gérez les impayés.',
    position: 'top'
  }
];

export const useProductTour = () => {
  const { user } = useAuth();
  const [tourState, setTourState] = useState<ProductTourState>({
    isActive: false,
    currentStep: 0,
    steps: [],
    hasCompletedTour: false
  });

  // Charger l'état du tour depuis localStorage
  useEffect(() => {
    if (user?.id) {
      const savedState = localStorage.getItem(`tour-progress-${user.id}`);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setTourState(prev => ({
          ...prev,
          hasCompletedTour: parsed.hasCompletedTour || false
        }));
      }
    }
  }, [user?.id]);

  const startTour = useCallback((module: 'dashboard' | 'accounting' | 'invoicing' | 'crm' = 'dashboard') => {
    let steps: TourStep[] = [];

    switch (module) {
      case 'dashboard':
        steps = DASHBOARD_TOUR_STEPS;
        break;
      case 'accounting':
        steps = ACCOUNTING_TOUR_STEPS;
        break;
      case 'invoicing':
        steps = INVOICING_TOUR_STEPS;
        break;
      default:
        steps = DASHBOARD_TOUR_STEPS;
    }

    setTourState({
      isActive: true,
      currentStep: 0,
      steps,
      hasCompletedTour: false
    });
  }, []);

  const nextStep = useCallback(() => {
    setTourState(prev => {
      const nextStepIndex = prev.currentStep + 1;

      if (nextStepIndex >= prev.steps.length) {
        // Tour terminé
        const newState = {
          ...prev,
          isActive: false,
          currentStep: 0,
          hasCompletedTour: true
        };

        // Sauvegarder l'état
        if (user?.id) {
          localStorage.setItem(`tour-progress-${user.id}`, JSON.stringify({
            hasCompletedTour: true,
            completedAt: new Date().toISOString()
          }));
        }

        return newState;
      }

      return {
        ...prev,
        currentStep: nextStepIndex
      };
    });
  }, [user?.id]);

  const previousStep = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1)
    }));
  }, []);

  const skipTour = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      isActive: false,
      currentStep: 0,
      hasCompletedTour: true
    }));

    // Marquer comme terminé
    if (user?.id) {
      localStorage.setItem(`tour-progress-${user.id}`, JSON.stringify({
        hasCompletedTour: true,
        skippedAt: new Date().toISOString()
      }));
    }
  }, [user?.id]);

  const resetTour = useCallback(() => {
    setTourState({
      isActive: false,
      currentStep: 0,
      steps: [],
      hasCompletedTour: false
    });

    if (user?.id) {
      localStorage.removeItem(`tour-progress-${user.id}`);
    }
  }, [user?.id]);

  const getCurrentStep = useCallback(() => {
    if (!tourState.isActive || tourState.steps.length === 0) return null;
    return tourState.steps[tourState.currentStep];
  }, [tourState]);

  return {
    ...tourState,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    resetTour,
    getCurrentStep,
    progress: tourState.steps.length > 0 ? ((tourState.currentStep + 1) / tourState.steps.length) * 100 : 0
  };
};