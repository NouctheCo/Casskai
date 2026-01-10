import { AlertTriangle, TrendingDown, Lightbulb, Target, X, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import type { AIInsight } from '@/types/automation.types';
import { logger } from '@/lib/logger';
interface AIAlertsPanelProps {
  insights: AIInsight[];
  onRefresh: () => void;
}
export default function AIAlertsPanel({ insights, onRefresh }: AIAlertsPanelProps) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const getIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5" />;
      case 'prediction':
        return <TrendingDown className="w-5 h-5" />;
      case 'optimization':
        return <Lightbulb className="w-5 h-5" />;
      case 'recommendation':
        return <Target className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };
  const handleMarkAsSeen = async (insight: AIInsight) => {
    try {
      await supabase
        .from('ai_insights')
        .update({ status: 'seen' })
        .eq('id', insight.id);
      showToast(t('automation.success.alertMarkedAsRead'), 'success');
      onRefresh();
    } catch (error) {
      logger.error('AIAlertsPanel', 'Error marking as seen:', error);
    }
  };
  const handleDismiss = async (insight: AIInsight) => {
    try {
      await supabase
        .from('ai_insights')
        .update({ status: 'dismissed' })
        .eq('id', insight.id);
      showToast(t('automation.success.alertIgnored'), 'success');
      onRefresh();
    } catch (error) {
      logger.error('AIAlertsPanel', 'Error dismissing:', error);
    }
  };
  if (insights.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucune alerte active</h3>
        <p className="text-sm text-muted-foreground">
          Votre système fonctionne normalement. Cliquez sur "Analyser avec l'IA" pour lancer une nouvelle analyse.
        </p>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <Card key={insight.id} className={`p-6 border-2 ${getSeverityColor(insight.severity)}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">{getIcon(insight.type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{insight.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {insight.type === 'anomaly' && 'Anomalie'}
                    {insight.type === 'prediction' && 'Prédiction'}
                    {insight.type === 'optimization' && 'Optimisation'}
                    {insight.type === 'recommendation' && 'Recommandation'}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(insight.confidence_score * 100)}% confiance
                  </Badge>
                </div>
                <p className="text-sm mb-3">{insight.description}</p>
                {/* Actions suggérées */}
                {insight.suggested_actions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {insight.suggested_actions.map((action, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (action.navigation_path) {
                            window.location.href = action.navigation_path;
                          }
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1 ml-4">
              {insight.status === 'new' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleMarkAsSeen(insight)}
                  title="Marquer comme vu"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(insight)}
                title="Ignorer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Métadonnées */}
          <div className="text-xs text-muted-foreground flex items-center gap-3 pt-3 border-t">
            <span>Catégorie: {insight.category}</span>
            <span>•</span>
            <span>Détecté le {new Date(insight.created_at).toLocaleDateString()}</span>
            {insight.model_version && (
              <>
                <span>•</span>
                <span>Modèle: {insight.model_version}</span>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}