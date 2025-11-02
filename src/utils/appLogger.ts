/**
 * Logger centralisé pour CassKai (alternative saine)
 *
 * Utilise Sentry en production et console en développement.
 */

/* eslint-disable no-console */
import * as Sentry from '@sentry/react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogContext {
  [key: string]: unknown;
}

const config = {
  isDevelopment: import.meta.env.DEV || import.meta.env.MODE === 'development',
  isProduction: import.meta.env.PROD || import.meta.env.MODE === 'production',
  minLevel: (import.meta.env.VITE_LOG_LEVEL || 'debug') as LogLevel,
};

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const shouldLog = (level: LogLevel) => !(config.isProduction && level === 'debug') && LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
const formatMessage = (message: string, context?: LogContext) => (!context || Object.keys(context).length === 0 ? message : `${message} ${JSON.stringify(context)}`);

export const logger = {
  debug(message: string, context?: LogContext) {
    if (!shouldLog('debug')) return;
    if (config.isDevelopment) console.debug(`[DEBUG] ${formatMessage(message, context)}`);
  },
  info(message: string, context?: LogContext) {
    if (!shouldLog('info')) return;
    if (config.isDevelopment) console.info(`[INFO] ${formatMessage(message, context)}`);
    if (config.isProduction) Sentry.addBreadcrumb({ category: 'info', message, level: 'info', data: context });
  },
  warn(message: string, context?: LogContext) {
    if (!shouldLog('warn')) return;
    if (config.isDevelopment) console.warn(`[WARN] ${formatMessage(message, context)}`);
    Sentry.addBreadcrumb({ category: 'warning', message, level: 'warning', data: context });
  },
  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (!shouldLog('error')) return;
    const errorMessage = formatMessage(message, context);
    if (config.isDevelopment) console.error(`[ERROR] ${errorMessage}`, error);
    if (error instanceof Error) {
      Sentry.captureException(error, { contexts: { custom: context }, tags: { source: 'logger' }, extra: { message } });
    } else {
      Sentry.captureMessage(errorMessage, { level: 'error', contexts: { custom: context }, extra: error ? { error } : undefined });
    }
  },
  action(action: string, context?: LogContext) {
    if (config.isDevelopment) logger.info(`[ACTION] ${action}`, context);
    Sentry.addBreadcrumb({ category: 'user', message: action, level: 'info', data: context });
  },
  api(method: string, url: string, status: number, duration?: number) {
    const context: LogContext = { method, url, status, duration: duration ? `${duration}ms` : undefined };
    const message = `${method} ${url} - ${status}`;
    status >= 400 ? logger.warn(message, context) : logger.debug(message, context);
  },
  db(operation: string, table: string, context?: LogContext) {
    logger.debug(`DB ${operation} on ${table}`, context);
  },
  group(title: string) {
    if (config.isDevelopment) console.group(title);
  },
  groupEnd() {
    if (config.isDevelopment) console.groupEnd();
  },
  performance(label: string, duration: number) {
    if (config.isDevelopment) console.info(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    Sentry.addBreadcrumb({ category: 'performance', message: label, level: 'info', data: { duration: `${duration.toFixed(2)}ms` } });
  },
};

export async function measurePerformance<T>(label: string, fn: () => Promise<T> | T): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    logger.performance(label, performance.now() - start);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`${label} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

export function createLogger(baseContext: LogContext) {
  return {
    debug: (message: string, context?: LogContext) => logger.debug(message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) => logger.info(message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext) => logger.warn(message, { ...baseContext, ...context }),
    error: (message: string, error?: Error | unknown, context?: LogContext) => logger.error(message, error, { ...baseContext, ...context }),
    action: (action: string, context?: LogContext) => logger.action(action, { ...baseContext, ...context }),
    api: (method: string, url: string, status: number, duration?: number) => logger.api(method, url, status, duration),
    db: (operation: string, table: string, context?: LogContext) => logger.db(operation, table, { ...baseContext, ...context }),
    performance: (label: string, duration: number) => logger.performance(`${baseContext.module || ''} ${label}`.trim(), duration),
  };
}

export default logger;
