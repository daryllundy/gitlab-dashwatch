import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EnvCredentialsService } from '../auth/envCredentialsService';
import * as envConfig from '../../config/env';

// Mock the env config module
vi.mock('../../config/env', () => ({
  getEnvCredentialsConfig: vi.fn(),
  validateEnvCredentials: vi.fn(),
}));

describe('EnvCredentialsService', () => {
  let service: EnvCredentialsService;
  const mockGetEnvCredentialsConfig = vi.mocked(envConfig.getEnvCredentialsConfig);
  const mockValidateEnvCredentials = vi.mocked(envConfig.validateEnvCredentials);

  // Helper function to create mock config with defaults
  const createMockConfig = (overrides: Partial<envConfig.EnvCredentialsConfig> = {}) => ({
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

  describe('initialize', () => {
    it('should initialize successfully with valid configuration', () => {
      const mockConfig = {
        enabled: true,
        autoSignIn: false,
        accounts: [
          { name: 'test', email: 'test@example.com', password: 'password123' }
        ],
        allowFallback: true,
        strictMode: false
      };

      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue(mockConfig);

      service.initialize();

      expect(mockValidateEnvCredentials).toHaveBeenCalled();
      expect(mockGetEnvCredentialsConfig).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Environment credentials initialized with 1 account(s)');
      expect(service.hasErrors()).toBe(false);
      expect(service.getInitializationError()).toBeNull();
    });

    it('should handle initialization errors gracefully', () => {
      mockValidateEnvCredentials.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      service.initialize();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize environment credentials service:',
        'Validation failed'
      );
      
      const config = service.loadConfiguration();
      expect(config).toEqual({
        enabled: false,
        autoSignIn: false,
        accounts: [],
        allowFallback: true,
        strictMode: false
      });
      
      expect(service.hasErrors()).toBe(true);
      const error = service.getInitializationError();
      expect(error).toBeTruthy();
      expect(error?.type).toBe('INITIALIZATION_FAILED');
    });

    it('should sanitize error messages containing credentials', () => {
      mockValidateEnvCredentials.mockImplementation(() => {
        throw new Error('Failed to parse VITE_AUTH_ENV_ACCOUNT_ADMIN_PASSWORD=secret123');
      });

      service.initialize();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize environment credentials service:',
        'Failed to parse VITE_AUTH_ENV_ACCOUNT_***_PASSWORD=***'
      );
    });

    it('should not log when credentials are disabled', () => {
      const mockConfig = {
        enabled: false,
        autoSignIn: false,
        accounts: [],
        allowFallback: true,
        strictMode: false
      };

      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue(mockConfig);

      service.initialize();

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('loadConfiguration', () => {
    it('should return configuration after initialization', () => {
      const mockConfig = {
        enabled: true,
        autoSignIn: true,
        accounts: [
          { name: 'admin', email: 'admin@example.com', password: 'secret123', role: 'admin' }
        ],
        allowFallback: true,
        strictMode: false
      };

      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue(mockConfig);

      const config = service.loadConfiguration();

      expect(config).toEqual(mockConfig);
    });

    it('should initialize automatically if not already initialized', () => {
      const mockConfig = {
        enabled: false,
        autoSignIn: false,
        accounts: [],
        allowFallback: true,
        strictMode: false
      };

      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue(mockConfig);

      const config = service.loadConfiguration();

      expect(mockValidateEnvCredentials).toHaveBeenCalled();
      expect(config).toEqual(mockConfig);
    });
  });

  describe('getAvailableAccounts', () => {
    it('should return accounts when enabled', () => {
      const mockAccounts = [
        { name: 'user1', email: 'user1@example.com', password: 'pass1' },
        { name: 'user2', email: 'user2@example.com', password: 'pass2', role: 'admin' }
      ];

      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: mockAccounts
      });

      const accounts = service.getAvailableAccounts();

      expect(accounts).toEqual(mockAccounts);
      expect(accounts).not.toBe(mockAccounts); // Should be a copy
    });

    it('should return empty array when disabled', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: false,
        autoSignIn: false,
        accounts: [
          { name: 'user1', email: 'user1@example.com', password: 'pass1' }
        ]
      });

      const accounts = service.getAvailableAccounts();

      expect(accounts).toEqual([]);
    });

    it('should return empty array when no accounts configured', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: []
      });

      const accounts = service.getAvailableAccounts();

      expect(accounts).toEqual([]);
    });
  });

  describe('getAccountByName', () => {
    beforeEach(() => {
      const mockAccounts = [
        { name: 'admin', email: 'admin@example.com', password: 'adminpass', role: 'admin' },
        { name: 'user', email: 'user@example.com', password: 'userpass' }
      ];

      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: mockAccounts
      });
    });

    it('should return account when found', () => {
      const account = service.getAccountByName('admin');

      expect(account).toEqual({
        name: 'admin',
        email: 'admin@example.com',
        password: 'adminpass',
        role: 'admin'
      });
    });

    it('should throw error when account not found', () => {
      expect(() => service.getAccountByName('nonexistent')).toThrow('Environment account "nonexistent" not found');
    });

    it('should throw error for invalid account name', () => {
      expect(() => service.getAccountByName('')).toThrow('Account name must be a non-empty string');
      expect(() => service.getAccountByName(null as any)).toThrow('Account name must be a non-empty string');
    });

    it('should return a copy of the account', () => {
      const account = service.getAccountByName('admin');
      const originalAccounts = service.getAvailableAccounts();
      
      account!.password = 'modified';
      
      const accountAgain = service.getAccountByName('admin');
      expect(accountAgain!.password).toBe('adminpass');
    });

    it('should handle unexpected errors', () => {
      // Mock getAvailableAccounts to throw an error
      vi.spyOn(service, 'getAvailableAccounts').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      expect(() => service.getAccountByName('admin')).toThrow('Failed to retrieve environment account');
    });
  });

  describe('isAutoSignInEnabled', () => {
    it('should return true when enabled and autoSignIn is true', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: true,
        accounts: []
      });

      expect(service.isAutoSignInEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: false,
        autoSignIn: true,
        accounts: []
      });

      expect(service.isAutoSignInEnabled()).toBe(false);
    });

    it('should return false when enabled but autoSignIn is false', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: []
      });

      expect(service.isAutoSignInEnabled()).toBe(false);
    });
  });

  describe('isEnabled', () => {
    it('should return true when enabled', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: []
      });

      expect(service.isEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: false,
        autoSignIn: false,
        accounts: []
      });

      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('validateCredentials', () => {
    it('should return valid when disabled', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: false,
        autoSignIn: false,
        accounts: []
      });

      const result = service.validateCredentials();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when enabled but no accounts', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: []
      });

      const result = service.validateCredentials();
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_CONFIGURATION');
    });

    it('should return valid with valid accounts', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: [
          { name: 'test', email: 'test@example.com', password: 'password123' }
        ]
      });

      const result = service.validateCredentials();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid with invalid email', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: [
          { name: 'test', email: 'invalid-email', password: 'password123' }
        ]
      });

      const result = service.validateCredentials();
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_CONFIGURATION');
      expect(result.errors[0].message).toContain('invalid email format');
    });

    it('should return invalid with empty password', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: [
          { name: 'test', email: 'test@example.com', password: '' }
        ]
      });

      const result = service.validateCredentials();
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_CONFIGURATION');
    });

    it('should return invalid with short password', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: [
          { name: 'test', email: 'test@example.com', password: '123' }
        ]
      });

      const result = service.validateCredentials();
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('SECURITY_VIOLATION');
      expect(result.errors[0].message).toContain('password that is too short');
    });

    it('should return invalid with missing name', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: [
          { name: '', email: 'test@example.com', password: 'password123' }
        ]
      });

      const result = service.validateCredentials();
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_CONFIGURATION');
    });

    it('should return multiple errors for multiple issues', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: [
          { name: '', email: 'invalid-email', password: '123' }
        ]
      });

      const result = service.validateCredentials();
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3); // name, email, password errors
    });

    it('should handle validation errors gracefully', () => {
      // First initialize the service normally
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: []
      });
      service.initialize();

      // Then mock loadConfiguration to throw an error
      vi.spyOn(service, 'loadConfiguration').mockImplementation(() => {
        throw new Error('Config error');
      });

      const result = service.validateCredentials();
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('VALIDATION_FAILED');
    });
  });

  describe('getDefaultAccount', () => {
    it('should return first account when accounts exist', () => {
      const mockAccounts = [
        { name: 'first', email: 'first@example.com', password: 'pass1' },
        { name: 'second', email: 'second@example.com', password: 'pass2' }
      ];

      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: mockAccounts
      });

      const defaultAccount = service.getDefaultAccount();

      expect(defaultAccount).toEqual(mockAccounts[0]);
    });

    it('should return null when no accounts exist', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: []
      });

      const defaultAccount = service.getDefaultAccount();

      expect(defaultAccount).toBeNull();
    });
  });

  describe('getAccountNames', () => {
    it('should return array of account names', () => {
      const mockAccounts = [
        { name: 'admin', email: 'admin@example.com', password: 'pass1' },
        { name: 'user', email: 'user@example.com', password: 'pass2' }
      ];

      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: mockAccounts
      });

      const names = service.getAccountNames();

      expect(names).toEqual(['admin', 'user']);
    });

    it('should return empty array when no accounts', () => {
      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: []
      });

      const names = service.getAccountNames();

      expect(names).toEqual([]);
    });
  });

  describe('clearCredentials', () => {
    it('should clear passwords from memory', () => {
      const mockAccounts = [
        { name: 'test', email: 'test@example.com', password: 'secret123' }
      ];

      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: mockAccounts
      });

      service.loadConfiguration();
      service.clearCredentials();

      // The original mock accounts should have passwords cleared
      expect(mockAccounts[0].password).toBe('');
    });

    it('should handle null config gracefully', () => {
      expect(() => service.clearCredentials()).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset service state', () => {
      const mockAccounts = [
        { name: 'test', email: 'test@example.com', password: 'secret123' }
      ];

      mockValidateEnvCredentials.mockImplementation(() => {});
      mockGetEnvCredentialsConfig.mockReturnValue({
        enabled: true,
        autoSignIn: false,
        accounts: mockAccounts
      });

      service.loadConfiguration();
      service.reset();

      // Should reinitialize on next call
      const config = service.loadConfiguration();
      expect(mockGetEnvCredentialsConfig).toHaveBeenCalledTimes(2);
    });
  });

  describe('Feature Toggle Configuration', () => {
    describe('isFallbackAllowed', () => {
      it('should return true when fallback is allowed', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          accounts: [],
          allowFallback: true,
          strictMode: false
        });

        expect(service.isFallbackAllowed()).toBe(true);
      });

      it('should return false when fallback is not allowed', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          accounts: [],
          allowFallback: false,
          strictMode: false
        });

        expect(service.isFallbackAllowed()).toBe(false);
      });
    });

    describe('isStrictModeEnabled', () => {
      it('should return true when enabled and strict mode is on', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          accounts: [],
          allowFallback: false,
          strictMode: true
        });

        expect(service.isStrictModeEnabled()).toBe(true);
      });

      it('should return false when disabled', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: false,
          autoSignIn: false,
          accounts: [],
          allowFallback: true,
          strictMode: true
        });

        expect(service.isStrictModeEnabled()).toBe(false);
      });

      it('should return false when enabled but strict mode is off', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          accounts: [],
          allowFallback: true,
          strictMode: false
        });

        expect(service.isStrictModeEnabled()).toBe(false);
      });
    });

    describe('isReady', () => {
      it('should return false when disabled', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: false,
          autoSignIn: false,
          accounts: [
            { name: 'test', email: 'test@example.com', password: 'password123' }
          ],
          allowFallback: true,
          strictMode: false
        });

        expect(service.isReady()).toBe(false);
      });

      it('should return false when enabled but no accounts', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          accounts: [],
          allowFallback: true,
          strictMode: false
        });

        expect(service.isReady()).toBe(false);
      });

      it('should return false when enabled with accounts but validation fails', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          accounts: [
            { name: 'test', email: 'invalid-email', password: 'password123' }
          ],
          allowFallback: true,
          strictMode: false
        });

        expect(service.isReady()).toBe(false);
      });

      it('should return true when enabled with valid accounts', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          accounts: [
            { name: 'test', email: 'test@example.com', password: 'password123' }
          ],
          allowFallback: true,
          strictMode: false
        });

        expect(service.isReady()).toBe(true);
      });
    });

    describe('Configuration edge cases', () => {
      it('should handle strict mode with fallback disabled', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          accounts: [],
          allowFallback: false,
          strictMode: true
        });

        expect(service.isStrictModeEnabled()).toBe(true);
        expect(service.isFallbackAllowed()).toBe(false);
        expect(service.isReady()).toBe(false);
      });

      it('should handle auto sign-in with strict mode', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: true,
          accounts: [
            { name: 'test', email: 'test@example.com', password: 'password123' }
          ],
          allowFallback: false,
          strictMode: true
        });

        expect(service.isAutoSignInEnabled()).toBe(true);
        expect(service.isStrictModeEnabled()).toBe(true);
        expect(service.isFallbackAllowed()).toBe(false);
        expect(service.isReady()).toBe(true);
      });
    });
  });

  describe('Error Handling and Security', () => {
    describe('sanitizeErrorMessage', () => {
      it('should sanitize password values in error messages', () => {
        mockValidateEnvCredentials.mockImplementation(() => {
          throw new Error('Failed to parse password=secret123 in configuration');
        });

        service.initialize();

        expect(console.error).toHaveBeenCalledWith(
          'Failed to initialize environment credentials service:',
          'Failed to parse password=*** in configuration'
        );
      });

      it('should sanitize environment variable passwords', () => {
        mockValidateEnvCredentials.mockImplementation(() => {
          throw new Error('VITE_AUTH_ENV_ACCOUNT_ADMIN_PASSWORD=supersecret not found');
        });

        service.initialize();

        expect(console.error).toHaveBeenCalledWith(
          'Failed to initialize environment credentials service:',
          'VITE_AUTH_ENV_ACCOUNT_***_PASSWORD=*** not found'
        );
      });

      it('should sanitize email addresses', () => {
        mockValidateEnvCredentials.mockImplementation(() => {
          throw new Error('Invalid email=admin@company.com format');
        });

        service.initialize();

        expect(console.error).toHaveBeenCalledWith(
          'Failed to initialize environment credentials service:',
          'Invalid email=***@*** format'
        );
      });

      it('should handle non-Error objects', () => {
        mockValidateEnvCredentials.mockImplementation(() => {
          throw 'String error with password=secret123';
        });

        service.initialize();

        expect(console.error).toHaveBeenCalledWith(
          'Failed to initialize environment credentials service:',
          'String error with password=***'
        );
      });
    });

    describe('EnvCredentialsError', () => {
      it('should create error with correct properties', () => {
        mockValidateEnvCredentials.mockImplementation(() => {
          throw new Error('Test error');
        });

        service.initialize();

        const error = service.getInitializationError();
        expect(error).toBeTruthy();
        expect(error?.name).toBe('EnvCredentialsError');
        expect(error?.type).toBe('INITIALIZATION_FAILED');
        expect(error?.cause).toBeInstanceOf(Error);
      });
    });

    describe('Account validation security', () => {
      it('should not expose credentials in validation error messages', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          accounts: [
            { name: 'test', email: 'invalid-email', password: 'secret123' }
          ]
        });

        const result = service.validateCredentials();
        
        // Check that error messages don't contain actual credentials
        result.errors.forEach(error => {
          expect(error.message).not.toContain('secret123');
          expect(error.message).not.toContain('invalid-email');
        });
      });

      it('should validate role field when provided', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          accounts: [
            { name: 'test', email: 'test@example.com', password: 'password123', role: '' }
          ]
        });

        // Initialize the service first
        service.initialize();

        const result = service.validateCredentials();
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.message.includes('invalid role'))).toBe(true);
      });

      it('should accept valid role field', () => {
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: true,
          autoSignIn: false,
          accounts: [
            { name: 'test', email: 'test@example.com', password: 'password123', role: 'admin' }
          ]
        });

        const result = service.validateCredentials();
        expect(result.isValid).toBe(true);
      });
    });

    describe('Error state management', () => {
      it('should track initialization errors', () => {
        expect(service.hasErrors()).toBe(false);
        
        mockValidateEnvCredentials.mockImplementation(() => {
          throw new Error('Init failed');
        });

        service.initialize();
        
        expect(service.hasErrors()).toBe(true);
        expect(service.getInitializationError()).toBeTruthy();
      });

      it('should clear errors on successful initialization', () => {
        // First, cause an error
        mockValidateEnvCredentials.mockImplementation(() => {
          throw new Error('Init failed');
        });
        service.initialize();
        expect(service.hasErrors()).toBe(true);

        // Then, successful initialization
        mockValidateEnvCredentials.mockImplementation(() => {});
        mockGetEnvCredentialsConfig.mockReturnValue({
          enabled: false,
          autoSignIn: false,
          accounts: []
        });
        service.initialize();
        
        expect(service.hasErrors()).toBe(false);
        expect(service.getInitializationError()).toBeNull();
      });
    });
  });
});
