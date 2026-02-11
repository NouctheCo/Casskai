/**
 * CassKai - Composant Dashboard Caching IA
 * Affiche les stats de cache et économies OpenAI en temps réel
 */

import React, { useEffect, useState } from 'react';
import { aiCacheService, CacheStats } from '@/lib/ai-cache';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingDown, Zap, BarChart3, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface CachedQuery {
  cacheKey: string;
  hits: number;
  type: string;
}

export const AICachingDashboard: React.FC = () => {
  const { currentCompany } = useAuth();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [topQueries, setTopQueries] = useState<CachedQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Charger les stats de cache
  const loadStats = async () => {
    if (!currentCompany?.id) return;

    try {
      setLoading(true);
      const [statsData, queriesData] = await Promise.all([
        aiCacheService.getStats(currentCompany.id),
        aiCacheService.getTopCachedQueries(currentCompany.id, 5),
      ]);

      setStats(statsData);
      setTopQueries(queriesData);
      setLastUpdated(new Date());
      logger.info('[AICachingDashboard] Stats loaded:', statsData);
    } catch (error) {
      logger.error('[AICachingDashboard] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [currentCompany?.id]);

  if (!currentCompany) {
    return null;
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Chargement des stats IA...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  // Formatage des chiffres
  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;
  const formatPercent = (percent: number) => `${Math.round(percent)}%`;

  // Couleur basée sur le taux de hit
  const hitRateColor =
    stats.hitRate >= 70 ? 'text-green-600' :
    stats.hitRate >= 40 ? 'text-blue-600' :
    'text-orange-600';

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-emerald-900 dark:text-emerald-100">
                Économies IA en Temps Réel
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadStats}
              disabled={loading}
              className="gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Grille des métriques principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Taux de cache hit */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-emerald-100 dark:border-emerald-800">
              <p className="text-xs text-muted-foreground mb-1">Taux de Hit</p>
              <p className={`text-2xl font-bold ${hitRateColor}`}>
                {formatPercent(stats.hitRate)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ({stats.hits} hits / {stats.hits + stats.misses} requêtes)
              </p>
            </div>

            {/* Appels économisés */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-muted-foreground mb-1">Appels Économisés</p>
              <p className="text-2xl font-bold text-blue-600">{stats.savedApiCalls}</p>
              <p className="text-xs text-muted-foreground mt-1">appels OpenAI</p>
            </div>

            {/* Économies financières */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-green-100 dark:border-green-800">
              <p className="text-xs text-muted-foreground mb-1">Économies</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.estimatedSavings)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">réalisées</p>
            </div>

            {/* ROI du caching */}
            <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
              <p className="text-xs text-muted-foreground mb-1">Coût évité</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatPercent((stats.estimatedSavings / (stats.estimatedSavings + 50)) * 100)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">du budget IA</p>
            </div>
          </div>

          {/* Info supplémentaire */}
          <div className="flex items-center gap-2 p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-700">
            <TrendingDown className="w-5 h-5 text-emerald-600" />
            <div className="text-sm">
              <p className="font-medium text-emerald-900 dark:text-emerald-100">
                Cache intelligent activé
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Dernière mise à jour : {lastUpdated.toLocaleTimeString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top requêtes cachées */}
      {topQueries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <CardTitle>Top Requêtes Cachées</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {topQueries.map((query, index) => (
                <div
                  key={query.cacheKey}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-sm font-bold text-blue-600 dark:text-blue-300">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                          {query.type}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {query.cacheKey.substring(0, 40)}...
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      {query.hits}
                      <span className="text-green-600 dark:text-green-300">hits</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages d'info */}
      <div className="text-xs text-muted-foreground text-center p-2">
        💡 Le caching réduit les coûts OpenAI de ~70%. Plus le taux de hit est élevé, plus les économies augmentent!
      </div>
    </div>
  );
};
