import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { authLogger, AuthEventType } from '../authLogger';
import { envCredentialsService } from '../envCredentialsService';

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock environment service
vi.mock('../envCredentialsService', () => ({
  envCredentialsService: {
    initialize: vi.fn(),
    getInitializationError: vi.fn().mockReturnValue(null),
    loadConfiguration: vi.fn().mockReturnValue({
      enabled: true,
      autoSignIn: false,
      accounts: [
        { name: 'admin', email: 'admin@test.com', password: 'password123' },
        { name: 'user', email: 'user@test.com', password: 'password456' }
      ],
      allowFallback: true,
      strictMode: false
    }),
    validateCredentials: vi.fn().mockReturnValue({ isValid: true, errors: [] }),
    getAvailableAccounts: vi.fn().mockReturnValue([
      { name: 'admin', email: 'admin@test.com', password: 'password123' },
      { name: 'user', email: 'user@test.com', password: 'password456' }
    ]),
    getAccountByName: vi.fn(),
    getDefaultAccount: vi.fn().mockReturnValue({ name: 'admin', email: 'admin@test.com', password: 'password123' }),
    isReady: vi.fn().mockReturnValue(true),
  },
}));

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <button onClick={() => auth.signIn('test@example.com', 'password')}>
        Manual Sign In
      </button>
      <button onClick={() => auth.signInWithEnvAccount('admin')}>
        Env Sign In
      </button>
      <button onClick={() => auth.signInWithOAuth('github')}>
        OAuth Sign In
      </button>
      <button onClick={() => auth.signOut()}>
        Sign Out
      </button>
    </div>
  );
};

