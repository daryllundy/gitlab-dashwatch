import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EnvCredentialsService } from '../envCredentialsService';
import * as envConfig from '../../config/env';

// Mock the env config module
vi.mock('../../config/env', () => ({
  getEnvCredentialsConfig: vi.fn(),
  validateEnvCredentials: vi.fn(),
  validateFeatureToggleConfig: vi.fn(),
}));

describe('EnvCredentialsService - Feature Toggle Configuration', () => {
  let service: EnvCredentialsService;
  const mockGetEnvCredentialsConfig = vi.mocked(envConfig.getEnvCredentialsConfig);
  const mockValidateEnvCredentials = vi.mocked(envConfig.validateEnvCredentials);
  const mockValidateFeatureToggleConfig = vi.mocked(envConfig.validateFeatureToggleConfig);

  // Helper function to create mock config with defaults
  const createMockConfig = (overrides: Partial<envConfig.EnvCredentialsConfig> = {}): envConfig.EnvCredentialsConfig => ({
    enabled: false,
    autoSignIn: false,
    accounts: [],
    allowFallback: true,
    strictMode: false,
    ...overrides
  });

  beforeEach(() => {
    service = new EnvCredentialsService();
    vi.clearAllMocks();
    
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Feature Toggle Methods', () => {
    describe('isFallbackAllowed', () => {
      it('should return true when fallback is allowed', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          allowFallback: true
        }));

        expect(service.isFallbackAllowed()).toBe(true);
      });

      it('should return false when fallback is not allowed', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          allowFallback: false
        }));

        expect(service.isFallbackAllowed()).toBe(false);
      });

      it('should return default value when service is not initialized', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          allowFallback: false
        }));

        expect(service.isFallbackAllowed()).toBe(false);
      });
    });

    describe('isStrictModeEnabled', () => {
      it('should return true when enabled and strict mode is on', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          strictMode: true
        }));

        expect(service.isStrictModeEnabled()).toBe(true);
      });

      it('should return false when disabled', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: false,
          strictMode: true
        }));

        expect(service.isStrictModeEnabled()).toBe(false);
      });

      it('should return false when enabled but strict mode is off', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          strictMode: false
        }));

        expect(service.isStrictModeEnabled()).toBe(false);
      });
    });

    describe('isReady', () => {
      it('should return false when disabled', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: false,
          accounts: [
            { name: 'test', email: 'test@example.com', password: 'password123' }
          ]
        }));

        expect(service.isReady()).toBe(false);
      });

      it('should return false when enabled but no accounts', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          accounts: []
        }));

        expect(service.isReady()).toBe(false);
      });

      it('should return false when enabled with accounts but validation fails', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          accounts: [
            { name: 'test', email: 'invalid-email', password: 'password123' }
          ]
        }));

        expect(service.isReady()).toBe(false);
      });

      it('should return true when enabled with valid accounts', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          accounts: [
            { name: 'test', email: 'test@example.com', password: 'password123' }
          ]
        }));

        expect(service.isReady()).toBe(true);
      });
    });
  });

  describe('Configuration Scenarios', () => {
    describe('Strict mode with fallback disabled', () => {
      it('should handle strict mode configuration correctly', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          allowFallback: false,
          strictMode: true,
          accounts: []
        }));

        expect(service.isStrictModeEnabled()).toBe(true);
        expect(service.isFallbackAllowed()).toBe(false);
        expect(service.isReady()).toBe(false);
      });

      it('should be ready when strict mode has valid accounts', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          allowFallback: false,
          strictMode: true,
          accounts: [
            { name: 'admin', email: 'admin@example.com', password: 'password123', role: 'admin' }
          ]
        }));

        expect(service.isStrictModeEnabled()).toBe(true);
        expect(service.isFallbackAllowed()).toBe(false);
        expect(service.isReady()).toBe(true);
      });
    });

    describe('Auto sign-in with strict mode', () => {
      it('should handle auto sign-in with strict mode enabled', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          autoSignIn: true,
          allowFallback: false,
          strictMode: true,
          accounts: [
            { name: 'test', email: 'test@example.com', password: 'password123' }
          ]
        }));

        expect(service.isAutoSignInEnabled()).toBe(true);
        expect(service.isStrictModeEnabled()).toBe(true);
        expect(service.isFallbackAllowed()).toBe(false);
        expect(service.isReady()).toBe(true);
      });

      it('should handle auto sign-in disabled with strict mode', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          autoSignIn: false,
          allowFallback: false,
          strictMode: true,
          accounts: [
            { name: 'test', email: 'test@example.com', password: 'password123' }
          ]
        }));

        expect(service.isAutoSignInEnabled()).toBe(false);
        expect(service.isStrictModeEnabled()).toBe(true);
        expect(service.isFallbackAllowed()).toBe(false);
        expect(service.isReady()).toBe(true);
      });
    });

    describe('Fallback allowed scenarios', () => {
      it('should allow fallback when environment auth is disabled', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: false,
          allowFallback: true,
          strictMode: false
        }));

        expect(service.isEnabled()).toBe(false);
        expect(service.isFallbackAllowed()).toBe(true);
        expect(service.isStrictModeEnabled()).toBe(false);
        expect(service.isReady()).toBe(false);
      });

      it('should allow fallback when environment auth fails', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: true,
          allowFallback: true,
          strictMode: false,
          accounts: [] // No accounts configured
        }));

        expect(service.isEnabled()).toBe(true);
        expect(service.isFallbackAllowed()).toBe(true);
        expect(service.isStrictModeEnabled()).toBe(false);
        expect(service.isReady()).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle conflicting configuration gracefully', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
          enabled: false,
          autoSignIn: true, // Conflicting: auto sign-in enabled but env auth disabled
          allowFallback: false,
          strictMode: true
        }));

        expect(service.isEnabled()).toBe(false);
        expect(service.isAutoSignInEnabled()).toBe(false); // Should be false because enabled is false
        expect(service.isFallbackAllowed()).toBe(false);
        expect(service.isStrictModeEnabled()).toBe(false); // Should be false because enabled is false
        expect(service.isReady()).toBe(false);
      });

      it('should handle initialization errors with feature toggles', () => {
        mockValidateEnvCredentials.mockImplementation(() => {
          throw new Error('Validation failed');
        });

        service.initialize();

        // After initialization error, should fall back to safe defaults
        expect(service.isEnabled()).toBe(false);
        expect(service.isFallbackAllowed()).toBe(true); // Safe default
        expect(service.isStrictModeEnabled()).toBe(false);
        expect(service.isReady()).toBe(false);
        expect(service.hasErrors()).toBe(true);
      });
    });
  });

  describe('Integration with Configuration Validation', () => {
    it('should work with feature toggle configuration validation', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockValidateFeatureToggleConfig.mockReturnValue({
        isValid: true,
        warnings: []
      });
      
      mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
        enabled: true,
        autoSignIn: true,
        allowFallback: true,
        strictMode: false,
        accounts: [
          { name: 'test', email: 'test@example.com', password: 'password123' }
        ]
      }));

      service.initialize();

      expect(service.isEnabled()).toBe(true);
      expect(service.isAutoSignInEnabled()).toBe(true);
      expect(service.isFallbackAllowed()).toBe(true);
      expect(service.isStrictModeEnabled()).toBe(false);
      expect(service.isReady()).toBe(true);
    });

    it('should handle feature toggle validation warnings', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockValidateFeatureToggleConfig.mockReturnValue({
        isValid: false,
        warnings: ['Auto sign-in is enabled but no environment accounts are configured']
      });
      
      mockGetEnvCredentialsConfig.mockReturnValue(createMockConfig({
        enabled: true,
        autoSignIn: true,
        allowFallback: true,
        strictMode: false,
        accounts: [] // No accounts but auto sign-in enabled
      }));

      service.initialize();

      expect(service.isEnabled()).toBe(true);
      expect(service.isAutoSignInEnabled()).toBe(true);
      expect(service.isReady()).toBe(false); // Not ready because no accounts
    });
  });
});
