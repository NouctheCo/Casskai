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
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Loader2,
  Bell,
  Mail,
  
} from 'lucide-react';
import { AccountingDataService, type ReceivablesAgingAnalysis } from '@/services/accountingDataService';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface CriticalReceivablesAlertProps {
  companyId: string;
  onViewDetails?: () => void;
  className?: string;
}

interface AlertLevel {
  level: 'success' | 'warning' | 'danger' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  message: string;
}

export function CriticalReceivablesAlert({
  companyId,
  onViewDetails: _onViewDetails,
  className,
}: CriticalReceivablesAlertProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { formatAmount } = useCompanyCurrency();
  const [data, setData] = useState<ReceivablesAgingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const service = AccountingDataService.getInstance();
      const today = new Date();
      const startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const result = await service.analyzeReceivables(companyId, startDate, endDate);
      setData(result);
    } catch (error) {
      logger.error('CriticalReceivablesAlert', 'Error loading receivables:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId, loadData]);

  // Calculer le niveau d'alerte
  const getAlertLevel = (): AlertLevel => {
    if (!data || data.total_receivables === 0) {
      return {
        level: 'success',
        icon: Clock,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        message: 'Aucune créance en cours',
      };
    }

    const overdueAmount = data.aged_analysis.days_1_30 + data.aged_analysis.days_31_60 +
      data.aged_analysis.days_61_90 + data.aged_analysis.over_90;
    const overduePercentage = (overdueAmount / data.total_receivables) * 100;
    const criticalAmount = data.aged_analysis.over_90;
    const criticalPercentage = (criticalAmount / data.total_receivables) * 100;

    if (criticalPercentage > 20 || criticalAmount > 10000) {
      return {
        level: 'critical',
        icon: AlertTriangle,
        color: 'text-red-700',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-red-300 dark:border-red-800',
        message: `${formatAmount(criticalAmount)} de créances critiques (+90j)`,
      };
    }

    if (overduePercentage > 30) {
      return {
        level: 'danger',
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        message: `${overduePercentage.toFixed(0)}% des créances en retard`,
      };
    }

    if (overduePercentage > 15) {
      return {
        level: 'warning',
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        message: `${overduePercentage.toFixed(0)}% des créances en retard`,
      };
    }

    return {
      level: 'success',
      icon: TrendingDown,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      message: 'Créances sous contrôle',
    };
  };

  const alertLevel = getAlertLevel();
  const AlertIcon = alertLevel.icon;

  // Créances critiques
  const criticalInvoices = data?.details.filter(d => d.aging_bucket === 'over_90') || [];
  const dangerInvoices = data?.details.filter(d => d.aging_bucket === 'days_61_90') || [];

  if (loading) {
    return (
      <Card className={cn('border-2', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400"/>
        </CardContent>
      </Card>
    );
  }

  // Si pas de créances, afficher un message simple
  if (!data || data.total_receivables === 0) {
    return (
      <Card className={cn('border-2', alertLevel.borderColor, alertLevel.bgColor, className)}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-full', alertLevel.bgColor)}>
              <AlertIcon className={cn('h-5 w-5', alertLevel.color)}/>
            </div>
            <div>
              <p className={cn('font-medium', alertLevel.color)}>
                {alertLevel.message}
              </p>
              <p className="text-sm text-gray-500">
                Toutes les factures sont réglées
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculer les métriques
  const overdueAmount = data.aged_analysis.days_1_30 + data.aged_analysis.days_31_60 +
    data.aged_analysis.days_61_90 + data.aged_analysis.over_90;
  const overduePercentage = Math.round((overdueAmount / data.total_receivables) * 100);
  const healthScore = 100 - overduePercentage;

  return (
    <Card className={cn('border-2', alertLevel.borderColor, className)}>
      <CardHeader className={cn('pb-2', alertLevel.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-full', alertLevel.bgColor)}>
              <AlertIcon className={cn('h-5 w-5', alertLevel.color)}/>
            </div>
            <div>
              <CardTitle className="text-base">
                {t('dashboard.alerts.receivables', 'Alertes créances')}
              </CardTitle>
              <CardDescription className={alertLevel.color}>
                {alertLevel.message}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={loadData}>
            <RefreshCw className="h-4 w-4"/>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Barre de santé */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Santé des créances</span>
            <span className={cn('font-medium', alertLevel.color)}>{healthScore}%</span>
          </div>
          <Progress value={healthScore} className="h-2"/>
        </div>

        {/* Métriques rapides */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500">Total créances</p>
            <p className="font-bold">{formatAmount(data.total_receivables)}</p>
          </div>
          <div className={cn('p-3 rounded-lg', overduePercentage > 20 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20')}>
            <p className="text-xs text-gray-500">En retard</p>
            <p className={cn('font-bold', overduePercentage > 20 ? 'text-red-600' : 'text-amber-600')}>
              {formatAmount(overdueAmount)}
            </p>
          </div>
        </div>

        {/* Liste des factures critiques */}
        {(criticalInvoices.length > 0 || dangerInvoices.length > 0) && (
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Bell className="h-4 w-4"/>
              À traiter en priorité
            </p>
            <div className="max-h-32 overflow-auto space-y-1">
              {criticalInvoices.slice(0, 3).map((invoice) => (
                <div key={invoice.invoice_id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600"/>
                    <span className="font-medium">{invoice.invoice_number}</span>
                    <span className="text-gray-500 text-xs">{invoice.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {invoice.days_overdue}j
                    </Badge>
                    <span className="font-medium text-red-600">
                      {formatAmount(invoice.amount)}
                    </span>
                  </div>
                </div>
              ))}
              {dangerInvoices.slice(0, 2).map((invoice) => (
                <div key={invoice.invoice_id} className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600"/>
                    <span className="font-medium">{invoice.invoice_number}</span>
                    <span className="text-gray-500 text-xs">{invoice.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                      {invoice.days_overdue}j
                    </Badge>
                    <span className="font-medium text-amber-600">
                      {formatAmount(invoice.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {(criticalInvoices.length + dangerInvoices.length) > 5 && (
              <p className="text-xs text-center text-gray-500">
                + {criticalInvoices.length + dangerInvoices.length - 5} autres
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/invoices?filter=overdue')}>
                  <Mail className="h-4 w-4 mr-1"/>
                  Relancer
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Envoyer des relances aux clients
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="default" size="sm" className="flex-1" onClick={() => navigate('/accounting?tab=reports')}>
            Voir détails
            <ArrowRight className="h-4 w-4 ml-1"/>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CriticalReceivablesAlert;
