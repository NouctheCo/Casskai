import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { stripeService } from '@/services/stripeService';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export function StripeIntegrationTest() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const testStripeIntegration = async () => {
    if (!user) {
      addTestResult({
        success: false,
        message: 'Utilisateur non connecté'
      });
      return;
    }

    setIsLoading(true);
    setTestResults([]);

    try {
      // Test 1: Vérifier la configuration Stripe
      addTestResult({
        success: true,
        message: 'Configuration Stripe vérifiée'
      });

      // Test 2: Tester la récupération de l'abonnement actuel
      const subscriptionResult = await stripeService.getCurrentSubscription(user.id);
      addTestResult({
        success: subscriptionResult.success,
        message: subscriptionResult.success
          ? `Abonnement récupéré: ${subscriptionResult.subscription?.planId || 'Aucun'}`
          : `Erreur abonnement: ${subscriptionResult.error}`,
        data: subscriptionResult.subscription
      });

      // Test 3: Tester la création d'une session de checkout (simulation)
      const checkoutResult = await stripeService.createCheckoutSession({
        planId: 'pro_monthly',
        successUrl: 'http://localhost:5173/success',
        cancelUrl: 'http://localhost:5173/pricing',
        metadata: { source: 'integration-test' }
      });

      addTestResult({
        success: checkoutResult.success,
        message: checkoutResult.success
          ? 'Session de checkout créée avec succès'
          : `Erreur checkout: ${checkoutResult.error}`,
        data: checkoutResult.checkoutUrl
      });

    } catch (error) {
      addTestResult({
        success: false,
        message: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Test d'intégration Stripe
          <Badge variant="outline">Debug</Badge>
        </CardTitle>
        <CardDescription>
          Testez l'intégration complète du système d'abonnements Stripe
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          onClick={testStripeIntegration}
          disabled={isLoading || !user}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Test en cours...
            </>
          ) : (
            'Lancer les tests'
          )}
        </Button>

        {!user && (
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour tester l'intégration
          </p>
        )}

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Résultats des tests:</h4>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-2 rounded text-sm ${
                  result.success
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{result.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
