import { useCallback, useEffect, useMemo, useState } from 'react';
import Joyride, { STATUS, EVENTS, type CallBackProps, type Step } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
interface OnboardingTourProps {
  isNewAccount: boolean;
  companyName: string;
}
type TourWindow = Window & typeof globalThis & {
  restartOnboardingTour?: () => void;
};
const buildTourSteps = (t: TFunction, companyName: string): Step[] => [
  {
    target: 'body',
    content: (
      <div className="space-y-6 p-2">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 mb-2">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Bienvenue sur CassKai !
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-200">
            La plateforme tout-en-un pour piloter <strong className="text-purple-600 dark:text-purple-400">{companyName}</strong>
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {[
            { icon: '💼', text: 'Comptabilité complète et conforme' },
            { icon: '📄', text: 'Facturation et devis professionnels' },
            { icon: '🎯', text: 'CRM et gestion commerciale' },
            { icon: '🚀', text: 'Gestion de projets et ressources' },
            { icon: '📊', text: 'Analyses IA en temps réel' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.text}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-2xl">⏱️</span>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ce guide prend 3 minutes</p>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-5 p-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🧭</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Navigation principale</h3>
        </div>
        <p className="text-gray-700 dark:text-gray-200">Accédez à tous vos modules depuis le menu latéral</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '📊', name: 'Tableau de bord', desc: 'Vue d\'ensemble' },
            { icon: '💼', name: 'Comptabilité', desc: 'Grand livre & plan' },
            { icon: '📄', name: 'Facturation', desc: 'Factures & devis' },
            { icon: '🎯', name: 'CRM', desc: 'Clients & opportunités' },
            { icon: '🚀', name: 'Projets', desc: 'Temps & tâches' },
            { icon: '👔', name: 'RH', desc: 'Employés & congés' }
          ].map((module, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-750 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-xl mb-1">{module.icon}</div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white">{module.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{module.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <span className="text-xl">💡</span>
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Utilisez <kbd className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Ctrl+K</kbd> pour la recherche rapide</span>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
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
            { icon: '💰', label: 'Chiffre d\'affaires', color: 'from-green-500 to-emerald-500' },
            { icon: '📈', label: 'Marge bénéficiaire', color: 'from-blue-500 to-cyan-500' },
            { icon: '🏦', label: 'Trésorerie', color: 'from-purple-500 to-pink-500' },
            { icon: '⏰', label: 'Factures en attente', color: 'from-orange-500 to-red-500' },
            { icon: '🧠', label: 'Analyses IA', color: 'from-violet-500 to-purple-500' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                <span className="text-sm">{item.icon}</span>
              </div>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-900 dark:text-blue-100">✨ Données synchronisées automatiquement depuis votre comptabilité</p>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-5 p-2">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 shadow-lg">
            <span className="text-3xl">🧠</span>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Intelligence Artificielle
          </h3>
        </div>
        <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-rose-900/40 border-2 border-purple-300 dark:border-purple-600">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎉</span>
              <span className="font-bold text-purple-900 dark:text-white">NOUVEAUTÉ : Analyses IA intégrées !</span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-100">
              CassKai intègre une intelligence artificielle de pointe pour analyser automatiquement vos rapports financiers.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-xl">✨</span>
            Ce que l'IA fait pour vous
          </p>
          {[
            { icon: '📊', text: '7 rapports enrichis', sub: 'KPI, trésorerie, créances...' },
            { icon: '📝', text: 'Synthèses exécutives', sub: 'En langage clair' },
            { icon: '⚠️', text: 'Détection des risques', sub: 'Alertes proactives' },
            { icon: '💡', text: 'Recommandations d\'expert', sub: 'Plans d\'action' },
            { icon: '⏰', text: 'Disponible 24/7', sub: 'Sans surcoût' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900 dark:text-white">{item.text}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📍</span>
            <div>
              <p className="font-bold mb-1">Où trouver les analyses IA ?</p>
              <p className="text-sm opacity-95">Module <strong>Rapports</strong> → Générez un rapport → L'IA crée automatiquement une synthèse en première page</p>
            </div>
          </div>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-5 p-2">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Modules essentiels</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Explorez les fonctionnalités principales de CassKai</p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              icon: '📄',
              title: 'Facturation',
              color: 'from-blue-500 to-cyan-500',
              features: ['Factures & devis', 'Relances auto', 'PDF personnalisés', 'Multidevises']
            },
            {
              icon: '💼',
              title: 'Comptabilité',
              color: 'from-emerald-500 to-teal-500',
              features: ['Plan comptable', 'Écritures auto', 'Grand livre', 'Rapports fiscaux']
            },
            {
              icon: '🎯',
              title: 'CRM',
              color: 'from-purple-500 to-pink-500',
              features: ['Prospects', 'Pipeline de vente', 'Activités', 'Reporting']
            },
            {
              icon: '🚀',
              title: 'Projets',
              color: 'from-orange-500 to-red-500',
              features: ['Kanban & Gantt', 'Timetracking', 'Budgets', 'Facturation']
            },
            {
              icon: '👔',
              title: 'RH',
              color: 'from-indigo-500 to-purple-500',
              features: ['Employés', 'Congés', 'Notes de frais', 'Évaluations']
            }
          ].map((module, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xl">{module.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">{module.title}</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {module.features.map((feat, fidx) => (
                      <span key={fidx} className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            <span className="text-base mr-1">➕</span>
            <strong>Et aussi:</strong> Banque, Achats, Inventaire, Contrats, Prévisions, Rapports...
          </p>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  },
  {
    target: 'body',
    content: (
      <div className="space-y-6 p-2">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 shadow-lg">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Vous êtes prêt !
          </h2>
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
          ].map((step, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                {idx + 1}
              </div>
              <span className="text-xl flex-shrink-0">{step.icon}</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{step.text}</span>
            </div>
          ))}
        </div>
        <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-rose-900/40 border-2 border-purple-300 dark:border-purple-600">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="relative flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🌟</span>
            <div>
              <p className="font-bold text-purple-900 dark:text-white mb-1">N'oubliez pas !</p>
              <p className="text-sm text-gray-800 dark:text-gray-100">L'intelligence artificielle analyse automatiquement tous vos rapports. Aucune configuration nécessaire !</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💡</span>
            <div className="space-y-2">
              <p className="font-bold">Besoin d'aide ?</p>
              <div className="space-y-1 text-sm opacity-95">
                <p>• Documentation dans Paramètres → Aide</p>
                <p>• Email: support@casskai.com</p>
                <p>• Relancez ce guide depuis Paramètres</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true
  }
];
export function OnboardingTour({ isNewAccount, companyName }: OnboardingTourProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const storageKey = useMemo(() => `onboarding_tour_completed_${user?.id ?? 'anonymous'}`, [user?.id]);
  const steps = useMemo(() => buildTourSteps(t, companyName), [t, companyName]);
  useEffect(() => {
    // Vérifier si le tour est déjà complété
    const hasCompletedTour = localStorage.getItem(storageKey);
    // Vérifier si l'URL demande explicitement le tour (pour relancer)
    const urlParams = new URLSearchParams(window.location.search);
    const forceTour = urlParams.get('tour') === 'start' || urlParams.get('tour') === 'true';
    if (forceTour) {
      // Forcer le redémarrage du tour
      localStorage.removeItem(storageKey);
      setStepIndex(0);
      const timeoutId = window.setTimeout(() => setRun(true), 500);
      // Nettoyer l'URL après avoir lancé le tour
      window.history.replaceState({}, '', window.location.pathname);
      return () => window.clearTimeout(timeoutId);
    }
    if (isNewAccount && !hasCompletedTour) {
      // Nouveau compte et tour pas encore fait
      const timeoutId = window.setTimeout(() => setRun(true), 1000);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [isNewAccount, storageKey]);
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;
    logger.debug('OnboardingTour', '[OnboardingTour] Callback:', { status, type, index });
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(storageKey, 'true');
      setRun(false);
      return;
    }
    // Gérer target non trouvé - passer à l'étape suivante
    if (type === EVENTS.TARGET_NOT_FOUND) {
      logger.warn('OnboardingTour', '[OnboardingTour] Target not found, skipping to next step');
      setStepIndex(index + 1);
      return;
    }
    // Gérer STEP_AFTER (bouton Next ou Last cliqué)
    if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + 1);
    }
    // Gérer STEP_BEFORE (bouton Back cliqué)
    // L'index fourni par Joyride est déjà celui de l'étape précédente
    if (type === EVENTS.STEP_BEFORE) {
      setStepIndex(index);
    }
  };
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
          padding: 24,
          maxWidth: 520,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        },
        tooltipContent: {
          padding: 0
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