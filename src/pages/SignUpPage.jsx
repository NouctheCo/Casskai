import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { motion } from 'framer-motion';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ✅ Redirection si utilisateur déjà connecté
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // ✅ OPTIMISATION: Mémoriser le composant de chargement
  const LoadingScreen = useMemo(() => (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          {t('signup.loading', {defaultValue: "Chargement..."})}
        </p>
      </div>
    </div>
  ), [t]);

  // ✅ États de chargement et redirection
  if (authLoading) {
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
        className="w-full max-w-lg"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <div className="h-16 w-16 mx-auto font-bold text-3xl text-primary flex items-center justify-center rounded-lg bg-primary/10">
                CK
              </div>
            </div>
            <CardTitle className="text-3xl font-bold gradient-text">
              {t('signup.createAccountTitle', {defaultValue: "Créer un compte"})}
            </CardTitle>
            <CardDescription>
              {t('signup.createAccountDescription', {
                defaultValue: "Rejoignez CassKai pour gérer votre comptabilité"
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignUpForm />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('signup.alreadyHaveAccount', {defaultValue: "Vous avez déjà un compte ?"})}{' '}
                <Link 
                  to="/auth" 
                  className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  {t('signup.loginButton', {defaultValue: "Se connecter"})}
                </Link>
              </p>
              
              <p className="mt-4 text-xs text-muted-foreground">
                {t('signup.termsAgreement', {
                  defaultValue: "En créant un compte, vous acceptez nos"
                })}{' '}
                <Link 
                  to="/terms" 
                  className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  {t('signup.termsOfService', {defaultValue: "Conditions d'utilisation"})}
                </Link>
                {' '}{t('signup.and', {defaultValue: "et notre"})}{' '}
                <Link 
                  to="/privacy" 
                  className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  {t('signup.privacyPolicy', {defaultValue: "Politique de confidentialité"})}
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
        © {new Date().getFullYear()} {t('signup.appName', {defaultValue: "CassKai"})}. {t('signup.allRightsReserved', {defaultValue: "Tous droits réservés"})}
      </motion.p>
    </div>
  );
}