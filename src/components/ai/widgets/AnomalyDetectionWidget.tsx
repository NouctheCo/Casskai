import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Eye, 
  X, 
  Check, 
  // Filter,
  // Clock,
  DollarSign,
  Calendar,
  Building,
  User,
  ChevronDown,
  ChevronUp,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Alert, AlertDescription } from '../../ui/alert';
import { cn, getCurrentCompanyCurrency } from '../../../lib/utils';
import { AnomalyDetection } from '../../../types/ai.types';

interface AnomalyDetectionWidgetProps {
  anomalies: AnomalyDetection[];
  onAnomalyAction?: (anomalyId: string, action: 'resolve' | 'dismiss' | 'investigate') => void;
  isLoading?: boolean;
  className?: string;
}

export const AnomalyDetectionWidget: React.FC<AnomalyDetectionWidgetProps> = ({
  anomalies,
  onAnomalyAction,
  isLoading = false,
  className
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [expandedAnomalies, setExpandedAnomalies] = useState<Set<string>>(new Set());

  const filteredAnomalies = anomalies.filter(anomaly => {
    if (filter === 'all') return true;
    return anomaly.severity === filter;
  });

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const toggleAnomalyExpansion = (anomalyId: string) => {
    const newExpanded = new Set(expandedAnomalies);
    if (newExpanded.has(anomalyId)) {
      newExpanded.delete(anomalyId);
    } else {
      newExpanded.add(anomalyId);
    }
    setExpandedAnomalies(newExpanded);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: getCurrentCompanyCurrency()
    }).format(amount);
  };

  const getAnomalyStats = () => {
    const stats = {
      total: anomalies.length,
      critical: anomalies.filter(a => a.severity === 'critical').length,
      high: anomalies.filter(a => a.severity === 'high').length,
      medium: anomalies.filter(a => a.severity === 'medium').length,
      low: anomalies.filter(a => a.severity === 'low').length,
      resolved: anomalies.filter(a => a.resolved).length
    };
    return stats;
  };

  const stats = getAnomalyStats();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Détection d'Anomalies</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
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
            <AlertTriangle className="w-5 h-5" />
            <span>Détection d'Anomalies</span>
            <Badge variant="secondary">{stats.total}</Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes ({stats.total})</SelectItem>
                <SelectItem value="critical">Critiques ({stats.critical})</SelectItem>
                <SelectItem value="high">Élevées ({stats.high})</SelectItem>
                <SelectItem value="medium">Moyennes ({stats.medium})</SelectItem>
                <SelectItem value="low">Faibles ({stats.low})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full dark:bg-red-900/20" />
            <span>{stats.critical} critiques</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span>{stats.high} élevées</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full dark:bg-green-900/20" />
            <span>{stats.resolved} résolues</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredAnomalies.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Shield className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <p className="text-lg font-medium text-green-600">Aucune anomalie détectée</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Vos transactions semblent normales</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredAnomalies.map((anomaly, index) => (
                <motion.div
                  key={anomaly.transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "border rounded-lg p-4 space-y-3",
                    anomaly.resolved ? 'bg-green-50 border-green-200' : 'bg-white dark:bg-gray-800',
                    anomaly.severity === 'critical' && !anomaly.resolved && 'border-red-300 shadow-sm'
                  )}
                >
                  {/* En-tête de l'anomalie */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getSeverityIcon(anomaly.severity)}
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-white">
                            {anomaly.transaction.description}
                          </p>
                          <Badge className={cn("text-xs border", getSeverityColor(anomaly.severity))}>
                            {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)}
                          </Badge>
                          {anomaly.resolved && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Résolu
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{formatCurrency(anomaly.transaction.amount)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(anomaly.transaction.date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building className="w-3 h-3" />
                            <span>{anomaly.transaction.account}</span>
                          </div>
                          {anomaly.transaction.counterparty && (
                            <div className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>{anomaly.transaction.counterparty}</span>
                            </div>
                          )}
                        </div>

                        {/* Score d'anomalie */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Score d'anomalie:</span>
                          <div className="flex-1 max-w-32">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-300",
                                  anomaly.severity === 'critical' ? 'bg-red-500' :
                                  anomaly.severity === 'high' ? 'bg-orange-500' :
                                  anomaly.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                )}
                                style={{ width: `${Math.min(anomaly.score * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-mono">
                            {(anomaly.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAnomalyExpansion(anomaly.transaction.id)}
                      >
                        {expandedAnomalies.has(anomaly.transaction.id) ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
                      </Button>
                    </div>
                  </div>

                  {/* Détails étendus */}
                  <AnimatePresence>
                    {expandedAnomalies.has(anomaly.transaction.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-200 dark:border-gray-600 dark:border-gray-700 pt-3 space-y-3"
                      >
                        {/* Raisons de l'anomalie */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Raisons détectées:
                          </h4>
                          <div className="space-y-1">
                            {anomaly.reasons.map((reason, reasonIndex) => (
                              <div 
                                key={reasonIndex}
                                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
                              >
                                <div className="w-1 h-1 bg-orange-400 rounded-full" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Informations supplémentaires */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Détecté le:</span>
                            <p className="font-mono">
                              {new Date(anomaly.timestamp).toLocaleString('fr-FR')}
                            </p>
                          </div>
                          {anomaly.transaction.category && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Catégorie:</span>
                              <p>{anomaly.transaction.category}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!anomaly.resolved && onAnomalyAction && (
                          <div className="flex items-center space-x-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onAnomalyAction(anomaly.transaction.id, 'investigate')}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Enquêter
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onAnomalyAction(anomaly.transaction.id, 'resolve')}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Résoudre
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAnomalyAction(anomaly.transaction.id, 'dismiss')}
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
          </div>
        )}

        {/* Information sur l'IA */}
        {anomalies.length > 0 && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-sm">
              L'IA analyse vos transactions en temps réel pour détecter les patterns inhabituels. 
              Les anomalies critiques nécessitent une attention immédiate.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
