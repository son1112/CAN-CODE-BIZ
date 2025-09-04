'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTrial } from '@/contexts/TrialContext';
import { 
  TrialStatus, 
  TrialProgress, 
  UserTierType,
  FeatureKey,
  ConversionEvent
} from '@/types/trial';

interface UseTrialStatusReturn {
  // Core status
  trialStatus: TrialStatus | null;
  trialProgress: TrialProgress | null;
  isLoading: boolean;
  error: string | null;

  // Trial state helpers
  isTrialActive: boolean;
  hasTrialExpired: boolean;
  daysRemaining: number;
  canExtendTrial: boolean;
  tier: UserTierType | null;

  // Actions
  extendTrial: (days?: number) => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  
  // Analytics tracking
  trackFeature: (feature: string, engagement?: 'low' | 'medium' | 'high') => Promise<void>;
  recordSession: (duration: number, messageCount: number) => Promise<void>;

  // Conversion helpers
  getTrialDayNumber: () => number;
  getTrialPercentComplete: () => number;
  shouldShowPrompt: (feature: FeatureKey) => boolean;
}

export function useTrialStatus(): UseTrialStatusReturn {
  const { data: session } = useSession();
  const { 
    trialStatus, 
    isLoading, 
    error,
    extendTrial: contextExtendTrial,
    trackFeatureUsage,
    recordTrialAnalytics,
    shouldShowUpgradePrompt,
    getTrialProgress,
    refreshTrialStatus
  } = useTrial();

  const [localProgress, setLocalProgress] = useState<TrialProgress | null>(null);

  // Update local progress when trial status changes
  useEffect(() => {
    const progress = getTrialProgress();
    setLocalProgress(progress);
  }, [trialStatus, getTrialProgress]);

  // Extend trial with local state management
  const extendTrial = useCallback(async (days: number = 3): Promise<boolean> => {
    const success = await contextExtendTrial(days);
    if (success) {
      // Refresh status after successful extension
      await refreshTrialStatus();
    }
    return success;
  }, [contextExtendTrial, refreshTrialStatus]);

  // Track feature usage with local analytics
  const trackFeature = useCallback(async (
    feature: string, 
    engagement: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> => {
    await trackFeatureUsage(feature, engagement);
  }, [trackFeatureUsage]);

  // Record session analytics
  const recordSession = useCallback(async (
    duration: number, 
    messageCount: number
  ): Promise<void> => {
    if (!trialStatus || trialStatus.tier !== 'trial') return;

    const sessionData = {
      sessionDuration: duration,
      messagesCount: messageCount,
      engagementScore: Math.min(Math.floor(duration / 60) + messageCount * 0.5, 10)
    };

    await recordTrialAnalytics(sessionData);
  }, [trialStatus, recordTrialAnalytics]);

  // Get current trial day number (1-based)
  const getTrialDayNumber = useCallback((): number => {
    if (!trialStatus || trialStatus.tier !== 'trial') return 0;
    return Math.max(1, 8 - trialStatus.trialDaysRemaining); // Assuming 7-day trial
  }, [trialStatus]);

  // Get trial completion percentage
  const getTrialPercentComplete = useCallback((): number => {
    if (!trialStatus || trialStatus.tier !== 'trial') return 0;
    const dayNumber = getTrialDayNumber();
    return Math.min((dayNumber / 7) * 100, 100); // 7-day trial
  }, [trialStatus, getTrialDayNumber]);

  // Check if upgrade prompt should be shown
  const shouldShowPrompt = useCallback((feature: FeatureKey): boolean => {
    return shouldShowUpgradePrompt(feature);
  }, [shouldShowUpgradePrompt]);

  // Computed values with safe defaults
  const isTrialActive = trialStatus?.isTrialActive ?? false;
  const hasTrialExpired = trialStatus?.hasTrialExpired ?? false;
  const daysRemaining = trialStatus?.trialDaysRemaining ?? 0;
  const canExtendTrialValue = trialStatus?.canExtendTrial ?? false;
  const tier = trialStatus?.tier ?? null;

  return {
    // Core status
    trialStatus,
    trialProgress: localProgress,
    isLoading,
    error,

    // Trial state helpers
    isTrialActive,
    hasTrialExpired,
    daysRemaining,
    canExtendTrial: canExtendTrialValue,
    tier,

    // Actions
    extendTrial,
    refreshStatus: refreshTrialStatus,
    
    // Analytics tracking
    trackFeature,
    recordSession,

    // Conversion helpers
    getTrialDayNumber,
    getTrialPercentComplete,
    shouldShowPrompt
  };
}

// Specialized hook for trial countdown display
export function useTrialCountdown() {
  const { trialStatus } = useTrial();
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!trialStatus?.trialExpiresAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expires = new Date(trialStatus.trialExpiresAt!).getTime();
      const distance = expires - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [trialStatus?.trialExpiresAt]);

  return {
    ...timeRemaining,
    isExpired: timeRemaining.days === 0 && timeRemaining.hours === 0 && 
               timeRemaining.minutes === 0 && timeRemaining.seconds === 0,
    totalMinutesRemaining: timeRemaining.days * 24 * 60 + 
                          timeRemaining.hours * 60 + 
                          timeRemaining.minutes,
    urgencyLevel: (() => {
      const totalMinutes = timeRemaining.days * 24 * 60 + timeRemaining.hours * 60 + timeRemaining.minutes;
      if (totalMinutes <= 60) return 'critical'; // Last hour
      if (totalMinutes <= 24 * 60) return 'high'; // Last day
      if (totalMinutes <= 3 * 24 * 60) return 'medium'; // Last 3 days
      return 'low';
    })()
  };
}

