import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true);

  // Only show in staging environment
  const isStaging = import.meta.env.VITE_APP_ENV === 'staging' ||
                     import.meta.env.VITE_BETA_FEEDBACK_ENABLED === 'true';

  if (!isStaging || !isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500',
        'text-white shadow-lg'
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle className="h-5 w-5 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="font-semibold text-sm md:text-base">
                Version Beta - Test en cours
              </p>
              <p className="text-xs md:text-sm opacity-90">
                Vous utilisez une version de test. Vos retours sont précieux pour améliorer CassKai! 🚀
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 hover:bg-white/20 rounded-full p-1 transition-colors dark:bg-gray-800"
            aria-label="Fermer la bannière"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
