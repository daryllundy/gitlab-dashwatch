// Import configurations for internal use
import { APP_CONFIG, DEV_CONFIG, FEATURE_FLAGS } from './app';
import { UI_CONFIG } from './ui';
import { STORAGE_CONFIG } from './storage';
import { MONITORING_CONFIG } from './monitoring';
import { AUTH_CONFIG } from './auth';
import { env } from './env';
import { VERSION_PROGRESSION } from './defaults';
import { DEFAULT_SERVER_INSTANCES } from './defaults';
import { DEFAULT_DNS_DOMAINS } from './defaults';
import { DEFAULT_UPTIME_WEBSITES } from './defaults';
import { DEFAULT_GITLAB_INSTANCES } from './defaults';

// Centralized configuration exports
export { env } from './env';
export { APP_CONFIG, DEV_CONFIG, FEATURE_FLAGS } from './app';
export { UI_CONFIG } from './ui';
export { STORAGE_CONFIG } from './storage';
export { MONITORING_CONFIG } from './monitoring';
export { AUTH_CONFIG } from './auth';
export { 
  DEFAULT_GITLAB_INSTANCES, 
  DEFAULT_UPTIME_WEBSITES, 
  DEFAULT_DNS_DOMAINS, 
  DEFAULT_SERVER_INSTANCES,
  VERSION_PROGRESSION 
} from './defaults';

// Centralized configuration object for easy access
export const config = {
  app: APP_CONFIG,
  dev: DEV_CONFIG,
  features: FEATURE_FLAGS,
  ui: UI_CONFIG,
  storage: STORAGE_CONFIG,
  monitoring: MONITORING_CONFIG,
  auth: AUTH_CONFIG,
  env,
} as const;

// Configuration validation
export const validateConfig = (): boolean => {
  try {
    // Basic validation that all required configs are present
    const requiredConfigs = [
      APP_CONFIG,
      DEV_CONFIG,
      FEATURE_FLAGS,
      UI_CONFIG,
      STORAGE_CONFIG,
      MONITORING_CONFIG,
      AUTH_CONFIG,
    ];

    return requiredConfigs.every(config => config !== null && config !== undefined);
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
};

// Get configuration by key with type safety
export const getConfig = <K extends keyof typeof config>(key: K): typeof config[K] => {
  return config[key];
};

// Check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};

// Get environment-specific configuration
export const getEnvironmentConfig = () => {
  return {
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
    mode: env.mode,
  };
};

// Get all default configurations
export const getDefaults = () => {
  return {
    gitlab: DEFAULT_GITLAB_INSTANCES,
    uptime: DEFAULT_UPTIME_WEBSITES,
    dns: DEFAULT_DNS_DOMAINS,
    servers: DEFAULT_SERVER_INSTANCES,
    versionProgression: VERSION_PROGRESSION,
  };
};
