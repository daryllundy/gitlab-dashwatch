import { EnvAccount, EnvCredentialsConfig } from '../types';
import { getEnvCredentialsConfig, validateEnvCredentials } from '../config/env';
import { authLogger } from './authLogger';

/**
 * Error types for environment credential operations
 */
export enum EnvCredentialsErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
}

/**
 * Custom error class for environment credential operations
 */
export class EnvCredentialsError extends Error {
  constructor(
    public type: EnvCredentialsErrorType,
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'EnvCredentialsError';
  }
}

/**
 * Service for managing environment-based credentials
 * Provides secure loading, validation, and retrieval of environment accounts
 */
export class EnvCredentialsService {
  private config: EnvCredentialsConfig | null = null;
  private isInitialized = false;
  private initializationError: EnvCredentialsError | null = null;

  /**
   * Initialize the service by loading and validating environment configuration
   */
  public initialize(): void {
    try {
      // Clear any previous initialization error
      this.initializationError = null;
      
      // Validate environment credentials first
      validateEnvCredentials();
      
      // Load configuration
      this.config = getEnvCredentialsConfig();
      this.isInitialized = true;

      // Log initialization
      authLogger.logEnvAuthInit(
        this.config.accounts.length,
        this.config.enabled,
        this.config.autoSignIn
      );

      // Log detailed configuration
      authLogger.logEnvConfigLoaded(
        this.config.accounts.length,
        this.config.enabled,
        this.config.autoSignIn,
        this.config.strictMode,
        this.config.allowFallback
      );

      if (this.config.enabled) {
        console.log(`Environment credentials initialized with ${this.config.accounts.length} account(s)`);
      }
    } catch (error) {
      const sanitizedMessage = this.sanitizeErrorMessage(error);
      this.initializationError = new EnvCredentialsError(
        EnvCredentialsErrorType.INITIALIZATION_FAILED,
        sanitizedMessage,
        error instanceof Error ? error : new Error(String(error))
      );
      
      // Log initialization error
      authLogger.logEnvConfigError('initialization_failed', sanitizedMessage);
      
      console.error('Failed to initialize environment credentials service:', sanitizedMessage);
      
      this.config = {
        enabled: false,
        autoSignIn: false,
        accounts: [],
        allowFallback: true,
        strictMode: false
      };
      this.isInitialized = true;
    }
  }

  /**
   * Get the last initialization error, if any
   */
  public getInitializationError(): EnvCredentialsError | null {
    return this.initializationError;
  }

  /**
   * Check if the service has any errors
   */
  public hasErrors(): boolean {
    return this.initializationError !== null;
  }

  /**
   * Load and return the current environment credentials configuration
   */
  public loadConfiguration(): EnvCredentialsConfig {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    return this.config || {
      enabled: false,
      autoSignIn: false,
      accounts: [],
      allowFallback: true,
      strictMode: false
    };
  }

  /**
   * Get all available environment accounts
   */
  public getAvailableAccounts(): EnvAccount[] {
    const config = this.loadConfiguration();
    
    if (!config.enabled) {
      return [];
    }

    // Return a copy to prevent external modification
    return config.accounts.map(account => ({ ...account }));
  }

