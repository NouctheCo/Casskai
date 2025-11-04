import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { useProductTour } from '@/hooks/useProductTour';

interface TourTooltipProps {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
}

const TourTooltip: React.FC<TourTooltipProps> = ({
  target,
  title,
  content,
  position,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onClose
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      const targetElement = document.querySelector(target);
      if (!targetElement || !tooltipRef.current) return;

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - 12;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = targetRect.bottom + 12;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.left - tooltipRect.width - 12;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.right + 12;
          break;
      }

      // S'assurer que le tooltip reste dans la viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < 12) left = 12;
      if (left + tooltipRect.width > viewportWidth - 12) left = viewportWidth - tooltipRect.width - 12;
      if (top < 12) top = 12;
      if (top + tooltipRect.height > viewportHeight - 12) top = viewportHeight - tooltipRect.height - 12;

      setTooltipPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [target, position]);

  useEffect(() => {
    // Surligner l'élément cible
    const targetElement = document.querySelector(target);
    if (targetElement) {
      targetElement.classList.add('tour-highlight');
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      if (targetElement) {
        targetElement.classList.remove('tour-highlight');
      }
    };
  }, [target]);

  return (
    <>
      {/* Overlay semi-transparent */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999]" onClick={onClose} />

      {/* Tooltip */}
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed z-[10000] bg-white rounded-lg shadow-2xl border max-w-sm min-w-[300px]"
        style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-4">
          <p className="text-gray-600 mb-4">{content}</p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onPrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={16} />
                Précédent
              </button>
            </div>

            <div className="text-sm text-gray-500">
              {currentStep + 1} / {totalSteps}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSkip}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                <SkipForward size={16} />
                Passer
              </button>

              <button
                onClick={onNext}
                className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                {currentStep === totalSteps - 1 ? 'Terminer' : 'Suivant'}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export const ProductTour: React.FC = () => {
  const {
    isActive,
    getCurrentStep,
    currentStep,
    steps,
    nextStep,
    previousStep,
    skipTour
  } = useProductTour();

  const currentTourStep = getCurrentStep();

  if (!isActive || !currentTourStep) return null;

  return (
    <AnimatePresence>
      <TourTooltip
        target={currentTourStep.target}
        title={currentTourStep.title}
        content={currentTourStep.content}
        position={currentTourStep.position || 'bottom'}
        currentStep={currentStep}
        totalSteps={steps.length}
        onNext={nextStep}
        onPrevious={previousStep}
        onSkip={skipTour}
        onClose={skipTour}
      />
    </AnimatePresence>
  );
};

// CSS à ajouter dans votre fichier global
export const tourStyles = `
  .tour-highlight {
    position: relative;
    z-index: 10001;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .tour-highlight::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    background: transparent;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    animation: tour-pulse 2s infinite;
    pointer-events: none;
  }

  @keyframes tour-pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.02); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  }
`;
