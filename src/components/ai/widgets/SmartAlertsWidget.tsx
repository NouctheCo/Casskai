import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Eye,
  // Settings,
  Filter,
  Clock,
  TrendingUp,
  // DollarSign,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { cn } from '../../../lib/utils';
import { SmartAlert } from '../../../types/ai.types';

interface SmartAlertsWidgetProps {
  alerts: SmartAlert[];
  onAlertAction?: (alertId: string, action: 'resolve' | 'dismiss' | 'snooze' | 'investigate') => void;
  onDismissAlert?: (alertId: string) => void;
  onRefresh?: () => void;
  className?: string;
}

export const SmartAlertsWidget: React.FC<SmartAlertsWidgetProps> = ({
  alerts,
  onAlertAction,
  onDismissAlert,
  onRefresh,
  className
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'anomaly' | 'threshold' | 'opportunity' | 'risk'>('all');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const filteredAlerts = alerts.filter(alert => {
    const severityMatch = filter === 'all' || alert.severity === filter;
    const typeMatch = typeFilter === 'all' || alert.type === typeFilter;
    return severityMatch && typeMatch;
  });

  const getSeverityIcon = (severity: SmartAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: SmartAlert['severity']): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'anomaly':
        return <AlertTriangle className="w-3 h-3" />;
      case 'threshold':
        return <Target className="w-3 h-3" />;
      case 'opportunity':
        return <TrendingUp className="w-3 h-3" />;
      case 'risk':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Bell className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: SmartAlert['type']): string => {
    switch (type) {
      case 'anomaly':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'threshold':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'opportunity':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'risk':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const toggleAlertExpansion = (alertId: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const handleAlertAction = (alertId: string, action: any) => {
    if (onAlertAction) {
      onAlertAction(alertId, action);
    }
  };

  const getAlertStats = () => {
    const stats = {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      unread: alerts.filter(a => !a.isRead).length
    };
    return stats;
  };

  const stats = getAlertStats();

  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Alertes Intelligentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <p className="text-lg font-medium text-green-600">Tout va bien !</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Aucune alerte active</p>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Alertes Intelligentes</span>
            <Badge variant="secondary">{stats.total}</Badge>
            {stats.unread > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                {stats.unread} non lues
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Filtres */}
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critical">Critiques ({stats.critical})</SelectItem>
                <SelectItem value="warning">Avertissements ({stats.warning})</SelectItem>
                <SelectItem value="info">Infos ({stats.info})</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="anomaly">Anomalies</SelectItem>
                <SelectItem value="threshold">Seuils</SelectItem>
                <SelectItem value="opportunity">Opportunités</SelectItem>
                <SelectItem value="risk">Risques</SelectItem>
              </SelectContent>
            </Select>

            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="flex items-center space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-xs text-red-600 dark:text-red-400">Critiques</p>
              <p className="font-bold text-red-700 dark:text-red-300">{stats.critical}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Avertissements</p>
              <p className="font-bold text-yellow-700 dark:text-yellow-300">{stats.warning}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Info className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Informations</p>
              <p className="font-bold text-blue-700 dark:text-blue-300">{stats.info}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-green-600 dark:text-green-400">Opportunités</p>
              <p className="font-bold text-green-700 dark:text-green-300">
                {alerts.filter(a => a.type === 'opportunity').length}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <AnimatePresence>
          {filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "border rounded-lg p-4 space-y-3 relative",
                alert.isRead ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200',
                alert.severity === 'critical' && 'border-red-300 shadow-sm'
              )}
            >
              {/* Indicateur non lu */}
              {!alert.isRead && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>
              )}

              {/* En-tête de l'alerte */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex items-center space-x-1">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 dark:text-white">
                        {alert.title}
                      </h4>
                      
                      <div className="flex items-center space-x-1">
                        <Badge className={cn("text-xs border", getSeverityColor(alert.severity))}>
                          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </Badge>
                        
                        <Badge className={cn("text-xs border", getTypeColor(alert.type))}>
                          {getTypeIcon(alert.type)}
                          <span className="ml-1 capitalize">{alert.type}</span>
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                      {alert.message}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{alert.timestamp.toLocaleString('fr-FR')}</span>
                      </div>
                      
                      {alert.autoResolve && (
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3" />
                          <span>Auto-résolution</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAlertExpansion(alert.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  {onDismissAlert && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismissAlert(alert.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Détails étendus */}
              <AnimatePresence>
                {expandedAlerts.has(alert.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 dark:border-gray-600 dark:border-gray-700 pt-3 space-y-3"
                  >
                    {/* Données de l'alerte */}
                    {alert.data && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
                          Détails:
                        </h5>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                          <pre className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-400 whitespace-pre-wrap">
                            {JSON.stringify(alert.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Actions disponibles */}
                    {alert.actions && alert.actions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
                          Actions:
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {alert.actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              size="sm"
                              variant={action.style === 'primary' ? 'default' : 'outline'}
                              onClick={() => handleAlertAction(alert.id, action.action)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions par défaut si aucune action personnalisée */}
                    {(!alert.actions || alert.actions.length === 0) && onAlertAction && (
                      <div className="flex items-center space-x-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertAction(alert.id, 'investigate')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Enquêter
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertAction(alert.id, 'resolve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Résoudre
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertAction(alert.id, 'snooze')}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Reporter
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAlertAction(alert.id, 'dismiss')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Ignorer
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <Filter className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400">Aucune alerte pour les filtres sélectionnés</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setFilter('all');
                setTypeFilter('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}

        {/* Information sur l'IA */}
        {filteredAlerts.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <Zap className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Ces alertes sont générées automatiquement par l'IA en analysant vos données financières en temps réel. 
                  Les seuils s'adaptent à vos habitudes pour réduire les faux positifs.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
