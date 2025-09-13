// =============================================================================
// CORE APPLICATION TYPES
// =============================================================================

export type StatusType = 'healthy' | 'warning' | 'error' | 'inactive';

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// =============================================================================
// GITLAB MONITORING TYPES
// =============================================================================

export interface GitlabInstance {
  id: string;
  name: string;
  url: string;
  token: string;
  description?: string;
  isActive: boolean;
  lastChecked?: Date;
}

export interface GitlabProject {
  id: number;
  name: string;
  description: string;
  status: StatusType;
  openIssues: number;
  branches: number;
  pullRequests: number;
  lastCommit: string;
  instanceUrl: string;
  instanceId: string;
  visibility: 'private' | 'internal' | 'public';
  defaultBranch: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// UPTIME MONITORING TYPES
// =============================================================================

export interface UptimeTarget {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  timeout: number;
  interval: number;
  expectedStatus: number;
  isActive: boolean;
}

export interface UptimeStatus {
  id: string;
  targetId: string;
  status: StatusType;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
}

export interface UptimeStats {
  targetId: string;
  totalChecks: number;
  successfulChecks: number;
  averageResponseTime: number;
  uptime: number;
  downtime: number;
}

// =============================================================================
// DNS MONITORING TYPES
// =============================================================================

export interface DnsTarget {
  id: string;
  domain: string;
  recordTypes: string[];
  nameservers?: string[];
  isActive: boolean;
}

export interface DnsRecord {
  id: string;
  domain: string;
  type: string;
  value: string;
  ttl: number;
  priority?: number;
  timestamp: Date;
}

export interface DnsStats {
  targetId: string;
  totalQueries: number;
  successfulQueries: number;
  averageResponseTime: number;
  errorRate: number;
}

// =============================================================================
// SERVER MONITORING TYPES
// =============================================================================

export interface ServerTarget {
  id: string;
  name: string;
  ip: string;
  netdataUrl: string;
  port?: number;
  isActive: boolean;
  tags?: string[];
}

export interface ServerMetrics {
  id: string;
  targetId: string;
  status: StatusType;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  uptime: number;
  timestamp: Date;
}

export interface ServerStats {
  targetId: string;
  averageCpuUsage: number;
  averageMemoryUsage: number;
  averageDiskUsage: number;
  totalUptime: number;
  lastSeen: Date;
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

export enum Permission {
  // System administration
  SYSTEM_ADMIN = 'system:admin',
  MANAGE_USERS = 'users:manage',

  // Settings management
  MANAGE_SETTINGS = 'settings:manage',
  VIEW_SETTINGS = 'settings:view',

  // Monitoring management
  MANAGE_MONITORING = 'monitoring:manage',
  VIEW_MONITORING = 'monitoring:view',

  // GitLab management
  MANAGE_GITLAB = 'gitlab:manage',
  VIEW_GITLAB = 'gitlab:view'
}
export enum AuthEventType {
  // Environment authentication events
  ENV_AUTH_INIT = 'ENV_AUTH_INIT',
  ENV_AUTH_CONFIG_LOADED = 'ENV_AUTH_CONFIG_LOADED',
  ENV_AUTH_CONFIG_ERROR = 'ENV_AUTH_CONFIG_ERROR',
  ENV_AUTH_VALIDATION_ERROR = 'ENV_AUTH_VALIDATION_ERROR',
  ENV_AUTH_ACCOUNT_SIGNIN_ATTEMPT = 'ENV_AUTH_ACCOUNT_SIGNIN_ATTEMPT',
  ENV_AUTH_ACCOUNT_SIGNIN_SUCCESS = 'ENV_AUTH_ACCOUNT_SIGNIN_SUCCESS',
  ENV_AUTH_ACCOUNT_SIGNIN_FAILURE = 'ENV_AUTH_ACCOUNT_SIGNIN_FAILURE',
  ENV_AUTH_AUTO_SIGNIN_ATTEMPT = 'ENV_AUTH_AUTO_SIGNIN_ATTEMPT',
  ENV_AUTH_AUTO_SIGNIN_SUCCESS = 'ENV_AUTH_AUTO_SIGNIN_SUCCESS',
  ENV_AUTH_AUTO_SIGNIN_FAILURE = 'ENV_AUTH_AUTO_SIGNIN_FAILURE',
  ENV_AUTH_FALLBACK_TO_MANUAL = 'ENV_AUTH_FALLBACK_TO_MANUAL',

