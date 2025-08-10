import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { testSupabaseConnection, testDatabaseTables } from '../../utils/testConnection';
import { CheckCircle, XCircle, Loader2, Database, Shield } from 'lucide-react';

const DatabaseTest: React.FC = () => {
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [tablesResult, setTablesResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runConnectionTest = async () => {
    setLoading(true);
    const result = await testSupabaseConnection();
    setConnectionResult(result);
    setLoading(false);
  };

  const runTablesTest = async () => {
    setLoading(true);
    const result = await testDatabaseTables();
    setTablesResult(result);
    setLoading(false);
  };

  const runAllTests = async () => {
    setLoading(true);
    setConnectionResult(null);
    setTablesResult(null);
    
    const connResult = await testSupabaseConnection();
    setConnectionResult(connResult);
    
    if (connResult.success) {
      const tablesRes = await testDatabaseTables();
      setTablesResult(tablesRes);
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Base de Données - Tests de Connexion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runConnectionTest} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Test Connexion
            </Button>
            <Button onClick={runTablesTest} disabled={loading} variant="outline">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Test Tables
            </Button>
            <Button onClick={runAllTests} disabled={loading} variant="default">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Tous les Tests
            </Button>
          </div>

          {/* Connection Test Results */}
          {connectionResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {connectionResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Test de Connexion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant={connectionResult.success ? "default" : "destructive"}>
                    {connectionResult.success ? "Succès" : "Échec"}
                  </Badge>
                  {connectionResult.authStatus && (
                    <div>
                      <strong>Auth Status:</strong> {connectionResult.authStatus}
                    </div>
                  )}
                  {connectionResult.error && (
                    <div className="text-red-600">
                      <strong>Erreur:</strong> {connectionResult.error}
                    </div>
                  )}
                  {connectionResult.message && (
                    <div className="text-green-600">
                      {connectionResult.message}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tables Test Results */}
          {tablesResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {tablesResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Test des Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tablesResult.results ? (
                  <div className="space-y-2">
                    {tablesResult.results.map((result: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-mono text-sm">{result.table}</span>
                        <div className="flex items-center gap-2">
                          {result.status === 'ok' ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-600">
                                {result.count} enregistrements
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-600">
                                {result.error}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-red-600">
                    <strong>Erreur:</strong> {tablesResult.error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTest;