import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCog, Building, Palette, Languages, BellDot, ShieldCheck, SlidersHorizontal, Check, Loader2, Users, Lock, CreditCard, FileText, DownloadCloud, FileArchive, Database, Upload, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useModules } from '@/contexts/ModulesContext';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext'; 
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { t, currentLocale } = useLocale();
  const { ALL_MODULES: systemModules, enabledModules, updateModuleState, loadingModules: contextLoading, fetchEnabledModules } = useModules();
  const { toast } = useToast();
  const { user, loading, hasPermission, currentEnterpriseId, currentCompanySubscription, fetchAccessData } = useAuth(); 
  const navigate = useNavigate();

  const [moduleStates, setModuleStates] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [subscription, setSubscription] = useState(null);

  // ✅ OPTIMISATION: Mémoriser les permissions pour éviter les recalculs
  const permissions = useMemo(() => ({
    canManageModules: hasPermission('manage_company_settings'),
    canManageRolesAndUsers: hasPermission('manage_company_users') || hasPermission('manage_company_roles'),
    canManageBilling: hasPermission('manage_company_settings')
  }), [hasPermission]);

  // ✅ OPTIMISATION: Mémoriser la configuration des sections
  const settingsSections = useMemo(() => [
    { 
      title: t('userProfile', { defaultValue: 'Profil Utilisateur' }), 
      icon: UserCog, 
      description: t('userProfileDesc', {defaultValue: "Gérez vos informations personnelles et de connexion."}), 
      permission: null, 
      action: () => {} 
    },
    { 
      title: t('companySettings', { defaultValue: 'Paramètres Entreprise' }), 
      icon: Building, 
      description: t('companySettingsDesc', {defaultValue: "Configurez les détails de votre entreprise."}), 
      permission: 'manage_company_settings', 
      action: () => {} 
    },
    { 
      title: t('notifications', { defaultValue: 'Notifications' }), 
      icon: BellDot, 
      description: t('notificationsDesc', {defaultValue: "Définissez vos préférences de notification."}), 
      permission: null, 
      action: () => {} 
    },
  ], [t]);

  // ✅ OPTIMISATION: Stabiliser la fonction formatDate
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(currentLocale, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString; 
    }
  }, [currentLocale]);

  // ✅ OPTIMISATION: Mémoriser les fonctions pour éviter les re-créations
  const handleModuleToggle = useCallback((moduleKey) => {
    setModuleStates(prev => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (!permissions.canManageModules) {
      toast({ 
        title: t('error', { defaultValue: 'Erreur' }), 
        description: t('noPermissionManageModules', { defaultValue: 'Vous n\'avez pas la permission de gérer les modules' }), 
        variant: "destructive" 
      });
      return;
    }
    setIsSaving(true);
    try {
      for (const mod of systemModules) {
        if (moduleStates[mod.key] !== enabledModules[mod.key]) {
          await updateModuleState(mod.key, moduleStates[mod.key]);
        }
      }
      toast({
        title: t('success', { defaultValue: 'Succès' }),
        description: t('moduleSettingsUpdated', { defaultValue: 'Paramètres des modules mis à jour' }),
        variant: "success",
      });
      await fetchEnabledModules(); 
    } catch (error) {
      console.error("Error saving module settings:", error);
      toast({
        title: t('error', { defaultValue: 'Erreur' }),
        description: t('moduleSettingsUpdateError', { defaultValue: 'Erreur lors de la mise à jour des modules' }),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [permissions.canManageModules, systemModules, moduleStates, enabledModules, updateModuleState, fetchEnabledModules, toast, t]);

  // ✅ OPTIMISATION: Combiner les useEffect liés aux modules
  useEffect(() => {
    if (!contextLoading) {
      setModuleStates(enabledModules);
      setIsLoadingInitial(false);
    }
  }, [enabledModules, contextLoading]);
  
  // ✅ OPTIMISATION: Optimiser la gestion de l'abonnement
  useEffect(() => {
    if (!loading) {
      if (currentEnterpriseId && currentCompanySubscription) {
        setSubscription(currentCompanySubscription);
      } else {
        setSubscription(null);
      }
    }
  }, [currentEnterpriseId, currentCompanySubscription, loading]);

  // ✅ OPTIMISATION: Éviter les appels redondants fetchAccessData
  useEffect(() => {
    if (user && currentEnterpriseId && !loading) {
      let isMounted = true;
      
      const loadData = async () => {
        try {
          await Promise.all([
            fetchAccessData(),
            fetchEnabledModules()
          ]);
        } catch (error) {
          if (isMounted) {
            console.error('Error loading settings data:', error);
          }
        }
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }
  }, [user, currentEnterpriseId, loading]);

  // ✅ OPTIMISATION: Mémoriser l'état de chargement
  const isLoading = useMemo(() => {
    return isLoadingInitial && contextLoading && loading;
  }, [isLoadingInitial, contextLoading, loading]);

  // ✅ OPTIMISATION: Composant de chargement mémorisé
  const LoadingComponent = useMemo(() => (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  ), []);

  if (isLoading) {
    return LoadingComponent;
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('settings', { defaultValue: 'Paramètres' })}
        </h1>
        <p className="text-muted-foreground">
          {t('settingsDescription', {defaultValue: "Configurez vos préférences et paramètres d'application."})}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette />{t('theme', { defaultValue: 'Thème' })}
            </CardTitle>
            <CardDescription>
              {t('themeDescription', {defaultValue: "Choisissez l'apparence de l'application."})}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages />{t('language', { defaultValue: 'Langue' })}
            </CardTitle>
            <CardDescription>
              {t('languageDescription', {defaultValue: "Sélectionnez la langue de l'interface."})}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageToggle />
          </CardContent>
        </Card>
      </div>
      
      {currentEnterpriseId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard />{t('subscriptionManagement', { defaultValue: 'Gestion Abonnement' })}
              </CardTitle>
              <CardDescription>
                {t('subscriptionManagementDesc', { defaultValue: 'Gérez votre abonnement et facturation' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : permissions.canManageBilling ? (
                subscription ? (
                  <div>
                    <p>
                      <strong>{t('currentPlan', { defaultValue: 'Plan actuel' })}:</strong> {subscription.product?.name || t('unknownPlan', { defaultValue: 'Plan inconnu' })}
                    </p>
                    <p>
                      <strong>{t('status', { defaultValue: 'Statut' })}:</strong> 
                      <span className={`capitalize ml-1 ${subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                        {t(`subscription_${subscription.status}`, { defaultValue: subscription.status })}
                      </span>
                    </p>
                    {subscription.price && (
                      <p>
                        <strong>{t('price', { defaultValue: 'Prix' })}:</strong> {(subscription.price.unit_amount / 100).toFixed(2)} {subscription.price.currency?.toUpperCase()} / {t(`interval_${subscription.price.recurring?.interval}`, { defaultValue: subscription.price.recurring?.interval || 'ponctuel' })}
                      </p>
                    )}
                    {subscription.current_period_end && 
                      <p>
                        <strong>{t('renewsOn', { defaultValue: 'Renouvellement le' })}:</strong> {formatDate(subscription.current_period_end)}
                      </p>
                    }
                    <Button className="mt-4" disabled>
                      {t('manageSubscriptionButton', { defaultValue: 'Gérer l\'abonnement' })}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p>{t('noSubscriptionFound', { defaultValue: 'Aucun abonnement trouvé' })}</p>
                    <Button className="mt-4" disabled>
                      {t('subscribeNowButton', { defaultValue: 'S\'abonner maintenant' })}
                    </Button>
                  </div>
                )
              ) : (
                <p className="text-sm text-destructive">
                  {t('noPermissionManageBilling', { defaultValue: 'Vous n\'avez pas la permission de gérer la facturation' })}
                </p>
              )}
            </CardContent>
            {permissions.canManageBilling && 
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  {t('stripePortalInfo', { defaultValue: 'Gestion via portail Stripe sécurisé' })}
                </p>
              </CardFooter>
            }
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal />{t('manageModules', { defaultValue: 'Gestion des Modules' })}
              </CardTitle>
              <CardDescription>
                {t('moduleActivationDescription', { defaultValue: 'Activez ou désactivez les modules selon vos besoins' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!permissions.canManageModules && 
                <p className="text-sm text-destructive">
                  {t('noPermissionManageModules', { defaultValue: 'Vous n\'avez pas la permission de gérer les modules' })}
                </p>
              }
              {systemModules.map(mod => (
                <div key={mod.key} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                  <div>
                    <Label htmlFor={`module-${mod.key}`} className="font-medium">
                      {t(mod.nameKey, { defaultValue: mod.nameKey })}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t(`${mod.nameKey}_desc`, { defaultValue: `Description du module ${mod.nameKey}` })}
                    </p>
                  </div>
                  <Switch
                    id={`module-${mod.key}`}
                    checked={moduleStates[mod.key] || false}
                    onCheckedChange={() => handleModuleToggle(mod.key)}
                    disabled={isSaving || contextLoading || !permissions.canManageModules}
                  />
                </div>
              ))}
            </CardContent>
            {permissions.canManageModules && (
              <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSaving || contextLoading}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  {t('saveChanges', { defaultValue: 'Enregistrer les modifications' })}
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock />{t('userManagement.title', {defaultValue: 'Gestion des Utilisateurs'})}
              </CardTitle>
              <CardDescription>
                {t('userManagement.pageDescription', {defaultValue: 'Gérez les utilisateurs, rôles et invitations pour votre entreprise.'})}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[150px] flex flex-col items-center justify-center">
              {permissions.canManageRolesAndUsers ? (
                <>
                  <Users className="h-12 w-12 text-primary/70 mb-3" />
                  <p className="text-muted-foreground mb-3">
                    {t('userManagement.settingsCardPrompt', {defaultValue: 'Contrôlez qui a accès et ce qu\'ils peuvent faire.'})}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/settings/user-management')}>
                    {t('userManagement.manageUsersButton', {defaultValue: 'Gérer les Utilisateurs & Rôles'})} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button> 
                </>
              ) : (
                <p className="text-sm text-destructive">
                  {t('noPermissionManageRolesOrUsers', {defaultValue: 'Vous n\'avez pas la permission de gérer les utilisateurs ou les rôles.'})}
                </p>
              )}
            </CardContent>
             {permissions.canManageRolesAndUsers && (
                <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      {t('userManagement.accessControlInfo', {defaultValue: 'Définissez les droits d\'accès et invitez de nouveaux membres.'})}
                    </p>
                </CardFooter>
             )}
          </Card>
        </>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        {settingsSections.map((section, index) => {
          if (section.permission && !hasPermission(section.permission) && currentEnterpriseId) {
            return null;
          }
          return (
            <motion.div 
              key={`${section.title}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              whileHover={{ y: -5, boxShadow: "0px 8px 15px rgba(0,0,0,0.07)" }}
            >
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <section.icon className="text-primary"/>
                        {section.title}
                      </CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[100px] flex items-center justify-center">
                      <p className="text-muted-foreground">
                        {t('comingSoon', { defaultValue: 'Bientôt disponible' })}
                      </p>
                  </CardContent>
                   <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        disabled={(section.permission && !hasPermission(section.permission) && currentEnterpriseId) || !currentEnterpriseId } 
                        onClick={section.action}
                      >
                        {t('configureButton', {defaultValue: 'Configurer'})}
                      </Button>
                  </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="text-primary" />
            {t('backupAndExport', { defaultValue: 'Sauvegarde et Export' })}
          </CardTitle>
          <CardDescription>
            {t('settingspage.grez_vos_donnes_et_exports', { defaultValue: 'Gérez vos données et exports' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="w-full">
              <DownloadCloud className="mr-2 h-4 w-4" />
              {t('exportData', { defaultValue: 'Exporter les données' })}
            </Button>
            <Button variant="outline" className="w-full">
              <FileArchive className="mr-2 h-4 w-4" />
              {t('generateFECReport', { defaultValue: 'Générer rapport FEC' })}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="w-full">
              <Database className="mr-2 h-4 w-4" />
              {t('backupData', { defaultValue: 'Sauvegarder données' })}
            </Button>
            <Button variant="outline" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              {t('importData', { defaultValue: 'Importer données' })}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {t('fecCompliance', { defaultValue: 'Les exports respectent les normes comptables françaises (FEC, DGI)' })}
          </p>
        </CardFooter>
      </Card>
    </motion.div>
  );
}