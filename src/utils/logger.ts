/**
 * Logger centralisé pour CassKai
 *
 * Utilise Sentry pour le logging en production et console en développement
 * Remplace tous les console.log/warn/error dispersés dans le code
 */

/* eslint-disable no-console */
// Le logger est le seul endroit autorisé à utiliser console.*

import * as Sentry from '@sentry/react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Configuration du logger
 */
const config = {
  // Environnement actuel
  isDevelopment: import.meta.env.DEV || import.meta.env.MODE === 'development',
  isProduction: import.meta.env.PROD || import.meta.env.MODE === 'production',

  // Niveau de log minimum en développement
  minLevel: (import.meta.env.VITE_LOG_LEVEL || 'debug') as LogLevel,
};

/**
 * Niveaux de priorité des logs
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Vérifie si un niveau de log doit être affiché
 */
function shouldLog(level: LogLevel): boolean {
  if (config.isProduction && level === 'debug') {
    return false; // Pas de debug en production
  }

  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

/**
 * Formate un message de log avec contexte
 */
function formatMessage(message: string, context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) {
    return message;
  }

  return `${message} ${JSON.stringify(context)}`;
}

/**
 * Logger principal
 */
export const logger = {
  /**
   * Log de debug (développement uniquement)
   * @param message Message à logger
   * @param context Contexte additionnel
   */
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return;

    if (config.isDevelopment) {
      console.debug(`[DEBUG] ${formatMessage(message, context)}`);
    }
  },

  /**
   * Log d'information
   * @param message Message à logger
   * @param context Contexte additionnel
   */
  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return;

    if (config.isDevelopment) {
      console.info(`[INFO] ${formatMessage(message, context)}`);
    }

    if (config.isProduction) {
      Sentry.addBreadcrumb({
        category: 'info',
        message,
        level: 'info',
        data: context,
      });
    }
  },

  /**
   * Log d'avertissement
   * @param message Message à logger
   * @param context Contexte additionnel
   */
  warn(message: string, context?: LogContext): void {
    if (!shouldLog('warn')) return;

    if (config.isDevelopment) {
      console.warn(`[WARN] ${formatMessage(message, context)}`);
    }

    Sentry.addBreadcrumb({
      category: 'warning',
      message,
      level: 'warning',
      data: context,
    });
  },

  /**
   * Log d'erreur
   * @param message Message d'erreur
   * @param error Objet erreur (optionnel)
   * @param context Contexte additionnel
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!shouldLog('error')) return;

    const errorMessage = formatMessage(message, context);

    if (config.isDevelopment) {
      console.error(`[ERROR] ${errorMessage}`, error);
    }

    // Toujours envoyer les erreurs à Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, {
        contexts: {
          custom: context,
        },
        tags: {
          source: 'logger',
        },
        extra: {
          message,
        },
      });
    } else {
      Sentry.captureMessage(errorMessage, {
        level: 'error',
        contexts: {
          custom: context,
        },
        extra: error ? { error } : undefined,
      });
    }
  },

  /**
   * Log d'une action utilisateur (pour analytics)
   * @param action Nom de l'action
   * @param context Contexte de l'action
   */
  action(action: string, context?: LogContext): void {
    if (config.isDevelopment) {
      logger.info(`[ACTION] ${action}`, context)
    }

    Sentry.addBreadcrumb({
      category: 'user',
      message: action,
      level: 'info',
      data: context,
    });
  },

  /**
   * Log d'une requête API
   * @param method Méthode HTTP
   * @param url URL de la requête
   * @param status Code de statut HTTP
   * @param duration Durée en ms (optionnel)
   */
  api(method: string, url: string, status: number, duration?: number): void {
    const context: LogContext = {
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : undefined,
    };

    const message = `${method} ${url} - ${status}`;

    if (status >= 400) {
      this.warn(message, context);
    } else {
      this.debug(message, context);
    }
  },

  /**
   * Log d'une opération de base de données
   * @param operation Type d'opération (SELECT, INSERT, etc.)
   * @param table Table concernée
   * @param context Contexte additionnel
   */
  db(operation: string, table: string, context?: LogContext): void {
    this.debug(`DB ${operation} on ${table}`, context);
  },

  /**
   * Groupe de logs (pour organiser les logs liés)
   * Uniquement en développement
   */
  group(title: string): void {
    if (config.isDevelopment) {
      console.group(title);
    }
  },

  /**
   * Fin du groupe de logs
   */
  groupEnd(): void {
    if (config.isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Log d'une mesure de performance
   * @param label Label de la mesure
   * @param duration Durée en ms
   */
  performance(label: string, duration: number): void {
    if (config.isDevelopment) {
      console.info(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }

    Sentry.addBreadcrumb({
      category: 'performance',
      message: label,
      level: 'info',
      data: { duration: `${duration.toFixed(2)}ms` },
    });
  },
};

/**
 * Utilitaire pour mesurer le temps d'exécution d'une fonction
 * @param label Label de la mesure
 * @param fn Fonction à exécuter
 */
export async function measurePerformance<T>(
  label: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.performance(label, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`${label} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Création d'un logger avec contexte pré-défini
 * Utile pour logger dans un module spécifique
 *
 * @example
 * const moduleLogger = createLogger({ module: 'AuthService' });
 * moduleLogger.info('User logged in', { userId: '123' });
 * // Log: [INFO] User logged in { module: 'AuthService', userId: '123' }
 */
export function createLogger(baseContext: LogContext) {
  return {
    debug: (message: string, context?: LogContext) =>
      logger.debug(message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) =>
      logger.info(message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logger.warn(message, { ...baseContext, ...context }),
    error: (message: string, error?: Error | unknown, context?: LogContext) =>
      logger.error(message, error, { ...baseContext, ...context }),
    action: (action: string, context?: LogContext) =>
      logger.action(action, { ...baseContext, ...context }),
    api: (method: string, url: string, status: number, duration?: number) =>
      logger.api(method, url, status, duration),
    db: (operation: string, table: string, context?: LogContext) =>
      logger.db(operation, table, { ...baseContext, ...context }),
    performance: (label: string, duration: number) =>
      logger.performance(`${baseContext.module || ''} ${label}`.trim(), duration),
  };
}

// Export par défaut
export default logger;
