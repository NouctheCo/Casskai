import React from 'react';

import { useTrial, useTrialStatistics, useExpiringTrials } from '@/hooks/trial.hooks';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';



export const TrialManager: React.FC = () => {

  const {

    trialInfo,

    isLoading,

    error,

    canCreateTrial,

    createTrial,

    convertTrialToPaid,

    cancelTrial,

    daysRemaining,

    isExpired,

    isActive,

    refreshTrialInfo

  } = useTrial();



  const handleCreateTrial = async () => {

    const result = await createTrial();

    if (result.success) {
      // eslint-disable-next-line no-alert
      alert('Essai créé avec succès !');

    } else {
      // eslint-disable-next-line no-alert
      alert(`Erreur: ${result.error}`);

    }

  };



  const handleConvertToPaid = async () => {

    const result = await convertTrialToPaid('starter');

    if (result.success) {
      // eslint-disable-next-line no-alert
      alert('Conversion réussie !');

    } else {
      // eslint-disable-next-line no-alert
      alert(`Erreur: ${result.error}`);

    }

  };



  const handleCancelTrial = async () => {

    const result = await cancelTrial('Annulé par l\'utilisateur');

    if (result.success) {
      // eslint-disable-next-line no-alert
      alert('Essai annulé !');

    } else {
      // eslint-disable-next-line no-alert
      alert(`Erreur: ${result.error}`);

    }

  };



  if (isLoading) {

    return <div className="flex justify-center p-4">Chargement...</div>;

  }



  return (

    <div className="space-y-6">

      {/* État de l'essai actuel */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <Clock className="h-5 w-5" />

            État de l'essai

          </CardTitle>

          <CardDescription>

            Informations sur votre période d'essai actuelle

          </CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          {trialInfo ? (

            <div className="space-y-3">

              <div className="flex items-center justify-between">

                <span>Statut:</span>

                <Badge variant={isActive ? 'default' : isExpired ? 'destructive' : 'secondary'}>

                  {isActive ? 'Actif' : isExpired ? 'Expiré' : 'Inactif'}

                </Badge>

              </div>



              <div className="flex items-center justify-between">

                <span>Jours restants:</span>

                <span className={`font-semibold ${daysRemaining <= 3 ? 'text-red-600' : 'text-green-600'}`}>

                  {daysRemaining} jour(s)

                </span>

              </div>



              <div className="flex items-center justify-between">

                <span>Date d'expiration:</span>

                <span>{new Date((trialInfo as any).trialEnd).toLocaleDateString('fr-FR')}</span>

              </div>



              {/* Actions disponibles */}

              <div className="flex gap-2 pt-4">

                {isActive && (

                  <>

                    <Button onClick={handleConvertToPaid} className="flex-1">

                      <CheckCircle className="h-4 w-4 mr-2" />

                      Convertir en payant

                    </Button>

                    <Button onClick={handleCancelTrial} variant="outline" className="flex-1">

                      Annuler l'essai

                    </Button>

                  </>

                )}



                {!trialInfo && canCreateTrial && (

                  <Button onClick={handleCreateTrial} className="w-full">

                    <CheckCircle className="h-4 w-4 mr-2" />

                    Commencer l'essai gratuit

                  </Button>

                )}



                <Button onClick={refreshTrialInfo} variant="outline" size="sm">

                  Actualiser

                </Button>

              </div>

            </div>

          ) : (

            <div className="text-center py-6">

              {canCreateTrial ? (

                <div className="space-y-3">

                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />

                  <p>Vous pouvez commencer un essai gratuit de 30 jours</p>

                  <Button onClick={handleCreateTrial}>

                    Commencer l'essai

                  </Button>

                </div>

              ) : (

                <div className="space-y-3">

                  <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto" />

                  <p>Vous n'êtes pas éligible à un essai gratuit</p>

                  <p className="text-sm text-gray-600 dark:text-gray-400">

                    Vous avez déjà utilisé votre essai ou avez un abonnement actif

                  </p>

                </div>

              )}

            </div>

          )}



          {error && (

            <div className="bg-red-50 border border-red-200 rounded p-3 dark:bg-red-900/20">

              <p className="text-red-800 text-sm">{error}</p>

            </div>

          )}

        </CardContent>

      </Card>

    </div>

  );

};



// Composant pour les administrateurs - statistiques des essais

export const TrialStatistics: React.FC = () => {

  const { statistics, isLoading, error, refresh } = useTrialStatistics();



  if (isLoading) {

    return <div className="flex justify-center p-4">Chargement des statistiques...</div>;

  }



  return (

    <Card>

      <CardHeader>

        <CardTitle className="flex items-center gap-2">

          <Users className="h-5 w-5" />

          Statistiques des essais

        </CardTitle>

        <CardDescription>

          Aperçu des essais actifs et conversions

        </CardDescription>

      </CardHeader>

      <CardContent>

        {error ? (

          <div className="bg-red-50 border border-red-200 rounded p-3 dark:bg-red-900/20">

            <p className="text-red-800 text-sm">{error}</p>

          </div>

        ) : (

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {statistics.map((stat: { metric: string; value: string | number }, index: number) => (

              <div key={index} className="text-center">

                <div className="text-2xl font-bold text-blue-600">

                  {stat.metric.includes('percent') ? `${stat.value}%` : stat.value}

                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">

                  {stat.metric.replace(/_/g, ' ').replace('percent', '(%)')}

                </div>

              </div>

            ))}

          </div>

        )}



        <div className="mt-4">

          <Button onClick={refresh} variant="outline" size="sm">

            Actualiser

          </Button>

        </div>

      </CardContent>

    </Card>

  );

};



// Composant pour surveiller les essais expirants (pour les admins)

export const ExpiringTrialsAlert: React.FC = () => {

  const { expiringTrials, isLoading } = useExpiringTrials(7);



  if (isLoading || expiringTrials.length === 0) {

    return null;

  }



  return (

    <Card className="border-orange-200 bg-orange-50">

      <CardHeader>

        <CardTitle className="flex items-center gap-2 text-orange-800">

          <AlertTriangle className="h-5 w-5" />

          Essais expirant bientôt

        </CardTitle>

      </CardHeader>

      <CardContent>

        <div className="space-y-2">

          {expiringTrials.slice(0, 5).map((trial) => {

            const daysRemaining = Math.ceil(

              (new Date(trial.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)

            );



            return (

              <div key={trial.id} className="flex justify-between items-center text-sm">

                <span>User {trial.user_id.slice(0, 8)}...</span>

                <Badge variant={daysRemaining <= 1 ? 'destructive' : 'secondary'}>

                  {daysRemaining} jour(s)

                </Badge>

              </div>

            );

          })}

        </div>

      </CardContent>

    </Card>

  );

};
