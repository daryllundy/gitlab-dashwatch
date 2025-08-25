// Storage configuration constants
import { STORAGE_CONSTANTS, TIME_CONSTANTS } from '@/constants';

export const STORAGE_CONFIG = {
  keys: {
    settings: 'dashwatch_settings',
    settingsVersion: 'dashwatch_settings_version',
    theme: 'dashwatch_theme',
  },
  versions: {
    current: '1.0.0',
    supported: ['0.9.0', '1.0.0'],
    progression: ['0.9.0', '1.0.0', '1.1.0'],
  },
  limits: {
    maxSettingsSize: STORAGE_CONSTANTS.MAX_SETTINGS_SIZE,
    maxBackupAge: STORAGE_CONSTANTS.MAX_BACKUP_AGE,
  },
  validation: {
    enableStrictValidation: true,
    enableMigration: true,
  },
} as const;
