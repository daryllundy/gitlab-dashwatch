import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadSettings,
  saveSettings,
  resetSettings,
  defaultSettings,
  checkSettingsIntegrity,
  getStorageInfo,
  exportSettings,
  importSettings
} from '../localStorageSettingsService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock toast
vi.mock('sonner', () => ({
  toast: vi.fn()
}));

describe('localStorageSettingsService', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('loadSettings', () => {
    it('should return default settings when no stored settings exist', async () => {
      const settings = await loadSettings();
      expect(settings).toEqual(defaultSettings);
    });

    it('should load valid stored settings', async () => {
      const testSettings = {
        ...defaultSettings,
        gitlab: {
          instances: [{ url: 'https://test.gitlab.com', name: 'Test GitLab', token: 'test-token' }]
        }
      };

      const storageData = {
        settings: testSettings,
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      };

      localStorageMock.setItem('dashwatch_settings', JSON.stringify(storageData));
      localStorageMock.setItem('dashwatch_settings_version', '1.0.0');

      const loadedSettings = await loadSettings();
      expect(loadedSettings).toEqual(testSettings);
    });

    it('should return defaults for corrupted settings', async () => {
      localStorageMock.setItem('dashwatch_settings', 'invalid json');
      
      const settings = await loadSettings();
      expect(settings).toEqual(defaultSettings);
    });
  });

  describe('saveSettings', () => {
    it('should save valid settings to localStorage', async () => {
      const testSettings = {
        ...defaultSettings,
        gitlab: {
          instances: [{ url: 'https://test.gitlab.com', name: 'Test GitLab', token: 'test-token' }]
        }
      };

      const success = await saveSettings(testSettings);
      expect(success).toBe(true);

      const storedData = localStorageMock.getItem('dashwatch_settings');
      expect(storedData).toBeTruthy();
      
      const parsedData = JSON.parse(storedData!);
      expect(parsedData.settings).toEqual(testSettings);
      expect(parsedData.version).toBe('1.0.0');
    });

    it('should reject invalid settings', async () => {
      const invalidSettings = {
        gitlab: { instances: 'invalid' }, // should be array
        uptime: { websites: [] },
        dns: { domains: [] },
        servers: { instances: [] }
      } as any;

      const success = await saveSettings(invalidSettings);
      expect(success).toBe(false);
    });
  });

  describe('resetSettings', () => {
    it('should remove settings from localStorage', async () => {
      localStorageMock.setItem('dashwatch_settings', 'test');
      localStorageMock.setItem('dashwatch_settings_version', '1.0.0');

      await resetSettings();

      expect(localStorageMock.getItem('dashwatch_settings')).toBeNull();
      expect(localStorageMock.getItem('dashwatch_settings_version')).toBeNull();
    });
  });

  describe('checkSettingsIntegrity', () => {
    it('should return valid for no settings', async () => {
      const result = await checkSettingsIntegrity();
      expect(result.isValid).toBe(true);
    });

    it('should detect corrupted settings', async () => {
      // Set settings with invalid structure that will fail validation
      const invalidSettings = {
        settings: {
          gitlab: null, // This should fail validation
          uptime: { websites: [] },
          dns: { domains: [] },
          servers: { instances: [] }
        },
        version: '1.0.0',
        lastUpdated: new Date().toISOString()
      };
      
      localStorageMock.setItem('dashwatch_settings', JSON.stringify(invalidSettings));
      
      const result = await checkSettingsIntegrity();
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('getStorageInfo', () => {
    it('should return correct info when no settings exist', () => {
      const info = getStorageInfo();
      expect(info.hasSettings).toBe(false);
      expect(info.version).toBeNull();
      expect(info.lastUpdated).toBeNull();
      expect(info.storageSize).toBe(0);
      expect(info.isCorrupted).toBe(false);
    });

    it('should return correct info for valid settings', () => {
      const storageData = {
        settings: defaultSettings,
        version: '1.0.0',
        lastUpdated: '2023-01-01T00:00:00.000Z'
      };

      localStorageMock.setItem('dashwatch_settings', JSON.stringify(storageData));
      localStorageMock.setItem('dashwatch_settings_version', '1.0.0');

      const info = getStorageInfo();
      expect(info.hasSettings).toBe(true);
      expect(info.version).toBe('1.0.0');
      expect(info.lastUpdated).toBe('2023-01-01T00:00:00.000Z');
      expect(info.storageSize).toBeGreaterThan(0);
      expect(info.isCorrupted).toBe(false);
    });
  });

  describe('exportSettings', () => {
    it('should export settings as JSON string', async () => {
      const exportData = await exportSettings();
      expect(exportData).toBeTruthy();
      
      const parsed = JSON.parse(exportData!);
      expect(parsed.settings).toEqual(defaultSettings);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.appName).toBe('DashWatch');
      expect(parsed.exportedAt).toBeTruthy();
    });
  });

  describe('importSettings', () => {
    it('should import valid settings', async () => {
      const exportData = {
        settings: defaultSettings,
        version: '1.0.0',
        appName: 'DashWatch',
        exportedAt: new Date().toISOString()
      };

      const success = await importSettings(JSON.stringify(exportData));
      expect(success).toBe(true);

      const storedData = localStorageMock.getItem('dashwatch_settings');
      expect(storedData).toBeTruthy();
    });

    it('should reject invalid import data', async () => {
      const success = await importSettings('invalid json');
      expect(success).toBe(false);
    });

    it('should reject data from wrong app', async () => {
      const exportData = {
        settings: defaultSettings,
        version: '1.0.0',
        appName: 'WrongApp',
        exportedAt: new Date().toISOString()
      };

      const success = await importSettings(JSON.stringify(exportData));
      expect(success).toBe(false);
    });
  });
});
