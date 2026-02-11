/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * UndoRedoTimeline - Timeline visuelle de l'historique Undo/Redo
 *
 * Features:
 * - Affichage chronologique des actions
 * - Indicateur position actuelle
 * - Navigation par clic sur action
 * - Suppression d'action
 * - Tooltips avec détails
 * - Scroll automatique vers action actuelle
 */

import React, { useEffect, useRef } from 'react';
import {
  Undo2,
  Redo2,
  FileText,
  Users,
  CreditCard,
  Trash2,
  Clock,
  CheckCircle2,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { type ActionState, type ActionType } from '@/services/undoRedoService';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Props du composant
 */
export interface UndoRedoTimelineProps {
  /**
   * Historique des actions
   */
  history: ActionState[];

  /**
   * Index actuel (-1 si aucune action)
   */
  currentIndex: number;

  /**
   * Callback quand l'utilisateur clique sur une action
   */
  onNavigateToAction?: (actionId: string, index: number) => void;

  /**
   * Callback pour supprimer une action
   */
  onDeleteAction?: (actionId: string) => void;

  /**
   * Afficher les boutons Undo/Redo
   */
  showUndoRedoButtons?: boolean;

  /**
   * Callback Undo
   */
  onUndo?: () => void;

  /**
   * Callback Redo
   */
  onRedo?: () => void;

  /**
   * Peut annuler
   */
  canUndo?: boolean;

  /**
   * Peut refaire
   */
  canRedo?: boolean;

  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

/**
 * Obtenir l'icône pour un type d'action
 */
function getActionIcon(type: ActionType): LucideIcon {
  const iconMap: Record<ActionType, LucideIcon> = {
    create_journal_entry: FileText,
    update_journal_entry: FileText,
    delete_journal_entry: FileText,
    create_invoice: FileText,
    update_invoice: FileText,
    delete_invoice: FileText,
    create_client: Users,
    update_client: Users,
    delete_client: Users,
    create_payment: CreditCard,
    update_payment: CreditCard,
    delete_payment: CreditCard,
    custom: Circle,
  };

  return iconMap[type] || Circle;
}

/**
 * Obtenir la couleur pour un type d'action
 */
function getActionColor(type: ActionType): string {
  if (type.startsWith('create_')) return 'text-green-600 dark:text-green-400';
  if (type.startsWith('update_')) return 'text-blue-600 dark:text-blue-400';
  if (type.startsWith('delete_')) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
}

/**
 * UndoRedoTimeline Component
 */
export const UndoRedoTimeline: React.FC<UndoRedoTimelineProps> = ({
  history,
  currentIndex,
  onNavigateToAction,
  onDeleteAction,
  showUndoRedoButtons = true,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  className,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentActionRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll automatique vers l'action actuelle
   */
  useEffect(() => {
    if (currentActionRef.current && timelineRef.current) {
      currentActionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentIndex]);

  /**
   * Formatter le timestamp
   */
  const formatTimestamp = (timestamp: number): string => {
    try {
      return formatDistance(timestamp, Date.now(), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return new Date(timestamp).toLocaleString('fr-FR');
    }
  };

  if (history.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Aucun historique disponible
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-1">
          Les actions que vous effectuez apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header avec boutons Undo/Redo */}
      {showUndoRedoButtons && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Historique ({history.length})
          </h3>

          <div className="flex items-center gap-2">
            <Button
              onClick={onUndo}
              disabled={!canUndo}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Annuler
              <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                Ctrl+Z
              </kbd>
            </Button>

            <Button
              onClick={onRedo}
              disabled={!canRedo}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Redo2 className="h-4 w-4" />
              Refaire
              <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                Ctrl+Y
              </kbd>
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div
        ref={timelineRef}
        className="relative max-h-96 overflow-y-auto pr-4 space-y-3"
      >
        {/* Ligne verticale de connexion */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

        {/* Actions */}
        {history.map((action, index) => {
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;
          const Icon = getActionIcon(action.type);
          const colorClass = getActionColor(action.type);

          return (
            <div
              key={action.id}
              ref={isCurrent ? currentActionRef : null}
              className={cn(
                'relative flex items-start gap-4 pl-2 pr-4 py-3 rounded-lg transition-all',
                'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer',
                isCurrent && 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/50',
                isPast && 'opacity-100',
                isFuture && 'opacity-50'
              )}
              onClick={() => onNavigateToAction?.(action.id, index)}
            >
              {/* Icône avec indicateur état */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full transition-all',
                    isCurrent
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : isPast
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  )}
                >
                  {isCurrent ? (
                    <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  )}
                </div>
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-medium transition-colors',
                        isCurrent
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-900 dark:text-gray-100'
                      )}
                    >
                      {action.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatTimestamp(action.timestamp)}
                    </p>
                  </div>

                  {/* Bouton supprimer */}
                  {onDeleteAction && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAction(action.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Métadonnées optionnelles */}
                {action.metadata && Object.keys(action.metadata).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(action.metadata).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Badge état */}
              {isCurrent && (
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                    Actuel
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t dark:border-gray-700">
        <span>{history.length} action{history.length > 1 ? 's' : ''} enregistrée{history.length > 1 ? 's' : ''}</span>
        <span>Position : {currentIndex + 1} / {history.length}</span>
      </div>
    </div>
  );
};

export default UndoRedoTimeline;
