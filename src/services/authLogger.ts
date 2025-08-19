/**
 * Authentication Logger Service
 * Provides secure logging for authentication events without exposing sensitive data
 */

import type { AuthenticationMethod, AuthenticationSource } from '@/types';

export enum AuthEventType {
  // Environment authentication events
  ENV_AUTH_INIT = 'ENV_AUTH_INIT',
  ENV_AUTH_CONFIG_LOADED = 'ENV_AUTH_CONFIG_LOADED',
  ENV_AUTH_CONFIG_ERROR = 'ENV_AUTH_CONFIG_ERROR',
  ENV_AUTH_VALIDATION_ERROR = 'ENV_AUTH_VALIDATION_ERROR',
  ENV_AUTH_ACCOUNT_SIGNIN_ATTEMPT = 'ENV_AUTH_ACCOUNT_SIGNIN_ATTEMPT',
  ENV_AUTH_ACCOUNT_SIGNIN_SUCCESS = 'ENV_AUTH_ACCOUNT_SIGNIN_SUCCESS',
  ENV_AUTH_ACCOUNT_SIGNIN_FAILURE = 'ENV_AUTH_ACCOUNT_SIGNIN_FAILURE',
  ENV_AUTH_AUTO_SIGNIN_ATTEMPT = 'ENV_AUTH_AUTO_SIGNIN_ATTEMPT',
  ENV_AUTH_AUTO_SIGNIN_SUCCESS = 'ENV_AUTH_AUTO_SIGNIN_SUCCESS',
  ENV_AUTH_AUTO_SIGNIN_FAILURE = 'ENV_AUTH_AUTO_SIGNIN_FAILURE',
  ENV_AUTH_FALLBACK_TO_MANUAL = 'ENV_AUTH_FALLBACK_TO_MANUAL',
  
  // Manual authentication events
  MANUAL_AUTH_SIGNIN_ATTEMPT = 'MANUAL_AUTH_SIGNIN_ATTEMPT',
  MANUAL_AUTH_SIGNIN_SUCCESS = 'MANUAL_AUTH_SIGNIN_SUCCESS',
  MANUAL_AUTH_SIGNIN_FAILURE = 'MANUAL_AUTH_SIGNIN_FAILURE',
  MANUAL_AUTH_SIGNUP_ATTEMPT = 'MANUAL_AUTH_SIGNUP_ATTEMPT',
  MANUAL_AUTH_SIGNUP_SUCCESS = 'MANUAL_AUTH_SIGNUP_SUCCESS',
  MANUAL_AUTH_SIGNUP_FAILURE = 'MANUAL_AUTH_SIGNUP_FAILURE',
  MANUAL_AUTH_OAUTH_ATTEMPT = 'MANUAL_AUTH_OAUTH_ATTEMPT',
  MANUAL_AUTH_OAUTH_SUCCESS = 'MANUAL_AUTH_OAUTH_SUCCESS',
  MANUAL_AUTH_OAUTH_FAILURE = 'MANUAL_AUTH_OAUTH_FAILURE',
  
  // General authentication events
  AUTH_SIGNOUT = 'AUTH_SIGNOUT',
  AUTH_SESSION_RESTORED = 'AUTH_SESSION_RESTORED',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
}

export enum AuthEventLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export interface AuthLogEntry {
  timestamp: string;
  eventType: AuthEventType;
  level: AuthEventLevel;
  message: string;
  metadata?: {
    accountName?: string;
    authMethod?: AuthenticationMethod;
    errorType?: string;
    userAgent?: string;
    sessionId?: string;
    duration?: number;
    accountCount?: number;
    configEnabled?: boolean;
    autoSignInEnabled?: boolean;
    strictMode?: boolean;
    fallbackAllowed?: boolean;
  };
}

export interface AuthAuditSummary {
  totalEvents: number;
  envAuthAttempts: number;
  envAuthSuccesses: number;
  envAuthFailures: number;
  manualAuthAttempts: number;
  manualAuthSuccesses: number;
  manualAuthFailures: number;
  autoSignInAttempts: number;
  autoSignInSuccesses: number;
  fallbackToManualCount: number;
  lastActivity: string | null;
  mostUsedAuthMethod: AuthenticationMethod | null;
  accountUsageStats: Record<string, number>;
}

/**
 * Authentication Logger Service
 * Handles secure logging of authentication events with audit trail capabilities
 */
