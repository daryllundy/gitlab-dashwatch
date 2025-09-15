// GitLab Settings Service
// Manages GitLab-specific settings and configuration

import { logger } from '@/lib/logger';
import {
  validateGitlabSettings,
  createDefaultGitlabSettings,
  validateGitlabInstance,
  sanitizeGitlabInstance
} from '@/lib/validation';
import type {
  GitlabSettings,
  GitlabInstance,
  GitlabValidationResult
} from '@/types';

class GitlabSettingsService {
  private settings: GitlabSettings;

  constructor() {
    this.settings = createDefaultGitlabSettings();
  }

  /**
   * Initialize settings from stored configuration
   */
  async initialize(settings?: Partial<GitlabSettings>): Promise<void> {
    try {
      if (settings) {
        // Validate and merge provided settings
        const validation = validateGitlabSettings(settings);
        if (!validation.isValid) {
          logger.warn('Invalid GitLab settings provided, using defaults for invalid fields', 'GitlabSettingsService', validation.errors);
        }

        // Merge with defaults
        this.settings = {
          ...createDefaultGitlabSettings(),
          ...settings,
          // Ensure instances are properly validated
          instances: settings.instances?.map(instance => {
            const instanceValidation = validateGitlabInstance(instance);
            if (instanceValidation.isValid) {
              return sanitizeGitlabInstance(instance);
            } else {
              logger.warn(`Invalid GitLab instance configuration: ${instance.name}`, 'GitlabSettingsService', instanceValidation.errors);
              return sanitizeGitlabInstance(instance); // Still sanitize even if invalid
            }
          }) || [],
        };
      } else {
        // Use defaults
        this.settings = createDefaultGitlabSettings();
      }

      logger.info('GitLab settings initialized successfully', 'GitlabSettingsService');
    } catch (error) {
      logger.error('Failed to initialize GitLab settings', 'GitlabSettingsService', error);
      // Fallback to defaults
      this.settings = createDefaultGitlabSettings();
    }
  }

  /**
   * Get current GitLab settings
   */
  getSettings(): GitlabSettings {
    return { ...this.settings };
  }

  /**
   * Update GitLab settings
   */
  async updateSettings(newSettings: Partial<GitlabSettings>): Promise<GitlabValidationResult> {
    try {
      const validation = validateGitlabSettings(newSettings);
      if (!validation.isValid) {
        logger.warn('Invalid GitLab settings update', 'GitlabSettingsService', validation.errors);
        return validation;
      }

      // Merge settings
      const updatedSettings = {
        ...this.settings,
        ...newSettings,
        // Handle instances separately
        instances: newSettings.instances !== undefined
          ? newSettings.instances.map(instance => sanitizeGitlabInstance(instance))
          : this.settings.instances,
      };

      // Validate the merged settings
      const finalValidation = validateGitlabSettings(updatedSettings);
      if (!finalValidation.isValid) {
        return finalValidation;
      }

      this.settings = updatedSettings;
      logger.info('GitLab settings updated successfully', 'GitlabSettingsService');

      return { isValid: true, errors: [] };
    } catch (error) {
      logger.error('Failed to update GitLab settings', 'GitlabSettingsService', error);
      return {
        isValid: false,
        errors: [{ field: 'general', type: 'error', message: 'Failed to update settings' }]
      };
    }
  }

  /**
   * Add a new GitLab instance
   */
  async addInstance(instance: GitlabInstance): Promise<GitlabValidationResult> {
    try {
      const validation = validateGitlabInstance(instance);
      if (!validation.isValid) {
        return validation;
      }

      // Check for duplicate IDs
      if (this.settings.instances.some(existing => existing.id === instance.id)) {
        return {
          isValid: false,
          errors: [{ field: 'id', type: 'duplicate', message: 'Instance ID already exists' }]
        };
      }

      // Check for duplicate URLs
      if (this.settings.instances.some(existing => existing.url === instance.url)) {
        return {
          isValid: false,
          errors: [{ field: 'url', type: 'duplicate', message: 'Instance URL already exists' }]
        };
      }

      const sanitizedInstance = sanitizeGitlabInstance(instance);
      this.settings.instances.push(sanitizedInstance);

      logger.info(`GitLab instance added: ${sanitizedInstance.name} (${sanitizedInstance.id})`, 'GitlabSettingsService');

      return { isValid: true, errors: [] };
    } catch (error) {
      logger.error('Failed to add GitLab instance', 'GitlabSettingsService', error);
      return {
        isValid: false,
        errors: [{ field: 'general', type: 'error', message: 'Failed to add instance' }]
      };
    }
  }

