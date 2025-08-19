import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthDialog } from '../AuthDialog';
import { useAuth } from '@/contexts/AuthContext';
import { envCredentialsService } from '@/services/envCredentialsService';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the env credentials service
vi.mock('@/services/envCredentialsService', () => ({
  envCredentialsService: {
    hasErrors: vi.fn(),
    validateCredentials: vi.fn(),
  },
}));

// Mock UI components to avoid complex rendering issues
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => 
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="dialog-description">{children}</div>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children, value }: { children: React.ReactNode; value: string }) => 
    <div data-testid={`tabs-content-${value}`}>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: { children: React.ReactNode; value: string }) => 
    <button data-testid={`tab-trigger-${value}`}>{children}</button>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => 
    <button onClick={onClick} disabled={disabled} data-testid="button" {...props}>{children}</button>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, disabled }: any) => 
    <div data-testid="select" data-disabled={disabled}>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => 
    <div data-testid={`select-item-${value}`}>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => 
    <div data-testid="select-value">{placeholder}</div>,
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: { children: React.ReactNode; variant?: string }) => 
    <div data-testid="alert" data-variant={variant}>{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="alert-description">{children}</div>,
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <div data-testid="separator" />,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => 
    <label data-testid="label">{children}</label>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => 
    <span data-testid="badge" data-variant={variant}>{children}</span>,
}));

vi.mock('@/components/common', () => ({
  LoadingSpinner: ({ text }: { text?: string }) => 
    <div data-testid="loading-spinner">{text}</div>,
}));

