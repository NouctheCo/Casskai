import { Play, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { toggleWorkflow, deleteWorkflow, triggerWorkflowManually } from '@/services/automationService';
import type { Workflow } from '@/types/automation.types';

interface WorkflowsListProps {
  workflows: Workflow[];
  onRefresh: () => void;
}

export default function WorkflowsList({ workflows, onRefresh }: WorkflowsListProps) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const { ConfirmDialog: ConfirmDialogComponent, confirm: confirmDialog } = useConfirmDialog();

  const handleToggle = async (workflow: Workflow) => {
    try {
      await toggleWorkflow(workflow.id, workflow.company_id, !workflow.is_active);
      showToast(workflow.is_active ? 'Workflow désactivé' : 'Workflow activé', 'success');
      onRefresh();
    } catch (_error) {
      showToast(t('automation.errors.modifying'), 'error');
    }
  };

  const handleDelete = async (workflow: Workflow) => {
    const confirmed = await confirmDialog({
      title: 'Supprimer le workflow',
      description: 'Êtes-vous sûr de vouloir supprimer ce workflow ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await deleteWorkflow(workflow.id);
      showToast(t('automation.success.workflowDeleted'), 'success');
      onRefresh();
    } catch (_error) {
      showToast(t('automation.errors.deleting'), 'error');
    }
  };

  const handleTest = async (workflow: Workflow) => {
    try {
      await triggerWorkflowManually(workflow.id);
      showToast(t('automation.success.workflowExecutedTest'), 'success');
      setTimeout(onRefresh, 2000);
    } catch (_error) {
      showToast(t('automation.errors.executing'), 'error');
    }
  };

  if (workflows.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground mb-4">Aucun workflow créé</p>
        <p className="text-sm text-muted-foreground">
          Commencez par activer un template dans l'onglet "Templates"
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ConfirmDialogComponent />
      {workflows.map((workflow) => (
        <Card key={workflow.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">{workflow.name}</h3>
                <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                  {workflow.is_active ? 'Actif' : 'Inactif'}
                </Badge>
                {workflow.is_template && (
                  <Badge variant="outline">Template</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Déclencheur: {workflow.trigger.type}</span>
                <span>{workflow.actions.length} action(s)</span>
                <span>{workflow.execution_count} exécution(s)</span>
                <span>Succès: {workflow.success_rate?.toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={workflow.is_active}
                onCheckedChange={() => handleToggle(workflow)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTest(workflow)}
                disabled={!workflow.is_active}
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(workflow)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
