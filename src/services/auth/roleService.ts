import type { User } from '@supabase/supabase-js';
import type { EnvAccount, AuthenticationSource } from '@/types';



import { UserRole, Permission, type UserRoleInfo } from '@/types';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.SYSTEM_ADMIN,
    Permission.MANAGE_USERS,
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_SETTINGS,
    Permission.MANAGE_MONITORING,
    Permission.VIEW_MONITORING,
    Permission.MANAGE_GITLAB,
    Permission.VIEW_GITLAB
  ],
  [UserRole.USER]: [
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_SETTINGS,
    Permission.MANAGE_MONITORING,
    Permission.VIEW_MONITORING,
    Permission.MANAGE_GITLAB,
    Permission.VIEW_GITLAB
  ],
  [UserRole.VIEWER]: [
    Permission.VIEW_SETTINGS,
    Permission.VIEW_MONITORING,
    Permission.VIEW_GITLAB
  ],
  [UserRole.GUEST]: [
    Permission.VIEW_MONITORING
  ]
};

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.USER]: 'User',
  [UserRole.VIEWER]: 'Viewer',
  [UserRole.GUEST]: 'Guest'
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Full access to all features and settings',
  [UserRole.USER]: 'Can manage settings and monitoring configurations',
  [UserRole.VIEWER]: 'Can view monitoring data and settings',
  [UserRole.GUEST]: 'Limited access to monitoring views only'
};

class RoleService {
  getUserRoleInfo(
    user: User | null,
    authSource: AuthenticationSource | null,
    envAccount?: EnvAccount
  ): UserRoleInfo {
    // Guest user
    if (!user) {
      return {
        role: UserRole.GUEST,
        permissions: ROLE_PERMISSIONS[UserRole.GUEST],
        isEnvironmentAccount: false
      };
    }

    // Environment account
    if (authSource?.method === 'environment' && envAccount) {
      const role = this.parseEnvAccountRole(envAccount.role);
      return {
        role,
        permissions: ROLE_PERMISSIONS[role],
        isEnvironmentAccount: true,
        accountName: envAccount.name
      };
    }

    // Manual authentication - default to user role
    return {
      role: UserRole.USER,
      permissions: ROLE_PERMISSIONS[UserRole.USER],
      isEnvironmentAccount: false
    };
  }

  private parseEnvAccountRole(roleString?: string): UserRole {
    if (!roleString) {
      return UserRole.USER;
    }

    const normalizedRole = roleString.trim().toLowerCase();

    // Admin role variations
    if (['admin', 'administrator'].includes(normalizedRole)) {
      return UserRole.ADMIN;
    }

    // Viewer role variations
    if (['viewer', 'readonly', 'read-only'].includes(normalizedRole)) {
      return UserRole.VIEWER;
    }

    // User role variations
    if (['user'].includes(normalizedRole)) {
      return UserRole.USER;
    }

    // Unknown role - warn and default to user
    console.warn(`Unknown role "${roleString}", defaulting to USER role`);
    return UserRole.USER;
  }

  hasPermission(roleInfo: UserRoleInfo, permission: Permission): boolean {
    return roleInfo.permissions.includes(permission);
  }

  hasAnyPermission(roleInfo: UserRoleInfo, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(roleInfo, permission));
  }

  hasAllPermissions(roleInfo: UserRoleInfo, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(roleInfo, permission));
  }

  isAdmin(roleInfo: UserRoleInfo): boolean {
    return roleInfo.role === UserRole.ADMIN;
  }

  canManageSettings(roleInfo: UserRoleInfo): boolean {
    return this.hasPermission(roleInfo, Permission.MANAGE_SETTINGS);
  }

  canViewSettings(roleInfo: UserRoleInfo): boolean {
    return this.hasPermission(roleInfo, Permission.VIEW_SETTINGS);
  }

  canManageGitlab(roleInfo: UserRoleInfo): boolean {
    return this.hasPermission(roleInfo, Permission.MANAGE_GITLAB);
  }

  canManageMonitoring(roleInfo: UserRoleInfo): boolean {
    return this.hasPermission(roleInfo, Permission.MANAGE_MONITORING);
  }

  getRoleDisplayName(role: UserRole): string {
    return ROLE_DISPLAY_NAMES[role];
  }

  getRoleDescription(role: UserRole): string {
    return ROLE_DESCRIPTIONS[role];
  }

  isValidRole(roleString: string): boolean {
    if (!roleString) return false;
    const normalizedRole = roleString.trim().toLowerCase();
    return ['admin', 'administrator', 'user', 'viewer', 'readonly', 'read-only', 'guest'].includes(normalizedRole);
  }
}

export const roleService = new RoleService();
