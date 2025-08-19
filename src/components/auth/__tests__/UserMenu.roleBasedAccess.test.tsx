import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserMenu } from '../UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/services/roleService';

// Mock the useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderUserMenu = () => {
  return render(
    <BrowserRouter>
      <UserMenu />
    </BrowserRouter>
  );
};

describe('UserMenu Role-Based Access Control', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
  };

  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('No User', () => {
    it('should not render when user is null', () => {
      (useAuth as any).mockReturnValue({
        user: null,
        signOut: mockSignOut,
        userRoleInfo: { role: UserRole.GUEST, permissions: [], isEnvironmentAccount: false },
        canViewSettings: false,
      });

      const { container } = renderUserMenu();
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Manual Authentication User', () => {
    it('should show user role and settings option for regular users', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        signOut: mockSignOut,
        userRoleInfo: { 
          role: UserRole.USER, 
          permissions: [], 
          isEnvironmentAccount: false 
        },
        canViewSettings: true,
      });

      renderUserMenu();

      // Click to open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Should show user email
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      
      // Should show user role
      expect(screen.getByText('User')).toBeInTheDocument();
      
      // Should show settings option
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      // Should show sign out option
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });

  describe('Environment Account Users', () => {
    it('should show admin role and account name for admin environment accounts', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        signOut: mockSignOut,
        userRoleInfo: { 
          role: UserRole.ADMIN, 
          permissions: [], 
          isEnvironmentAccount: true,
          accountName: 'admin-account'
        },
        canViewSettings: true,
      });

      renderUserMenu();

      // Click to open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Should show user email
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      
      // Should show admin role and account name
      expect(screen.getByText('Administrator • admin-account')).toBeInTheDocument();
      
      // Should show settings option
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should show viewer role and hide settings for viewer environment accounts', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        signOut: mockSignOut,
        userRoleInfo: { 
          role: UserRole.VIEWER, 
          permissions: [], 
          isEnvironmentAccount: true,
          accountName: 'viewer-account'
        },
        canViewSettings: false,
      });

      renderUserMenu();

      // Click to open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Should show user email
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      
      // Should show viewer role and account name
      expect(screen.getByText('Viewer • viewer-account')).toBeInTheDocument();
      
      // Should not show settings option
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      
      // Should still show sign out option
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('should show guest role for guest environment accounts', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        signOut: mockSignOut,
        userRoleInfo: { 
          role: UserRole.GUEST, 
          permissions: [], 
          isEnvironmentAccount: true,
          accountName: 'guest-account'
        },
        canViewSettings: false,
      });

      renderUserMenu();

      // Click to open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Should show guest role and account name
      expect(screen.getByText('Guest • guest-account')).toBeInTheDocument();
      
      // Should not show settings option
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Environment Account without Account Name', () => {
    it('should show role without account name when accountName is undefined', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        signOut: mockSignOut,
        userRoleInfo: { 
          role: UserRole.USER, 
          permissions: [], 
          isEnvironmentAccount: true,
          // accountName is undefined
        },
        canViewSettings: true,
      });

      renderUserMenu();

      // Click to open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Should show just the role without account name
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.queryByText('User •')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call signOut when sign out is clicked', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        signOut: mockSignOut,
        userRoleInfo: { 
          role: UserRole.USER, 
          permissions: [], 
          isEnvironmentAccount: false 
        },
        canViewSettings: true,
      });

      renderUserMenu();

      // Click to open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Click sign out
      const signOutButton = screen.getByText('Sign out');
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledOnce();
    });

    it('should navigate to settings when settings is clicked', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        signOut: mockSignOut,
        userRoleInfo: { 
          role: UserRole.USER, 
          permissions: [], 
          isEnvironmentAccount: false 
        },
        canViewSettings: true,
      });

      renderUserMenu();

      // Click to open dropdown
      const trigger = screen.getByRole('button');
      fireEvent.click(trigger);

      // Click settings
      const settingsButton = screen.getByText('Settings');
      fireEvent.click(settingsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });
  });
});
