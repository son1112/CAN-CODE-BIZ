'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  TrialStatus, 
  TrialProgress, 
  ConversionEvent,
  UserTierType,
  FeatureKey,
  FeatureGatingResult,
  UpgradePrompt 
} from '@/types/trial';

interface TrialContextType {
  // Trial status
  trialStatus: TrialStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // Trial actions
  startTrial: () => Promise<boolean>;
  extendTrial: (days?: number) => Promise<boolean>;
  trackFeatureUsage: (feature: string, engagement?: 'low' | 'medium' | 'high') => Promise<void>;
  recordTrialAnalytics: (data: any) => Promise<void>;
  
  // Feature gating
  hasFeatureAccess: (feature: FeatureKey) => FeatureGatingResult;
  checkUsageLimit: (feature: string) => Promise<boolean>;
  
  // Conversion optimization  
  shouldShowUpgradePrompt: (feature: FeatureKey) => boolean;
  markUpgradePromptShown: (feature: FeatureKey) => void;
  getTrialProgress: () => TrialProgress | null;
  
  // Utility methods
  refreshTrialStatus: () => Promise<void>;
  isTrialUser: boolean;
  isPaidUser: boolean;
  canUseFeature: (feature: FeatureKey) => boolean;
}

const TrialContext = createContext<TrialContextType | undefined>(undefined);

// Feature access configuration
const TIER_FEATURES = {
  trial: {
    claude4: true,
    exportsPerMonth: 'unlimited' as const,
    voicePremium: true,
    prioritySupport: true,
    customAgents: true,
    advancedAnalytics: true,
    apiAccess: false,
    collaborativeFeatures: true
  },
  free: {
    claude4: false,
    exportsPerMonth: 5,
    voicePremium: false,
    prioritySupport: false,
    customAgents: false,
    advancedAnalytics: false,
    apiAccess: false,
    collaborativeFeatures: false
  },
  pro: {
    claude4: true,
    exportsPerMonth: 'unlimited' as const,
    voicePremium: true,
    prioritySupport: true,
    customAgents: true,
    advancedAnalytics: true,
    apiAccess: true,
    collaborativeFeatures: true
  },
  enterprise: {
    claude4: true,
    exportsPerMonth: 'unlimited' as const,
    voicePremium: true,
    prioritySupport: true,
    customAgents: true,
    advancedAnalytics: true,
    apiAccess: true,
    collaborativeFeatures: true
  }
};

// Feature key mappings
const FEATURE_MAPPINGS: Record<FeatureKey, keyof typeof TIER_FEATURES.trial> = {
  'claude4_access': 'claude4',
  'unlimited_exports': 'exportsPerMonth',
  'premium_voice': 'voicePremium', 
  'priority_support': 'prioritySupport',
  'custom_agents': 'customAgents',
  'advanced_analytics': 'advancedAnalytics',
  'api_access': 'apiAccess',
  'collaborative_features': 'collaborativeFeatures'
};

