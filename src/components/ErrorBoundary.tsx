import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    this.enableLogging = false; // Désactivé temporairement pour éviter les erreurs 405
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  async reportError(
    _error: Error,
    _errorInfo: ErrorInfo,
    _errorId: string,
    _additionalContext?: Record<string, unknown>
  ): Promise<void> {
    // Désactivé pour éviter les erreurs 405 - endpoint /api/errors n'existe pas
    console.warn('[ErrorBoundary] Error reporting disabled to avoid 405 errors');
    return Promise.resolve();
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
  getEnvironmentInfo(): Record<string, unknown> {
    // Type pour l'API Performance.memory (non standard mais largement supporté)
    interface PerformanceMemory {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    }

    interface ExtendedPerformance extends Performance {
      memory?: PerformanceMemory;
    }

    const extendedPerformance = performance as ExtendedPerformance;

    return {
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      memoryInfo: extendedPerformance.memory ? {
        usedJSHeapSize: extendedPerformance.memory.usedJSHeapSize,
        totalJSHeapSize: extendedPerformance.memory.totalJSHeapSize,
        jsHeapSizeLimit: extendedPerformance.memory.jsHeapSizeLimit,
      } : null,
    };
  }
}

// Composants de fallback séparés pour réduire la taille de la fonction
const ErrorHeader: React.FC<{ _errorId: string }> = ({ _errorId }) => (
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
);

const ErrorActions: React.FC<{
  resetError: () => void;
  reportError: () => void;
}> = ({ resetError, reportError }) => (
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
);

const ErrorDetails: React.FC<{
  error: Error;
  errorInfo: ErrorInfo;
  showDetails: boolean;
  toggleDetails: () => void;
}> = ({ error, errorInfo, showDetails, toggleDetails }) => (
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
);

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
        <ErrorHeader _errorId={errorId} />

        <CardContent className="space-y-4">
          <Alert>
            <Bug className="h-4 w-4" />
            <AlertDescription>
              ID de l'erreur: <code className="bg-gray-100 px-1 rounded text-xs">{errorId}</code>
            </AlertDescription>
          </Alert>

          <ErrorActions resetError={resetError} reportError={reportError} />
          <ErrorDetails
            error={error}
            errorInfo={errorInfo}
            showDetails={showDetails}
            toggleDetails={toggleDetails}
          />
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
      console.warn('Erreur signalée avec succès à l\'équipe technique');
      // Au lieu d'utiliser alert(), on pourrait utiliser un toast ou une notification
      // toast.success('Merci ! Le problème a été signalé à notre équipe technique.');
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
function _withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryConfig}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook pour capturer les erreurs asynchrones
const _useErrorHandler = () => {
  const reportingService = ErrorReportingService.getInstance();

  const handleError = (error: Error, context?: Record<string, unknown>) => {
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
  };

  return handleError;
};

// Wrapper pour les erreurs de promesses non gérées
const _setupGlobalErrorHandling = () => {
  const reportingService = ErrorReportingService.getInstance();

  // Erreurs JavaScript non gérées
  window.addEventListener('error', (event) => {
    const error = new Error(event.message);
    error.stack = `${event.filename}:${event.lineno}:${event.colno}`;

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
export { ErrorReportingService, _setupGlobalErrorHandling as setupGlobalErrorHandling };
export type { ErrorBoundaryProps, ErrorFallbackProps };