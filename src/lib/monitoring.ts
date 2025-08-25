import { config } from '@/config';
import { MOCK_DATA, DNS_RECORD_TYPES } from '@/constants';
import type { StatusType } from '@/types';

/**
 * Monitoring-related utility functions
 */

/**
 * Get a random status from the configured status distribution
 */
export const getRandomStatus = (): StatusType => {
  const statuses = config.monitoring.mockData.statusDistribution;
  return statuses[Math.floor(Math.random() * statuses.length)] as StatusType;
};

/**
 * Generate mock DNS record values based on record type and domain
 */
export const getMockDnsValue = (type: string, domain: string): string => {
  switch (type.toUpperCase()) {
    case DNS_RECORD_TYPES.A:
      return `${MOCK_DATA.DEFAULT_IP_RANGE}.${Math.floor(Math.random() * 255)}`;
    case DNS_RECORD_TYPES.CNAME:
      return domain.replace(/^[^.]+\./, '');
    case DNS_RECORD_TYPES.MX:
      return `mail.${domain}`;
    case DNS_RECORD_TYPES.TXT:
      return MOCK_DATA.DEFAULT_SPF_RECORD;
    case DNS_RECORD_TYPES.AAAA:
      return '2001:db8::1';
    case DNS_RECORD_TYPES.NS:
      return `ns1.${domain}`;
    default:
      return MOCK_DATA.LOCALHOST_IP;
  }
};

/**
 * Generate mock server metrics for testing
 */
export const generateMockServerMetrics = () => {
  return {
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    disk: Math.floor(Math.random() * 100),
    network: {
      in: Math.floor(Math.random() * 1000),
      out: Math.floor(Math.random() * 1000),
    },
    uptime: Math.floor(Math.random() * 86400), // Random uptime in seconds
    load: (Math.random() * 4).toFixed(2),
  };
};

/**
 * Format uptime seconds to human readable format
 */
export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Generate mock response time for uptime monitoring
 */
export const generateMockResponseTime = (): number => {
  // Generate response time between 50ms and 2000ms
  return Math.floor(Math.random() * 1950) + 50;
};

/**
 * Check if a URL is valid for monitoring
 */
export const isValidMonitoringUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

/**
 * Extract domain from URL for display purposes
 */
export const extractDomain = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    return url;
  }
};

/**
 * Generate mock GitLab project data
 */
export const generateMockGitlabProject = (name: string, instanceUrl: string) => {
  const statuses = config.monitoring.mockData.statusDistribution;
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    id: Math.floor(Math.random() * 10000),
    name,
    description: `Mock project: ${name}`,
    web_url: `${instanceUrl}/${name.toLowerCase().replace(/\s+/g, '-')}`,
    last_activity_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    status: randomStatus,
    issues_count: Math.floor(Math.random() * 50),
    merge_requests_count: Math.floor(Math.random() * 20),
    stars_count: Math.floor(Math.random() * 100),
    forks_count: Math.floor(Math.random() * 25),
  };
};
