import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle,
  Sparkles,
  Rocket,
  Users,
  Settings,
  BarChart3,
  
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const completionSteps = [
  { id: 'profile', label: 'Profil utilisateur', duration: 1000 },
  { id: 'company', label: 'Configuration entreprise', duration: 1500 },
  { id: 'modules', label: 'Activation des modules', duration: 1200 },
  { id: 'preferences', label: 'Préférences utilisateur', duration: 800 },
  { id: 'security', label: 'Configuration sécurité', duration: 1000 },
  { id: 'finalization', label: 'Finalisation', duration: 500 }
];

const nextSteps = [
  {
    icon: BarChart3,
    title: 'Explorez votre Dashboard',
    description: 'Découvrez vos KPIs et métriques personnalisées',
    action: 'Voir le dashboard',
    path: '/dashboard'
  },
  {
    icon: Settings,
    title: 'Configurez vos paramètres',
    description: 'Personnalisez davantage votre expérience',
    action: 'Paramètres',
    path: '/settings'
  },
  {
    icon: Users,
    title: 'Invitez votre équipe',
    description: 'Collaborez avec vos collègues',
    action: 'Gestion utilisateurs',
    path: '/settings/users'
  }
];

export default function CompleteStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { companyData, modules } = useOnboarding();
  const { completeOnboarding } = useAuth();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processOnboarding = async () => {
      // Simuler le processus de configuration
      for (let i = 0; i < completionSteps.length; i++) {
        const step = completionSteps[i];
        setCurrentStep(i);
        
        await new Promise(resolve => setTimeout(resolve, step.duration));
        
        // Simulation d'actions réelles
        if (step.id === 'company') {
          // Sauvegarder les données de l'entreprise
          console.log('Saving company data:', companyData);
        } else if (step.id === 'modules') {
          // Configurer les modules
          console.log('Configuring modules:', modules);
        }
      }

      // Marquer l'onboarding comme terminé
      try {
        setError(null);
        console.log('🚀 Calling completeOnboarding with:', { companyData, modules });
        
        const result = await completeOnboarding(companyData, modules);
        console.log('✅ Onboarding completion result:', result);
        
        setIsCompleted(true);
        
        if (result.trialCreated) {
          toast({
            title: "Configuration terminée !",
            description: "Votre entreprise a été configurée avec succès. Votre essai gratuit de 30 jours a commencé !",
            duration: 5000,
          });
        } else {
          toast({
            title: "Configuration terminée !",
            description: "Votre entreprise a été configurée avec succès dans CassKai.",
            duration: 5000,
          });
        }

        // Wait a bit before allowing navigation to ensure everything is saved
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error('❌ Error completing onboarding:', error);
        setError(error?.message || 'Une erreur est survenue lors de la finalisation');
        setIsCompleted(false);
        toast({
          title: "Erreur de configuration",
          description: (error?.message as string) || "Une erreur est survenue. Veuillez réessayer.",
          variant: "destructive",
        });
      } finally {
        setIsCompleting(false);
      }
    };

    processOnboarding();
  }, [companyData, modules, completeOnboarding, toast]);

  const handleGoToDashboard = () => {
    // Navigate to dashboard after successful onboarding completion
    navigate('/dashboard', { replace: true });
  };

  const handleNavigateTo = (path: string) => {
    navigate(path);
  };

  const handleRetry = async () => {
    setIsCompleting(true);
    setIsCompleted(false);
    setError(null);
    
    try {
      console.log('🔄 Retrying onboarding completion...');
      const result = await completeOnboarding(companyData, modules);
      console.log('✅ Retry successful:', result);
      
      setIsCompleted(true);
      toast({
        title: "Configuration terminée !",
        description: result.trialCreated
          ? "Votre entreprise a été configurée. Essai gratuit de 30 jours lancé !"
          : "Votre entreprise a été configurée avec succès.",
        duration: 5000,
      });

      // Wait a bit before allowing navigation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err: any) {
      console.error('❌ Retry failed:', err);
      setError(err?.message || 'Une erreur est survenue lors de la finalisation');
      setIsCompleted(false);
      toast({
        title: "Échec du nouvel essai",
        description: (err?.message as string) || "Merci de vérifier votre connexion et réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const enabledModulesCount = Object.values(modules).filter(Boolean).length;
  const progressPercentage = isCompleted ? 100 : Math.round(((currentStep + 1) / completionSteps.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="glass-card overflow-hidden">
        <CardHeader className="text-center pb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
          >
            {isCompleted ? (
              <CheckCircle className="w-10 h-10 text-white" />
            ) : (
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <CardTitle className="text-3xl font-bold gradient-text mb-3">
              {isCompleted ? (
                t('onboarding.complete.welcomeTitle', {
                  defaultValue: `Bienvenue dans CassKai !`
                })
              ) : (
                t('onboarding.complete.configuringTitle', {
                  defaultValue: 'Configuration en cours...'
                })
              )}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {isCompleted ? (
                t('onboarding.complete.welcomeSubtitle', {
                  defaultValue: 'Votre plateforme est prête ! Vous pouvez maintenant commencer à gérer votre entreprise avec CassKai.'
                })
              ) : (
                t('onboarding.complete.configuringSubtitle', {
                  defaultValue: 'Nous préparons votre espace de travail personnalisé...'
                })
              )}
            </CardDescription>
          </motion.div>
        </CardHeader>

        <CardContent className="p-8">
          {isCompleting && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mb-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Progression : {progressPercentage}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {currentStep + 1} / {completionSteps.length}
                  </span>
                </div>
                
                <Progress value={progressPercentage} className="h-3" />
                
                <div className="text-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {completionSteps[currentStep]?.label || 'Finalisation...'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {isCompleted && (
            <>
              {/* Récapitulatif de la configuration */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mb-8"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                  Récapitulatif de votre configuration
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Entreprise</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{companyData.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Secteur:</span>
                        <span className="font-medium">{companyData.sector}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pays:</span>
                        <span className="font-medium">{companyData.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Devise:</span>
                        <span className="font-medium">{companyData.currency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Modules</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {enabledModulesCount} module{enabledModulesCount > 1 ? 's' : ''} activé{enabledModulesCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(modules)
                        .filter(([_, enabled]) => enabled)
                        .slice(0, 4)
                        .map(([moduleKey, _]) => (
                          <Badge key={moduleKey} variant="secondary" className="text-xs">
                            {moduleKey}
                          </Badge>
                        ))}
                      {enabledModulesCount > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{enabledModulesCount - 4} autres
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Prochaines étapes */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="mb-8"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                  Prochaines étapes recommandées
                </h3>
                
                <div className="grid gap-4">
                  {nextSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleNavigateTo(step.path)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <step.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {step.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">
                        {step.action}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Action principale */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="text-center"
              >
                <Button
                  onClick={handleGoToDashboard}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Commencer avec CassKai
                </Button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  🎉 Félicitations ! Votre configuration est terminée.
                </p>
              </motion.div>
            </>
          )}

          {!isCompleting && !isCompleted && (
            <div className="text-center space-y-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error || 'Une erreur est survenue lors de la finalisation.'}
              </p>
              <Button onClick={handleRetry} className="inline-flex items-center">
                <Loader2 className="w-4 h-4 mr-2" />
                Réessayer la finalisation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}