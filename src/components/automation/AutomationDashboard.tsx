import React, { useState } from 'react';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAutomation } from '@/hooks/useAutomation';
import { WorkflowBuilder } from './WorkflowBuilder';
import { WorkflowExecutionHistory } from './WorkflowExecutionHistory';
import { WorkflowTemplates } from './WorkflowTemplates';
import { EmailConfigurationSettings } from '@/components/settings/EmailConfigurationSettings';
import {
  Play,
  Pause,
  Plus,
  Eye,
  Edit,
  Trash2,
  Activity,
  Clock,
  Zap,
  BarChart3,
  Bot,
  TrendingUp,
  AlertCircle,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export function AutomationDashboard() {
  const {
    workflows,
    activeWorkflows,
    inactiveWorkflows,
    templates: _templates,
    loading,
    error,
    stats,
    toggleWorkflow,
    deleteWorkflow,
    executeWorkflow,
    fetchWorkflowExecutions: _fetchWorkflowExecutions
  } = useAutomation();

  const { ConfirmDialog: ConfirmDialogComponent, confirm: confirmDialog } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState('overview');
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    const success = await toggleWorkflow(workflowId, isActive);
    if (success) {
      toast.success(`Workflow ${isActive ? 'activé' : 'désactivé'} avec succès`);
    } else {
      toast.error('Erreur lors de la modification du workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    const confirmed = await confirmDialog({
      title: 'Supprimer le workflow',
      description: 'Êtes-vous sûr de vouloir supprimer ce workflow ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive',
    });
    if (confirmed) {
      const success = await deleteWorkflow(workflowId);
      if (success) {
        toast.success('Workflow supprimé avec succès');
      } else {
        toast.error('Erreur lors de la suppression du workflow');
      }
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    const toastId = toast.loading('Exécution du workflow en cours...');
    const success = await executeWorkflow(workflowId);
    toast.dismiss(toastId);
    if (success) {
      toast.success('Workflow exécuté avec succès');
    } else {
      toast.error('Erreur lors de l\'exécution du workflow');
    }
  };

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuccessRate = (_workflow: any) => {
    // This could be enhanced to calculate real success rate
    return 0;
  };

  if (showWorkflowBuilder) {
    return (
      <WorkflowBuilder
        workflowId={editingWorkflow}
        onClose={() => {
          setShowWorkflowBuilder(false);
          setEditingWorkflow(null);
        }}
      />
    );
  }

  if (selectedWorkflow) {
    return (
      <WorkflowExecutionHistory
        workflowId={selectedWorkflow}
        onClose={() => setSelectedWorkflow(null)}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Automation Center
            </h1>
            <Bot className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Automatisez vos processus métier et gagnez en efficacité
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setActiveTab('templates')}
          >
            <Zap className="h-4 w-4 mr-2" />
            Modèles
          </Button>
          <Button
            onClick={() => setShowWorkflowBuilder(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Workflow
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Workflows
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalWorkflows}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Workflows Actifs
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.activeWorkflows}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Exécutions Totales
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalExecutions}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Taux de Réussite
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.successRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="active">Workflows Actifs ({activeWorkflows.length})</TabsTrigger>
          <TabsTrigger value="inactive">Workflows Inactifs ({inactiveWorkflows.length})</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Configuration Email
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des workflows...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Activité Récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workflows.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>Aucun workflow créé pour le moment</p>
                      <Button
                        onClick={() => setShowWorkflowBuilder(true)}
                        variant="outline"
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Créer votre premier workflow
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {workflows.slice(0, 5).map((workflow) => (
                        <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${workflow.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} aria-label={workflow.is_active ? 'Actif' : 'Inactif'} />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{workflow.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {workflow.last_run_at
                                  ? `Dernière exécution: ${format(new Date(workflow.last_run_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}`
                                  : 'Jamais exécuté'
                                }
                              </p>
                            </div>
                          </div>
                          <Badge className={workflow.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
                            {workflow.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance des Workflows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workflows.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Pas de données de performance disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {workflows.slice(0, 5).map((workflow) => (
                        <div key={workflow.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{workflow.name}</span>
                            <span className="text-gray-600 dark:text-gray-400">{getSuccessRate(workflow).toFixed(1)}%</span>
                          </div>
                          <Progress value={getSuccessRate(workflow)} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Active Workflows Tab */}
        <TabsContent value="active" className="space-y-6">
          {activeWorkflows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Play className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Aucun workflow actif</p>
                <Button onClick={() => setActiveTab('templates')} variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Parcourir les modèles
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {activeWorkflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{workflow.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {workflow.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            {workflow.next_run_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Prochaine: {format(new Date(workflow.next_run_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWorkflow(workflow.id)}
                          title="Voir l'historique"
                          aria-label="Voir l'historique"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExecuteWorkflow(workflow.id)}
                          title="Exécuter maintenant"
                          aria-label="Exécuter maintenant"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingWorkflow(workflow.id);
                            setShowWorkflowBuilder(true);
                          }}
                          title="Modifier"
                          aria-label="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleWorkflow(workflow.id, false)}
                          title="Désactiver"
                          aria-label="Désactiver"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          title="Supprimer"
                          aria-label="Supprimer"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Workflow Actions Summary */}
                    <div className="flex flex-wrap gap-2">
                      {workflow.actions.map((action, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {action.type === 'send_email' && '📧 Email'}
                          {action.type === 'generate_report' && '📊 Rapport'}
                          {action.type === 'update_record' && '📝 Mise à jour'}
                          {action.type === 'notification' && '🔔 Notification'}
                          {action.type === 'create_invoice' && '🧾 Facture'}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Inactive Workflows Tab */}
        <TabsContent value="inactive" className="space-y-6">
          {inactiveWorkflows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Pause className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucun workflow inactif</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {inactiveWorkflows.map((workflow) => (
                <Card key={workflow.id} className="opacity-75 hover:opacity-100 transition-opacity hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                            <Pause className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{workflow.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {workflow.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Dernière exécution: {workflow.last_run_at ? format(new Date(workflow.last_run_at), 'dd/MM/yyyy', { locale: fr }) : 'Jamais'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleWorkflow(workflow.id, true)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          title="Activer"
                          aria-label="Activer"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingWorkflow(workflow.id);
                            setShowWorkflowBuilder(true);
                          }}
                          title="Modifier"
                          aria-label="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          title="Supprimer"
                          aria-label="Supprimer"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <WorkflowTemplates onCreateCustomTemplate={() => setShowWorkflowBuilder(true)} />
        </TabsContent>

        {/* Email Configuration Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuration Email pour Automations
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Configurez vos paramètres d'envoi d'emails pour utiliser la fonctionnalité "Envoyer un Email" dans vos workflows d'automation.
                Vous pouvez configurer SMTP, SendGrid, Mailgun ou AWS SES.
              </p>
            </CardHeader>
            <CardContent>
              <EmailConfigurationSettings />
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    💡 Comment utiliser les emails dans vos workflows
                  </h3>
                  <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-2 ml-4 list-decimal">
                    <li>Configurez d'abord votre fournisseur d'emails ci-dessus</li>
                    <li>Testez l'envoi pour vérifier que tout fonctionne</li>
                    <li>Activez la configuration</li>
                    <li>Dans vos workflows, ajoutez l'action "Envoyer un Email"</li>
                    <li>Spécifiez les destinataires et le contenu</li>
                    <li>Utilisez des variables comme {'{nom}'}, {'{montant}'}, {'{date}'} dans vos messages</li>
                  </ol>
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Exemple de workflow avec email :
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      "Quand une facture est créée → Envoyer un email au client avec les détails"
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ConfirmDialogComponent />
    </div>
  );
}
