/**
 * CassKai - Page de Vérification Email
 * Copyright © 2025 NOUTCHE CONSEIL
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

export default function EmailVerificationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'waiting' | 'verified' | 'error' | 'resending'>('waiting');
  const [message, setMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Vérifie si l'email a été confirmé via Supabase
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!user) {
        navigate('/register');
        return;
      }

      // Supabase fournit email_confirmed_at quand l'email est vérifié
      const { data: { user: freshUser }, error } = await supabase.auth.getUser();

      if (error || !freshUser) {
        setStatus('error');
        setMessage('Impossible de vérifier votre email. Veuillez réessayer.');
        return;
      }

      // ✅ Email confirmé
      if (freshUser.email_confirmed_at) {
        setStatus('verified');
        setMessage(`Merci ! Email ${freshUser.email} vérifié avec succès.`);
        
        // Redirection automatique après 2 secondes
        setTimeout(() => {
          const redirect = searchParams.get('redirect') || '/onboarding';
          navigate(redirect);
        }, 2000);
      }
    };

    // Vérifier immédiatement
    checkEmailVerification();

    // Vérifier toutes les 3 secondes (user peut confirmer dans son email)
    const interval = setInterval(checkEmailVerification, 3000);
    return () => clearInterval(interval);
  }, [user, navigate, searchParams]);

  // Timer pour cooldown de renvoi
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!user) return;

    setStatus('resending');
    try {
      // Renvoyer l'email de confirmation via Supabase
      const { error } = await (supabase.auth as any).resendConfirmationLink({
        email: user.email || '',
        type: 'signup',
      });

      if (error) {
        setStatus('waiting');
        setMessage('Erreur lors de l\'envoi. Veuillez réessayer.');
        return;
      }

      setStatus('waiting');
      setMessage('Email de confirmation renvoyé !');
      setResendCooldown(60); // 60 secondes de cooldown
    } catch (err) {
      setStatus('error');
      setMessage(`Erreur: ${  err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setStatus('waiting');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {/* Icône animée */}
          <div className="mx-auto">
            {status === 'verified' ? (
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 animate-pulse" />
              </div>
            ) : status === 'error' ? (
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>

          <div>
            <CardTitle className="text-2xl">
              {status === 'verified'
                ? '✨ Email Vérifié !'
                : status === 'error'
                ? '⚠️ Erreur de Vérification'
                : '📧 Vérifiez Votre Email'}
            </CardTitle>
            <CardDescription className="mt-2">
              {user?.email || 'votre email'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Message principal */}
          {status === 'verified' ? (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                {message}
              </AlertDescription>
            </Alert>
          ) : status === 'error' ? (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-300">
                  {t(
                    'auth.emailVerification.instruction',
                    'Un email de confirmation a été envoyé. Cliquez sur le lien pour vérifier votre email.'
                  )}
                </AlertDescription>
              </Alert>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">Les changements seront appliqués automatiquement.</p>
                {message && <p className="text-green-600 dark:text-green-400">{message}</p>}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {status === 'verified' ? (
              <Button
                onClick={() => navigate(searchParams.get('redirect') || '/onboarding')}
                className="w-full"
              >
                Continuer vers onboarding
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleResendEmail}
                  disabled={status === 'resending' || resendCooldown > 0}
                  className="w-full"
                  variant="outline"
                >
                  {status === 'resending' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Renvoyer dans ${resendCooldown}s`
                  ) : (
                    '📧 Renvoyer l\'email'
                  )}
                </Button>

                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="w-full"
                >
                  Se déconnecter et revenir
                </Button>
              </>
            )}
          </div>

          {/* Aide */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>💡 Vérifiez votre dossier spam</p>
            <p>⏱️ Le lien expire dans 24h</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
