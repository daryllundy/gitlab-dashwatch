import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, defaultSettings } from '../settingsService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock toast
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('loadSettings', () => {
    it('returns default settings when no stored settings exist', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const settings = await loadSettings();
      expect(settings).toEqual(defaultSettings);
    });

    it('loads settings from localStorage when they exist', async () => {
      const mockStoredData = {
        settings: {
          gitlab: {
            instances: [
              {
                id: '1',
                url: 'https://test.gitlab.com',
                name: 'Test GitLab',
                token: 'test-token',
              },
            ]
          },
          uptime: defaultSettings.uptime,
          dns: defaultSettings.dns,
          servers: defaultSettings.servers,
        },
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'dashwatch_settings') {
          return JSON.stringify(mockStoredData);
        }
        if (key === 'dashwatch_settings_version') {
          return '1.0.0';
        }
        return null;
      });

      const settings = await loadSettings();

      expect(settings.gitlab.instances).toHaveLength(1);
      expect(settings.gitlab.instances[0].name).toBe('Test GitLab');
    });

    it('handles localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const settings = await loadSettings();
      expect(settings).toEqual(defaultSettings);
    });

    it('returns defaults when stored settings are corrupted', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const settings = await loadSettings();
      expect(settings).toEqual(defaultSettings);
    });

    it('returns defaults when localStorage is not available', async () => {
      // Mock localStorage as unavailable
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        configurable: true,
      });

      const settings = await loadSettings();
      expect(settings).toEqual(defaultSettings);

      // Restore localStorage mock
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        configurable: true,
      });
    });
  });

  describe('saveSettings', () => {
    it('saves settings to localStorage successfully', async () => {
      const result = await saveSettings(defaultSettings);

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dashwatch_settings',
        expect.stringContaining('"settings"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dashwatch_settings_version',
        '1.0.0'
      );
    });

    it('handles localStorage quota exceeded error', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      const result = await saveSettings(defaultSettings);
      expect(result).toBe(false);
    });

    it('handles other localStorage errors', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = await saveSettings(defaultSettings);
      expect(result).toBe(false);
    });

    it('returns false when localStorage is not available', async () => {
      // Mock localStorage as unavailable
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        configurable: true,
      });

      const result = await saveSettings(defaultSettings);
      expect(result).toBe(false);

      // Restore localStorage mock
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        configurable: true,
      });
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
