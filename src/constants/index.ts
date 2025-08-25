// Application routes
export const ROUTES = {
  HOME: '/',
  SETTINGS: '/settings',
  GITLAB_PROJECTS: '/gitlab-projects',
} as const;

// Status types for type safety
export const STATUS_TYPES = ['healthy', 'warning', 'error', 'inactive'] as const;

// API and networking constants
export const API_CONSTANTS = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  BASE_DELAY: 1000, // Base delay for retry operations
  MAX_LOG_ENTRIES: 1000, // Maximum log entries to keep
} as const;

// File and export constants
export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['json', 'csv', 'xlsx'] as const,
  DEFAULT_FILENAME: 'dashwatch-export',
  DEFAULT_BACKUP_FILENAME: 'dashwatch-backup',
  DEFAULT_REPORT_FILENAME: 'monitoring-report',
} as const;

// Theme constants
export const THEME_CONSTANTS = {
  DEFAULT: 'system',
  OPTIONS: ['light', 'dark', 'system'] as const,
} as const;

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

// Storage constants
export const STORAGE_CONSTANTS = {
  TEST_KEY: '__localStorage_test__',
  MAX_SETTINGS_SIZE: 1024 * 1024, // 1MB
  MAX_BACKUP_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

// Animation and UI constants
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 1000, // Default animation duration
  STATUS_UPDATE_DELAY: 200, // Delay between status updates
  TOAST_REMOVE_DELAY: 1000000, // Toast removal delay
} as const;

// Re-export centralized configurations for backward compatibility
export { 
  DEFAULT_GITLAB_INSTANCES,
  DEFAULT_UPTIME_WEBSITES, 
  DEFAULT_DNS_DOMAINS,
  DEFAULT_SERVER_INSTANCES,
  VERSION_PROGRESSION
} from '@/config';

// Mock data constants for development and testing
export const MOCK_DATA = {
  EXAMPLE_DOMAIN: 'example.com',
  EXAMPLE_GITLAB_URL: 'https://gitlab.example.com',
  EXAMPLE_API_URL: 'https://api.example.com',
  EXAMPLE_DOCS_URL: 'https://docs.example.com',
  EXAMPLE_CUSTOMERS_URL: 'https://customers.example.com',
  DEFAULT_IP_RANGE: '192.168.1',
  LOCALHOST_IP: '127.0.0.1',
  DEFAULT_SPF_RECORD: 'v=spf1 include:_spf.google.com ~all',
  DEFAULT_TTL: 3600,
} as const;

// DNS record type constants
export const DNS_RECORD_TYPES = {
  A: 'A',
  AAAA: 'AAAA',
  CNAME: 'CNAME',
  MX: 'MX',
  TXT: 'TXT',
  NS: 'NS',
  PTR: 'PTR',
  SRV: 'SRV',
} as const;

// HTTP status constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Re-export all configurations for convenience
export { 
  APP_CONFIG,
  DEV_CONFIG,
  FEATURE_FLAGS,
  MONITORING_CONFIG, 
  AUTH_CONFIG, 
  UI_CONFIG,
  STORAGE_CONFIG,
  config
} from '@/config';
