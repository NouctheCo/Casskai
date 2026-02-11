/**
 * CassKai - Threshold Alerts Component
 *
 * Phase 2 (P1) - Dashboard Temps Réel
 *
 * Alertes visuelles automatiques sur seuils critiques :
 * - Trésorerie < 10 000 € (CRITIQUE)
 * - DSO > 60 jours (ATTENTION)
 * - Ratio liquidité < 1 (CRITIQUE)
 * - Marge brute < 20% (ATTENTION)
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  DollarSign,
  Clock,
  Activity,
  type LucideIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { RealKPIData } from '@/services/realDashboardKpiService';

export interface ThresholdAlertProps {
  kpiData: RealKPIData;
  currency?: string;
  className?: string;
}

interface AlertConfig {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  icon: LucideIcon;
  title: string;
  message: string;
  value?: string;
  threshold?: string;
  actionRequired?: string;
}

/**
 * Seuils configurables
 */
const THRESHOLDS = {
  CASH_CRITICAL: 10_000, // 10k€
  CASH_WARNING: 25_000, // 25k€
  DSO_WARNING: 60, // 60 jours
  DSO_CRITICAL: 90, // 90 jours
  LIQUIDITY_CRITICAL: 1.0, // Ratio < 1
  LIQUIDITY_WARNING: 1.5, // Ratio < 1.5
  GROSS_MARGIN_WARNING: 20, // < 20%
  GROSS_MARGIN_CRITICAL: 10, // < 10%
};

/**
 * Analyseur d'alertes basé sur seuils
 */
function analyzeThresholds(kpiData: RealKPIData): AlertConfig[] {
  const alerts: AlertConfig[] = [];

  // 1. Trésorerie critique
  const cashPosition = kpiData.financialMetrics?.cashPosition || 0;
  if (cashPosition < THRESHOLDS.CASH_CRITICAL) {
    alerts.push({
      id: 'cash-critical',
      severity: 'critical',
      icon: AlertTriangle,
      title: '🚨 Trésorerie critique',
      message: `Votre trésorerie est inférieure à ${formatCurrency(THRESHOLDS.CASH_CRITICAL)}`,
      value: formatCurrency(cashPosition),
      threshold: formatCurrency(THRESHOLDS.CASH_CRITICAL),
      actionRequired: 'Encaisser créances clients urgentes ou renforcer fonds propres'
    });
  } else if (cashPosition < THRESHOLDS.CASH_WARNING) {
    alerts.push({
      id: 'cash-warning',
      severity: 'warning',
      icon: DollarSign,
      title: 'Trésorerie faible',
      message: `Trésorerie à surveiller (< ${formatCurrency(THRESHOLDS.CASH_WARNING)})`,
      value: formatCurrency(cashPosition),
      threshold: formatCurrency(THRESHOLDS.CASH_WARNING),
      actionRequired: 'Anticiper les prochaines échéances fournisseurs'
    });
  }

  // 2. DSO (Days Sales Outstanding) élevé
  const dso = kpiData.financialMetrics?.daysOutstanding || 0;
  if (dso > THRESHOLDS.DSO_CRITICAL) {
    alerts.push({
      id: 'dso-critical',
      severity: 'critical',
      icon: Clock,
      title: 'Délai encaissement critique',
      message: `Vos clients paient en moyenne après ${Math.round(dso)} jours`,
      value: `${Math.round(dso)} jours`,
      threshold: `${THRESHOLDS.DSO_CRITICAL} jours`,
      actionRequired: 'Relancer les factures impayées >90j immédiatement'
    });
  } else if (dso > THRESHOLDS.DSO_WARNING) {
    alerts.push({
      id: 'dso-warning',
      severity: 'warning',
      icon: Clock,
      title: 'Délai encaissement élevé',
      message: `DSO à ${Math.round(dso)} jours (optimal: <45j)`,
      value: `${Math.round(dso)} jours`,
      threshold: `${THRESHOLDS.DSO_WARNING} jours`,
      actionRequired: 'Améliorer process de relance client'
    });
  }

  // 3. Ratio de liquidité critique
  const currentRatio = kpiData.financialMetrics?.currentRatio || 0;
  if (currentRatio < THRESHOLDS.LIQUIDITY_CRITICAL) {
    alerts.push({
      id: 'liquidity-critical',
      severity: 'critical',
      icon: TrendingDown,
      title: 'Liquidité insuffisante',
      message: `Actifs courants < Passifs courants (ratio: ${currentRatio.toFixed(2)})`,
      value: currentRatio.toFixed(2),
      threshold: THRESHOLDS.LIQUIDITY_CRITICAL.toFixed(2),
      actionRequired: 'Conversion rapide stocks/créances en cash nécessaire'
    });
  } else if (currentRatio < THRESHOLDS.LIQUIDITY_WARNING) {
    alerts.push({
      id: 'liquidity-warning',
      severity: 'warning',
      icon: Activity,
      title: 'Liquidité juste',
      message: `Ratio de liquidité à ${currentRatio.toFixed(2)} (optimal: >1.5)`,
      value: currentRatio.toFixed(2),
      threshold: THRESHOLDS.LIQUIDITY_WARNING.toFixed(2),
      actionRequired: 'Surveiller BFR et optimiser délais paiement'
    });
  }

  // 4. Marge brute faible
  const grossMargin = kpiData.profitabilityMetrics?.grossMargin || 0;
  if (grossMargin < THRESHOLDS.GROSS_MARGIN_CRITICAL) {
    alerts.push({
      id: 'margin-critical',
      severity: 'critical',
      icon: AlertTriangle,
      title: 'Marge brute critique',
      message: `Marge brute à ${grossMargin.toFixed(1)}% (dangereux)`,
      value: `${grossMargin.toFixed(1)}%`,
      threshold: `${THRESHOLDS.GROSS_MARGIN_CRITICAL}%`,
      actionRequired: 'Réviser pricing ou réduire coûts directs urgence'
    });
  } else if (grossMargin < THRESHOLDS.GROSS_MARGIN_WARNING) {
    alerts.push({
      id: 'margin-warning',
      severity: 'warning',
      icon: TrendingDown,
      title: 'Marge brute faible',
      message: `Marge brute à ${grossMargin.toFixed(1)}% (optimal: >30%)`,
      value: `${grossMargin.toFixed(1)}%`,
      threshold: `${THRESHOLDS.GROSS_MARGIN_WARNING}%`,
      actionRequired: 'Analyser rentabilité par produit/service'
    });
  }

  return alerts;
}

