
import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadSettings, saveSettings, defaultSettings } from '@/services/localStorageSettingsService';
import { useToast } from '@/components/ui/use-toast';
import type { Settings } from '@/types';

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  saveSettings: (settings: Settings) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshSettings = async () => {
    setIsLoading(true);
    try {
      const loadedSettings = await loadSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use default settings on error - localStorage service already handles error toasts
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  // Load settings on initial mount
  useEffect(() => {
    refreshSettings();
  }, []);

  const handleSaveSettings = async (newSettings: Settings) => {
    try {
      const success = await saveSettings(newSettings);
      if (success) {
        setSettings(newSettings);
        toast({
          title: "Settings saved",
          description: "Your monitoring configuration has been updated.",
        });
        return true;
      }
      // localStorage service already handles error toasts
      return false;
    } catch (error) {
      console.error('Failed to save settings:', error);
      // localStorage service already handles error toasts
      return false;
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      isLoading,
      saveSettings: handleSaveSettings,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
