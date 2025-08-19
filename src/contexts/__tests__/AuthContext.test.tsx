import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import { envCredentialsService, EnvCredentialsError, EnvCredentialsErrorType } from '@/services/envCredentialsService';
import { supabase } from '@/lib/supabase';
import type { EnvAccount } from '@/types';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
  },
}));

vi.mock('@/services/envCredentialsService', () => ({
  envCredentialsService: {
    initialize: vi.fn(),
    loadConfiguration: vi.fn(),
    getAvailableAccounts: vi.fn(),
    getAccountByName: vi.fn(),
    getDefaultAccount: vi.fn(),
    getInitializationError: vi.fn(),
    validateCredentials: vi.fn(),
    hasErrors: vi.fn(),
  },
  EnvCredentialsError: class MockEnvCredentialsError extends Error {
    constructor(public type: string, message: string) {
      super(message);
      this.name = 'EnvCredentialsError';
    }
  },
  EnvCredentialsErrorType: {
    INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
    INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
    SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  },
}));

const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="env-accounts-count">{auth.envAccounts.length}</div>
      <div data-testid="env-auth-enabled">{auth.isEnvAuthEnabled.toString()}</div>
      <div data-testid="env-auto-signin-enabled">{auth.isEnvAutoSignInEnabled.toString()}</div>
      <div data-testid="auth-source">{auth.authenticationSource?.method || 'none'}</div>
      <button 
        data-testid="signin-env-button" 
        onClick={() => auth.signInWithEnvAccount('test-account')}
      >
        Sign In with Env Account
      </button>
    </div>
  );
};

