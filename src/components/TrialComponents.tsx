import React from 'react';
import { useTrial } from '@/hooks/trial.hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

export const TrialStatusCard: React.FC = () => {
  const {
    trialInfo,
    isLoading,
    error,
    canCreateTrial,
    createTrial,
    daysRemaining,
    isExpired,
    isActive
  } = useTrial();

  const handleCreateTrial = async () => {
    const result = await createTrial();
    if (!result.success) {
      logger.error('Erreur lors de la création de l\'essai:', result.error)
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Chargement...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Aucun essai actif
  if (!trialInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Période d'essai
          </CardTitle>
          <CardDescription>
            Découvrez toutes les fonctionnalités gratuitement pendant 30 jours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canCreateTrial ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Accès complet</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Sans engagement</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Support inclus</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>30 jours gratuits</span>
                </div>
              </div>
              <Button onClick={handleCreateTrial} className="w-full">
                Commencer l'essai gratuit
              </Button>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Vous n'êtes pas éligible pour un essai gratuit pour le moment.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Essai actif
  const progressValue = Math.max(0, ((30 - daysRemaining) / 30) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Votre période d'essai
          <Badge variant={isExpired ? "destructive" : isActive ? "default" : "secondary"}>
            {isExpired ? "Expiré" : "Actif"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {isExpired
            ? "Votre essai a expiré. Passez à un abonnement payant pour continuer."
            : `${daysRemaining} jours restants sur 30`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isExpired && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression de l'essai</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="w-full" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Date de début</p>
            <p className="font-medium">
              {trialInfo.trialStart.toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Date de fin</p>
            <p className="font-medium">
              {trialInfo.trialEnd.toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        {isExpired && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Votre essai a expiré le {trialInfo.trialEnd.toLocaleDateString('fr-FR')}.
              Certaines fonctionnalités peuvent être limitées.
            </AlertDescription>
          </Alert>
        )}

        {daysRemaining <= 7 && !isExpired && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Il ne vous reste que {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}.
              Pensez à passer à un abonnement payant.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export const TrialActionsCard: React.FC = () => {
  const { trialInfo, convertTrialToPaid, cancelTrial, isActive } = useTrial();

  const handleConvertToPaid = async () => {
    // TODO: Ouvrir un modal de sélection de plan
    const result = await convertTrialToPaid('starter_monthly');
    if (!result.success) {
      logger.error('Erreur lors de la conversion:', result.error);
      toast({
        title: "Erreur",
        description: result.error || 'Erreur lors de la conversion vers un abonnement payant',
        variant: "destructive"
      });
    } else {
      toast({
        title: "Succès",
        description: "Conversion vers un abonnement payant réussie",
        variant: "default"
      });
    }
  };

  const handleCancelTrial = async () => {
    const result = await cancelTrial('Annulé par l\'utilisateur');
    if (!result.success) {
      logger.error('Erreur lors de l\'annulation:', result.error);
      // Afficher un message d'erreur plus user-friendly
      if (result.error?.includes('check constraint')) {
        toast({
          title: "Erreur technique",
          description: "Erreur technique lors de l'annulation. Veuillez contacter le support.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erreur",
          description: result.error || 'Erreur lors de l\'annulation de l\'essai',
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Succès",
        description: "Essai annulé avec succès",
        variant: "default"
      });
    }
  };

  if (!trialInfo || !isActive) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>
          Gérez votre période d'essai
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleConvertToPaid} className="w-full">
          Passer à un abonnement payant
        </Button>
        <Button
          onClick={handleCancelTrial}
          variant="outline"
          className="w-full text-red-600 hover:text-red-700"
        >
          Annuler l'essai
        </Button>
      </CardContent>
    </Card>
  );
};