// Upgrade prompts configuration
const UPGRADE_PROMPTS: Record<FeatureKey, UpgradePrompt> = {
  'claude4_access': {
    id: 'claude4_upgrade',
    trigger: 'feature_limit',
    message: 'Unlock unlimited Claude 4 access with Pro - just $19/month',
    urgency: 'medium',
    placement: 'inline',
    ctaText: 'Upgrade to Pro',
    ctaUrl: '/upgrade?feature=claude4'
  },
  'unlimited_exports': {
    id: 'exports_upgrade',
    trigger: 'feature_limit',
    message: 'Export unlimited conversations with Pro subscription',
    urgency: 'medium',
    placement: 'modal',
    ctaText: 'Upgrade Now',
    ctaUrl: '/upgrade?feature=exports'
  },
  'premium_voice': {
    id: 'voice_upgrade',
    trigger: 'feature_discovery',
    message: 'Experience premium voice features with crystal-clear audio',
    urgency: 'low',
    placement: 'toast',
    ctaText: 'Try Pro',
    ctaUrl: '/upgrade?feature=voice'
  },
  'priority_support': {
    id: 'support_upgrade',
    trigger: 'high_usage',
    message: 'Get priority support and faster response times',
    urgency: 'low',
    placement: 'inline',
    ctaText: 'Learn More',
    ctaUrl: '/upgrade?feature=support'
  },
  'custom_agents': {
    id: 'agents_upgrade',
    trigger: 'feature_discovery',
    message: 'Create custom AI agents tailored to your needs',
    urgency: 'medium',
    placement: 'modal',
    ctaText: 'Upgrade to Pro',
    ctaUrl: '/upgrade?feature=agents'
  },
  'advanced_analytics': {
    id: 'analytics_upgrade',
    trigger: 'high_usage',
    message: 'Track your productivity with advanced analytics',
    urgency: 'low',
    placement: 'inline',
    ctaText: 'See Analytics',
    ctaUrl: '/upgrade?feature=analytics'
  },
  'api_access': {
    id: 'api_upgrade',
    trigger: 'feature_discovery',
    message: 'Integrate with API access for developers',
    urgency: 'medium',
    placement: 'modal',
    ctaText: 'Get API Access',
    ctaUrl: '/upgrade?feature=api'
  },
  'collaborative_features': {
    id: 'collab_upgrade',
    trigger: 'feature_discovery',
    message: 'Collaborate and share sessions with your team',
    urgency: 'medium',
    placement: 'inline',
    ctaText: 'Try Collaboration',
    ctaUrl: '/upgrade?feature=collaboration'
  }
};

interface TrialProviderProps {
  children: React.ReactNode;
}

