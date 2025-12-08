import React, { ErrorInfo } from 'react';
import ErrorBoundary from './ErrorBoundary';

// Types pour l'Error Boundary
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableReporting?: boolean;
  showReportButton?: boolean;
  isolate?: boolean; // Si true, isole l'erreur sans faire planter toute l'app
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  reportError: () => void;
  errorId: string;
  showDetails: boolean;
  toggleDetails: () => void;
}

// Service de reporting d'erreurs
export class ErrorReportingService {
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

// HOC pour wrapper des composants avec une Error Boundary
export function withErrorBoundary<P extends object>(
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
export const useErrorHandler = () => {
  const reportingService = ErrorReportingService.getInstance();

  const handleError = React.useCallback((error: Error, context?: Record<string, unknown>) => {
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

// Import the ErrorBoundary component to avoid circular imports
// This will be imported in the main ErrorBoundary.tsx file
export { default as ErrorBoundary } from './ErrorBoundary';
