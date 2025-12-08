import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import type { WorkflowExecution, Workflow } from '@/types/automation.types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExecutionHistoryProps {
  companyId?: string;
  workflowId?: string; // Pour filtrer par workflow spécifique
}

export default function ExecutionHistory({ companyId, workflowId }: ExecutionHistoryProps) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>(workflowId || 'all');
  const [dateFilter, setDateFilter] = useState<string>('7days');

  useEffect(() => {
    loadData();
  }, [companyId, statusFilter, workflowFilter, dateFilter]);

  const loadData = async () => {
    if (!companyId) return;

    try {
      setLoading(true);

      // Charger les workflows pour afficher les noms
      const { data: workflowsData } = await supabase
        .from('workflows')
        .select('*')
        .eq('company_id', companyId);

      setWorkflows((workflowsData as Workflow[]) || []);

      // Construire la requête avec filtres
      let query = supabase
        .from('workflow_executions')
        .select('*')
        .eq('company_id', companyId)
        .order('started_at', { ascending: false })
        .limit(50);

      // Filtre par statut
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Filtre par workflow
      if (workflowFilter !== 'all') {
        query = query.eq('workflow_id', workflowFilter);
      }

      // Filtre par date
      const now = new Date();
      let dateThreshold: Date | null = null;

      switch (dateFilter) {
        case '24hours':
          dateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7days':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      if (dateThreshold) {
        query = query.gte('started_at', dateThreshold.toISOString());
      }

      const { data: executionsData, error } = await query;

      if (error) throw error;

      setExecutions(executionsData || []);

    } catch (error) {
      console.error('Error loading executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      success: 'default',
      failed: 'destructive',
      cancelled: 'secondary',
      running: 'outline'
    };

    const labels: Record<string, string> = {
      success: 'Succès',
      failed: 'Échec',
      cancelled: 'Annulé',
      running: 'En cours'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getWorkflowName = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    return workflow?.name || 'Workflow inconnu';
  };

  const formatDuration = (started: string, completed?: string) => {
    if (!completed) return 'En cours...';

    const start = new Date(started).getTime();
    const end = new Date(completed).getTime();
    const durationMs = end - start;

    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`;
    return `${Math.round(durationMs / 60000)}min`;
  };

  const toggleExpand = (executionId: string) => {
    setExpandedId(expandedId === executionId ? null : executionId);
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Chargement de l'historique...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtres :</span>
          </div>

          {/* Filtre par statut */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="success">Succès</SelectItem>
              <SelectItem value="failed">Échec</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
              <SelectItem value="running">En cours</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre par workflow */}
          {!workflowId && (
            <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Workflow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les workflows</SelectItem>
                {workflows.map(workflow => (
                  <SelectItem key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Filtre par date */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24hours">24 dernières heures</SelectItem>
              <SelectItem value="7days">7 derniers jours</SelectItem>
              <SelectItem value="30days">30 derniers jours</SelectItem>
              <SelectItem value="all">Toute la période</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset filtres */}
          {(statusFilter !== 'all' || workflowFilter !== 'all' || dateFilter !== '7days') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setWorkflowFilter('all');
                setDateFilter('7days');
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Liste des exécutions */}
      {executions.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucune exécution trouvée</h3>
          <p className="text-sm text-muted-foreground">
            {statusFilter !== 'all' || workflowFilter !== 'all' || dateFilter !== '7days'
              ? 'Essayez de modifier les filtres pour voir plus de résultats.'
              : 'Les workflows activés apparaîtront ici après leur première exécution.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {executions.map((execution) => (
            <Card key={execution.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getStatusIcon(execution.status)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">
                        {getWorkflowName(execution.workflow_id)}
                      </h4>
                      {getStatusBadge(execution.status)}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span>
                        {formatDistanceToNow(new Date(execution.started_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        Durée : {formatDuration(execution.started_at, execution.completed_at)}
                      </span>
                      <span>•</span>
                      <span>
                        Actions : {execution.actions_success || 0} / {execution.actions_total || 0}
                      </span>
                    </div>

                    {/* Message d'erreur si échec */}
                    {execution.status === 'failed' && execution.error_message && (
                      <div className="bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-400 px-3 py-2 rounded text-sm">
                        <strong>Erreur :</strong> {execution.error_message}
                      </div>
                    )}

                    {/* Détails des étapes (expandable) */}
                    {expandedId === execution.id && execution.steps_executed && execution.steps_executed.length > 0 && (
                      <div className="mt-3 space-y-2 border-t pt-3">
                        <h5 className="text-sm font-semibold mb-2">Détail des étapes :</h5>
                        {execution.steps_executed.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-sm p-2 rounded bg-muted/50"
                          >
                            <div className="mt-0.5">
                              {step.status === 'success' && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                              {step.status === 'failed' && (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              {step.status === 'skipped' && (
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{step.action_type}</div>
                              {step.error_message && (
                                <div className="text-xs text-red-600 mt-1">
                                  {step.error_message}
                                </div>
                              )}
                              {step.result && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {JSON.stringify(step.result).substring(0, 100)}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {step.duration_ms}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bouton expand/collapse */}
                {execution.steps_executed && execution.steps_executed.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(execution.id)}
                    className="ml-2"
                  >
                    {expandedId === execution.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
