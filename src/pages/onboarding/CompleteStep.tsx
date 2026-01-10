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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toastError, toastSuccess } from '@/lib/toast-helpers';
import { 
  CheckCircle,
  Sparkles,
  Rocket,
  Users,
  Settings,
  BarChart3,
  ArrowRight,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { clearUserSession } from '@/utils/sessionCleanup';
import { logger } from '@/lib/logger';
const completionSteps = [
  { id: 'company', label: 'Création de votre entreprise', duration: 1500 },
  { id: 'modules', label: 'Personnalisation des modules', duration: 1200 },
  { id: 'workspace', label: 'Préparation de l\'espace de travail', duration: 1300 },
  { id: 'finalization', label: 'Finalisation du compte', duration: 800 }
];
const nextSteps = [
  {
    icon: BarChart3,
    title: 'Démarrez le guide interactif',
    description: 'Découvrez CassKai avec une visite guidée de 2 minutes',
    action: 'Commencer le tour',
    path: '/dashboard?tour=start'
  },
  {
    icon: Settings,
    title: 'Ajoutez des données d\'exemple',
    description: 'Initialisez votre application avec des données de démonstration',
    action: 'Données d\'exemple',
    path: '/settings/sample-data'
  },
  {
    icon: Users,
    title: 'Invitez votre équipe',
    description: 'Collaborez avec vos collègues',
    action: 'Gestion utilisateurs',
    path: '/settings/users'
  }
];
const CompletionHeader: React.FC<{
  isCompleted: boolean;
  t: (key: string, defaultValue: string) => string;
}> = ({ isCompleted, t }) => (
  <CardHeader className="text-center pb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
    <motion.div
      initial={{ scale: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
      className="mx-auto w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
    >
      {isCompleted ? <CheckCircle className="w-10 h-10 text-white" /> : <Sparkles className="w-10 h-10 text-white animate-pulse" />}
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
      <CardTitle className="text-3xl font-bold gradient-text mb-3">
        {isCompleted ? t('onboarding.complete.welcomeTitle', 'Bienvenue dans CassKai !') : t('onboarding.complete.configuringTitle', 'Configuration en cours...')}
      </CardTitle>
      <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        {isCompleted ? t('onboarding.complete.welcomeSubtitle', 'Votre plateforme est prête ! Vous pouvez maintenant commencer à gérer votre entreprise.') : t('onboarding.complete.configuringSubtitle', 'Nous préparons votre espace de travail personnalisé...')}
      </CardDescription>
    </motion.div>
  </CardHeader>
);
const ProgressSection: React.FC<{
  isProcessing: boolean;
  progressPercentage: number;
  currentStep: number;
  completionSteps: typeof completionSteps;
}> = ({ isProcessing, progressPercentage, currentStep, completionSteps }) => {
  if (!isProcessing) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="mb-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progression : {progressPercentage}%</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{currentStep + 1} / {completionSteps.length}</span>
        </div>
        <Progress value={progressPercentage} className="h-3" />
        <div className="text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">{completionSteps[currentStep]?.label || 'Finalisation...'}</span>
        </div>
      </div>
    </motion.div>
  );
};
const ErrorSection: React.FC<{
  isError: boolean;
  error: string | null;
  processOnboarding: () => void;
  goBackToCompanyStep: () => void;
}> = ({ isError, error, processOnboarding, goBackToCompanyStep }) => {
  if (!isError) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Une erreur est survenue</h3>
      <p className="text-sm text-red-600 dark:text-red-300 mt-2 mb-4 max-w-md mx-auto">{error || "Impossible de finaliser la configuration de votre compte."}</p>
      <div className="flex flex-col gap-3 items-center">
        <Button onClick={processOnboarding}>
          <Loader2 className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={goBackToCompanyStep}
          className="text-xs"
        >
          Revenir à l'étape entreprise
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearUserSession}
          className="text-xs"
        >
          Nettoyer la session et recommencer
        </Button>
      </div>
    </motion.div>
  );
};
const CompletedContent: React.FC<{
  companyData: Record<string, unknown>;
  enabledModulesCount: number;
  nextSteps: typeof nextSteps;
  handleNavigate: (path: string) => void;
}> = ({ companyData, enabledModulesCount, nextSteps, handleNavigate }) => (
  <>
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-6 text-center">Récapitulatif de votre configuration</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Entreprise</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{companyData.name}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center"><Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" /></div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">Modules</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{enabledModulesCount} module{enabledModulesCount > 1 ? 's' : ''} activé{enabledModulesCount > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }} className="mb-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-6 text-center">Prochaines étapes recommandées</h3>
      <div className="grid gap-4">
        {nextSteps.map((step, index) => (
          <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleNavigate(step.path)}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center"><step.icon className="w-5 h-5 text-white" /></div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white text-sm">{step.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">{step.action}<ArrowRight className="w-3 h-3 ml-1" /></Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.5 }} className="text-center">
      <Button onClick={() => handleNavigate('/dashboard')} size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
        <Rocket className="w-5 h-5 mr-2" />
        Commencer avec CassKai
      </Button>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">🎉 Félicitations ! Redirection automatique dans 8 secondes...</p>
    </motion.div>
  </>
);
export default function CompleteStep() {
  const navigate = useNavigate();
  const { state, clearProgress, finalizeOnboarding, goToStep } = useOnboarding();
  const { signOut, user } = useAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'completing' | 'completed' | 'error'>('completing');
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const effectRan = useRef(false);
  const processStepsSequentially = () => {
    let currentIndex = 0;
    const totalSteps = completionSteps.length;
    const processNextStep = () => {
      if (currentIndex < totalSteps) {
        setCurrentStep(currentIndex);
        setProgress(Math.round(((currentIndex + 1) / totalSteps) * 100));
        const step = completionSteps[currentIndex];
        currentIndex++;
        setTimeout(processNextStep, step.duration);
      }
    };
    processNextStep();
  };
  const processOnboarding = useCallback(async () => {
    if (isSubmitting) return; // Prevent duplicate calls
    setIsSubmitting(true);
    setStatus('completing');
    setError(null);
    // Vérifier que les données essentielles sont présentes
    if (!state.data?.companyProfile?.name?.trim()) {
      setError("Le nom de l'entreprise est requis. Veuillez revenir à l'étape précédente pour le saisir.");
      setStatus('error');
      setIsSubmitting(false);
      toastError("Le nom de l'entreprise est requis.");
      return;
    }
    try {
      // Simuler le processus de configuration visuel
      processStepsSequentially();
      // Appel API réel pour sauvegarder les données
      const result = await finalizeOnboarding();
      if (!result.success) {
        throw new Error(result.error || 'Une erreur inattendue est survenue lors de la finalisation.');
      }
      setStatus('completed');
      setProgress(100);
      toastSuccess("Votre entreprise a été configurée avec succès dans CassKai.");
      // ============================================
      // CONFIGURATION FINALE DES MODULES
      // ============================================
      const baseModules = ['dashboard', 'settings', 'users', 'security'];
      const selectedModules = state.data?.selectedModules || [];
      const enabledModules = Array.from(new Set([...baseModules, ...selectedModules]));
      logger.debug('CompleteStep', '🔧 Configuration finale des modules:', {
        baseModules,
        selectedModules,
        enabledModules,
        total: enabledModules.length
      });
      if (typeof window !== 'undefined') {
        const modulesRecord = enabledModules.reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>);
        // Sauvegarder dans localStorage avec les deux clés pour compatibilité
        localStorage.setItem('casskai_modules', JSON.stringify(modulesRecord));
        localStorage.setItem('casskai-module-states', JSON.stringify(modulesRecord));
        // Déclencher l'événement pour synchroniser avec le contexte des modules
        window.dispatchEvent(new CustomEvent('module-state-changed', {
          detail: {
            allStates: modulesRecord
          }
        }));
        logger.debug('CompleteStep', '✅ Modules sauvegardés dans localStorage:', modulesRecord);
      }
      clearProgress();
      // Force a clean reload to the dashboard to ensure all contexts are updated
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      logger.error('CompleteStep', '❌ Finalization error:', err);
      let userMessage = 'Une erreur est survenue lors de la finalisation.';
      let shouldRetry = true;
      if (err instanceof Error) {
        const errMsg = err.message.toLowerCase();
        if (errMsg.includes('duplicate_company') || errMsg.includes('already has a company')) {
          userMessage = '✅ Votre compte existe déjà ! Redirection vers le tableau de bord...';
          shouldRetry = false;
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
          setError(userMessage);
          return;
        } else if (errMsg.includes('pgrst301') || errMsg.includes('403') || errMsg.includes('forbidden')) {
          userMessage = '❌ Erreur de configuration serveur. Notre équipe technique a été notifiée. Veuillez réessayer dans quelques instants ou nous contacter si le problème persiste.';
        } else if (errMsg.includes('42501') || errMsg.includes('permission')) {
          userMessage = '❌ Erreur de permissions. Veuillez vous déconnecter, puis vous reconnecter et réessayer.';
        } else if (errMsg.includes('timeout') || errMsg.includes('network')) {
          userMessage = '❌ Problème de connexion. Vérifiez votre connexion internet et réessayez.';
        } else if (errMsg.includes('rpc error')) {
          userMessage = `❌ Erreur lors de la création de l'entreprise : ${err.message}`;
        } else {
          userMessage = `❌ Une erreur inattendue s'est produite : ${err.message}`;
        }
      }
      setStatus('error');
      setError(userMessage);
      setProgress(0);
      logger.error('CompleteStep', 'Finalization failed with details:', {
        error: err,
        userId: user?.id ?? 'unknown',
        shouldRetry,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      toastError(userMessage);
      if (!shouldRetry) {
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [state.data?.companyProfile?.name, finalizeOnboarding, clearProgress, navigate, signOut, isSubmitting]);
  useEffect(() => {
    // This check with useRef prevents the effect from running twice in development due to React's StrictMode.
    if (effectRan.current === false) {
      processOnboarding();
      return () => {
        effectRan.current = true;
      };
    }
  }, []);
  const handleNavigate = (path: string) => {
    if (status === 'completed') {
      navigate(path, { replace: true });
    }
  };
  const goBackToCompanyStep = useCallback(() => {
    goToStep('company');
    navigate('/onboarding', { replace: true });
  }, [goToStep, navigate]);
  const calculateProgressPercentage = (status: string, currentStep: number, totalSteps: number) =>
    status === 'completed' ? 100 : Math.round(((currentStep + 1) / totalSteps) * 100);
  const enabledModulesCount = (state.data?.selectedModules || []).length;
  const progressPercentage = progress > 0 ? progress : calculateProgressPercentage(status, currentStep, completionSteps.length);
  const isProcessing = status === 'completing';
  const isCompleted = status === 'completed';
  const isError = status === 'error';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="glass-card overflow-hidden">
        <CompletionHeader isCompleted={isCompleted} t={t} />
        <CardContent className="p-8">
          <ProgressSection 
            isProcessing={isProcessing} 
            progressPercentage={progressPercentage} 
            currentStep={currentStep} 
            completionSteps={completionSteps} 
          />
          <ErrorSection 
            isError={isError} 
            error={error} 
            processOnboarding={processOnboarding} 
            goBackToCompanyStep={goBackToCompanyStep}
          />
          {isCompleted && (
            <CompletedContent 
              companyData={state.data?.companyProfile as Record<string, unknown> || {}} 
              enabledModulesCount={enabledModulesCount} 
              nextSteps={nextSteps} 
              handleNavigate={handleNavigate} 
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}