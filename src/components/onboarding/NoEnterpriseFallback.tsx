import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CacheManager } from '@/utils/cacheManager';

export const NoEnterpriseFallback: React.FC = () => {
  const navigate = useNavigate();

  const handlePurgeCache = () => {
    CacheManager.clearEnterprises();
    window.location.reload();
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
        <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Aucune entreprise configurée pour l’instant
      </h2>
      <p className="mt-3 max-w-xl text-sm text-gray-600 dark:text-gray-400">
        Nous n’avons trouvé aucune entreprise active liée à votre compte. Relancez l’onboarding pour créer
        votre structure ou purgez votre cache local si vous pensez que vos données sont corrompues.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => navigate('/onboarding')} className="sm:min-w-[220px]">
          Lancer l’onboarding
        </Button>
        <Button
          variant="outline"
          onClick={handlePurgeCache}
          className="flex items-center justify-center gap-2 sm:min-w-[220px]"
        >
          <RefreshCw className="h-4 w-4" />
          Purger le cache local
        </Button>
      </div>
    </div>
  );
};

export default NoEnterpriseFallback;
