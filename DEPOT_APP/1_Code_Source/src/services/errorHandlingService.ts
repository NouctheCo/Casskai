/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export interface ErrorContext {
  service?: string;
  method?: string;
  userId?: string;
  companyId?: string;
  additional?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  technicalMessage: string;
  retryable: boolean;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 2000, 4000]; // Progressive delays
  
  private constructor() {}

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Wrapper pour les appels API Supabase avec gestion d'erreur complète
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Log the attempt
        console.warn(`[${context.service}/${context.method}] Attempt ${attempt + 1} failed:`, error);

        // Don't retry if it's the last attempt or if error is not retryable
        if (attempt === maxRetries || !this.isRetryableError(error as Error)) {
          break;
        }
        
        // Wait before retrying
        await this.delay(this.retryDelays[attempt] || 4000);
      }
    }
    
    // All retries failed, handle the error
    return this.handleError(lastError!, context);
  }

  /**
   * Wrapper pour les appels Supabase
   */
  async supabaseCall<T>(
    operation: () => Promise<{ data: T | null; error: unknown }>,
    context: ErrorContext
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      const { data, error } = await operation();
      
      if (error) {
        throw this.createApiError(error, context);
      }
      
      return data as T;
    }, context);
  }

  /**
   * Wrapper pour les appels fetch
   */
  async fetchCall<T>(
    url: string,
    options: RequestInit,
    context: ErrorContext
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        throw this.createApiError({
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code || `HTTP_${response.status}`,
          status: response.status,
          ...errorData,
        }, context);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text() as unknown as T;
    }, context);
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError<_T>(error: Error, context: ErrorContext): never {
    const apiError = (error as unknown as {statusCode?: string}).statusCode ? (error as unknown as ApiError) : this.createApiError(error, context);

    // Log error for monitoring
    this.logError(apiError, context);

    // Show user notification
    this.showErrorToUser(apiError);

    // Report to error tracking service
    this.reportError(apiError, context);

    throw apiError;
  }

  /**
   * Création d'une erreur API structurée
   */
  private createApiError(error: unknown, context: ErrorContext): ApiError {
    const err = error as Record<string, unknown>;

    // Map des erreurs Supabase communes
    const supabaseErrorMap: Record<string, Partial<ApiError>> = {
      'PGRST116': {
        userMessage: 'Aucune donnée trouvée',
        severity: 'low',
        retryable: false,
      },
      'PGRST301': {
        userMessage: 'Accès non autorisé à cette ressource',
        severity: 'medium',
        retryable: false,
      },
      'PGRST202': {
        userMessage: 'Cette ressource n\'existe plus',
        severity: 'medium',
        retryable: false,
      },
      '23505': { // Unique violation
        userMessage: 'Cette information existe déjà dans le système',
        severity: 'medium',
        retryable: false,
      },
      '23503': { // Foreign key violation
        userMessage: 'Impossible de supprimer : des éléments liés existent encore',
        severity: 'medium',
        retryable: false,
      },
    };

    // Map des erreurs HTTP communes
    const httpErrorMap: Record<number, Partial<ApiError>> = {
      400: {
        userMessage: 'Les données envoyées ne sont pas valides',
        severity: 'medium',
        retryable: false,
      },
      401: {
        userMessage: 'Vous devez vous reconnecter pour continuer',
        severity: 'high',
        retryable: false,
      },
      403: {
        userMessage: 'Vous n\'avez pas les permissions nécessaires',
        severity: 'medium',
        retryable: false,
      },
      404: {
        userMessage: 'La ressource demandée n\'a pas été trouvée',
        severity: 'low',
        retryable: false,
      },
      409: {
        userMessage: 'Cette action entre en conflit avec l\'état actuel',
        severity: 'medium',
        retryable: false,
      },
      422: {
        userMessage: 'Les données ne respectent pas les règles de validation',
        severity: 'medium',
        retryable: false,
      },
      429: {
        userMessage: 'Trop de requêtes envoyées. Veuillez patienter un moment.',
        severity: 'medium',
        retryable: true,
      },
      500: {
        userMessage: 'Erreur serveur. Notre équipe technique a été notifiée.',
        severity: 'high',
        retryable: true,
      },
      502: {
        userMessage: 'Service temporairement indisponible',
        severity: 'high',
        retryable: true,
      },
      503: {
        userMessage: 'Service en maintenance. Réessayez dans quelques minutes.',
        severity: 'high',
        retryable: true,
      },
    };

    const errorCode = String(err.code || (err.status ? String(err.status) : 'UNKNOWN'));
    const errorStatus = typeof err.status === 'number' ? err.status : undefined;
    const errorMapping = supabaseErrorMap[errorCode] || (errorStatus ? httpErrorMap[errorStatus] : undefined) || {};

    const severity = this.determineSeverity(error, context);

    return {
      code: errorCode,
      message: String((err as unknown as Error).message || 'Une erreur inconnue s\'est produite'),
      details: err.details || error,
      severity,
      userMessage: errorMapping.userMessage || this.getDefaultUserMessage(severity),
      technicalMessage: `[${context.service}/${context.method}] ${String((err as unknown as Error).message)}`,
      retryable: errorMapping.retryable ?? this.isRetryableError(error),
      ...errorMapping,
    };
  }

  /**
   * Détermine la sévérité d'une erreur selon le contexte
   */
  private determineSeverity(error: unknown, context: ErrorContext): ApiError['severity'] {
    const err = error as Record<string, unknown>;

    // Erreurs critiques dans les services financiers
    if (context.service && ['invoicingService', 'accountingService', 'subscriptionService'].includes(context.service)) {
      return 'critical';
    }

    // Erreurs de connexion/auth
    if (err.status === 401 || err.code === 'PGRST301') {
      return 'high';
    }

    // Erreurs serveur
    if (typeof err.status === 'number' && err.status >= 500) {
      return 'high';
    }

    // Erreurs client
    if (typeof err.status === 'number' && err.status >= 400 && err.status < 500) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Message utilisateur par défaut selon la sévérité
   */
  private getDefaultUserMessage(severity: ApiError['severity']): string {
    switch (severity) {
      case 'critical':
        return 'Erreur critique détectée. Veuillez contacter le support immédiatement.';
      case 'high':
        return 'Une erreur importante s\'est produite. Veuillez réessayer ou contacter le support.';
      case 'medium':
        return 'Une erreur s\'est produite lors de cette opération.';
      default:
        return 'Opération impossible pour le moment.';
    }
  }

  /**
   * Détermine si une erreur peut être retentée
   */
  private isRetryableError(error: unknown): boolean {
    const err = error as Record<string, unknown>;

    // Erreurs réseau temporaires
    if ((err as unknown as Error).name === 'NetworkError' || (typeof (err as unknown as Error).message === 'string' && (err as unknown as Error).message.includes('fetch'))) {
      return true;
    }

    // Erreurs serveur temporaires
    if (typeof err.status === 'number' && err.status >= 500 && err.status <= 504) {
      return true;
    }

    // Rate limiting
    if (err.status === 429) {
      return true;
    }

    // Timeout
    if ((err as unknown as Error).name === 'TimeoutError') {
      return true;
    }

    return false;
  }

  /**
   * Affiche l'erreur à l'utilisateur via toast
   */
  private showErrorToUser(error: ApiError): void {
    const toastOptions = {
      duration: this.getToastDuration(error.severity),
      action: error.retryable ? {
        label: 'Réessayer',
        onClick: () => window.location.reload(),
      } : undefined,
    };

    switch (error.severity) {
      case 'critical':
        toast.error(`🚨 ${error.userMessage}`, {
          ...toastOptions,
          duration: 10000,
          action: {
            label: 'Contacter le support',
            onClick: () => window.open(`mailto:support@casskai.app?subject=Erreur critique&body=${  encodeURIComponent(`ID d'erreur: ${error.code}\nMessage: ${error.technicalMessage}`)}`),
          },
        });
        break;
        
      case 'high':
        toast.error(`⚠️ ${error.userMessage}`, toastOptions);
        break;
        
      case 'medium':
        toast.error(error.userMessage, toastOptions);
        break;
        
      default:
        toast.warning(error.userMessage, { duration: 3000 });
        break;
    }
  }

  /**
   * Durée du toast selon la sévérité
   */
  private getToastDuration(severity: ApiError['severity']): number {
    switch (severity) {
      case 'critical': return 10000;
      case 'high': return 8000;
      case 'medium': return 5000;
      default: return 3000;
    }
  }

  /**
   * Log de l'erreur pour le monitoring
   */
  private logError(error: ApiError, context: ErrorContext): void {
    const logLevel = this.getLogLevel(error.severity);
    const logData = {
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity,
        technicalMessage: error.technicalMessage,
        retryable: error.retryable,
      },
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: context.userId,
      companyId: context.companyId,
    };

    console[logLevel]('[ErrorHandlingService]', logData);
    
    // En production, envoyer vers un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      // Placeholder pour l'intégration avec un service comme Sentry, LogRocket, etc.
      this.sendToMonitoringService(logData);
    }
  }

  /**
   * Niveau de log selon la sévérité
   */
  private getLogLevel(severity: ApiError['severity']): 'error' | 'warn' | 'info' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      default:
        return 'info';
    }
  }

  /**
   * Report d'erreur vers un service externe
   */
  private async reportError(error: ApiError, context: ErrorContext): Promise<void> {
    try {
      // Ne reporter que les erreurs importantes
      if (error.severity === 'low') return;
      
      // Envoyer vers Supabase pour tracking interne
      await supabase.from('error_logs').insert({
        error_code: error.code,
        message: error.technicalMessage,
        severity: error.severity,
        service: context.service,
        method: context.method,
        user_id: context.userId,
        company_id: context.companyId,
        details: {
          ...(error.details as Record<string, any> || {}),
          url: window.location.href,
          userAgent: navigator.userAgent,
          additional: context.additional,
        },
        created_at: new Date().toISOString(),
      }).select().single();
      
    } catch (reportingError) {
      console.error('[ErrorHandlingService] Failed to report error:', reportingError);
    }
  }

  /**
   * Envoyer vers service de monitoring externe
   */
  private sendToMonitoringService(logData: Record<string, unknown>): void {
    // Intégration avec des services comme:
    // - Sentry
    // - LogRocket  
    // - Datadog
    // - New Relic
    // etc.
    
    // Exemple Sentry:
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).Sentry) {
      const Sentry = (window as unknown as Record<string, unknown>).Sentry as { captureException: (error: Error, options: Record<string, unknown>) => void };
      const error = logData.error as { technicalMessage: string; severity: string };
      const contextData = logData.context as { service?: string; method?: string };
      Sentry.captureException(new Error(error.technicalMessage), {
        tags: {
          severity: error.severity,
          service: contextData.service,
          method: contextData.method,
        },
        extra: logData,
      });
    }
  }

  /**
   * Utilitaire pour créer le delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instance singleton
export const errorHandler = ErrorHandlingService.getInstance();

// Hook React pour utiliser facilement le service d'erreur
export const useErrorHandler = () => {
  return {
    executeWithRetry: errorHandler.executeWithRetry.bind(errorHandler),
    supabaseCall: errorHandler.supabaseCall.bind(errorHandler),
    fetchCall: errorHandler.fetchCall.bind(errorHandler),
  };
};

// Décorateur pour wrapper automatiquement les méthodes de service
export function withErrorHandling(service: string) {
  return function (target: Record<string, unknown>, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const context: ErrorContext = {
        service,
        method: propertyName,
        // userId et companyId peuvent être récupérés depuis le contexte
      };
      
      return errorHandler.executeWithRetry(
        () => method.apply(this, args),
        context
      );
    };
  };
}

export default ErrorHandlingService;