  /**
   * Get a specific account by name
   */
  public getAccountByName(name: string): EnvAccount | null {
    try {
      if (!name || typeof name !== 'string') {
        throw new EnvCredentialsError(
          EnvCredentialsErrorType.ACCOUNT_NOT_FOUND,
          'Account name must be a non-empty string'
        );
      }

      const accounts = this.getAvailableAccounts();
      const account = accounts.find(acc => acc.name === name);
      
      if (!account) {
        throw new EnvCredentialsError(
          EnvCredentialsErrorType.ACCOUNT_NOT_FOUND,
          `Environment account "${name}" not found`
        );
      }
      
      return { ...account };
    } catch (error) {
      if (error instanceof EnvCredentialsError) {
        throw error;
      }
      
      throw new EnvCredentialsError(
        EnvCredentialsErrorType.ACCOUNT_NOT_FOUND,
        'Failed to retrieve environment account',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Check if auto sign-in is enabled
   */
  public isAutoSignInEnabled(): boolean {
    const config = this.loadConfiguration();
    return config.enabled && config.autoSignIn;
  }

  /**
   * Check if environment credentials feature is enabled
   */
  public isEnabled(): boolean {
    const config = this.loadConfiguration();
    return config.enabled;
  }

  /**
   * Check if fallback to manual authentication is allowed
   */
  public isFallbackAllowed(): boolean {
    const config = this.loadConfiguration();
    return config.allowFallback;
  }

  /**
   * Check if strict mode is enabled (environment auth required)
   */
  public isStrictModeEnabled(): boolean {
    const config = this.loadConfiguration();
    return config.enabled && config.strictMode;
  }

  /**
   * Check if the feature is properly configured and ready to use
   */
  public isReady(): boolean {
    if (!this.isEnabled()) {
      return false;
    }

    const validation = this.validateCredentials();
    return validation.isValid && this.getAvailableAccounts().length > 0;
  }

  /**
   * Validate that credentials are properly configured
   */
  public validateCredentials(): { isValid: boolean; errors: EnvCredentialsError[] } {
    const errors: EnvCredentialsError[] = [];
    
    try {
      const config = this.loadConfiguration();
      
      if (!config.enabled) {
        return { isValid: true, errors: [] }; // Valid state when disabled
      }

      // Check if we have at least one valid account when enabled
      if (config.accounts.length === 0) {
        errors.push(new EnvCredentialsError(
          EnvCredentialsErrorType.INVALID_CONFIGURATION,
          'Environment credentials are enabled but no valid accounts were found'
        ));
      }

      // Validate each account
      for (const account of config.accounts) {
        const accountErrors = this.validateAccount(account);
        errors.push(...accountErrors);
      }

      // Log validation results
      if (errors.length > 0) {
        const errorSummary = errors.map(err => err.type).join(', ');
        authLogger.logEnvValidationError(errors.length, errorSummary);
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      const validationError = new EnvCredentialsError(
        EnvCredentialsErrorType.VALIDATION_FAILED,
        'Failed to validate environment credentials configuration',
        error instanceof Error ? error : new Error(String(error))
      );
      
      // Log validation failure
      authLogger.logEnvValidationError(1, 'validation_process_failed');
      
      return { isValid: false, errors: [validationError] };
    }
  }

  /**
   * Get the default account for auto sign-in
   */
  public getDefaultAccount(): EnvAccount | null {
    const accounts = this.getAvailableAccounts();
    
    if (accounts.length === 0) {
      return null;
    }

    // Return the first account as default
    return accounts[0];
  }

  /**
   * Get account names for UI display
   */
  public getAccountNames(): string[] {
    const accounts = this.getAvailableAccounts();
    return accounts.map(account => account.name);
  }

  /**
   * Clear sensitive data from memory
   */
  public clearCredentials(): void {
    if (this.config) {
      // Clear passwords from memory
      this.config.accounts.forEach(account => {
        account.password = '';
      });
    }
  }

  /**
   * Reset the service state
   */
  public reset(): void {
    this.clearCredentials();
    this.config = null;
    this.isInitialized = false;
  }

  /**
   * Sanitize error messages to prevent credential exposure
   */
  private sanitizeErrorMessage(error: unknown): string {
    if (!error) return 'Unknown error occurred';
    
    const message = error instanceof Error ? error.message : String(error);
    
    // Remove any potential credential patterns from error messages
    const sanitized = message
      .replace(/password[=:]\s*[^\s]+/gi, 'password=***')
      .replace(/VITE_AUTH_ENV_ACCOUNT_[^_]+_PASSWORD[=:]\s*[^\s]+/gi, 'VITE_AUTH_ENV_ACCOUNT_***_PASSWORD=***')
      .replace(/email[=:]\s*[^\s@]+@[^\s]+/gi, 'email=***@***')
      .replace(/VITE_AUTH_ENV_ACCOUNT_[^_]+_EMAIL[=:]\s*[^\s@]+@[^\s]+/gi, 'VITE_AUTH_ENV_ACCOUNT_***_EMAIL=***@***');
    
    return sanitized;
  }

  /**
   * Private method to validate individual account
   */
  private validateAccount(account: EnvAccount): EnvCredentialsError[] {
    const errors: EnvCredentialsError[] = [];
    
    if (!account.name || typeof account.name !== 'string' || account.name.trim().length === 0) {
      errors.push(new EnvCredentialsError(
        EnvCredentialsErrorType.INVALID_CONFIGURATION,
        `Environment account has invalid or missing name`
      ));
    }

    if (!account.email || typeof account.email !== 'string' || account.email.trim().length === 0) {
      errors.push(new EnvCredentialsError(
        EnvCredentialsErrorType.INVALID_CONFIGURATION,
        `Environment account "${account.name || 'unknown'}" has invalid or missing email`
      ));
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(account.email)) {
        errors.push(new EnvCredentialsError(
          EnvCredentialsErrorType.INVALID_CONFIGURATION,
          `Environment account "${account.name || 'unknown'}" has invalid email format`
        ));
      }
    }

    if (!account.password || typeof account.password !== 'string' || account.password.trim().length === 0) {
      errors.push(new EnvCredentialsError(
        EnvCredentialsErrorType.INVALID_CONFIGURATION,
        `Environment account "${account.name || 'unknown'}" has invalid or missing password`
      ));
    } else if (account.password.length < 6) {
      errors.push(new EnvCredentialsError(
        EnvCredentialsErrorType.SECURITY_VIOLATION,
        `Environment account "${account.name || 'unknown'}" has password that is too short (minimum 6 characters)`
      ));
    }

    // Validate role if provided
    if (account.role !== undefined && (typeof account.role !== 'string' || account.role.trim().length === 0)) {
      errors.push(new EnvCredentialsError(
        EnvCredentialsErrorType.INVALID_CONFIGURATION,
        `Environment account "${account.name || 'unknown'}" has invalid role`
      ));
    }

    return errors;
  }
}

// Export singleton instance
export const envCredentialsService = new EnvCredentialsService();
