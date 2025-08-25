import { toast } from 'sonner';
import type { Settings } from '@/types';
import { STORAGE_CONFIG } from '@/config';
import { 
  isLocalStorageAvailable, 
  getStorageSize, 
  safeJsonParse, 
  safeJsonStringify,
  compareVersions,
  getMigrationPath,
  validateSettings,
  createDefaultSettings
} from '@/lib/utils';

// Storage constants
const { keys, versions } = STORAGE_CONFIG;
const { settings: SETTINGS_KEY, settingsVersion: SETTINGS_VERSION_KEY } = keys;
const { current: CURRENT_VERSION, progression: VERSION_PROGRESSION } = versions;

// Default settings
export const defaultSettings: Settings = createDefaultSettings();

// Local storage data structure
interface LocalStorageData {
  settings: Settings;
  version: string;
  lastUpdated: string;
}



// Load settings from localStorage
export const loadSettings = async (): Promise<Settings> => {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage not available, using default settings');
      return defaultSettings;
    }

    const storedData = localStorage.getItem(SETTINGS_KEY);
    const storedVersion = localStorage.getItem(SETTINGS_VERSION_KEY);
    
    if (!storedData) {
      console.info('No stored settings found, using defaults');
      return defaultSettings;
    }

    const parsedData: LocalStorageData = safeJsonParse(storedData, { settings: defaultSettings, version: '0.0.0', lastUpdated: '' });
    
    // Validate the parsed data structure
    if (!parsedData.settings || !validateSettings(parsedData.settings)) {
      console.warn('Invalid settings structure found, resetting to defaults');
      await resetSettings();
      return defaultSettings;
    }

    // Check version compatibility (for future migrations)
    if (storedVersion !== CURRENT_VERSION) {
      console.info(`Settings version mismatch (stored: ${storedVersion}, current: ${CURRENT_VERSION}), attempting migration`);
      const migratedSettings = await migrateSettings(parsedData.settings, storedVersion || '0.0.0');
      return migratedSettings;
    }

    return parsedData.settings;
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
    toast("Failed to load settings", {
      description: "Settings may be corrupted. Using default settings instead.",
    });
    
    // Reset corrupted settings
    await resetSettings();
    return defaultSettings;
  }
};

// Save settings to localStorage
export const saveSettings = async (settings: Settings): Promise<boolean> => {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage not available, cannot save settings');
      toast("Storage not available", {
        description: "Settings cannot be saved in this browser",
      });
      return false;
    }

    // Validate settings before saving
    if (!validateSettings(settings)) {
      console.error('Invalid settings structure, cannot save');
      toast("Invalid settings", {
        description: "Settings structure is invalid and cannot be saved",
      });
      return false;
    }

    const dataToStore: LocalStorageData = {
      settings,
      version: CURRENT_VERSION,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(SETTINGS_KEY, safeJsonStringify(dataToStore));
    localStorage.setItem(SETTINGS_VERSION_KEY, CURRENT_VERSION);
    
    return true;
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
    
    // Check if it's a quota exceeded error
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      toast("Storage quota exceeded", {
        description: "Not enough space to save settings. Please clear some browser data.",
      });
    } else {
      toast("Failed to save settings", {
        description: "An error occurred while saving your settings",
      });
    }
    
    return false;
  }
};

// Reset settings to defaults
export const resetSettings = async (): Promise<void> => {
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage not available, cannot reset settings');
      return;
    }

    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(SETTINGS_VERSION_KEY);
    
    console.info('Settings reset to defaults');
  } catch (error) {
    console.error('Error resetting settings:', error);
  }
};



// Migration functions for different version transitions
const migrationFunctions: Record<string, (settings: Settings) => Settings> = {
  // Example migration from 0.9.0 to 1.0.0 (for future use)
  '0.9.0_to_1.0.0': (settings: Settings) => {
    // Example: Add new fields, rename properties, etc.
    return {
      ...settings,
      // Add any new required fields or transform existing ones
    };
  },
  
  // Placeholder for future migrations
  '1.0.0_to_1.1.0': (settings: Settings) => {
    // Future migration logic would go here
    return settings;
  }
};



// Migrate settings between versions
const migrateSettings = async (settings: Settings, fromVersion: string): Promise<Settings> => {
  console.info(`Migrating settings from version ${fromVersion} to ${CURRENT_VERSION}`);
  
  try {
    // If versions are the same, no migration needed
    if (fromVersion === CURRENT_VERSION) {
      return settings;
    }
    
    // If fromVersion is newer than current, we can't migrate backwards
    if (compareVersions(fromVersion, CURRENT_VERSION) > 0) {
      console.warn(`Cannot migrate from newer version ${fromVersion} to ${CURRENT_VERSION}. Using defaults.`);
      toast("Settings version incompatible", {
        description: "Your settings are from a newer version. Using defaults.",
      });
      await resetSettings();
      return defaultSettings;
    }
    
    // Get migration path
    const migrationPath = getMigrationPath(fromVersion, CURRENT_VERSION, VERSION_PROGRESSION);
    
    if (migrationPath.length === 0) {
      console.warn(`No migration path found from ${fromVersion} to ${CURRENT_VERSION}. Using defaults.`);
      toast("Settings migration failed", {
        description: "Unable to migrate settings. Using defaults.",
      });
      await resetSettings();
      return defaultSettings;
    }
    
    // Apply migrations in sequence
    let migratedSettings = { ...settings };
    
    for (const migrationKey of migrationPath) {
      const migrationFunction = migrationFunctions[migrationKey];
      
      if (!migrationFunction) {
        console.error(`Migration function not found for ${migrationKey}`);
        throw new Error(`Migration function not found: ${migrationKey}`);
      }
      
      console.info(`Applying migration: ${migrationKey}`);
      migratedSettings = migrationFunction(migratedSettings);
      
      // Validate after each migration step
      if (!validateSettings(migratedSettings)) {
        throw new Error(`Settings validation failed after migration: ${migrationKey}`);
      }
    }
    
    // Save the migrated settings
    const saveSuccess = await saveSettings(migratedSettings);
    
    if (!saveSuccess) {
      throw new Error('Failed to save migrated settings');
    }
    
    toast("Settings migrated successfully", {
      description: `Updated from version ${fromVersion} to ${CURRENT_VERSION}`,
    });
    
    console.info(`Settings successfully migrated from ${fromVersion} to ${CURRENT_VERSION}`);
    return migratedSettings;
    
  } catch (error) {
    console.error('Settings migration failed:', error);
    toast("Settings migration failed", {
      description: "Migration failed. Using default settings.",
    });
    
    // Reset to defaults on migration failure
    await resetSettings();
    return defaultSettings;
  }
};

