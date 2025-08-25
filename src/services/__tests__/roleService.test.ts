import { describe, it, expect, beforeEach, vi } from 'vitest';
import { roleService, UserRole, Permission } from '../auth/roleService';
import type { User } from '@supabase/supabase-js';
import type { EnvAccount, AuthenticationSource } from '@/types';

describe('RoleService', () => {
  let mockUser: User;
  let mockEnvAccount: EnvAccount;
  let mockAuthSource: AuthenticationSource;

  beforeEach(() => {
    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {},
    } as User;

    mockEnvAccount = {
      name: 'test-admin',
      email: 'admin@example.com',
      password: 'password',
      role: 'admin',
    };

    mockAuthSource = {
      method: 'environment',
      accountName: 'test-admin',
      timestamp: new Date(),
    };
  });

  describe('getUserRoleInfo', () => {
    it('should return guest role for null user', () => {
      const roleInfo = roleService.getUserRoleInfo(null, null);
      
      expect(roleInfo.role).toBe(UserRole.GUEST);
      expect(roleInfo.permissions).toEqual([Permission.VIEW_MONITORING]);
      expect(roleInfo.isEnvironmentAccount).toBe(false);
      expect(roleInfo.accountName).toBeUndefined();
    });

    it('should return user role for manual authentication', () => {
      const manualAuthSource: AuthenticationSource = {
        method: 'manual',
        timestamp: new Date(),
      };

      const roleInfo = roleService.getUserRoleInfo(mockUser, manualAuthSource);
      
      expect(roleInfo.role).toBe(UserRole.USER);
      expect(roleInfo.permissions).toContain(Permission.MANAGE_SETTINGS);
      expect(roleInfo.isEnvironmentAccount).toBe(false);
      expect(roleInfo.accountName).toBeUndefined();
    });

    it('should return admin role for environment account with admin role', () => {
      const roleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, mockEnvAccount);
      
      expect(roleInfo.role).toBe(UserRole.ADMIN);
      expect(roleInfo.permissions).toContain(Permission.SYSTEM_ADMIN);
      expect(roleInfo.isEnvironmentAccount).toBe(true);
      expect(roleInfo.accountName).toBe('test-admin');
    });

    it('should return viewer role for environment account with viewer role', () => {
      const viewerAccount: EnvAccount = {
        ...mockEnvAccount,
        role: 'viewer',
      };

      const roleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, viewerAccount);
      
      expect(roleInfo.role).toBe(UserRole.VIEWER);
      expect(roleInfo.permissions).toContain(Permission.VIEW_SETTINGS);
      expect(roleInfo.permissions).not.toContain(Permission.MANAGE_SETTINGS);
      expect(roleInfo.isEnvironmentAccount).toBe(true);
    });

    it('should default to user role for environment account without role', () => {
      const accountWithoutRole: EnvAccount = {
        name: 'test-user',
        email: 'user@example.com',
        password: 'password',
      };

      const roleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, accountWithoutRole);
      
      expect(roleInfo.role).toBe(UserRole.USER);
      expect(roleInfo.isEnvironmentAccount).toBe(true);
    });

    it('should handle unknown role strings gracefully', () => {
      const unknownRoleAccount: EnvAccount = {
        ...mockEnvAccount,
        role: 'unknown-role',
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const roleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, unknownRoleAccount);
      
      expect(roleInfo.role).toBe(UserRole.USER);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown role "unknown-role", defaulting to USER role')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('permission checking methods', () => {
    it('should correctly check hasPermission', () => {
      const adminRoleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, mockEnvAccount);
      const guestRoleInfo = roleService.getUserRoleInfo(null, null);

      expect(roleService.hasPermission(adminRoleInfo, Permission.SYSTEM_ADMIN)).toBe(true);
      expect(roleService.hasPermission(guestRoleInfo, Permission.SYSTEM_ADMIN)).toBe(false);
      expect(roleService.hasPermission(guestRoleInfo, Permission.VIEW_MONITORING)).toBe(true);
    });

    it('should correctly check hasAnyPermission', () => {
      const viewerAccount: EnvAccount = { ...mockEnvAccount, role: 'viewer' };
      const viewerRoleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, viewerAccount);

      const permissions = [Permission.MANAGE_SETTINGS, Permission.VIEW_SETTINGS];
      expect(roleService.hasAnyPermission(viewerRoleInfo, permissions)).toBe(true);

      const adminPermissions = [Permission.SYSTEM_ADMIN, Permission.MANAGE_USERS];
      expect(roleService.hasAnyPermission(viewerRoleInfo, adminPermissions)).toBe(false);
    });

    it('should correctly check hasAllPermissions', () => {
      const adminRoleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, mockEnvAccount);
      const viewerAccount: EnvAccount = { ...mockEnvAccount, role: 'viewer' };
      const viewerRoleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, viewerAccount);

      const viewPermissions = [Permission.VIEW_SETTINGS, Permission.VIEW_MONITORING];
      expect(roleService.hasAllPermissions(adminRoleInfo, viewPermissions)).toBe(true);
      expect(roleService.hasAllPermissions(viewerRoleInfo, viewPermissions)).toBe(true);

      const managePermissions = [Permission.MANAGE_SETTINGS, Permission.MANAGE_MONITORING];
      expect(roleService.hasAllPermissions(adminRoleInfo, managePermissions)).toBe(true);
      expect(roleService.hasAllPermissions(viewerRoleInfo, managePermissions)).toBe(false);
    });

    it('should correctly identify admin users', () => {
      const adminRoleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, mockEnvAccount);
      const userRoleInfo = roleService.getUserRoleInfo(mockUser, { method: 'manual', timestamp: new Date() });

      expect(roleService.isAdmin(adminRoleInfo)).toBe(true);
      expect(roleService.isAdmin(userRoleInfo)).toBe(false);
    });

    it('should correctly check settings permissions', () => {
      const adminRoleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, mockEnvAccount);
      const viewerAccount: EnvAccount = { ...mockEnvAccount, role: 'viewer' };
      const viewerRoleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, viewerAccount);
      const guestRoleInfo = roleService.getUserRoleInfo(null, null);

      // Admin can manage and view
      expect(roleService.canManageSettings(adminRoleInfo)).toBe(true);
      expect(roleService.canViewSettings(adminRoleInfo)).toBe(true);

      // Viewer can view but not manage
      expect(roleService.canManageSettings(viewerRoleInfo)).toBe(false);
      expect(roleService.canViewSettings(viewerRoleInfo)).toBe(true);

      // Guest cannot manage or view settings
      expect(roleService.canManageSettings(guestRoleInfo)).toBe(false);
      expect(roleService.canViewSettings(guestRoleInfo)).toBe(false);
    });

    it('should correctly check GitLab permissions', () => {
      const adminRoleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, mockEnvAccount);
      const viewerAccount: EnvAccount = { ...mockEnvAccount, role: 'viewer' };
      const viewerRoleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, viewerAccount);

      expect(roleService.canManageGitlab(adminRoleInfo)).toBe(true);
      expect(roleService.canManageGitlab(viewerRoleInfo)).toBe(false);
    });

    it('should correctly check monitoring permissions', () => {
      const adminRoleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, mockEnvAccount);
      const guestRoleInfo = roleService.getUserRoleInfo(null, null);

      expect(roleService.canManageMonitoring(adminRoleInfo)).toBe(true);
      expect(roleService.canManageMonitoring(guestRoleInfo)).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('should return correct role display names', () => {
      expect(roleService.getRoleDisplayName(UserRole.ADMIN)).toBe('Administrator');
      expect(roleService.getRoleDisplayName(UserRole.USER)).toBe('User');
      expect(roleService.getRoleDisplayName(UserRole.VIEWER)).toBe('Viewer');
      expect(roleService.getRoleDisplayName(UserRole.GUEST)).toBe('Guest');
    });

    it('should return correct role descriptions', () => {
      expect(roleService.getRoleDescription(UserRole.ADMIN)).toBe('Full access to all features and settings');
      expect(roleService.getRoleDescription(UserRole.USER)).toBe('Can manage settings and monitoring configurations');
      expect(roleService.getRoleDescription(UserRole.VIEWER)).toBe('Can view monitoring data and settings');
      expect(roleService.getRoleDescription(UserRole.GUEST)).toBe('Limited access to monitoring views only');
    });

    it('should validate role strings correctly', () => {
      expect(roleService.isValidRole('admin')).toBe(true);
      expect(roleService.isValidRole('user')).toBe(true);
      expect(roleService.isValidRole('viewer')).toBe(true);
      expect(roleService.isValidRole('guest')).toBe(true);
      expect(roleService.isValidRole('invalid')).toBe(false);
      expect(roleService.isValidRole('')).toBe(false);
    });
  });

  describe('role parsing', () => {
    it('should parse various admin role formats', () => {
      const testCases = [
        { input: 'admin', expected: UserRole.ADMIN },
        { input: 'ADMIN', expected: UserRole.ADMIN },
        { input: 'administrator', expected: UserRole.ADMIN },
        { input: 'Administrator', expected: UserRole.ADMIN },
      ];

      testCases.forEach(({ input, expected }) => {
        const account: EnvAccount = { ...mockEnvAccount, role: input };
        const roleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, account);
        expect(roleInfo.role).toBe(expected);
      });
    });

    it('should parse various viewer role formats', () => {
      const testCases = [
        { input: 'viewer', expected: UserRole.VIEWER },
        { input: 'VIEWER', expected: UserRole.VIEWER },
        { input: 'readonly', expected: UserRole.VIEWER },
        { input: 'read-only', expected: UserRole.VIEWER },
      ];

      testCases.forEach(({ input, expected }) => {
        const account: EnvAccount = { ...mockEnvAccount, role: input };
        const roleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, account);
        expect(roleInfo.role).toBe(expected);
      });
    });

    it('should handle whitespace in role strings', () => {
      const account: EnvAccount = { ...mockEnvAccount, role: '  admin  ' };
      const roleInfo = roleService.getUserRoleInfo(mockUser, mockAuthSource, account);
      expect(roleInfo.role).toBe(UserRole.ADMIN);
    });
  });
});
