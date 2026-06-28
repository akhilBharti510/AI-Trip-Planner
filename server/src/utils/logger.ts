/**
 * Minimal structured logger.
 *
 * Kept dependency-free and intentionally tiny. A real deployment would swap this
 * for pino/winston, but the call sites (`logger.info(...)`) stay identical, so
 * the upgrade is a one-file change.
 */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function format(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (meta === undefined) return base;
  return `${base} ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`;
}

export const logger = {
  info: (message: string, meta?: unknown) => console.log(format('info', message, meta)),
  warn: (message: string, meta?: unknown) => console.warn(format('warn', message, meta)),
  error: (message: string, meta?: unknown) => console.error(format('error', message, meta)),
  debug: (message: string, meta?: unknown) => console.debug(format('debug', message, meta)),
};
