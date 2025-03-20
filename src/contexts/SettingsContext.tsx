
import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadSettings, saveSettings, Settings, defaultSettings } from '@/services/settingsService';
import { useToast } from '@/components/ui/use-toast';

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
      toast({
        title: "Error loading settings",
        description: "Failed to load your settings. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load settings on initial mount
  useEffect(() => {
    refreshSettings();
  }, []);

  const handleSaveSettings = async (newSettings: Settings) => {
    setIsLoading(true);
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
      return false;
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error saving settings",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
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
