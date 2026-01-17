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
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toastSuccess, toastWarning } from '@/lib/toast-helpers';
import { logger } from '@/lib/logger';
export default function StripeSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(true);
  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // Attendre un court instant (réduit en développement)
        const delay = process.env.NODE_ENV === 'development' ? 500 : 3000;
        await new Promise(resolve => setTimeout(resolve, delay));
        // Recharger les données d'abonnement depuis la base de données
        logger.warn('StripeSuccess', '🔄 Rechargement des données d\'abonnement après paiement...');
        await refreshSubscription();
        toastSuccess('Paiement confirmé avec succès ! Bienvenue dans CassKai Premium.');
        setIsProcessing(false);
      } catch (error) {
        logger.error('StripeSuccess', 'Erreur lors du traitement du succès:', error instanceof Error ? error.message : String(error));
        toastWarning('Paiement traité avec succès malgré une petite erreur technique.');
        setIsProcessing(false);
      }
    };
    if (user) {
      handleSuccess();
    } else {
      setIsProcessing(false);
    }
  }, [user, refreshSubscription, searchParams]);
  const handleContinue = () => {
    navigate('/dashboard');
  };
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Activation de votre abonnement</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Nous finalisons la configuration de votre compte Premium...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-green-600 dark:text-green-400">
            Paiement réussi !
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Félicitations !</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Votre abonnement Premium a été activé avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités avancées de CassKai.
            </p>
            <Button onClick={handleContinue} className="w-full">
              Commencer à utiliser CassKai Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}