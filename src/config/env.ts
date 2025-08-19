const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue || '';
};

const getOptionalEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  return value || defaultValue || '';
};

const getBooleanEnvVar = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

export const env = {
  get supabase() {
    return {
      url: getEnvVar('VITE_SUPABASE_URL'),
      anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
    };
  },
  get auth() {
    return {
      env: {
        enabled: getBooleanEnvVar('VITE_AUTH_ENV_ENABLED', false),
        autoSignIn: getBooleanEnvVar('VITE_AUTH_ENV_AUTO_SIGNIN', false),
        accounts: getOptionalEnvVar('VITE_AUTH_ENV_ACCOUNTS', ''),
        // Additional configuration options for feature toggling
        allowFallback: getBooleanEnvVar('VITE_AUTH_ENV_ALLOW_FALLBACK', true),
        strictMode: getBooleanEnvVar('VITE_AUTH_ENV_STRICT_MODE', false),
      },
    };
  },
  get isDevelopment() {
    return import.meta.env.DEV;
  },
  get isProduction() {
    return import.meta.env.PROD;
  },
  get mode() {
    return import.meta.env.MODE;
  },
};

export interface EnvAccount {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface EnvCredentialsConfig {
  enabled: boolean;
  autoSignIn: boolean;
  accounts: EnvAccount[];
  allowFallback: boolean;
  strictMode: boolean;
}

const parseEnvAccounts = (): EnvAccount[] => {
  const accountNames = env.auth.env.accounts
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);

  const accounts: EnvAccount[] = [];

  for (const name of accountNames) {
    const email = getOptionalEnvVar(`VITE_AUTH_ENV_ACCOUNT_${name.toUpperCase()}_EMAIL`);
    const password = getOptionalEnvVar(`VITE_AUTH_ENV_ACCOUNT_${name.toUpperCase()}_PASSWORD`);
    const role = getOptionalEnvVar(`VITE_AUTH_ENV_ACCOUNT_${name.toUpperCase()}_ROLE`);

    if (email && password) {
      const account: EnvAccount = {
        name,
        email,
        password,
      };
      if (role) {
        account.role = role;
      }
      accounts.push(account);
    } else if (env.auth.env.enabled) {
      console.warn(`Environment account '${name}' is missing email or password`);
    }
  }

  return accounts;
};

export const getEnvCredentialsConfig = (): EnvCredentialsConfig => {
  return {
    enabled: env.auth.env.enabled,
    autoSignIn: env.auth.env.autoSignIn,
    accounts: parseEnvAccounts(),
    allowFallback: env.auth.env.allowFallback,
    strictMode: env.auth.env.strictMode,
  };
};

export const validateEnv = (): void => {
  try {
    // This will throw if required env vars are missing
    env.supabase.url;
    env.supabase.anonKey;
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
};

export const validateEnvCredentials = (): void => {
  if (!env.auth.env.enabled) {
    return;
  }

  const config = getEnvCredentialsConfig();
  
  if (config.accounts.length === 0 && config.enabled) {
    console.warn('Environment credentials are enabled but no valid accounts were found');
  }

  // Validate account configurations
  for (const account of config.accounts) {
    if (!account.email || !account.password) {
      console.warn(`Invalid environment account configuration for '${account.name}'`);
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(account.email)) {
      console.warn(`Invalid email format for environment account '${account.name}'`);
    }
  }
};

/**
 * Validate feature toggle configuration for consistency
 */
export const validateFeatureToggleConfig = (): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  let isValid = true;

  const config = getEnvCredentialsConfig();

  // Check for conflicting configurations
  if (config.autoSignIn && !config.enabled) {
    warnings.push('Auto sign-in is enabled but environment authentication is disabled');
    isValid = false;
  }

  if (config.autoSignIn && config.accounts.length === 0) {
    warnings.push('Auto sign-in is enabled but no environment accounts are configured');
    isValid = false;
  }

  if (config.strictMode && !config.enabled) {
    warnings.push('Strict mode is enabled but environment authentication is disabled');
    isValid = false;
  }

  if (config.strictMode && !config.allowFallback) {
    warnings.push('Strict mode with fallback disabled may prevent users from signing in if environment auth fails');
  }

  // Validate environment-specific configurations
  if (env.isProduction && config.enabled && config.accounts.length === 0) {
    warnings.push('Environment authentication is enabled in production but no accounts are configured');
    isValid = false;
  }

  return { isValid, warnings };
};
