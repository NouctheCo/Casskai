import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlayCircle, BookOpen, Database } from 'lucide-react';
import { useProductTour } from '@/hooks/useProductTour';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export const WelcomeTourBanner: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { startTour, hasCompletedTour } = useProductTour();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Vérifier si l'utilisateur vient de terminer l'onboarding
    const isFromOnboarding = location.search.includes('tour=start');

    // Vérifier si le banner a déjà été fermé
    const wasDismissed = localStorage.getItem(`tour-banner-dismissed-${user.id}`);

    // Afficher le banner si:
    // - L'utilisateur vient de l'onboarding OU
    // - Il n'a pas encore fait le tour ET n'a pas fermé le banner
    if (isFromOnboarding || (!hasCompletedTour && !wasDismissed)) {
      setIsVisible(true);

      // Si on vient de l'onboarding, démarrer automatiquement le tour après un délai
      if (isFromOnboarding) {
        setTimeout(() => {
          startTour('dashboard');
          setIsVisible(false);
        }, 2000);
      }
    }
  }, [user?.id, location.search, hasCompletedTour, startTour]);

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

  if (!isVisible || isDismissed || hasCompletedTour) {
    return null;
  }

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
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4">
            {/* Icône */}
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                🎉 Bienvenue dans CassKai !
              </h3>
              <p className="text-blue-100 mb-4">
                Découvrez toutes les fonctionnalités de votre nouvelle plateforme de gestion
                d'entreprise avec notre guide interactif de 2 minutes.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleStartTour}
                  className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
                >
                  <PlayCircle size={16} />
                  Commencer la visite guidée
                </button>

                <button
                  onClick={() => window.location.href = '/settings/sample-data'}
                  className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-md font-medium hover:bg-white/30 transition-colors"
                >
                  <Database size={16} />
                  Ajouter des données d'exemple
                </button>

                <button
                  onClick={() => window.location.href = '/docs/getting-started'}
                  className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-md font-medium hover:bg-white/20 transition-colors"
                >
                  <BookOpen size={16} />
                  Documentation
                </button>
              </div>
            </div>
          </div>

          {/* Indicateur de progression */}
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-100">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
              <div className="w-2 h-2 bg-white/40 rounded-full"></div>
            </div>
            <span>Étape 1/3 : Découverte de l'interface</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};