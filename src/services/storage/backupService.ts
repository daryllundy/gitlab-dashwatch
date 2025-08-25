// Backup service for data export and import operations
// This service handles backup creation and restoration of application data
import { downloadFile, generateTimestampedFilename, safeJsonParse, safeJsonStringify } from '@/lib/utils';
import { APP_CONFIG, STORAGE_CONFIG } from '@/config';
import { FILE_CONSTANTS } from '@/constants';

import type { BackupData, BackupOptions, RestoreResult } from '@/types';

class BackupService {
  async createBackup(options: Partial<BackupOptions> = {}): Promise<BackupData> {
    const defaultOptions: BackupOptions = {
      includeSettings: true,
      includeMonitoringData: false,
      format: 'json',
      compress: false
    };

    const finalOptions = { ...defaultOptions, ...options };

    const backupData: BackupData = {
      version: STORAGE_CONFIG.versions.current,
      timestamp: new Date(),
      settings: {},
      metadata: {
        userAgent: navigator.userAgent,
        appVersion: APP_CONFIG.version,
        exportedBy: APP_CONFIG.name
      }
    };

    if (finalOptions.includeSettings) {
      // In a real implementation, this would get settings from the settings service
      backupData.settings = this.getSettingsForBackup();
    }

    return backupData;
  }

  async exportBackup(backupData: BackupData, filename?: string): Promise<void> {
    const exportFilename = filename || generateTimestampedFilename(FILE_CONSTANTS.DEFAULT_BACKUP_FILENAME, 'json');
    const dataStr = safeJsonStringify(backupData, '{}');
    
    downloadFile(dataStr, exportFilename, 'application/json');
  }

  async importBackup(file: File): Promise<RestoreResult> {
    try {
      const text = await file.text();
      const backupData: BackupData = safeJsonParse(text, {} as BackupData);
      
      return this.restoreFromBackup(backupData);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to parse backup file',
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async restoreFromBackup(backupData: BackupData): Promise<RestoreResult> {
    const result: RestoreResult = {
      success: true,
      message: 'Backup restored successfully',
      warnings: [],
      errors: []
    };

    try {
      // Validate backup data
      if (!this.validateBackupData(backupData)) {
        result.success = false;
        result.message = 'Invalid backup data format';
        result.errors.push('Backup data validation failed');
        return result;
      }

      // Restore settings
      if (backupData.settings && Object.keys(backupData.settings).length > 0) {
        try {
          await this.restoreSettings(backupData.settings);
        } catch (error) {
          result.warnings.push('Some settings could not be restored');
          result.errors.push(error instanceof Error ? error.message : 'Settings restore failed');
        }
      }

      // Add version compatibility warnings
      if (backupData.version !== STORAGE_CONFIG.versions.current) {
        result.warnings.push(`Backup was created with version ${backupData.version}, current version is ${STORAGE_CONFIG.versions.current}`);
      }

    } catch (error) {
      result.success = false;
      result.message = 'Failed to restore backup';
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  private validateBackupData(data: unknown): data is BackupData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const backup = data as Partial<BackupData>;
    
    return !!(
      backup.version &&
      backup.timestamp &&
      backup.settings &&
      backup.metadata
    );
  }

  private getSettingsForBackup(): Record<string, unknown> {
    // Placeholder implementation
    // In a real implementation, this would get settings from the settings service
    return {};
  }

  private async restoreSettings(settings: Record<string, unknown>): Promise<void> {
    // Placeholder implementation
    // In a real implementation, this would restore settings using the settings service
    console.log('Restoring settings:', settings);
  }
}

export const backupService = new BackupService();
