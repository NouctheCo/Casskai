import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlayCircle, BookOpen, Database, CheckCircle2 } from 'lucide-react';
import { useProductTour } from '@/hooks/useProductTour';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export const WelcomeTourBanner: React.FC = () => {
  const { user, currentCompany, onboardingCompleted } = useAuth();
  const location = useLocation();
  const { startTour, hasCompletedTour } = useProductTour();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [onboardingSteps, setOnboardingSteps] = useState({ completed: 0, total: 4 });

  // Charger la vraie progression du onboarding depuis la BDD
  useEffect(() => {
    if (!user?.id || !currentCompany?.id) return;

    const loadOnboardingProgress = async () => {
      try {
        // Récupérer l'historique du onboarding
        const { data: history, error } = await supabase
          .from('onboarding_history')
          .select('step_name, completion_status')
          .eq('user_id', user.id)
          .eq('company_id', currentCompany.id)
          .eq('completion_status', 'completed');

        if (error) {
          console.error('Erreur chargement progression onboarding:', error);
          return;
        }

        // Compter les étapes uniques complétées
        const uniqueSteps = new Set(history?.map(h => h.step_name) || []);
        const completedCount = uniqueSteps.size;
        const totalSteps = 4; // welcome, company, modules, preferences (sans 'complete' et 'features')

        setOnboardingSteps({ completed: completedCount, total: totalSteps });
      } catch (err) {
        console.error('Exception chargement progression:', err);
      }
    };

    loadOnboardingProgress();
  }, [user?.id, currentCompany?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // ✅ VÉRIFICATION DOUBLE: BDD + localStorage
    const localOnboardingCompleted = localStorage.getItem(`onboarding_completed_${user.id}`) === 'true';

    console.log('🔍 WelcomeTourBanner - Vérification onboarding:', {
      userId: user.id,
      onboardingCompleted,
      localOnboardingCompleted,
      currentCompany: currentCompany?.name,
      onboarding_completed_at: (currentCompany as any)?.onboarding_completed_at
    });

    // NE PAS afficher si le onboarding est terminé (onboarding_completed_at défini OU flag localStorage)
    if (onboardingCompleted || localOnboardingCompleted) {
      console.log('✅ Onboarding terminé - Banner masqué');
      setIsVisible(false);
      return;
    }

    // Vérifier si l'utilisateur vient de terminer l'onboarding
    const isFromOnboarding = location.search.includes('tour=start');

    // Vérifier si le banner a déjà été fermé
    const wasDismissed = localStorage.getItem(`tour-banner-dismissed-${user.id}`);

    // Afficher le banner si:
    // - L'utilisateur vient de l'onboarding OU
    // - Il n'a pas encore fait le tour ET n'a pas fermé le banner ET onboarding pas terminé
    if (isFromOnboarding || (!hasCompletedTour && !wasDismissed && !onboardingCompleted)) {
      setIsVisible(true);

      // Si on vient de l'onboarding, démarrer automatiquement le tour après un délai
      if (isFromOnboarding && !hasCompletedTour) {
        // Nettoyer l'URL pour éviter de relancer le tour en boucle
        window.history.replaceState({}, '', '/dashboard');

        setTimeout(() => {
          startTour('dashboard');
          setIsVisible(false);
        }, 2000);
      }
    }
  }, [user?.id, location.search, hasCompletedTour, startTour, onboardingCompleted]);

  const handleStartTour = () => {
    startTour('dashboard');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    if (user?.id) {
      localStorage.setItem(`tour-banner-dismissed-${user.id}`, 'true');
    }
  };

  // ✅ VÉRIFICATION FINALE: Ne rien afficher si onboarding terminé
  const localOnboardingCompleted = user?.id ? localStorage.getItem(`onboarding_completed_${user.id}`) === 'true' : false;

  // Ne rien afficher si onboarding terminé (BDD OU localStorage), banner pas visible, ou déjà dismissed
  if (onboardingCompleted || localOnboardingCompleted || !isVisible || isDismissed || hasCompletedTour) {
    return null;
  }

  // Calculer le message selon la progression
  const isOnboardingComplete = onboardingSteps.completed >= onboardingSteps.total;
  const progressPercent = (onboardingSteps.completed / onboardingSteps.total) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.5 }}
        className="mb-6 relative"
      >
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-lg p-6 text-white shadow-lg">
          {/* Bouton de fermeture */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            aria-label="Fermer le bandeau"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4">
            {/* Icône */}
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              {isOnboardingComplete ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <PlayCircle className="w-6 h-6 text-white" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                {isOnboardingComplete ? (
                  '✅ Configuration terminée !'
                ) : (
                  '🎉 Bienvenue dans CassKai !'
                )}
              </h3>
              <p className="text-blue-100 mb-4">
                {isOnboardingComplete ? (
                  `${currentCompany?.name || 'Votre entreprise'} est prêt à démarrer. Découvrez toutes les fonctionnalités avec notre guide interactif.`
                ) : (
                  'Nous préparons votre espace de travail personnalisé...'
                )}
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleStartTour}
                  className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
                >
                  <PlayCircle size={16} />
                  Commencer la visite guidée
                </button>

                <button
                  type="button"
                  onClick={() => window.location.href = '/settings/sample-data'}
                  className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-md font-medium hover:bg-white/30 transition-colors"
                >
                  <Database size={16} />
                  Ajouter des données d'exemple
                </button>

                <button
                  type="button"
                  onClick={() => window.location.href = '/docs/getting-started'}
                  className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-md font-medium hover:bg-white/20 transition-colors"
                >
                  <BookOpen size={16} />
                  Documentation
                </button>
              </div>
            </div>
          </div>

          {/* Indicateur de progression RÉEL */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-blue-100 mb-2">
              <span>
                {isOnboardingComplete ? (
                  'Compte créé avec succès'
                ) : (
                  'Progression de la configuration'
                )}
              </span>
              <span className="font-semibold">
                {onboardingSteps.completed}/{onboardingSteps.total} étapes complétées
              </span>
            </div>

            {/* Barre de progression */}
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
