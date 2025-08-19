import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';

export interface UserPreferences {
  notifications: {
    soundEffects: boolean;
    voiceAlerts: boolean;
    systemNotifications: boolean;
  };
  voice: {
    autoSend: boolean;
    silenceThreshold: number;
    voiceQuality: 'low' | 'medium' | 'high';
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    reducedMotion: boolean;
  };
  privacy: {
    saveConversations: boolean;
    shareUsageData: boolean;
    showOnlineStatus: boolean;
  };
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
  savePreferences: () => Promise<void>;
  isModified: boolean;
}

const defaultPreferences: UserPreferences = {
  notifications: {
    soundEffects: true,
    voiceAlerts: true,
    systemNotifications: false,
  },
  voice: {
    autoSend: true,
    silenceThreshold: 2,
    voiceQuality: 'high',
  },
  display: {
    theme: 'light',
    language: 'en',
    reducedMotion: false,
  },
  privacy: {
    saveConversations: true,
    shareUsageData: false,
    showOnlineStatus: true,
  },
};

export function useUserPreferences(): UseUserPreferencesReturn {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from the server
  const loadPreferences = useCallback(async () => {
    if (status === 'loading' || !session?.user?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/preferences');
      
      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated, use defaults
          setPreferences(defaultPreferences);
          setOriginalPreferences(defaultPreferences);
          return;
        }
        throw new Error('Failed to load preferences');
      }

      const data = await response.json();
      const userPreferences = {
        notifications: data.notifications || defaultPreferences.notifications,
        voice: data.voice || defaultPreferences.voice,
        display: data.display || defaultPreferences.display,
        privacy: data.privacy || defaultPreferences.privacy,
      };

      setPreferences(userPreferences);
      setOriginalPreferences(JSON.parse(JSON.stringify(userPreferences)));
    } catch (err: any) {
      logger.error('Error loading preferences', { component: 'UserPreferences' }, err);
      setError(err.message || 'Failed to load preferences');
      // Fall back to defaults on error
      setPreferences(defaultPreferences);
      setOriginalPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  // Load preferences when session is ready
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Update preferences locally
  const updatePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    if (!preferences) return;

    const updatedPreferences = {
      ...preferences,
      ...newPreferences,
    };

    setPreferences(updatedPreferences);
  }, [preferences]);

  // Save preferences to the server
  const savePreferences = useCallback(async () => {
    if (!preferences || !session?.user?.id) {
      throw new Error('Cannot save preferences: not authenticated or no preferences');
    }

    try {
      setError(null);

      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: preferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      const savedPreferences = await response.json();
      
      // Update the original preferences to reflect the saved state
      setOriginalPreferences(JSON.parse(JSON.stringify(preferences)));
      
      logger.info('Preferences saved successfully', { component: 'UserPreferences' });
    } catch (err: any) {
      logger.error('Error saving preferences', { component: 'UserPreferences' }, err);
      setError(err.message || 'Failed to save preferences');
      throw err;
    }
  }, [preferences, session]);

  // Check if preferences have been modified
  const isModified = preferences && originalPreferences 
    ? JSON.stringify(preferences) !== JSON.stringify(originalPreferences)
    : false;

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    savePreferences,
    isModified,
  };
}