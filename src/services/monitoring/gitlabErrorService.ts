// GitLab Comprehensive Error Handling and Recovery Service
// Provides advanced error handling, recovery mechanisms, and user-friendly error management

import { logger } from '@/lib/logger';

// Error handling configuration
interface ErrorConfig {
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number; // failures before opening circuit
  circuitBreakerTimeout: number; // seconds to wait before retrying
  enableRetryLogic: boolean;
  maxRetryAttempts: number;
  baseRetryDelay: number; // seconds
  maxRetryDelay: number; // seconds
  enableErrorAnalytics: boolean;
  enableUserNotifications: boolean;
  enableGracefulDegradation: boolean;
  errorReportingEnabled: boolean;
}

interface ErrorContext {
  service: string;
  operation: string;
  instanceId?: string;
  projectId?: number;
  userId?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  requestId?: string;
  correlationId?: string;
}

interface ErrorRecovery {
  strategy: 'retry' | 'fallback' | 'circuit_breaker' | 'graceful_degradation';
  delay?: number;
  maxAttempts?: number;
  fallbackData?: any;
  circuitBreakerState?: 'closed' | 'open' | 'half_open';
  lastFailureTime?: Date;
  failureCount: number;
}

interface ServiceError {
  id: string;
  type: ErrorType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  context: ErrorContext;
  recovery: ErrorRecovery;
  stackTrace?: string;
  userMessage: string;
  suggestedActions: string[];
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
}

enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

interface CircuitBreaker {
  service: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  lastFailureTime: Date;
  nextRetryTime: Date;
}

interface ErrorAnalytics {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsByService: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorTrends: Array<{ date: string; count: number }>;
  topErrorMessages: Array<{ message: string; count: number }>;
  averageResolutionTime: number;
  errorRecoveryRate: number;
}

class GitlabErrorService {
  private config: ErrorConfig;
  private errors: Map<string, ServiceError> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private errorAnalytics: ErrorAnalytics;
  private recoveryStrategies: Map<string, ErrorRecovery> = new Map();
  private isDestroyed = false;

  constructor(config: Partial<ErrorConfig> = {}) {
    this.config = {
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60, // 1 minute
      enableRetryLogic: true,
      maxRetryAttempts: 3,
      baseRetryDelay: 1,
      maxRetryDelay: 30,
      enableErrorAnalytics: true,
      enableUserNotifications: true,
      enableGracefulDegradation: true,
      errorReportingEnabled: true,
      ...config,
    };

    this.errorAnalytics = {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsByService: {},
      errorsBySeverity: {},
      errorTrends: [],
      topErrorMessages: [],
      averageResolutionTime: 0,
      errorRecoveryRate: 0,
    };

    this.initializeDefaultRecoveryStrategies();
  }

  /**
   * Handle and categorize an error
   */
  async handleError(
    error: unknown,
    context: ErrorContext,
    options: {
      notifyUser?: boolean;
      enableRetry?: boolean;
      customRecovery?: Partial<ErrorRecovery>;
    } = {}
  ): Promise<{
    error: ServiceError;
    shouldRetry: boolean;
    retryDelay?: number | undefined;
    fallbackData?: any;
  }> {
    const { notifyUser = true, enableRetry = true, customRecovery } = options;

    // Categorize the error
    const categorizedError = this.categorizeError(error, context);

    // Create service error object
    const serviceError: ServiceError = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...categorizedError,
      context,
      timestamp: new Date(),
      resolved: false,
    };

    // Store the error
    this.errors.set(serviceError.id, serviceError);

    // Update analytics
    if (this.config.enableErrorAnalytics) {
      this.updateErrorAnalytics(serviceError);
    }

    // Determine recovery strategy
    const recovery = customRecovery
      ? { ...this.getDefaultRecoveryStrategy(serviceError.type), ...customRecovery }
      : this.getDefaultRecoveryStrategy(serviceError.type);

    serviceError.recovery = recovery;

    // Check circuit breaker
    if (this.config.enableCircuitBreaker) {
      const circuitBreaker = this.getCircuitBreaker(context.service);
      if (circuitBreaker.state === 'open') {
        serviceError.recovery.strategy = 'circuit_breaker';
        serviceError.userMessage = 'Service is temporarily unavailable. Please try again later.';
      }
    }

    // Update circuit breaker state
    this.updateCircuitBreaker(context.service, serviceError);

    // Determine if we should retry
    const shouldRetry = enableRetry && this.shouldRetry(serviceError);
    const retryDelay = shouldRetry ? this.calculateRetryDelay(serviceError) : undefined;

