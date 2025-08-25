// Application configuration
export const APP_CONFIG = {
  name: 'DashWatch',
  description: 'Monitoring your self-hosted infrastructure',
  version: '1.0.0',
} as const;

// Development configuration
import { TIME_CONSTANTS } from '@/constants';

export const DEV_CONFIG = {
  ports: {
    development: 8080,
    production: 3000,
  },
  mockData: {
    enabled: true,
    delay: TIME_CONSTANTS.SECOND, // 1 second
  },
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  enableDarkMode: true,
  enableExportImport: true,
  enableMockData: true,
} as const;
