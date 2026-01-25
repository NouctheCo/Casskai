import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Joyride, { STATUS, EVENTS, type CallBackProps, type Step } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { useLocation } from 'react-router-dom';
interface OnboardingTourProps {
  isNewAccount: boolean;
  companyName: string;
}
type TourWindow = Window & typeof globalThis & {
  restartOnboardingTour?: () => void;
};
// Small wrapper to make long step content scrollable while keeping Joyride footer visible
const StepScrollArea = ({ children }: { children: React.ReactNode }) => (
  <div className="max-h-[65vh] overflow-y-auto pr-2">{children}</div>
);
const buildTourSteps = (t: TFunction, companyName: string): Step[] => {
  const features = [
    { icon: '💼', text: 'Comptabilité complète et conforme' },
    { icon: '📄', text: 'Facturation et devis professionnels' },
    { icon: '🎯', text: 'CRM et gestion commerciale' },
    { icon: '🚀', text: 'Gestion de projets et ressources' },
    { icon: '📊', text: 'Analyses IA en temps réel' }
  ];

  const modules = [
    { icon: '📄', title: 'Facturation', features: ['Factures & devis', 'Relances auto', 'PDF personnalisés', 'Multidevises'] },
    { icon: '💼', title: 'Comptabilité', features: ['Plan comptable', 'Écritures auto', 'Grand livre', 'Rapports fiscaux'] },
    { icon: '🎯', title: 'CRM', features: ['Prospects', 'Pipeline de vente', 'Activités', 'Reporting'] },
    { icon: '🚀', title: 'Projets', features: ['Kanban & Gantt', 'Timetracking', 'Budgets', 'Facturation'] },
    { icon: '👔', title: 'RH', features: ['Employés', 'Congés', 'Notes de frais', 'Évaluations'] }
  ];

  return [
    {
      target: 'body',
      content: (
        <StepScrollArea>
          <div className="space-y-6 p-2">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 mb-2">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Bienvenue sur CassKai !</h2>
              <p className="text-lg text-gray-700 dark:text-gray-200">La plateforme tout-en-un pour piloter <strong className="text-purple-600 dark:text-purple-400">{companyName}</strong></p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                  <span className="text-2xl flex-shrink-0">{f.icon}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{f.text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-2xl">⏱️</span>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ce guide prend 3 minutes</p>
            </div>
          </div>
        </StepScrollArea>
      ),
      placement: 'center',
      disableBeacon: true
    },

    {
      target: 'body',
      content: (
        <StepScrollArea>
          <div className="space-y-5 p-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🧭</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Navigation principale</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-200">Accédez à tous vos modules depuis le menu latéral</p>

            <div className="grid grid-cols-2 gap-3">
              {modules.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="text-xl mb-1">{m.icon}</div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">{m.title}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <span className="text-xl">💡</span>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Utilisez <kbd className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Ctrl+K</kbd> pour la recherche rapide</span>
            </div>
          </div>
        </StepScrollArea>
      ),
      placement: 'center',
      disableBeacon: true
    },

    {
      target: 'body',
      content: (
        <StepScrollArea>
          <div className="space-y-5 p-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-200">Visualisez en temps réel les indicateurs clés de votre entreprise</p>

            <div className="space-y-2">
              {[
                { icon: '💰', label: "Chiffre d'affaires" },
                { icon: '📈', label: 'Marge bénéficiaire' },
                { icon: '🏦', label: 'Trésorerie' },
                { icon: '⏰', label: 'Factures en attente' },
                { icon: '🧠', label: 'Analyses IA' }
              ].map((it, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">{it.icon}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{it.label}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-900 dark:text-blue-100">✨ Données synchronisées automatiquement depuis votre comptabilité</p>
            </div>
          </div>
        </StepScrollArea>
      ),
      placement: 'center',
      disableBeacon: true
    },

    {
      target: 'body',
      content: (
        <StepScrollArea>
          <div className="space-y-5 p-2">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 shadow-lg">
                <span className="text-3xl">🧠</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Intelligence Artificielle</h3>
            </div>

            <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-rose-900/40 border-2 border-purple-300 dark:border-purple-600">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🎉</span>
                  <span className="font-bold text-purple-900 dark:text-white">NOUVEAUTÉ : Analyses IA intégrées !</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-100">CassKai intègre une intelligence artificielle de pointe pour analyser automatiquement vos rapports financiers.</p>
              </div>
            </div>
          </div>
        </StepScrollArea>
      ),
      placement: 'center',
      disableBeacon: true
    },

    {
      target: 'body',
      content: (
        <StepScrollArea>
          <div className="space-y-6 p-2">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 shadow-lg">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Vous êtes prêt !</h2>
              <p className="text-gray-700 dark:text-gray-200">Commencez à utiliser CassKai dès maintenant</p>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-gray-900 dark:text-white">🚀 Prochaines étapes</p>
              {[
                { icon: '⚙️', text: 'Compléter les paramètres de votre entreprise' },
                { icon: '👥', text: 'Importer vos clients et fournisseurs' },
                { icon: '📄', text: 'Créer votre première facture ou devis' },
                { icon: '📊', text: 'Explorer le tableau de bord' },
                { icon: '🧠', text: 'Générer un rapport avec analyse IA' }
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">{i + 1}</div>
                  <span className="text-xl flex-shrink-0">{s.icon}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        </StepScrollArea>
      ),
      placement: 'center',
      disableBeacon: true
    }
  ];
};
export function OnboardingTour({ isNewAccount, companyName }: OnboardingTourProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const isUpdatingRef = useRef(false);
  const storageKey = useMemo(() => `onboarding_tour_completed_${user?.id ?? 'anonymous'}`, [user?.id]);
  const steps = useMemo(() => buildTourSteps(t, companyName), [t, companyName]);

  // Écouter les changements de location pour détecter tour=start
  useEffect(() => {
    // Vérifier si le tour est déjà complété
    const hasCompletedTour = localStorage.getItem(storageKey);
    // Vérifier si l'URL demande explicitement le tour (pour relancer)
    const urlParams = new URLSearchParams(location.search);
    const forceTour = urlParams.get('tour') === 'start' || urlParams.get('tour') === 'true';

    logger.debug('OnboardingTour', '[OnboardingTour] Init:', {
      forceTour,
      hasCompletedTour,
      isNewAccount,
      url: window.location.href
    });

    if (forceTour) {
      // Forcer le redémarrage du tour
      logger.info('OnboardingTour', '[OnboardingTour] Force restart tour from URL parameter');
      localStorage.removeItem(storageKey);
      setStepIndex(0);
      setRun(false); // Reset d'abord
      const timeoutId = window.setTimeout(() => {
        setRun(true);
        // Nettoyer l'URL après avoir lancé le tour
        window.history.replaceState({}, '', window.location.pathname);
      }, 500);
      return () => window.clearTimeout(timeoutId);
    }
    if (isNewAccount && !hasCompletedTour) {
      // Nouveau compte et tour pas encore fait
      logger.info('OnboardingTour', '[OnboardingTour] Starting tour for new account');
      const timeoutId = window.setTimeout(() => setRun(true), 1000);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [isNewAccount, storageKey, location.search]);
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;

    // Éviter les mises à jour multiples
    if (isUpdatingRef.current) {
      return;
    }

    logger.debug('OnboardingTour', '[OnboardingTour] Callback:', {
      status,
      type,
      index,
      action
    });

    // Gérer la fin du tour
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(storageKey, 'true');
      setRun(false);
      return;
    }

    // Gérer target non trouvé - passer à l'étape suivante
    if (type === EVENTS.TARGET_NOT_FOUND) {
      logger.warn('OnboardingTour', '[OnboardingTour] Target not found, skipping to next step');
      isUpdatingRef.current = true;
      setStepIndex(index + 1);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
      return;
    }

    // Gérer la navigation (Next/Back) — use `action` to detect prev/next reliably
    if (type === EVENTS.STEP_AFTER || type === EVENTS.STEP_BEFORE) {
      logger.debug('OnboardingTour', `[OnboardingTour] ${type} - moving to index ${index} action=${action}`);
      isUpdatingRef.current = true;
      if (action === 'prev') {
        // Move back one step (guard at 0)
        setStepIndex(Math.max(0, index - 1));
      } else {
        // Default: advance to next step
        setStepIndex(index + 1);
      }
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [storageKey]);
  const restartTour = useCallback(() => {
    localStorage.removeItem(storageKey);
    setStepIndex(0);
    setRun(true);
  }, [storageKey]);
  useEffect(() => {
    const tourWindow = window as TourWindow;
    tourWindow.restartOnboardingTour = restartTour;
    return () => {
      delete tourWindow.restartOnboardingTour;
    };
  }, [restartTour]);
  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#8b5cf6',
          backgroundColor: 'hsl(var(--popover))',
          textColor: 'hsl(var(--popover-foreground))',
          arrowColor: 'hsl(var(--popover))',
          zIndex: 10000,
          overlayColor: 'rgba(0, 0, 0, 0.5)'
        },
        tooltip: {
          backgroundColor: 'hsl(var(--popover))',
          color: 'hsl(var(--popover-foreground))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 16,
          fontSize: 14,
          padding: 16,
          maxWidth: 560,
          width: 'min(92vw, 560px)',
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        },
        tooltipContent: {
          padding: 0,
          paddingBottom: '0.75rem',
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: '1 1 auto',
          minHeight: 0,
          WebkitOverflowScrolling: 'touch'
        },
        tooltipFooter: {
          background: 'inherit',
          paddingTop: '0.75rem',
          marginTop: 0,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          flex: '0 0 auto',
          flexShrink: 0
        },
        buttonNext: {
          backgroundColor: '#8b5cf6',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
          boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: 8,
          fontSize: 14,
          fontWeight: 500
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: 13,
          fontWeight: 500
        },
        buttonClose: {
          color: 'hsl(var(--muted-foreground))'
        }
      }}
      locale={{
        back: t('tour.back'),
        close: t('tour.close'),
        last: t('tour.last'),
        next: t('tour.next'),
        skip: t('tour.skip')
      }}
    />
  );
}