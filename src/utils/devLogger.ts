// Development Logger - Only logs in development mode
// Use this instead of console.log to satisfy ESLint rules
import { logger } from '@/lib/logger';

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';
class DevLogger {
  private isDev = import.meta.env.DEV;
  private log(level: LogLevel, ...args: unknown[]) {
    if (!this.isDev) return;
    console[level](...args);
  }
  debug(...args: unknown[]) {
    this.log('debug', ...args);
  }
  info(...args: unknown[]) {
    this.log('info', ...args);
  }
  warn(...args: unknown[]) {
    this.log('warn', ...args);
  }
  error(...args: unknown[]) {
    // Always log errors, even in production
    logger.error('DevLogger', 'Error occurred', ...args);
  }
  // Alias for console.log but dev-only
  devLog(...args: unknown[]) {
    this.log('log', ...args);
  }
}
// Export singleton instance
export const devLogger = new DevLogger();
// Convenience exports
export const { debug, info, warn, error, devLog } = devLogger;