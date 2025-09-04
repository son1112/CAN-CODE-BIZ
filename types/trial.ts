export type UserTierType = 'trial' | 'free' | 'pro' | 'enterprise';

export interface TrialStatus {
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialExpiresAt: Date | null;
  hasTrialExpired: boolean;
  canExtendTrial: boolean;
  tier: UserTierType;
  trialExtensions: number;
  maxTrialExtensions: number;
}

export interface TrialProgress {
  currentDay: number;
  totalDays: number;
  featuresUsedCount: number;
  totalFeatures: number;
  engagementScore: number;
  conversionCheckpoints: number;
  completionPercentage: number;
}

export interface ConversionEvent {
  feature: string;
  timestamp: Date;
  engagement: 'low' | 'medium' | 'high';
  promptShown?: boolean;
  convertedToUpgrade: boolean;
}

export interface TrialAnalytics {
  day: number;
  featuresUsed: string[];
  sessionDuration: number;
  messagesCount: number;
  engagementScore: number;
  timestamp: Date;
}

export interface SubscriptionData {
  subscriptionId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  priceId?: string;
  customerId?: string;
}

export interface UsageLimit {
  feature: string;
  limit: number;
  currentUsage: number;
  resetDate: Date;
  unlimited: boolean;
}

export interface FeatureAccess {
  claude4: boolean;
  exportsPerMonth: number | 'unlimited';
  voicePremium: boolean;
  prioritySupport: boolean;
  customAgents: boolean;
  advancedAnalytics: boolean;
  apiAccess: boolean;
  collaborativeFeatures: boolean;
}

export interface TierFeatures {
  trial: FeatureAccess;
  free: FeatureAccess;
  pro: FeatureAccess;
  enterprise: FeatureAccess;
}

export interface UpgradePrompt {
  id: string;
  trigger: 'feature_limit' | 'trial_expiring' | 'high_usage' | 'feature_discovery';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  placement: 'modal' | 'banner' | 'inline' | 'toast';
  ctaText: string;
  ctaUrl: string;
  showCount?: number;
  lastShown?: Date;
  conversionRate?: number;
}

export interface TrialConfiguration {
  defaultTrialDays: number;
  maxExtensions: number;
  extensionDays: number;
  autoStartTrial: boolean;
  requireEmailVerification: boolean;
  trialFeatures: string[];
  conversionCheckpoints: string[];
}

// API Response types
export interface TrialStatusResponse {
  success: boolean;
  data: TrialStatus;
  error?: string;
}

export interface TrialProgressResponse {
  success: boolean;
  data: TrialProgress;
  error?: string;
}

export interface TrialExtendResponse {
  success: boolean;
  data: {
    extended: boolean;
    newExpirationDate: Date;
    extensionsRemaining: number;
  };
  error?: string;
}

export interface ConversionTrackingResponse {
  success: boolean;
  data: {
    tracked: boolean;
    checkpointId: string;
  };
  error?: string;
}

// Feature gating types
export type FeatureKey = 
  | 'claude4_access'
  | 'unlimited_exports'
  | 'premium_voice'
  | 'priority_support'
  | 'custom_agents'
  | 'advanced_analytics'
  | 'api_access'
  | 'collaborative_features';

export interface FeatureGatingResult {
  hasAccess: boolean;
  reason?: 'trial_expired' | 'tier_limit' | 'usage_limit' | 'subscription_required';
  upgradeRequired: boolean;
  upgradePrompt?: UpgradePrompt;
}

// Analytics types
export interface ConversionMetrics {
  trialSignUps: number;
  trialToFreeCovnersions: number;
  trialToPaidConversions: number;
  conversionRate: number;
  averageTrialDuration: number;
  topConversionFeatures: string[];
  revenueFromTrials: number;
}

export interface EngagementMetrics {
  averageSessionDuration: number;
  featuresAdoptionRate: Record<string, number>;
  dailyActiveTrialUsers: number;
  trialCompletionRate: number;
  churnRate: number;
}

// Email automation types
export interface TrialEmailEvent {
  type: 'trial_started' | 'trial_day_2' | 'trial_day_5' | 'trial_expiring' | 'trial_expired' | 'trial_converted';
  userId: string;
  email: string;
  templateId: string;
  personalizedData: Record<string, any>;
  scheduledFor: Date;
  sentAt?: Date;
  opened?: boolean;
  clicked?: boolean;
}

// Onboarding integration types  
export interface TrialOnboardingStep {
  stepId: string;
  title: string;
  description: string;
  feature: FeatureKey;
  demoAction?: string;
  completionTracking: boolean;
  conversionValue: number;
}

export interface OnboardingProgress {
  stepsCompleted: string[];
  currentStep: number;
  totalSteps: number;
  completionRate: number;
  timeSpent: number;
  featuresDiscovered: string[];
}