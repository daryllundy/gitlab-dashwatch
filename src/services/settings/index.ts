// Settings domain services
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

// Re-export for backward compatibility
export { settingsService } from './settingsService';
