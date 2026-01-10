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
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { emailService, EmailConfiguration } from '@/services/emailService';
import { toast } from 'react-hot-toast';

export function EmailConfigurationSettings() {
  const { currentCompany } = useAuth();
  const [configurations, setConfigurations] = useState<EmailConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    if (currentCompany?.id) {
      loadConfigurations();
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
      console.error('Error loading configurations:', error);
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des configurations...</p>
      </div>
    );
  }

  if (showWizard || configurations.length === 0) {
    return <EmailConfigurationWizard onComplete={() => {
      setShowWizard(false);
      loadConfigurations();
    }} />;
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
        <Button onClick={() => setShowWizard(true)}>
          <Zap className="h-4 w-4 mr-2" />
          Nouvelle Configuration
        </Button>
      </div>

      {/* Configurations List */}
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

      {/* Help Section */}
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
    smtp_port: 587
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
  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 dark:bg-blue-950/20">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">Configuration SMTP - Guide rapide:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li><strong>Gmail:</strong> smtp.gmail.com:587 (nécessite un mot de passe d'application)</li>
            <li><strong>Outlook:</strong> smtp-mail.outlook.com:587</li>
            <li><strong>O2Switch:</strong> mail.votredomaine.com:587</li>
          </ul>
          <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mt-2 inline-flex items-center gap-1">
            Comment créer un mot de passe d'application Gmail <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      <div>
        <Label htmlFor="smtp_host">Serveur SMTP</Label>
        <Input
          id="smtp_host"
          value={formData.smtp_host}
          onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
          placeholder="smtp.gmail.com"
        />
      </div>

      <div>
        <Label htmlFor="smtp_port">Port</Label>
        <Select 
          value={formData.smtp_port?.toString()}
          onValueChange={(value) => setFormData({ ...formData, smtp_port: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="587">587 (TLS - Recommandé)</SelectItem>
            <SelectItem value="465">465 (SSL)</SelectItem>
            <SelectItem value="25">25 (Non sécurisé)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="smtp_username">Nom d'utilisateur</Label>
        <Input
          id="smtp_username"
          value={formData.smtp_username}
          onChange={(e) => setFormData({ ...formData, smtp_username: e.target.value })}
          placeholder="votre@email.com"
        />
      </div>

      <div>
        <Label htmlFor="smtp_password">Mot de passe</Label>
        <Input
          id="smtp_password"
          type="password"
          value={formData.smtp_password}
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
