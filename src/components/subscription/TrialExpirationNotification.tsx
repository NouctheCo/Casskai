import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, CreditCard, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TrialExpirationNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  userInfo?: {
    daysRemaining: number;
    isExpired: boolean;
    planId: string | null;
  };
}

export const TrialExpirationNotification: React.FC<TrialExpirationNotificationProps> = ({
  isVisible,
  onClose,
  userInfo
}) => {
  const navigate = useNavigate();
  const [dismissedExpiredWarning, setDismissedExpiredWarning] = useState(false);

  // Écouter les événements d'expiration des essais
  useEffect(() => {
    const handleTrialExpired = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { redirectToPricing } = customEvent.detail || {};

      if (redirectToPricing) {
        // Rediriger automatiquement vers la page de tarification
        setTimeout(() => {
          navigate('/pricing');
        }, 2000); // Délai pour laisser l'utilisateur voir le message
      }
    };

    window.addEventListener('trial-expired', handleTrialExpired);

    return () => {
      window.removeEventListener('trial-expired', handleTrialExpired);
    };
  }, [navigate]);

  if (!isVisible || !userInfo) return null;

  const { daysRemaining, isExpired, planId } = userInfo;

  // Si l'utilisateur a déjà un plan payant, ne rien afficher
  if (planId && planId !== 'trial' && !isExpired) return null;

  // Notification d'essai expiré
  if (isExpired) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-xl font-bold">Période d'essai expirée</CardTitle>
            <CardDescription>
              Votre période d'essai de 30 jours est terminée. Choisissez un plan pour continuer à utiliser CassKai.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>Accès limité :</strong> Seuls les modules de base restent accessibles.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/pricing')}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Choisir un plan
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setDismissedExpiredWarning(true);
                  onClose();
                }}
                className="w-full"
              >
                Continuer avec l'accès limité
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Notification d'avertissement (essai bientôt expiré)
  if (daysRemaining <= 7 && daysRemaining > 0) {
    return (
      <Alert className="border-orange-200 bg-orange-50 mx-4 mt-4">
        <Clock className="h-4 w-4 text-orange-600" />
        <div className="flex-1">
          <AlertTitle className="text-orange-800">
            Votre période d'essai expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-400">
            Choisissez un plan maintenant pour continuer à profiter de tous les modules de CassKai sans interruption.
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            size="sm"
            onClick={() => navigate('/pricing')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Voir les plans
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    );
  }

  return null;
};

export default TrialExpirationNotification;