  /**
   * Update an existing GitLab instance
   */
  async updateInstance(instanceId: string, updates: Partial<GitlabInstance>): Promise<GitlabValidationResult> {
    try {
      const instanceIndex = this.settings.instances.findIndex(inst => inst.id === instanceId);
      if (instanceIndex === -1) {
        return {
          isValid: false,
          errors: [{ field: 'id', type: 'not_found', message: 'Instance not found' }]
        };
      }

      const existingInstance = this.settings.instances[instanceIndex];
      if (!existingInstance) {
        return {
          isValid: false,
          errors: [{ field: 'id', type: 'not_found', message: 'Instance not found' }]
        };
      }

      const updatedInstance = { ...existingInstance, ...updates };

      // Ensure required fields are present for validation
      const instanceToValidate: GitlabInstance = {
        id: updatedInstance.id || existingInstance.id,
        name: updatedInstance.name || existingInstance.name,
        url: updatedInstance.url || existingInstance.url,
        token: updatedInstance.token || existingInstance.token,
        description: updatedInstance.description || existingInstance.description,
        isActive: updatedInstance.isActive ?? existingInstance.isActive,
        lastChecked: updatedInstance.lastChecked,
        apiVersion: updatedInstance.apiVersion || existingInstance.apiVersion,
        connectionStatus: updatedInstance.connectionStatus || existingInstance.connectionStatus,
        errorMessage: updatedInstance.errorMessage,
        rateLimitInfo: updatedInstance.rateLimitInfo,
        selectedProjects: updatedInstance.selectedProjects || existingInstance.selectedProjects,
        fetchOptions: updatedInstance.fetchOptions || existingInstance.fetchOptions,
      };

      const validation = validateGitlabInstance(instanceToValidate);
      if (!validation.isValid) {
        return validation;
      }

      // Check for URL conflicts (excluding current instance)
      if (updates.url && this.settings.instances.some(inst => inst.id !== instanceId && inst.url === updates.url)) {
        return {
          isValid: false,
          errors: [{ field: 'url', type: 'duplicate', message: 'Instance URL already exists' }]
        };
      }

      this.settings.instances[instanceIndex] = sanitizeGitlabInstance(instanceToValidate);

      logger.info(`GitLab instance updated: ${instanceId}`, 'GitlabSettingsService');

      return { isValid: true, errors: [] };
    } catch (error) {
      logger.error(`Failed to update GitLab instance: ${instanceId}`, 'GitlabSettingsService', error);
      return {
        isValid: false,
        errors: [{ field: 'general', type: 'error', message: 'Failed to update instance' }]
      };
    }
  }

  /**
   * Remove a GitLab instance
   */
  async removeInstance(instanceId: string): Promise<boolean> {
    try {
      const instanceIndex = this.settings.instances.findIndex(inst => inst.id === instanceId);
      if (instanceIndex === -1) {
        logger.warn(`GitLab instance not found for removal: ${instanceId}`, 'GitlabSettingsService');
        return false;
      }

      const removedInstance = this.settings.instances.splice(instanceIndex, 1)[0];

      logger.info(`GitLab instance removed: ${removedInstance.name} (${instanceId})`, 'GitlabSettingsService');

      return true;
    } catch (error) {
      logger.error(`Failed to remove GitLab instance: ${instanceId}`, 'GitlabSettingsService', error);
      return false;
    }
  }

  /**
   * Get a specific GitLab instance
   */
  getInstance(instanceId: string): GitlabInstance | null {
    return this.settings.instances.find(inst => inst.id === instanceId) || null;
  }

  /**
   * Get all GitLab instances
   */
  getInstances(): GitlabInstance[] {
    return [...this.settings.instances];
  }

  /**
   * Get active GitLab instances
   */
  getActiveInstances(): GitlabInstance[] {
    return this.settings.instances.filter(inst => inst.isActive);
  }

  /**
   * Set instance active status
   */
  async setInstanceActive(instanceId: string, isActive: boolean): Promise<boolean> {
    try {
      const instance = this.settings.instances.find(inst => inst.id === instanceId);
      if (!instance) {
        return false;
      }

      instance.isActive = isActive;
      logger.info(`GitLab instance ${isActive ? 'activated' : 'deactivated'}: ${instanceId}`, 'GitlabSettingsService');

      return true;
    } catch (error) {
      logger.error(`Failed to set instance active status: ${instanceId}`, 'GitlabSettingsService', error);
      return false;
    }
  }