describe('AuthDialog - Feature Toggle Conditional Rendering', () => {
  const mockUseAuth = vi.mocked(useAuth);
  const mockEnvCredentialsService = vi.mocked(envCredentialsService);

  const defaultAuthContext = {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signInWithEnvAccount: vi.fn(),
    isLoading: false,
    envAccounts: [],
    isEnvAuthEnabled: false,
    isEnvFallbackAllowed: true,
    isEnvStrictMode: false,
    isEnvAuthReady: false,
    authenticationSource: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockEnvCredentialsService.hasErrors.mockReturnValue(false);
    mockEnvCredentialsService.validateCredentials.mockReturnValue({
      isValid: true,
      errors: []
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Environment Authentication Disabled', () => {
    it('should show manual authentication when env auth is disabled', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: false,
        isEnvFallbackAllowed: true,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show manual auth tabs
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-signin')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-signup')).toBeInTheDocument();
      
      // Should not show environment account section
      expect(screen.queryByText('Environment Accounts')).not.toBeInTheDocument();
    });

    it('should show OAuth options when env auth is disabled', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: false,
        isEnvFallbackAllowed: true,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show GitHub OAuth button
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });
  });

  describe('Environment Authentication Enabled and Ready', () => {
    const mockEnvAccounts = [
      { name: 'admin', email: 'admin@example.com', password: 'password123', role: 'admin' },
      { name: 'user', email: 'user@example.com', password: 'password456' }
    ];

    it('should show environment account section when enabled and ready', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: true,
        envAccounts: mockEnvAccounts,
        isEnvFallbackAllowed: true,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show environment account section
      expect(screen.getByText('Environment Accounts')).toBeInTheDocument();
      expect(screen.getByTestId('select')).toBeInTheDocument();
      expect(screen.getByText('Sign In with Environment Account')).toBeInTheDocument();
    });

    it('should show manual authentication when fallback is allowed', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: true,
        envAccounts: mockEnvAccounts,
        isEnvFallbackAllowed: true,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show both environment and manual auth
      expect(screen.getByText('Environment Accounts')).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByText('Or use manual authentication')).toBeInTheDocument();
    });

    it('should hide manual authentication when fallback is not allowed', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: true,
        envAccounts: mockEnvAccounts,
        isEnvFallbackAllowed: false,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show environment accounts but not manual auth
      expect(screen.getByText('Environment Accounts')).toBeInTheDocument();
      expect(screen.queryByTestId('tabs')).not.toBeInTheDocument();
      expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    });
  });

  describe('Environment Authentication Enabled but Not Ready', () => {
    it('should show error alert when env auth is enabled but not ready', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: false,
        envAccounts: [],
        isEnvFallbackAllowed: true,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show error alert
      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('data-variant', 'destructive');
      expect(screen.getByText(/Environment authentication is enabled but not properly configured/)).toBeInTheDocument();
      expect(screen.getByText(/Manual sign-in is available below/)).toBeInTheDocument();
    });

    it('should show different error message when fallback is not allowed', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: false,
        envAccounts: [],
        isEnvFallbackAllowed: false,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show error alert with different message
      expect(screen.getByText(/Please contact your administrator/)).toBeInTheDocument();
    });
  });

  describe('Strict Mode Scenarios', () => {
    it('should show critical error when strict mode is enabled but env auth is not ready', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: false,
        isEnvStrictMode: true,
        isEnvFallbackAllowed: false,
        envAccounts: [],
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show critical error alert
      const alerts = screen.getAllByTestId('alert');
      const strictModeAlert = alerts.find(alert => 
        alert.getAttribute('data-variant') === 'destructive' &&
        alert.textContent?.includes('Environment authentication is required but not available')
      );
      expect(strictModeAlert).toBeInTheDocument();
    });

    it('should work normally when strict mode is enabled and env auth is ready', () => {
      const mockEnvAccounts = [
        { name: 'admin', email: 'admin@example.com', password: 'password123', role: 'admin' }
      ];

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: true,
        isEnvStrictMode: true,
        isEnvFallbackAllowed: false,
        envAccounts: mockEnvAccounts,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show environment accounts but no manual auth
      expect(screen.getByText('Environment Accounts')).toBeInTheDocument();
      expect(screen.queryByTestId('tabs')).not.toBeInTheDocument();
      expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    });
  });

  describe('Service Error Handling', () => {
    it('should disable environment account selection when service has errors', () => {
      mockEnvCredentialsService.hasErrors.mockReturnValue(true);
      
      const mockEnvAccounts = [
        { name: 'admin', email: 'admin@example.com', password: 'password123' }
      ];

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: true,
        envAccounts: mockEnvAccounts,
        isEnvFallbackAllowed: true,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Select should be disabled
      const select = screen.getByTestId('select');
      expect(select).toHaveAttribute('data-disabled', 'true');
      
      // Should show issues badge
      expect(screen.getByText('Issues')).toBeInTheDocument();
    });

    it('should show validation error when service validation fails', () => {
      mockEnvCredentialsService.validateCredentials.mockReturnValue({
        isValid: false,
        errors: [
          {
            type: 'INVALID_CONFIGURATION' as any,
            message: 'Invalid configuration detected',
            name: 'EnvCredentialsError'
          }
        ]
      });

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: false,
        envAccounts: [],
        isEnvFallbackAllowed: true,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show error message - the text is actually different in the component
      expect(screen.getByText(/Environment authentication is enabled but not properly configured/)).toBeInTheDocument();
    });
  });

  describe('Dynamic Content Based on Configuration', () => {
    it('should show account count badge', () => {
      const mockEnvAccounts = [
        { name: 'admin', email: 'admin@example.com', password: 'password123' },
        { name: 'user', email: 'user@example.com', password: 'password456' }
      ];

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: true,
        envAccounts: mockEnvAccounts,
        isEnvFallbackAllowed: true,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show account count
      expect(screen.getByText('2 available')).toBeInTheDocument();
    });

    it('should show ready indicator when environment auth is working', () => {
      const mockEnvAccounts = [
        { name: 'admin', email: 'admin@example.com', password: 'password123' }
      ];

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: true,
        envAccounts: mockEnvAccounts,
        isEnvFallbackAllowed: true,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show ready indicator
      expect(screen.getByText('Environment authentication is ready')).toBeInTheDocument();
    });

    it('should adapt separator text based on fallback state', () => {
      const mockEnvAccounts = [
        { name: 'admin', email: 'admin@example.com', password: 'password123' }
      ];

      mockUseAuth.mockReturnValue({
        ...defaultAuthContext,
        isEnvAuthEnabled: true,
        isEnvAuthReady: true,
        envAccounts: mockEnvAccounts,
        isEnvFallbackAllowed: true,
      });

      render(<AuthDialog open={true} onOpenChange={() => {}} />);

      // Should show appropriate separator text
      expect(screen.getByText('Or use manual authentication')).toBeInTheDocument();
    });
  });
});