describe('AuthLogger Integration Tests', () => {
  beforeEach(() => {
    // Clear logs before each test
    authLogger.clearLogs();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock successful session response
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    // Mock auth state change subscription
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Environment Authentication Logging', () => {
    it('should log environment authentication initialization', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        const initLogs = logs.filter(log => log.eventType === AuthEventType.ENV_AUTH_INIT);
        expect(initLogs).toHaveLength(1);
        expect(initLogs[0].metadata).toMatchObject({
          accountCount: 2,
          configEnabled: true,
          autoSignInEnabled: false
        });
      });
    });

    it('should log environment configuration loading', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        const configLogs = logs.filter(log => log.eventType === AuthEventType.ENV_AUTH_CONFIG_LOADED);
        expect(configLogs).toHaveLength(1);
        expect(configLogs[0].metadata).toMatchObject({
          accountCount: 2,
          configEnabled: true,
          autoSignInEnabled: false,
          strictMode: false,
          fallbackAllowed: true
        });
      });
    });

    it('should log successful environment account sign-in', async () => {
      // Mock successful environment account retrieval
      vi.mocked(envCredentialsService.getAccountByName).mockReturnValue({
        name: 'admin',
        email: 'admin@test.com',
        password: 'password123'
      });

      // Mock successful authentication
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Clear initialization logs
      authLogger.clearLogs();

      // Trigger environment sign-in
      getByText('Env Sign In').click();

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        
        // Should have attempt and success logs
        const attemptLogs = logs.filter(log => log.eventType === AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_ATTEMPT);
        const successLogs = logs.filter(log => log.eventType === AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_SUCCESS);
        
        expect(attemptLogs).toHaveLength(1);
        expect(attemptLogs[0].metadata).toMatchObject({
          accountName: 'admin',
          authMethod: 'environment'
        });
        
        expect(successLogs).toHaveLength(1);
        expect(successLogs[0].metadata).toMatchObject({
          accountName: 'admin',
          authMethod: 'environment'
        });
        expect(successLogs[0].metadata?.duration).toBeTypeOf('number');
      });
    });

    it('should log failed environment account sign-in', async () => {
      // Mock environment account retrieval
      vi.mocked(envCredentialsService.getAccountByName).mockReturnValue({
        name: 'admin',
        email: 'admin@test.com',
        password: 'password123'
      });

      // Mock authentication failure
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Clear initialization logs
      authLogger.clearLogs();

      // Trigger environment sign-in
      getByText('Env Sign In').click();

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        
        // Should have attempt and failure logs
        const attemptLogs = logs.filter(log => log.eventType === AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_ATTEMPT);
        const failureLogs = logs.filter(log => log.eventType === AuthEventType.ENV_AUTH_ACCOUNT_SIGNIN_FAILURE);
        
        expect(attemptLogs).toHaveLength(1);
        expect(failureLogs).toHaveLength(1);
        expect(failureLogs[0].metadata).toMatchObject({
          accountName: 'admin',
          authMethod: 'environment',
          errorType: 'invalid_credentials'
        });
        expect(failureLogs[0].metadata?.duration).toBeTypeOf('number');
      });
    });

    it('should log auto sign-in attempts when enabled', async () => {
      // Mock auto sign-in enabled configuration
      vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
        enabled: true,
        autoSignIn: true,
        accounts: [{ name: 'admin', email: 'admin@test.com', password: 'password123' }],
        allowFallback: true,
        strictMode: false
      });

      // Mock successful auto sign-in
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        
        // Should have auto sign-in attempt and success logs
        const autoAttemptLogs = logs.filter(log => log.eventType === AuthEventType.ENV_AUTH_AUTO_SIGNIN_ATTEMPT);
        const autoSuccessLogs = logs.filter(log => log.eventType === AuthEventType.ENV_AUTH_AUTO_SIGNIN_SUCCESS);
        
        expect(autoAttemptLogs).toHaveLength(1);
        expect(autoAttemptLogs[0].metadata).toMatchObject({
          accountName: 'admin',
          authMethod: 'environment'
        });
        
        expect(autoSuccessLogs).toHaveLength(1);
        expect(autoSuccessLogs[0].metadata).toMatchObject({
          accountName: 'admin',
          authMethod: 'environment'
        });
      });
    });

    it('should log auto sign-in failure and fallback', async () => {
      // Mock auto sign-in enabled configuration
      vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
        enabled: true,
        autoSignIn: true,
        accounts: [{ name: 'admin', email: 'admin@test.com', password: 'password123' }],
        allowFallback: true,
        strictMode: false
      });

      // Mock failed auto sign-in
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        
        // Should have auto sign-in attempt, failure, and fallback logs
        const autoAttemptLogs = logs.filter(log => log.eventType === AuthEventType.ENV_AUTH_AUTO_SIGNIN_ATTEMPT);
        const autoFailureLogs = logs.filter(log => log.eventType === AuthEventType.ENV_AUTH_AUTO_SIGNIN_FAILURE);
        const fallbackLogs = logs.filter(log => log.eventType === AuthEventType.ENV_AUTH_FALLBACK_TO_MANUAL);
        
        expect(autoAttemptLogs).toHaveLength(1);
        expect(autoFailureLogs).toHaveLength(1);
        expect(autoFailureLogs[0].metadata).toMatchObject({
          accountName: 'admin',
          authMethod: 'environment',
          errorType: 'invalid_credentials'
        });
        
        expect(fallbackLogs).toHaveLength(1);
        expect(fallbackLogs[0].metadata).toMatchObject({
          authMethod: 'manual'
        });
      });
    });
  });

  describe('Manual Authentication Logging', () => {
    it('should log successful manual sign-in', async () => {
      // Mock successful authentication
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Clear initialization logs
      authLogger.clearLogs();

      // Trigger manual sign-in
      getByText('Manual Sign In').click();

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        
        // Should have attempt and success logs
        const attemptLogs = logs.filter(log => log.eventType === AuthEventType.MANUAL_AUTH_SIGNIN_ATTEMPT);
        const successLogs = logs.filter(log => log.eventType === AuthEventType.MANUAL_AUTH_SIGNIN_SUCCESS);
        
        expect(attemptLogs).toHaveLength(1);
        expect(attemptLogs[0].metadata).toMatchObject({
          authMethod: 'manual'
        });
        
        expect(successLogs).toHaveLength(1);
        expect(successLogs[0].metadata).toMatchObject({
          authMethod: 'manual'
        });
        expect(successLogs[0].metadata?.duration).toBeTypeOf('number');
      });
    });

    it('should log failed manual sign-in', async () => {
      // Mock authentication failure
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login credentials' },
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Clear initialization logs
      authLogger.clearLogs();

      // Trigger manual sign-in
      getByText('Manual Sign In').click();

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        
        // Should have attempt and failure logs
        const attemptLogs = logs.filter(log => log.eventType === AuthEventType.MANUAL_AUTH_SIGNIN_ATTEMPT);
        const failureLogs = logs.filter(log => log.eventType === AuthEventType.MANUAL_AUTH_SIGNIN_FAILURE);
        
        expect(attemptLogs).toHaveLength(1);
        expect(failureLogs).toHaveLength(1);
        expect(failureLogs[0].metadata).toMatchObject({
          authMethod: 'manual',
          errorType: 'invalid_credentials'
        });
        expect(failureLogs[0].metadata?.duration).toBeTypeOf('number');
      });
    });

    it('should log OAuth sign-in attempts', async () => {
      // Mock successful OAuth
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: {},
        error: null,
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Clear initialization logs
      authLogger.clearLogs();

      // Trigger OAuth sign-in
      getByText('OAuth Sign In').click();

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        
        // Should have OAuth attempt and success logs
        const oauthAttemptLogs = logs.filter(log => log.eventType === AuthEventType.MANUAL_AUTH_OAUTH_ATTEMPT);
        const oauthSuccessLogs = logs.filter(log => log.eventType === AuthEventType.MANUAL_AUTH_OAUTH_SUCCESS);
        
        expect(oauthAttemptLogs).toHaveLength(1);
        expect(oauthAttemptLogs[0].metadata).toMatchObject({
          authMethod: 'manual',
          errorType: 'github' // Provider stored in errorType field
        });
        
        expect(oauthSuccessLogs).toHaveLength(1);
        expect(oauthSuccessLogs[0].metadata).toMatchObject({
          authMethod: 'manual',
          errorType: 'github'
        });
      });
    });

    it('should log OAuth sign-in failures', async () => {
      // Mock OAuth failure
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({
        data: {},
        error: { message: 'OAuth provider error' },
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Clear initialization logs
      authLogger.clearLogs();

      // Trigger OAuth sign-in
      getByText('OAuth Sign In').click();

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        
        // Should have OAuth attempt and failure logs
        const oauthAttemptLogs = logs.filter(log => log.eventType === AuthEventType.MANUAL_AUTH_OAUTH_ATTEMPT);
        const oauthFailureLogs = logs.filter(log => log.eventType === AuthEventType.MANUAL_AUTH_OAUTH_FAILURE);
        
        expect(oauthAttemptLogs).toHaveLength(1);
        expect(oauthFailureLogs).toHaveLength(1);
        expect(oauthFailureLogs[0].metadata).toMatchObject({
          authMethod: 'manual',
          errorType: 'github_oauth_error'
        });
      });
    });
  });

  describe('Sign Out Logging', () => {
    it('should log sign out events', async () => {
      // Mock successful sign out
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Clear initialization logs
      authLogger.clearLogs();

      // Trigger sign out
      getByText('Sign Out').click();

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        
        // Should have sign out log
        const signOutLogs = logs.filter(log => log.eventType === AuthEventType.AUTH_SIGNOUT);
        expect(signOutLogs).toHaveLength(1);
      });
    });
  });

  describe('Security Compliance', () => {
    it('should never log sensitive credential information', async () => {
      // Mock environment account retrieval
      vi.mocked(envCredentialsService.getAccountByName).mockReturnValue({
        name: 'admin',
        email: 'admin@test.com',
        password: 'supersecret123'
      });

      // Mock authentication failure to trigger error logging
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid login credentials for admin@test.com with password supersecret123' },
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Clear initialization logs
      authLogger.clearLogs();

      // Trigger environment sign-in
      getByText('Env Sign In').click();

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        
        // Check that no log contains the actual password
        logs.forEach(log => {
          expect(log.message).not.toContain('supersecret123');
          expect(log.message).not.toContain('admin@test.com');
          expect(JSON.stringify(log.metadata || {})).not.toContain('supersecret123');
          expect(JSON.stringify(log.metadata || {})).not.toContain('admin@test.com');
        });
      });
    });

    it('should sanitize error messages in logs', async () => {
      // Mock environment service to throw error with sensitive info
      vi.mocked(envCredentialsService.getAccountByName).mockImplementation(() => {
        throw new Error('Account not found: admin@test.com with password=secret123');
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Clear initialization logs
      authLogger.clearLogs();

      // Trigger environment sign-in
      getByText('Env Sign In').click();

      await waitFor(() => {
        const logs = authLogger.getRecentLogs();
        
        // Check that sensitive information is sanitized
        logs.forEach(log => {
          expect(log.message).not.toContain('secret123');
          expect(log.message).not.toContain('admin@test.com');
          if (log.message.includes('password')) {
            expect(log.message).toContain('password=***');
          }
          if (log.message.includes('email')) {
            expect(log.message).toContain('email=***@***');
          }
        });
      });
    });
  });

  describe('Audit Trail Functionality', () => {
    it('should maintain comprehensive audit trail', async () => {
      // Mock various authentication scenarios
      vi.mocked(envCredentialsService.getAccountByName).mockReturnValue({
        name: 'admin',
        email: 'admin@test.com',
        password: 'password123'
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
        error: null,
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Clear initialization logs to focus on user actions
      await waitFor(() => {
        expect(authLogger.getRecentLogs