  /**
   * Update refresh interval
   */
  async setRefreshInterval(interval: number): Promise<GitlabValidationResult> {
    if (interval < 1 || interval > 1440) { // Max 24 hours
      return {
        isValid: false,
        errors: [{ field: 'refreshInterval', type: 'range', message: 'Refresh interval must be between 1 and 1440 minutes' }]
      };
    }

    this.settings.refreshInterval = interval;
    logger.info(`GitLab refresh interval updated to ${interval} minutes`, 'GitlabSettingsService');

    return { isValid: true, errors: [] };
  }

  /**
   * Update max projects limit
   */
  async setMaxProjects(maxProjects: number): Promise<GitlabValidationResult> {
    if (maxProjects < 1 || maxProjects > 10000) {
      return {
        isValid: false,
        errors: [{ field: 'maxProjects', type: 'range', message: 'Max projects must be between 1 and 10000' }]
      };
    }

    this.settings.maxProjects = maxProjects;
    logger.info(`GitLab max projects updated to ${maxProjects}`, 'GitlabSettingsService');

    return { isValid: true, errors: [] };
  }

  /**
   * Update cache timeout
   */
  async setCacheTimeout(timeout: number): Promise<GitlabValidationResult> {
    if (timeout < 1 || timeout > 1440) { // Max 24 hours
      return {
        isValid: false,
        errors: [{ field: 'cacheTimeout', type: 'range', message: 'Cache timeout must be between 1 and 1440 minutes' }]
      };
    }

    this.settings.cacheTimeout = timeout;
    logger.info(`GitLab cache timeout updated to ${timeout} minutes`, 'GitlabSettingsService');

    return { isValid: true, errors: [] };
  }

  /**
   * Toggle real-time updates
   */
  async setRealTimeUpdates(enabled: boolean): Promise<void> {
    this.settings.enableRealTimeUpdates = enabled;
    logger.info(`GitLab real-time updates ${enabled ? 'enabled' : 'disabled'}`, 'GitlabSettingsService');
  }

  /**
   * Update rate limit buffer
   */
  async setRateLimitBuffer(buffer: number): Promise<GitlabValidationResult> {
    if (buffer < 0 || buffer > 100) {
      return {
        isValid: false,
        errors: [{ field: 'rateLimitBuffer', type: 'range', message: 'Rate limit buffer must be between 0 and 100' }]
      };
    }

    this.settings.rateLimitBuffer = buffer;
    logger.info(`GitLab rate limit buffer updated to ${buffer}%`, 'GitlabSettingsService');

    return { isValid: true, errors: [] };
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.settings = createDefaultGitlabSettings();
    logger.info('GitLab settings reset to defaults', 'GitlabSettingsService');
  }

  /**
   * Export settings for backup
   */
  exportSettings(): GitlabSettings {
    return { ...this.settings };
  }

  /**
   * Import settings from backup
   */
  async importSettings(settings: GitlabSettings): Promise<GitlabValidationResult> {
    try {
      const validation = validateGitlabSettings(settings);
      if (!validation.isValid) {
        return validation;
      }

      // Validate all instances
      for (const instance of settings.instances) {
        const instanceValidation = validateGitlabInstance(instance);
        if (!instanceValidation.isValid) {
          return {
            isValid: false,
            errors: [{ field: 'instances', type: 'nested', message: `Invalid instance: ${instance.name}` }]
          };
        }
      }

      this.settings = {
        ...settings,
        instances: settings.instances.map(inst => sanitizeGitlabInstance(inst))
      };

      logger.info('GitLab settings imported successfully', 'GitlabSettingsService');

      return { isValid: true, errors: [] };
    } catch (error) {
      logger.error('Failed to import GitLab settings', 'GitlabSettingsService', error);
      return {
        isValid: false,
        errors: [{ field: 'general', type: 'error', message: 'Failed to import settings' }]
      };
    }
  }

  /**
   * Get settings summary for UI display
   */
  getSettingsSummary(): {
    totalInstances: number;
    activeInstances: number;
    refreshInterval: number;
    maxProjects: number;
    realTimeUpdatesEnabled: boolean;
  } {
    return {
      totalInstances: this.settings.instances.length,
      activeInstances: this.settings.instances.filter(inst => inst.isActive).length,
      refreshInterval: this.settings.refreshInterval,
      maxProjects: this.settings.maxProjects,
      realTimeUpdatesEnabled: this.settings.enableRealTimeUpdates,
    };
  }

  /**
   * Validate current settings
   */
  validateCurrentSettings(): GitlabValidationResult {
    return validateGitlabSettings(this.settings);
  }
}

// Singleton instance
export const gitlabSettingsService = new GitlabSettingsService();
