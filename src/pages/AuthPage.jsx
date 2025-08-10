import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom'; 
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  UserPlus,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Sparkles,
  Building,
  Users
} from 'lucide-react';
import { EmailConfirmationDialog } from '@/components/auth/EmailConfirmationDialog';

/**
 * Composant principal de gestion de l'authentification
 * Gère la connexion, l'inscription et la récupération de mot de passe
 * avec validation complète, animations et gestion d'erreurs
 */
export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, resetPassword, user, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();

  // États principaux
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgot-password'
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // États des formulaires
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });

  // États pour mot de passe oublié
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(0);

  // États pour la confirmation d'email
  const [showEmailConfirmationDialog, setShowEmailConfirmationDialog] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  /**
   * Détermine le mode d'authentification basé sur l'URL
   */
  useEffect(() => {
    const path = location.pathname;
    if (path === '/register') setAuthMode('register');
    else if (path === '/forgot-password') setAuthMode('forgot-password');
    else setAuthMode('login');
  }, [location.pathname]);

  /**
   * Gestion des messages URL (confirmation email, etc.)
   */
  useEffect(() => {
    const message = searchParams.get('message');
    
    if (message === 'signup_complete') {
      toast({
        title: t('auth.signupCompleteTitle', { defaultValue: "Inscription réussie !" }),
        description: t('auth.loginPromptAfterSignup', {
          defaultValue: "Veuillez vous connecter avec votre nouveau compte."
        }),
        duration: 7000,
      });
    } else if (message === 'email_confirmed') {
      toast({
        title: t('auth.emailConfirmedTitle', { defaultValue: "Email confirmé !" }),
        description: t('auth.emailConfirmedMessage', {
          defaultValue: "Votre email a été confirmé. Vous pouvez maintenant vous connecter."
        }),
        duration: 7000,
      });
    }

    if (message) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('message');
      setSearchParams(newSearchParams);
    }
  }, [searchParams, setSearchParams, toast, t]);

  /**
   * Redirection automatique si utilisateur connecté
   */
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  /**
   * Countdown pour le renvoi d'email de réinitialisation
   */
  useEffect(() => {
    let timer;
    if (resetCountdown > 0) {
      timer = setTimeout(() => setResetCountdown(resetCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resetCountdown]);

  /**
   * Fonctions de validation côté client
   */
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, []);

  const validatePassword = useCallback((password) => {
    return password.length >= 6;
  }, []);

  const validateName = useCallback((name) => {
    return name.trim().length >= 2;
  }, []);

  /**
   * Validation complète du formulaire
   */
  const validateForm = useCallback(() => {
    const errors = {};
    const { email, password, firstName, lastName, confirmPassword } = formData;

    // Validation email
    if (!email.trim()) {
      errors.email = t('auth.emailRequired', { defaultValue: 'L\'email est requis' });
    } else if (!validateEmail(email)) {
      errors.email = t('auth.invalidEmailFormat', { defaultValue: 'Format d\'email invalide' });
    }

    // Validation mot de passe
    if (!password.trim()) {
      errors.password = t('auth.passwordRequired', { defaultValue: 'Le mot de passe est requis' });
    } else if (!validatePassword(password)) {
      errors.password = t('auth.passwordTooShort', { defaultValue: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Validation spécifique pour l'inscription
    if (authMode === 'register') {
      if (!firstName.trim()) {
        errors.firstName = t('auth.firstNameRequired', { defaultValue: 'Le prénom est requis' });
      } else if (!validateName(firstName)) {
        errors.firstName = t('auth.firstNameTooShort', { defaultValue: 'Le prénom doit contenir au moins 2 caractères' });
      }

      if (!lastName.trim()) {
        errors.lastName = t('auth.lastNameRequired', { defaultValue: 'Le nom est requis' });
      } else if (!validateName(lastName)) {
        errors.lastName = t('auth.lastNameTooShort', { defaultValue: 'Le nom doit contenir au moins 2 caractères' });
      }

      if (confirmPassword !== password) {
        errors.confirmPassword = t('auth.passwordMismatch', { defaultValue: 'Les mots de passe ne correspondent pas' });
      }
    }

    // Validation pour mot de passe oublié
    if (authMode === 'forgot-password') {
      if (!email.trim()) {
        errors.email = t('auth.emailRequired', { defaultValue: 'L\'email est requis' });
      } else if (!validateEmail(email)) {
        errors.email = t('auth.invalidEmailFormat', { defaultValue: 'Format d\'email invalide' });
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, authMode, validateEmail, validatePassword, validateName, t]);

  /**
   * Gestion des changements de champs
   */
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  /**
   * Basculer la visibilité du mot de passe
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  /**
   * Gestion de la connexion
   */
  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: t('auth.validationError', { defaultValue: "Erreur de validation" }),
        description: t('auth.fixErrors', { defaultValue: "Veuillez corriger les erreurs dans le formulaire." }),
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error, data } = await signIn({ 
        email: formData.email.trim(), 
        password: formData.password 
      });
      
      if (error) {
        let errorMessage = t('auth.loginFailed', { 
          defaultValue: "Échec de la connexion. Veuillez vérifier vos identifiants." 
        });
        
        if (error.message === 'Invalid login credentials') {
          errorMessage = t('auth.invalidCredentialsMessage', {
            defaultValue: "Email ou mot de passe incorrect. Veuillez vérifier vos informations."
          });
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = t('auth.emailNotConfirmed', {
            defaultValue: "Veuillez confirmer votre email avant de vous connecter."
          });
        }
        
        toast({
          variant: 'destructive',
          title: t('auth.loginError', { defaultValue: "Erreur de connexion" }),
          description: errorMessage,
        });
      } else if (data.user) {
        toast({
          title: t('auth.loginSuccessTitle', { defaultValue: "Connexion réussie" }),
          description: t('auth.loginSuccessMessage', { defaultValue: "Bienvenue ! Redirection en cours..." }),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('auth.unexpectedError', { defaultValue: "Erreur inattendue" }),
        description: error.message || t('auth.tryAgainLater', {
          defaultValue: "Une erreur inattendue s'est produite. Veuillez réessayer."
        }),
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, signIn, toast, t, validateForm]);

  /**
   * Gestion de l'inscription
   */
  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: t('auth.validationError', { defaultValue: "Erreur de validation" }),
        description: t('auth.fixErrors', { defaultValue: "Veuillez corriger les erreurs dans le formulaire." }),
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
          }
        }
      });
      
      if (error) {
        let errorMessage = t('auth.registrationFailed', {
          defaultValue: "Une erreur est survenue lors de l'inscription."
        });
        
        if (error.message.includes('already registered')) {
          errorMessage = t('auth.emailAlreadyExists', {
            defaultValue: "Un compte existe déjà avec cette adresse email."
          });
        } else if (error.message.includes('Password should be')) {
          errorMessage = t('auth.passwordTooWeak', {
            defaultValue: "Le mot de passe est trop faible. Utilisez au moins 6 caractères."
          });
        }
        
        toast({
          variant: 'destructive',
          title: t('auth.registrationError', { defaultValue: "Erreur d'inscription" }),
          description: errorMessage,
        });
      } else {
        setRegisteredEmail(formData.email.trim());
        setShowEmailConfirmationDialog(true);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('auth.registrationError', { defaultValue: "Erreur d'inscription" }),
        description: t('auth.unexpectedError', {
          defaultValue: "Une erreur inattendue est survenue."
        }),
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, signUp, toast, t, validateForm]);

  /**
   * Gestion de la récupération de mot de passe
   */
  const handleForgotPassword = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(formData.email.trim());
      
      if (error) {
        toast({
          variant: 'destructive',
          title: t('auth.resetError', { defaultValue: "Erreur de réinitialisation" }),
          description: error.message || t('auth.resetFailed', {
            defaultValue: "Impossible d'envoyer l'email de réinitialisation."
          }),
        });
      } else {
        setResetEmailSent(true);
        setResetCountdown(60);
        
        toast({
          title: t('auth.emailSentTitle', { defaultValue: "Email envoyé" }),
          description: t('auth.passwordResetEmailSent', {
            defaultValue: "Un email contenant les instructions de réinitialisation a été envoyé."
          }),
          duration: 6000,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('auth.unexpectedError', { defaultValue: "Erreur inattendue" }),
        description: t('auth.tryAgainLater', {
          defaultValue: "Une erreur inattendue s'est produite. Veuillez réessayer."
        }),
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData.email, resetPassword, toast, t, validateForm]);

  /**
   * Renvoyer l'email de réinitialisation
   */
  const handleResendReset = useCallback(async () => {
    if (resetCountdown > 0) return;
    
    setResetCountdown(60);
    await handleForgotPassword(new Event('submit'));
  }, [resetCountdown, handleForgotPassword]);

  /**
   * Gestion du renvoi de l'email de confirmation
   */
  const handleResendConfirmationEmail = useCallback(async () => {
    if (!registeredEmail) return;

    try {
      const { error } = await signUp({
        email: registeredEmail,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
          }
        }
      });

      if (!error) {
        toast({
          title: t('auth.confirmationEmailResent', { defaultValue: "Email de confirmation renvoyé" }),
          description: t('auth.checkEmailAgain', {
            defaultValue: "Vérifiez à nouveau votre boîte de réception."
          }),
        });
      }
    } catch (error) {
      console.error('Erreur lors du renvoi:', error);
    }
  }, [registeredEmail, signUp, formData, toast, t]);

  /**
   * Réinitialiser le formulaire
   */
  const resetForm = useCallback(() => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      confirmPassword: ''
    });
    setValidationErrors({});
    setResetEmailSent(false);
    setShowPassword(false);
  }, []);

  /**
   * Changer de mode d'authentification
   */
  const switchMode = useCallback((newMode) => {
    resetForm();
    setAuthMode(newMode);
    
    // Mise à jour de l'URL
    if (newMode === 'register') navigate('/register', { replace: true });
    else if (newMode === 'forgot-password') navigate('/forgot-password', { replace: true });
    else navigate('/login', { replace: true });
  }, [navigate, resetForm]);

  /**
   * Déterminer si le formulaire est valide pour la soumission
   */
  const isFormValid = useMemo(() => {
    const { email, password, firstName, lastName } = formData;
    
    if (authMode === 'login') {
      return email.trim() && password.trim() && Object.keys(validationErrors).length === 0;
    } else if (authMode === 'register') {
      return email.trim() && password.trim() && firstName.trim() && lastName.trim() && 
             Object.keys(validationErrors).length === 0;
    } else if (authMode === 'forgot-password') {
      return email.trim() && Object.keys(validationErrors).length === 0;
    }
    
    return false;
  }, [formData, authMode, validationErrors]);

  /**
   * Configuration des animations
   */
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { delay: 0.2, duration: 0.4 } }
  };

  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } }
  };

  // Écran de chargement initial
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            {t('auth.loading', { defaultValue: "Chargement..." })}
          </p>
        </motion.div>
      </div>
    );
  }

  // Redirection en cours
  if (user && !authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            {t('auth.redirecting', { defaultValue: "Redirection..." })}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Arrière-plan décoratif */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl" />
      </div>

      {/* Contrôles thème et langue */}
      <motion.div 
        className="absolute top-4 right-4 flex gap-2 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="backdrop-blur-md bg-white/10 dark:bg-gray-800/10 border border-white/20 dark:border-gray-700/20 rounded-xl p-2">
          <div className="flex gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </motion.div>

      {/* Contenu principal */}
      <div className="flex min-h-screen items-center justify-center p-4 relative z-10">
        <motion.div
          className="w-full max-w-md"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Logo et titre */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-2xl mb-6 relative"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <span className="text-white font-bold text-3xl">CK</span>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-yellow-800" />
              </div>
            </motion.div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
              CassKai
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {t('auth.tagline', { defaultValue: "Votre solution de gestion d'entreprise" })}
            </p>
          </motion.div>

          {/* Carte du formulaire */}
          <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
          >
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 border-0 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {authMode === 'login' && (
                      <>
                        <User className="inline-block w-6 h-6 mr-2 mb-1" />
                        {t('auth.loginTitle', { defaultValue: "Connexion" })}
                      </>
                    )}
                    {authMode === 'register' && (
                      <>
                        <UserPlus className="inline-block w-6 h-6 mr-2 mb-1" />
                        {t('auth.createAccount', { defaultValue: "Créer un compte" })}
                      </>
                    )}
                    {authMode === 'forgot-password' && (
                      <>
                        <Shield className="inline-block w-6 h-6 mr-2 mb-1" />
                        {t('auth.forgotPasswordTitle', { defaultValue: "Récupération" })}
                      </>
                    )}
                  </CardTitle>
                  
                  <p className="text-gray-600 dark:text-gray-400">
                    {authMode === 'login' && t('auth.loginSubtitle', { 
                      defaultValue: "Connectez-vous pour accéder à votre espace" 
                    })}
                    {authMode === 'register' && t('auth.registerSubtitle', { 
                      defaultValue: "Rejoignez CassKai et gérez votre entreprise" 
                    })}
                    {authMode === 'forgot-password' && !resetEmailSent && t('auth.forgotPasswordSubtitle', { 
                      defaultValue: "Saisissez votre email pour réinitialiser votre mot de passe" 
                    })}
                    {authMode === 'forgot-password' && resetEmailSent && t('auth.checkYourEmail', { 
                      defaultValue: "Vérifiez votre boîte de réception" 
                    })}
                  </p>
                </motion.div>
              </CardHeader>

              <CardContent>
                <AnimatePresence mode="wait">
                  {/* Formulaire de connexion */}
                  {authMode === 'login' && (
                    <motion.form
                      key="login-form"
                      onSubmit={handleLogin}
                      className="space-y-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {t('auth.email', { defaultValue: "Adresse email" })}
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <motion.div variants={inputVariants} whileFocus="focus">
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className={`pl-11 h-12 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                              placeholder={t('auth.emailPlaceholder', { defaultValue: "exemple@email.com" })}
                              disabled={isLoading}
                              autoComplete="email"
                              aria-describedby={validationErrors.email ? "email-error" : undefined}
                            />
                          </motion.div>
                        </div>
                        {validationErrors.email && (
                          <motion.p 
                            id="email-error"
                            className="text-sm text-red-600 dark:text-red-400 flex items-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {validationErrors.email}
                          </motion.p>
                        )}
                      </div>

                      {/* Mot de passe */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {t('auth.password', { defaultValue: "Mot de passe" })}
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <motion.div variants={inputVariants} whileFocus="focus">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={(e) => handleInputChange('password', e.target.value)}
                              className={`pl-11 pr-12 h-12 ${validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                              placeholder={t('auth.passwordPlaceholder', { defaultValue: "••••••••" })}
                              disabled={isLoading}
                              autoComplete="current-password"
                              aria-describedby={validationErrors.password ? "password-error" : undefined}
                            />
                          </motion.div>
                          <motion.button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            onClick={togglePasswordVisibility}
                            disabled={isLoading}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={showPassword ? t('auth.hidePassword', { defaultValue: "Masquer le mot de passe" }) : t('auth.showPassword', { defaultValue: "Afficher le mot de passe" })}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </motion.button>
                        </div>
                        {validationErrors.password && (
                          <motion.p 
                            id="password-error"
                            className="text-sm text-red-600 dark:text-red-400 flex items-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {validationErrors.password}
                          </motion.p>
                        )}
                      </div>

                      {/* Bouton de connexion */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
                          disabled={isLoading || !isFormValid}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              {t('auth.signingIn', { defaultValue: "Connexion..." })}
                            </>
                          ) : (
                            <>
                              <User className="mr-2 h-5 w-5" />
                              {t('auth.loginButton', { defaultValue: "Se connecter" })}
                            </>
                          )}
                        </Button>
                      </motion.div>

                      {/* Lien mot de passe oublié */}
                      <div className="text-center">
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
                          onClick={() => switchMode('forgot-password')}
                          disabled={isLoading}
                        >
                          {t('auth.forgotPassword', { defaultValue: "Mot de passe oublié ?" })}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* Formulaire d'inscription */}
                  {authMode === 'register' && (
                    <motion.form
                      key="register-form"
                      onSubmit={handleRegister}
                      className="space-y-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Prénom et Nom */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {t('auth.firstName', { defaultValue: "Prénom" })}
                          </Label>
                          <motion.div variants={inputVariants} whileFocus="focus">
                            <Input
                              id="firstName"
                              type="text"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              className={`h-12 ${validationErrors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
                              placeholder={t('auth.firstNamePlaceholder', { defaultValue: "Jean" })}
                              disabled={isLoading}
                              autoComplete="given-name"
                              aria-describedby={validationErrors.firstName ? "firstName-error" : undefined}
                            />
                          </motion.div>
                          {validationErrors.firstName && (
                            <motion.p 
                              id="firstName-error"
                              className="text-sm text-red-600 dark:text-red-400 flex items-center"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              {validationErrors.firstName}
                            </motion.p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {t('auth.lastName', { defaultValue: "Nom" })}
                          </Label>
                          <motion.div variants={inputVariants} whileFocus="focus">
                            <Input
                              id="lastName"
                              type="text"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              className={`h-12 ${validationErrors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
                              placeholder={t('auth.lastNamePlaceholder', { defaultValue: "Dupont" })}
                              disabled={isLoading}
                              autoComplete="family-name"
                              aria-describedby={validationErrors.lastName ? "lastName-error" : undefined}
                            />
                          </motion.div>
                          {validationErrors.lastName && (
                            <motion.p 
                              id="lastName-error"
                              className="text-sm text-red-600 dark:text-red-400 flex items-center"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              {validationErrors.lastName}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {t('auth.email', { defaultValue: "Adresse email" })}
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <motion.div variants={inputVariants} whileFocus="focus">
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className={`pl-11 h-12 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                              placeholder={t('auth.emailPlaceholder', { defaultValue: "exemple@email.com" })}
                              disabled={isLoading}
                              autoComplete="email"
                              aria-describedby={validationErrors.email ? "email-error" : undefined}
                            />
                          </motion.div>
                        </div>
                        {validationErrors.email && (
                          <motion.p 
                            id="email-error"
                            className="text-sm text-red-600 dark:text-red-400 flex items-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {validationErrors.email}
                          </motion.p>
                        )}
                      </div>

                      {/* Mot de passe */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {t('auth.password', { defaultValue: "Mot de passe" })}
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <motion.div variants={inputVariants} whileFocus="focus">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={formData.password}
                              onChange={(e) => handleInputChange('password', e.target.value)}
                              className={`pl-11 pr-12 h-12 ${validationErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                              placeholder={t('auth.passwordPlaceholder', { defaultValue: "••••••••" })}
                              disabled={isLoading}
                              autoComplete="new-password"
                              aria-describedby={validationErrors.password ? "password-error" : undefined}
                            />
                          </motion.div>
                          <motion.button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            onClick={togglePasswordVisibility}
                            disabled={isLoading}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={showPassword ? t('auth.hidePassword', { defaultValue: "Masquer le mot de passe" }) : t('auth.showPassword', { defaultValue: "Afficher le mot de passe" })}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </motion.button>
                        </div>
                        {validationErrors.password && (
                          <motion.p 
                            id="password-error"
                            className="text-sm text-red-600 dark:text-red-400 flex items-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {validationErrors.password}
                          </motion.p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('auth.passwordHint', { defaultValue: "Minimum 6 caractères" })}
                        </p>
                      </div>

                      {/* Confirmation mot de passe */}
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {t('auth.confirmPassword', { defaultValue: "Confirmer le mot de passe" })}
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <motion.div variants={inputVariants} whileFocus="focus">
                            <Input
                              id="confirmPassword"
                              type={showPassword ? "text" : "password"}
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                              className={`pl-11 h-12 ${validationErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                              placeholder={t('auth.passwordPlaceholder', { defaultValue: "••••••••" })}
                              disabled={isLoading}
                              autoComplete="new-password"
                              aria-describedby={validationErrors.confirmPassword ? "confirmPassword-error" : undefined}
                            />
                          </motion.div>
                        </div>
                        {validationErrors.confirmPassword && (
                          <motion.p 
                            id="confirmPassword-error"
                            className="text-sm text-red-600 dark:text-red-400 flex items-center"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {validationErrors.confirmPassword}
                          </motion.p>
                        )}
                      </div>

                      {/* Bouton d'inscription */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold shadow-lg"
                          disabled={isLoading || !isFormValid}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              {t('auth.creating', { defaultValue: "Création..." })}
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-5 w-5" />
                              {t('auth.createAccountButton', { defaultValue: "Créer mon compte" })}
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </motion.form>
                  )}

                  {/* Formulaire mot de passe oublié */}
                  {authMode === 'forgot-password' && (
                    <motion.div
                      key="forgot-password-form"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {!resetEmailSent ? (
                        <form onSubmit={handleForgotPassword} className="space-y-6">
                          {/* Email */}
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {t('auth.email', { defaultValue: "Adresse email" })}
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                              <motion.div variants={inputVariants} whileFocus="focus">
                                <Input
                                  id="email"
                                  type="email"
                                  value={formData.email}
                                  onChange={(e) => handleInputChange('email', e.target.value)}
                                  className={`pl-11 h-12 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder={t('auth.emailPlaceholder', { defaultValue: "exemple@email.com" })}
                                  disabled={isLoading}
                                  autoComplete="email"
                                  autoFocus
                                  aria-describedby={validationErrors.email ? "email-error" : undefined}
                                />
                              </motion.div>
                            </div>
                            {validationErrors.email && (
                              <motion.p 
                                id="email-error"
                                className="text-sm text-red-600 dark:text-red-400 flex items-center"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                {validationErrors.email}
                              </motion.p>
                            )}
                          </div>

                          {/* Bouton d'envoi */}
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              type="submit"
                              className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold shadow-lg"
                              disabled={isLoading || !isFormValid}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  {t('auth.sending', { defaultValue: "Envoi..." })}
                                </>
                              ) : (
                                <>
                                  <Mail className="mr-2 h-5 w-5" />
                                  {t('auth.sendResetEmail', { defaultValue: "Envoyer le lien" })}
                                </>
                              )}
                            </Button>
                          </motion.div>

                          {/* Retour à la connexion */}
                          <div className="text-center">
                            <button
                              type="button"
                              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors font-medium inline-flex items-center"
                              onClick={() => switchMode('login')}
                              disabled={isLoading}
                            >
                              <ArrowLeft className="w-4 h-4 mr-1" />
                              {t('auth.backToLogin', { defaultValue: "Retour à la connexion" })}
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Confirmation d'envoi de l'email */
                        <motion.div 
                          className="text-center space-y-6"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                            className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
                          >
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                          </motion.div>

                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {t('auth.emailSentTitle', { defaultValue: 'Email envoyé !' })}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {t('auth.passwordResetEmailSentDetail', { 
                                defaultValue: 'Nous avons envoyé un lien de réinitialisation à' 
                              })}
                            </p>
                            <p className="font-medium text-blue-600 dark:text-blue-400 break-all">
                              {formData.email}
                            </p>
                          </div>

                          {/* Note importante */}
                          <motion.div 
                            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                          >
                            <div className="flex items-start space-x-3">
                              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                <p className="font-medium">
                                  {t('auth.importantNote', { defaultValue: 'Note importante :' })}
                                </p>
                                <ul className="space-y-1 text-xs">
                                  <li>• {t('auth.checkSpamFolder', { defaultValue: 'Vérifiez votre dossier spam/courrier indésirable' })}</li>
                                  <li>• {t('auth.linkExpires', { defaultValue: 'Le lien expire dans 24 heures' })}</li>
                                  <li>• {t('auth.contactSupport', { defaultValue: 'Contactez le support si vous ne recevez rien' })}</li>
                                </ul>
                              </div>
                            </div>
                          </motion.div>

                          {/* Actions */}
                          <div className="space-y-3">
                            <Button 
                              onClick={handleResendReset}
                              disabled={resetCountdown > 0}
                              variant="outline"
                              className="w-full"
                            >
                              {resetCountdown > 0 ? (
                                t('auth.resendInSeconds', { 
                                  defaultValue: `Renvoyer dans ${resetCountdown}s`,
                                  seconds: resetCountdown 
                                })
                              ) : (
                                t('auth.resendEmail', { defaultValue: 'Renvoyer l\'email' })
                              )}
                            </Button>

                            <button
                              type="button"
                              className="w-full text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors font-medium inline-flex items-center justify-center py-2"
                              onClick={() => switchMode('login')}
                            >
                              <ArrowLeft className="w-4 h-4 mr-1" />
                              {t('auth.backToLogin', { defaultValue: 'Retour à la connexion' })}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation entre les modes */}
                {authMode !== 'forgot-password' && (
                  <motion.div 
                    className="mt-6 text-center space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          {t('auth.or', { defaultValue: 'ou' })}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {authMode === 'login' ? (
                        <>
                          {t('auth.noAccount', { defaultValue: "Vous n'avez pas de compte ?" })}
                          {" "}
                          <button
                            className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            onClick={() => switchMode('register')}
                            disabled={isLoading}
                          >
                            {t('auth.goToRegister', { defaultValue: "Créer un compte" })}
                          </button>
                        </>
                      ) : (
                        <>
                          {t('auth.hasAccount', { defaultValue: "Vous avez déjà un compte ?" })}
                          {" "}
                          <button
                            className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            onClick={() => switchMode('login')}
                            disabled={isLoading}
                          >
                            {t('auth.goToLogin', { defaultValue: "Se connecter" })}
                          </button>
                        </>
                      )}
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer légal */}
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
              {t('auth.termsText', { defaultValue: "En utilisant CassKai, vous acceptez nos" })}
              {" "}
              <Link 
                to="/terms" 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline"
              >
                {t('auth.termsLink', { defaultValue: "conditions d'utilisation" })}
              </Link>
              {" "}{t('auth.and', { defaultValue: "et notre" })}{" "}
              <Link 
                to="/privacy" 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline"
              >
                {t('auth.privacyLink', { defaultValue: "politique de confidentialité" })}
              </Link>
              .
            </p>
            
            <motion.p 
              className="text-xs text-gray-400 dark:text-gray-500 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              © {new Date().getFullYear()} CassKai. {t('auth.allRightsReserved', { defaultValue: 'Tous droits réservés' })}.
            </motion.p>
          </motion.div>

          {/* Indicateurs de fonctionnalités */}
          <motion.div 
            className="mt-8 grid grid-cols-3 gap-4 max-w-sm mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {[
              { 
                icon: Building, 
                text: t('auth.enterprise', { defaultValue: 'Entreprise' }),
                color: 'text-blue-500'
              },
              { 
                icon: Shield, 
                text: t('auth.secure', { defaultValue: 'Sécurisé' }),
                color: 'text-green-500'
              },
              { 
                icon: Users, 
                text: t('auth.collaborative', { defaultValue: 'Collaboratif' }),
                color: 'text-purple-500'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className={`mx-auto w-8 h-8 ${feature.color} mb-2 flex items-center justify-center`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {feature.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Dialog de confirmation d'email */}
      <EmailConfirmationDialog
        isOpen={showEmailConfirmationDialog}
        onClose={() => setShowEmailConfirmationDialog(false)}
        email={registeredEmail}
        onResendEmail={handleResendConfirmationEmail}
      />
    </div>
  );
}