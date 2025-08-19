import { describe, it, expect } from 'vitest';
import type {
  EnvAccount,
  EnvCredentialsConfig,
  AuthenticationMethod,
  AuthenticationSource,
} from '../index';

describe('Environment Account Types', () => {
  describe('EnvAccount interface', () => {
    it('should accept valid EnvAccount with required fields', () => {
      const validAccount: EnvAccount = {
        name: 'test-user',
        email: 'test@example.com',
        password: 'password123',
      };

      expect(validAccount.name).toBe('test-user');
      expect(validAccount.email).toBe('test@example.com');
      expect(validAccount.password).toBe('password123');
    });

    it('should accept EnvAccount with optional fields', () => {
      const accountWithOptionals: EnvAccount = {
        name: 'admin-user',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        displayName: 'Administrator',
      };

      expect(accountWithOptionals.role).toBe('admin');
      expect(accountWithOptionals.displayName).toBe('Administrator');
    });

    it('should validate required fields are present', () => {
      // This test ensures TypeScript compilation catches missing required fields
      const createAccount = (name: string, email: string, password: string): EnvAccount => ({
        name,
        email,
        password,
      });

      const account = createAccount('user', 'user@test.com', 'pass');
      expect(account).toHaveProperty('name');
      expect(account).toHaveProperty('email');
      expect(account).toHaveProperty('password');
    });
  });

  describe('EnvCredentialsConfig interface', () => {
    it('should accept valid EnvCredentialsConfig with required fields', () => {
      const validConfig: EnvCredentialsConfig = {
        enabled: true,
        autoSignIn: false,
        accounts: [],
      };

      expect(validConfig.enabled).toBe(true);
      expect(validConfig.autoSignIn).toBe(false);
      expect(validConfig.accounts).toEqual([]);
    });

    it('should accept EnvCredentialsConfig with optional fields', () => {
      const configWithOptionals: EnvCredentialsConfig = {
        enabled: true,
        autoSignIn: true,
        accounts: [
          {
            name: 'default',
            email: 'default@example.com',
            password: 'password',
          },
        ],
        defaultAccount: 'default',
      };

      expect(configWithOptionals.defaultAccount).toBe('default');
      expect(configWithOptionals.accounts).toHaveLength(1);
    });

    it('should handle multiple accounts in configuration', () => {
      const multiAccountConfig: EnvCredentialsConfig = {
        enabled: true,
        autoSignIn: false,
        accounts: [
          {
            name: 'user1',
            email: 'user1@example.com',
            password: 'pass1',
            role: 'user',
          },
          {
            name: 'admin',
            email: 'admin@example.com',
            password: 'adminpass',
            role: 'admin',
            displayName: 'System Administrator',
          },
        ],
        defaultAccount: 'admin',
      };

      expect(multiAccountConfig.accounts).toHaveLength(2);
      expect(multiAccountConfig.accounts[0].role).toBe('user');
      expect(multiAccountConfig.accounts[1].displayName).toBe('System Administrator');
    });
  });

  describe('AuthenticationMethod type', () => {
    it('should accept valid authentication methods', () => {
      const manualAuth: AuthenticationMethod = 'manual';
      const envAuth: AuthenticationMethod = 'environment';

      expect(manualAuth).toBe('manual');
      expect(envAuth).toBe('environment');
    });

    it('should be used in type guards', () => {
      const isValidAuthMethod = (method: string): method is AuthenticationMethod => {
        return method === 'manual' || method === 'environment';
      };

      expect(isValidAuthMethod('manual')).toBe(true);
      expect(isValidAuthMethod('environment')).toBe(true);
      expect(isValidAuthMethod('invalid')).toBe(false);
    });
  });

  describe('AuthenticationSource interface', () => {
    it('should accept valid AuthenticationSource for manual auth', () => {
      const manualSource: AuthenticationSource = {
        method: 'manual',
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      expect(manualSource.method).toBe('manual');
      expect(manualSource.accountName).toBeUndefined();
      expect(manualSource.timestamp).toBeInstanceOf(Date);
    });

    it('should accept valid AuthenticationSource for environment auth', () => {
      const envSource: AuthenticationSource = {
        method: 'environment',
        accountName: 'admin-user',
        timestamp: new Date('2024-01-01T12:00:00Z'),
      };

      expect(envSource.method).toBe('environment');
      expect(envSource.accountName).toBe('admin-user');
      expect(envSource.timestamp).toBeInstanceOf(Date);
    });

    it('should handle authentication source validation', () => {
      const validateAuthSource = (source: AuthenticationSource): boolean => {
        if (source.method === 'environment' && !source.accountName) {
          return false;
        }
        return true;
      };

      const validEnvSource: AuthenticationSource = {
        method: 'environment',
        accountName: 'test-account',
        timestamp: new Date(),
      };

      const validManualSource: AuthenticationSource = {
        method: 'manual',
        timestamp: new Date(),
      };

      expect(validateAuthSource(validEnvSource)).toBe(true);
      expect(validateAuthSource(validManualSource)).toBe(true);
    });
  });

  describe('Type integration tests', () => {
    it('should work together in realistic scenarios', () => {
      const config: EnvCredentialsConfig = {
        enabled: true,
        autoSignIn: true,
        accounts: [
          {
            name: 'dev-user',
            email: 'dev@company.com',
            password: 'devpass',
            role: 'developer',
            displayName: 'Development User',
          },
          {
            name: 'admin',
            email: 'admin@company.com',
            password: 'adminpass',
            role: 'admin',
          },
        ],
        defaultAccount: 'dev-user',
      };

      const authSource: AuthenticationSource = {
        method: 'environment',
        accountName: config.defaultAccount,
        timestamp: new Date(),
      };

      expect(config.accounts.find(acc => acc.name === authSource.accountName)).toBeDefined();
      expect(authSource.method).toBe('environment');
    });

    it('should support type-safe account lookup', () => {
      const accounts: EnvAccount[] = [
        {
          name: 'user1',
          email: 'user1@test.com',
          password: 'pass1',
        },
        {
          name: 'user2',
          email: 'user2@test.com',
          password: 'pass2',
          role: 'admin',
        },
      ];

      const findAccountByName = (name: string): EnvAccount | undefined => {
        return accounts.find(account => account.name === name);
      };

      const foundAccount = findAccountByName('user2');
      expect(foundAccount).toBeDefined();
      expect(foundAccount?.role).toBe('admin');

      const notFoundAccount = findAccountByName('nonexistent');
      expect(notFoundAccount).toBeUndefined();
    });
  });
});
