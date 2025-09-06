// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { useAuth } from '@/contexts/AuthContext';
import { validateOnboardingImprovements } from '@/utils/onboardingValidation';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Database,
  Zap,
  Eye
} from 'lucide-react';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const OnboardingDebugPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<string>('');
  
  const { currentEnterprise, enterprises, synchronizeAfterOnboarding } = useEnterprise();
  const { user } = useAuth();

  const runTests = useCallback(async () => {
    setIsRunning(true);
    try {
      const results = await validateOnboardingImprovements();
      setTestResults(results.results);
      setSummary(results.summary);
    } catch (error) {
      console.error('Erreur lors des tests:', error);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const triggerSync = useCallback(() => {
    synchronizeAfterOnboarding();
  }, [synchronizeAfterOnboarding]);

  const clearLocalStorage = useCallback(() => {
    localStorage.removeItem('casskai_enterprises');
    localStorage.removeItem('casskai_current_enterprise');
    localStorage.removeItem('casskai_modules');
    window.location.reload();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'SKIP':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <TestTube className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <TestTube className="w-5 h-5 text-blue-500" />
          <CardTitle>Panel de Debug - Améliorations Onboarding</CardTitle>
          <Badge variant="outline" className="text-xs">
            Debug Only
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* État actuel */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Utilisateur</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600">
                {user ? `${user.email} (${user.id})` : 'Non connecté'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Entreprise Actuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600">
                {currentEnterprise ? `${currentEnterprise.name} (${currentEnterprise.id})` : 'Aucune'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Entreprises Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600">
                {enterprises.length} entreprise(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions de test */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center space-x-2"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
            <span>Exécuter Tests</span>
          </Button>

          <Button 
            variant="outline"
            onClick={triggerSync}
            className="flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Synchroniser</span>
          </Button>

          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Tester Dashboard</span>
          </Button>

          <Button 
            variant="destructive"
            onClick={clearLocalStorage}
            className="flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Reset localStorage</span>
          </Button>
        </div>

        {/* Résultats des tests */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Résultats des Tests</h3>
              <Badge variant="outline">{summary}</Badge>
            </div>

            <ScrollArea className="h-64 w-full border rounded-md p-4">
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{result.test}</span>
                        <Badge 
                          variant={result.status === 'PASS' ? 'default' : result.status === 'FAIL' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{result.message}</p>
                      {result.details && (
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Informations localStorage */}
        <div className="space-y-2">
          <h4 className="font-medium">État localStorage:</h4>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between">
              <span>casskai_enterprises:</span>
              <Badge variant="outline" className="text-xs">
                {localStorage.getItem('casskai_enterprises') ? 'Présent' : 'Absent'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>casskai_current_enterprise:</span>
              <Badge variant="outline" className="text-xs">
                {localStorage.getItem('casskai_current_enterprise') || 'Absent'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>casskai_modules:</span>
              <Badge variant="outline" className="text-xs">
                {localStorage.getItem('casskai_modules') ? 'Présent' : 'Absent'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Note de développement */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Ce panel est destiné au développement uniquement. 
            Il permet de tester les améliorations apportées au flux onboarding et à la synchronisation des entreprises.
            Retirez ce composant en production.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingDebugPanel;