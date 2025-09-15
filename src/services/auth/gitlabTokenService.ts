// GitLab Token Service
// Manages secure storage and retrieval of GitLab access tokens

import { logger } from '@/lib/logger';
import {
  initializeEncryption,
  isEncryptionInitialized,
  storeGitlabToken,
  getGitlabToken,
  removeGitlabToken,
  clearAllGitlabTokens,
  validateEncryptionSetup,
  getEncryptionStatus,
  generateSecurePassword,
  isCryptoAvailable
} from '@/lib/secureStorage';
import type { GitlabInstance } from '@/types';

class GitlabTokenService {
  private encryptionPassword: string | null = null;
  private isInitialized = false;

  /**
   * Initialize the token service with encryption
   */
  async initialize(password?: string): Promise<void> {
    try {
      if (!isCryptoAvailable()) {
        throw new Error('Web Crypto API is not available in this browser');
      }

      // Use provided password or generate a secure one
      const encryptionPassword = password || generateSecurePassword();

      // Initialize encryption
      await initializeEncryption(encryptionPassword);

      this.encryptionPassword = encryptionPassword;
      this.isInitialized = true;

      logger.info('GitLab Token Service initialized successfully', 'GitlabTokenService');
    } catch (error) {
      logger.error('Failed to initialize GitLab Token Service', 'GitlabTokenService', error);
      throw new Error('Failed to initialize secure token storage');
    }
  }

  /**
   * Check if the service is properly initialized
   */
  isServiceInitialized(): boolean {
    return this.isInitialized && isEncryptionInitialized();
  }

  /**
   * Validate the encryption setup with a password
   */
  async validatePassword(password: string): Promise<boolean> {
    try {
      const isValid = await validateEncryptionSetup(password);
      if (isValid) {
        this.encryptionPassword = password;
        this.isInitialized = true;
      }
      return isValid;
    } catch (error) {
      logger.error('Password validation failed', 'GitlabTokenService', error);
      return false;
    }
  }

  /**
   * Store a GitLab token for an instance
   */
  async storeToken(instance: GitlabInstance, token: string): Promise<void> {
    if (!this.isServiceInitialized()) {
      throw new Error('Token service not initialized. Call initialize() first.');
    }

    try {
      // Validate token format (basic check)
      if (!token || typeof token !== 'string' || token.trim().length < 20) {
        throw new Error('Invalid token format');
      }

      await storeGitlabToken(instance.id, token.trim());

      logger.info(`GitLab token stored for instance: ${instance.name} (${instance.id})`, 'GitlabTokenService');
    } catch (error) {
      logger.error(`Failed to store token for instance: ${instance.id}`, 'GitlabTokenService', error);
      throw new Error('Failed to securely store GitLab token');
    }
  }

  /**
   * Retrieve a GitLab token for an instance
   */
  async getToken(instanceId: string): Promise<string | null> {
    if (!this.isServiceInitialized()) {
      throw new Error('Token service not initialized. Call initialize() first.');
    }

    try {
      const token = await getGitlabToken(instanceId);

      if (token) {
        logger.debug(`GitLab token retrieved for instance: ${instanceId}`, 'GitlabTokenService');
      } else {
        logger.debug(`No GitLab token found for instance: ${instanceId}`, 'GitlabTokenService');
      }

      return token;
    } catch (error) {
      logger.error(`Failed to retrieve token for instance: ${instanceId}`, 'GitlabTokenService', error);
      throw new Error('Failed to retrieve GitLab token');
    }
  }

  /**
   * Remove a GitLab token for an instance
   */
  async removeToken(instanceId: string): Promise<void> {
    if (!this.isServiceInitialized()) {
      throw new Error('Token service not initialized. Call initialize() first.');
    }

    try {
      await removeGitlabToken(instanceId);
      logger.info(`GitLab token removed for instance: ${instanceId}`, 'GitlabTokenService');
    } catch (error) {
      logger.error(`Failed to remove token for instance: ${instanceId}`, 'GitlabTokenService', error);
      throw new Error('Failed to remove GitLab token');
    }
  }

  /**
   * Update token for an instance (remove old, store new)
   */
  async updateToken(instance: GitlabInstance, newToken: string): Promise<void> {
    try {
      // Remove old token if it exists
      await this.removeToken(instance.id).catch(() => {
        // Ignore errors if token doesn't exist
      });

      // Store new token
      await this.storeToken(instance, newToken);

      logger.info(`GitLab token updated for instance: ${instance.name} (${instance.id})`, 'GitlabTokenService');
    } catch (error) {
      logger.error(`Failed to update token for instance: ${instance.id}`, 'GitlabTokenService', error);
      throw new Error('Failed to update GitLab token');
    }
  }

  /**
   * Check if a token exists for an instance
   */
  async hasToken(instanceId: string): Promise<boolean> {
    if (!this.isServiceInitialized()) {
      return false;
    }

    try {
      const token = await this.getToken(instanceId);
      return token !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get all instance IDs that have stored tokens
   */
  async getInstancesWithTokens(): Promise<string[]> {
    if (!this.isServiceInitialized()) {
      return [];
    }

    try {
      // This is a simplified implementation
      // In a real scenario, you might want to store instance metadata separately
      const status = getEncryptionStatus();
      if (!status.hasStoredTokens) {
        return [];
      }

      // For now, return empty array as we don't track instance IDs separately
      // This could be enhanced to store instance metadata
      return [];
    } catch (error) {
      logger.error('Failed to get instances with tokens', 'GitlabTokenService', error);
      return [];
    }
  }

  /**
   * Clear all stored tokens and reset the service
   */
  async clearAllTokens(): Promise<void> {
    try {
      clearAllGitlabTokens();
      this.encryptionPassword = null;
      this.isInitialized = false;

      logger.info('All GitLab tokens cleared and service reset', 'GitlabTokenService');
    } catch (error) {
      logger.error('Failed to clear all tokens', 'GitlabTokenService', error);
      throw new Error('Failed to clear stored tokens');
    }
  }

  /**
   * Get service status information
   */
  getServiceStatus(): {
    initialized: boolean;
    encryptionAvailable: boolean;
    hasStoredTokens: boolean;
    serviceReady: boolean;
  } {
    const encryptionStatus = getEncryptionStatus();

    return {
      initialized: this.isInitialized,
      encryptionAvailable: encryptionStatus.cryptoAvailable,
      hasStoredTokens: encryptionStatus.hasStoredTokens,
      serviceReady: this.isServiceInitialized(),
    };
  }

  /**
   * Export tokens for backup (encrypted)
   */
  async exportTokens(): Promise<string | null> {
    if (!this.isServiceInitialized()) {
      throw new Error('Token service not initialized');
    }

    try {
      // Get all stored tokens (they're already encrypted)
      const storedTokens = localStorage.getItem('gitlab_tokens_encrypted');
      return storedTokens;
    } catch (error) {
      logger.error('Failed to export tokens', 'GitlabTokenService', error);
      return null;
    }
  }

  /**
   * Import tokens from backup
   */
  async importTokens(encryptedTokensJson: string): Promise<void> {
    if (!this.isServiceInitialized()) {
      throw new Error('Token service not initialized');
    }

    try {
      // Validate JSON format
      JSON.parse(encryptedTokensJson);

      // Store the encrypted tokens
      localStorage.setItem('gitlab_tokens_encrypted', encryptedTokensJson);

      logger.info('GitLab tokens imported successfully', 'GitlabTokenService');
    } catch (error) {
      logger.error('Failed to import tokens', 'GitlabTokenService', error);
      throw new Error('Invalid token backup format');
    }
  }

  /**
   * Generate a new secure password for encryption
   */
  generateNewPassword(length: number = 32): string {
    return generateSecurePassword(length);
  }

  /**
   * Change the encryption password
   */
  async changePassword(newPassword: string): Promise<void> {
    if (!this.isServiceInitialized()) {
      throw new Error('Token service not initialized');
    }

    try {
      // Export current tokens
      const currentTokens = await this.exportTokens();
      if (!currentTokens) {
        throw new Error('No tokens to migrate');
      }

      // Clear current encryption
      clearAllGitlabTokens();

      // Initialize with new password
      await initializeEncryption(newPassword);
      this.encryptionPassword = newPassword;

      // Import tokens with new encryption
      await this.importTokens(currentTokens);

      logger.info('Encryption password changed successfully', 'GitlabTokenService');
    } catch (error) {
      logger.error('Failed to change encryption password', 'GitlabTokenService', error);
      throw new Error('Failed to change encryption password');
    }
  }
}

// Singleton instance
export const gitlabTokenService = new GitlabTokenService();
