import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAutomation } from '@/hooks/useAutomation';
import { WorkflowAction, TriggerConfig, TriggerType } from '@/services/automationService';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Zap,
  Mail,
  FileText,
  Bell,
  Database,
  Settings,
  Play,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowBuilderProps {
  workflowId?: string | null;
  onClose: () => void;
}

export function WorkflowBuilder({ workflowId, onClose }: WorkflowBuilderProps) {
  const { workflows, createWorkflow, updateWorkflow } = useAutomation();

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    is_active: boolean;
    trigger_type: TriggerType;
    trigger_config: TriggerConfig;
    actions: WorkflowAction[];
  }>({
    name: '',
    description: '',
    is_active: true,
    trigger_type: 'schedule',
    trigger_config: {
      frequency: 'daily',
      time: '09:00',
      day: 1
    },
    actions: []
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load existing workflow if editing
  useEffect(() => {
    if (workflowId) {
      const workflow = workflows.find(w => w.id === workflowId);
      if (workflow) {
        setFormData({
          name: workflow.name,
          description: workflow.description || '',
          is_active: workflow.is_active,
          trigger_type: workflow.trigger_type,
          trigger_config: workflow.trigger_config,
          actions: workflow.actions
        });
      }
    }
  }, [workflowId, workflows]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTriggerConfigChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      trigger_config: {
        ...prev.trigger_config,
        [field]: value
      }
    }));
  };

  const addAction = () => {
    const newAction: WorkflowAction = {
      id: `action-${Date.now()}`,
      type: 'send_email',
      config: {
        recipients: [],
        subject: '',
        template: ''
      },
      order: formData.actions.length + 1
    };

    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const updateAction = (actionId: string, updates: Partial<WorkflowAction>) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map(action =>
        action.id === actionId ? { ...action, ...updates } : action
      )
    }));
  };

  const removeAction = (actionId: string) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter(action => action.id !== actionId)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom du workflow est requis');
      return;
    }

    if (formData.actions.length === 0) {
      toast.error('Au moins une action est requise');
      return;
    }

    setIsSaving(true);

    try {
      const workflowData = {
        ...formData,
        icon: 'zap',
        color: 'blue',
        category: 'custom' as const,
        is_template: false,
        created_by: '',
        last_run_at: null as string | null,
        next_run_at: null as string | null
      };

      const success = workflowId
        ? await updateWorkflow(workflowId, formData)
        : await createWorkflow(workflowData);

      if (success) {
        toast.success(workflowId ? 'Workflow mis à jour' : 'Workflow créé avec succès');
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderTriggerConfig = () => {
    switch (formData.trigger_type) {
      case 'schedule':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fréquence</Label>
                <Select
                  value={formData.trigger_config.frequency}
                  onValueChange={(value) => handleTriggerConfigChange('frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={formData.trigger_config.time}
                  onChange={(e) => handleTriggerConfigChange('time', e.target.value)}
                />
              </div>
            </div>

            {formData.trigger_config.frequency === 'weekly' && (
              <div>
                <Label>Jour de la semaine</Label>
                <Select
                  value={formData.trigger_config.day?.toString()}
                  onValueChange={(value) => handleTriggerConfigChange('day', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Lundi</SelectItem>
                    <SelectItem value="2">Mardi</SelectItem>
                    <SelectItem value="3">Mercredi</SelectItem>
                    <SelectItem value="4">Jeudi</SelectItem>
                    <SelectItem value="5">Vendredi</SelectItem>
                    <SelectItem value="6">Samedi</SelectItem>
                    <SelectItem value="0">Dimanche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.trigger_config.frequency === 'monthly' && (
              <div>
                <Label>Jour du mois</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.trigger_config.day}
                  onChange={(e) => handleTriggerConfigChange('day', parseInt(e.target.value))}
                />
              </div>
            )}
          </div>
        );
      default:
        return <div>Configuration de déclencheur non implémentée</div>;
    }
  };

  const renderActionConfig = (action: WorkflowAction) => {
    switch (action.type) {
      case 'send_email':
        return (
          <div className="space-y-3">
            <div>
              <Label>Destinataires (séparés par des virgules)</Label>
              <Input
                placeholder="admin@example.com, manager@example.com"
                value={action.config.recipients?.join(', ') || ''}
                onChange={(e) => updateAction(action.id, {
                  config: {
                    ...action.config,
                    recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                  }
                })}
              />
            </div>
            <div>
              <Label>Sujet</Label>
              <Input
                value={action.config.subject || ''}
                onChange={(e) => updateAction(action.id, {
                  config: {
                    ...action.config,
                    subject: e.target.value
                  }
                })}
              />
            </div>
            <div>
              <Label>Template</Label>
              <Select
                value={action.config.template || ''}
                onValueChange={(value) => updateAction(action.id, {
                  config: {
                    ...action.config,
                    template: value
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly_report">Rapport Hebdomadaire</SelectItem>
                  <SelectItem value="monthly_summary">Résumé Mensuel</SelectItem>
                  <SelectItem value="overdue_invoice">Facture en Retard</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'generate_report':
        return (
          <div className="space-y-3">
            <div>
              <Label>Type de rapport</Label>
              <Select
                value={action.config.report_type || ''}
                onValueChange={(value) => updateAction(action.id, {
                  config: {
                    ...action.config,
                    report_type: value
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance_sheet">Bilan Comptable</SelectItem>
                  <SelectItem value="income_statement">Compte de Résultat</SelectItem>
                  <SelectItem value="trial_balance">Balance Générale</SelectItem>
                  <SelectItem value="general_ledger">Grand Livre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <Select
                value={action.config.format || 'pdf'}
                onValueChange={(value) => updateAction(action.id, {
                  config: {
                    ...action.config,
                    format: value as 'pdf' | 'xlsx' | 'csv'
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'notification':
        return (
          <div className="space-y-3">
            <div>
              <Label>Message</Label>
              <Textarea
                value={action.config.message || ''}
                onChange={(e) => updateAction(action.id, {
                  config: {
                    ...action.config,
                    message: e.target.value
                  }
                })}
              />
            </div>
            <div>
              <Label>Type de notification</Label>
              <Select
                value={action.config.notification_type || 'info'}
                onValueChange={(value) => updateAction(action.id, {
                  config: {
                    ...action.config,
                    notification_type: value as 'info' | 'success' | 'warning' | 'error'
                  }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'update_record':
        return (
          <div className="space-y-3">
            <div>
              <Label>Table</Label>
              <Input
                placeholder="ex: invoices, clients, projects"
                value={action.config.table || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, table: e.target.value }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Champ</Label>
                <Input
                  placeholder="ex: status"
                  value={action.config.field || ''}
                  onChange={(e) => updateAction(action.id, {
                    config: { ...action.config, field: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Valeur</Label>
                <Input
                  placeholder="ex: paid"
                  value={(action.config.value ?? '').toString()}
                  onChange={(e) => updateAction(action.id, {
                    config: { ...action.config, value: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        );

      case 'create_invoice':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client ID</Label>
                <Input
                  placeholder="ex: uuid du client"
                  value={(action.config.client_id ?? '').toString()}
                  onChange={(e) => updateAction(action.id, {
                    config: { ...action.config, client_id: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Montant</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={action.config.amount?.toString() || ''}
                  onChange={(e) => updateAction(action.id, {
                    config: { ...action.config, amount: parseFloat(e.target.value) }
                  })}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Description de la facture"
                value={action.config.description || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, description: e.target.value }
                })}
              />
            </div>
          </div>
        );

      default:
        return <div>Configuration d'action non implémentée</div>;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email': return Mail;
      case 'generate_report': return FileText;
      case 'notification': return Bell;
      case 'create_invoice': return FileText;
      case 'update_record': return Database;
      default: return Settings;
    }
  };

  const getActionTitle = (type: string) => {
    switch (type) {
      case 'send_email': return 'Envoi d\'email';
      case 'generate_report': return 'Génération de rapport';
      case 'notification': return 'Notification';
      case 'update_record': return 'Mise à jour de données';
      case 'create_invoice': return 'Création de facture';
      default: return 'Action';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {workflowId ? 'Modifier le Workflow' : 'Nouveau Workflow'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Configurez les déclencheurs et actions de votre workflow
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label>Workflow actif</Label>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du Workflow</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Rappels factures mensuels"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Décrivez l'objectif de ce workflow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Trigger Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Déclencheur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Type de déclencheur</Label>
                <Select
                  value={formData.trigger_type}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    trigger_type: value as TriggerType
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule">Planification</SelectItem>
                    <SelectItem value="event" disabled>Événement (Bientôt)</SelectItem>
                    <SelectItem value="condition" disabled>Condition (Bientôt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderTriggerConfig()}
            </CardContent>
          </Card>
        </div>

        {/* Actions Configuration */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Actions ({formData.actions.length})
                </CardTitle>
                <Button onClick={addAction} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une Action
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.actions.length === 0 ? (
                <div className="text-center py-8">
                  <Play className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Aucune action configurée. Ajoutez une action pour que ce workflow soit fonctionnel.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.actions.map((action, index) => {
                    const Icon = getActionIcon(action.type);
                    return (
                      <Card key={action.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold">Action {index + 1}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {getActionTitle(action.type)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Select
                                value={action.type}
                                onValueChange={(value) => updateAction(action.id, { type: value as any })}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="send_email">Envoi d'email</SelectItem>
                                  <SelectItem value="generate_report">Génération de rapport</SelectItem>
                                  <SelectItem value="notification">Notification</SelectItem>
                                  <SelectItem value="update_record">Mise à jour</SelectItem>
                                  <SelectItem value="create_invoice">Création facture</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeAction(action.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {renderActionConfig(action)}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
