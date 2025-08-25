import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthLogger, authLogger } from '../auth/authLogger';
import { AuthEventType, AuthEventLevel } from '@/types';
import type { AuthenticationSource } from '@/types';

describe('AuthLogger', () => {
  let logger: AuthLogger;

  beforeEach(() => {
    logger = new AuthLogger();
    logger.clearLogs();
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  describe('Basic Logging', () => {
    it('should log events with correct structure', () => {
      logger.logEvent(
        AuthEventType.ENV_AUTH_INIT,
        AuthEventLevel.INFO,
        'Test message',
        { accountCount: 2 }
      );

      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_INIT,
        level: AuthEventLevel.INFO,
        message: 'Test message',
        metadata: { accountCount: 2 }
      });
      expect(logs[0].timestamp).toBeDefined();
    });

    it('should sanitize sensitive information from messages', () => {
      logger.logEvent(
        AuthEventType.ENV_AUTH_CONFIG_ERROR,
        AuthEventLevel.ERROR,
        'Error with password=secret123 and email=user@example.com'
      );

      const logs = logger.getRecentLogs(1);
      expect(logs[0].message).toBe('Error with password=*** and email=***@***');
    });

    it('should sanitize environment variable patterns', () => {
      logger.logEvent(
        AuthEventType.ENV_AUTH_CONFIG_ERROR,
        AuthEventLevel.ERROR,
        'VITE_AUTH_ENV_ACCOUNT_ADMIN_PASSWORD=secret123 failed'
      );

      const logs = logger.getRecentLogs(1);
      expect(logs[0].message).toBe('VITE_AUTH_ENV_ACCOUNT_***_PASSWORD=*** failed');
    });

    it('should handle logging when disabled', () => {
      logger.setEnabled(false);
      logger.logEvent(AuthEventType.ENV_AUTH_INIT, AuthEventLevel.INFO, 'Test');

      expect(logger.getRecentLogs()).toHaveLength(0);
    });

    it('should respect max log entries limit', () => {
      logger.setMaxLogEntries(5);

      // Add more logs than the limit
      for (let i = 0; i < 10; i++) {
        logger.logEvent(AuthEventType.ENV_AUTH_INIT, AuthEventLevel.INFO, `Message ${i}`);
      }

      const logs = logger.getRecentLogs();
      expect(logs).toHaveLength(5);
      expect(logs[0].message).toBe('Message 5'); // Should keep the last 5
      expect(logs[4].message).toBe('Message 9');
    });
  });

  describe('Environment Authentication Logging', () => {
    it('should log environment auth initialization', () => {
      logger.logEnvAuthInit(2, true, false);

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_INIT,
        level: AuthEventLevel.INFO,
        message: 'Environment authentication initialized',
        metadata: {
          accountCount: 2,
          configEnabled: true,
          autoSignInEnabled: false
        }
      });
    });

    it('should log environment config loading', () => {
      logger.logEnvConfigLoaded(3, true, true, false, true);

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_CONFIG_LOADED,
        level: AuthEventLevel.INFO,
        message: 'Environment credentials configuration loaded with 3 account(s)',
        metadata: {
          accountCount: 3,
          configEnabled: true,
          autoSignInEnabled: true,
          strictMode: false,
          fallbackAllowed: true
        }
      });
    });

    it('should log environment config errors', () => {
      logger.logEnvConfigError('validation_failed', 'Invalid configuration');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_CONFIG_ERROR,
        level: AuthEventLevel.ERROR,
        message: 'Environment credentials configuration error: Invalid configuration',
        metadata: {
          errorType: 'validation_failed'
        }
      });
    });

    it('should log environment validation errors', () => {
      logger.logEnvValidationError(2, 'Multiple validation issues');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_VALIDATION_ERROR,
        level: AuthEventLevel.WARN,
        message: 'Environment credentials validation failed with 2 error(s): Multiple validation issues',
        metadata: {
          errorType: 'validation_failed'
        }
      });
    });

    it('should log environment sign-in attempts', () => {
      logger.logEnvSignInAttempt('admin');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_ATTEMPT,
        level: AuthEventLevel.INFO,
        message: 'Environment account sign-in attempt',
        metadata: {
          accountName: 'admin',
          authMethod: 'environment'
        }
      });
    });

    it('should log environment sign-in success with duration', () => {
      logger.logEnvSignInSuccess('admin', 1500);

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_SUCCESS,
        level: AuthEventLevel.INFO,
        message: 'Environment account sign-in successful',
        metadata: {
          accountName: 'admin',
          authMethod: 'environment',
          duration: 1500
        }
      });
    });

    it('should log environment sign-in failures', () => {
      logger.logEnvSignInFailure('admin', 'invalid_credentials', 2000);

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_FAILURE,
        level: AuthEventLevel.ERROR,
        message: 'Environment account sign-in failed',
        metadata: {
          accountName: 'admin',
          authMethod: 'environment',
          errorType: 'invalid_credentials',
          duration: 2000
        }
      });
    });

    it('should log auto sign-in attempts', () => {
      logger.logAutoSignInAttempt('default');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_AUTO_SIGNIN_ATTEMPT,
        level: AuthEventLevel.INFO,
        message: 'Auto sign-in attempt with environment account',
        metadata: {
          accountName: 'default',
          authMethod: 'environment'
        }
      });
    });

    it('should log auto sign-in success', () => {
      logger.logAutoSignInSuccess('default', 1200);

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_AUTO_SIGNIN_SUCCESS,
        level: AuthEventLevel.INFO,
        message: 'Auto sign-in successful',
        metadata: {
          accountName: 'default',
          authMethod: 'environment',
          duration: 1200
        }
      });
    });

    it('should log auto sign-in failures', () => {
      logger.logAutoSignInFailure('default', 'network_error', 3000);

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_AUTO_SIGNIN_FAILURE,
        level: AuthEventLevel.WARN,
        message: 'Auto sign-in failed, falling back to manual authentication',
        metadata: {
          accountName: 'default',
          authMethod: 'environment',
          errorType: 'network_error',
          duration: 3000
        }
      });
    });

    it('should log fallback to manual authentication', () => {
      logger.logFallbackToManual('auto_signin_failed');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.ENV_AUTH_FALLBACK_TO_MANUAL,
        level: AuthEventLevel.INFO,
        message: 'Falling back to manual authentication: auto_signin_failed',
        metadata: {
          authMethod: 'manual'
        }
      });
    });
  });

  describe('Manual Authentication Logging', () => {
    it('should log manual sign-in attempts', () => {
      logger.logManualSignInAttempt();

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.MANUAL_AUTH_SIGNIN_ATTEMPT,
        level: AuthEventLevel.INFO,
        message: 'Manual sign-in attempt',
        metadata: {
          authMethod: 'manual'
        }
      });
    });

    it('should log manual sign-in success', () => {
      logger.logManualSignInSuccess(800);

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.MANUAL_AUTH_SIGNIN_SUCCESS,
        level: AuthEventLevel.INFO,
        message: 'Manual sign-in successful',
        metadata: {
          authMethod: 'manual',
          duration: 800
        }
      });
    });

    it('should log manual sign-in failures', () => {
      const testDuration = 1000;
      logger.logManualSignInFailure('invalid_credentials', testDuration);

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.MANUAL_AUTH_SIGNIN_FAILURE,
        level: AuthEventLevel.ERROR,
        message: 'Manual sign-in failed',
        metadata: {
          authMethod: 'manual',
          errorType: 'invalid_credentials',
          duration: testDuration
        }
      });
    });

    it('should log OAuth attempts', () => {
      logger.logOAuthAttempt('github');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.MANUAL_AUTH_OAUTH_ATTEMPT,
        level: AuthEventLevel.INFO,
        message: 'OAuth sign-in attempt with github',
        metadata: {
          authMethod: 'manual',
          errorType: 'github' // Reused field for provider
        }
      });
    });

    it('should log OAuth success', () => {
      logger.logOAuthSuccess('google');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.MANUAL_AUTH_OAUTH_SUCCESS,
        level: AuthEventLevel.INFO,
        message: 'OAuth sign-in successful with google',
        metadata: {
          authMethod: 'manual',
          errorType: 'google' // Reused field for provider
        }
      });
    });

    it('should log OAuth failures', () => {
      logger.logOAuthFailure('github', 'access_denied');

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.MANUAL_AUTH_OAUTH_FAILURE,
        level: AuthEventLevel.ERROR,
        message: 'OAuth sign-in failed with github',
        metadata: {
          authMethod: 'manual',
          errorType: 'github_access_denied'
        }
      });
    });
  });

  describe('General Authentication Logging', () => {
    it('should log sign out events', () => {
      const authSource: AuthenticationSource = {
        method: 'environment',
        accountName: 'admin',
        timestamp: new Date()
      };

      logger.logSignOut(authSource);

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.AUTH_SIGNOUT,
        level: AuthEventLevel.INFO,
        message: 'User signed out',
        metadata: {
          authMethod: 'environment',
          accountName: 'admin'
        }
      });
    });

    it('should log session restoration', () => {
      const authSource: AuthenticationSource = {
        method: 'manual',
        timestamp: new Date()
      };

      logger.logSessionRestored(authSource);

      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        eventType: AuthEventType.AUTH_SESSION_RESTORED,
        level: AuthEventLevel.INFO,
        message: 'Session restored from previous authentication',
        metadata: {
          authMethod: 'manual'
        }
      });
    });
  });

  describe('Log Filtering and Retrieval', () => {
    beforeEach(() => {
      // Add various log entries for filtering tests
      logger.logEnvAuthInit(2, true, false);
      logger.logManualSignInAttempt();
      logger.logEnvConfigError('test', 'Test error');
      logger.logManualSignInSuccess(500);
      logger.logAutoSignInFailure('admin', 'invalid_credentials');
    });

    it('should filter logs by event type', () => {
      const envInitLogs = logger.getLogsByType(AuthEventType.ENV_AUTH_INIT);
      expect(envInitLogs).toHaveLength(1);
      expect(envInitLogs[0].eventType).toBe(AuthEventType.ENV_AUTH_INIT);
    });

    it('should filter logs by level', () => {
      const errorLogs = logger.getLogsByLevel(AuthEventLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(AuthEventLevel.ERROR);

      const infoLogs = logger.getLogsByLevel(AuthEventLevel.INFO);
      expect(infoLogs).toHaveLength(2); // ENV_AUTH_INIT and MANUAL_AUTH_SIGNIN_SUCCESS
    });

    it('should limit recent logs', () => {
      const recentLogs = logger.getRecentLogs(3);
      expect(recentLogs).toHaveLength(3);
      
      // Should return the last 3 logs
      expect(recentLogs[0].eventType).toBe(AuthEventType.MANUAL_AUTH_SIGNIN_SUCCESS);
      expect(recentLogs[1].eventType).toBe(AuthEventType.ENV_AUTH_CONFIG_ERROR);
      expect(recentLogs[2].eventType).toBe(AuthEventType.ENV_AUTH_AUTO_SIGNIN_FAILURE);
    });
  });

  describe('Audit Summary', () => {
    beforeEach(() => {
      // Create a comprehensive set of logs for audit testing
      logger.logEnvSignInAttempt('admin');
      const testDuration1 = 1000;
      logger.logEnvSignInSuccess('admin', testDuration1);
      logger.logEnvSignInAttempt('user');
      const testDuration2 = 1500;
      logger.logEnvSignInFailure('user', 'invalid_credentials', testDuration2);
      logger.logAutoSignInAttempt('admin');
      logger.logAutoSignInSuccess('admin', 800);
      logger.logManualSignInAttempt();
      logger.logManualSignInSuccess(600);
      logger.logManualSignInAttempt();
      logger.logManualSignInFailure('invalid_credentials', 700);
      logger.logOAuthAttempt('github');
      logger.logOAuthSuccess('github');
      logger.logFallbackToManual('auto_signin_failed');
    });

    it('should generate comprehensive audit summary', () => {
      const summary = logger.getAuditSummary();

      expect(summary).toMatchObject({
        totalEvents: 13,
        envAuthAttempts: 3, // 2 manual env + 1 auto
        envAuthSuccesses: 2, // 1 manual env + 1 auto
        envAuthFailures: 1, // 1 manual env failure
        manualAuthAttempts: 3, // 2 manual + 1 oauth
        manualAuthSuccesses: 2, // 1 manual + 1 oauth
        manualAuthFailures: 1, // 1 manual failure
        autoSignInAttempts: 1,
        autoSignInSuccesses: 1,
        fallbackToManualCount: 1,
        mostUsedAuthMethod: 'environment' // 3 vs 3, but env has more total events
      });

      expect(summary.accountUsageStats).toEqual({
        admin: 3, // 2 env attempts + 1 auto attempt
        user: 1   // 1 env attempt
      });

      expect(summary.lastActivity).toBeDefined();
    });

    it('should handle empty logs in audit summary', () => {
      logger.clearLogs();
      const summary = logger.getAuditSummary();

      expect(summary).toMatchObject({
        totalEvents: 0,
        envAuthAttempts: 0,
        envAuthSuccesses: 0,
        envAuthFailures: 0,
        manualAuthAttempts: 0,
        manualAuthSuccesses: 0,
        manualAuthFailures: 0,
        autoSignInAttempts: 0,
        autoSignInSuccesses: 0,
        fallbackToManualCount: 0,
        lastActivity: null,
        mostUsedAuthMethod: null,
        accountUsageStats: {}
      });
    });
  });

  describe('Security and Sanitization', () => {
    it('should sanitize metadata containing sensitive information', () => {
      logger.logEvent(
        AuthEventType.ENV_AUTH_CONFIG_ERROR,
        AuthEventLevel.ERROR,
        'Test message',
        {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      );

      const logs = logger.getRecentLogs(1);
      expect(logs[0].metadata?.userAgent).toBe('Mozilla/x.x.x (Windows NT x.x.x; Win64; x64) AppleWebKit/x.x.x (KHTML, like Gecko) Chrome/x.x.x Safari/x.x.x');
    });

    it('should never log actual passwords or tokens', () => {
      const sensitiveMessage = 'Authentication failed with password=secret123 and token=abc123def456';
      logger.logEvent(AuthEventType.ENV_AUTH_CONFIG_ERROR, AuthEventLevel.ERROR, sensitiveMessage);

      const logs = logger.getRecentLogs(1);
      expect(logs[0].message).not.toContain('secret123');
      expect(logs[0].message).not.toContain('abc123def456');
      expect(logs[0].message).toContain('password=***');
      expect(logs[0].message).toContain('token=***');
    });

    it('should sanitize email addresses', () => {
      const messageWithEmail = 'Failed to authenticate user@example.com';
      logger.logEvent(AuthEventType.MANUAL_AUTH_SIGNIN_FAILURE, AuthEventLevel.ERROR, messageWithEmail);

      const logs = logger.getRecentLogs(1);
      expect(logs[0].message).not.toContain('user@example.com');
      expect(logs[0].message).toContain('email=***@***');
    });
  });

  describe('Console Output', () => {
    it('should output to appropriate console methods based on level', () => {
      logger.logEvent(AuthEventType.ENV_AUTH_INIT, AuthEventLevel.INFO, 'Info message');
      logger.logEvent(AuthEventType.ENV_AUTH_CONFIG_ERROR, AuthEventLevel.ERROR, 'Error message');
      logger.logEvent(AuthEventType.ENV_AUTH_VALIDATION_ERROR, AuthEventLevel.WARN, 'Warning message');
      logger.logEvent(AuthEventType.ENV_AUTH_INIT, AuthEventLevel.DEBUG, 'Debug message');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('ENV_AUTH_INIT: Info message'),
        undefined
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ENV_AUTH_CONFIG_ERROR: Error message'),
        undefined
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('ENV_AUTH_VALIDATION_ERROR: Warning message'),
        undefined
      );
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('ENV_AUTH_INIT: Debug message'),
        undefined
      );
    });
  });

  describe('Singleton Instance', () => {
    it('should provide a singleton instance', () => {
      expect(authLogger).toBeInstanceOf(AuthLogger);
      expect(authLogger.isLoggingEnabled()).toBe(true);
    });

    it('should maintain state across imports', () => {
      authLogger.logEvent(AuthEventType.ENV_AUTH_INIT, AuthEventLevel.INFO, 'Test singleton');
      expect(authLogger.getRecentLogs()).toHaveLength(1);
    });
  });
});