/**
 * Composant ThresholdAlert
 */
export function ThresholdAlert({
  kpiData,
  currency = 'EUR',
  className
}: ThresholdAlertProps) {
  const alerts = useMemo(() => analyzeThresholds(kpiData), [kpiData]);

  // Séparer par sévérité
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  if (alerts.length === 0) {
    return null; // Pas d'alertes = pas d'affichage
  }

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {/* Alertes critiques en premier */}
        {criticalAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="mb-3"
          >
            <Alert variant="destructive" className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
              <alert.icon className="h-5 w-5" />
              <AlertTitle className="flex items-center justify-between">
                {alert.title}
                <Badge variant="destructive" className="ml-2">
                  CRITIQUE
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p className="font-medium">{alert.message}</p>
                {alert.value && alert.threshold && (
                  <div className="text-sm">
                    <span className="font-bold text-red-700 dark:text-red-300">
                      Valeur actuelle: {alert.value}
                    </span>
                    {' '}//{' '}
                    <span className="text-gray-600 dark:text-gray-400">
                      Seuil: {alert.threshold}
                    </span>
                  </div>
                )}
                {alert.actionRequired && (
                  <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border border-red-200 dark:border-red-800">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      ⚡ Action requise :
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                      {alert.actionRequired}
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        ))}

        {/* Avertissements */}
        {warningAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-3"
          >
            <Alert variant="default" className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
              <alert.icon className="h-4 w-4 text-orange-600" />
              <AlertTitle className="flex items-center justify-between text-orange-900 dark:text-orange-100">
                {alert.title}
                <Badge variant="outline" className="ml-2 border-orange-400 text-orange-700">
                  À surveiller
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2 text-orange-800 dark:text-orange-200">
                <p>{alert.message}</p>
                {alert.value && alert.threshold && (
                  <div className="text-sm">
                    <span className="font-bold">Valeur: {alert.value}</span>
                    {' '}//{' '}
                    <span className="text-gray-600 dark:text-gray-400">Seuil: {alert.threshold}</span>
                  </div>
                )}
                {alert.actionRequired && (
                  <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border border-orange-200 dark:border-orange-800">
                    <p className="text-xs font-semibold">💡 Recommandation :</p>
                    <p className="text-xs mt-1">{alert.actionRequired}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ThresholdAlert;
