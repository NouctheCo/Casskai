import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { getCountry } from '@/services/pricingMultiCurrency';

interface AuthFormProps {
  onAuthSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation(); // Utiliser le namespace par défaut
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ NOUVEAU: Vérifier email_confirmed_at après authentication
  useEffect(() => {
    if (user && user.email_confirmed_at) {
      // Email vérifié - continuer vers onboarding
      if (user.user_metadata?.onboarding_completed) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn({ email, password });
      setSuccessMessage(t('auth.signin.success'));
      onAuthSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signin.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // ✅ NOUVEAU: Définir emailRedirectTo vers la page de vérification
      const country = getCountry();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`,
          data: {
            country,
            locale,
            signup_source: 'web',
            signup_date: new Date().toISOString(),
          },
        },
      });

      if (signUpError) throw signUpError;

      // ✅ NOUVEAU: Rediriger vers la page de vérification email
      setSuccessMessage(t('auth.signup.check_email'));
      setTimeout(() => {
        navigate('/auth/verify-email');
      }, 1500);
      
      onAuthSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signup.error'));
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NOUVEAU: Si l'utilisateur est connecté mais email non vérifié, afficher message
  if (user && !user.email_confirmed_at) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            {t('auth.verify.pending_title')}
          </h3>
        </div>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
          {t('auth.verify.pending_description')}
        </p>
        <button
          onClick={() => navigate('/auth/verify-email')}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {t('auth.verify.go_to_verification')}
        </button>
      </div>
    );
  }

  return (
    <form className="w-full max-w-md mx-auto p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
      {/* Locale Selector */}
      <div className="mb-6 flex gap-2">
        {['fr', 'en', 'es'].map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLocale(lang as 'fr' | 'en' | 'es')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              locale === lang
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('login')}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === 'login'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t('auth.tabs.login')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('signup')}
          className={`pb-3 px-2 font-medium transition-colors ${
            activeTab === 'signup'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t('auth.tabs.signup')}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Email Input */}
      <div className="mb-4">
        <label
          htmlFor="auth-email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('auth.fields.email')}
        </label>
        <input
          id="auth-email"
          name="email"
          aria-label={t('auth.fields.email')}
          data-testid="email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@example.com"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          required
        />
      </div>

      {/* Password Input */}
      <div className="mb-6">
        <label
          htmlFor="auth-password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t('auth.fields.password')}
        </label>
        <div className="relative">
          <input
            id="auth-password"
            name="password"
            aria-label={t('auth.fields.password')}
            data-testid="password-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        onClick={activeTab === 'login' ? handleSignIn : handleSignUp}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
      >
        {isLoading ? t('common.action.loading') : activeTab === 'login' ? t('auth.buttons.signin') : t('auth.buttons.signup')}
      </button>

      {/* Forgot Password Link */}
      {activeTab === 'login' && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate('/auth/forgot-password')}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t('auth.links.forgot_password')}
          </button>
        </div>
      )}

      {/* Sign Up Link */}
      {activeTab === 'login' && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.signup.prompt')}{' '}
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            {t('auth.signup.link')}
          </button>
        </div>
      )}
    </form>
  );
};

export const AuthGuard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // ✅ NOUVEAU: Vérifier email_confirmed_at dans le composant principal
  useEffect(() => {
    if (!loading && user) {
      // Utilisateur authentifié
      if (!user.email_confirmed_at) {
        // Email non vérifié - rediriger vers vérification
        navigate('/auth/verify-email', { replace: true });
      } else if (user.user_metadata?.onboarding_completed) {
        // Onboarding terminé - aller au dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // Onboarding non terminé - aller à l'onboarding
        navigate('/onboarding', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si déjà authentifié, ne pas afficher le formulaire
  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirection...</p>
        </div>
      </div>
    );
  }

  // Afficher le formulaire d'authentification
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">CassKai</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion d'entreprise complète</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
};

export default AuthGuard;
