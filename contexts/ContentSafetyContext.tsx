'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export type SafetyMode = 'inform' | 'review' | 'filter';

interface ContentSafetySettings {
  enabled: boolean;
  mode: SafetyMode;
  sensitivity: 'low' | 'medium' | 'high';
}

interface ContentSafetyContextType {
  settings: ContentSafetySettings;
  updateSettings: (newSettings: Partial<ContentSafetySettings>) => void;
  isEnabled: boolean;
}

const ContentSafetyContext = createContext<ContentSafetyContextType | undefined>(undefined);

const DEFAULT_SETTINGS: ContentSafetySettings = {
  enabled: false, // Default OFF for privacy
  mode: 'inform',
  sensitivity: 'medium'
};

const STORAGE_KEY = 'rubber-ducky-content-safety-settings';

export function ContentSafetyProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ContentSafetySettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
        logger.debug('Loaded content safety settings from localStorage', {
          component: 'ContentSafetyContext',
          settings: parsedSettings
        });
      }
    } catch (error) {
      logger.warn('Failed to load content safety settings', {
        component: 'ContentSafetyContext'
      }, error);
    }
  }, []);

  const updateSettings = (newSettings: Partial<ContentSafetySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      logger.info('Content safety settings updated', {
        component: 'ContentSafetyContext',
        enabled: updatedSettings.enabled,
        mode: updatedSettings.mode,
        sensitivity: updatedSettings.sensitivity
      });
    } catch (error) {
      logger.error('Failed to save content safety settings', {
        component: 'ContentSafetyContext'
      }, error);
    }
  };

  const value: ContentSafetyContextType = {
    settings,
    updateSettings,
    isEnabled: settings.enabled,
  };

  return (
    <ContentSafetyContext.Provider value={value}>
      {children}
    </ContentSafetyContext.Provider>
  );
}

export function useContentSafety() {
  const context = useContext(ContentSafetyContext);
  if (!context) {
    throw new Error('useContentSafety must be used within a ContentSafetyProvider');
  }
  return context;
}