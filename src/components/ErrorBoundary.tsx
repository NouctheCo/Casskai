import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Google Analytics gtag may be available globally
declare global {
  interface Window { gtag?: (...args: any[]) => void }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const gtag = typeof window !== 'undefined' ? window.gtag : undefined;

// Types pour l'Error Boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableReporting?: boolean;
  showReportButton?: boolean;
  isolate?: boolean; // Si true, isole l'erreur sans faire planter toute l'app
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  reportError: () => void;
  errorId: string;
  showDetails: boolean;
  toggleDetails: () => void;
}

// Service de reporting d'erreurs
class ErrorReportingService {
  private static instance: ErrorReportingService;
  private apiEndpoint: string;
  private enableLogging: boolean;

  private constructor() {
    this.apiEndpoint = '/api/errors'; // Endpoint pour reporter les erreurs
    this.enableLogging = process.env.NODE_ENV !== 'production';
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  async reportError(
    error: Error,
    errorInfo: ErrorInfo,
    errorId: string,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      userId: this.getUserId(),
      buildVersion: process.env.VITE_APP_VERSION || 'unknown',
      additionalContext,
    };

    // Log en mode développement
    if (this.enableLogging) {
      console.error('[ErrorBoundary] Erreur capturée:', errorReport);
    }

    try {
      // Envoyer vers notre API
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });

      // Envoyer vers Sentry si configuré
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          tags: {
            errorBoundary: true,
            errorId,
          },
          extra: additionalContext,
        });
      }

      // Analytics d'erreur
      if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
          description: error.message,
          fatal: true,
          error_id: errorId,
        });
      }

    } catch (reportingError) {
      console.error('[ErrorBoundary] Échec du reporting:', reportingError);
    }
  }

  private getUserId(): string | null {
    try {
      // Récupérer l'ID utilisateur depuis le localStorage ou le contexte auth
      return localStorage.getItem('userId') || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  // Collecter des infos supplémentaires sur l'environnement
  getEnvironmentInfo(): Record<string, any> {
    return {
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      memoryInfo: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
    };
  }
}

// Composant de fallback par défaut
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  reportError,
  errorId,
  showDetails,
  toggleDetails,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            Une erreur inattendue s'est produite
          </CardTitle>
          <CardDescription>
            Nous sommes désolés pour ce désagrément. L'erreur a été automatiquement signalée.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Bug className="h-4 w-4" />
            <AlertDescription>
              ID de l'erreur: <code className="bg-gray-100 px-1 rounded text-xs">{errorId}</code>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={resetError} 
              className="w-full"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
            
            <Button
              onClick={reportError}
              variant="ghost"
              size="sm"
              className="w-full text-gray-600"
            >
              <Bug className="w-4 h-4 mr-2" />
              Signaler le problème
            </Button>
          </div>

          {/* Détails techniques (collapsible) */}
          <div className="border-t pt-4 mt-4">
            <button
              onClick={toggleDetails}
              className="flex items-center justify-between w-full text-sm text-gray-500 hover:text-gray-700"
            >
              <span>Détails techniques</span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showDetails && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-600 font-mono">
                <div className="mb-2">
                  <strong>Message:</strong>
                  <div className="mt-1 text-red-600">{error.message}</div>
                </div>
                
                <div className="mb-2">
                  <strong>Stack trace:</strong>
                  <pre className="mt-1 overflow-auto max-h-32 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
                
                <div>
                  <strong>Composant:</strong>
                  <pre className="mt-1 overflow-auto max-h-20 whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Error Boundary principal
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorReporting: ErrorReportingService;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false,
    };
    
    this.errorReporting = ErrorReportingService.getInstance();
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Reporter l'erreur
    if (this.props.enableReporting !== false) {
      const additionalContext = {
        ...this.errorReporting.getEnvironmentInfo(),
        props: this.props.isolate ? 'isolated' : 'global',
      };

      this.errorReporting.reportError(
        error,
        errorInfo,
        this.state.errorId,
        additionalContext
      );
    }

    // Callback personnalisé
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.errorId);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false,
    });
  };

  reportError = async () => {
    if (this.state.error && this.state.errorInfo) {
      await this.errorReporting.reportError(
        this.state.error,
        this.state.errorInfo,
        this.state.errorId,
        { manualReport: true }
      );
      
  // Feedback utilisateur
  // eslint-disable-next-line no-alert
  alert('Merci ! Le problème a été signalé à notre équipe technique.');
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          reportError={this.reportError}
          errorId={this.state.errorId}
          showDetails={this.state.showDetails}
          toggleDetails={this.toggleDetails}
        />
      );
    }

    return this.props.children;
  }
}

// HOC pour wrapper des composants avec une Error Boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook pour capturer les erreurs asynchrones
export const useErrorHandler = () => {
  const reportingService = ErrorReportingService.getInstance();

  const handleError = React.useCallback((error: Error, context?: Record<string, any>) => {
    const errorId = `async_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Pour les erreurs async, on simule un ErrorInfo
    const errorInfo: ErrorInfo = {
      componentStack: 'Erreur asynchrone - pas de stack de composant disponible',
    };

    reportingService.reportError(error, errorInfo, errorId, {
      ...context,
      type: 'async',
    });

    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('[useErrorHandler]', error, context);
    }
  }, [reportingService]);

  return handleError;
};

// Wrapper pour les erreurs de promesses non gérées
export const setupGlobalErrorHandling = () => {
  const reportingService = ErrorReportingService.getInstance();

  // Erreurs JavaScript non gérées
  window.addEventListener('error', (event) => {
    const error = new Error(event.message);
    error.stack = `${event.filename  }:${  event.lineno  }:${  event.colno}`;
    
    const errorInfo: ErrorInfo = {
      componentStack: 'Erreur JavaScript globale',
    };
    
    const errorId = `global_error_${Date.now()}`;
    reportingService.reportError(error, errorInfo, errorId, {
      type: 'global',
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Promesses rejetées non gérées
  window.addEventListener('unhandledrejection', (event) => {
    const error = new Error(`Promesse rejetée: ${event.reason}`);
    const errorInfo: ErrorInfo = {
      componentStack: 'Promesse non gérée',
    };
    
    const errorId = `promise_error_${Date.now()}`;
    reportingService.reportError(error, errorInfo, errorId, {
      type: 'unhandledPromise',
      reason: event.reason,
    });
  });
};

export default ErrorBoundary;
export { ErrorReportingService };
export type { ErrorBoundaryProps, ErrorFallbackProps };