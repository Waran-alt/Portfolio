/**
 * Logger Utility
 * 
 * Provides centralized logging functionality for debug information and error handling.
 * Supports different log levels and can be configured based on environment.
 * 
 * Features:
 * - Different log levels (debug, info, warn, error)
 * - Environment-based logging (only logs in development)
 * - Structured logging with timestamps
 * - Performance monitoring integration
 * - Error tracking and reporting
 */

import { env } from '@/shared/config/app-config';

/**
 * Log levels for different types of messages
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  /** Minimum log level to display */
  minLevel: LogLevel;
  /** Whether to include timestamps */
  includeTimestamps: boolean;
  /** Whether to include performance data */
  includePerformance: boolean;
  /** Custom prefix for log messages */
  prefix?: string;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: env.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN,
  includeTimestamps: true,
  includePerformance: env.isDevelopment
};

/**
 * Logger class for centralized logging
 */
class Logger {
  private config: LoggerConfig;
  private prefix: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.prefix = config.prefix || '[Portfolio]';
  }

  /**
   * Format timestamp for logging
   */
  private formatTimestamp(): string {
    if (!this.config.includeTimestamps) return '';
    return `[${new Date().toISOString()}] `;
  }

  /**
   * Format performance data if available
   */
  private formatPerformance(): string {
    if (!this.config.includePerformance || typeof window === 'undefined') return '';
    
    const performance = window.performance;
    if (!performance) return '';
    
    const memory = (performance as any).memory;
    if (memory) {
      return ` | Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB/${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`;
    }
    
    return '';
  }

  /**
   * Log a message with the specified level
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.config.minLevel) return;

    const timestamp = this.formatTimestamp();
    const performance = this.formatPerformance();
    const logMessage = `${timestamp}${this.prefix} ${message}${performance}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(logMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(logMessage, data || '');
        break;
      case LogLevel.ERROR:
        console.error(logMessage, data || '');
        break;
    }
  }

  /**
   * Log debug information
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, `[DEBUG] ${message}`, data);
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, `[INFO] ${message}`, data);
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, `[WARN] ${message}`, data);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | any): void {
    this.log(LogLevel.ERROR, `[ERROR] ${message}`, error);
    
    // In production, you might want to send errors to a monitoring service
    if (env.isProduction && error) {
      // Example: sendToErrorTrackingService(error);
    }
  }

  /**
   * Log animation-specific debug information
   */
  animation(animationName: string, action: string, data?: any): void {
    this.debug(`Animation [${animationName}] ${action}`, data);
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, value: number, unit: string = 'ms'): void {
    this.debug(`Performance [${metric}]: ${value}${unit}`);
  }

  /**
   * Log component lifecycle events
   */
  component(componentName: string, lifecycle: 'mount' | 'update' | 'unmount', data?: any): void {
    this.debug(`Component [${componentName}] ${lifecycle}`, data);
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger with a specific prefix
 */
export function createLogger(prefix: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger({ ...config, prefix: `[${prefix}]` });
}

/**
 * Animation-specific logger
 */
export const animationLogger = createLogger('Animation');

/**
 * Performance-specific logger
 */
export const performanceLogger = createLogger('Performance');

/**
 * Component-specific logger
 */
export const componentLogger = createLogger('Component'); 