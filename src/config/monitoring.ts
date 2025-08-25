// Monitoring configuration constants
import { UI_CONSTANTS, TIME_CONSTANTS } from '@/constants';

export const MONITORING_CONFIG = {
  // Mock data configuration
  mockData: {
    statusDistribution: ['healthy', 'healthy', 'healthy', 'warning', 'error'] as const,
    uptimeRanges: {
      healthy: { min: 99, max: 100 },
      warning: { min: 95, max: 99 },
      error: { min: 90, max: 95 },
    },
  },
  
  // Polling intervals (in milliseconds)
  polling: {
    serverMetrics: 30 * TIME_CONSTANTS.SECOND,    // 30 seconds
    uptimeCheck: TIME_CONSTANTS.MINUTE,           // 1 minute
    dnsCheck: 5 * TIME_CONSTANTS.MINUTE,          // 5 minutes
    gitlabSync: 2 * TIME_CONSTANTS.MINUTE,        // 2 minutes
  },
  
  // Display limits
  display: {
    maxProjectsPreview: 4,   // Max projects to show before "Show All"
    maxServersPreview: 6,    // Max servers to show in grid
    maxDnsRecords: 10,       // Max DNS records per domain
  },
  
  // Animation and UI timing
  animation: {
    numberCountDuration: UI_CONSTANTS.ANIMATION_DURATION, // Duration for animated number counting
    statusUpdateDelay: UI_CONSTANTS.STATUS_UPDATE_DELAY,  // Delay between status updates
  },
} as const;
