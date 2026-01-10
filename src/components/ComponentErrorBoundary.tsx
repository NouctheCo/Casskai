import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';
interface Props {
  children: ReactNode;
  componentName?: string;
  showError?: boolean;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}
export class ComponentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'Unknown Component';
    logger.error('ComponentErrorBoundary', `ComponentErrorBoundary caught an error in ${componentName}:`, error, errorInfo);
    // Log error details for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.warn('ComponentErrorBoundary', `🔴 Component Error: ${componentName}`);
      logger.error('ComponentErrorBoundary', 'Error:', error);
      logger.error('ComponentErrorBoundary', 'Error Info:', errorInfo);
    }
  }
  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };
  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // Default minimal error UI
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <h3 className="text-sm font-medium text-red-900">
              {this.props.componentName || 'Component'} Error
            </h3>
          </div>
          <p className="text-sm text-red-700 mb-3">
            This component encountered an error and couldn't render properly.
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium dark:text-red-400"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </button>
          {this.props.showError && process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-3 p-2 bg-white dark:bg-gray-800 rounded border text-xs">
              <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                Error Details
              </summary>
              <div className="mt-2 text-gray-600 dark:text-gray-400">
                <p className="font-semibold">Message:</p>
                <p className="mb-2">{this.state.error.message}</p>
                <p className="font-semibold">Stack:</p>
                <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-24">
                  {this.state.error.stack}
                </pre>
              </div>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
export default ComponentErrorBoundary;