'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useMobileNavigation } from './useMobileNavigation';

interface HapticPattern {
  name: string;
  pattern: number[];
  description: string;
}

interface HapticFeedbackOptions {
  enabled?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  respectUserPreferences?: boolean;
  debugMode?: boolean;
  fallbackToAudio?: boolean;
  customPatterns?: HapticPattern[];
}

interface HapticCapabilities {
  hasVibrationAPI: boolean;
  hasHapticFeedback: boolean;
  hasGamepadHaptics: boolean;
  supportsIntensity: boolean;
  maxPatternLength: number;
  maxVibrationDuration: number;
}

export function useHapticFeedback(options: HapticFeedbackOptions = {}) {
  const {
    enabled = true,
    intensity = 'medium',
    respectUserPreferences = true,
    debugMode = false,
    fallbackToAudio = false,
    customPatterns = []
  } = options;

  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileDevice = isMobile || isTablet;

  const [isSupported, setIsSupported] = useState(false);
  const [userPreference, setUserPreference] = useState<boolean | null>(null);
  const [capabilities, setCapabilities] = useState<HapticCapabilities>({
    hasVibrationAPI: false,
    hasHapticFeedback: false,
    hasGamepadHaptics: false,
    supportsIntensity: false,
    maxPatternLength: 0,
    maxVibrationDuration: 0
  });

  const lastVibrationRef = useRef<number>(0);
  const vibrationQueueRef = useRef<Array<{ pattern: number[]; timestamp: number }>>([]);
  const isVibratingRef = useRef(false);

  // Predefined haptic patterns
  const defaultPatterns: HapticPattern[] = [
    {
      name: 'tap',
      pattern: [50],
      description: 'Light tap for button presses and selections'
    },
    {
      name: 'double-tap',
      pattern: [30, 50, 30],
      description: 'Double tap for confirmations'
    },
    {
      name: 'success',
      pattern: [100, 50, 50, 50, 100],
      description: 'Success confirmation pattern'
    },
    {
      name: 'error',
      pattern: [200, 100, 200],
      description: 'Error notification pattern'
    },
    {
      name: 'warning',
      pattern: [150, 75, 75, 75, 150],
      description: 'Warning notification pattern'
    },
    {
      name: 'notification',
      pattern: [75, 75, 75],
      description: 'General notification pattern'
    },
    {
      name: 'selection',
      pattern: [25],
      description: 'Item selection or navigation'
    },
    {
      name: 'long-press',
      pattern: [0, 200, 100],
      description: 'Long press activation'
    },
    {
      name: 'swipe',
      pattern: [40, 20, 40],
      description: 'Swipe gesture confirmation'
    },
    {
      name: 'pull-refresh',
      pattern: [0, 50, 100, 150, 100, 50],
      description: 'Pull-to-refresh activation'
    },
    {
      name: 'typing',
      pattern: [10],
      description: 'Keyboard typing feedback'
    },
    {
      name: 'scroll-boundary',
      pattern: [80, 40, 80],
      description: 'Scroll boundary reached'
    }
  ];

  // Combine default and custom patterns
  const allPatterns = [...defaultPatterns, ...customPatterns];

  // Initialize haptic capabilities
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectCapabilities = () => {
      const caps: HapticCapabilities = {
        hasVibrationAPI: 'vibrate' in navigator,
        hasHapticFeedback: false,
        hasGamepadHaptics: false,
        supportsIntensity: false,
        maxPatternLength: 0,
        maxVibrationDuration: 0
      };

      // Check for Vibration API
      if (caps.hasVibrationAPI) {
        caps.maxPatternLength = 50; // Most browsers support up to 50 elements
        caps.maxVibrationDuration = 5000; // 5 seconds max duration
      }

      // Check for enhanced haptic feedback (iOS)
      if ('DeviceMotionEvent' in window && 'requestPermission' in (window as any).DeviceMotionEvent) {
        caps.hasHapticFeedback = true;
        caps.supportsIntensity = true;
      }

      // Check for Gamepad API (advanced haptics)
      if ('getGamepads' in navigator) {
        caps.hasGamepadHaptics = true;
      }

      setCapabilities(caps);
      setIsSupported(caps.hasVibrationAPI || caps.hasHapticFeedback);
    };

    detectCapabilities();

    // Load user preference from localStorage
    const savedPreference = localStorage.getItem('haptic-feedback-enabled');
    if (savedPreference !== null) {
      setUserPreference(JSON.parse(savedPreference));
    }
  }, []);

  // Debug logging
  const debugLog = useCallback((message: string, data?: any) => {
    if (debugMode) {
      console.log(`[Haptic] ${message}`, data || '');
    }
  }, [debugMode]);

  // Check if haptic feedback should be enabled
  const isHapticEnabled = useCallback(() => {
    if (!enabled || !isMobileDevice || !isSupported) {
      debugLog('Haptic disabled:', { enabled, isMobileDevice, isSupported });
      return false;
    }

    if (respectUserPreferences && userPreference === false) {
      debugLog('Haptic disabled by user preference');
      return false;
    }

    // Check if user has reduced motion preference
    if (respectUserPreferences && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      debugLog('Haptic disabled due to reduced motion preference');
      return false;
    }

    return true;
  }, [enabled, isMobileDevice, isSupported, respectUserPreferences, userPreference, debugLog]);

  // Rate limiting for haptic feedback
  const canVibrate = useCallback(() => {
    const now = Date.now();
    const timeSinceLastVibration = now - lastVibrationRef.current;
    const minInterval = 50; // Minimum 50ms between vibrations

    if (timeSinceLastVibration < minInterval) {
      debugLog('Haptic rate limited', { timeSinceLastVibration, minInterval });
      return false;
    }

    return true;
  }, [debugLog]);

  // Get intensity-adjusted pattern
  const getIntensityPattern = useCallback((basePattern: number[]): number[] => {
    const intensityMultipliers = {
      light: 0.6,
      medium: 1.0,
      heavy: 1.4
    };

    const multiplier = intensityMultipliers[intensity];
    return basePattern.map(duration => Math.round(duration * multiplier));
  }, [intensity]);

  // Execute vibration pattern
  const executeVibration = useCallback(async (pattern: number[]): Promise<boolean> => {
    if (!capabilities.hasVibrationAPI || !navigator.vibrate) {
      debugLog('Vibration API not available');
      return false;
    }

    try {
      const adjustedPattern = getIntensityPattern(pattern);
      const success = navigator.vibrate(adjustedPattern);

      if (success) {
        lastVibrationRef.current = Date.now();
        debugLog('Vibration executed', { pattern: adjustedPattern });
      }

      return success;
    } catch (error) {
      debugLog('Vibration failed', error);
      return false;
    }
  }, [capabilities.hasVibrationAPI, getIntensityPattern, debugLog]);

  // Execute haptic feedback with fallbacks
  const executeHaptic = useCallback(async (patternName: string | number[]): Promise<boolean> => {
    if (!isHapticEnabled() || !canVibrate()) {
      return false;
    }

    let pattern: number[];

    if (typeof patternName === 'string') {
      const hapticPattern = allPatterns.find(p => p.name === patternName);
      if (!hapticPattern) {
        debugLog('Pattern not found', patternName);
        return false;
      }
      pattern = hapticPattern.pattern;
    } else {
      pattern = patternName;
    }

    // Prevent vibration spam by queuing
    if (isVibratingRef.current) {
      vibrationQueueRef.current.push({ pattern, timestamp: Date.now() });
      return true;
    }

    isVibratingRef.current = true;

    try {
      const success = await executeVibration(pattern);

      // Process queue after a delay
      setTimeout(() => {
        isVibratingRef.current = false;

        // Process next item in queue
        const nextItem = vibrationQueueRef.current.shift();
        if (nextItem && Date.now() - nextItem.timestamp < 1000) { // Only process if < 1 second old
          executeHaptic(nextItem.pattern);
        }
      }, pattern.reduce((sum, duration) => sum + duration, 0) + 50);

      return success;
    } catch (error) {
      isVibratingRef.current = false;
      debugLog('Haptic execution failed', error);
      return false;
    }
  }, [isHapticEnabled, canVibrate, allPatterns, executeVibration, debugLog]);

  // Simple intensity-based haptic
  const haptic = useCallback(async (intensityLevel: 'light' | 'medium' | 'heavy' = 'medium'): Promise<boolean> => {
    const patterns = {
      light: [30],
      medium: [50],
      heavy: [100]
    };

    return executeHaptic(patterns[intensityLevel]);
  }, [executeHaptic]);

  // Pattern-based haptic
  const hapticPattern = useCallback(async (patternName: string): Promise<boolean> => {
    return executeHaptic(patternName);
  }, [executeHaptic]);

  // Custom pattern haptic
  const hapticCustom = useCallback(async (pattern: number[]): Promise<boolean> => {
    return executeHaptic(pattern);
  }, [executeHaptic]);

  // Stop all vibrations
  const stopHaptic = useCallback(() => {
    if (capabilities.hasVibrationAPI && navigator.vibrate) {
      navigator.vibrate(0);
      isVibratingRef.current = false;
      vibrationQueueRef.current = [];
      debugLog('All haptic feedback stopped');
    }
  }, [capabilities.hasVibrationAPI, debugLog]);

  // Save user preference
  const setUserHapticPreference = useCallback((preference: boolean) => {
    setUserPreference(preference);
    localStorage.setItem('haptic-feedback-enabled', JSON.stringify(preference));
    debugLog('User preference saved', preference);
  }, [debugLog]);

  // Get available patterns
  const getAvailablePatterns = useCallback(() => {
    return allPatterns.map(({ name, description }) => ({ name, description }));
  }, [allPatterns]);

  // Test haptic with pattern
  const testHaptic = useCallback(async (patternName: string) => {
    debugLog(`Testing haptic pattern: ${patternName}`);
    return hapticPattern(patternName);
  }, [hapticPattern, debugLog]);

  return {
    // Core functionality
    haptic,
    hapticPattern,
    hapticCustom,
    stopHaptic,

    // State
    isSupported,
    isEnabled: isHapticEnabled(),
    capabilities,
    intensity,

    // Configuration
    setUserHapticPreference,
    userPreference,

    // Patterns
    getAvailablePatterns,
    patterns: allPatterns,

    // Testing
    testHaptic,

    // Device info
    isMobileDevice
  };
}

