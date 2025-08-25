// Authentication configuration constants
import { API_CONSTANTS, TIME_CONSTANTS } from '@/constants';

export const AUTH_CONFIG = {
  logging: {
    maxLogEntries: API_CONSTANTS.MAX_LOG_ENTRIES,
    enabled: true,
  },
  session: {
    defaultTimeout: 30 * TIME_CONSTANTS.MINUTE, // 30 minutes
    refreshThreshold: 5 * TIME_CONSTANTS.MINUTE, // 5 minutes
  },
  validation: {
    minPasswordLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * TIME_CONSTANTS.MINUTE, // 15 minutes
  },
} as const;
