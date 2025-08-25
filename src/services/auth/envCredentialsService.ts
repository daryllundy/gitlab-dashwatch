import type { EnvAccount } from '@/types';

import type { EnvCredentialsConfig } from '@/types';

// Placeholder functions - in a real implementation these would be in config/env.ts
function getEnvCredentialsConfig(): EnvCredentialsConfig {
  return {
    enabled: false,
    autoSignIn: false,
    accounts: [],
    allowFallback: true,
    strictMode: false
  };
}

function validateEnvCredentials(): void {
  // Placeholder validation function
}

export enum EnvCredentialsErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}

export class EnvCredentialsError extends Error {
  public readonly name = 'EnvCredentialsError';
  public readonly type: EnvCredentialsErrorType;
  public readonly cause?: Error;

  constructor(type: EnvCredentialsErrorType, message: string, cause?: Error) {
    super(message);
    this.type = type;
    this.cause = cause;
  }
}

import type { ValidationResult } from '@/types';

export class EnvCredentialsService {
  private config: EnvCredentialsConfig | null = null;
  private initialized = false;
  private initializationError: EnvCredentialsError | null = null;

  initialize(): void {
    try {
      validateEnvCredentials();
      this.config = getEnvCredentialsConfig();
      this.initialized = true;
      this.initializationError = null;

      if (this.config.enabled && this.config.accounts.length > 0) {
        console.log(`Environment credentials initialized with ${this.config.accounts.length} account(s)`);
      }
    } catch (error) {
      const sanitizedMessage = this.sanitizeErrorMessage(error);
      console.error('Failed to initialize environment credentials service:', sanitizedMessage);
      
      this.config = {
        enabled: false,
        autoSignIn: false,
        accounts: [],
        allowFallback: true,
        strictMode: false
      };
      this.initialized = true;
      this.initializationError = new EnvCredentialsError(
        EnvCredentialsErrorType.INITIALIZATION_FAILED,
        sanitizedMessage,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  loadConfiguration(): EnvCredentialsConfig {
    if (!this.initialized) {
      this.initialize();
    }
    return { ...this.config! };
  }

  getAvailableAccounts(): EnvAccount[] {
    const config = this.loadConfiguration();
    if (!config.enabled) {
      return [];
    }
    return [...config.accounts];
  }

  getAccountByName(accountName: string): EnvAccount {
    if (!accountName || typeof accountName !== 'string') {
      throw new Error('Account name must be a non-empty string');
    }

    try {
      const accounts = this.getAvailableAccounts();
      const account = accounts.find(acc => acc.name === accountName);
      
      if (!account) {
        throw new Error(`Environment account "${accountName}" not found`);
      }

      return { ...account };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      throw new Error('Failed to retrieve environment account');
    }
  }

  isAutoSignInEnabled(): boolean {
    const config = this.loadConfiguration();
    return config.enabled && config.autoSignIn;
  }

  isEnabled(): boolean {
    const config = this.loadConfiguration();
    return config.enabled;
  }

  isFallbackAllowed(): boolean {
    const config = this.loadConfiguration();
    return config.allowFallback;
  }

  isStrictModeEnabled(): boolean {
    const config = this.loadConfiguration();
    return config.enabled && config.strictMode;
  }

  isReady(): boolean {
    const config = this.loadConfiguration();
    if (!config.enabled || config.accounts.length === 0) {
      return false;
    }
    
    const validation = this.validateCredentials();
    return validation.isValid;
  }

  validateCredentials(): ValidationResult {
    try {
      const config = this.loadConfiguration();
      const errors: Array<{ type: EnvCredentialsErrorType; message: string }> = [];

      if (!config.enabled) {
        return { isValid: true, errors: [] };
      }

      if (config.accounts.length === 0) {
        errors.push({
          type: EnvCredentialsErrorType.INVALID_CONFIGURATION,
          message: 'No environment accounts configured'
        });
        return { isValid: false, errors };
      }

      for (const account of config.accounts) {
        // Validate account name
        if (!account.name || account.name.trim() === '') {
          errors.push({
            type: EnvCredentialsErrorType.INVALID_CONFIGURATION,
            message: 'Account name is required'
          });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!account.email || !emailRegex.test(account.email)) {
          errors.push({
            type: EnvCredentialsErrorType.INVALID_CONFIGURATION,
            message: 'Account has invalid email format'
          });
        }

        // Validate password
        if (!account.password) {
          errors.push({
            type: EnvCredentialsErrorType.INVALID_CONFIGURATION,
            message: 'Account password is required'
          });
        } else if (account.password.length < 6) {
          errors.push({
            type: EnvCredentialsErrorType.SECURITY_VIOLATION,
            message: 'Account has password that is too short (minimum 6 characters)'
          });
        }

        // Validate role if provided
        if (account.role !== undefined && account.role.trim() === '') {
          errors.push({
            type: EnvCredentialsErrorType.INVALID_CONFIGURATION,
            message: 'Account has invalid role'
          });
        }
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          type: EnvCredentialsErrorType.VALIDATION_FAILED,
          message: 'Failed to validate credentials configuration'
        }]
      };
    }
  }

  getDefaultAccount(): EnvAccount | null {
    const accounts = this.getAvailableAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  getAccountNames(): string[] {
    const accounts = this.getAvailableAccounts();
    return accounts.map(account => account.name);
  }

  clearCredentials(): void {
    if (this.config?.accounts) {
      this.config.accounts.forEach(account => {
        account.password = '';
      });
    }
  }

  reset(): void {
    this.config = null;
    this.initialized = false;
    this.initializationError = null;
  }

  hasErrors(): boolean {
    return this.initializationError !== null;
  }

  getInitializationError(): EnvCredentialsError | null {
    return this.initializationError;
  }

  private sanitizeErrorMessage(error: unknown): string {
    let message = error instanceof Error ? error.message : String(error);
    
    // Sanitize passwords
    message = message.replace(/password=[\w\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/gi, 'password=***');
    
    // Sanitize environment variable passwords
    message = message.replace(/VITE_AUTH_ENV_ACCOUNT_\w+_PASSWORD=[\w\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/gi, 'VITE_AUTH_ENV_ACCOUNT_***_PASSWORD=***');
    
    // Sanitize email addresses
    message = message.replace(/email=[\w\d._%+-]+@[\w\d.-]+\.[A-Za-z]{2,}/gi, 'email=***@***');
    
    // Sanitize tokens
    message = message.replace(/token=[\w\d]+/gi, 'token=***');
    
    return message;
  }
}

export const envCredentialsService = new EnvCredentialsService();
