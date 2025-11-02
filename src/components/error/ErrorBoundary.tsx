import React from 'react';
import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  error: unknown;
  resetError: () => void;
}

/**
 * Error Fallback Component
 * Displayed when an error is caught by the boundary
 */
function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Oups ! Une erreur s'est produite
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 text-center mb-4">
          Nous sommes désolés, quelque chose ne s'est pas passé comme prévu.
          Notre équipe a été notifiée de ce problème.
        </p>

        {/* Error Details (only in development) */}
        {import.meta.env.MODE === 'development' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-mono text-red-800 break-all">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={resetError}
            className="flex-1 flex items-center justify-center gap-2"
            variant="default"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>

          <Button
            onClick={() => (window.location.href = '/')}
            className="flex-1 flex items-center justify-center gap-2"
            variant="outline"
          >
            <Home className="w-4 h-4" />
            Accueil
          </Button>
        </div>

        {/* Support Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Besoin d'aide ?{' '}
            <a
              href="mailto:support@casskai.app"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

/**
 * Global Error Boundary
 * Catches all React errors and displays fallback UI
 * Integrates with Sentry for error reporting
 */
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <SentryErrorBoundary
      fallback={({ error, resetError }) => {
        const FallbackComponent = fallback || ErrorFallback;
        return (
          <FallbackComponent error={error} resetError={resetError} />
        );
      }}
      onError={(error, errorInfo) => {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
      }}
    >
      {children}
    </SentryErrorBoundary>
  );
}

/**
 * Page-level Error Boundary
 * For wrapping individual routes/pages
 */
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="p-6">
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-900 mb-2">
                  Erreur de chargement
                </h2>
                <p className="text-red-700 mb-4">
                  Cette page n'a pas pu se charger correctement.
                </p>
                {import.meta.env.MODE === 'development' && (
                  <pre className="text-xs bg-red-100 p-3 rounded overflow-auto mb-4">
                    {error instanceof Error ? error.message : String(error)}
                  </pre>
                )}
                <Button onClick={resetError} size="sm" variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
