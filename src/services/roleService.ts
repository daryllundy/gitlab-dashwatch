import type { User } from '@supabase/supabase-js';
import type { EnvAccount, AuthenticationSource } from '@/types';

/**
 * Available user roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

/**
 * Permissions available in the system
 */
export enum Permission {
  // Settings management
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_SETTINGS = 'view_settings',
  
  // GitLab management
  MANAGE_GITLAB_INSTANCES = 'manage_gitlab_instances',
  VIEW_GITLAB_INSTANCES = 'view_gitlab_instances',
  
  // Monitoring management
  MANAGE_MONITORING = 'manage_monitoring',
  VIEW_MONITORING = 'view_monitoring',
  
  // User management (future use)
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',
  
  // System administration
  SYSTEM_ADMIN = 'system_admin'
}

/**
 * Role-based permission mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_SETTINGS,
    Permission.MANAGE_GITLAB_INSTANCES,
    Permission.VIEW_GITLAB_INSTANCES,
    Permission.MANAGE_MONITORING,
    Permission.VIEW_MONITORING,
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.SYSTEM_ADMIN
  ],
  [UserRole.USER]: [
    Permission.MANAGE_SETTINGS,
    Permission.VIEW_SETTINGS,
    Permission.MANAGE_GITLAB_INSTANCES,
    Permission.VIEW_GITLAB_INSTANCES,
    Permission.MANAGE_MONITORING,
    Permission.VIEW_MONITORING
  ],
  [UserRole.VIEWER]: [
    Permission.VIEW_SETTINGS,
    Permission.VIEW_GITLAB_INSTANCES,
    Permission.VIEW_MONITORING
  ],
  [UserRole.GUEST]: [
    Permission.VIEW_MONITORING
  ]
};

/**
 * Interface for user role information
 */
export interface UserRoleInfo {
  role: UserRole;
  permissions: Permission[];
  isEnvironmentAccount: boolean;
  accountName?: string;
}

/**
 * Service for managing user roles and permissions
 */
export class RoleService {
  /**
   * Get user role information based on authentication source and user data
   */
  public getUserRoleInfo(
    user: User | null,
    authenticationSource: AuthenticationSource | null,
    envAccount?: EnvAccount
  ): UserRoleInfo {
    // If user is not authenticated, return guest role
    if (!user) {
      return {
        role: UserRole.GUEST,
        permissions: ROLE_PERMISSIONS[UserRole.GUEST],
        isEnvironmentAccount: false
      };
    }

    // If authenticated via environment account, use the account's role
    if (authenticationSource?.method === 'environment' && envAccount?.role) {
      const role = this.parseRole(envAccount.role);
      return {
        role,
        permissions: ROLE_PERMISSIONS[role],
        isEnvironmentAccount: true,
        accountName: envAccount.name
      };
    }

    // For manual authentication or environment accounts without roles, default to USER
    return {
      role: UserRole.USER,
      permissions: ROLE_PERMISSIONS[UserRole.USER],
      isEnvironmentAccount: authenticationSource?.method === 'environment',
      accountName: authenticationSource?.accountName
    };
  }

  /**
   * Check if user has a specific permission
   */
  public hasPermission(userRoleInfo: UserRoleInfo, permission: Permission): boolean {
    return userRoleInfo.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  public hasAnyPermission(userRoleInfo: UserRoleInfo, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRoleInfo, permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  public hasAllPermissions(userRoleInfo: UserRoleInfo, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRoleInfo, permission));
  }

  /**
   * Check if user has admin privileges
   */
  public isAdmin(userRoleInfo: UserRoleInfo): boolean {
    return userRoleInfo.role === UserRole.ADMIN;
  }

  /**
   * Check if user can manage settings
   */
  public canManageSettings(userRoleInfo: UserRoleInfo): boolean {
    return this.hasPermission(userRoleInfo, Permission.MANAGE_SETTINGS);
  }

  /**
   * Check if user can view settings
   */
  public canViewSettings(userRoleInfo: UserRoleInfo): boolean {
    return this.hasPermission(userRoleInfo, Permission.VIEW_SETTINGS);
  }

  /**
   * Check if user can manage GitLab instances
   */
  public canManageGitlab(userRoleInfo: UserRoleInfo): boolean {
    return this.hasPermission(userRoleInfo, Permission.MANAGE_GITLAB_INSTANCES);
  }

  /**
   * Check if user can manage monitoring
   */
  public canManageMonitoring(userRoleInfo: UserRoleInfo): boolean {
    return this.hasPermission(userRoleInfo, Permission.MANAGE_MONITORING);
  }

  /**
   * Get role display name for UI
   */
  public getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.USER:
        return 'User';
      case UserRole.VIEWER:
        return 'Viewer';
      case UserRole.GUEST:
        return 'Guest';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get role description for UI
   */
  public getRoleDescription(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Full access to all features and settings';
      case UserRole.USER:
        return 'Can manage settings and monitoring configurations';
      case UserRole.VIEWER:
        return 'Can view monitoring data and settings';
      case UserRole.GUEST:
        return 'Limited access to monitoring views only';
      default:
        return 'Unknown role';
    }
  }

  /**
   * Validate if a role string is valid
   */
  public isValidRole(role: string): boolean {
    return Object.values(UserRole).includes(role as UserRole);
  }

  /**
   * Parse role string to UserRole enum, with fallback to USER
   */
  private parseRole(roleString: string): UserRole {
    const normalizedRole = roleString.toLowerCase().trim();
    
    switch (normalizedRole) {
      case 'admin':
      case 'administrator':
        return UserRole.ADMIN;
      case 'user':
        return UserRole.USER;
      case 'viewer':
      case 'readonly':
      case 'read-only':
        return UserRole.VIEWER;
      case 'guest':
        return UserRole.GUEST;
      default:
        // Default to USER for unknown roles
        console.warn(`Unknown role "${roleString}", defaulting to USER role`);
        return UserRole.USER;
    }
  }
}

// Export singleton instance
export const roleService = new RoleService();
