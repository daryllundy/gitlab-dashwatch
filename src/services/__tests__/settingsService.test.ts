import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, defaultSettings } from '../settingsService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve()),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('returns default settings when user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      const settings = await loadSettings();
      expect(settings).toEqual(defaultSettings);
    });

    it('loads settings from Supabase when user is authenticated', async () => {
      const mockUser = { id: 'test-user-id' };
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
      });

      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [
              {
                id: '1',
                url: 'https://test.gitlab.com',
                name: 'Test GitLab',
                token: 'test-token',
              },
            ],
            error: null,
          })),
        })),
      };

      (supabase.from as any).mockReturnValue(mockFromChain);

      const settings = await loadSettings();

      expect(supabase.from).toHaveBeenCalledWith('gitlab_instances');
      expect(settings.gitlab.instances).toHaveLength(1);
      expect(settings.gitlab.instances[0].name).toBe('Test GitLab');
    });

    it('handles Supabase errors gracefully', async () => {
      const mockUser = { id: 'test-user-id' };
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
      });

      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: new Error('Database error'),
          })),
        })),
      };

      (supabase.from as any).mockReturnValue(mockFromChain);

      const settings = await loadSettings();
      expect(settings).toEqual(defaultSettings);
    });

    it('uses defaults when no data is returned for a section', async () => {
      const mockUser = { id: 'test-user-id' };
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
      });

      const mockFromChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [], // Empty array
            error: null,
          })),
        })),
      };

      (supabase.from as any).mockReturnValue(mockFromChain);

      const settings = await loadSettings();
      
      // Should use defaults when sections are empty
      expect(settings.gitlab).toEqual(defaultSettings.gitlab);
      expect(settings.uptime).toEqual(defaultSettings.uptime);
    });
  });

  describe('saveSettings', () => {
    it('returns false when user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
      });

      const result = await saveSettings(defaultSettings);
      expect(result).toBe(false);
    });

    it('saves settings to Supabase when user is authenticated', async () => {
      const mockUser = { id: 'test-user-id' };
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
      });

      const mockDeleteChain = {
        eq: vi.fn(() => Promise.resolve()),
      };

      const mockInsertChain = {
        error: null,
      };

      const mockFromMethod = vi.fn(() => ({
        delete: vi.fn(() => mockDeleteChain),
        insert: vi.fn(() => Promise.resolve(mockInsertChain)),
      }));

      (supabase.from as any).mockImplementation(mockFromMethod);

      const result = await saveSettings(defaultSettings);

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('gitlab_instances');
      expect(supabase.from).toHaveBeenCalledWith('uptime_websites');
      expect(supabase.from).toHaveBeenCalledWith('dns_domains');
      expect(supabase.from).toHaveBeenCalledWith('server_instances');
    });

    it('handles save errors gracefully', async () => {
      const mockUser = { id: 'test-user-id' };
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
      });

      const mockFromMethod = vi.fn()
        .mockReturnValue({
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve()),
          })),
          insert: vi.fn(() => Promise.resolve({ 
            error: new Error('Insert failed') 
          })),
        });

      (supabase.from as any).mockImplementation(mockFromMethod);

      const result = await saveSettings(defaultSettings);
      expect(result).toBe(false);
    });
  });

  describe('defaultSettings', () => {
    it('has the correct structure', () => {
      expect(defaultSettings).toHaveProperty('gitlab.instances');
      expect(defaultSettings).toHaveProperty('uptime.websites');
      expect(defaultSettings).toHaveProperty('dns.domains');
      expect(defaultSettings).toHaveProperty('servers.instances');

      expect(Array.isArray(defaultSettings.gitlab.instances)).toBe(true);
      expect(Array.isArray(defaultSettings.uptime.websites)).toBe(true);
      expect(Array.isArray(defaultSettings.dns.domains)).toBe(true);
      expect(Array.isArray(defaultSettings.servers.instances)).toBe(true);
    });

    it('contains sample data', () => {
      expect(defaultSettings.gitlab.instances.length).toBeGreaterThan(0);
      expect(defaultSettings.uptime.websites.length).toBeGreaterThan(0);
      expect(defaultSettings.dns.domains.length).toBeGreaterThan(0);
      expect(defaultSettings.servers.instances.length).toBeGreaterThan(0);
    });
  });
});