// Hook for feature-specific trial interactions
export function useTrialFeature(feature: FeatureKey) {
  const { hasFeatureAccess, trackFeatureUsage, markUpgradePromptShown } = useTrial();
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  const access = hasFeatureAccess(feature);

  const attemptFeatureUse = useCallback(async (
    engagement: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{ allowed: boolean; showPrompt: boolean }> => {
    // Track the attempt regardless of access
    await trackFeatureUsage(feature, engagement);

    if (access.hasAccess) {
      return { allowed: true, showPrompt: false };
    }

    // Show upgrade prompt if user doesn't have access and we haven't shown it yet
    const showPrompt = !hasShownPrompt && access.upgradePrompt !== undefined;
    
    if (showPrompt) {
      setHasShownPrompt(true);
      markUpgradePromptShown(feature);
    }

    return { allowed: false, showPrompt };
  }, [feature, access, trackFeatureUsage, hasShownPrompt, markUpgradePromptShown]);

  return {
    hasAccess: access.hasAccess,
    reason: access.reason,
    upgradeRequired: access.upgradeRequired,
    upgradePrompt: access.upgradePrompt,
    attemptFeatureUse
  };
}

// Hook for conversion tracking and analytics
export function useTrialConversion() {
  const { trialStatus, recordTrialAnalytics } = useTrial();
  const [conversionEvents, setConversionEvents] = useState<ConversionEvent[]>([]);

  const trackConversionEvent = useCallback(async (
    feature: string,
    engagement: 'low' | 'medium' | 'high',
    promptShown: boolean = false
  ) => {
    const event: ConversionEvent = {
      feature,
      timestamp: new Date(),
      engagement,
      promptShown,
      convertedToUpgrade: false
    };

    setConversionEvents(prev => [...prev, event]);

    // Record in analytics
    await recordTrialAnalytics({
      conversionEvent: event,
      trialDay: trialStatus ? Math.max(1, 8 - trialStatus.trialDaysRemaining) : 0
    });
  }, [trialStatus, recordTrialAnalytics]);

  const getConversionScore = useCallback((): number => {
    if (conversionEvents.length === 0) return 0;

    const totalEngagement = conversionEvents.reduce((sum, event) => {
      const engagementValue = { low: 1, medium: 3, high: 5 }[event.engagement];
      return sum + engagementValue;
    }, 0);

    return Math.min(totalEngagement / conversionEvents.length, 10);
  }, [conversionEvents]);

  return {
    conversionEvents,
    trackConversionEvent,
    getConversionScore,
    totalEvents: conversionEvents.length
  };
}