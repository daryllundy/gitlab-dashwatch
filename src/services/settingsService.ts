
// Re-export localStorage settings service functions for backward compatibility
// This maintains the existing API while using localStorage instead of Supabase

export {
  loadSettings,
  saveSettings,
  defaultSettings,
  resetSettings,
  checkSettingsIntegrity,
  forceResetSettings,
  exportSettings,
  importSettings,
  getStorageInfo
} from './localStorageSettingsService';
