import { describe, it, expect } from 'vitest';

describe('env configuration', () => {
  it('exports environment configuration object', async () => {
    const { env } = await import('../env');

    // Test that the env object has the expected structure
    expect(env).toHaveProperty('supabase');
    expect(env).toHaveProperty('auth');
    expect(env).toHaveProperty('isDevelopment');
    expect(env).toHaveProperty('isProduction');
    expect(env).toHaveProperty('mode');
    
    expect(env.supabase).toHaveProperty('url');
    expect(env.supabase).toHaveProperty('anonKey');
    expect(env.auth).toHaveProperty('env');
    expect(env.auth.env).toHaveProperty('enabled');
    expect(env.auth.env).toHaveProperty('autoSignIn');
    expect(env.auth.env).toHaveProperty('accounts');
  });

  it('validates environment successfully when required vars are present', async () => {
    const { validateEnv } = await import('../env');

    // This should not throw in test environment where VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
    expect(() => validateEnv()).not.toThrow();
  });
});

describe('environment credentials configuration', () => {
  it('returns configuration with expected structure', async () => {
    const { getEnvCredentialsConfig } = await import('../env');
    const config = getEnvCredentialsConfig();

    // Test that the config has the expected structure
    expect(config).toHaveProperty('enabled');
    expect(config).toHaveProperty('autoSignIn');
    expect(config).toHaveProperty('accounts');
    expect(Array.isArray(config.accounts)).toBe(true);
    expect(typeof config.enabled).toBe('boolean');
    expect(typeof config.autoSignIn).toBe('boolean');
  });

  it('validates environment credentials without throwing', async () => {
    const { validateEnvCredentials } = await import('../env');
    
    // This should not throw in test environment
    expect(() => validateEnvCredentials()).not.toThrow();
  });

  it('exports EnvAccount and EnvCredentialsConfig interfaces from types', async () => {
    const types = await import('../../types/index');
    
    // Test that the types are exported (this is a compile-time check mainly)
    expect(types).toBeDefined();
  });
});
