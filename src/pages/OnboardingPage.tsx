import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { useTranslation } from 'react-i18next';

// Step Components
import WelcomeStep from './onboarding/WelcomeStep';
import FeaturesStep from './onboarding/FeaturesStep';
import PreferencesStep from './onboarding/PreferencesStep';
import CompanyStep from './onboarding/CompanyStep';
import CompleteStep from './onboarding/CompleteStep';

// Steps configuration
const steps = [
  { id: 1, title: 'Bienvenue', description: 'Introduction et présentation', component: WelcomeStep },
  { id: 2, title: 'Fonctionnalités', description: 'Choisissez vos modules', component: FeaturesStep },
  { id: 3, title: 'Préférences', description: 'Configurez vos paramètres', component: PreferencesStep },
  { id: 4, title: 'Entreprise', description: 'Informations de votre société', component: CompanyStep },
  { id: 5, title: 'Finalisation', description: 'Configuration terminée', component: CompleteStep }
];

// Inner component that uses the onboarding context
function OnboardingContent() {
  const { currentStep } = useOnboarding();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Redirect if onboarding is already completed AND company is configured
  useEffect(() => {
    if (user?.user_metadata?.onboarding_completed && user?.user_metadata?.company_id) {
      // User has completed onboarding and has a company - go to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" aria-hidden="true"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('common.loading', { defaultValue: 'Chargement...' })}
          </p>
        </div>
      </div>
    );
  }

  const currentStepConfig = steps.find(s => s.id === currentStep) || steps[0];
  const CurrentStepComponent = currentStepConfig.component;
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Progress Header - Only show for steps 2-4 */}
        {currentStep > 1 && currentStep < 5 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Étape {currentStep - 1} sur {steps.length - 2}</span>
                <span>{Math.round(progressPercentage)}% terminé</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="text-center mt-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentStepConfig.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentStepConfig.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            <CurrentStepComponent key={currentStep} />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Main component with provider
export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
}
