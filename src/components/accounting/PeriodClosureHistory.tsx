/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 *
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import {
  History,
  Lock,
  Unlock,
  Plus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  User,
  Calendar,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface AuditLogEntry {
  id: string;
  period_id: string;
  period_name?: string;
  action_type: string;
  action_description: string | null;
  user_email: string | null;
  result_amount: number | null;
  result_type: string | null;
  reason: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface PeriodClosureHistoryProps {
  companyId: string;
  periodId?: string;  // Si fourni, affiche uniquement l'historique de cette période
  limit?: number;
  compact?: boolean;
}

const ACTION_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  label: string;
}> = {
  closure_started: {
    icon: Lock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Clôture démarrée',
  },
  closure_validated: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Validation réussie',
  },
  closure_completed: {
    icon: Lock,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Clôture terminée',
  },
  closure_failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Clôture échouée',
  },
  reopen_requested: {
    icon: Unlock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Réouverture demandée',
  },
  reopen_completed: {
    icon: Unlock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Période réouverte',
  },
  reopen_failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Réouverture échouée',
  },
  an_generated: {
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'À-nouveaux générés',
  },
  an_failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'À-nouveaux échoués',
  },
  period_created: {
    icon: Plus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Période créée',
  },
  period_deleted: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Période supprimée',
  },
};

export function PeriodClosureHistory({
  companyId,
  periodId,
  limit = 50,
  compact = false,
}: PeriodClosureHistoryProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCompanyCurrency();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);

      if (periodId) {
        // Historique d'une période spécifique
        const { data, error } = await supabase.rpc('get_period_closure_history', {
          p_period_id: periodId,
        });

        if (error) throw error;
        setLogs(data || []);
      } else {
        // Historique de toute l'entreprise
        const { data, error } = await supabase.rpc('get_company_closure_history', {
          p_company_id: companyId,
          p_limit: limit,
        });

        if (error) throw error;
        setLogs(data || []);
      }
    } catch (error) {
      logger.error('PeriodClosureHistory', 'Error loading history:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, periodId, limit]);

  useEffect(() => {
    if (companyId) {
      loadHistory();
    }
  }, [companyId, loadHistory]);

  const toggleExpanded = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMMM yyyy 'à' HH:mm", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const getActionConfig = (actionType: string) => {
    return ACTION_CONFIG[actionType] || {
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      label: actionType,
    };
  };

  if (loading) {
    return (
      <Card className={compact ? 'h-full' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5"/>
            {t('accounting.closureHistory.title', 'Historique des clôtures')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400"/>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className={compact ? 'h-full' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5"/>
            {t('accounting.closureHistory.title', 'Historique des clôtures')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-48 text-gray-500">
          <History className="h-12 w-12 mb-4 opacity-30"/>
          <p>{t('accounting.closureHistory.empty', 'Aucun historique de clôture')}</p>
        </CardContent>
      </Card>
    );
  }

  // Version compacte pour widgets
  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5"/>
              Historique
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={loadHistory}>
              <RefreshCw className="h-4 w-4"/>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-auto">
            {logs.slice(0, 5).map((log) => {
              const config = getActionConfig(log.action_type);
              const ActionIcon = config.icon;

              return (
                <div key={log.id} className={cn(
                    'flex items-center gap-3 p-2 rounded-lg',
                    config.bgColor
                  )}>
                  <ActionIcon className={cn('h-4 w-4', config.color)}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {config.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(log.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  {log.result_amount && (
                    <Badge variant="outline" className={log.result_type === 'profit' ? 'text-green-600' : 'text-red-600'}>
                      {log.result_type === 'profit' ? '+' : '-'}
                      {formatAmount(Math.abs(log.result_amount))}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
          {logs.length > 5 && (
            <p className="text-center text-sm text-gray-500 mt-2">
              + {logs.length - 5} autres actions
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Version complète
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5"/>
              {t('accounting.closureHistory.title', 'Historique des clôtures')}
            </CardTitle>
            <CardDescription>
              {periodId
                ? t('accounting.closureHistory.periodDescription', 'Actions sur cette période')
                : t('accounting.closureHistory.companyDescription', 'Dernières actions de clôture')}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadHistory}>
            <RefreshCw className="h-4 w-4 mr-2"/>
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log, index) => {
            const config = getActionConfig(log.action_type);
            const ActionIcon = config.icon;
            const isExpanded = expandedLogs.has(log.id);

            return (
              <div key={log.id}>
                <div className={cn(
                    'flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                    config.bgColor
                  )} onClick={() => toggleExpanded(log.id)}>
                  {/* Icône */}
                  <div className={cn('p-2 rounded-full', config.bgColor)}>
                    <ActionIcon className={cn('h-5 w-5', config.color)}/>
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('font-medium', config.color)}>
                        {config.label}
                      </span>
                      {log.period_name && !periodId && (
                        <Badge variant="outline" className="text-xs">
                          {log.period_name}
                        </Badge>
                      )}
                      {log.result_amount !== null && (
                        <Badge variant={log.result_type === 'profit' ? 'default' : 'destructive'} className="text-xs">
                          {log.result_type === 'profit' ? 'Bénéfice' : 'Perte'}: {formatAmount(Math.abs(log.result_amount))}
                        </Badge>
                      )}
                    </div>

                    {log.action_description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {log.action_description}
                      </p>
                    )}

                    {log.reason && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 italic">
                        Raison: {log.reason}
                      </p>
                    )}

                    {/* Métadonnées */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3"/>
                        {formatDate(log.created_at)}
                      </span>
                      {log.user_email && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3"/>
                          {log.user_email}
                        </span>
                      )}
                    </div>

                    {/* Détails expandés */}
                    {isExpanded && log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 mb-2">Détails techniques</p>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Bouton expand */}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <Button variant="ghost" size="icon" className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4"/>
                      ) : (
                        <ChevronDown className="h-4 w-4"/>
                      )}
                    </Button>
                  )}
                </div>

                {index < logs.length - 1 && <Separator className="my-2"/>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default PeriodClosureHistory;
