/**
 * Centralised logging service for the application.
 * Provides environment-aware logging with different log levels.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment: boolean;
  private currentLevel: LogLevel;

  constructor () {
    this.isDevelopment = import.meta.env.DEV === true;
    this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  /**
   * Format a timestamp for log output.
   */
  private formatTimestamp (): string {
    return new Date().toISOString();
  }

  /**
   * Format the log message with timestamp and level.
   */
  private formatMessage (level: string, message: string): string {
    return `[${this.formatTimestamp()}] [${level}] ${message}`;
  }

  /**
   * Core logging method.
   */
  private log (level: LogLevel, levelName: string, message: string, context?: LogContext): void {
    if (level < this.currentLevel) {
      return;
    }

    const formattedMessage = this.formatMessage(levelName, message);

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        if (this.isDevelopment) {
          if (context && Object.keys(context).length > 0) {
            // eslint-disable-next-line no-console
            console.log(formattedMessage, context);
          } else {
            // eslint-disable-next-line no-console
            console.log(formattedMessage);
          }
        }
        break;
      case LogLevel.WARN:
        if (context && Object.keys(context).length > 0) {
          // eslint-disable-next-line no-console
          console.warn(formattedMessage, context);
        } else {
          // eslint-disable-next-line no-console
          console.warn(formattedMessage);
        }
        break;
      case LogLevel.ERROR:
        if (context && Object.keys(context).length > 0) {
          // eslint-disable-next-line no-console
          console.error(formattedMessage, context);
        } else {
          // eslint-disable-next-line no-console
          console.error(formattedMessage);
        }
        break;
    }
  }

  /**
   * Debug level logging - only shown in development.
   */
  debug (message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, context);
  }

  /**
   * Info level logging - only shown in development.
   */
  info (message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, 'INFO', message, context);
  }

  /**
   * Warning level logging - shown in development and production.
   */
  warn (message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, 'WARN', message, context);
  }

  /**
   * Error level logging - shown in development and production.
   */
  error (message: string, context?: LogContext | Error | unknown): void {
    let logContext: LogContext | undefined;

    if (context instanceof Error) {
      logContext = {
        errorMessage: context.message,
        errorStack: context.stack,
        errorName: context.name,
      };
    } else if (context) {
      logContext = context as LogContext;
    }

    this.log(LogLevel.ERROR, 'ERROR', message, logContext);
  }

  /**
   * Log an error with additional context.
   */
  logError (error: unknown, message: string, additionalContext?: LogContext): void {
    let errorDetails: LogContext = {};

    if (error instanceof Error) {
      errorDetails = {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
      };
    } else if (error && typeof error === 'object') {
      errorDetails = { error };
    } else {
      errorDetails = { error: String(error) };
    }

    const fullContext = {
      ...errorDetails,
      ...additionalContext,
    };

    this.error(message, fullContext);
  }
}

// Export a singleton instance.
export const logger = new Logger();
