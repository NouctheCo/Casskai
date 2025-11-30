import React, { useEffect, useState } from 'react';
import { useAppState } from '../../hooks';
import SupabaseSetupWizard from '../setup/SupabaseSetupWizard';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, RefreshCw, Settings } from 'lucide-react';

interface ConfigGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ConfigGuard: React.FC<ConfigGuardProps> = ({ children, fallback }) => {
  const appState = useAppState();
  const { config, supabase } = appState;
  const isReady = (appState as any).isReady;
  const needsSetup = (appState as any).needsSetup;
  const hasError = (appState as any).hasError;
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Retry de connection
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Recharger la configuration
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors du retry:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsRetrying(false);
    }
  };

  // Reset complet de la configuration
  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser la configuration ? Cette action est irréversible.')) {
      config.resetConfig();
      window.location.reload();
    }
  };

  // Afficher le wizard d'installation dès que besoin, même si isLoading est true
  if (needsSetup) {
    return fallback || <SupabaseSetupWizard />;
  }

  // Affichage pendant le chargement initial (uniquement si la config existe déjà)
  if ((config as any).isLoading || supabase.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Chargement de CassKai</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Initialisation de l'application...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erreur de configuration
  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <h2 className="text-2xl font-bold text-red-900 mb-2">
                Erreur de Configuration
              </h2>
              <p className="text-red-700">
                Une erreur s'est produite lors du chargement de votre configuration.
              </p>
            </div>

            <Alert className="border-red-200 bg-red-50 mb-6">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Erreur :</strong> {config.error?.message || 'Erreur inconnue'}
              </AlertDescription>
            </Alert>

            {showDetails && config.error && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Détails techniques :</h3>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  <p><strong>Code :</strong> {config.error.code}</p>
                  <p><strong>Timestamp :</strong> {config.error.timestamp}</p>
                  {config.error.details && (
                    <p><strong>Détails :</strong> {JSON.stringify(config.error.details, null, 2)}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center"
              >
                {isRetrying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Réessayer
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Masquer' : 'Voir'} les détails
              </Button>

              <Button
                variant="destructive"
                onClick={handleReset}
              >
                <Settings className="mr-2 h-4 w-4" />
                Reconfigurer
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Besoin d'aide ?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Vérifiez votre connexion internet</li>
                <li>• Assurez-vous que vos credentials Supabase sont corrects</li>
                <li>• Consultez la console développeur pour plus de détails</li>
                <li>• Contactez le support si le problème persiste</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Configuration OK mais client Supabase pas prêt
  if ((config as any).isConfigured && !(supabase as any).isClientReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-yellow-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connexion à la base de données</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Initialisation de la connexion Supabase...
            </p>
            <Button variant="outline" onClick={handleRetry} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tout est OK - Afficher l'application
  if (isReady) {
    return <>{children}</>;
  }

  // Fallback par défaut
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-600 dark:text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Préparation en cours</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Veuillez patienter...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigGuard;
