import type { AuthenticationSource, AuthLogEntry, AuditSummary } from '@/types';
import { AuthEventType, AuthEventLevel } from '@/types';
import { AUTH_CONFIG } from '@/config';

export class AuthLogger {
  private logs: AuthLogEntry[] = [];
  private maxLogEntries = AUTH_CONFIG.logging.maxLogEntries;
  private enabled = AUTH_CONFIG.logging.enabled;

  logEvent(
    eventType: AuthEventType,
    level: AuthEventLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.enabled) return;

    const sanitizedMessage = this.sanitizeMessage(message);
    const sanitizedMetadata = metadata ? this.sanitizeMetadata(metadata) : undefined;

    const logEntry: AuthLogEntry = {
      timestamp: new Date(),
      eventType,
      level,
      message: sanitizedMessage,
      metadata: sanitizedMetadata
    };

    this.logs.push(logEntry);

    // Maintain max log entries
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Output to console
    this.outputToConsole(logEntry);
  }

  // Environment authentication logging methods
  logEnvAuthInit(accountCount: number, configEnabled: boolean, autoSignInEnabled: boolean): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_INIT,
      AuthEventLevel.INFO,
      'Environment authentication initialized',
      { accountCount, configEnabled, autoSignInEnabled }
    );
  }

  logEnvConfigLoaded(
    accountCount: number,
    configEnabled: boolean,
    autoSignInEnabled: boolean,
    strictMode: boolean,
    fallbackAllowed: boolean
  ): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_CONFIG_LOADED,
      AuthEventLevel.INFO,
      `Environment credentials configuration loaded with ${accountCount} account(s)`,
      { accountCount, configEnabled, autoSignInEnabled, strictMode, fallbackAllowed }
    );
  }

  logEnvConfigError(errorType: string, message: string): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_CONFIG_ERROR,
      AuthEventLevel.ERROR,
      `Environment credentials configuration error: ${message}`,
      { errorType }
    );
  }

  logEnvValidationError(errorCount: number, message: string): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_VALIDATION_ERROR,
      AuthEventLevel.WARN,
      `Environment credentials validation failed with ${errorCount} error(s): ${message}`,
      { errorType: 'validation_failed' }
    );
  }

  logEnvSignInAttempt(accountName: string): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_ATTEMPT,
      AuthEventLevel.INFO,
      'Environment account sign-in attempt',
      { accountName, authMethod: 'environment' }
    );
  }

  logEnvSignInSuccess(accountName: string, duration?: number): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_SUCCESS,
      AuthEventLevel.INFO,
      'Environment account sign-in successful',
      { accountName, authMethod: 'environment', duration }
    );
  }

  logEnvSignInFailure(accountName: string, errorType: string, duration?: number): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_FAILURE,
      AuthEventLevel.ERROR,
      'Environment account sign-in failed',
      { accountName, authMethod: 'environment', errorType, duration }
    );
  }

  logAutoSignInAttempt(accountName: string): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_AUTO_SIGNIN_ATTEMPT,
      AuthEventLevel.INFO,
      'Auto sign-in attempt with environment account',
      { accountName, authMethod: 'environment' }
    );
  }

  logAutoSignInSuccess(accountName: string, duration?: number): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_AUTO_SIGNIN_SUCCESS,
      AuthEventLevel.INFO,
      'Auto sign-in successful',
      { accountName, authMethod: 'environment', duration }
    );
  }

  logAutoSignInFailure(accountName: string, errorType: string, duration?: number): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_AUTO_SIGNIN_FAILURE,
      AuthEventLevel.WARN,
      'Auto sign-in failed, falling back to manual authentication',
      { accountName, authMethod: 'environment', errorType, duration }
    );
  }

  logFallbackToManual(reason: string): void {
    this.logEvent(
      AuthEventType.ENV_AUTH_FALLBACK_TO_MANUAL,
      AuthEventLevel.INFO,
      `Falling back to manual authentication: ${reason}`,
      { authMethod: 'manual' }
    );
  }

  // Manual authentication logging methods
  logManualSignInAttempt(): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_SIGNIN_ATTEMPT,
      AuthEventLevel.INFO,
      'Manual sign-in attempt',
      { authMethod: 'manual' }
    );
  }

  logManualSignInSuccess(duration?: number): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_SIGNIN_SUCCESS,
      AuthEventLevel.INFO,
      'Manual sign-in successful',
      { authMethod: 'manual', duration }
    );
  }

  logManualSignInFailure(errorType: string, duration?: number): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_SIGNIN_FAILURE,
      AuthEventLevel.ERROR,
      'Manual sign-in failed',
      { authMethod: 'manual', errorType, duration }
    );
  }

  logOAuthAttempt(provider: string): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_OAUTH_ATTEMPT,
      AuthEventLevel.INFO,
      `OAuth sign-in attempt with ${provider}`,
      { authMethod: 'manual', errorType: provider } // Reusing errorType field for provider
    );
  }

  logOAuthSuccess(provider: string): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_OAUTH_SUCCESS,
      AuthEventLevel.INFO,
      `OAuth sign-in successful with ${provider}`,
      { authMethod: 'manual', errorType: provider } // Reusing errorType field for provider
    );
  }

  logOAuthFailure(provider: string, errorType: string): void {
    this.logEvent(
      AuthEventType.MANUAL_AUTH_OAUTH_FAILURE,
      AuthEventLevel.ERROR,
      `OAuth sign-in failed with ${provider}`,
      { authMethod: 'manual', errorType: `${provider}_${errorType}` }
    );
  }

  // General authentication logging methods
  logSignOut(authSource: AuthenticationSource): void {
    this.logEvent(
      AuthEventType.AUTH_SIGNOUT,
      AuthEventLevel.INFO,
      'User signed out',
      { 
        authMethod: authSource.method,
        accountName: authSource.accountName
      }
    );
  }

  logSessionRestored(authSource: AuthenticationSource): void {
    this.logEvent(
      AuthEventType.AUTH_SESSION_RESTORED,
      AuthEventLevel.INFO,
      'Session restored from previous authentication',
      { 
        authMethod: authSource.method,
        accountName: authSource.accountName
      }
    );
  }

  // Log retrieval methods
  getRecentLogs(limit?: number): AuthLogEntry[] {
    const logs = [...this.logs];
    const recentLogs = logs.slice(-limit || logs.length).reverse();
    return recentLogs;
  }

  getLogsByType(eventType: AuthEventType): AuthLogEntry[] {
    return this.logs.filter(log => log.eventType === eventType);
  }

  getLogsByLevel(level: AuthEventLevel): AuthLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Configuration methods
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isLoggingEnabled(): boolean {
    return this.enabled;
  }

  setMaxLogEntries(max: number): void {
    this.maxLogEntries = Math.max(1, max);
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }
  }

  // Audit and summary methods
  getAuditSummary(): AuditSummary {
    const envAuthAttempts = this.getLogsByType(AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_ATTEMPT).length +
                           this.getLogsByType(AuthEventType.ENV_AUTH_AUTO_SIGNIN_ATTEMPT).length;
    const envAuthSuccesses = this.getLogsByType(AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_SUCCESS).length +
                            this.getLogsByType(AuthEventType.ENV_AUTH_AUTO_SIGNIN_SUCCESS).length;
    const envAuthFailures = this.getLogsByType(AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_FAILURE).length;
    
    const manualAuthAttempts = this.getLogsByType(AuthEventType.MANUAL_AUTH_SIGNIN_ATTEMPT).length +
                              this.getLogsByType(AuthEventType.MANUAL_AUTH_OAUTH_ATTEMPT).length;
    const manualAuthSuccesses = this.getLogsByType(AuthEventType.MANUAL_AUTH_SIGNIN_SUCCESS).length +
                               this.getLogsByType(AuthEventType.MANUAL_AUTH_OAUTH_SUCCESS).length;
    const manualAuthFailures = this.getLogsByType(AuthEventType.MANUAL_AUTH_SIGNIN_FAILURE).length;

    const autoSignInAttempts = this.getLogsByType(AuthEventType.ENV_AUTH_AUTO_SIGNIN_ATTEMPT).length;
    const autoSignInSuccesses = this.getLogsByType(AuthEventType.ENV_AUTH_AUTO_SIGNIN_SUCCESS).length;
    const fallbackToManualCount = this.getLogsByType(AuthEventType.ENV_AUTH_FALLBACK_TO_MANUAL).length;

    // Calculate account usage stats
    const accountUsageStats: Record<string, number> = {};
    this.logs.forEach(log => {
      if (log.metadata?.accountName && typeof log.metadata.accountName === 'string') {
        accountUsageStats[log.metadata.accountName] = (accountUsageStats[log.metadata.accountName] || 0) + 1;
      }
    });

    // Determine most used auth method
    let mostUsedAuthMethod: string | null = null;
    const envTotal = envAuthAttempts;
    const manualTotal = manualAuthAttempts;
    if (envTotal > manualTotal) {
      mostUsedAuthMethod = 'environment';
    } else if (manualTotal > envTotal) {
      mostUsedAuthMethod = 'manual';
    } else if (envTotal > 0) {
      mostUsedAuthMethod = 'environment'; // Tie-breaker
    }

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
      lastActivity: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
      mostUsedAuthMethod,
      accountUsageStats
    };
  }

  private sanitizeMessage(message: string): string {
    let sanitized = message;
    
    // Sanitize passwords
    sanitized = sanitized.replace(/password=[\w\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/gi, 'password=***');
    
    // Sanitize environment variable passwords
    sanitized = sanitized.replace(/VITE_AUTH_ENV_ACCOUNT_\w+_PASSWORD=[\w\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/gi, 'VITE_AUTH_ENV_ACCOUNT_***_PASSWORD=***');
    
    // Sanitize email addresses - fix the regex to avoid double replacement
    sanitized = sanitized.replace(/\b[\w\d._%+-]+@[\w\d.-]+\.[A-Za-z]{2,}\b/gi, '***@***');
    
    // Sanitize tokens
    sanitized = sanitized.replace(/token=[\w\d]+/gi, 'token=***');
    
    return sanitized;
  }

  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...metadata };
    
    // Sanitize user agent strings
    if (sanitized.userAgent && typeof sanitized.userAgent === 'string') {
      sanitized.userAgent = sanitized.userAgent
        .replace(/\d+\.\d+(\.\d+)?/g, 'x.x.x')
        .replace(/\d+\.\d+/g, 'x.x.x')
        .replace(/\d+/g, 'x');
    }
    
    return sanitized;
  }

  private outputToConsole(logEntry: AuthLogEntry): void {
    const message = `${logEntry.eventType}: ${logEntry.message}`;
    
    switch (logEntry.level) {
      case AuthEventLevel.DEBUG:
        console.debug(message, logEntry.metadata);
        break;
      case AuthEventLevel.INFO:
        console.log(message, logEntry.metadata);
        break;
      case AuthEventLevel.WARN:
        console.warn(message, logEntry.metadata);
        break;
      case AuthEventLevel.ERROR:
        console.error(message, logEntry.metadata);
        break;
    }
  }
}

export const authLogger = new AuthLogger();
