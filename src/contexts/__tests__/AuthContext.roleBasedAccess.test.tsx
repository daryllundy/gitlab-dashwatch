import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { envCredentialsService } from '@/services/envCredentialsService';
import { supabase } from '@/lib/supabase';
import type { EnvAccount } from '@/types';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('@/services/envCredentialsService', () => ({
  envCredentialsService: {
    initialize: vi.fn(),
    getInitializationError: vi.fn(),
    loadConfiguration: vi.fn(),
    validateCredentials: vi.fn(),
    getAvailableAccounts: vi.fn(),
    getAccountByName: vi.fn(),
    getDefaultAccount: vi.fn(),
    isReady: vi.fn(),
  },
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Test component to access auth context
const TestComponent: React.FC = () => {
  const {
    user,
    userRoleInfo,
    hasPermission,
    canManageSettings,
    canViewSettings,
    canManageGitlab,
    canManageMonitoring,
    isAdmin,
    authenticationSource,
  } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? 'authenticated' : 'guest'}</div>
      <div data-testid="auth-source">{authenticationSource?.method || 'none'}</div>
      <div data-testid="role">{userRoleInfo.role}</div>
      <div data-testid="is-env-account">{userRoleInfo.isEnvironmentAccount.toString()}</div>
      <div data-testid="account-name">{userRoleInfo.accountName || 'none'}</div>
      <div data-testid="permissions-count">{userRoleInfo.permissions.length}</div>
      <div data-testid="can-manage-settings">{canManageSettings.toString()}</div>
      <div data-testid="can-view-settings">{canViewSettings.toString()}</div>
      <div data-testid="can-manage-gitlab">{canManageGitlab.toString()}</div>
      <div data-testid="can-manage-monitoring">{canManageMonitoring.toString()}</div>
      <div data-testid="is-admin">{isAdmin.toString()}</div>
    </div>
  );
};

describe('AuthContext Role-Based Access Control', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
  };

  const mockSession = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    (envCredentialsService.initialize as any).mockImplementation(() => {});
    (envCredentialsService.getInitializationError as any).mockReturnValue(null);
    (envCredentialsService.loadConfiguration as any).mockReturnValue({
      enabled: false,
      autoSignIn: false,
      accounts: [],
      allowFallback: true,
      strictMode: false,
    });
    (envCredentialsService.validateCredentials as any).mockReturnValue({
      isValid: true,
      errors: [],
    });
    (envCredentialsService.getAvailableAccounts as any).mockReturnValue([]);
    (envCredentialsService.isReady as any).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Guest User (No Authentication)', () => {
    it('should have guest role with limited permissions', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('guest');
        expect(screen.getByTestId('is-env-account')).toHaveTextContent('false');
        expect(screen.getByTestId('account-name')).toHaveTextContent('none');
        expect(screen.getByTestId('can-manage-settings')).toHaveTextContent('false');
        expect(screen.getByTestId('can-view-settings')).toHaveTextContent('false');
        expect(screen.getByTestId('can-manage-gitlab')).toHaveTextContent('false');
        expect(screen.getByTestId('can-manage-monitoring')).toHaveTextContent('false');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      });
    });
  });

  describe('Manual Authentication', () => {
    it('should have user role with standard permissions', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('user');
        expect(screen.getByTestId('is-env-account')).toHaveTextContent('false');
        expect(screen.getByTestId('can-manage-settings')).toHaveTextContent('true');
        expect(screen.getByTestId('can-view-settings')).toHaveTextContent('true');
        expect(screen.getByTestId('can-manage-gitlab')).toHaveTextContent('true');
        expect(screen.getByTestId('can-manage-monitoring')).toHaveTextContent('true');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      });
    });
  });

  describe('Environment Authentication with Admin Role', () => {
    it('should have admin role with full permissions', async () => {
      const adminAccount: EnvAccount = {
        name: 'admin-account',
        email: 'admin@example.com',
        password: 'password',
        role: 'admin',
      };

      // Mock initial session as null, then we'll simulate environment sign-in
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
      });

      (envCredentialsService.loadConfiguration as any).mockReturnValue({
        enabled: true,
        autoSignIn: true, // Enable auto sign-in to trigger environment authentication
        accounts: [adminAccount],
        allowFallback: true,
        strictMode: false,
      });

      (envCredentialsService.getAvailableAccounts as any).mockReturnValue([adminAccount]);
      (envCredentialsService.getAccountByName as any).mockReturnValue(adminAccount);
      (envCredentialsService.getDefaultAccount as any).mockReturnValue(adminAccount);

      // Mock successful environment sign-in
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // First wait for user to be authenticated
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('authenticated');
      }, { timeout: 2000 });

      // Then check role information
      await waitFor(() => {
        expect(screen.getByTestId('auth-source')).toHaveTextContent('environment');
        expect(screen.getByTestId('role')).toHaveTextContent('admin');
        expect(screen.getByTestId('is-env-account')).toHaveTextContent('true');
        expect(screen.getByTestId('account-name')).toHaveTextContent('admin-account');
        expect(screen.getByTestId('can-manage-settings')).toHaveTextContent('true');
        expect(screen.getByTestId('can-view-settings')).toHaveTextContent('true');
        expect(screen.getByTestId('can-manage-gitlab')).toHaveTextContent('true');
        expect(screen.getByTestId('can-manage-monitoring')).toHaveTextContent('true');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
      });
    });
  });

  describe('Environment Authentication with Viewer Role', () => {
    it('should have viewer role with read-only permissions', async () => {
      const viewerAccount: EnvAccount = {
        name: 'viewer-account',
        email: 'viewer@example.com',
        password: 'password',
        role: 'viewer',
      };

      // Mock initial session as null, then we'll simulate environment sign-in
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
      });

      (envCredentialsService.loadConfiguration as any).mockReturnValue({
        enabled: true,
        autoSignIn: true, // Enable auto sign-in to trigger environment authentication
        accounts: [viewerAccount],
        allowFallback: true,
        strictMode: false,
      });

      (envCredentialsService.getAvailableAccounts as any).mockReturnValue([viewerAccount]);
      (envCredentialsService.getAccountByName as any).mockReturnValue(viewerAccount);
      (envCredentialsService.getDefaultAccount as any).mockReturnValue(viewerAccount);

      // Mock successful environment sign-in
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // First wait for user to be authenticated
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('authenticated');
      }, { timeout: 2000 });

      // Then check role information
      await waitFor(() => {
        expect(screen.getByTestId('auth-source')).toHaveTextContent('environment');
        expect(screen.getByTestId('role')).toHaveTextContent('viewer');
        expect(screen.getByTestId('is-env-account')).toHaveTextContent('true');
        expect(screen.getByTestId('account-name')).toHaveTextContent('viewer-account');
        expect(screen.getByTestId('can-manage-settings')).toHaveTextContent('false');
        expect(screen.getByTestId('can-view-settings')).toHaveTextContent('true');
        expect(screen.getByTestId('can-manage-gitlab')).toHaveTextContent('false');
        expect(screen.getByTestId('can-manage-monitoring')).toHaveTextContent('false');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      });
    });
  });

  describe('Environment Authentication without Role', () => {
    it('should default to user role', async () => {
      const userAccount: EnvAccount = {
        name: 'user-account',
        email: 'user@example.com',
        password: 'password',
        // No role specified
      };

      // Mock initial session as null, then we'll simulate environment sign-in
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
      });

      (envCredentialsService.loadConfiguration as any).mockReturnValue({
        enabled: true,
        autoSignIn: true, // Enable auto sign-in to trigger environment authentication
        accounts: [userAccount],
        allowFallback: true,
        strictMode: false,
      });

      (envCredentialsService.getAvailableAccounts as any).mockReturnValue([userAccount]);
      (envCredentialsService.getAccountByName as any).mockReturnValue(userAccount);
      (envCredentialsService.getDefaultAccount as any).mockReturnValue(userAccount);

      // Mock successful environment sign-in
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // First wait for user to be authenticated
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('authenticated');
      }, { timeout: 2000 });

      // Then check role information
      await waitFor(() => {
        expect(screen.getByTestId('auth-source')).toHaveTextContent('environment');
        expect(screen.getByTestId('role')).toHaveTextContent('user');
        expect(screen.getByTestId('is-env-account')).toHaveTextContent('true');
        expect(screen.getByTestId('account-name')).toHaveTextContent('user-account');
        expect(screen.getByTestId('can-manage-settings')).toHaveTextContent('true');
        expect(screen.getByTestId('can-view-settings')).toHaveTextContent('true');
        expect(screen.getByTestId('can-manage-gitlab')).toHaveTextContent('true');
        expect(screen.getByTestId('can-manage-monitoring')).toHaveTextContent('true');
        expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
      });
    });
  });

  describe('Role Updates on Authentication Changes', () => {
    it('should update role info when signing out', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
      });

      let authStateCallback: any;
      (supabase.auth.onAuthStateChange as any).mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially should have user role
      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('user');
      });

      // Simulate sign out
      if (authStateCallback) {
        authStateCallback('SIGNED_OUT', null);
      }

      // Should revert to guest role
      await waitFor(() => {
        expect(screen.getByTestId('role')).toHaveTextContent('guest');
        expect(screen.getByTestId('is-env-account')).toHaveTextContent('false');
        expect(screen.getByTestId('can-manage-settings')).toHaveTextContent('false');
      });
    });
  });
});
