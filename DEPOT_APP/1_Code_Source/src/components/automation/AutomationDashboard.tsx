import React, { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Progress } from '@/components/ui/progress';

import { useAutomation } from '@/hooks/useAutomation';

import { WorkflowBuilder } from './WorkflowBuilder';

import { WorkflowExecutionHistory } from './WorkflowExecutionHistory';

import { WorkflowTemplates } from './WorkflowTemplates';

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

  TrendingUp

} from 'lucide-react';

import { format } from 'date-fns';

import { fr } from 'date-fns/locale';

import { toast } from 'react-hot-toast';



export function AutomationDashboard() {

  const {

    workflows,

    activeWorkflows,

    inactiveWorkflows,

    templates: _templates,

    loading: _loading,

    error: _error,

    stats,

    toggleWorkflow,

    deleteWorkflow,

    executeWorkflow,

    fetchWorkflowExecutions: _fetchWorkflowExecutions

  } = useAutomation();



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
    // eslint-disable-next-line no-alert
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce workflow ?')) {

      const success = await deleteWorkflow(workflowId);

      if (success) {

        toast.success('Workflow supprimé avec succès');

      } else {

        toast.error('Erreur lors de la suppression du workflow');

      }

    }

  };



  const handleExecuteWorkflow = async (workflowId: string) => {

    const success = await executeWorkflow(workflowId);

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

            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">

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



      {/* Statistics Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card>

          <CardContent className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">

                  Total Workflows

                </p>

                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">

                  {stats.totalWorkflows}

                </p>

              </div>

              <Activity className="h-8 w-8 text-blue-600" />

            </div>

          </CardContent>

        </Card>



        <Card>

          <CardContent className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">

                  Workflows Actifs

                </p>

                <p className="text-2xl font-bold text-green-600">

                  {stats.activeWorkflows}

                </p>

              </div>

              <Play className="h-8 w-8 text-green-600" />

            </div>

          </CardContent>

        </Card>



        <Card>

          <CardContent className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">

                  Exécutions Totales

                </p>

                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">

                  {stats.totalExecutions}

                </p>

              </div>

              <BarChart3 className="h-8 w-8 text-purple-600" />

            </div>

          </CardContent>

        </Card>



        <Card>

          <CardContent className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">

                  Taux de Réussite

                </p>

                <p className="text-2xl font-bold text-green-600">

                  {stats.successRate.toFixed(1)}%

                </p>

              </div>

              <TrendingUp className="h-8 w-8 text-green-600" />

            </div>

          </CardContent>

        </Card>

      </div>



      {/* Tabs */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <TabsList className="grid w-full grid-cols-4">

          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>

          <TabsTrigger value="active">Workflows Actifs</TabsTrigger>

          <TabsTrigger value="inactive">Workflows Inactifs</TabsTrigger>

          <TabsTrigger value="templates">Modèles</TabsTrigger>

        </TabsList>



        {/* Overview Tab */}

        <TabsContent value="overview" className="space-y-6">

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

                <div className="space-y-4">

                  {workflows.slice(0, 5).map((workflow) => (

                    <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">

                      <div className="flex items-center space-x-3">

                        <div className={`w-2 h-2 rounded-full ${workflow.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />

                        <div>

                          <p className="font-medium">{workflow.name}</p>

                          <p className="text-sm text-gray-600 dark:text-gray-400">

                            {workflow.last_run_at

                              ? `Dernière exécution: ${format(new Date(workflow.last_run_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}`

                              : 'Jamais exécuté'

                            }

                          </p>

                        </div>

                      </div>

                      <Badge className={workflow.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>

                        {workflow.is_active ? 'Actif' : 'Inactif'}

                      </Badge>

                    </div>

                  ))}

                </div>

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

                <div className="space-y-4">

                  {workflows.map((workflow) => (

                    <div key={workflow.id} className="space-y-2">

                      <div className="flex justify-between text-sm">

                        <span>{workflow.name}</span>

                        <span>{getSuccessRate(workflow).toFixed(1)}%</span>

                      </div>

                      <Progress value={getSuccessRate(workflow)} className="h-2" />

                    </div>

                  ))}

                </div>

              </CardContent>

            </Card>

          </div>

        </TabsContent>



        {/* Active Workflows Tab */}

        <TabsContent value="active" className="space-y-6">

          <div className="grid gap-6">

            {activeWorkflows.map((workflow) => (

              <Card key={workflow.id}>

                <CardContent className="p-6">

                  <div className="flex justify-between items-start mb-4">

                    <div className="flex items-start space-x-4">

                      <div className="flex-shrink-0">

                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">

                          <Play className="h-5 w-5 text-green-600 dark:text-green-400" />

                        </div>

                      </div>

                      <div className="flex-1">

                        <h3 className="text-lg font-semibold">{workflow.name}</h3>

                        <p className="text-gray-600 dark:text-gray-400 mb-2">

                          {workflow.description}

                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">

                          {workflow.next_run_at && (

                            <span>Prochaine exécution: {format(new Date(workflow.next_run_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>

                          )}

                        </div>

                      </div>

                    </div>



                    <div className="flex items-center space-x-2">

                      <Button

                        variant="outline"

                        size="sm"

                        onClick={() => setSelectedWorkflow(workflow.id)}

                      >

                        <Eye className="h-4 w-4" />

                      </Button>

                      <Button

                        variant="outline"

                        size="sm"

                        onClick={() => handleExecuteWorkflow(workflow.id)}

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

                      >

                        <Edit className="h-4 w-4" />

                      </Button>

                      <Button

                        variant="outline"

                        size="sm"

                        onClick={() => handleToggleWorkflow(workflow.id, false)}

                      >

                        <Pause className="h-4 w-4" />

                      </Button>

                      <Button

                        variant="outline"

                        size="sm"

                        onClick={() => handleDeleteWorkflow(workflow.id)}

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

        </TabsContent>



        {/* Inactive Workflows Tab */}

        <TabsContent value="inactive" className="space-y-6">

          <div className="grid gap-6">

            {inactiveWorkflows.map((workflow) => (

              <Card key={workflow.id} className="opacity-75">

                <CardContent className="p-6">

                  <div className="flex justify-between items-start">

                    <div className="flex items-start space-x-4">

                      <div className="flex-shrink-0">

                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">

                          <Pause className="h-5 w-5 text-gray-500 dark:text-gray-400" />

                        </div>

                      </div>

                      <div className="flex-1">

                        <h3 className="text-lg font-semibold">{workflow.name}</h3>

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

                      >

                        <Edit className="h-4 w-4" />

                      </Button>

                      <Button

                        variant="outline"

                        size="sm"

                        onClick={() => handleDeleteWorkflow(workflow.id)}

                      >

                        <Trash2 className="h-4 w-4" />

                      </Button>

                    </div>

                  </div>

                </CardContent>

              </Card>

            ))}

          </div>

        </TabsContent>



        {/* Templates Tab */}

        <TabsContent value="templates" className="space-y-6">

          <WorkflowTemplates />

        </TabsContent>

      </Tabs>

    </div>

  );

}
