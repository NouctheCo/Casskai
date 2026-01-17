/**
 * CassKai Logger Service
 *
 * Provides structured logging with different levels and environment-aware output.
 * - In development: shows debug, info, warn, error
 * - In production: shows only error
 * - Can be completely disabled via VITE_DISABLE_LOGS=true
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  emoji: string;
  method: 'log' | 'info' | 'warn' | 'error';
  enabled: boolean;
}

const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';
const logsDisabled = import.meta.env.VITE_DISABLE_LOGS === 'true';

const LOG_CONFIGS: Record<LogLevel, LogConfig> = {
  debug: {
    emoji: '🔍',
    method: 'log',
    enabled: isDevelopment && !logsDisabled,
  },
  info: {
    emoji: 'ℹ️',
    method: 'info',
    enabled: isDevelopment && !logsDisabled,
  },
  warn: {
    emoji: '⚠️',
    method: 'warn',
    enabled: !logsDisabled,
  },
  error: {
    emoji: '❌',
    method: 'error',
    enabled: !logsDisabled,
  },
};

/**
 * Formats a timestamp for log output
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
}

/**
 * Core logging function
 */
function log(
  level: LogLevel,
  context: string,
  message: string,
  data?: unknown
): void {
  const config = LOG_CONFIGS[level];

  if (!config.enabled) {
    return;
  }

  const timestamp = getTimestamp();
  const prefix = `${config.emoji} [${timestamp}] [${context}]`;

  if (data !== undefined) {
    console[config.method](prefix, message, data);
  } else {
    console[config.method](prefix, message);
  }
}

type LoggerCallArgs =
  | [string]
  | [string, unknown]
  | [string, string]
  | [string, string, unknown]
  | [string, string, unknown, ...unknown[]]
  | [string, unknown, ...unknown[]];

function normalizeLoggerArgs(args: LoggerCallArgs): { context: string; message: string; data?: unknown } {
  const DEFAULT_CONTEXT = 'App';

  const [a, b, c, ...rest] = args as unknown[];
  const first = typeof a === 'string' ? a : DEFAULT_CONTEXT;

  // logger.info('message')
  if (args.length === 1) {
    return { context: DEFAULT_CONTEXT, message: first };
  }

  // 2+ args
  if (typeof b === 'string') {
    // logger.info('Context', 'message', data?, ...)
    const data = args.length >= 3 ? c : undefined;
    const packed = rest.length > 0 ? { data, extra: rest } : data;
    return { context: first, message: b, data: packed };
  }

  // logger.info('message', data, ...)
  const packed = rest.length > 0 ? { data: b, extra: rest } : b;
  return { context: DEFAULT_CONTEXT, message: first, data: packed };
}

/**
 * CassKai Logger
 *
 * @example
 * logger.debug('AuthContext', 'Checking session...')
 * logger.info('Onboarding', 'Step completed', { step: 2 })
 * logger.warn('API', 'Rate limit approaching')
 * logger.error('Supabase', 'Query failed', error)
 */
export const logger = {
  /**
   * Debug logs - only shown in development
   */
  debug: (...args: LoggerCallArgs) => {
    const { context, message, data } = normalizeLoggerArgs(args);
    log('debug', context, message, data);
  },

  /**
   * Info logs - only shown in development
   */
  info: (...args: LoggerCallArgs) => {
    const { context, message, data } = normalizeLoggerArgs(args);
    log('info', context, message, data);
  },

  /**
   * Warning logs - shown in all environments
   */
  warn: (...args: LoggerCallArgs) => {
    const { context, message, data } = normalizeLoggerArgs(args);
    log('warn', context, message, data);
  },

  /**
   * Error logs - shown in all environments
   */
  error: (...args: LoggerCallArgs) => {
    const { context, message, data } = normalizeLoggerArgs(args);
    log('error', context, message, data);
  },

  /**
   * Check if logging is enabled for a specific level
   */
  isEnabled: (level: LogLevel): boolean => {
    return LOG_CONFIGS[level].enabled;
  },

  /**
   * Get current environment info
   */
  getEnvironment: () => ({
    mode: import.meta.env.MODE,
    isDevelopment,
    isProduction,
    logsDisabled,
  }),
};

export default logger;