// React context for haptic feedback
export const HapticProvider = ({ children, options = {} }: {
  children: React.ReactNode;
  options?: HapticFeedbackOptions;
}) => {
  const hapticFeedback = useHapticFeedback(options);

  // Make haptic feedback available globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__haptic = hapticFeedback;
    }
  }, [hapticFeedback]);

  return <>{children}</>;
};

// Specialized hooks for common use cases
export function useButtonHaptics() {
  const { hapticPattern } = useHapticFeedback({ intensity: 'light' });

  const onPress = useCallback(() => hapticPattern('tap'), [hapticPattern]);
  const onLongPress = useCallback(() => hapticPattern('long-press'), [hapticPattern]);
  const onSuccess = useCallback(() => hapticPattern('success'), [hapticPattern]);
  const onError = useCallback(() => hapticPattern('error'), [hapticPattern]);

  return { onPress, onLongPress, onSuccess, onError };
}

export function useNavigationHaptics() {
  const { hapticPattern } = useHapticFeedback({ intensity: 'light' });

  const onSelect = useCallback(() => hapticPattern('selection'), [hapticPattern]);
  const onSwipe = useCallback(() => hapticPattern('swipe'), [hapticPattern]);
  const onBoundary = useCallback(() => hapticPattern('scroll-boundary'), [hapticPattern]);

  return { onSelect, onSwipe, onBoundary };
}

export function useNotificationHaptics() {
  const { hapticPattern } = useHapticFeedback({ intensity: 'medium' });

  const onNotification = useCallback(() => hapticPattern('notification'), [hapticPattern]);
  const onWarning = useCallback(() => hapticPattern('warning'), [hapticPattern]);
  const onError = useCallback(() => hapticPattern('error'), [hapticPattern]);
  const onSuccess = useCallback(() => hapticPattern('success'), [hapticPattern]);

  return { onNotification, onWarning, onError, onSuccess };
}