describe('AuthContext Environment Credentials', () => {
  const mockEnvAccounts: EnvAccount[] = [
    {
      name: 'test-account',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin',
    },
    {
      name: 'dev-account',
      email: 'dev@example.com',
      password: 'devpass123',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
    
    // Default mock implementations
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    vi.mocked(envCredentialsService.initialize).mockImplementation(() => {});
    vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
      enabled: true,
      autoSignIn: false,
      accounts: mockEnvAccounts,
    });
    vi.mocked(envCredentialsService.getAvailableAccounts).mockReturnValue(mockEnvAccounts);
    vi.mocked(envCredentialsService.getInitializationError).mockReturnValue(null);
    vi.mocked(envCredentialsService.validateCredentials).mockReturnValue({
      isValid: true,
      errors: []
    });
    vi.mocked(envCredentialsService.hasErrors).mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize environment credentials on mount', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(envCredentialsService.initialize).toHaveBeenCalled();
      expect(envCredentialsService.loadConfiguration).toHaveBeenCalled();
      expect(envCredentialsService.getAvailableAccounts).toHaveBeenCalled();
    });

    expect(screen.getByTestId('env-accounts-count')).toHaveTextContent('2');
    expect(screen.getByTestId('env-auth-enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('env-auto-signin-enabled')).toHaveTextContent('false');
  });

  it('should handle environment credentials initialization failure', async () => {
    vi.mocked(envCredentialsService.initialize).mockImplementation(() => {
      throw new Error('Initialization failed');
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('env-accounts-count')).toHaveTextContent('0');
      expect(screen.getByTestId('env-auth-enabled')).toHaveTextContent('false');
      expect(screen.getByTestId('env-auto-signin-enabled')).toHaveTextContent('false');
    });
  });

  it('should successfully sign in with environment account', async () => {
    const mockAccount = mockEnvAccounts[0];
    vi.mocked(envCredentialsService.getAccountByName).mockReturnValue(mockAccount);
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: '123', email: mockAccount.email } as any, session: {} as any },
      error: null,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('signin-env-button')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId('signin-env-button').click();
    });

    await waitFor(() => {
      expect(envCredentialsService.getAccountByName).toHaveBeenCalledWith('test-account');
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockAccount.email,
        password: mockAccount.password,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-source')).toHaveTextContent('environment');
    });
  });

  it('should handle environment account not found', async () => {
    vi.mocked(envCredentialsService.getAccountByName).mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('signin-env-button')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId('signin-env-button').click();
    });

    await waitFor(() => {
      expect(envCredentialsService.getAccountByName).toHaveBeenCalledWith('test-account');
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });

  it('should handle environment sign-in authentication failure', async () => {
    const mockAccount = mockEnvAccounts[0];
    vi.mocked(envCredentialsService.getAccountByName).mockReturnValue(mockAccount);
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' } as any,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('signin-env-button')).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId('signin-env-button').click();
    });

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockAccount.email,
        password: mockAccount.password,
      });
    });

    // Should not set authentication source on failure
    expect(screen.getByTestId('auth-source')).toHaveTextContent('none');
  });

  it('should not attempt auto sign-in when disabled', async () => {
    vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
      enabled: true,
      autoSignIn: false,
      accounts: mockEnvAccounts,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('env-auto-signin-enabled')).toHaveTextContent('false');
    });

    expect(envCredentialsService.getDefaultAccount).not.toHaveBeenCalled();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('should not attempt auto sign-in when existing session exists', async () => {
    const mockSession = { user: { id: '123' }, access_token: 'token' };
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null,
    });

    vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
      enabled: true,
      autoSignIn: true,
      accounts: mockEnvAccounts,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('env-auto-signin-enabled')).toHaveTextContent('true');
    });

    // Should not attempt auto sign-in when session already exists
    expect(envCredentialsService.getDefaultAccount).not.toHaveBeenCalled();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('should handle environment credentials disabled', async () => {
    vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
      enabled: false,
      autoSignIn: false,
      accounts: [],
    });
    vi.mocked(envCredentialsService.getAvailableAccounts).mockReturnValue([]);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('env-accounts-count')).toHaveTextContent('0');
      expect(screen.getByTestId('env-auth-enabled')).toHaveTextContent('false');
      expect(screen.getByTestId('env-auto-signin-enabled')).toHaveTextContent('false');
    });

    expect(envCredentialsService.getDefaultAccount).not.toHaveBeenCalled();
  });

  describe('Auto Sign-in Functionality', () => {
    it('should attempt auto sign-in when enabled and no existing session', async () => {
      const defaultAccount = mockEnvAccounts[0];
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
        enabled: true,
        autoSignIn: true,
        accounts: mockEnvAccounts,
      });

      vi.mocked(envCredentialsService.getDefaultAccount).mockReturnValue(defaultAccount);
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: '123', email: defaultAccount.email } as any, session: {} as any },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(envCredentialsService.getDefaultAccount).toHaveBeenCalled();
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: defaultAccount.email,
          password: defaultAccount.password,
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('auth-source')).toHaveTextContent('environment');
      });
    });

    it('should handle auto sign-in failure and continue with manual auth', async () => {
      const defaultAccount = mockEnvAccounts[0];
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
        enabled: true,
        autoSignIn: true,
        accounts: mockEnvAccounts,
      });

      vi.mocked(envCredentialsService.getDefaultAccount).mockReturnValue(defaultAccount);
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' } as any,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(envCredentialsService.getDefaultAccount).toHaveBeenCalled();
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: defaultAccount.email,
          password: defaultAccount.password,
        });
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Auto sign-in failed, continuing with manual auth');
      });

      // Should not set authentication source on failure
      expect(screen.getByTestId('auth-source')).toHaveTextContent('none');

      consoleSpy.mockRestore();
    });

    it('should handle auto sign-in exception and continue with manual auth', async () => {
      const defaultAccount = mockEnvAccounts[0];
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
        enabled: true,
        autoSignIn: true,
        accounts: mockEnvAccounts,
      });

      vi.mocked(envCredentialsService.getDefaultAccount).mockReturnValue(defaultAccount);
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(envCredentialsService.getDefaultAccount).toHaveBeenCalled();
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: defaultAccount.email,
          password: defaultAccount.password,
        });
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Auto sign-in error:',
          expect.objectContaining({
            error: 'Network error',
            timestamp: expect.any(String)
          })
        );
      });

      // Should not set authentication source on exception
      expect(screen.getByTestId('auth-source')).toHaveTextContent('none');

      consoleErrorSpy.mockRestore();
    });

    it('should not attempt auto sign-in when no default account available', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
        enabled: true,
        autoSignIn: true,
        accounts: [],
      });

      vi.mocked(envCredentialsService.getAvailableAccounts).mockReturnValue([]);
      vi.mocked(envCredentialsService.getDefaultAccount).mockReturnValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('env-accounts-count')).toHaveTextContent('0');
      });

      // Should not call getDefaultAccount when no accounts are available
      expect(envCredentialsService.getDefaultAccount).not.toHaveBeenCalled();
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
      expect(screen.getByTestId('auth-source')).toHaveTextContent('none');
    });

    it('should not attempt auto sign-in when environment auth is disabled', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
        enabled: false,
        autoSignIn: true,
        accounts: mockEnvAccounts,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('env-auth-enabled')).toHaveTextContent('false');
      });

      expect(envCredentialsService.getDefaultAccount).not.toHaveBeenCalled();
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should log successful auto sign-in', async () => {
      const defaultAccount = mockEnvAccounts[0];
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
        enabled: true,
        autoSignIn: true,
        accounts: mockEnvAccounts,
      });

      vi.mocked(envCredentialsService.getDefaultAccount).mockReturnValue(defaultAccount);
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: { id: '123', email: defaultAccount.email } as any, session: {} as any },
        error: null,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Attempting auto sign-in with environment account');
        expect(consoleSpy).toHaveBeenCalledWith(`Auto sign-in successful with environment account: ${defaultAccount.name}`);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors and show warning toast', async () => {
      const mockError = new (vi.mocked(EnvCredentialsError))(
        EnvCredentialsErrorType.INITIALIZATION_FAILED,
        'Failed to initialize'
      );
      
      vi.mocked(envCredentialsService.getInitializationError).mockReturnValue(mockError);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Environment Authentication Warning",
          description: "Environment authentication system failed to initialize properly.",
          variant: "default",
        });
      });
    });

    it('should handle validation errors and show warning toast', async () => {
      const mockValidationErrors = [
        new (vi.mocked(EnvCredentialsError))(
          EnvCredentialsErrorType.INVALID_CONFIGURATION,
          'Invalid config'
        )
      ];
      
      vi.mocked(envCredentialsService.validateCredentials).mockReturnValue({
        isValid: false,
        errors: mockValidationErrors
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Environment Authentication Issues",
          description: "Found 1 configuration issue(s). Check console for details.",
          variant: "default",
        });
      });
    });

    it('should handle account not found error in signInWithEnvAccount', async () => {
      const mockError = new (vi.mocked(EnvCredentialsError))(
        EnvCredentialsErrorType.ACCOUNT_NOT_FOUND,
        'Account not found'
      );
      
      vi.mocked(envCredentialsService.getAccountByName).mockImplementation(() => {
        throw mockError;
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('signin-env-button')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('signin-env-button').click();
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Environment Account Error",
          description: "The requested environment account is not configured or available.",
          variant: "destructive",
        });
      });
    });

    it('should handle different authentication error types', async () => {
      const mockAccount = mockEnvAccounts[0];
      vi.mocked(envCredentialsService.getAccountByName).mockReturnValue(mockAccount);
      
      const testCases = [
        {
          errorMessage: 'Invalid login credentials',
          expectedDescription: 'The environment account credentials are invalid. Please check your configuration.'
        },
        {
          errorMessage: 'Email not confirmed',
          expectedDescription: 'The environment account email needs to be confirmed before signing in.'
        },
        {
          errorMessage: 'Too many requests',
          expectedDescription: 'Too many sign-in attempts. Please try again later.'
        },
        {
          errorMessage: 'Network error occurred',
          expectedDescription: 'Network error occurred. Please check your connection and try again.'
        },
        {
          errorMessage: 'Unknown error',
          expectedDescription: 'Failed to authenticate with environment account'
        }
      ];

      for (const testCase of testCases) {
        mockToast.mockClear();

        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
          data: { user: null, session: null },
          error: { message: testCase.errorMessage } as any,
        });

        const { unmount } = render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('signin-env-button')).toBeInTheDocument();
        });

        await act(async () => {
          screen.getByTestId('signin-env-button').click();
        });

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: "Environment Sign In Failed",
            description: testCase.expectedDescription,
            variant: "destructive",
          });
        });

        unmount();
      }
    });

    it('should log sanitized error information without credentials', async () => {
      const mockAccount = mockEnvAccounts[0];
      vi.mocked(envCredentialsService.getAccountByName).mockReturnValue(mockAccount);
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' } as any,
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('signin-env-button')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('signin-env-button').click();
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Environment authentication failed:',
          expect.objectContaining({
            accountName: mockAccount.name,
            errorType: 'invalid_credentials',
            timestamp: expect.any(String)
          })
        );
      });

      // Verify no credentials are logged
      const loggedData = consoleErrorSpy.mock.calls[0][1];
      expect(JSON.stringify(loggedData)).not.toContain(mockAccount.password);
      expect(JSON.stringify(loggedData)).not.toContain(mockAccount.email);

      consoleErrorSpy.mockRestore();
    });

    it('should handle unexpected errors in signInWithEnvAccount', async () => {
      vi.mocked(envCredentialsService.getAccountByName).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('signin-env-button')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('signin-env-button').click();
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Environment Account Error",
          description: "Failed to retrieve environment account configuration",
          variant: "destructive",
        });
      });
    });

    it('should handle auto sign-in errors gracefully without disrupting UX', async () => {
      const defaultAccount = mockEnvAccounts[0];
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      vi.mocked(envCredentialsService.loadConfiguration).mockReturnValue({
        enabled: true,
        autoSignIn: true,
        accounts: mockEnvAccounts,
      });

      vi.mocked(envCredentialsService.getDefaultAccount).mockReturnValue(defaultAccount);
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(new Error('Network timeout'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Auto sign-in error:',
          expect.objectContaining({
            error: 'Network timeout',
            timestamp: expect.any(String)
          })
        );
      });

      // Should not show toast for auto sign-in failures
      expect(mockToast).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
