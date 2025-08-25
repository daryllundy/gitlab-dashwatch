// Centralized logging utilities
import { API_CONSTANTS } from '@/constants';

import { LogLevel, type LogEntry } from '@/types';

class Logger {
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = API_CONSTANTS.MAX_LOG_ENTRIES;

  constructor() {
    // Set log level based on environment
    if (import.meta.env.DEV) {
      this.logLevel = LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private addLog(level: LogLevel, message: string, context?: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data,
    };

    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    const timestamp = entry.timestamp.toISOString();
    const contextStr = context ? `[${context}] ` : '';
    const logMessage = `[${timestamp}] ${contextStr}${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, data);
        break;
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    this.addLog(LogLevel.ERROR, message, context, data);
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton logger instance
export const logger = new Logger();

// Convenience functions
export const debug = (message: string, context?: string, data?: unknown) => 
  logger.debug(message, context, data);

export const info = (message: string, context?: string, data?: unknown) => 
  logger.info(message, context, data);

export const warn = (message: string, context?: string, data?: unknown) => 
  logger.warn(message, context, data);

export const error = (message: string, context?: string, data?: unknown) => 
  logger.error(message, context, data);
