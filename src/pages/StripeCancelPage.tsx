/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React from 'react';

import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { XCircle, ArrowLeft } from 'lucide-react';

import { toastInfo } from '@/lib/toast-helpers';



export default function StripeCancelPage() {

  const navigate = useNavigate();



  const handleGoBack = () => {

    navigate('/pricing');

  };



  const handleContinueFree = () => {

    toastInfo('Vous continuez avec le plan gratuit. Vous pouvez changer d\'avis à tout moment.');

    navigate('/dashboard');

  };



  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">

      <Card className="w-full max-w-md">

        <CardHeader>

          <CardTitle className="text-center text-orange-600 dark:text-orange-400">

            Paiement annulé

          </CardTitle>

        </CardHeader>

        <CardContent>

          <div className="text-center">

            <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />

            <h2 className="text-2xl font-bold mb-2">Aucun problème !</h2>

            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 mb-6">

              Le paiement a été annulé. Vous pouvez continuer à utiliser CassKai avec le plan gratuit ou revenir choisir un abonnement quand vous le souhaitez.

            </p>



            <div className="space-y-3">

              <Button onClick={handleGoBack} className="w-full">

                <ArrowLeft className="h-4 w-4 mr-2" />

                Retour aux tarifs

              </Button>

              <Button onClick={handleContinueFree} variant="outline" className="w-full">

                Continuer avec le plan gratuit

              </Button>

            </div>



            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">

              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">

                Avantages du plan gratuit

              </h3>

              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">

                <li>• Accès aux fonctionnalités de base</li>

                <li>• Jusqu'à 10 clients</li>

                <li>• Support communautaire</li>

                <li>• Possibilité de mise à niveau à tout moment</li>

              </ul>

            </div>

          </div>

        </CardContent>

      </Card>

    </div>

  );

}
