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

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast as toastify } from 'react-toastify';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';

const toast = {
  success: (msg: string) => toastify.success(msg),
  error: (msg: string) => toastify.error(msg),
};

function EmailSentMessage({ email }: { email: string }) {
  return <div className="email-sent">An email has been sent to {email}.</div>;
}

function useForgotPasswordForm(
  setEmailSent: React.Dispatch<React.SetStateAction<boolean>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  toast: { success: (msg: string) => void; error: (msg: string) => void }
) {
  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>, email: string) => {
      e.preventDefault();
      setIsLoading(true);

      setTimeout(() => {
        if (email.includes('@')) {
          setEmailSent(true);
          toast.success('Email sent successfully!');
        } else {
          toast.error('Invalid email address.');
        }
        setIsLoading(false);
      }, 1000);
    },
    [setEmailSent, setIsLoading, toast]
  );

  return { handleFormSubmit };
}

function useForgotPasswordState() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  return { email, setEmail, isLoading, setIsLoading, emailSent, setEmailSent, countdown, setCountdown, navigate, toast, user, authLoading, t };
}

function ResetPasswordForm({ email, setEmail, isLoading, handleSubmit }: { email: string; setEmail: React.Dispatch<React.SetStateAction<string>>; isLoading: boolean; handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="email">Email:</label>
      <input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading || !email.trim()}>
        {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
      </button>
    </form>
  );
}

function ForgotPasswordContent({
  email,
  setEmail,
  isLoading,
  emailSent,
  handleFormSubmit,
}: {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  emailSent: boolean;
  handleFormSubmit: (e: React.FormEvent<HTMLFormElement>, email: string) => void;
}) {
  return (
    <div>
      {emailSent ? (
        <EmailSentMessage email={email} />
      ) : (
        <ResetPasswordForm
          email={email}
          setEmail={setEmail}
          isLoading={isLoading}
          handleSubmit={(e) => handleFormSubmit(e, email)}
        />
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const { email, setEmail, isLoading, setIsLoading, emailSent, setEmailSent } = useForgotPasswordState();
  const { handleFormSubmit } = useForgotPasswordForm(setEmailSent, setIsLoading, toast);

  return (
    <ForgotPasswordContent
      email={email}
      setEmail={setEmail}
      isLoading={isLoading}
      emailSent={emailSent}
      handleFormSubmit={handleFormSubmit}
    />
  );
}
