import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Info, CheckCircle} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CacheManager } from '@/utils/cacheManager';

export const CacheDebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [report, setReport] = useState(CacheManager.getCacheReport());
  const [validation, setValidation] = useState(CacheManager.validateCache());

  const refreshReport = () => {
    setReport(CacheManager.getCacheReport());
    setValidation(CacheManager.validateCache());
  };

  const handleClearCache = () => {
    if (confirm('Êtes-vous sûr de vouloir nettoyer le cache ? Cela nécessitera de vous reconnecter.')) {
      CacheManager.clearAndReload();
    }
  };

  const handleSmartClean = () => {
    CacheManager.smartClean();
    refreshReport();
  };

  const handleRefreshContext = () => {
    CacheManager.triggerEnterpriseRefresh();
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Debug Cache
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96">
      <Card className="shadow-xl border-orange-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
              Debug Cache Enterprise
            </CardTitle>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* État du cache */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700">État actuel</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Entreprises:</span>
                <Badge variant={report.hasEnterprises ? "destructive" : "secondary"}>
                  {report.enterprisesCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Entreprise courante:</span>
                <Badge variant={report.hasCurrentEnterprise ? "destructive" : "secondary"}>
                  {report.hasCurrentEnterprise ? "Oui" : "Non"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Validation */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700">Validation</h4>
            <div className="flex items-center space-x-2">
              {validation.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs">
                {validation.isValid ? 'Cache valide' : `${validation.issues.length} problème(s)`}
              </span>
            </div>
            {!validation.isValid && (
              <ul className="text-xs text-red-600 space-y-1">
                {validation.issues.map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Problème détecté */}
          {(report.hasEnterprises || report.hasCurrentEnterprise) && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-orange-800">Problème détecté</p>
                  <p className="text-orange-700">
                    Données en cache alors que la base est vide. Cela peut causer l'erreur "entreprise créée récemment".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={refreshReport}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Actualiser
            </Button>

            <Button
              onClick={handleRefreshContext}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync Context
            </Button>

            <Button
              onClick={handleSmartClean}
              variant="outline"
              size="sm"
              className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Nettoyage intelligent
            </Button>

            <Button
              onClick={handleClearCache}
              variant="destructive"
              size="sm"
              className="text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Reset complet
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <p className="font-medium">Résolution du problème:</p>
            <ol className="list-decimal list-inside space-y-1 mt-1">
              <li>Cliquez "Nettoyage intelligent"</li>
              <li>Puis fermez ce panel</li>
              <li>Relancez l'onboarding</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};