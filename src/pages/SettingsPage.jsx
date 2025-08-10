import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserCog, Building, Palette, Languages, BellDot, ShieldCheck, SlidersHorizontal, Check, Loader2, Users, Lock, CreditCard, FileText, DownloadCloud, FileArchive, Database, Upload, ArrowRight, Settings, Key, HelpCircle, QrCode, Smartphone, Mail, Eye, EyeOff, Star } from 'lucide-react';
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
  const { ALL_MODULES: systemModules, enabledModules, updateModuleState, loadingModules: contextLoading } = useModules();
  const { toast } = useToast();
  const { user, loading, hasPermission, currentEnterpriseId, currentCompanySubscription } = useAuth(); 
  const navigate = useNavigate();

  // ✅ États locaux stabilisés
  const [moduleStates, setModuleStates] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // États pour les paramètres avancés
  const [userProfile, setUserProfile] = useState({
    firstName: user?.user_metadata?.first_name || '',
    lastName: user?.user_metadata?.last_name || '',
    email: user?.email || '',
    phone: '',
    avatar: '',
    timezone: 'Europe/Paris',
    language: currentLocale,
    jobTitle: '',
    department: ''
  });
  
  const [companySettings, setCompanySettings] = useState({
    name: 'Casskai Demo',
    siret: '12345678901234',
    address: '123 Rue de la Paix, 75001 Paris',
    phone: '+33 1 23 45 67 89',
    email: 'contact@casskai.com',
    website: 'https://casskai.com',
    logo: '',
    currency: 'EUR',
    fiscalYear: 'calendar',
    accountingMethod: 'accrual'
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      newTransactions: true,
      weeklyReports: true,
      systemUpdates: false,
      marketing: false
    },
    push: {
      newTransactions: false,
      alerts: true,
      reminders: true
    },
    frequency: 'daily'
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    lastPasswordChange: '2024-01-15',
    loginNotifications: true,
    sessionTimeout: 60,
    allowedIPs: []
  });
  
  const [integrations, setIntegrations] = useState([
    { id: 'stripe', name: 'Stripe', status: 'connected', type: 'payment' },
    { id: 'shopify', name: 'Shopify', status: 'disconnected', type: 'ecommerce' },
    { id: 'sage', name: 'Sage', status: 'pending', type: 'accounting' }
  ]);
  
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    frequency: 'daily',
    retention: 30,
    lastBackup: '2024-03-15T10:30:00Z',
    includeFiles: true,
    encryption: true
  });
  
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, user: 'Marie Dubois', action: 'Connexion utilisateur', timestamp: '2024-03-15 10:30', ip: '192.168.1.1' },
    { id: 2, user: 'Jean Martin', action: 'Modification profil', timestamp: '2024-03-15 09:15', ip: '192.168.1.2' },
    { id: 3, user: 'System', action: 'Sauvegarde automatique', timestamp: '2024-03-15 02:00', ip: 'localhost' }
  ]);

  // ✅ Refs pour éviter les appels redondants
  const hasInitialized = useRef(false);
  const prevModulesRef = useRef();

  // ✅ Permissions mémorisées de façon stable
  const permissions = useMemo(() => {
    if (!user) return { canManageModules: false, canManageRolesAndUsers: false, canManageBilling: false };
    
    return {
      canManageModules: hasPermission('manage_company_settings'),
      canManageRolesAndUsers: hasPermission('manage_company_users') || hasPermission('manage_company_roles'),
      canManageBilling: hasPermission('manage_company_settings')
    };
  }, [user, hasPermission]);

  // ✅ Configuration sections mémorisée
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

  // ✅ Fonction formatDate stable
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

  // ✅ Handlers stables
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
      const promises = [];
      for (const mod of systemModules) {
        if (moduleStates[mod.key] !== enabledModules[mod.key]) {
          promises.push(updateModuleState(mod.key, moduleStates[mod.key]));
        }
      }
      
      await Promise.all(promises);
      
      toast({
        title: t('success', { defaultValue: 'Succès' }),
        description: t('moduleSettingsUpdated', { defaultValue: 'Paramètres des modules mis à jour' }),
        variant: "success",
      });
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
  }, [permissions.canManageModules, systemModules, moduleStates, enabledModules, updateModuleState, toast, t]);

  // ✅ Initialisation unique des modules
  useEffect(() => {
    if (!contextLoading && enabledModules && !hasInitialized.current) {
      // Vérifier si les modules ont changé
      const modulesChanged = JSON.stringify(enabledModules) !== JSON.stringify(prevModulesRef.current);
      
      if (modulesChanged || !isInitialized) {
        setModuleStates(enabledModules);
        setIsInitialized(true);
        hasInitialized.current = true;
        prevModulesRef.current = enabledModules;
      }
    }
  }, [enabledModules, contextLoading, isInitialized]);

  // ✅ État de chargement simplifié
  const isLoading = useMemo(() => {
    return loading || contextLoading || !isInitialized;
  }, [loading, contextLoading, isInitialized]);

  // ✅ Composant de chargement
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
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

      {/* Thème et Langue */}
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
      
      {/* Sections d'entreprise */}
      {currentEnterpriseId && (
        <>
          {/* Abonnement */}
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
              {permissions.canManageBilling ? (
                currentCompanySubscription ? (
                  <div>
                    <p>
                      <strong>{t('currentPlan', { defaultValue: 'Plan actuel' })}:</strong> {currentCompanySubscription.product?.name || t('unknownPlan', { defaultValue: 'Plan inconnu' })}
                    </p>
                    <p>
                      <strong>{t('status', { defaultValue: 'Statut' })}:</strong> 
                      <span className={`capitalize ml-1 ${currentCompanySubscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                        {t(`subscription_${currentCompanySubscription.status}`, { defaultValue: currentCompanySubscription.status })}
                      </span>
                    </p>
                    {currentCompanySubscription.price && (
                      <p>
                        <strong>{t('price', { defaultValue: 'Prix' })}:</strong> {(currentCompanySubscription.price.unit_amount / 100).toFixed(2)} {currentCompanySubscription.price.currency?.toUpperCase()} / {t(`interval_${currentCompanySubscription.price.recurring?.interval}`, { defaultValue: currentCompanySubscription.price.recurring?.interval || 'ponctuel' })}
                      </p>
                    )}
                    {currentCompanySubscription.current_period_end && 
                      <p>
                        <strong>{t('renewsOn', { defaultValue: 'Renouvellement le' })}:</strong> {formatDate(currentCompanySubscription.current_period_end)}
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
          </Card>

          {/* Gestion des modules */}
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
                    disabled={isSaving || !permissions.canManageModules}
                  />
                </div>
              ))}
            </CardContent>
            {permissions.canManageModules && (
              <CardFooter>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  {t('saveChanges', { defaultValue: 'Enregistrer les modifications' })}
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Gestion des utilisateurs */}
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
          </Card>
        </>
      )}
      
      {/* Autres sections */}
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
                    disabled 
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
      
      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="text-primary" />
            {t('quickActions', { defaultValue: 'Actions rapides' })}
          </CardTitle>
          <CardDescription>
            {t('quickActionsDesc', { defaultValue: 'Accès rapide aux fonctions essentielles' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full" onClick={handleExportData}>
              <DownloadCloud className="mr-2 h-4 w-4" />
              {t('exportData', { defaultValue: 'Exporter les données' })}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleBackupNow}>
              <Database className="mr-2 h-4 w-4" />
              {t('backupNow', { defaultValue: 'Sauvegarder maintenant' })}
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/settings/database-test')}
            >
              <Database className="mr-2 h-4 w-4" />
              Tests Base de Données
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
