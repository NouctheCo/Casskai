/**
 * Workflow Actions Component
 *
 * Displays workflow action buttons for journal entries based on their current status.
 * Implements the multi-level validation workflow:
 * draft -> review -> validated -> posted
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import {
  CheckCircle,
  XCircle,
  Send,
  Lock,
  Unlock,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { logger } from '@/lib/logger';
import {
  submitEntryForReview,
  approveEntry,
  rejectEntry,
  postJournalEntry,
  type JournalEntryStatus
} from '@/services/accounting/workflowValidationService';
interface WorkflowActionsProps {
  entryId: string;
  companyId: string;
  currentStatus: JournalEntryStatus;
  isLocked?: boolean;
  onStatusChange?: () => void;
  compact?: boolean;
}
type ActionType = 'submit' | 'approve' | 'reject' | 'post';
export function WorkflowActions({
  entryId,
  companyId,
  currentStatus,
  isLocked = false,
  onStatusChange,
  compact = false
}: WorkflowActionsProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [comment, setComment] = useState('');
  // Status badge configuration
  const statusConfig: Record<JournalEntryStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: {
      label: 'Brouillon',
      color: 'bg-gray-500',
      icon: <FileCheck className="w-3 h-3" />
    },
    review: {
      label: 'En révision',
      color: 'bg-blue-500',
      icon: <AlertCircle className="w-3 h-3" />
    },
    validated: {
      label: 'Validé',
      color: 'bg-green-500',
      icon: <CheckCircle className="w-3 h-3" />
    },
    posted: {
      label: 'Comptabilisé',
      color: 'bg-purple-500',
      icon: <Lock className="w-3 h-3" />
    },
    cancelled: {
      label: 'Annulé',
      color: 'bg-red-500',
      icon: <XCircle className="w-3 h-3" />
    }
  };
  // Determine available actions based on current status
  const getAvailableActions = (): ActionType[] => {
    if (isLocked || currentStatus === 'posted' || currentStatus === 'cancelled') {
      return [];
    }
    switch (currentStatus) {
      case 'draft':
        return ['submit'];
      case 'review':
        return ['approve', 'reject'];
      case 'validated':
        return ['post', 'reject'];
      default:
        return [];
    }
  };
  // Open confirmation dialog
  const openDialog = (action: ActionType) => {
    setActionType(action);
    setComment('');
    setDialogOpen(true);
  };
  // Execute workflow action
  const executeAction = async () => {
    if (!actionType) return;
    setLoading(true);
    try {
      let result;
      switch (actionType) {
        case 'submit':
          result = await submitEntryForReview(entryId, companyId, comment);
          break;
        case 'approve':
          result = await approveEntry(entryId, companyId, comment);
          break;
        case 'reject':
          result = await rejectEntry(entryId, companyId, comment || 'Rejeté');
          break;
        case 'post':
          result = await postJournalEntry(entryId, companyId);
          break;
        default:
          throw new Error('Action inconnue');
      }
      if (result.success) {
        showToast(result.message || 'Action exécutée avec succès', 'success');
        setDialogOpen(false);
        onStatusChange?.();
      } else {
        showToast(result.error || 'Échec de l\'action', 'error');
      }
    } catch (error) {
      logger.error('WorkflowActions', 'Error executing workflow action:', error);
      showToast('Erreur lors de l\'exécution de l\'action', 'error');
    } finally {
      setLoading(false);
    }
  };
  const availableActions = getAvailableActions();
  // Action button configuration
  const actionButtons: Record<ActionType, { label: string; icon: React.ReactNode; variant: any; description: string }> = {
    submit: {
      label: 'Soumettre',
      icon: <Send className="w-4 h-4" />,
      variant: 'default',
      description: 'Soumettre cette écriture pour révision'
    },
    approve: {
      label: 'Approuver',
      icon: <CheckCircle className="w-4 h-4" />,
      variant: 'default',
      description: 'Approuver cette écriture et la marquer comme validée'
    },
    reject: {
      label: 'Rejeter',
      icon: <XCircle className="w-4 h-4" />,
      variant: 'destructive',
      description: 'Rejeter cette écriture et la renvoyer en brouillon'
    },
    post: {
      label: 'Comptabiliser',
      icon: <Lock className="w-4 h-4" />,
      variant: 'default',
      description: 'Comptabiliser cette écriture (verrouillage permanent)'
    }
  };
  if (availableActions.length === 0 && !compact) {
    return (
      <div className="flex items-center space-x-2">
        <Badge className={`${statusConfig[currentStatus].color} text-white`}>
          {statusConfig[currentStatus].icon}
          <span className="ml-1">{statusConfig[currentStatus].label}</span>
        </Badge>
        {isLocked && (
          <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
            <Lock className="w-3 h-3 mr-1" />
            Verrouillé
          </Badge>
        )}
      </div>
    );
  }
  if (compact) {
    return (
      <Badge className={`${statusConfig[currentStatus].color} text-white`}>
        {statusConfig[currentStatus].icon}
        <span className="ml-1">{statusConfig[currentStatus].label}</span>
      </Badge>
    );
  }
  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Status Badge */}
        <Badge className={`${statusConfig[currentStatus].color} text-white`}>
          {statusConfig[currentStatus].icon}
          <span className="ml-1">{statusConfig[currentStatus].label}</span>
        </Badge>
        {/* Action Buttons */}
        {availableActions.map((action) => {
          const config = actionButtons[action];
          return (
            <Button
              key={action}
              variant={config.variant}
              size="sm"
              onClick={() => openDialog(action)}
              disabled={loading}
            >
              {config.icon}
              <span className="ml-2">{config.label}</span>
            </Button>
          );
        })}
      </div>
      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {actionType && actionButtons[actionType].icon}
              <span>
                {actionType && actionButtons[actionType].label}
              </span>
            </DialogTitle>
            <DialogDescription>
              {actionType && actionButtons[actionType].description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">
                Commentaire {actionType === 'reject' ? '(obligatoire)' : '(optionnel)'}
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ajoutez un commentaire..."
                rows={4}
                className="mt-2"
              />
            </div>
            {actionType === 'post' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-medium mb-1">Attention : Action irréversible</p>
                    <p>
                      Une fois comptabilisée, cette écriture sera verrouillée et ne pourra plus être modifiée.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              onClick={executeAction}
              disabled={loading || (actionType === 'reject' && !comment.trim())}
            >
              {loading ? 'Traitement...' : actionType && actionButtons[actionType].label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
/**
 * Status Badge Only - For use in tables and lists
 */
export function WorkflowStatusBadge({ status }: { status: JournalEntryStatus }) {
  const statusConfig: Record<JournalEntryStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: {
      label: 'Brouillon',
      color: 'bg-gray-500',
      icon: <FileCheck className="w-3 h-3" />
    },
    review: {
      label: 'En révision',
      color: 'bg-blue-500',
      icon: <AlertCircle className="w-3 h-3" />
    },
    validated: {
      label: 'Validé',
      color: 'bg-green-500',
      icon: <CheckCircle className="w-3 h-3" />
    },
    posted: {
      label: 'Comptabilisé',
      color: 'bg-purple-500',
      icon: <Lock className="w-3 h-3" />
    },
    cancelled: {
      label: 'Annulé',
      color: 'bg-red-500',
      icon: <XCircle className="w-3 h-3" />
    }
  };
  const config = statusConfig[status];
  return (
    <Badge className={`${config.color} text-white`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </Badge>
  );
}