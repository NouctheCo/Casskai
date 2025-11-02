

// Clean shim: re-export from healthy implementation to avoid parsing errors from this file
export { logger, measurePerformance, createLogger } from './appLogger';
export { logger as default } from './appLogger';