export class AuthLogger {
  private logs: AuthLogEntry[] = [];
  private maxLogEntries = 1000; // Prevent memory issues
  private isEnabled = true;

  /**
   * Log an authentication event
   */
  public logEvent(
    eventType: AuthEventType,
    level: AuthEventLevel,
    message: string,
    metadata?: AuthLogEntry['metadata']
  ): void {
    if (!this.isEnabled) {
      return;
    }

    const entry: AuthLogEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      level,
      message: this.sanitizeMessage(message),
      metadata: metadata ? this.sanitizeMetadata(metadata) : undefined,
    };

    // Add to in-memory log
    this.logs.push(entry);

    // Trim logs if we exceed max entries
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Output to console based on level
    this.outputToConsole(entry);
  }

  /**
   * Log environment authentication initialization
   */
  public logEnvAuthInit(accountCount: number, enabled: boolean, autoSignIn: boolean): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_INIT,
      AuthEventLevel.INFO,
      `Environment authentication initialized`,
      {
        accountCount,
        configEnabled: enabled,
        autoSignInEnabled: autoSignIn,
      }
    );
  }

  /**
   * Log environment configuration loading
   */
  public logEnvConfigLoaded(
    accountCount: number,
    enabled: boolean,
    autoSignIn: boolean,
    strictMode: boolean,
    fallbackAllowed: boolean
  ): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_CONFIG_LOADED,
      AuthEventLevel.INFO,
      `Environment credentials configuration loaded with ${accountCount} account(s)`,
      {
        accountCount,
        configEnabled: enabled,
        autoSignInEnabled: autoSignIn,
        strictMode,
        fallbackAllowed,
      }
    );
  }

  /**
   * Log environment configuration error
   */
  public logEnvConfigError(errorType: string, message: string): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_CONFIG_ERROR,
      AuthEventLevel.ERROR,
      `Environment credentials configuration error: ${message}`,
      {
        errorType,
      }
    );
  }

  /**
   * Log environment validation error
   */
  public logEnvValidationError(errorCount: number, message: string): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_VALIDATION_ERROR,
      AuthEventLevel.WARN,
      `Environment credentials validation failed with ${errorCount} error(s): ${message}`,
      {
        errorType: 'validation_failed',
      }
    );
  }

  /**
   * Log environment account sign-in attempt
   */
  public logEnvSignInAttempt(accountName: string): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_ATTEMPT,
      AuthEventLevel.INFO,
      `Environment account sign-in attempt`,
      {
        accountName,
        authMethod: 'environment',
      }
    );
  }

  /**
   * Log environment account sign-in success
   */
  public logEnvSignInSuccess(accountName: string, duration?: number): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_SUCCESS,
      AuthEventLevel.INFO,
      `Environment account sign-in successful`,
      {
        accountName,
        authMethod: 'environment',
        duration,
      }
    );
  }

  /**
   * Log environment account sign-in failure
   */
  public logEnvSignInFailure(accountName: string, errorType: string, duration?: number): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_FAILURE,
      AuthEventLevel.ERROR,
      `Environment account sign-in failed`,
      {
        accountName,
        authMethod: 'environment',
        errorType,
        duration,
      }
    );
  }

  /**
   * Log auto sign-in attempt
   */
  public logAutoSignInAttempt(accountName: string): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_AUTO_SIGNIN_ATTEMPT,
      AuthEventLevel.INFO,
      `Auto sign-in attempt with environment account`,
      {
        accountName,
        authMethod: 'environment',
      }
    );
  }

  /**
   * Log auto sign-in success
   */
  public logAutoSignInSuccess(accountName: string, duration?: number): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_AUTO_SIGNIN_SUCCESS,
      AuthEventLevel.INFO,
      `Auto sign-in successful`,
      {
        accountName,
        authMethod: 'environment',
        duration,
      }
    );
  }

  /**
   * Log auto sign-in failure
   */
  public logAutoSignInFailure(accountName: string, errorType: string, duration?: number): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_AUTO_SIGNIN_FAILURE,
      AuthEventLevel.WARN,
      `Auto sign-in failed, falling back to manual authentication`,
      {
        accountName,
        authMethod: 'environment',
        errorType,
        duration,
      }
    );
  }

  /**
   * Log fallback to manual authentication
   */
  public logFallbackToManual(reason: string): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_FALLBACK_TO_MANUAL,
      AuthEventLevel.INFO,
      `Falling back to manual authentication: ${reason}`,
      {
        authMethod: 'manual',
      }
    );
  }

  /**
   * Log manual authentication attempt
   */
  public logManualSignInAttempt(): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_SIGNIN_ATTEMPT,
      AuthEventLevel.INFO,
      `Manual sign-in attempt`,
      {
        authMethod: 'manual',
      }
    );
  }

  /**
   * Log manual authentication success
   */
  public logManualSignInSuccess(duration?: number): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_SIGNIN_SUCCESS,
      AuthEventLevel.INFO,
      `Manual sign-in successful`,
      {
        authMethod: 'manual',
        duration,
      }
    );
  }

  /**
   * Log manual authentication failure
   */
  public logManualSignInFailure(errorType: string, duration?: number): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_SIGNIN_FAILURE,
      AuthEventLevel.ERROR,
      `Manual sign-in failed`,
      {
        authMethod: 'manual',
        errorType,
        duration,
      }
    );
  }

  /**
   * Log OAuth authentication attempt
   */
  public logOAuthAttempt(provider: string): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_OAUTH_ATTEMPT,
      AuthEventLevel.INFO,
      `OAuth sign-in attempt with ${provider}`,
      {
        authMethod: 'manual',
        errorType: provider, // Reuse errorType field for provider
      }
    );
  }

  /**
   * Log OAuth authentication success
   */
  public logOAuthSuccess(provider: string): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_OAUTH_SUCCESS,
      AuthEventLevel.INFO,
      `OAuth sign-in successful with ${provider}`,
      {
        authMethod: 'manual',
        errorType: provider, // Reuse errorType field for provider
      }
    );
  }

  /**
   * Log OAuth authentication failure
   */
  public logOAuthFailure(provider: string, errorType: string): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_OAUTH_FAILURE,
      AuthEventLevel.ERROR,
      `OAuth sign-in failed with ${provider}`,
      {
        authMethod: 'manual',
        errorType: `${provider}_${errorType}`,
      }
    );
  }

  /**
   * Log sign out event
   */
  public logSignOut(authSource?: AuthenticationSource): void {
    this.logEvent(
      AuthEventType.AUTH_SIGNOUT,
      AuthEventLevel.INFO,
      `User signed out`,
      {
        authMethod: authSource?.method,
        accountName: authSource?.accountName,
      }
    );
  }

  /**
   * Log session restoration
   */
  public logSessionRestored(authSource?: AuthenticationSource): void {
    this.logEvent(
      AuthEventType.AUTH_SESSION_RESTORED,
      AuthEventLevel.INFO,
      `Session restored from previous authentication`,
      {
        authMethod: authSource?.method,
        accountName: authSource?.accountName,
      }
    );
  }

  /**
   * Get recent log entries
   */
  public getRecentLogs(limit = 50): AuthLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by event type
   */
  public getLogsByType(eventType: AuthEventType): AuthLogEntry[] {
    return this.logs.filter(log => log.eventType === eventType);
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: AuthEventLevel): AuthLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get authentication audit summary
   */
  public getAuditSummary(): AuthAuditSummary {
    const envAuthAttempts = this.logs.filter(log => 
      log.eventType === AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_ATTEMPT ||
      log.eventType === AuthEventType.ENV_AUTH_AUTO_SIGNIN_ATTEMPT
    ).length;

    const envAuthSuccesses = this.logs.filter(log => 
      log.eventType === AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_SUCCESS ||
      log.eventType === AuthEventType.ENV_AUTH_AUTO_SIGNIN_SUCCESS
    ).length;

    const envAuthFailures = this.logs.filter(log => 
      log.eventType === AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_FAILURE ||
      log.eventType === AuthEventType.ENV_AUTH_AUTO_SIGNIN_FAILURE
    ).length;

    const manualAuthAttempts = this.logs.filter(log => 
      log.eventType === AuthEventType.MANUAL_AUTH_SIGNIN_ATTEMPT ||
      log.eventType === AuthEventType.MANUAL_AUTH_OAUTH_ATTEMPT
    ).length;

    const manualAuthSuccesses = this.logs.filter(log => 
      log.eventType === AuthEventType.MANUAL_AUTH_SIGNIN_SUCCESS ||
      log.eventType === AuthEventType.MANUAL_AUTH_OAUTH_SUCCESS
    ).length;

    const manualAuthFailures = this.logs.filter(log => 
      log.eventType === AuthEventType.MANUAL_AUTH_SIGNIN_FAILURE ||
      log.eventType === AuthEventType.MANUAL_AUTH_OAUTH_FAILURE
    ).length;

    const autoSignInAttempts = this.logs.filter(log => 
      log.eventType === AuthEventType.ENV_AUTH_AUTO_SIGNIN_ATTEMPT
    ).length;

    const autoSignInSuccesses = this.logs.filter(log => 
      log.eventType === AuthEventType.ENV_AUTH_AUTO_SIGNIN_SUCCESS
    ).length;

    const fallbackToManualCount = this.logs.filter(log => 
      log.eventType === AuthEventType.ENV_AUTH_FALLBACK_TO_MANUAL
    ).length;

    // Calculate account usage stats
    const accountUsageStats: Record<string, number> = {};
    this.logs.forEach(log => {
      if (log.metadata?.accountName) {
        accountUsageStats[log.metadata.accountName] = (accountUsageStats[log.metadata.accountName] || 0) + 1;
      }
    });

    // Determine most used auth method
    const envTotal = envAuthAttempts;
    const manualTotal = manualAuthAttempts;
    let mostUsedAuthMethod: AuthenticationMethod | null = null;
    if (envTotal > manualTotal) {
      mostUsedAuthMethod = 'environment';
    } else if (manualTotal > envTotal) {
      mostUsedAuthMethod = 'manual';
    }

    // Get last activity timestamp
    const lastActivity = this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null;

    return {
      totalEvents: this.logs.length,
      envAuthAttempts,
      envAuthSuccesses,
      envAuthFailures,
      manualAuthAttempts,
      manualAuthSuccesses,
      manualAuthFailures,
      autoSignInAttempts,
      autoSignInSuccesses,
      fallbackToManualCount,
      lastActivity,
      mostUsedAuthMethod,
      accountUsageStats,
    };
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Enable or disable logging
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if logging is enabled
   */
  public isLoggingEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Set maximum number of log entries to keep in memory
   */
  public setMaxLogEntries(max: number): void {
    this.maxLogEntries = Math.max(100, max); // Minimum 100 entries
    
    // Trim existing logs if needed
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }
  }

  /**
   * Sanitize message to remove sensitive information
   */
  private sanitizeMessage(message: string): string {
    return message
      .replace(/password[=:]\s*[^\s]+/gi, 'password=***')
      .replace(/token[=:]\s*[^\s]+/gi, 'token=***')
      .replace(/key[=:]\s*[^\s]+/gi, 'key=***')
      .replace(/secret[=:]\s*[^\s]+/gi, 'secret=***')
      .replace(/VITE_AUTH_ENV_ACCOUNT_[^_]+_PASSWORD[=:]\s*[^\s]+/gi, 'VITE_AUTH_ENV_ACCOUNT_***_PASSWORD=***')
      .replace(/email[=:]\s*[^\s@]+@[^\s]+/gi, 'email=***@***');
  }

  /**
   * Sanitize metadata to remove sensitive information
   */
  private sanitizeMetadata(metadata: AuthLogEntry['metadata']): AuthLogEntry['metadata'] {
    if (!metadata) return metadata;

    const sanitized = { ...metadata };

    // Remove or sanitize sensitive fields
    if (sanitized.userAgent) {
      // Keep only browser name, remove detailed version info
      sanitized.userAgent = sanitized.userAgent.replace(/\d+\.\d+\.\d+/g, 'x.x.x');
    }

    return sanitized;
  }

  /**
   * Output log entry to console based on level
   */
  private outputToConsole(entry: AuthLogEntry): void {
    const logMessage = `[${entry.timestamp}] ${entry.eventType}: ${entry.message}`;
    const logData = entry.metadata ? { metadata: entry.metadata } : undefined;

    switch (entry.level) {
      case AuthEventLevel.ERROR:
        console.error(logMessage, logData);
        break;
      case AuthEventLevel.WARN:
        console.warn(logMessage, logData);
        break;
      case AuthEventLevel.DEBUG:
        console.debug(logMessage, logData);
        break;
      case AuthEventLevel.INFO:
      default:
        console.log(logMessage, logData);
        break;
    }
  }
}

// Export singleton instance
export const authLogger = new AuthLogger();
