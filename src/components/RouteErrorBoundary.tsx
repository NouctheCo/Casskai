import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { logger } from '@/utils/appLogger';

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class RouteErrorBoundaryClass extends Component<Props & { navigate: (path: string) => void }, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      `RouteErrorBoundary caught an error in ${this.props.routeName || 'unknown route'}`,
      error,
      { route: this.props.routeName, errorInfo }
    );
  }

  private handleGoHome = () => {
    this.props.navigate('/dashboard');
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center px-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-orange-900">
                {this.props.routeName ? `Erreur dans ${this.props.routeName}` : 'Erreur de page'}
              </CardTitle>
              <CardDescription>
                Cette page a rencontré une erreur et n'a pas pu se charger correctement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleTryAgain} 
                  variant="outline" 
                  className="flex-1"
                  size="sm"
                >
                  Réessayer
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  className="flex-1"
                  size="sm"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Aller au tableau de bord
                </Button>
              </div>
              
              <Button 
                onClick={this.handleReload} 
                variant="ghost" 
                className="w-full"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recharger l'application
              </Button>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 rounded-lg bg-gray-100 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Détails techniques (Développement uniquement)
                  </summary>
                  <div className="mt-2 text-xs text-gray-600">
                    <p className="font-semibold">Route:</p>
                    <p className="mb-2">{this.props.routeName || 'Inconnue'}</p>
                    <p className="font-semibold">Erreur:</p>
                    <p className="mb-2">{this.state.error.message}</p>
                    <p className="font-semibold">Trace:</p>
                    <pre className="whitespace-pre-wrap text-xs max-h-32 overflow-y-auto">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to use React Router's useNavigate hook
export const RouteErrorBoundary: React.FC<Props> = ({ children, routeName }) => {
  const navigate = useNavigate();
  
  return (
    <RouteErrorBoundaryClass navigate={navigate} routeName={routeName}>
      {children}
    </RouteErrorBoundaryClass>
  );
};

export default RouteErrorBoundary;