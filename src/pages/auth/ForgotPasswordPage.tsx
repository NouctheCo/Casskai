import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { PageContainer } from '@/components/ui/PageContainer';
import { 
  Loader2, 
  ArrowLeft, 
  Mail, 
  CheckCircle, 
  AlertCircle,
  Send
} from 'lucide-react';

interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetPassword, user, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const [searchParams] = useSearchParams();

  // Redirection si utilisateur connecté
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Gestion des paramètres URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  // Gestion du countdown pour renvoyer l'email
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Validation de l'email
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, []);

  // Simulation de l'envoi d'email de réinitialisation
  const simulatePasswordReset = useCallback(async (email: string): Promise<ForgotPasswordResponse> => {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simuler différents scénarios
    const lowercaseEmail = email.toLowerCase().trim();
    
    if (lowercaseEmail.includes('notfound') || lowercaseEmail.includes('inexistant')) {
      return {
        success: false,
        error: 'Aucun compte n\'est associé à cette adresse email.'
      };
    }
    
    if (lowercaseEmail.includes('blocked') || lowercaseEmail.includes('suspend')) {
      return {
        success: false,
        error: 'Ce compte est temporairement suspendu. Contactez le support.'
      };
    }
    
    // Succès par défaut
    return {
      success: true,
      message: 'Un email de réinitialisation a été envoyé à votre adresse.'
    };
  }, []);

  // Gestion de la soumission du formulaire
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    
    // Validation côté client
    if (!trimmedEmail) {
      toast({
        variant: 'destructive',
        title: t('auth.validationError', { defaultValue: 'Erreur de validation' }),
        description: t('auth.emailRequired', { defaultValue: 'Veuillez saisir votre adresse email.' }),
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast({
        variant: 'destructive',
        title: t('auth.validationError', { defaultValue: 'Erreur de validation' }),
        description: t('auth.invalidEmailFormat', { defaultValue: 'Veuillez saisir une adresse email valide.' }),
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Utiliser l'API de réinitialisation réelle si disponible
      let result: ForgotPasswordResponse;
      
      if (resetPassword) {
        const { error } = await resetPassword(trimmedEmail);
        result = {
          success: !error,
          error: error?.message,
          message: error ? undefined : 'Un email de réinitialisation a été envoyé.'
        };
      } else {
        // Fallback vers la simulation
        result = await simulatePasswordReset(trimmedEmail);
      }

      if (result.success) {
        setEmailSent(true);
        setCountdown(60); // 60 secondes avant de pouvoir renvoyer
        
        toast({
          title: t('auth.emailSentTitle', { defaultValue: 'Email envoyé' }),
          description: result.message || t('auth.passwordResetEmailSent', { 
            defaultValue: 'Un email contenant les instructions de réinitialisation a été envoyé à votre adresse.' 
          }),
          duration: 6000,
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('auth.resetError', { defaultValue: 'Erreur de réinitialisation' }),
          description: result.error || t('auth.resetFailed', { 
            defaultValue: 'Impossible d\'envoyer l\'email de réinitialisation.' 
          }),
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        variant: 'destructive',
        title: t('auth.unexpectedError', { defaultValue: 'Erreur inattendue' }),
        description: t('auth.tryAgainLater', { 
          defaultValue: 'Une erreur inattendue s\'est produite. Veuillez réessayer.' 
        }),
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, validateEmail, resetPassword, simulatePasswordReset, toast, t]);

  // Renvoyer l'email
  const handleResendEmail = useCallback(async () => {
    if (countdown > 0) return;
    
    setCountdown(60);
    await handleSubmit(new Event('submit') as any);
  }, [countdown, handleSubmit]);

  // Écran de chargement
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t('auth.loading', { defaultValue: 'Chargement...' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer variant="auth" className="relative overflow-hidden">

      {/* Contrôles thème et langue */}
      <motion.div 
        className="absolute top-4 right-4 flex gap-2 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="glass-card p-2 rounded-xl">
          <div className="flex gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </motion.div>

      <div className="flex min-h-screen w-full relative z-10">
        {/* Côté gauche - Formulaire */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-md w-full"
          >
            {/* Logo et titre */}
            <div className="text-center mb-8">
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <span className="text-white font-bold text-2xl">CK</span>
              </motion.div>
              
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                <span className="gradient-text">
                  {t('auth.forgotPasswordTitle', { defaultValue: 'Mot de passe oublié ?' })}
                </span>
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400">
                {emailSent 
                  ? t('auth.checkYourEmail', { defaultValue: 'Vérifiez votre boîte de réception' })
                  : t('auth.forgotPasswordSubtitle', { defaultValue: 'Saisissez votre email pour recevoir un lien de réinitialisation' })
                }
              </p>
            </div>

            {/* Conteneur du formulaire avec glassmorphism */}
            <motion.div 
              className="glass-card p-8 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <AnimatePresence mode="wait">
                {!emailSent ? (
                  /* Formulaire de demande de réinitialisation */
                  <motion.form 
                    key="reset-form"
                    onSubmit={handleSubmit} 
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email" className="form-label">
                        {t('auth.emailAddress', { defaultValue: 'Adresse email' })}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          id="email"
                          type="email"
                          className="form-input pl-11"
                          placeholder={t('auth.emailPlaceholder', { defaultValue: 'exemple@email.com' })}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                    </div>

                    <motion.div className="space-y-4">
                      <Button 
                        type="submit" 
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={isLoading || !email.trim()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('auth.sending', { defaultValue: 'Envoi en cours...' })}
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            {t('auth.sendResetEmail', { defaultValue: 'Envoyer le lien de réinitialisation' })}
                          </>
                        )}
                      </Button>

                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        onClick={() => navigate('/login')}
                        disabled={isLoading}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('auth.backToLogin', { defaultValue: 'Retour à la connexion' })}
                      </Button>
                    </motion.div>
                  </motion.form>
                ) : (
                  /* Confirmation d'envoi */
                  <motion.div 
                    key="success-message"
                    className="text-center space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
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
                        {email}
                      </p>
                    </div>

                    <motion.div 
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
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

                    <div className="space-y-3">
                      <Button 
                        onClick={handleResendEmail}
                        disabled={countdown > 0}
                        variant="outline"
                        className="w-full"
                      >
                        {countdown > 0 ? (
                          t('auth.resendInSeconds', { 
                            defaultValue: `Renvoyer dans ${countdown}s`,
                            seconds: countdown 
                          })
                        ) : (
                          t('auth.resendEmail', { defaultValue: 'Renvoyer l\'email' })
                        )}
                      </Button>

                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        onClick={() => navigate('/login')}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('auth.backToLogin', { defaultValue: 'Retour à la connexion' })}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Liens additionnels */}
              {!emailSent && (
                <motion.div 
                  className="mt-6 text-center space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('auth.dontHaveAccount', { defaultValue: 'Vous n\'avez pas de compte ?' })} 
                    <Link 
                      to="/register" 
                      className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors ml-1"
                    >
                      {t('auth.createAccount', { defaultValue: 'Créer un compte' })}
                    </Link>
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Côté droit - Illustration */}
        <div className="hidden lg:block lg:flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
          
          <div className="flex items-center justify-center h-full p-12 relative z-10">
            <motion.div 
              className="text-white space-y-8 max-w-md"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div>
                <h2 className="text-4xl font-bold mb-4">
                  {t('auth.securityFirst', { defaultValue: 'Sécurité avant tout' })}
                </h2>
                <p className="text-blue-100 text-lg">
                  {t('auth.securityDescription', { 
                    defaultValue: 'Nous protégeons vos données avec les dernières technologies de sécurité' 
                  })}
                </p>
              </div>
              
              <div className="space-y-4">
                {[
                  { 
                    icon: '🔐', 
                    text: t('auth.encryptedData', { defaultValue: 'Données chiffrées de bout en bout' })
                  },
                  { 
                    icon: '🛡️', 
                    text: t('auth.secureReset', { defaultValue: 'Réinitialisation sécurisée par email' })
                  },
                  { 
                    icon: '⚡', 
                    text: t('auth.instantNotification', { defaultValue: 'Notification instantanée des tentatives' })
                  },
                  { 
                    icon: '✅', 
                    text: t('auth.trustedPlatform', { defaultValue: 'Plateforme de confiance certifiée' })
                  }
                ].map((feature, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">
                      {feature.icon}
                    </div>
                    <span className="text-lg">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
              
              <motion.div 
                className="pt-8 border-t border-white/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
              >
                <p className="text-blue-100 text-sm">
                  {t('auth.securityTip', { 
                    defaultValue: 'Conseil : Utilisez un gestionnaire de mots de passe pour des mots de passe uniques et sécurisés.' 
                  })}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <motion.p 
        className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        © {new Date().getFullYear()} {t('auth.appName', { defaultValue: 'CassKai' })}. {t('auth.allRightsReserved', { defaultValue: 'Tous droits réservés' })}
      </motion.p>
    </PageContainer>
  );
}