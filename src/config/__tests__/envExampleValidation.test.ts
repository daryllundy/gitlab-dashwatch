import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Test to ensure .env.example stays in sync with code requirements
 * This validates that all environment variables used in the code are documented
 * in the .env.example file with proper examples and documentation.
 */
describe('Environment Example Validation', () => {
  const envExamplePath = join(process.cwd(), '.env.example');
  let envExampleContent: string;

  try {
    envExampleContent = readFileSync(envExamplePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read .env.example file: ${error}`);
  }

  describe('Required Supabase Variables', () => {
    it('should document VITE_SUPABASE_URL', () => {
      expect(envExampleContent).toContain('VITE_SUPABASE_URL=');
      expect(envExampleContent).toContain('Supabase project URL');
    });

    it('should document VITE_SUPABASE_ANON_KEY', () => {
      expect(envExampleContent).toContain('VITE_SUPABASE_ANON_KEY=');
      expect(envExampleContent).toContain('Supabase project anon');
    });
  });

  describe('Environment Credentials Configuration Variables', () => {
    it('should document VITE_AUTH_ENV_ENABLED', () => {
      expect(envExampleContent).toContain('VITE_AUTH_ENV_ENABLED=');
      expect(envExampleContent).toContain('Enable environment-based authentication');
      expect(envExampleContent).toContain('Default: false');
    });

    it('should document VITE_AUTH_ENV_AUTO_SIGNIN', () => {
      expect(envExampleContent).toContain('VITE_AUTH_ENV_AUTO_SIGNIN=');
      expect(envExampleContent).toContain('automatic sign-in');
      expect(envExampleContent).toContain('Default: false');
    });

    it('should document VITE_AUTH_ENV_ALLOW_FALLBACK', () => {
      expect(envExampleContent).toContain('VITE_AUTH_ENV_ALLOW_FALLBACK=');
      expect(envExampleContent).toContain('fallback to manual authentication');
      expect(envExampleContent).toContain('Default: true');
    });

    it('should document VITE_AUTH_ENV_STRICT_MODE', () => {
      expect(envExampleContent).toContain('VITE_AUTH_ENV_STRICT_MODE=');
      expect(envExampleContent).toContain('strict mode');
      expect(envExampleContent).toContain('Default: false');
    });

    it('should document VITE_AUTH_ENV_ACCOUNTS', () => {
      expect(envExampleContent).toContain('VITE_AUTH_ENV_ACCOUNTS=');
      expect(envExampleContent).toContain('Comma-separated list of account names');
    });
  });

  describe('Account Configuration Variables', () => {
    it('should provide examples for account EMAIL variables', () => {
      expect(envExampleContent).toContain('VITE_AUTH_ENV_ACCOUNT_ADMIN_EMAIL=');
      expect(envExampleContent).toContain('VITE_AUTH_ENV_ACCOUNT_TESTUSER_EMAIL=');
      expect(envExampleContent).toContain('@example.com');
    });

    it('should provide examples for account PASSWORD variables', () => {
      expect(envExampleContent).toContain('VITE_AUTH_ENV_ACCOUNT_ADMIN_PASSWORD=');
      expect(envExampleContent).toContain('VITE_AUTH_ENV_ACCOUNT_TESTUSER_PASSWORD=');
    });

    it('should provide examples for account ROLE variables', () => {
      expect(envExampleContent).toContain('VITE_AUTH_ENV_ACCOUNT_ADMIN_ROLE=');
      expect(envExampleContent).toContain('VITE_AUTH_ENV_ACCOUNT_TESTUSER_ROLE=');
    });

    it('should include service account example', () => {
      expect(envExampleContent).toContain('SERVICE-ACCOUNT');
      expect(envExampleContent).toContain('service@example.com');
    });
  });

  describe('Documentation Quality', () => {
    it('should include security notes', () => {
      expect(envExampleContent).toContain('Security Notes:');
      expect(envExampleContent).toContain('strong and unique');
      expect(envExampleContent).toContain('Never commit actual credentials');
    });

    it('should include use case examples', () => {
      expect(envExampleContent).toContain('Use Cases:');
      expect(envExampleContent).toContain('Development:');
      expect(envExampleContent).toContain('Testing:');
      expect(envExampleContent).toContain('Production:');
    });

    it('should explain variable naming convention', () => {
      expect(envExampleContent).toContain('UPPERCASE');
      expect(envExampleContent).toContain('ACCOUNTNAME');
    });

    it('should provide template for additional accounts', () => {
      expect(envExampleContent).toContain('Additional account template');
      expect(envExampleContent).toContain('YOURNAME');
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent account names in ACCOUNTS list and examples', () => {
      // Extract account names from VITE_AUTH_ENV_ACCOUNTS
      const accountsMatch = envExampleContent.match(/VITE_AUTH_ENV_ACCOUNTS=([^\n\r]+)/);
      expect(accountsMatch).toBeTruthy();
      
      if (accountsMatch) {
        const accountNames = accountsMatch[1].split(',').map(name => name.trim());
        
        // Check that each account name has corresponding EMAIL and PASSWORD variables
        for (const accountName of accountNames) {
          const upperAccountName = accountName.toUpperCase();
          expect(envExampleContent).toContain(`VITE_AUTH_ENV_ACCOUNT_${upperAccountName}_EMAIL=`);
          expect(envExampleContent).toContain(`VITE_AUTH_ENV_ACCOUNT_${upperAccountName}_PASSWORD=`);
        }
      }
    });

    it('should not contain actual sensitive values', () => {
      // Ensure no real credentials are accidentally included
      // Allow "password" in variable names and documentation, but not standalone passwords
      expect(envExampleContent).not.toMatch(/password\s*[:=]\s*[^-\w\s#]/i);
      expect(envExampleContent).not.toMatch(/[a-f0-9]{32,}/); // No real API keys
      expect(envExampleContent).not.toMatch(/sk-[a-zA-Z0-9]+/); // No real secret keys
    });
  });

  describe('Format and Structure', () => {
    it('should have proper section headers', () => {
      expect(envExampleContent).toContain('# Supabase Configuration');
      expect(envExampleContent).toContain('# Environment Credentials Configuration');
      expect(envExampleContent).toContain('# Account configurations');
    });

    it('should have consistent comment formatting', () => {
      const lines = envExampleContent.split('\n');
      const commentLines = lines.filter(line => line.trim().startsWith('#'));
      
      // Should have substantial documentation
      expect(commentLines.length).toBeGreaterThan(20);
      
      // Comments should be properly formatted
      commentLines.forEach(line => {
        if (line.trim() !== '#') {
          expect(line).toMatch(/^#\s+/); // Comments should have space after #
        }
      });
    });
  });
});

/**
 * Integration test to ensure environment variables are properly parsed
 */
describe('Environment Variable Integration', () => {
  it('should be able to parse all documented variables without errors', async () => {
    // This test ensures that the environment parsing logic can handle
    // all the variables documented in .env.example
    
    // Mock environment variables based on .env.example
    const mockEnv = {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-key',
      VITE_AUTH_ENV_ENABLED: 'true',
      VITE_AUTH_ENV_AUTO_SIGNIN: 'false',
      VITE_AUTH_ENV_ALLOW_FALLBACK: 'true',
      VITE_AUTH_ENV_STRICT_MODE: 'false',
      VITE_AUTH_ENV_ACCOUNTS: 'admin,testuser',
      VITE_AUTH_ENV_ACCOUNT_ADMIN_EMAIL: 'admin@example.com',
      VITE_AUTH_ENV_ACCOUNT_ADMIN_PASSWORD: 'admin-password',
      VITE_AUTH_ENV_ACCOUNT_ADMIN_ROLE: 'admin',
      VITE_AUTH_ENV_ACCOUNT_TESTUSER_EMAIL: 'test@example.com',
      VITE_AUTH_ENV_ACCOUNT_TESTUSER_PASSWORD: 'test-password',
      VITE_AUTH_ENV_ACCOUNT_TESTUSER_ROLE: 'user',
    };

    // Temporarily override import.meta.env for testing
    const originalEnv = import.meta.env;
    Object.assign(import.meta.env, mockEnv);

    try {
      // Import and test the environment configuration
      const { getEnvCredentialsConfig, validateEnvCredentials } = await import('../env');
      
      // Should not throw errors
      expect(() => validateEnvCredentials()).not.toThrow();
      
      const config = getEnvCredentialsConfig();
      expect(config.enabled).toBe(true);
      expect(config.accounts).toHaveLength(2);
      expect(config.accounts[0].name).toBe('admin');
      expect(config.accounts[1].name).toBe('testuser');
    } finally {
      // Restore original environment
      Object.assign(import.meta.env, originalEnv);
    }
  });
});
