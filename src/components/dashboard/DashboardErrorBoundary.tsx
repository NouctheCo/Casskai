import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Dashboard Error Boundary caught an error', error, { errorInfo });
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <span>Erreur du Dashboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-2">Une erreur s'est produite lors du chargement du dashboard.</p>
              {this.state.error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm font-mono text-red-800 dark:text-red-200">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button onClick={this.handleReset} className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Réessayer</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Recharger la page
              </Button>
            </div>

            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400">
                  Détails de l'erreur (Développement)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-40">
                  {this.state.error && this.state.error.stack}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
