import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../Settings';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { UserRole } from '@/services/roleService';

// Mock the contexts
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

// Mock the auth dialog
vi.mock('@/components/auth', () => ({
  AuthDialog: ({ open }: { open: boolean }) => 
    open ? <div data-testid="auth-dialog">Auth Dialog</div> : null,
}));

const mockSettings = {
  gitlab: { instances: [] },
  uptime: { websites: [] },
  dns: { domains: [] },
  servers: { instances: [] },
};

const renderSettings = () => {
  return render(
    <BrowserRouter>
      <Settings />
    </BrowserRouter>
  );
};

describe('Settings Page Role-Based Access Control', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
  };

  const mockSaveSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default settings context mock
    (useSettings as any).mockReturnValue({
      settings: mockSettings,
      saveSettings: mockSaveSettings,
      isLoading: false,
    });
  });

  describe('Access Denied for Users without View Permission', () => {
    it('should show access denied message for users who cannot view settings', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        canManageSettings: false,
        canViewSettings: false,
        userRoleInfo: {
          role: UserRole.GUEST,
          permissions: [],
          isEnvironmentAccount: false,
        },
      });

      renderSettings();

      expect(screen.getByText('Access Denied:')).toBeInTheDocument();
      expect(screen.getByText(/You don't have permission to view settings/)).toBeInTheDocument();
      
      // Should not show the settings form
      expect(screen.queryByText('GitLab Projects')).not.toBeInTheDocument();
    });

    it('should show environment account info in access denied message', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        canManageSettings: false,
        canViewSettings: false,
        userRoleInfo: {
          role: UserRole.GUEST,
          permissions: [],
          isEnvironmentAccount: true,
          accountName: 'guest-account',
        },
      });

      renderSettings();

      expect(screen.getByText(/Your environment account "guest-account" has guest role/)).toBeInTheDocument();
    });
  });

  describe('Read-Only Mode for Users with View but not Manage Permission', () => {
    it('should show read-only warning for viewer users', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        canManageSettings: false,
        canViewSettings: true,
        userRoleInfo: {
          role: UserRole.VIEWER,
          permissions: [],
          isEnvironmentAccount: true,
          accountName: 'viewer-account',
        },
      });

      renderSettings();

      expect(screen.getByText('Read-Only Mode:')).toBeInTheDocument();
      expect(screen.getByText(/You have view-only access to settings/)).toBeInTheDocument();
      expect(screen.getByText(/Your environment account "viewer-account" has viewer role/)).toBeInTheDocument();
      
      // Should show the settings form
      expect(screen.getByText('GitLab Projects')).toBeInTheDocument();
    });

    it('should disable all input fields in read-only mode', () => {
      const settingsWithData = {
        gitlab: { 
          instances: [{ name: 'Test GitLab', url: 'https://gitlab.example.com', token: '' }] 
        },
        uptime: { 
          websites: [{ name: 'Test Website', url: 'https://example.com' }] 
        },
        dns: { 
          domains: [{ domain: 'example.com', recordTypes: ['A'] }] 
        },
        servers: { 
          instances: [{ name: 'Test Server', ip: '192.168.1.1', netdataUrl: 'http://192.168.1.1:19999' }] 
        },
      };

      (useSettings as any).mockReturnValue({
        settings: settingsWithData,
        saveSettings: mockSaveSettings,
        isLoading: false,
      });

      (useAuth as any).mockReturnValue({
        user: mockUser,
        canManageSettings: false,
        canViewSettings: true,
        userRoleInfo: {
          role: UserRole.VIEWER,
          permissions: [],
          isEnvironmentAccount: true,
          accountName: 'viewer-account',
        },
      });

      renderSettings();

      // Check GitLab tab inputs are disabled
      const gitlabNameInput = screen.getByDisplayValue('Test GitLab');
      expect(gitlabNameInput).toBeDisabled();

      const gitlabUrlInput = screen.getByDisplayValue('https://gitlab.example.com');
      expect(gitlabUrlInput).toBeDisabled();

      // Check buttons are disabled
      const removeButtons = screen.getAllByText('Remove');
      removeButtons.forEach(button => {
        expect(button).toBeDisabled();
      });

      const addButtons = screen.getAllByText(/Add/);
      addButtons.forEach(button => {
        expect(button).toBeDisabled();
      });

      // Check save button is disabled
      const saveButton = screen.getByText('Save Settings');
      expect(saveButton).toBeDisabled();
    });

    it('should disable inputs in all tabs for read-only users', async () => {
      const settingsWithData = {
        gitlab: { instances: [] },
        uptime: { 
          websites: [{ name: 'Test Website', url: 'https://example.com' }] 
        },
        dns: { 
          domains: [{ domain: 'example.com', recordTypes: ['A'] }] 
        },
        servers: { 
          instances: [{ name: 'Test Server', ip: '192.168.1.1', netdataUrl: 'http://192.168.1.1:19999' }] 
        },
      };

      (useSettings as any).mockReturnValue({
        settings: settingsWithData,
        saveSettings: mockSaveSettings,
        isLoading: false,
      });

      (useAuth as any).mockReturnValue({
        user: mockUser,
        canManageSettings: false,
        canViewSettings: true,
        userRoleInfo: {
          role: UserRole.VIEWER,
          permissions: [],
          isEnvironmentAccount: false,
        },
      });

      renderSettings();

      // Test Website Uptime tab
      fireEvent.click(screen.getByText('Website Uptime'));
      const websiteNameInput = await screen.findByDisplayValue('Test Website');
      expect(websiteNameInput).toBeDisabled();

      // Test DNS Records tab
      fireEvent.click(screen.getByText('DNS Records'));
      const domainInput = await screen.findByDisplayValue('example.com');
      expect(domainInput).toBeDisabled();

      // Test Server Monitoring tab
      fireEvent.click(screen.getByText('Server Monitoring'));
      const serverNameInput = await screen.findByDisplayValue('Test Server');
      expect(serverNameInput).toBeDisabled();
    });
  });

  describe('Full Access for Users with Manage Permission', () => {
    it('should allow full access for admin users', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        canManageSettings: true,
        canViewSettings: true,
        userRoleInfo: {
          role: UserRole.ADMIN,
          permissions: [],
          isEnvironmentAccount: true,
          accountName: 'admin-account',
        },
      });

      renderSettings();

      // Should not show read-only warning
      expect(screen.queryByText('Read-Only Mode:')).not.toBeInTheDocument();
      
      // Should show the settings form
      expect(screen.getByText('GitLab Projects')).toBeInTheDocument();
      
      // Add buttons should be enabled
      const addGitlabButton = screen.getByText('Add GitLab Instance');
      expect(addGitlabButton).not.toBeDisabled();
      
      // Save button should be enabled
      const saveButton = screen.getByText('Save Settings');
      expect(saveButton).not.toBeDisabled();
    });

    it('should allow full access for regular users', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        canManageSettings: true,
        canViewSettings: true,
        userRoleInfo: {
          role: UserRole.USER,
          permissions: [],
          isEnvironmentAccount: false,
        },
      });

      renderSettings();

      // Should not show read-only warning
      expect(screen.queryByText('Read-Only Mode:')).not.toBeInTheDocument();
      
      // Add buttons should be enabled
      const addGitlabButton = screen.getByText('Add GitLab Instance');
      expect(addGitlabButton).not.toBeDisabled();
      
      // Save button should be enabled
      const saveButton = screen.getByText('Save Settings');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Guest Users (Not Authenticated)', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue({
        user: null,
        canManageSettings: false,
        canViewSettings: true, // Guests can view and modify settings locally
        userRoleInfo: {
          role: UserRole.GUEST,
          permissions: [],
          isEnvironmentAccount: false,
        },
      });
    });

    it('should show authentication required warning for guest users', () => {

      renderSettings();

      expect(screen.getByText('Authentication Required:')).toBeInTheDocument();
      expect(screen.getByText(/To save your settings permanently, please/)).toBeInTheDocument();
      
      // Should show sign in link
      const signInLink = screen.getByText('sign in');
      expect(signInLink).toBeInTheDocument();
      
      // Should show the settings form (guest can modify locally)
      expect(screen.getByText('GitLab Projects')).toBeInTheDocument();
    });

    it('should open auth dialog when sign in is clicked', () => {
      renderSettings();

      const signInLink = screen.getByText('sign in');
      fireEvent.click(signInLink);

      expect(screen.getByTestId('auth-dialog')).toBeInTheDocument();
    });
  });

  describe('Save Settings Behavior', () => {
    it('should prevent saving for users without manage permission', async () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        canManageSettings: false,
        canViewSettings: true,
        userRoleInfo: {
          role: UserRole.VIEWER,
          permissions: [],
          isEnvironmentAccount: false,
        },
      });

      renderSettings();

      const saveButton = screen.getByText('Save Settings');
      expect(saveButton).toBeDisabled();
      
      // Even if somehow clicked, should not call saveSettings
      fireEvent.click(saveButton);
      expect(mockSaveSettings).not.toHaveBeenCalled();
    });

    it('should allow saving for users with manage permission', async () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        canManageSettings: true,
        canViewSettings: true,
        userRoleInfo: {
          role: UserRole.USER,
          permissions: [],
          isEnvironmentAccount: false,
        },
      });

      renderSettings();

      const saveButton = screen.getByText('Save Settings');
      expect(saveButton).not.toBeDisabled();
      
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(mockSaveSettings).toHaveBeenCalledWith(mockSettings);
      });
    });
  });
});