export function TrialProvider({ children }: TrialProviderProps) {
  const { data: session, status } = useSession();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgradePromptsShown, setUpgradePromptsShown] = useState<Set<string>>(new Set());

  // Fetch trial status from API
  const fetchTrialStatus = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/trial/status');
      if (!response.ok) {
        throw new Error('Failed to fetch trial status');
      }
      
      const data = await response.json();
      if (data.success) {
        setTrialStatus(data.data);
        setError(null);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Trial status fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Initialize trial status on session change
  useEffect(() => {
    if (status === 'loading') return;
    
    if (session?.user?.id) {
      fetchTrialStatus();
    } else {
      setTrialStatus(null);
      setIsLoading(false);
    }
  }, [session?.user?.id, status, fetchTrialStatus]);

  // Start trial for new user
  const startTrial = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const response = await fetch('/api/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email
        })
      });

      const data = await response.json();
      if (data.success) {
        await refreshTrialStatus();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Start trial error:', err);
      return false;
    }
  }, [session?.user?.id, session?.user?.email]);

  // Extend trial
  const extendTrial = useCallback(async (days: number = 3): Promise<boolean> => {
    if (!session?.user?.id || !trialStatus?.canExtendTrial) return false;

    try {
      const response = await fetch('/api/trial/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });

      const data = await response.json();
      if (data.success) {
        await refreshTrialStatus();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Extend trial error:', err);
      return false;
    }
  }, [session?.user?.id, trialStatus?.canExtendTrial]);

  // Track feature usage
  const trackFeatureUsage = useCallback(async (
    feature: string, 
    engagement: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> => {
    if (!session?.user?.id) return;

    try {
      await fetch('/api/trial/track-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, engagement })
      });
    } catch (err) {
      console.error('Track feature usage error:', err);
    }
  }, [session?.user?.id]);

  // Record trial analytics
  const recordTrialAnalytics = useCallback(async (data: any): Promise<void> => {
    if (!session?.user?.id || trialStatus?.tier !== 'trial') return;

    try {
      await fetch('/api/trial/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error('Record trial analytics error:', err);
    }
  }, [session?.user?.id, trialStatus?.tier]);

  // Check feature access
  const hasFeatureAccess = useCallback((feature: FeatureKey): FeatureGatingResult => {
    if (!trialStatus) {
      return { 
        hasAccess: false, 
        reason: 'subscription_required',
        upgradeRequired: true,
        upgradePrompt: UPGRADE_PROMPTS[feature]
      };
    }

    const tierFeatures = TIER_FEATURES[trialStatus.tier];
    const featureMappingKey = FEATURE_MAPPINGS[feature];
    const hasAccess = tierFeatures[featureMappingKey] as boolean;

    if (!hasAccess) {
      let reason: 'trial_expired' | 'tier_limit' | 'usage_limit' | 'subscription_required' = 'tier_limit';
      
      if (trialStatus.tier === 'trial' && trialStatus.hasTrialExpired) {
        reason = 'trial_expired';
      } else if (trialStatus.tier === 'free') {
        reason = 'tier_limit';
      }

      return {
        hasAccess: false,
        reason,
        upgradeRequired: true,
        upgradePrompt: UPGRADE_PROMPTS[feature]
      };
    }

    return { hasAccess: true, upgradeRequired: false };
  }, [trialStatus]);

  // Check usage limits
  const checkUsageLimit = useCallback(async (feature: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const response = await fetch(`/api/trial/usage-limit?feature=${feature}`);
      const data = await response.json();
      return data.success ? data.withinLimit : false;
    } catch (err) {
      console.error('Check usage limit error:', err);
      return false;
    }
  }, [session?.user?.id]);

  // Should show upgrade prompt
  const shouldShowUpgradePrompt = useCallback((feature: FeatureKey): boolean => {
    const promptId = UPGRADE_PROMPTS[feature].id;
    return !upgradePromptsShown.has(promptId);
  }, [upgradePromptsShown]);

  // Mark upgrade prompt as shown
  const markUpgradePromptShown = useCallback((feature: FeatureKey): void => {
    const promptId = UPGRADE_PROMPTS[feature].id;
    setUpgradePromptsShown(prev => new Set([...prev, promptId]));
  }, []);

  // Get trial progress
  const getTrialProgress = useCallback((): TrialProgress | null => {
    if (!trialStatus || trialStatus.tier !== 'trial') return null;

    const totalDays = 7; // Default trial length
    const currentDay = totalDays - trialStatus.trialDaysRemaining + 1;
    const totalFeatures = Object.keys(FEATURE_MAPPINGS).length;

    // This would normally come from the API with more detailed analytics
    return {
      currentDay,
      totalDays,
      featuresUsedCount: 0, // Would be fetched from API
      totalFeatures,
      engagementScore: 0, // Would be calculated from analytics
      conversionCheckpoints: 0, // Would come from API
      completionPercentage: Math.min((currentDay / totalDays) * 100, 100)
    };
  }, [trialStatus]);

  // Refresh trial status
  const refreshTrialStatus = useCallback(async (): Promise<void> => {
    await fetchTrialStatus();
  }, [fetchTrialStatus]);

  // Computed properties
  const isTrialUser = trialStatus?.tier === 'trial' && trialStatus?.isTrialActive;
  const isPaidUser = trialStatus?.tier === 'pro' || trialStatus?.tier === 'enterprise';
  
  const canUseFeature = useCallback((feature: FeatureKey): boolean => {
    return hasFeatureAccess(feature).hasAccess;
  }, [hasFeatureAccess]);

  const value: TrialContextType = {
    trialStatus,
    isLoading,
    error,
    startTrial,
    extendTrial,
    trackFeatureUsage,
    recordTrialAnalytics,
    hasFeatureAccess,
    checkUsageLimit,
    shouldShowUpgradePrompt,
    markUpgradePromptShown,
    getTrialProgress,
    refreshTrialStatus,
    isTrialUser: !!isTrialUser,
    isPaidUser: !!isPaidUser,
    canUseFeature
  };

  return (
    <TrialContext.Provider value={value}>
      {children}
    </TrialContext.Provider>
  );
}

export function useTrial() {
  const context = useContext(TrialContext);
  if (context === undefined) {
    throw new Error('useTrial must be used within a TrialProvider');
  }
  return context;
}

// Convenience hook for feature access checking
export function useFeatureAccess(feature: FeatureKey) {
  const { hasFeatureAccess, trackFeatureUsage } = useTrial();
  
  const access = hasFeatureAccess(feature);
  
  const trackUsage = useCallback((engagement: 'low' | 'medium' | 'high' = 'medium') => {
    trackFeatureUsage(feature, engagement);
  }, [feature, trackFeatureUsage]);

  return {
    hasAccess: access.hasAccess,
    reason: access.reason,
    upgradeRequired: access.upgradeRequired,
    upgradePrompt: access.upgradePrompt,
    trackUsage
  };
}