    // Get fallback data if applicable
    const fallbackData = this.getFallbackData(serviceError);

    // Notify user if enabled
    if (notifyUser && this.config.enableUserNotifications) {
      this.notifyUser(serviceError);
    }

    // Log the error
    this.logError(serviceError);

    logger.error(`Error handled: ${serviceError.type}`, 'GitlabErrorService', {
      errorId: serviceError.id,
      service: context.service,
      operation: context.operation,
      shouldRetry,
      retryDelay,
    });

    return {
      error: serviceError,
      shouldRetry,
      retryDelay,
      fallbackData,
    };
  }

  /**
   * Categorize an error based on its type and content
   */
  private categorizeError(error: unknown, context: ErrorContext): Omit<ServiceError, 'id' | 'context' | 'recovery' | 'timestamp' | 'resolved'> {
    let type: ErrorType;
    let severity: 'low' | 'medium' | 'high' | 'critical';
    let message: string;
    let details: string;
    let userMessage: string;
    let suggestedActions: string[];
    let stackTrace: string | undefined;

    // Extract stack trace if available
    if (error instanceof Error) {
      stackTrace = error.stack;
    }

    // Categorize based on error type and content
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Network errors
      if (errorMessage.includes('network') || errorMessage.includes('connection') ||
          errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
        if (errorMessage.includes('timeout')) {
          type = ErrorType.TIMEOUT_ERROR;
          severity = 'medium';
          message = 'Request timeout';
          details = `Request to ${context.service} timed out`;
          userMessage = 'The request took too long to complete. Please try again.';
          suggestedActions = ['Retry the request', 'Check your internet connection', 'Try again later'];
        } else {
          type = ErrorType.NETWORK_ERROR;
          severity = 'high';
          message = 'Network connection error';
          details = `Failed to connect to ${context.service}`;
          userMessage = 'Unable to connect to the service. Please check your internet connection.';
          suggestedActions = ['Check your internet connection', 'Try again later', 'Contact support if the problem persists'];
        }
      }
      // Authentication errors
      else if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication') ||
               errorMessage.includes('token') || errorMessage.includes('401')) {
        type = ErrorType.AUTHENTICATION_ERROR;
        severity = 'high';
        message = 'Authentication failed';
        details = `Authentication failed for ${context.service}`;
        userMessage = 'Your authentication has expired or is invalid. Please re-authenticate.';
        suggestedActions = ['Re-authenticate with the service', 'Check your credentials', 'Update your access token'];
      }
      // Authorization errors
      else if (errorMessage.includes('forbidden') || errorMessage.includes('permission') ||
               errorMessage.includes('403')) {
        type = ErrorType.AUTHORIZATION_ERROR;
        severity = 'high';
        message = 'Access denied';
        details = `Insufficient permissions for ${context.operation}`;
        userMessage = 'You do not have permission to perform this action.';
        suggestedActions = ['Check your permissions', 'Contact your administrator', 'Try a different action'];
      }
      // Rate limiting
      else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        type = ErrorType.RATE_LIMIT_ERROR;
        severity = 'medium';
        message = 'Rate limit exceeded';
        details = `API rate limit exceeded for ${context.service}`;
        userMessage = 'Too many requests. Please wait before trying again.';
        suggestedActions = ['Wait a few minutes before retrying', 'Reduce request frequency', 'Upgrade your plan for higher limits'];
      }
      // API errors
      else if (errorMessage.includes('api') || errorMessage.includes('500') ||
               errorMessage.includes('502') || errorMessage.includes('503') ||
               errorMessage.includes('504')) {
        type = ErrorType.API_ERROR;
        severity = 'high';
        message = 'API error';
        details = `API error from ${context.service}: ${error.message}`;
        userMessage = 'The service is experiencing issues. Please try again later.';
        suggestedActions = ['Try again later', 'Check service status', 'Contact support if the problem persists'];
      }
      // Validation errors
      else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        type = ErrorType.VALIDATION_ERROR;
        severity = 'low';
        message = 'Validation error';
        details = `Invalid data provided: ${error.message}`;
        userMessage = 'Please check your input and try again.';
        suggestedActions = ['Review your input data', 'Check required fields', 'Follow the correct format'];
      }
      // Parsing errors
      else if (errorMessage.includes('parse') || errorMessage.includes('json') ||
               errorMessage.includes('syntax')) {
        type = ErrorType.PARSING_ERROR;
        severity = 'medium';
        message = 'Data parsing error';
        details = `Failed to parse response from ${context.service}`;
        userMessage = 'There was an issue processing the response. Please try again.';
        suggestedActions = ['Try again', 'Refresh the page', 'Clear cache and try again'];
      }
      // Cache errors
      else if (errorMessage.includes('cache')) {
        type = ErrorType.CACHE_ERROR;
        severity = 'low';
        message = 'Cache error';
        details = `Cache operation failed: ${error.message}`;
        userMessage = 'There was a caching issue. The operation will continue without cache.';
        suggestedActions = ['Continue normally', 'Clear cache if issues persist'];
      }
      // Storage errors
      else if (errorMessage.includes('storage') || errorMessage.includes('localStorage') ||
               errorMessage.includes('indexeddb')) {
        type = ErrorType.STORAGE_ERROR;
        severity = 'medium';
        message = 'Storage error';
        details = `Storage operation failed: ${error.message}`;
        userMessage = 'Unable to save data locally. Some features may not work properly.';
        suggestedActions = ['Clear browser storage', 'Try in incognito mode', 'Check available storage space'];
      }
      // Configuration errors
      else if (errorMessage.includes('config')) {
        type = ErrorType.CONFIGURATION_ERROR;
        severity = 'high';
        message = 'Configuration error';
        details = `Configuration issue: ${error.message}`;
        userMessage = 'There is a configuration problem. Please contact support.';
        suggestedActions = ['Contact support', 'Check configuration settings'];
      }
      // Service unavailable
      else if (errorMessage.includes('unavailable') || errorMessage.includes('maintenance')) {
        type = ErrorType.SERVICE_UNAVAILABLE;
        severity = 'high';
        message = 'Service unavailable';
        details = `${context.service} is currently unavailable`;
        userMessage = 'The service is temporarily unavailable. Please try again later.';
        suggestedActions = ['Try again later', 'Check service status page'];
      }
      // Default to unknown error
      else {
        type = ErrorType.UNKNOWN_ERROR;
        severity = 'medium';
        message = 'Unknown error';
        details = `Unexpected error: ${error.message}`;
        userMessage = 'An unexpected error occurred. Please try again.';
        suggestedActions = ['Try again', 'Refresh the page', 'Contact support if the problem persists'];
      }
    } else {
      // Handle non-Error objects
      type = ErrorType.UNKNOWN_ERROR;
      severity = 'medium';
      message = 'Unknown error';
      details = `Unexpected error type: ${typeof error}`;
      userMessage = 'An unexpected error occurred. Please try again.';
      suggestedActions = ['Try again', 'Refresh the page', 'Contact support'];
    }

    return {
      type,
      severity,
      message,
      details,
      userMessage,
      suggestedActions,
      stackTrace,
    };
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeDefaultRecoveryStrategies(): void {
    // Network errors - retry with exponential backoff
    this.recoveryStrategies.set(ErrorType.NETWORK_ERROR, {
      strategy: 'retry',
      maxAttempts: 3,
      failureCount: 0,
    });

    // Authentication errors - no retry, user action required
    this.recoveryStrategies.set(ErrorType.AUTHENTICATION_ERROR, {
      strategy: 'fallback',
      failureCount: 0,
    });

    // Rate limit errors - retry with delay
    this.recoveryStrategies.set(ErrorType.RATE_LIMIT_ERROR, {
      strategy: 'retry',
      delay: 60, // 1 minute
      maxAttempts: 1,
      failureCount: 0,
    });

    // API errors - retry with backoff
    this.recoveryStrategies.set(ErrorType.API_ERROR, {
      strategy: 'retry',
      maxAttempts: 2,
      failureCount: 0,
    });

    // Timeout errors - retry immediately
    this.recoveryStrategies.set(ErrorType.TIMEOUT_ERROR, {
      strategy: 'retry',
      maxAttempts: 2,
      failureCount: 0,
    });

    // Validation errors - no retry
    this.recoveryStrategies.set(ErrorType.VALIDATION_ERROR, {
      strategy: 'fallback',
      failureCount: 0,
    });

    // Default strategy
    this.recoveryStrategies.set('default', {
      strategy: 'retry',
      maxAttempts: 1,
      failureCount: 0,
    });
  }

  /**
   * Get default recovery strategy for an error type
   */
  private getDefaultRecoveryStrategy(errorType: ErrorType): ErrorRecovery {
    return this.recoveryStrategies.get(errorType) ||
           this.recoveryStrategies.get('default')!;
  }

  /**
   * Determine if an error should be retried
   */
  private shouldRetry(error: ServiceError): boolean {
    if (!this.config.enableRetryLogic) return false;

    const recovery = error.recovery;

    // Don't retry certain error types
    if ([ErrorType.AUTHENTICATION_ERROR, ErrorType.AUTHORIZATION_ERROR,
         ErrorType.VALIDATION_ERROR].includes(error.type)) {
      return false;
    }

    // Check retry attempts
    if (recovery.maxAttempts && recovery.failureCount >= recovery.maxAttempts) {
      return false;
    }

    // Check circuit breaker
    if (recovery.strategy === 'circuit_breaker') {
      return false;
    }

    return true;
  }

  /**
   * Calculate retry delay using exponential backoff
   */
  private calculateRetryDelay(error: ServiceError): number {
    const attempt = error.recovery.failureCount;
    const baseDelay = this.config.baseRetryDelay;
    const maxDelay = this.config.maxRetryDelay;

    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const delay = Math.min(exponentialDelay + jitter, maxDelay);

    return delay;
  }

  /**
   * Get fallback data for graceful degradation
   */
  private getFallbackData(error: ServiceError): any {
    if (!this.config.enableGracefulDegradation) return null;

    // Provide fallback data based on error type and context
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT_ERROR:
        // Return cached data if available
        return this.getCachedFallbackData(error.context);
      case ErrorType.API_ERROR:
        // Return partial data or default values
        return this.getDefaultFallbackData(error.context);
      default:
        return null;
    }
  }

  /**
   * Get cached fallback data
   */
  private getCachedFallbackData(context: ErrorContext): any {
    // This would integrate with the cache service to retrieve stale data
    // For now, return null
    return null;
  }

  /**
   * Get default fallback data
   */
  private getDefaultFallbackData(context: ErrorContext): any {
    // Provide default data based on the operation
    switch (context.operation) {
      case 'getProjects':
        return { projects: [], totalCount: 0 };
      case 'getProject':
        return null;
      case 'getUser':
        return null;
      default:
        return null;
    }
  }

  /**
   * Get or create circuit breaker for a service
   */
  private getCircuitBreaker(service: string): CircuitBreaker {
    if (!this.circuitBreakers.has(service)) {
      this.circuitBreakers.set(service, {
        service,
        state: 'closed',
        failureCount: 0,
        lastFailureTime: new Date(0),
        nextRetryTime: new Date(0),
      });
    }

    return this.circuitBreakers.get(service)!;
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(service: string, error: ServiceError): void {
    const circuitBreaker = this.getCircuitBreaker(service);

    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = new Date();

    // Check if we should open the circuit
    if (circuitBreaker.state === 'closed' &&
        circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
      circuitBreaker.state = 'open';
      circuitBreaker.nextRetryTime = new Date(Date.now() + this.config.circuitBreakerTimeout * 1000);

      logger.warn(`Circuit breaker opened for service: ${service}`, 'GitlabErrorService', {
        failureCount: circuitBreaker.failureCount,
        nextRetryTime: circuitBreaker.nextRetryTime,
      });
    }

    // Check if we should attempt to close the circuit (half-open)
    else if (circuitBreaker.state === 'open' &&
             new Date() >= circuitBreaker.nextRetryTime) {
      circuitBreaker.state = 'half_open';
      circuitBreaker.failureCount = 0; // Reset for half-open state

      logger.info(`Circuit breaker half-open for service: ${service}`, 'GitlabErrorService');
    }
  }

  /**
   * Check if circuit breaker allows requests
   */
  isCircuitBreakerOpen(service: string): boolean {
    const circuitBreaker = this.getCircuitBreaker(service);
    return circuitBreaker.state === 'open';
  }

  /**
   * Notify user about an error
   */
  private notifyUser(error: ServiceError): void {
    // This would integrate with the app's notification system
    logger.info(`User notification: ${error.userMessage}`, 'GitlabErrorService', {
      errorId: error.id,
      severity: error.severity,
      suggestedActions: error.suggestedActions,
    });
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: ServiceError): void {
    const logData = {
      errorId: error.id,
      type: error.type,
      severity: error.severity,
      service: error.context.service,
      operation: error.context.operation,
      instanceId: error.context.instanceId,
      projectId: error.context.projectId,
      message: error.message,
      details: error.details,
      stackTrace: error.stackTrace,
    };

    switch (error.severity) {
      case 'critical':
        logger.error(`Critical error: ${error.message}`, 'GitlabErrorService', logData);
        break;
      case 'high':
        logger.error(`High severity error: ${error.message}`, 'GitlabErrorService', logData);
        break;
      case 'medium':
        logger.warn(`Medium severity error: ${error.message}`, 'GitlabErrorService', logData);
        break;
      case 'low':
        logger.info(`Low severity error: ${error.message}`, 'GitlabErrorService', logData);
        break;
    }
  }

  /**
   * Update error analytics
   */
  private updateErrorAnalytics(error: ServiceError): void {
    this.errorAnalytics.totalErrors++;

    // Update error counts by type
    this.errorAnalytics.errorsByType[error.type] =
      (this.errorAnalytics.errorsByType[error.type] || 0) + 1;

    // Update error counts by service
    this.errorAnalytics.errorsByService[error.context.service] =
      (this.errorAnalytics.errorsByService[error.context.service] || 0) + 1;

    // Update error counts by severity
    this.errorAnalytics.errorsBySeverity[error.severity] =
      (this.errorAnalytics.errorsBySeverity[error.severity] || 0) + 1;

    // Update top error messages
    const existingMessage = this.errorAnalytics.topErrorMessages
      .find(msg => msg.message === error.message);

    if (existingMessage) {
      existingMessage.count++;
    } else {
      this.errorAnalytics.topErrorMessages.push({
        message: error.message,
        count: 1,
      });
    }

    // Keep only top 10
    this.errorAnalytics.topErrorMessages = this.errorAnalytics.topErrorMessages
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Update error trends (daily)
    const today = new Date().toISOString().split('T')[0];
    const todayTrend = this.errorAnalytics.errorTrends.find(t => t.date === today);
    if (todayTrend) {
      todayTrend.count++;
    } else {
      this.errorAnalytics.errorTrends.push({ date: today, count: 1 });
    }

    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.errorAnalytics.errorTrends = this.errorAnalytics.errorTrends
      .filter(t => new Date(t.date) >= thirtyDaysAgo);
  }

  /**
   * Mark an error as resolved
   */
  resolveError(errorId: string, resolution?: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date();
      error.resolution = resolution;

      // Update recovery rate
      const resolvedErrors = Array.from(this.errors.values())
        .filter(e => e.resolved).length;
      this.errorAnalytics.errorRecoveryRate = resolvedErrors / this.errorAnalytics.totalErrors;

      // Update average resolution time
      if (error.resolvedAt) {
        const resolutionTime = error.resolvedAt.getTime() - error.timestamp.getTime();
        const totalResolutionTime = this.errorAnalytics.averageResolutionTime *
          (this.errorAnalytics.totalErrors - 1) + resolutionTime;
        this.errorAnalytics.averageResolutionTime = totalResolutionTime / this.errorAnalytics.totalErrors;
      }

      logger.info(`Error resolved: ${errorId}`, 'GitlabErrorService', {
        resolution,
        resolutionTime: error.resolvedAt ? error.resolvedAt.getTime() - error.timestamp.getTime() : undefined,
      });
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    unresolvedErrors: number;
    errorsByType: Record<string, number>;
    errorsByService: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ServiceError[];
    topErrorMessages: Array<{ message: string; count: number }>;
  } {
    const unresolvedErrors = Array.from(this.errors.values())
      .filter(error => !error.resolved);

    const recentErrors = Array.from(this.errors.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalErrors: this.errorAnalytics.totalErrors,
      unresolvedErrors: unresolvedErrors.length,
      errorsByType: { ...this.errorAnalytics.errorsByType },
      errorsByService: { ...this.errorAnalytics.errorsByService },
      errorsBySeverity: { ...this.errorAnalytics.errorsBySeverity },
      recentErrors,
      topErrorMessages: [...this.errorAnalytics.topErrorMessages],
    };
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): CircuitBreaker[] {
    return Array.from(this.circuitBreakers.values());
  }

  /**
   * Reset circuit breaker for a service
   */
  resetCircuitBreaker(service: string): void {
    const circuitBreaker = this.circuitBreakers.get(service);
    if (circuitBreaker) {
      circuitBreaker.state = 'closed';
      circuitBreaker.failureCount = 0;
      circuitBreaker.nextRetryTime = new Date(0);

      logger.info(`Circuit breaker reset for service: ${service}`, 'GitlabErrorService');
    }
  }

  /**
   * Export error data for analysis
   */
  exportErrorData(): {
    errors: ServiceError[];
    analytics: ErrorAnalytics;
    circuitBreakers: CircuitBreaker[];
  } {
    return {
      errors: Array.from(this.errors.values()),
      analytics: { ...this.errorAnalytics },
      circuitBreakers: Array.from(this.circuitBreakers.values()),
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Error service configuration updated', 'GitlabErrorService', newConfig);
  }

  /**
   * Destroy service and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;
    this.errors.clear();
    this.circuitBreakers.clear();
    this.recoveryStrategies.clear();

    logger.info('GitLab error service destroyed', 'GitlabErrorService');
  }
}

// Singleton instance
export const gitlabErrorService = new GitlabErrorService();
