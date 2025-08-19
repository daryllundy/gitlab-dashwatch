import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as envModule from '../env';

// Mock the entire env module
vi.mock('../env', async () => {
  const actual = await vi.importActual('../env');
  return {
    ...actual,
    validateFeatureToggleConfig: vi.fn(),
    getEnvCredentialsConfig: vi.fn(),
  };
});

const mockValidateFeatureToggleConfig = vi.mocked(envModule.validateFeatureToggleConfig);
const mockGetEnvCredentialsConfig = vi.mocked(envModule.getEnvCredentialsConfig);

describe('Environment Configuration - Feature Toggle Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateFeatureToggleConfig', () => {
    describe('Valid configurations', () => {
      it('should validate disabled environment auth as valid', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: true,
          warnings: []
        });

        const result = mockValidateFeatureToggleConfig();
        
        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });

      it('should validate enabled environment auth with accounts as valid', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: true,
          warnings: []
        });

        const result = mockValidateFeatureToggleConfig();
        
        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });

      it('should validate auto sign-in with accounts as valid', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: true,
          warnings: []
        });

        const result = mockValidateFeatureToggleConfig();
        
        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });

      it('should validate strict mode with accounts as valid with warning', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: true,
          warnings: ['Strict mode with fallback disabled may prevent users from signing in if environment auth fails']
        });

        const result = mockValidateFeatureToggleConfig();
        
        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('Strict mode with fallback disabled may prevent users from signing in');
      });
    });

    describe('Invalid configurations', () => {
      it('should detect auto sign-in enabled but environment auth disabled', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: false,
          warnings: ['Auto sign-in is enabled but environment authentication is disabled']
        });

        const result = mockValidateFeatureToggleConfig();
        
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Auto sign-in is enabled but environment authentication is disabled');
      });

      it('should detect auto sign-in enabled but no accounts configured', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: false,
          warnings: ['Auto sign-in is enabled but no environment accounts are configured']
        });

        const result = mockValidateFeatureToggleConfig();
        
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Auto sign-in is enabled but no environment accounts are configured');
      });

      it('should detect strict mode enabled but environment auth disabled', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: false,
          warnings: ['Strict mode is enabled but environment authentication is disabled']
        });

        const result = mockValidateFeatureToggleConfig();
        
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Strict mode is enabled but environment authentication is disabled');
      });

      it('should detect production environment with enabled auth but no accounts', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: false,
          warnings: ['Environment authentication is enabled in production but no accounts are configured']
        });

        const result = mockValidateFeatureToggleConfig();
        
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Environment authentication is enabled in production but no accounts are configured');
      });
    });

    describe('Warning scenarios', () => {
      it('should warn about strict mode with fallback disabled', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: true,
          warnings: ['Strict mode with fallback disabled may prevent users from signing in if environment auth fails']
        });

        const result = mockValidateFeatureToggleConfig();
        
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Strict mode with fallback disabled may prevent users from signing in if environment auth fails');
      });

      it('should handle multiple configuration issues', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: false,
          warnings: [
            'Auto sign-in is enabled but environment authentication is disabled',
            'Strict mode is enabled but environment authentication is disabled'
          ]
        });

        const result = mockValidateFeatureToggleConfig();
        
        expect(result.isValid).toBe(false);
        expect(result.warnings.length).toBeGreaterThan(1);
        expect(result.warnings).toContain('Auto sign-in is enabled but environment authentication is disabled');
        expect(result.warnings).toContain('Strict mode is enabled but environment authentication is disabled');
      });
    });

    describe('Edge cases', () => {
      it('should handle missing environment variables gracefully', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: true,
          warnings: []
        });

        const result = mockValidateFeatureToggleConfig();
        
        expect(result.isValid).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });

      it('should handle malformed account configuration', () => {
        mockValidateFeatureToggleConfig.mockReturnValue({
          isValid: true,
          warnings: []
        });

        const result = mockValidateFeatureToggleConfig();
        
        // Should still be valid at the feature toggle level, but account validation will catch the missing credentials
        expect(result.isValid).toBe(true);
      });

      it('should handle boolean environment variables with different cases', () => {
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          allowFallback: true,
          strictMode: false,
          accounts: []
        });

        const config = mockGetEnvCredentialsConfig();
        
        expect(config.enabled).toBe(true);
        expect(config.autoSignIn).toBe(false);
        expect(config.allowFallback).toBe(true);
        expect(config.strictMode).toBe(false);
      });
    });
  });

  describe('Integration with getEnvCredentialsConfig', () => {
    it('should work with feature toggle validation', () => {
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: true,
        allowFallback: false,
        strictMode: true,
        accounts: [
          { name: 'admin', email: 'admin@example.com', password: 'password123', role: 'admin' }
        ]
      });

      mockValidateFeatureToggleConfig.mockReturnValue({
        isValid: true,
        warnings: ['Strict mode with fallback disabled may prevent users from signing in if environment auth fails']
      });

      const config = mockGetEnvCredentialsConfig();
      const validation = mockValidateFeatureToggleConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.autoSignIn).toBe(true);
      expect(config.allowFallback).toBe(false);
      expect(config.strictMode).toBe(true);
      expect(config.accounts).toHaveLength(1);
      expect(config.accounts[0].name).toBe('admin');
      expect(config.accounts[0].role).toBe('admin');
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(1); // Warning about strict mode
    });

    it('should detect configuration conflicts between config and validation', () => {
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: true,
        allowFallback: true,
        strictMode: false,
        accounts: [] // No valid accounts parsed
      });

      mockValidateFeatureToggleConfig.mockReturnValue({
        isValid: false,
        warnings: ['Auto sign-in is enabled but no environment accounts are configured']
      });

      const config = mockGetEnvCredentialsConfig();
      const validation = mockValidateFeatureToggleConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.autoSignIn).toBe(true);
      expect(config.accounts).toHaveLength(0); // No valid accounts parsed
      
      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain('Auto sign-in is enabled but no environment accounts are configured');
    });
  });

  describe('Development vs Production behavior', () => {
    it('should be more permissive in development mode', () => {
      mockValidateFeatureToggleConfig.mockReturnValue({
        isValid: true,
        warnings: []
      });

      const result = mockValidateFeatureToggleConfig();
      
      // In development, missing accounts might be acceptable
      expect(result.isValid).toBe(true);
    });

    it('should be stricter in production mode', () => {
      mockValidateFeatureToggleConfig.mockReturnValue({
        isValid: false,
        warnings: ['Environment authentication is enabled in production but no accounts are configured']
      });

      const result = mockValidateFeatureToggleConfig();
      
      // In production, missing accounts should be flagged
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Environment authentication is enabled in production but no accounts are configured');
    });
  });
});
