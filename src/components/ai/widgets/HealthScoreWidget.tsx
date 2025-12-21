import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';
import { FinancialHealthScore } from '../../../types/ai.types';

interface HealthScoreWidgetProps {
  healthScore: FinancialHealthScore | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const HealthScoreWidget: React.FC<HealthScoreWidgetProps> = ({
  healthScore,
  isLoading = false,
  onRefresh,
  className
}) => {
  
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBadgeColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500 dark:text-gray-300" />;
    }
  };

  const getTrendLabel = (trend: string): string => {
    switch (trend) {
      case 'improving':
        return 'En amélioration';
      case 'declining':
        return 'En dégradation';
      default:
        return 'Stable';
    }
  };

  const getFactorIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Santé Financière</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthScore) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Santé Financière</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Shield className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 dark:text-gray-300">Données insuffisantes pour le calcul</p>
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
            <Shield className="w-5 h-5" />
            <span>Santé Financière</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Badge className={cn("border", getScoreBadgeColor(healthScore.overall))}>
              {getTrendLabel(healthScore.trend)}
            </Badge>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score global */}
        <div className="text-center space-y-4">
          <motion.div
            className="relative w-32 h-32 mx-auto"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Cercle de progression */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-200 dark:text-gray-700 dark:text-gray-300"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - healthScore.overall / 100)}
                strokeLinecap="round"
                className={getScoreColor(healthScore.overall)}
                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - healthScore.overall / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            
            {/* Score au centre */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  className={cn("text-3xl font-bold", getScoreColor(healthScore.overall))}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {healthScore.overall}
                </motion.div>
                <div className="text-xs text-gray-500 dark:text-gray-300">/ 100</div>
              </div>
            </div>
          </motion.div>

          {/* Tendance */}
          <div className="flex items-center justify-center space-x-2">
            {getTrendIcon(healthScore.trend)}
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {getTrendLabel(healthScore.trend)}
            </span>
          </div>
        </div>

        {/* Facteurs détaillés */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
            <Info className="w-4 h-4" />
            <span>Analyse détaillée</span>
          </h4>

          <div className="space-y-3">
            {healthScore.factors.map((factor, index) => (
              <motion.div
                key={factor.metric}
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getFactorIcon(factor.score)}
                    <span className="text-sm font-medium">{factor.metric}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">{factor.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={cn("text-sm font-medium", getScoreColor(factor.score))}>
                      {factor.score}%
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {factor.weight}%
                    </Badge>
                  </div>
                </div>

                <Progress 
                  value={factor.score} 
                  className="h-2"
                />

                {factor.recommendation && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-2">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      💡 {factor.recommendation}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dernière mise à jour */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-600 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-300 text-center">
            Dernière analyse: {new Date(healthScore.lastUpdated).toLocaleString('fr-FR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
