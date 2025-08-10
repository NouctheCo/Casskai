import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  Target,
  // TrendingUp,
  CheckCircle,
  Clock,
  // AlertTriangle,
  BookOpen,
  FileText,
  Calendar,
  Euro,
  ArrowRight,
  // Info,
  Lightbulb,
  // Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Tabs, /* TabsContent, */ TabsList, TabsTrigger } from '../../ui/tabs';
import { cn } from '../../../lib/utils';
import { TaxOptimization } from '../../../types/ai.types';

interface TaxOptimizationWidgetProps {
  optimizations: TaxOptimization[];
  onOptimizationAction?: (optimizationId: string, action: 'implement' | 'dismiss' | 'learn_more') => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const TaxOptimizationWidget: React.FC<TaxOptimizationWidgetProps> = ({
  optimizations,
  onOptimizationAction,
  isLoading = false,
  onRefresh,
  className
}) => {
  const [filter, setFilter] = useState<'all' | 'deduction' | 'timing' | 'structure'>('all');
  const [sortBy, setSortBy] = useState<'saving' | 'effort' | 'deadline'>('saving');
  const [expandedOptimizations, setExpandedOptimizations] = useState<Set<string>>(new Set());

  const filteredOptimizations = optimizations
    .filter(opt => filter === 'all' || opt.type === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'saving':
          return b.potentialSaving - a.potentialSaving;
        case 'effort':
          const effortOrder = { low: 1, medium: 2, high: 3 };
          return effortOrder[a.effort] - effortOrder[b.effort];
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        default:
          return 0;
      }
    });

  const getEffortColor = (effort: TaxOptimization['effort']): string => {
    switch (effort) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortLabel = (effort: TaxOptimization['effort']): string => {
    switch (effort) {
      case 'low':
        return 'Facile';
      case 'medium':
        return 'Moyen';
      case 'high':
        return 'Complexe';
      default:
        return 'Inconnu';
    }
  };

  const getTypeIcon = (type: TaxOptimization['type']) => {
    switch (type) {
      case 'deduction':
        return <Calculator className="w-4 h-4" />;
      case 'timing':
        return <Clock className="w-4 h-4" />;
      case 'structure':
        return <Target className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: TaxOptimization['type']): string => {
    switch (type) {
      case 'deduction':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'timing':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'structure':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: TaxOptimization['status']): string => {
    switch (status) {
      case 'implemented':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suggested':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const toggleOptimizationExpansion = (optimizationId: string) => {
    const newExpanded = new Set(expandedOptimizations);
    if (newExpanded.has(optimizationId)) {
      newExpanded.delete(optimizationId);
    } else {
      newExpanded.add(optimizationId);
    }
    setExpandedOptimizations(newExpanded);
  };

  const getTotalPotentialSaving = (): number => {
    return filteredOptimizations.reduce((sum, opt) => sum + opt.potentialSaving, 0);
  };

  const getOptimizationStats = () => {
    const stats = {
      total: optimizations.length,
      implemented: optimizations.filter(o => o.status === 'implemented').length,
      suggested: optimizations.filter(o => o.status === 'suggested').length,
      inProgress: optimizations.filter(o => o.status === 'in_progress').length,
      totalSaving: getTotalPotentialSaving()
    };
    return stats;
  };

  const stats = getOptimizationStats();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Optimisations Fiscales</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (optimizations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Optimisations Fiscales</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Target className="w-12 h-12 text-gray-300 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-600">Aucune optimisation détectée</p>
              <p className="text-sm text-gray-500">L'IA analyse vos données pour identifier des opportunités</p>
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
            <Calculator className="w-5 h-5" />
            <span>Optimisations Fiscales</span>
            <Badge variant="secondary">{stats.total}</Badge>
          </CardTitle>

          <div className="flex items-center space-x-2">
            <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-2">Toutes</TabsTrigger>
                <TabsTrigger value="deduction" className="text-xs px-2">Déductions</TabsTrigger>
                <TabsTrigger value="timing" className="text-xs px-2">Timing</TabsTrigger>
                <TabsTrigger value="structure" className="text-xs px-2">Structure</TabsTrigger>
              </TabsList>
            </Tabs>

            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Métriques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Euro className="w-6 h-6 text-green-500" />
            <div>
              <p className="text-xs text-green-600 dark:text-green-400">Économies potentielles</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {formatCurrency(stats.totalSaving)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Target className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Suggestions</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats.suggested}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Clock className="w-6 h-6 text-orange-500" />
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400">En cours</p>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{stats.inProgress}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <CheckCircle className="w-6 h-6 text-purple-500" />
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Implémentées</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{stats.implemented}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contrôles de tri */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Trier par:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800"
            >
              <option value="saving">Économies</option>
              <option value="effort">Effort</option>
              <option value="deadline">Échéance</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {filteredOptimizations.length} optimisation(s)
          </div>
        </div>

        {/* Liste des optimisations */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredOptimizations.map((optimization, index) => (
              <motion.div
                key={optimization.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "border rounded-lg p-4 space-y-3",
                  optimization.status === 'implemented' && 'bg-green-50 dark:bg-green-900/10 border-green-200',
                  optimization.status === 'in_progress' && 'bg-blue-50 dark:bg-blue-900/10 border-blue-200'
                )}
              >
                {/* En-tête de l'optimisation */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {getTypeIcon(optimization.type)}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {optimization.title}
                        </h4>

                        <div className="flex items-center space-x-1">
                          <Badge className={cn("text-xs border", getTypeColor(optimization.type))}>
                            {optimization.type === 'deduction' ? 'Déduction' :
                             optimization.type === 'timing' ? 'Timing' :
                             optimization.type === 'structure' ? 'Structure' : optimization.type}
                          </Badge>

                          <Badge className={cn("text-xs border", getEffortColor(optimization.effort))}>
                            {getEffortLabel(optimization.effort)}
                          </Badge>

                          <Badge className={cn("text-xs border", getStatusColor(optimization.status))}>
                            {optimization.status === 'implemented' ? 'Implémentée' :
                             optimization.status === 'in_progress' ? 'En cours' :
                             optimization.status === 'suggested' ? 'Suggérée' : optimization.status}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {optimization.description}
                      </p>

                      {/* Métriques clés */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(optimization.potentialSaving)}
                          </span>
                          <span className="text-xs text-gray-500">économie</span>
                        </div>

                        {optimization.deadline && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-orange-600">
                              {new Date(optimization.deadline).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOptimizationExpansion(optimization.id)}
                    >
                      {expandedOptimizations.has(optimization.id) ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                      }
                    </Button>
                  </div>
                </div>

                {/* Barre de progression de l'implémentation */}
                {optimization.status !== 'suggested' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Progression</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {optimization.status === 'implemented' ? '100%' : 
                         optimization.status === 'in_progress' ? '50%' : '0%'}
                      </span>
                    </div>
                    <Progress 
                      value={optimization.status === 'implemented' ? 100 : 
                             optimization.status === 'in_progress' ? 50 : 0} 
                      className="h-2"
                    />
                  </div>
                )}

                {/* Détails étendus */}
                <AnimatePresence>
                  {expandedOptimizations.has(optimization.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3"
                    >
                      {/* Exigences */}
                      {optimization.requirements && optimization.requirements.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>Exigences:</span>
                          </h5>
                          <ul className="space-y-1">
                            {optimization.requirements.map((requirement, reqIndex) => (
                              <li key={reqIndex} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                <span>{requirement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      {optimization.status === 'suggested' && onOptimizationAction && (
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => onOptimizationAction(optimization.id, 'implement')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Implémenter
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOptimizationAction(optimization.id, 'learn_more')}
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            En savoir plus
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onOptimizationAction(optimization.id, 'dismiss')}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
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

        {filteredOptimizations.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <Target className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-gray-500">Aucune optimisation pour ce filtre</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilter('all')}
            >
              Voir toutes les optimisations
            </Button>
          </div>
        )}

        {/* Information sur l'IA */}
        {optimizations.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    Optimisations générées par l'IA
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Ces suggestions sont basées sur l'analyse de vos données financières et des réglementations fiscales en vigueur. 
                    Consultez toujours un expert-comptable avant implémentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};