import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Mail, Smartphone, Clock, Bell, Loader2, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface NotificationSettingsData {
  email: {
    newTransactions: boolean;
    weeklyReports: boolean;
    systemUpdates: boolean;
    marketing: boolean;
    invoices: boolean;
    payments: boolean;
    reminders: boolean;
  };
  push: {
    newTransactions: boolean;
    alerts: boolean;
    reminders: boolean;
    systemUpdates: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<NotificationSettingsData>({
    email: {
      newTransactions: true,
      weeklyReports: true,
      systemUpdates: false,
      marketing: false,
      invoices: true,
      payments: true,
      reminders: true
    },
    push: {
      newTransactions: false,
      alerts: true,
      reminders: true,
      systemUpdates: false
    },
    frequency: 'daily',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  // Fonction pour charger les paramètres de notifications
  const loadNotificationSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_notifications');

      if (error) {
        console.error('Erreur RPC get_user_notifications:', error);
        // Si pas de données, utiliser les valeurs par défaut (déjà définies dans le state)
        if (error.message?.includes('No rows found') || error.code === 'PGRST116') {
          console.warn('Aucun paramètre de notification trouvé, utilisation des valeurs par défaut');
        } else {
          throw error;
        }
      } else if (data && data.length > 0) {
        // Mapper les données de la base vers le format du state
        const notificationData = data[0];
        setSettings({
          email: {
            newTransactions: notificationData.email_new_transactions ?? true,
            weeklyReports: notificationData.email_weekly_reports ?? true,
            systemUpdates: notificationData.email_system_updates ?? false,
            marketing: notificationData.email_marketing ?? false,
            invoices: notificationData.email_invoices ?? true,
            payments: notificationData.email_payments ?? true,
            reminders: notificationData.email_reminders ?? true
          },
          push: {
            newTransactions: notificationData.push_new_transactions ?? false,
            alerts: notificationData.push_alerts ?? true,
            reminders: notificationData.push_reminders ?? true,
            systemUpdates: notificationData.push_system_updates ?? false
          },
          frequency: notificationData.notification_frequency ?? 'daily',
          quietHours: {
            enabled: notificationData.quiet_hours_enabled ?? false,
            start: notificationData.quiet_hours_start ?? '22:00',
            end: notificationData.quiet_hours_end ?? '08:00'
          }
        });
      }
    } catch (error) {
      console.error('Erreur chargement paramètres notifications:', error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paramètres de notifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les paramètres de notifications
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: _data, error } = await supabase.rpc('save_user_notifications', {
        p_email_new_transactions: settings.email.newTransactions,
        p_email_weekly_reports: settings.email.weeklyReports,
        p_email_system_updates: settings.email.systemUpdates,
        p_email_marketing: settings.email.marketing,
        p_email_invoices: settings.email.invoices,
        p_email_payments: settings.email.payments,
        p_email_reminders: settings.email.reminders,
        p_push_new_transactions: settings.push.newTransactions,
        p_push_alerts: settings.push.alerts,
        p_push_reminders: settings.push.reminders,
        p_push_system_updates: settings.push.systemUpdates,
        p_notification_frequency: settings.frequency,
        p_quiet_hours_enabled: settings.quietHours.enabled,
        p_quiet_hours_start: settings.quietHours.start,
        p_quiet_hours_end: settings.quietHours.end
      });

      if (error) {
        console.error('Erreur RPC save_user_notifications:', error);
        throw error;
      }

      toast({
        title: 'Paramètres sauvegardés',
        description: 'Vos préférences de notifications ont été mises à jour'
      });

      // Recharger les données après sauvegarde pour s'assurer que l'interface est à jour
      await loadNotificationSettings();
    } catch (error) {
      console.error('Erreur sauvegarde paramètres notifications:', error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateEmailSetting = (key: keyof NotificationSettingsData['email'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: value
      }
    }));
  };

  const updatePushSetting = (key: keyof NotificationSettingsData['push'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      push: {
        ...prev.push,
        [key]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications par email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notifications par email
          </CardTitle>
          <CardDescription>
            Choisissez les notifications que vous souhaitez recevoir par email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Nouvelles transactions</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir un email pour chaque nouvelle transaction
                </p>
              </div>
              <Switch
                checked={settings.email.newTransactions}
                onCheckedChange={(checked) => updateEmailSetting('newTransactions', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Rapports hebdomadaires</Label>
                <p className="text-sm text-muted-foreground">
                  Résumé hebdomadaire de votre activité
                </p>
              </div>
              <Switch
                checked={settings.email.weeklyReports}
                onCheckedChange={(checked) => updateEmailSetting('weeklyReports', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Factures</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications pour les factures émises et reçues
                </p>
              </div>
              <Switch
                checked={settings.email.invoices}
                onCheckedChange={(checked) => updateEmailSetting('invoices', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Paiements</Label>
                <p className="text-sm text-muted-foreground">
                  Confirmations de paiements reçus et envoyés
                </p>
              </div>
              <Switch
                checked={settings.email.payments}
                onCheckedChange={(checked) => updateEmailSetting('payments', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Rappels</Label>
                <p className="text-sm text-muted-foreground">
                  Rappels pour échéances et tâches importantes
                </p>
              </div>
              <Switch
                checked={settings.email.reminders}
                onCheckedChange={(checked) => updateEmailSetting('reminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Mises à jour système</Label>
                <p className="text-sm text-muted-foreground">
                  Nouvelles fonctionnalités et maintenance
                </p>
              </div>
              <Switch
                checked={settings.email.systemUpdates}
                onCheckedChange={(checked) => updateEmailSetting('systemUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Communications marketing</Label>
                <p className="text-sm text-muted-foreground">
                  Newsletters et offres spéciales
                </p>
              </div>
              <Switch
                checked={settings.email.marketing}
                onCheckedChange={(checked) => updateEmailSetting('marketing', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications push */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Notifications push
          </CardTitle>
          <CardDescription>
            Notifications directement sur votre navigateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Nouvelles transactions</Label>
                <p className="text-sm text-muted-foreground">
                  Alertes en temps réel pour les transactions
                </p>
              </div>
              <Switch
                checked={settings.push.newTransactions}
                onCheckedChange={(checked) => updatePushSetting('newTransactions', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Alertes importantes</Label>
                <p className="text-sm text-muted-foreground">
                  Alertes de sécurité et problèmes critiques
                </p>
              </div>
              <Switch
                checked={settings.push.alerts}
                onCheckedChange={(checked) => updatePushSetting('alerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Rappels</Label>
                <p className="text-sm text-muted-foreground">
                  Rappels pour vos tâches et échéances
                </p>
              </div>
              <Switch
                checked={settings.push.reminders}
                onCheckedChange={(checked) => updatePushSetting('reminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Mises à jour système</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications de maintenance et nouvelles fonctionnalités
                </p>
              </div>
              <Switch
                checked={settings.push.systemUpdates}
                onCheckedChange={(checked) => updatePushSetting('systemUpdates', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fréquence et heures calmes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Fréquence et heures calmes
          </CardTitle>
          <CardDescription>
            Contrôlez quand et comment vous recevez les notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Fréquence des notifications</Label>
            <Select
              value={settings.frequency}
              onValueChange={(value: 'immediate' | 'daily' | 'weekly') =>
                setSettings(prev => ({ ...prev, frequency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immédiat</SelectItem>
                <SelectItem value="daily">Récapitulatif quotidien</SelectItem>
                <SelectItem value="weekly">Récapitulatif hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Heures calmes</Label>
                <p className="text-sm text-muted-foreground">
                  Ne pas envoyer de notifications pendant ces heures
                </p>
              </div>
              <Switch
                checked={settings.quietHours.enabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, enabled: checked }
                  }))
                }
              />
            </div>

            {settings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4 ml-4">
                <div className="space-y-2">
                  <Label htmlFor="quietStart">Début</Label>
                  <Input
                    id="quietStart"
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, start: e.target.value }
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quietEnd">Fin</Label>
                  <Input
                    id="quietEnd"
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, end: e.target.value }
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Résumé des notifications actives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Résumé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(settings.email).filter(Boolean).length}
              </div>
              <div className="text-sm text-blue-600">Notifications email</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
              <Smartphone className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {Object.values(settings.push).filter(Boolean).length}
              </div>
              <div className="text-sm text-green-600">Notifications push</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {settings.frequency === 'immediate' ? 'Temps réel' :
                 settings.frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'}
              </div>
              <div className="text-sm text-orange-600">Fréquence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder les paramètres
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
