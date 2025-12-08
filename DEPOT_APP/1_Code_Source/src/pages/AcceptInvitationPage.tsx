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

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  company_name?: string;
  status: string;
  expires_at: string;
}

export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError(t('invitation.invalid_link'));
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    if (!token) return;

    try {
      const { data, error: invError } = await supabase
        .from('user_invitations')
        .select(`
          id,
          email,
          role,
          status,
          expires_at,
          companies:company_id (name)
        `)
        .eq('token', token)
        .single();

      if (invError || !data) {
        setError(t('invitation.not_found'));
        setLoading(false);
        return;
      }

      // Vérifier si l'invitation a expiré
      if (new Date(data.expires_at) < new Date()) {
        setError(t('invitation.expired'));
        setLoading(false);
        return;
      }

      // Vérifier si l'invitation est déjà acceptée ou annulée
      if (data.status !== 'pending') {
        setError(t('invitation.already_used'));
        setLoading(false);
        return;
      }

      setInvitation({
        id: data.id,
        email: data.email,
        role: data.role,
        company_name: data.companies?.name,
        status: data.status,
        expires_at: data.expires_at
      });
      setLoading(false);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError(t('invitation.load_error'));
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token || !user) return;

    // Vérifier que l'email correspond
    if (invitation && user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      setError(t('invitation.wrong_email', { email: invitation.email }));
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const { data, error: acceptError } = await supabase.functions.invoke('accept-invitation', {
        body: { token }
      });

      if (acceptError) {
        throw new Error(acceptError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSuccess(true);
      toast.success(t('invitation.accepted_success'));

      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : t('invitation.accept_error'));
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">{t('invitation.success_title')}</CardTitle>
            <CardDescription>{t('invitation.success_description')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
            <CardTitle className="text-2xl">{t('invitation.error_title')}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate('/')}
            >
              {t('invitation.back_home')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si pas connecté, afficher message pour se connecter
  if (!user && invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl text-center">
              {t('invitation.title')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('invitation.invited_to', { company: invitation.company_name })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('invitation.role')}: <span className="font-semibold">{t(`team.roles.${invitation.role}`)}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('invitation.email')}: <span className="font-semibold">{invitation.email}</span>
              </p>
            </div>
            <Alert>
              <AlertDescription>
                {t('invitation.login_required')}
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => navigate(`/login?redirect=/invitation?token=${token}`)}
              >
                {t('auth.login')}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/signup?redirect=/invitation?token=${token}`)}
              >
                {t('auth.signup')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si connecté avec le bon email, afficher bouton pour accepter
  if (user && invitation) {
    const emailMatches = user.email?.toLowerCase() === invitation.email.toLowerCase();

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl text-center">
              {t('invitation.title')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('invitation.invited_to', { company: invitation.company_name })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('invitation.company')}:</span>
                <span className="font-semibold">{invitation.company_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('invitation.role')}:</span>
                <span className="font-semibold">{t(`team.roles.${invitation.role}`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('invitation.email')}:</span>
                <span className="font-semibold">{invitation.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('invitation.expires')}:</span>
                <span className="font-semibold">{new Date(invitation.expires_at).toLocaleDateString()}</span>
              </div>
            </div>

            {!emailMatches ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {t('invitation.wrong_email_logged', {
                    expected: invitation.email,
                    current: user.email
                  })}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button
                  className="w-full"
                  onClick={handleAccept}
                  disabled={accepting || !emailMatches}
                >
                  {accepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('invitation.accepting')}
                    </>
                  ) : (
                    t('invitation.accept')
                  )}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              {t('common.cancel')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
