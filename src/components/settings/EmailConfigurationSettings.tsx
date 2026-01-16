import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  Info,
  Send,
  Settings,
  Shield,
  Zap,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { emailService, EmailConfiguration } from '@/services/emailService';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
export function EmailConfigurationSettings() {
  const { currentCompany } = useAuth();
  const [configurations, setConfigurations] = useState<EmailConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState<string | null>(null);

  // Gmail OAuth state
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailConnecting, setGmailConnecting] = useState(false);

  // Outlook OAuth state
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookEmail, setOutlookEmail] = useState('');
  const [outlookConnecting, setOutlookConnecting] = useState(false);

  // Active provider state (1 email per company rule)
  const [activeProvider, setActiveProvider] = useState<'gmail' | 'outlook' | 'smtp' | null>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      loadConfigurations();
      checkActiveProvider();

      // Check URL params for OAuth callback
      const params = new URLSearchParams(window.location.search);

      // Gmail callback
      if (params.get('gmail_success') === 'true') {
        const email = params.get('gmail_email');
        setGmailConnected(true);
        setGmailEmail(email || '');
        toast.success(`✅ Gmail connecté: ${email}`);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        loadConfigurations();
      }
      if (params.get('gmail_error')) {
        toast.error(`❌ Erreur Gmail: ${params.get('gmail_error')}`);
        window.history.replaceState({}, '', window.location.pathname);
      }

      // Outlook callback
      if (params.get('outlook_success') === 'true') {
        const email = params.get('outlook_email');
        setOutlookConnected(true);
        setOutlookEmail(email || '');
        toast.success(`✅ Outlook connecté: ${email}`);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
        loadConfigurations();
      }
      if (params.get('outlook_error')) {
        toast.error(`❌ Erreur Outlook: ${params.get('outlook_error')}`);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [currentCompany?.id]);
  const loadConfigurations = async () => {
    try {
      const configs = await emailService.getConfigurations(currentCompany!.id);
      setConfigurations(configs);
      if (configs.length === 0) {
        setShowWizard(true);
      }
    } catch (error) {
      logger.error('EmailConfigurationSettings', 'Error loading configurations:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleTestConfiguration = async (configId: string) => {
    if (!testEmail) {
      toast.error('Veuillez entrer une adresse email de test');
      return;
    }
    setTesting(configId);
    try {
      await emailService.testConfiguration(configId, testEmail);
      toast.success('✅ Test réussi ! Email de test envoyé');
      loadConfigurations();
    } catch (error: any) {
      toast.error(`❌ Erreur: ${error.message}`);
    } finally {
      setTesting(null);
    }
  };
  const handleToggleActive = async (configId: string, isActive: boolean) => {
    try {
      // First, disable all other configurations
      if (isActive) {
        const updates = configurations.map(async (config) => {
          if (config.id !== configId && config.is_active) {
            await emailService.updateConfiguration(config.id, { is_active: false });
          }
        });
        await Promise.all(updates);
      }
      // Then enable this one
      await emailService.updateConfiguration(configId, { is_active: isActive });
      toast.success(isActive ? 'Configuration activée' : 'Configuration désactivée');
      loadConfigurations();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    }
  };

  // Check which provider is currently active (1 email per company rule)
  const checkActiveProvider = async () => {
    try {
      // Check Gmail
      const { data: gmailToken, error: gmailError } = await supabase
        .from('email_oauth_tokens')
        .select('email, is_active')
        .eq('company_id', currentCompany!.id)
        .eq('provider', 'gmail')
        .eq('is_active', true)
        .single();

      if (!gmailError && gmailToken) {
        setActiveProvider('gmail');
        setGmailConnected(true);
        setGmailEmail(gmailToken.email);
        return;
      }

      // Check Outlook
      const { data: outlookToken, error: outlookError } = await supabase
        .from('email_oauth_tokens')
        .select('email, is_active')
        .eq('company_id', currentCompany!.id)
        .eq('provider', 'outlook')
        .eq('is_active', true)
        .single();

      if (!outlookError && outlookToken) {
        setActiveProvider('outlook');
        setOutlookConnected(true);
        setOutlookEmail(outlookToken.email);
        return;
      }

      // Check SMTP
      const { data: smtpConfigs, error: smtpError } = await supabase
        .from('email_configurations')
        .select('*')
        .eq('company_id', currentCompany!.id)
        .eq('provider', 'smtp')
        .eq('is_active', true);

      if (!smtpError && smtpConfigs && smtpConfigs.length > 0) {
        setActiveProvider('smtp');
        return;
      }

      // No active provider
      setActiveProvider(null);
    } catch (error) {
      logger.error('EmailConfigurationSettings', 'Error checking active provider:', error);
    }
  };

  const handleConnectGmail = async () => {
    setGmailConnecting(true);
    try {
      // RULE: 1 email per company - Disable all other services
      await supabase
        .from('email_oauth_tokens')
        .update({ is_active: false })
        .eq('company_id', currentCompany!.id)
        .neq('provider', 'gmail');

      await supabase
        .from('email_configurations')
        .update({ is_active: false })
        .eq('company_id', currentCompany!.id)
        .eq('provider', 'smtp');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/gmail-oauth-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyId: currentCompany!.id,
          redirectUrl: `${window.location.origin  }/settings`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start Gmail OAuth');
      }

      const { authUrl } = await response.json();

      // Redirect to Google OAuth
      window.location.assign(authUrl);
    } catch (error: any) {
      toast.error('❌ Erreur lors de la connexion Gmail');
      logger.error('EmailConfigurationSettings', 'Error connecting Gmail:', error);
      setGmailConnecting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      await supabase
        .from('email_oauth_tokens')
        .update({ is_active: false })
        .eq('company_id', currentCompany!.id)
        .eq('provider', 'gmail');

      setGmailConnected(false);
      setGmailEmail('');
      setActiveProvider(null); // Allow connecting another service
      toast.success('✅ Gmail déconnecté');
      loadConfigurations();
    } catch (error: any) {
      toast.error('❌ Erreur lors de la déconnexion');
      logger.error('EmailConfigurationSettings', 'Error disconnecting Gmail:', error);
    }
  };

  const handleConnectOutlook = async () => {
    setOutlookConnecting(true);
    try {
      // RULE: 1 email per company - Disable all other services
      await supabase
        .from('email_oauth_tokens')
        .update({ is_active: false })
        .eq('company_id', currentCompany!.id)
        .neq('provider', 'outlook');

      await supabase
        .from('email_configurations')
        .update({ is_active: false })
        .eq('company_id', currentCompany!.id)
        .eq('provider', 'smtp');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/outlook-oauth-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          companyId: currentCompany!.id,
          redirectUrl: `${window.location.origin  }/settings`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start Outlook OAuth');
      }

      const { authUrl } = await response.json();

      // Redirect to Microsoft OAuth
      window.location.assign(authUrl);
    } catch (error: any) {
      toast.error('❌ Erreur lors de la connexion Outlook');
      logger.error('EmailConfigurationSettings', 'Error connecting Outlook:', error);
      setOutlookConnecting(false);
    }
  };

  const handleDisconnectOutlook = async () => {
    try {
      await supabase
        .from('email_oauth_tokens')
        .update({ is_active: false })
        .eq('company_id', currentCompany!.id)
        .eq('provider', 'outlook');

      setOutlookConnected(false);
      setOutlookEmail('');
      setActiveProvider(null); // Allow connecting another service
      toast.success('✅ Outlook déconnecté');
      loadConfigurations();
    } catch (error: any) {
      toast.error('❌ Erreur lors de la déconnexion');
      logger.error('EmailConfigurationSettings', 'Error disconnecting Outlook:', error);
    }
  };
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-600" />
            Configuration Email
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Configurez vos services d'envoi d'emails pour l'automation
          </p>
        </div>
        {!activeProvider && (
          <Button onClick={() => setShowWizard(true)}>
            <Zap className="h-4 w-4 mr-2" />
            Nouvelle Configuration
          </Button>
        )}
      </div>

      {/* 1 Email Per Company Rule Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-400 text-sm flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>1 email par entreprise.</strong> Vous ne pouvez configurer qu'un seul service d'envoi d'emails.
            Pour changer de service, déconnectez d'abord le service actuel.
          </span>
        </p>
      </div>

      {/* Gmail OAuth Connection Card */}
      <div className="relative">
        <Card className={`border-2 border-blue-500/20 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/10 dark:to-gray-900 ${activeProvider && activeProvider !== 'gmail' ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Connexion Gmail (Recommandé)</CardTitle>
              <CardDescription>
                Envoyez des emails directement depuis votre compte Gmail
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              ✅ Configuration simplifiée
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              ✅ Haute délivrabilité
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              ✅ Pas de limite Gmail
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              ✅ Tokens sécurisés
            </Badge>
          </div>

          {gmailConnected ? (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Gmail connecté</p>
                  <p className="text-sm text-green-700 dark:text-green-300">{gmailEmail}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleDisconnectGmail} className="border-green-300 hover:border-green-400">
                Déconnecter
              </Button>
            </div>
          ) : (
            <div>
              <Button
                onClick={handleConnectGmail}
                disabled={gmailConnecting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {gmailConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Se connecter avec Gmail
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                Vous serez redirigé vers Google pour autoriser l'accès
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        {activeProvider && activeProvider !== 'gmail' && (
          <div className="absolute inset-0 bg-gray-900/50 dark:bg-gray-950/70 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <p className="text-white text-sm font-medium px-4 text-center">
              Déconnectez {activeProvider === 'outlook' ? 'Outlook' : 'SMTP'} pour utiliser Gmail
            </p>
          </div>
        )}
      </div>

      {/* Outlook OAuth Connection Card */}
      <div className="relative">
        <Card className={`border-2 border-purple-500/20 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/10 dark:to-gray-900 ${activeProvider && activeProvider !== 'outlook' ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Connexion Outlook / Microsoft 365</CardTitle>
              <CardDescription>
                Envoyez des emails depuis votre compte Outlook, Hotmail ou Microsoft 365
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              ✅ Configuration simplifiée
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              ✅ Haute délivrabilité
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              ✅ Support Microsoft 365
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              ✅ Tokens sécurisés
            </Badge>
          </div>

          {outlookConnected ? (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Outlook connecté</p>
                  <p className="text-sm text-green-700 dark:text-green-300">{outlookEmail}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleDisconnectOutlook} className="border-green-300 hover:border-green-400">
                Déconnecter
              </Button>
            </div>
          ) : (
            <div>
              <Button
                onClick={handleConnectOutlook}
                disabled={outlookConnecting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                {outlookConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Se connecter avec Outlook
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                Vous serez redirigé vers Microsoft pour autoriser l'accès
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        {activeProvider && activeProvider !== 'outlook' && (
          <div className="absolute inset-0 bg-gray-900/50 dark:bg-gray-950/70 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <p className="text-white text-sm font-medium px-4 text-center">
              Déconnectez {activeProvider === 'gmail' ? 'Gmail' : 'SMTP'} pour utiliser Outlook
            </p>
          </div>
        )}
      </div>

      {/* Wizard - Show only if explicitly opened */}
      {showWizard && (
        <EmailConfigurationWizard onComplete={() => {
          setShowWizard(false);
          loadConfigurations();
        }} />
      )}

      {/* Configurations List - Show if we have configurations and wizard is closed */}
      {!showWizard && configurations.length > 0 && (
        <div className="grid gap-6">
          {configurations.map((config) => (
          <Card key={config.id} className={config.is_active ? 'border-2 border-blue-500' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{config.from_name}</CardTitle>
                    {config.is_active && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </Badge>
                    )}
                    {config.is_verified ? (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Vérifiée
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Non vérifiée
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{config.from_email}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) => handleToggleActive(config.id, checked)}
                    disabled={!config.is_verified}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Configuration Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Fournisseur</p>
                  <p className="font-medium">{config.provider.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Emails envoyés aujourd'hui</p>
                  <p className="font-medium">{config.emails_sent_today} / {config.daily_limit}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Emails ce mois-ci</p>
                  <p className="font-medium">{config.emails_sent_month} / {config.monthly_limit}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total envoyés</p>
                  <p className="font-medium">{config.total_emails_sent || 0}</p>
                </div>
              </div>
              {/* Test Section */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Input
                  type="email"
                  placeholder="email@test.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleTestConfiguration(config.id)}
                  disabled={testing === config.id || !testEmail}
                  variant="outline"
                >
                  {testing === config.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Test en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Tester
                    </>
                  )}
                </Button>
              </div>
              {/* Last Test Status */}
              {config.last_test_date && (
                <Alert>
                  <AlertDescription className="flex items-center gap-2">
                    {config.last_test_status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>
                      Dernier test: {new Date(config.last_test_date).toLocaleString()} - 
                      {config.last_test_status === 'success' ? ' Réussi ✅' : ` Échoué: ${config.last_error}`}
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Help Section - Always show */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5" />
            Besoin d'aide ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Pour que vos automatisations puissent envoyer des emails, vous devez configurer un service d'envoi.
          </p>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Options recommandées :</p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              <li><strong>SMTP</strong> - Utilisez le serveur SMTP de votre fournisseur email (Gmail, Outlook, etc.)</li>
              <li><strong>SendGrid</strong> - Service professionnel avec 100 emails/jour gratuits</li>
              <li><strong>Mailgun</strong> - Idéal pour les gros volumes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
// Wizard Component for guided setup
function EmailConfigurationWizard({ onComplete }: { onComplete: () => void }) {
  const { currentCompany } = useAuth();
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<'smtp' | 'sendgrid' | 'mailgun'>('smtp');
  const [formData, setFormData] = useState<Partial<EmailConfiguration>>({
    from_name: currentCompany?.name || '',
    from_email: '',
    reply_to_email: '',
    daily_limit: 1000,
    monthly_limit: 30000,
    smtp_secure: true,
    smtp_port: 465
  });
  const [saving, setSaving] = useState(false);
  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);
  const handleSave = async () => {
    setSaving(true);
    try {
      await emailService.createConfiguration(currentCompany!.id, {
        ...formData,
        provider,
        is_active: false,
        is_verified: false
      });
      toast.success('Configuration créée ! Testez-la pour l\'activer');
      onComplete();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          Configuration Email - Étape {step}/4
        </CardTitle>
        <CardDescription>
          Configurez votre service d'envoi d'emails en quelques étapes simples
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`flex-1 ${s < 4 ? 'mr-2' : ''}`}>
                <div className={`h-2 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
              </div>
            ))}
          </div>
        </div>
        {/* Step 1: Choose Provider */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choisissez votre fournisseur d'emails</h3>
              <div className="grid gap-4">
                {/* SMTP Option */}
                <Card 
                  className={`cursor-pointer transition-all ${provider === 'smtp' ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'hover:border-gray-400'}`}
                  onClick={() => setProvider('smtp')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">SMTP (Recommandé pour débuter)</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Utilisez votre compte email existant (Gmail, Outlook, etc.)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">✅ Facile à configurer</Badge>
                          <Badge variant="outline">✅ Gratuit</Badge>
                          <Badge variant="outline">✅ Utilise votre email</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* SendGrid Option */}
                <Card 
                  className={`cursor-pointer transition-all ${provider === 'sendgrid' ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'hover:border-gray-400'}`}
                  onClick={() => setProvider('sendgrid')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                          <Zap className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">SendGrid</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Service professionnel avec tracking avancé
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">⚡ 100 emails/jour gratuits</Badge>
                          <Badge variant="outline">📊 Analytics détaillés</Badge>
                          <Badge variant="outline">🔒 Haute délivrabilité</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Mailgun Option */}
                <Card 
                  className={`cursor-pointer transition-all ${provider === 'mailgun' ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'hover:border-gray-400'}`}
                  onClick={() => setProvider('mailgun')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                          <Shield className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">Mailgun</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Pour les gros volumes et entreprises
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">🚀 Haute performance</Badge>
                          <Badge variant="outline">💪 Gros volumes</Badge>
                          <Badge variant="outline">🔧 API puissante</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleNext}>
                Suivant
              </Button>
            </div>
          </div>
        )}
        {/* Step 2: Provider Configuration */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Configuration {provider.toUpperCase()}</h3>
            {provider === 'smtp' && (
              <SMTPConfigForm formData={formData} setFormData={setFormData} />
            )}
            {provider === 'sendgrid' && (
              <SendGridConfigForm formData={formData} setFormData={setFormData} />
            )}
            {provider === 'mailgun' && (
              <MailgunConfigForm formData={formData} setFormData={setFormData} />
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Retour
              </Button>
              <Button onClick={handleNext}>
                Suivant
              </Button>
            </div>
          </div>
        )}
        {/* Step 3: Sender Information */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Informations d'envoi</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="from_name">Nom d'expéditeur</Label>
                <Input
                  id="from_name"
                  value={formData.from_name}
                  onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                  placeholder="Votre Entreprise"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Ce nom apparaîtra comme expéditeur dans les emails
                </p>
              </div>
              <div>
                <Label htmlFor="from_email">Email d'expéditeur</Label>
                <Input
                  id="from_email"
                  type="email"
                  value={formData.from_email}
                  onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                  placeholder="noreply@votreentreprise.com"
                />
              </div>
              <div>
                <Label htmlFor="reply_to">Email de réponse (optionnel)</Label>
                <Input
                  id="reply_to"
                  type="email"
                  value={formData.reply_to_email}
                  onChange={(e) => setFormData({ ...formData, reply_to_email: e.target.value })}
                  placeholder="contact@votreentreprise.com"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Les réponses seront envoyées à cette adresse
                </p>
              </div>
              <div>
                <Label htmlFor="signature">Signature email (HTML)</Label>
                <Textarea
                  id="signature"
                  value={formData.email_signature}
                  onChange={(e) => setFormData({ ...formData, email_signature: e.target.value })}
                  placeholder="<p>Cordialement,<br>L'équipe</p>"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Retour
              </Button>
              <Button onClick={handleNext}>
                Suivant
              </Button>
            </div>
          </div>
        )}
        {/* Step 4: Limits and Summary */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Limites et résumé</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daily_limit">Limite quotidienne</Label>
                <Input
                  id="daily_limit"
                  type="number"
                  value={formData.daily_limit}
                  onChange={(e) => setFormData({ ...formData, daily_limit: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="monthly_limit">Limite mensuelle</Label>
                <Input
                  id="monthly_limit"
                  type="number"
                  value={formData.monthly_limit}
                  onChange={(e) => setFormData({ ...formData, monthly_limit: parseInt(e.target.value) })}
                />
              </div>
            </div>
            {/* Summary */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Résumé de votre configuration:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Fournisseur: {provider.toUpperCase()}</li>
                  <li>Nom: {formData.from_name}</li>
                  <li>Email: {formData.from_email}</li>
                  <li>Limite: {formData.daily_limit} emails/jour</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Retour
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Terminer la configuration'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
// SMTP Configuration Form
function SMTPConfigForm({ formData, setFormData }: any) {
  // SMTP Providers presets
  const smtpProviders = {
    gmail: { host: 'smtp.gmail.com', port: '465' },
    outlook: { host: 'smtp-mail.outlook.com', port: '587' },
    orange: { host: 'smtp.orange.fr', port: '465' },
    free: { host: 'smtp.free.fr', port: '465' },
    sfr: { host: 'smtp.sfr.fr', port: '465' },
    ovh: { host: 'ssl0.ovh.net', port: '465' },
    o2switch: { host: 'mail.votredomaine.com', port: '465' },
    ionos: { host: 'smtp.ionos.fr', port: '465' },
    infomaniak: { host: 'mail.infomaniak.com', port: '465' },
  };

  const handleProviderSelect = (provider: string) => {
    const config = smtpProviders[provider as keyof typeof smtpProviders];
    if (config) {
      setFormData({
        ...formData,
        smtp_host: config.host,
        smtp_port: parseInt(config.port)
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Provider Quick Select */}
      <div>
        <Label htmlFor="provider_select">Fournisseur de mail (remplissage automatique)</Label>
        <Select onValueChange={handleProviderSelect}>
          <SelectTrigger id="provider_select">
            <SelectValue placeholder="-- Sélectionner un fournisseur --" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gmail">Gmail</SelectItem>
            <SelectItem value="outlook">Outlook / Hotmail</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="sfr">SFR</SelectItem>
            <SelectItem value="ovh">OVH</SelectItem>
            <SelectItem value="o2switch">O2Switch</SelectItem>
            <SelectItem value="ionos">Ionos / 1&1</SelectItem>
            <SelectItem value="infomaniak">Infomaniak</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Sélectionnez votre fournisseur pour pré-remplir la configuration
        </p>
      </div>

      {/* Complete SMTP Provider Guide */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Configuration SMTP par fournisseur
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2 pr-4">Fournisseur</th>
                <th className="pb-2 pr-4">Serveur SMTP</th>
                <th className="pb-2 pr-4">Port</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-700/50">
                <td className="py-2 pr-4 font-medium">Gmail</td>
                <td className="py-2 pr-4"><code className="bg-gray-800 px-1 rounded text-xs">smtp.gmail.com</code></td>
                <td className="py-2 pr-4">465</td>
                <td className="py-2 text-xs text-yellow-400">Mot de passe d'application requis</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 pr-4 font-medium">Outlook / Hotmail</td>
                <td className="py-2 pr-4"><code className="bg-gray-800 px-1 rounded text-xs">smtp-mail.outlook.com</code></td>
                <td className="py-2 pr-4">587</td>
                <td className="py-2 text-xs text-red-400">⚠️ STARTTLS - peut ne pas fonctionner</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 pr-4 font-medium">Orange</td>
                <td className="py-2 pr-4"><code className="bg-gray-800 px-1 rounded text-xs">smtp.orange.fr</code></td>
                <td className="py-2 pr-4">465</td>
                <td className="py-2 text-xs">Identifiants Orange</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 pr-4 font-medium">Free</td>
                <td className="py-2 pr-4"><code className="bg-gray-800 px-1 rounded text-xs">smtp.free.fr</code></td>
                <td className="py-2 pr-4">465</td>
                <td className="py-2 text-xs">Identifiants Free</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 pr-4 font-medium">SFR</td>
                <td className="py-2 pr-4"><code className="bg-gray-800 px-1 rounded text-xs">smtp.sfr.fr</code></td>
                <td className="py-2 pr-4">465</td>
                <td className="py-2 text-xs">Identifiants SFR</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 pr-4 font-medium">OVH</td>
                <td className="py-2 pr-4"><code className="bg-gray-800 px-1 rounded text-xs">ssl0.ovh.net</code></td>
                <td className="py-2 pr-4">465</td>
                <td className="py-2 text-xs">Email OVH</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 pr-4 font-medium">O2Switch</td>
                <td className="py-2 pr-4"><code className="bg-gray-800 px-1 rounded text-xs">mail.votredomaine.com</code></td>
                <td className="py-2 pr-4">465</td>
                <td className="py-2 text-xs">Votre domaine</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 pr-4 font-medium">Ionos / 1&1</td>
                <td className="py-2 pr-4"><code className="bg-gray-800 px-1 rounded text-xs">smtp.ionos.fr</code></td>
                <td className="py-2 pr-4">465</td>
                <td className="py-2 text-xs">Email Ionos</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Infomaniak</td>
                <td className="py-2 pr-4"><code className="bg-gray-800 px-1 rounded text-xs">mail.infomaniak.com</code></td>
                <td className="py-2 pr-4">465</td>
                <td className="py-2 text-xs">Email Infomaniak</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          💡 <strong>Conseil :</strong> Utilisez toujours le port 465 (SSL/TLS). Le port 587 (STARTTLS) n'est pas supporté par notre bibliothèque SMTP.
        </p>

        <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm mt-2 inline-flex items-center gap-1">
          Comment créer un mot de passe d'application Gmail <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div>
        <Label htmlFor="smtp_host">Serveur SMTP</Label>
        <Input
          id="smtp_host"
          value={formData.smtp_host || ''}
          onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
          placeholder="smtp.gmail.com"
        />
      </div>

      <div>
        <Label htmlFor="smtp_port">Port</Label>
        <Select
          value={formData.smtp_port?.toString() || '465'}
          onValueChange={(value) => setFormData({ ...formData, smtp_port: parseInt(value) })}
        >
          <SelectTrigger id="smtp_port">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="465">465 (SSL/TLS - Recommandé)</SelectItem>
            <SelectItem value="587">587 (STARTTLS - Non supporté)</SelectItem>
            <SelectItem value="25">25 (Non sécurisé)</SelectItem>
          </SelectContent>
        </Select>

        {/* Warning for port 587 */}
        {formData.smtp_port === 587 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mt-2">
            <p className="text-yellow-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Le port 587 (STARTTLS) peut ne pas fonctionner. Essayez le port 465 si vous rencontrez des erreurs.
            </p>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="smtp_username">Nom d'utilisateur</Label>
        <Input
          id="smtp_username"
          value={formData.smtp_username || ''}
          onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
          placeholder="votre@email.com"
        />
      </div>

      <div>
        <Label htmlFor="smtp_password">Mot de passe</Label>
        <Input
          id="smtp_password"
          type="password"
          value={formData.smtp_password || ''}
          onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
          placeholder="••••••••"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pour Gmail, utilisez un mot de passe d'application
        </p>
      </div>
    </div>
  );
}
// SendGrid Configuration Form
function SendGridConfigForm({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <Alert className="bg-green-50 dark:bg-green-950/20">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="text-sm">
            SendGrid offre 100 emails/jour gratuitement. 
            <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1 inline-flex items-center gap-1">
              Créer un compte SendGrid <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </AlertDescription>
      </Alert>
      <div>
        <Label htmlFor="api_key">Clé API SendGrid</Label>
        <Input
          id="api_key"
          type="password"
          value={formData.api_key}
          onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
          placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Créez une clé API dans Settings {'>'} API Keys sur SendGrid
        </p>
      </div>
    </div>
  );
}
// Mailgun Configuration Form
function MailgunConfigForm({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <Alert className="bg-purple-50 dark:bg-purple-950/20">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="text-sm">
            <a href="https://mailgun.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
              Créer un compte Mailgun <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </AlertDescription>
      </Alert>
      <div>
        <Label htmlFor="api_key">Clé API Mailgun</Label>
        <Input
          id="api_key"
          type="password"
          value={formData.api_key}
          onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
          placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxx"
        />
      </div>
      <div>
        <Label htmlFor="api_endpoint">Endpoint API</Label>
        <Input
          id="api_endpoint"
          value={formData.api_endpoint}
          onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
          placeholder="https://api.mailgun.net/v3/votredomaine.com/messages"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Format: https://api.mailgun.net/v3/VOTRE_DOMAINE/messages
        </p>
      </div>
    </div>
  );
}
