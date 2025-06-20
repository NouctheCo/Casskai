import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ✅ AMÉLIORATION: Schema de validation avec traductions dynamiques
  const formSchema = useMemo(() => z.object({
    firstName: z.string()
      .min(2, t('signup.firstNameTooShort', { defaultValue: 'Le prénom doit contenir au moins 2 caractères' }))
      .max(50, t('signup.firstNameTooLong', { defaultValue: 'Le prénom ne peut pas dépasser 50 caractères' }))
      .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, t('signup.invalidFirstName', { defaultValue: 'Le prénom contient des caractères invalides' })),
    lastName: z.string()
      .min(2, t('signup.lastNameTooShort', { defaultValue: 'Le nom doit contenir au moins 2 caractères' }))
      .max(50, t('signup.lastNameTooLong', { defaultValue: 'Le nom ne peut pas dépasser 50 caractères' }))
      .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, t('signup.invalidLastName', { defaultValue: 'Le nom contient des caractères invalides' })),
    email: z.string()
      .email(t('signup.invalidEmail', { defaultValue: 'Adresse email invalide' }))
      .min(1, t('signup.emailRequired', { defaultValue: 'L\'email est requis' })),
    password: z.string()
      .min(8, t('signup.passwordTooShort', { defaultValue: 'Le mot de passe doit contenir au moins 8 caractères' }))
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t('signup.passwordWeak', { 
        defaultValue: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre' 
      })),
    confirmPassword: z.string()
      .min(1, t('signup.confirmPasswordRequired', { defaultValue: 'Veuillez confirmer votre mot de passe' })),
    companyName: z.string().optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('signup.passwordsDoNotMatch', { defaultValue: 'Les mots de passe ne correspondent pas' }),
    path: ['confirmPassword'],
  }), [t]);

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
    },
  });

  // ✅ OPTIMISATION: Mémoriser les gestionnaires d'événements
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // ✅ AMÉLIORATION: Gestion d'erreurs plus robuste avec gestion spécifique des limites de taux
  const onSubmit = useCallback(async (values: FormValues) => {
    if (isLoading) return; // Éviter les soumissions multiples

    try {
      setIsLoading(true);
      
      // Validation supplémentaire côté client
      if (values.password !== values.confirmPassword) {
        toast({
          variant: 'destructive',
          title: t('signup.validationError', { defaultValue: 'Erreur de validation' }),
          description: t('signup.passwordsDoNotMatch', { defaultValue: 'Les mots de passe ne correspondent pas' }),
        });
        return;
      }
      
      // Préparer les métadonnées utilisateur
      const signUpData = {
        email: values.email.trim().toLowerCase(),
        password: values.password,
        options: {
          data: {
            first_name: values.firstName.trim(),
            last_name: values.lastName.trim(),
            full_name: `${values.firstName.trim()} ${values.lastName.trim()}`,
            display_name: `${values.firstName.trim()} ${values.lastName.trim()}`,
            company_name: values.companyName?.trim() || null,
          }
        }
      };
      
      const { error, data } = await signUp(signUpData);
      
      if (error) {
        // ✅ Gestion spécifique de l'erreur de limite de taux d'email
        if (error.message?.includes('over_email_send_rate_limit') || error.message?.includes('email rate limit exceeded')) {
          toast({
            variant: 'destructive',
            title: t('signup.rateLimitTitle', { defaultValue: 'Limite d\'envoi d\'emails atteinte' }),
            description: t('signup.rateLimitMessage', { 
              defaultValue: 'Trop de tentatives d\'inscription récentes. Veuillez patienter quelques minutes avant de réessayer ou utilisez une autre adresse email.' 
            }),
          });
        }
        // ✅ Gestion d'erreurs spécifiques existantes
        else if (error.message?.includes('User already registered')) {
          toast({
            variant: 'destructive',
            title: t('signup.emailAlreadyExists', { defaultValue: 'Email déjà utilisé' }),
            description: t('signup.emailAlreadyExistsMessage', { 
              defaultValue: 'Cette adresse email est déjà associée à un compte. Essayez de vous connecter.' 
            }),
          });
        } else if (error.message?.includes('Password should be')) {
          toast({
            variant: 'destructive',
            title: t('signup.weakPassword', { defaultValue: 'Mot de passe trop faible' }),
            description: t('signup.passwordRequirements', { 
              defaultValue: 'Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres.' 
            }),
          });
        } else if (error.message?.includes('Invalid email')) {
          toast({
            variant: 'destructive',
            title: t('signup.invalidEmail', { defaultValue: 'Email invalide' }),
            description: t('signup.invalidEmailMessage', { 
              defaultValue: 'Veuillez vérifier le format de votre adresse email.' 
            }),
          });
        } else {
          toast({
            variant: 'destructive',
            title: t('signup.signupError', { defaultValue: 'Erreur lors de la création du compte' }),
            description: error.message || t('signup.signupFailed', { 
              defaultValue: 'Échec de la création du compte. Veuillez réessayer.' 
            }),
          });
        }
        return;
      }
      
      // ✅ Succès avec message personnalisé selon le type d'inscription
      if (data?.user?.email_confirmed_at) {
        // Compte confirmé immédiatement
        toast({
          title: t('signup.accountCreatedTitle', { defaultValue: 'Compte créé avec succès !' }),
          description: t('signup.accountCreatedNoConfirm', { 
            defaultValue: 'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.' 
          }),
        });
      } else {
        // Confirmation par email requise
        toast({
          title: t('signup.accountCreatedTitle', { defaultValue: 'Compte créé avec succès !' }),
          description: t('signup.accountCreatedMessage', { 
            defaultValue: 'Un email de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception.' 
          }),
        });
      }
      
      // Redirection avec message
      navigate('/auth?message=signup_complete', { replace: true });
      
    } catch (error) {
      console.error('Signup error:', error);
      
      // ✅ Gestion spécifique des erreurs de réseau et de limite de taux dans le catch
      if (error instanceof Error) {
        if (error.message?.includes('over_email_send_rate_limit') || error.message?.includes('email rate limit exceeded')) {
          toast({
            variant: 'destructive',
            title: t('signup.rateLimitTitle', { defaultValue: 'Limite d\'envoi d\'emails atteinte' }),
            description: t('signup.rateLimitMessage', { 
              defaultValue: 'Trop de tentatives d\'inscription récentes. Veuillez patienter quelques minutes avant de réessayer ou utilisez une autre adresse email.' 
            }),
          });
        } else {
          toast({
            variant: 'destructive',
            title: t('signup.unexpectedError', { defaultValue: 'Erreur inattendue' }),
            description: error.message || t('signup.tryAgainLater', { 
              defaultValue: 'Une erreur inattendue s\'est produite. Veuillez réessayer.' 
            }),
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: t('signup.unexpectedError', { defaultValue: 'Erreur inattendue' }),
          description: t('signup.tryAgainLater', { 
            defaultValue: 'Une erreur inattendue s\'est produite. Veuillez réessayer.' 
          }),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, signUp, t, toast, navigate]);

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('signup.firstName', { defaultValue: 'Prénom' })}
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('signup.firstNamePlaceholder', { defaultValue: 'Jean' })}
                      autoComplete="given-name"
                      disabled={isLoading}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('signup.lastName', { defaultValue: 'Nom' })}
                    <span className="text-red-500 ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('signup.lastNamePlaceholder', { defaultValue: 'Dupont' })}
                      autoComplete="family-name"
                      disabled={isLoading}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('signup.emailAddress', { defaultValue: 'Adresse email' })}
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t('signup.emailPlaceholder', { defaultValue: 'exemple@entreprise.com' })}
                    type="email" 
                    autoComplete="email"
                    disabled={isLoading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('signup.companyNameOptional', { defaultValue: 'Nom de l\'entreprise (optionnel)' })}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t('signup.companyNamePlaceholder', { defaultValue: 'Ma Super Entreprise' })}
                    autoComplete="organization"
                    disabled={isLoading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('signup.password', { defaultValue: 'Mot de passe' })}
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={isLoading}
                      {...field} 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full aspect-square" 
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                      aria-label={showPassword ? 
                        t('signup.hidePassword', { defaultValue: 'Masquer le mot de passe' }) : 
                        t('signup.showPassword', { defaultValue: 'Afficher le mot de passe' })
                      }
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  {t('signup.passwordHelp', { 
                    defaultValue: 'Au moins 8 caractères avec majuscules, minuscules et chiffres' 
                  })}
                </p>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('signup.confirmPassword', { defaultValue: 'Confirmer le mot de passe' })}
                  <span className="text-red-500 ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="••••••••" 
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={isLoading}
                      {...field} 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full aspect-square" 
                      onClick={toggleConfirmPasswordVisibility}
                      disabled={isLoading}
                      aria-label={showConfirmPassword ? 
                        t('signup.hidePassword', { defaultValue: 'Masquer le mot de passe' }) : 
                        t('signup.showPassword', { defaultValue: 'Afficher le mot de passe' })
                      }
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground" 
            disabled={isLoading || !form.formState.isValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('signup.creatingAccount', { defaultValue: 'Création en cours...' })}
              </>
            ) : (
              t('signup.createAccount', { defaultValue: 'Créer mon compte' })
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}