/**
 * Indicateur visuel de statut temps réel du dashboard
 * Affiche connexion Websockets, dernière mise à jour, et refresh en cours
 *
 * @module RealtimeStatusIndicator
 */

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Zap,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface RealtimeStatusIndicatorProps {
  /**
   * Dernière mise à jour des données
   */
  lastUpdate: Date | null;

  /**
   * Refresh en cours
   */
  isRefreshing?: boolean;

  /**
   * Nombre de refreshes depuis le début
   */
  refreshCount?: number;

  /**
   * Callback pour refresh manuel
   */
  onRefresh?: () => void;

  /**
   * Realtime activé ?
   */
  isRealtimeEnabled?: boolean;

  /**
   * Toggle realtime on/off
   */
  onToggleRealtime?: (enabled: boolean) => void;

  /**
   * Websocket connecté ?
   */
  isConnected?: boolean;

  /**
   * Latence moyenne (ms)
   */
  averageLatency?: number;

  /**
   * Mode compact (affiche moins d'infos)
   */
  compact?: boolean;
}

export function RealtimeStatusIndicator({
  lastUpdate,
  isRefreshing = false,
  refreshCount = 0,
  onRefresh,
  isRealtimeEnabled = true,
  onToggleRealtime,
  isConnected = true,
  averageLatency,
  compact = false
}: RealtimeStatusIndicatorProps) {
  const [_currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second to refresh relative time displays
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getLatencyColor = (latency: number | undefined) => {
    if (!latency) return 'text-gray-500';
    if (latency < 500) return 'text-green-600';
    if (latency < 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLatencyLabel = (latency: number | undefined) => {
    if (!latency) return 'N/A';
    if (latency < 500) return 'Excellent';
    if (latency < 1000) return 'Bon';
    return 'Lent';
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Jamais';

    try {
      return formatDistanceToNow(date, {
        locale: fr,
        addSuffix: true
      });
    } catch {
      return 'Il y a quelques instants';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Connection status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={isConnected ? 'default' : 'destructive'}
                className={cn(
                  'gap-1 cursor-help',
                  isConnected && 'bg-green-500 hover:bg-green-600'
                )}
              >
                {isConnected ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {isConnected
                  ? 'Connexion temps réel active (Websockets)'
                  : 'Connexion temps réel inactive'}
              </p>
              {isConnected && averageLatency && (
                <p className="text-xs mt-1">
                  Latence: {averageLatency}ms ({getLatencyLabel(averageLatency)})
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Refresh button */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-7 px-2"
          >
            <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
          </Button>
        )}

        {/* Last update */}
        <span className="text-xs text-muted-foreground">
          {formatLastUpdate(lastUpdate)}
        </span>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Activity className="h-5 w-5 text-green-600 animate-pulse" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isConnected ? 'Temps réel actif' : 'Temps réel inactif'}
                  </span>
                  {isRealtimeEnabled ? (
                    <Badge variant="default" className="bg-green-500 text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Activé
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Désactivé
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {isConnected
                    ? 'Données actualisées automatiquement'
                    : 'Actualisation manuelle uniquement'}
                </p>
              </div>
            </div>

            {/* Last update */}
            <div className="flex items-center gap-2 pl-4 border-l">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Dernière mise à jour</p>
                <p className="text-sm font-medium">
                  {formatLastUpdate(lastUpdate)}
                </p>
              </div>
            </div>

            {/* Latency */}
            {averageLatency !== undefined && (
              <div className="flex items-center gap-2 pl-4 border-l">
                <Activity className={cn('h-4 w-4', getLatencyColor(averageLatency))} />
                <div>
                  <p className="text-xs text-muted-foreground">Latence</p>
                  <p className={cn('text-sm font-medium', getLatencyColor(averageLatency))}>
                    {averageLatency}ms ({getLatencyLabel(averageLatency)})
                  </p>
                </div>
              </div>
            )}

            {/* Refresh count */}
            {refreshCount > 0 && (
              <div className="flex items-center gap-2 pl-4 border-l">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Actualisations</p>
                  <p className="text-sm font-medium">{refreshCount}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Toggle realtime */}
            {onToggleRealtime && (
              <Button
                variant={isRealtimeEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => onToggleRealtime(!isRealtimeEnabled)}
                className="gap-2"
              >
                {isRealtimeEnabled ? (
                  <>
                    <Zap className="h-4 w-4" />
                    Temps réel ON
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    Temps réel OFF
                  </>
                )}
              </Button>
            )}

            {/* Manual refresh */}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                {isRefreshing ? 'Actualisation...' : 'Actualiser'}
              </Button>
            )}
          </div>
        </div>

        {/* Progress indicator when refreshing */}
        {isRefreshing && (
          <div className="mt-3">
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-progress-indeterminate" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Badge compact pour afficher dans header
 */
export function RealtimeStatusBadge({
  isConnected,
  isRefreshing,
  lastUpdate
}: Pick<RealtimeStatusIndicatorProps, 'isConnected' | 'isRefreshing' | 'lastUpdate'>) {
  const formatLastUpdate = (date: Date | null) => {
    if (!date) return '';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 10) return 'À l\'instant';
    if (seconds < 60) return `Il y a ${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}min`;

    const hours = Math.floor(minutes / 60);
    return `Il y a ${hours}h`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className={cn(
              'gap-1 cursor-help transition-all',
              isConnected && 'bg-green-500 hover:bg-green-600',
              isRefreshing && 'animate-pulse'
            )}
          >
            {isRefreshing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : isConnected ? (
              <Activity className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}

            {isRefreshing
              ? 'Actualisation...'
              : isConnected
              ? 'En direct'
              : 'Hors ligne'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isConnected
              ? 'Connexion temps réel active'
              : 'Connexion temps réel inactive'}
          </p>
          {lastUpdate && (
            <p className="text-xs mt-1">
              Dernière mise à jour: {formatLastUpdate(lastUpdate)}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Ajout de l'animation progress-indeterminate dans index.css
// @keyframes progress-indeterminate {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(400%); }
// }
