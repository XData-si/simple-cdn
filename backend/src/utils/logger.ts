import type { LogContext } from '../types';
import { loadConfig } from '../config';

const config = loadConfig();

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: number;

  constructor(level: LogLevel = 'info') {
    this.minLevel = LOG_LEVELS[level] || LOG_LEVELS.info;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }
}

export const logger = new Logger(config.logLevel);
