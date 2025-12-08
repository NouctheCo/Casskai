import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAutomation } from '@/hooks/useAutomation';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  BarChart3,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WorkflowExecutionHistoryProps {
  workflowId: string;
  onClose: () => void;
}

export function WorkflowExecutionHistory({ workflowId, onClose }: WorkflowExecutionHistoryProps) {
  const {
    workflows,
    workflowExecutions,
    executionsLoading,
    fetchWorkflowExecutions
  } = useAutomation();

  const workflow = workflows.find(w => w.id === workflowId);
  const executions = workflowExecutions[workflowId] || [];

  useEffect(() => {
    fetchWorkflowExecutions(workflowId);
  }, [workflowId, fetchWorkflowExecutions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'failed': return XCircle;
      case 'running': return Play;
      case 'pending': return Clock;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExecutionDuration = (execution: any) => {
    if (!execution.completed_at) return 'En cours...';

    const start = new Date(execution.started_at);
    const end = new Date(execution.completed_at);
    const duration = end.getTime() - start.getTime();

    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${Math.round(duration / 1000)}s`;
    return `${Math.round(duration / 60000)}min`;
  };

  if (!workflow) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Workflow introuvable</p>
          <Button onClick={onClose} className="mt-4">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{workflow.name}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Historique d'exécution du workflow
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total Exécutions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
                  {executions.length}
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Succès
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {executions.filter(e => e.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Échecs
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {executions.filter(e => e.status === 'failed').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Taux de Réussite
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {executions.length > 0 ? ((executions.filter(e => e.status === 'completed').length / executions.length) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique des Exécutions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {executionsLoading[workflowId] ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Chargement de l'historique...</p>
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300">
                Aucune exécution trouvée pour ce workflow
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => {
                const StatusIcon = getStatusIcon(execution.status);
                return (
                  <Card key={execution.id} className="border-l-4 border-l-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <StatusIcon className={`h-5 w-5 ${
                              execution.status === 'completed' ? 'text-green-600' :
                              execution.status === 'failed' ? 'text-red-600' :
                              execution.status === 'running' ? 'text-blue-600' :
                              'text-yellow-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Badge className={getStatusColor(execution.status)}>
                                {execution.status === 'completed' && 'Terminé'}
                                {execution.status === 'failed' && 'Échec'}
                                {execution.status === 'running' && 'En cours'}
                                {execution.status === 'pending' && 'En attente'}
                              </Badge>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {format(new Date(execution.started_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                Durée: {getExecutionDuration(execution)}
                              </span>
                            </div>

                            {execution.error_message && (
                              <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-700 dark:text-red-400">
                                  <strong>Erreur:</strong> {execution.error_message}
                                </p>
                              </div>
                            )}

                            {/* Action Results */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-white">
                                Résultats des actions:
                              </h4>
                              <div className="grid gap-2">
                                {execution.result && Array.isArray(execution.result) && execution.result.map((result: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                                    <div className="flex items-center space-x-2">
                                      {result.status === 'success' ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                      )}
                                      <span>Action {index + 1}</span>
                                    </div>
                                    <div className="text-right">
                                      {result.status === 'success' ? (
                                        <span className="text-green-600">Succès</span>
                                      ) : (
                                        <span className="text-red-600 dark:text-red-400" title={result.error}>
                                          Échec
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
