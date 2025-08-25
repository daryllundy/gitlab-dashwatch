// Settings validation utilities
import type { Settings } from '@/types';

export const validateSettings = (settings: any): settings is Settings => {
  if (!settings || typeof settings !== 'object') return false;
  
  // Check required top-level properties
  if (!settings.gitlab || !settings.uptime || !settings.dns || !settings.servers) {
    return false;
  }
  
  // Check gitlab instances
  if (!Array.isArray(settings.gitlab.instances)) return false;
  for (const instance of settings.gitlab.instances) {
    if (!instance.url || !instance.name || typeof instance.url !== 'string' || typeof instance.name !== 'string') {
      return false;
    }
  }
  
  // Check uptime websites
  if (!Array.isArray(settings.uptime.websites)) return false;
  for (const website of settings.uptime.websites) {
    if (!website.url || !website.name || typeof website.url !== 'string' || typeof website.name !== 'string') {
      return false;
    }
  }
  
  // Check DNS domains
  if (!Array.isArray(settings.dns.domains)) return false;
  for (const domain of settings.dns.domains) {
    if (!domain.domain || !Array.isArray(domain.recordTypes) || typeof domain.domain !== 'string') {
      return false;
    }
  }
  
  // Check server instances
  if (!Array.isArray(settings.servers.instances)) return false;
  for (const server of settings.servers.instances) {
    if (!server.name || !server.ip || !server.netdataUrl || 
        typeof server.name !== 'string' || typeof server.ip !== 'string' || typeof server.netdataUrl !== 'string') {
      return false;
    }
  }
  
  return true;
};

import { 
  DEFAULT_GITLAB_INSTANCES, 
  DEFAULT_UPTIME_WEBSITES, 
  DEFAULT_DNS_DOMAINS, 
  DEFAULT_SERVER_INSTANCES 
} from '@/config';

export const createDefaultSettings = (overrides: Partial<Settings> = {}): Settings => {
  return {
    gitlab: {
      instances: [...DEFAULT_GITLAB_INSTANCES]
    },
    uptime: {
      websites: [...DEFAULT_UPTIME_WEBSITES]
    },
    dns: {
      domains: [...DEFAULT_DNS_DOMAINS]
    },
    servers: {
      instances: [...DEFAULT_SERVER_INSTANCES]
    },
    ...overrides
  };
};
