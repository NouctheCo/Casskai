import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react'; 

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ OPTIMISATION: Mémoriser les gestionnaires pour éviter les re-créations
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
  }, []);

  // ✅ AMÉLIORATION: Gestion des messages URL avec cleanup automatique
  useEffect(() => {
    const message = searchParams.get('message');
    
    if (message === 'signup_complete') {
      toast({
        title: t('auth.signupCompleteTitle', {defaultValue: "Inscription réussie !"}),
        description: t('auth.loginPromptAfterSignup', {
          defaultValue: "Veuillez vous connecter avec votre nouveau compte. Si une confirmation par email est requise, consultez votre boîte de réception."
        }),
        duration: 7000,
      });
    } else if (message === 'email_confirmed') {
      toast({
        title: t('auth.emailConfirmedTitle', {defaultValue: "Email confirmé !"}),
        description: t('auth.emailConfirmedMessage', {
          defaultValue: "Votre email a été confirmé. Vous pouvez maintenant vous connecter."
        }),
        duration: 7000,
      });
    }

    // ✅ AMÉLIORATION: Gestion des erreurs d'authentification depuis l'URL
    const hash = window.location.hash;
    if (hash.includes('error_description')) {
      const params = new URLSearchParams(hash.substring(1)); 
      const errorDescription = params.get('error_description');
      if (errorDescription) {
        toast({
          variant: 'destructive',
          title: t('auth.authErrorTitle', {defaultValue: "Erreur d'authentification"}),
          description: decodeURIComponent(errorDescription.replace(/\+/g, ' ')),
          duration: 9000,
        });
      }
    }

    // ✅ Nettoyage des paramètres URL après traitement
    if (message || hash.includes('error_description')) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('message');
      setSearchParams(newSearchParams);
      
      if (hash.includes('error_description')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

  }, [searchParams, setSearchParams, toast, t]);

  // ✅ Redirection automatique si utilisateur connecté
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // ✅ AMÉLIORATION: Gestion d'erreurs plus robuste pour la connexion
  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        variant: 'destructive',
        title: t('auth.validationError', {defaultValue: "Erreur de validation"}),
        description: t('auth.fillAllFields', {defaultValue: "Veuillez remplir tous les champs."}),
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error, data } = await signIn({ email: email.trim(), password });
      
      if (error) {
        // ✅ Gestion d'erreurs spécifiques
        if (error.message === 'Email not confirmed') {
          toast({
            variant: 'destructive',
            title: t('auth.emailNotConfirmedTitle', {defaultValue: "Email non confirmé"}),
            description: t('auth.emailNotConfirmedMessage', {
              defaultValue: "Veuillez vérifier votre boîte de réception pour confirmer votre adresse email avant de vous connecter."
            }),
          });
        } else if (error.message === 'Invalid login credentials') {
          toast({
            variant: 'destructive',
            title: t('auth.invalidCredentialsTitle', {defaultValue: "Identifiants invalides"}),
            description: t('auth.invalidCredentialsMessage', {
              defaultValue: "Email ou mot de passe incorrect. Veuillez vérifier vos informations."
            }),
          });
        } else if (error.message.includes('Too many requests')) {
          toast({
            variant: 'destructive',
            title: t('auth.tooManyAttemptsTitle', {defaultValue: "Trop de tentatives"}),
            description: t('auth.tooManyAttemptsMessage', {
              defaultValue: "Trop de tentatives de connexion. Veuillez patienter avant de réessayer."
            }),
          });
        } else {
          toast({
            variant: 'destructive',
            title: t('auth.loginError', {defaultValue: "Erreur de connexion"}),
            description: error.message || t('auth.loginFailed', {
              defaultValue: "Échec de la connexion. Veuillez vérifier vos identifiants."
            }),
          });
        }
      } else if (data.user) {
        toast({
          title: t('auth.loginSuccessTitle', {defaultValue: "Connexion réussie"}),
          description: t('auth.loginSuccessMessage', {defaultValue: "Bienvenue ! Redirection en cours..."}),
        });
        // La redirection sera gérée par l'useEffect
      } else {
        throw new Error(t('auth.loginFailed', {
          defaultValue: "Échec de la connexion. Veuillez vérifier vos identifiants."
        }));
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('auth.unexpectedError', {defaultValue: "Erreur inattendue"}),
        description: error.message || t('auth.tryAgainLater', {
          defaultValue: "Une erreur inattendue s'est produite. Veuillez réessayer."
        }),
      });
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signIn, toast, t]);

  // ✅ OPTIMISATION: Mémoriser les composants de chargement
  const LoadingScreen = useMemo(() => (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          {t('auth.loading', {defaultValue: "Chargement..."})}
        </p>
      </div>
    </div>
  ), [t]);

  // ✅ États de chargement et redirection
  if (authLoading && !user) { 
    return LoadingScreen;
  }
  
  if (user && !authLoading) return null; 

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <motion.div 
        className="absolute top-4 right-4 flex gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <LanguageToggle />
        <ThemeToggle />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <div className="h-16 w-16 mx-auto font-bold text-3xl text-primary flex items-center justify-center rounded-lg bg-primary/10">
                CK
              </div>
            </div>
            <CardTitle className="text-3xl font-bold gradient-text">
              {t('auth.appName', {defaultValue: "CassKai"})}
            </CardTitle>
            <CardDescription>
              {t('auth.loginToAccount', {defaultValue: "Connectez-vous à votre compte"})}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('auth.emailAddress', {defaultValue: "Adresse email"})}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder', {defaultValue: "exemple@email.com"})}
                  value={email}
                  onChange={handleEmailChange}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {t('auth.password', {defaultValue: "Mot de passe"})}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-0 top-0 h-full aspect-square" 
                    onClick={togglePasswordVisibility} 
                    disabled={isLoading}
                    aria-label={showPassword ? 
                      t('auth.hidePassword', {defaultValue: "Masquer le mot de passe"}) : 
                      t('auth.showPassword', {defaultValue: "Afficher le mot de passe"})
                    }
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground" 
                disabled={isLoading || !email.trim() || !password.trim()}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('auth.login', {defaultValue: "Se connecter"})}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.dontHaveAccount', {defaultValue: "Vous n'avez pas de compte ?"})}{' '}
                <Link 
                  to="/signup" 
                  className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  {t('auth.createAccount', {defaultValue: "Créer un compte"})}
                </Link>
              </p>

              <p className="mt-4 text-sm text-muted-foreground">
                <Link 
                  to="/forgot-password" 
                  className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  {t('auth.forgotPassword', {defaultValue: "Mot de passe oublié ?"})}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.p 
        className="mt-8 text-center text-sm text-muted-foreground"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        © {new Date().getFullYear()} {t('auth.appName', {defaultValue: "CassKai"})}. {t('auth.allRightsReserved', {defaultValue: "Tous droits réservés"})}
      </motion.p>
    </div>
  );
}