// Check if settings are corrupted
export const checkSettingsIntegrity = async (): Promise<{ isValid: boolean; error?: string }> => {
  try {
    if (!isLocalStorageAvailable()) {
      return { isValid: false, error: 'localStorage not available' };
    }

    const storedData = localStorage.getItem(SETTINGS_KEY);
    
    if (!storedData) {
      return { isValid: true }; // No settings is valid (will use defaults)
    }

    const parsedData: LocalStorageData = safeJsonParse(storedData, { settings: defaultSettings, version: '0.0.0', lastUpdated: '' });
    
    if (!parsedData.settings) {
      return { isValid: false, error: 'Missing settings property' };
    }

    if (!validateSettings(parsedData.settings)) {
      return { isValid: false, error: 'Settings structure validation failed' };
    }

    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown parsing error' 
    };
  }
};

// Force reset settings with confirmation
export const forceResetSettings = async (): Promise<boolean> => {
  try {
    await resetSettings();
    
    // Verify reset was successful
    const info = getStorageInfo();
    
    if (info.hasSettings) {
      console.error('Settings reset failed - settings still exist');
      return false;
    }
    
    toast("Settings reset successfully", {
      description: "All settings have been reset to defaults",
    });
    
    return true;
  } catch (error) {
    console.error('Force reset failed:', error);
    toast("Reset failed", {
      description: "Unable to reset settings",
    });
    return false;
  }
};

// Export settings for backup
export const exportSettings = async (): Promise<string | null> => {
  try {
    const settings = await loadSettings();
    
    const exportData = {
      settings,
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      appName: 'DashWatch'
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Export settings failed:', error);
    toast("Export failed", {
      description: "Unable to export settings",
    });
    return null;
  }
};

// Import settings from backup
export const importSettings = async (importData: string): Promise<boolean> => {
  try {
    const parsedData = safeJsonParse(importData, {});
    
    // Validate import data structure
    if (!parsedData.settings || !parsedData.version || !parsedData.appName) {
      throw new Error('Invalid import data structure');
    }
    
    if (parsedData.appName !== 'DashWatch') {
      throw new Error('Import data is not from DashWatch');
    }
    
    // Validate settings structure
    if (!validateSettings(parsedData.settings)) {
      throw new Error('Invalid settings structure in import data');
    }
    
    // If importing from an older version, migrate
    let settingsToImport = parsedData.settings;
    if (parsedData.version !== CURRENT_VERSION) {
      settingsToImport = await migrateSettings(parsedData.settings, parsedData.version);
    }
    
    // Save imported settings
    const success = await saveSettings(settingsToImport);
    
    if (success) {
      toast("Settings imported successfully", {
        description: "Your settings have been restored from backup",
      });
    }
    
    return success;
  } catch (error) {
    console.error('Import settings failed:', error);
    toast("Import failed", {
      description: error instanceof Error ? error.message : "Unable to import settings",
    });
    return false;
  }
};

// Get settings storage info (for debugging/admin purposes)
export const getStorageInfo = (): { 
  hasSettings: boolean; 
  version: string | null; 
  lastUpdated: string | null;
  storageSize: number;
  isCorrupted: boolean;
} => {
  try {
    if (!isLocalStorageAvailable()) {
      return { 
        hasSettings: false, 
        version: null, 
        lastUpdated: null, 
        storageSize: 0,
        isCorrupted: false
      };
    }

    const storedData = localStorage.getItem(SETTINGS_KEY);
    const storedVersion = localStorage.getItem(SETTINGS_VERSION_KEY);
    
    if (!storedData) {
      return { 
        hasSettings: false, 
        version: null, 
        lastUpdated: null, 
        storageSize: 0,
        isCorrupted: false
      };
    }

    let parsedData: LocalStorageData;
    let isCorrupted = false;
    
    try {
      parsedData = JSON.parse(storedData);
      isCorrupted = !validateSettings(parsedData.settings);
    } catch {
      isCorrupted = true;
      parsedData = { settings: defaultSettings, version: '0.0.0', lastUpdated: '' };
    }
    
    return {
      hasSettings: true,
      version: storedVersion,
      lastUpdated: parsedData.lastUpdated,
      storageSize: getStorageSize(storedData),
      isCorrupted
    };
  } catch {
    return { 
      hasSettings: false, 
      version: null, 
      lastUpdated: null, 
      storageSize: 0,
      isCorrupted: true
    };
  }
};
