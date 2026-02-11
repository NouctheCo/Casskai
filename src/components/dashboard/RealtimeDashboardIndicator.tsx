/**
 * CassKai - Real-time Dashboard Indicator
 *
 * Phase 2 (P1) - Dashboard Temps Réel
 *
 * Fonctionnalités:
 * - Indicateur visuel LIVE en temps réel
 * - Toast notifications lors des mises à jour
 * - Animation des changements de valeurs
 * - Status connexion websocket Supabase
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toastSuccess, toastInfo } from '@/lib/toast-helpers';
import { logger } from '@/lib/logger';
import {
  Wifi,
  WifiOff,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { kpiCacheService, type KpiEvent } from '@/services/kpiCacheService';
import { motion, AnimatePresence } from 'framer-motion';

export interface RealtimeDashboardIndicatorProps {
  companyId: string;
  showToasts?: boolean;
  showStatus?: boolean;
  compact?: boolean;
}

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export default function RealtimeDashboardIndicator({
  companyId,
  showToasts = true,
  showStatus = true,
  compact = false
}: RealtimeDashboardIndicatorProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [isLive, setIsLive] = useState(false);

  /**
   * Gérer les événements KPI temps réel
   */
  const handleKpiEvent = useCallback((event: KpiEvent) => {
    if (event.companyId !== companyId && event.companyId !== 'global') {
      return;
    }

    logger.debug('RealtimeDashboardIndicator', 'Événement KPI reçu:', event);

    switch (event.type) {
      case 'cache_invalidated':
        setLastUpdate(new Date());
        setUpdateCount(prev => prev + 1);
        setIsLive(true);

        if (showToasts) {
          toastInfo('Données mises à jour en temps réel');
        }

        // Animation "pulse" pendant 2 secondes
        setTimeout(() => setIsLive(false), 2000);
        break;

      case 'data_updated':
        if (showToasts && event.message) {
          toastSuccess(event.message);
        }
        break;

      case 'error':
        setConnectionStatus('error');
        logger.error('RealtimeDashboardIndicator', 'Erreur temps réel:', event.message);
        break;
    }
  }, [companyId, showToasts]);

  /**
   * Monitorer le statut de connexion
   */
  useEffect(() => {
    // Écouter les événements online/offline du navigateur
    const handleOnline = () => {
      setConnectionStatus('connected');
      if (showToasts) {
        toastSuccess('Connexion temps réel rétablie');
      }
    };

    const handleOffline = () => {
      setConnectionStatus('disconnected');
      if (showToasts) {
        toastInfo('Mode hors ligne - synchronisation différée');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Déterminer le statut initial
    setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToasts]);

  /**
   * Souscrire aux événements KPI
   */
  useEffect(() => {
    const unsubscribe = kpiCacheService.onKpiEvent(handleKpiEvent);

    return () => {
      unsubscribe();
    };
  }, [handleKpiEvent]);

  /**
   * Icône selon le statut
   */
  const StatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-3 h-3 text-green-500" />;
      case 'connecting':
        return <Radio className="w-3 h-3 text-yellow-500 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="w-3 h-3 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
    }
  };

  /**
   * Badge LIVE animé
   */
  const LiveBadge = () => (
    <AnimatePresence>
      {isLive && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Badge
            variant="default"
            className="bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse"
          >
            <Radio className="w-3 h-3 mr-1" />
            LIVE
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /**
   * Version compacte (badge uniquement)
   */
  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <LiveBadge />
        {showStatus && connectionStatus === 'connected' && (
          <Badge variant="outline" className="text-xs">
            <StatusIcon />
            <span className="ml-1">Temps réel</span>
          </Badge>
        )}
      </div>
    );
  }

  /**
   * Version complète avec détails
   */
  return (
    <div className="space-y-3">
      {/* Indicateur principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <LiveBadge />

          {showStatus && (
            <div className="flex items-center space-x-2">
              <StatusIcon />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {connectionStatus === 'connected' && 'Connecté'}
                {connectionStatus === 'connecting' && 'Connexion...'}
                {connectionStatus === 'disconnected' && 'Hors ligne'}
                {connectionStatus === 'error' && 'Erreur'}
              </span>
            </div>
          )}
        </div>

        {lastUpdate && (
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          </div>
        )}
      </div>

      {/* Statistiques */}
      {updateCount > 0 && (
        <Alert className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
            {updateCount} mise{updateCount > 1 ? 's' : ''} à jour temps réel effectuée{updateCount > 1 ? 's' : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* Statut connexion */}
      {connectionStatus === 'disconnected' && (
        <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
          <WifiOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
            Mode hors ligne. Les données seront synchronisées automatiquement à la reconnexion.
          </AlertDescription>
        </Alert>
      )}

      {connectionStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-sm">
            Erreur de connexion temps réel. Tentative de reconnexion automatique en cours...
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
}

/**
 * Hook pour utiliser l'indicateur temps réel avec animation des valeurs
 */
export function useRealtimeValue<T extends number>(
  initialValue: T,
  companyId: string
): [T, (newValue: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [_previousValue, setPreviousValue] = useState<T>(initialValue);

  const updateValue = useCallback((newValue: T) => {
    setPreviousValue(value);
    setValue(newValue);

    // Dispatch événement pour animation
    const event = new CustomEvent('realtime-value-change', {
      detail: { previous: value, current: newValue }
    });
    window.dispatchEvent(event);
  }, [value]);

  useEffect(() => {
    const handleKpiEvent = (event: KpiEvent) => {
      if (event.companyId !== companyId && event.companyId !== 'global') {
        return;
      }

      if (event.type === 'cache_invalidated') {
        // Déclencher animation
        const element = document.querySelector(`[data-realtime-value="${value}"]`);
        if (element) {
          element.classList.add('animate-pulse');
          setTimeout(() => {
            element.classList.remove('animate-pulse');
          }, 1000);
        }
      }
    };

    const unsubscribe = kpiCacheService.onKpiEvent(handleKpiEvent);

    return () => {
      unsubscribe();
    };
  }, [companyId, value]);

  return [value, updateValue];
}

/**
 * Composant pour afficher une valeur avec animation temps réel
 */
export function RealtimeValueDisplay({
  value,
  previousValue,
  formatter = (v) => v.toString(),
  showTrend = true
}: {
  value: number;
  previousValue?: number;
  formatter?: (value: number) => string;
  showTrend?: boolean;
}) {
  const trend = previousValue !== undefined ? value - previousValue : 0;
  const trendPercentage = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : 0;

  return (
    <div className="flex items-center space-x-2">
      <motion.span
        key={value}
        initial={{ scale: 1.2, color: '#3B82F6' }}
        animate={{ scale: 1, color: '#000000' }}
        transition={{ duration: 0.5 }}
        className="font-bold dark:text-white"
        data-realtime-value={value}
      >
        {formatter(value)}
      </motion.span>

      {showTrend && previousValue !== undefined && trend !== 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Badge
            variant={trend > 0 ? 'default' : 'destructive'}
            className="text-xs"
          >
            {trend > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
          </Badge>
        </motion.div>
      )}
    </div>
  );
}