  // Manual authentication events
  MANUAL_AUTH_SIGNIN_ATTEMPT = 'MANUAL_AUTH_SIGNIN_ATTEMPT',
  MANUAL_AUTH_SIGNIN_SUCCESS = 'MANUAL_AUTH_SIGNIN_SUCCESS',
  MANUAL_AUTH_SIGNIN_FAILURE = 'MANUAL_AUTH_SIGNIN_FAILURE',
  MANUAL_AUTH_OAUTH_ATTEMPT = 'MANUAL_AUTH_OAUTH_ATTEMPT',
  MANUAL_AUTH_OAUTH_SUCCESS = 'MANUAL_AUTH_OAUTH_SUCCESS',
  MANUAL_AUTH_OAUTH_FAILURE = 'MANUAL_AUTH_OAUTH_FAILURE',

  // General authentication events
  AUTH_SIGNOUT = 'AUTH_SIGNOUT',
  AUTH_SESSION_RESTORED = 'AUTH_SESSION_RESTORED'
}

export enum AuthEventLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface UserRoleInfo {
  userId?: string;
  role: UserRole;
  permissions: Permission[];
  assignedAt?: Date;
  isEnvironmentAccount?: boolean;
  accountName?: string;
}

export interface AuthLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuthEventType;
  userId?: string;
  details: Record<string, unknown>;
}

export interface AuditSummary {
  totalEvents: number;
  envAuthAttempts: number;
  envAuthSuccesses: number;
  envAuthFailures: number;
  manualAuthAttempts: number;
  manualAuthSuccesses: number;
  manualAuthFailures: number;
  autoSignInAttempts: number;
  autoSignInSuccesses: number;
  fallbackToManualCount: number;
  lastActivity: Date | null;
  mostUsedAuthMethod: string | null;
  accountUsageStats: Record<string, number>;
}

export interface EnvCredentialsConfig {
  enabled: boolean;
  autoSignIn: boolean;
  accounts: EnvAccount[];
  allowFallback: boolean;
  strictMode: boolean;
}

export interface EnvAccount {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthenticationSource {
  method: 'environment' | 'manual' | 'oauth';
  timestamp: Date;
  accountName?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    type: string;
    message: string;
  }>;
}

// =============================================================================
// STORAGE & BACKUP TYPES
// =============================================================================

export interface BackupData {
  id: string;
  version: string;
  timestamp: Date;
  settings: Settings;
  monitoringData?: {
    gitlab: GitlabProject[];
    uptime: UptimeStatus[];
    dns: DnsRecord[];
    server: ServerMetrics[];
  };
}

export interface BackupOptions {
  filename?: string;
  includeSettings: boolean;
  includeMonitoringData: boolean;
  compress: boolean;
}

export interface RestoreResult {
  backupId: string;
  success: boolean;
  message: string;
  restoredItems: string[];
}

export interface CacheEntry<T = unknown> {
  id: string;
  key: string;
  value: T;
  timestamp: Date;
  expiresAt?: Date;
}

export interface CacheStats {
  namespace: string;
  totalEntries: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
}

export interface ExportOptions {
  type: ExportDataType;
  format: 'json' | 'csv' | 'xlsx';
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, unknown>;
}

export interface ExportResult {
  id: string;
  success: boolean;
  filename: string;
  size: number;
  recordCount: number;
}

export type ExportDataType =
  | 'settings'
  | 'monitoring-data'
  | 'uptime-stats'
  | 'dns-records'
  | 'server-metrics'
  | 'gitlab-projects';

// =============================================================================
// APPLICATION SETTINGS TYPES
// =============================================================================

export interface Settings {
  gitlab: {
    instances: GitlabInstance[];
    refreshInterval: number;
    maxProjects: number;
  };
  uptime: {
    websites: UptimeTarget[];
    defaultTimeout: number;
    defaultInterval: number;
  };
  dns: {
    domains: DnsTarget[];
    defaultNameservers: string[];
    queryTimeout: number;
  };
  servers: {
    instances: ServerTarget[];
    metricsRetention: number;
    alertThresholds: {
      cpu: number;
      memory: number;
      disk: number;
    };
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    refreshInterval: number;
    showNotifications: boolean;
  };
}

// =============================================================================
// LOGGING TYPES
// =============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: unknown;
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  showNavbar?: boolean;
}

export interface StatusIndicatorProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export interface StatusCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  status: StatusType;
  value?: number;
  unit?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
