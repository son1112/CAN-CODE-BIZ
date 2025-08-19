/**
 * Application logger utility
 * Provides structured logging with different levels and conditional output
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: string | number | boolean | string[] | null | undefined;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${level.toUpperCase()}`;
    
    if (context) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
      return `${prefix} [${contextStr}] ${message}`;
    }
    
    return `${prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, data?: unknown): void {
    // Only log in development or for errors/warnings in production
    if (!this.isDevelopment && level !== 'error' && level !== 'warn') {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage, data ? data : '');
        }
        break;
      case 'info':
        console.info(formattedMessage, data ? data : '');
        break;
      case 'warn':
        console.warn(formattedMessage, data ? data : '');
        break;
      case 'error':
        console.error(formattedMessage, data ? data : '');
        break;
    }
  }

  debug(message: string, context?: LogContext, data?: unknown): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: LogContext, data?: unknown): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: LogContext, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: LogContext, data?: unknown): void {
    this.log('error', message, context, data);
  }

  // Convenience methods for common use cases
  apiRequest(method: string, endpoint: string, userId?: string): void {
    this.info(`API ${method} ${endpoint}`, { component: 'api', userId });
  }

  apiError(method: string, endpoint: string, error: unknown, userId?: string): void {
    this.error(`API ${method} ${endpoint} failed`, { component: 'api', userId }, error);
  }

  componentMount(componentName: string, context?: LogContext): void {
    this.debug(`Component ${componentName} mounted`, { component: componentName, ...context });
  }

  componentError(componentName: string, error: unknown, context?: LogContext): void {
    this.error(`Component ${componentName} error`, { component: componentName, ...context }, error);
  }

  speechRecognition(event: string, data?: unknown): void {
    this.debug(`Speech recognition: ${event}`, { component: 'speech' }, data);
  }

  agentOperation(operation: string, agentName?: string, context?: LogContext): void {
    this.info(`Agent operation: ${operation}`, { 
      component: 'agent', 
      agent: agentName, 
      ...context 
    });
  }

  sessionOperation(operation: string, sessionId: string, context?: LogContext): void {
    this.info(`Session operation: ${operation}`, { 
      component: 'session', 
      sessionId, 
      ...context 
    });
  }

  databaseOperation(operation: string, collection: string, context?: LogContext): void {
    this.debug(`Database ${operation}`, { 
      component: 'database', 
      collection, 
      ...context 
    });
  }
}

export const logger = new Logger();
export default logger;