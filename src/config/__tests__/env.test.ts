import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('env configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exports correct environment variables', async () => {
    // Mock import.meta.env for this test
    vi.stubGlobal('import.meta', {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        DEV: false,
        PROD: true,
        MODE: 'production',
      },
    });

    const { env } = await import('../env');

    expect(env.supabase.url).toBe('https://test.supabase.co');
    expect(env.supabase.anonKey).toBe('test-anon-key');
    expect(env.isDevelopment).toBe(false);
    expect(env.isProduction).toBe(true);
    expect(env.mode).toBe('production');
  });

  it('validates environment successfully with all vars present', async () => {
    vi.stubGlobal('import.meta', {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        DEV: false,
        PROD: true,
        MODE: 'production',
      },
    });

    const { validateEnv } = await import('../env');

    expect(() => validateEnv()).not.toThrow();
  });

  it('throws error when required environment variable is missing', async () => {
    // Mock missing environment variable
    vi.stubGlobal('import.meta', {
      env: {
        VITE_SUPABASE_URL: undefined,
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        DEV: false,
        PROD: true,
        MODE: 'production',
      },
    });

    const { validateEnv } = await import('../env');

    expect(() => validateEnv()).toThrow();
  });

  it('throws error when Supabase anon key is missing', async () => {
    vi.stubGlobal('import.meta', {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: undefined,
        DEV: false,
        PROD: true,
        MODE: 'production',
      },
    });

    const { validateEnv } = await import('../env');

    expect(() => validateEnv()).toThrow();
  });

  it('handles development environment correctly', async () => {
    vi.stubGlobal('import.meta', {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        DEV: true,
        PROD: false,
        MODE: 'development',
      },
    });

    const { env } = await import('../env');

    expect(env.isDevelopment).toBe(true);
    expect(env.isProduction).toBe(false);
    expect(env.mode).toBe('development');
  });
});