import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { useAuth } from '@/contexts/AuthContext';

// Mock the useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock the auth components
vi.mock('@/components/auth', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
  AuthDialog: ({ open }: { open: boolean }) => 
    open ? <div data-testid="auth-dialog">Auth Dialog</div> : null,
}));

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar Role-Based Access Control', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Guest User (No Authentication)', () => {
    it('should not show settings link for guest users', () => {
      (useAuth as any).mockReturnValue({
        user: null,
        canViewSettings: false,
      });

      renderNavbar();

      // Should show sign in button
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      
      // Should not show settings link in desktop nav
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      
      // Should not show settings button in mobile nav
      expect(screen.queryByLabelText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User with View Settings Permission', () => {
    it('should show settings link for users who can view settings', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        canViewSettings: true,
      });

      renderNavbar();

      // Should show user menu instead of sign in
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      
      // Should show settings link in desktop nav
      expect(screen.getByText('Settings')).toBeInTheDocument();
      
      // Should show settings button in mobile nav
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });
  });

  describe('Authenticated User without View Settings Permission', () => {
    it('should not show settings link for users who cannot view settings', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        canViewSettings: false,
      });

      renderNavbar();

      // Should show user menu
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      
      // Should not show settings link in desktop nav
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      
      // Should not show settings button in mobile nav
      expect(screen.queryByLabelText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Environment Account Users', () => {
    it('should show settings for admin environment accounts', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        canViewSettings: true,
      });

      renderNavbar();

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    });

    it('should not show settings for viewer environment accounts', () => {
      (useAuth as any).mockReturnValue({
        user: mockUser,
        canViewSettings: false,
      });

      renderNavbar();

      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Settings')).not.toBeInTheDocument();
    });
  });
});
