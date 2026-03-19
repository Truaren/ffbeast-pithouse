/**
 * Centralized application logger.
 * Errors are never suppressed. Info/warn can be silenced via setLoggingEnabled(false).
 */

let _loggingEnabled = true;

export function setLoggingEnabled(enabled: boolean) {
  _loggingEnabled = enabled;
}

export const logger = {
  log: (...args: unknown[]) => {
    if (_loggingEnabled) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (_loggingEnabled) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    // Errors are never suppressed
    console.error(...args);
  },
};
