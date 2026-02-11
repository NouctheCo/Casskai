import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface SubscriptionStatus {
  status: 'success' | 'pending' | 'failed';
  sessionId?: string;
  subscriptionId?: string;
  planId?: string;
  planName?: string;
  amount?: number;
  currency?: string;
  nextBillingDate?: string;
  message?: string;
}

const PaymentConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pollingCount, setPollingCount] = useState(0);

  const sessionId = searchParams.get('session_id');
  const redirectStatus = searchParams.get('status'); // success | cancel

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Gestion du statut de redirection Stripe Checkout
    if (redirectStatus === 'cancel') {
      setStatus({
        status: 'failed',
        message: t('paymentConfirmation.cancelled'),
      });
      setIsLoading(false);
      return;
    }

    // Si pas de session_id, c'est une erreur
    if (!sessionId) {
      setStatus({
        status: 'failed',
        message: t('paymentConfirmation.invalidSession'),
      });
      setIsLoading(false);
      return;
    }

    // Récupérer le statut de session Stripe
    const checkSessionStatus = async () => {
      try {
        const response = await fetch(
          `/api/stripe/session-status?session_id=${sessionId}`,
          {
            headers: {
              'Authorization': `Bearer ${user.id}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch session status');
        }

        const data = await response.json();

        // Session trouvée et paiement succès
        if (data.payment_status === 'paid') {
          // ✅ Vérifier la souscription dans Supabase
          const { data: subscription, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('stripe_subscription_id', data.subscription)
            .single();

          if (!error && subscription) {
            setStatus({
              status: 'success',
              sessionId: data.id,
              subscriptionId: data.subscription,
              planId: subscription.plan_id,
              planName: subscription.plan_name,
              amount: subscription.current_amount,
              currency: subscription.currency || 'EUR',
              nextBillingDate: subscription.current_period_end,
            });
          } else {
            // Session réussie mais souscription pas encore en DB
            setStatus({
              status: 'pending',
              message: t('paymentConfirmation.processing'),
            });
          }
          setIsLoading(false);
        } else if (data.payment_status === 'unpaid') {
          // Paiement non complété
          setStatus({
            status: 'pending',
            message: t('paymentConfirmation.pendingPayment'),
          });
          setIsLoading(false);
        } else {
          // Statut inconnu
          setStatus({
            status: 'pending',
            message: t('paymentConfirmation.checking'),
          });
        }
      } catch (error) {
        logger.error('PaymentConfirmationPage', 'Error checking session status:', error);
        
        // Retry logic: poll jusqu'à 5 fois
        if (pollingCount < 5) {
          setPollingCount(pollingCount + 1);
          setTimeout(() => {
            checkSessionStatus();
          }, 2000); // Retry après 2s
        } else {
          setStatus({
            status: 'failed',
            message: t('paymentConfirmation.error'),
          });
          setIsLoading(false);
        }
      }
    };

    checkSessionStatus();
  }, [user, navigate, sessionId, redirectStatus, pollingCount, t]);

  // Auto-redirect on success après 5 secondes
  useEffect(() => {
    if (status?.status === 'success') {
      const timer = setTimeout(() => {
        navigate('/dashboard/billing', { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('paymentConfirmation.processingTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('paymentConfirmation.processingDescription')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Succès
  if (status?.status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse opacity-25"></div>
                <CheckCircle className="w-16 h-16 text-green-500 relative" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {t('paymentConfirmation.successTitle')}
            </h1>
            
            {/* Subtitle */}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              {t('paymentConfirmation.successSubtitle')}
            </p>

            {/* Plan Details */}
            {status.planName && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600 dark:text-gray-300">{t('paymentConfirmation.planLabel')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {status.planName}
                  </span>
                </div>
                
                {status.amount && (
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600 dark:text-gray-300">{t('paymentConfirmation.amountLabel')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {status.amount.toFixed(2)} {status.currency}
                    </span>
                  </div>
                )}

                {status.nextBillingDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t('paymentConfirmation.nextBillingLabel')}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(status.nextBillingDate).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('paymentConfirmation.confirmationEmail')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('paymentConfirmation.accessGranted')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('paymentConfirmation.billingPortal')}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/dashboard/billing')}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
            >
              {t('paymentConfirmation.goToBilling')}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary CTA */}
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              {t('common.dashboard')}
            </button>

            {/* Session ID Info */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
              {t('paymentConfirmation.sessionIdLabel')}: {status.sessionId?.substring(0, 8)}...
            </p>
          </div>

          {/* Auto-redirect notice */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            {t('paymentConfirmation.redirectingIn5')}
          </p>
        </div>
      </div>
    );
  }

  // ⏳ Pending
  if (status?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <Clock className="w-16 h-16 text-amber-500" />
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {t('paymentConfirmation.pendingTitle')}
            </h1>

            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              {status.message || t('paymentConfirmation.pendingDescription')}
            </p>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                {t('paymentConfirmation.dontCloseTab')}
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
            >
              {t('common.dashboard')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ❌ Error
  if (status?.status === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {t('paymentConfirmation.errorTitle')}
            </h1>

            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              {status.message || t('paymentConfirmation.errorDescription')}
            </p>

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('paymentConfirmation.errorSuggestions')}:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 ml-4 list-disc">
                <li>{t('paymentConfirmation.checkCard')}</li>
                <li>{t('paymentConfirmation.sufficientFunds')}</li>
                <li>{t('paymentConfirmation.contactSupport')}</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/pricing')}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                {t('paymentConfirmation.tryAgain')}
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                {t('common.dashboard')}
              </button>
            </div>

            {/* Support Link */}
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
              {t('paymentConfirmation.needHelp')}{' '}
              <a href="mailto:support@casskai.app" className="text-red-600 hover:text-red-700">
                support@casskai.app
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentConfirmationPage;
