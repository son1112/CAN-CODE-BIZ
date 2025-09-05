import { UserTierType, TrialStatus, TrialProgress, ConversionEvent } from '@/types/trial';
import UserTier from '@/models/UserTier';
import connectDB from '@/lib/mongodb';

export class TrialManager {
  // Create or get trial user
  static async initializeTrialUser(userId: string, email?: string): Promise<TrialStatus> {
    await connectDB();
    
    let userTier = await UserTier.findOne({ userId });
    
    if (!userTier) {
      userTier = await UserTier.createTrialUser(userId, email) as any;
    }

    if (!userTier) {
      throw new Error('Failed to create or find user tier');
    }

    return this.buildTrialStatus(userTier);
  }

  // Get current trial status
  static async getTrialStatus(userId: string): Promise<TrialStatus | null> {
    await connectDB();
    
    const userTier = await UserTier.findOne({ userId });
    if (!userTier) return null;

    return this.buildTrialStatus(userTier);
  }

  // Extend trial
  static async extendTrial(userId: string, days: number = 3): Promise<boolean> {
    await connectDB();
    
    const userTier = await UserTier.findOne({ userId });
    if (!userTier || !userTier.canExtendTrial) return false;

    const extended = userTier.extendTrial(days);
    if (extended) {
      userTier.trackFeatureUsage('trial_extended', 'medium');
      await userTier.save();
    }

    return extended;
  }

  // Track feature usage
  static async trackFeatureUsage(
    userId: string, 
    feature: string, 
    engagement: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    await connectDB();
    
    const userTier = await UserTier.findOne({ userId });
    if (!userTier) return;

    userTier.trackFeatureUsage(feature, engagement);
    
    // Update usage counters
    switch (feature) {
      case 'claude4_access':
      case 'message_sent':
        userTier.monthlyMessageCount += 1;
        break;
      case 'pdf_export':
      case 'word_export':
        userTier.monthlyExportCount += 1;
        break;
    }

    await userTier.save();
  }

  // Record trial analytics
  static async recordAnalytics(userId: string, data: any): Promise<void> {
    await connectDB();
    
    const userTier = await UserTier.findOne({ userId });
    if (!userTier || userTier.tier !== 'trial') return;

    userTier.recordTrialAnalytics(data);
    await userTier.save();
  }

  // Upgrade user to paid tier
  static async upgradeUser(
    userId: string, 
    newTier: UserTierType, 
    subscriptionData?: any
  ): Promise<boolean> {
    await connectDB();
    
    const userTier = await UserTier.findOne({ userId });
    if (!userTier) return false;

    userTier.upgradeToTier(newTier, subscriptionData);
    await userTier.save();

    return true;
  }

  // Check feature access
  static async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const trialStatus = await this.getTrialStatus(userId);
    if (!trialStatus) return false;

    // Define feature access rules
    const tierFeatures = {
      trial: ['claude4', 'unlimited_exports', 'premium_voice', 'priority_support', 'custom_agents', 'advanced_analytics', 'collaborative_features'],
      free: ['basic_chat', 'limited_exports'],
      pro: ['claude4', 'unlimited_exports', 'premium_voice', 'priority_support', 'custom_agents', 'advanced_analytics', 'api_access', 'collaborative_features'],
      enterprise: ['claude4', 'unlimited_exports', 'premium_voice', 'priority_support', 'custom_agents', 'advanced_analytics', 'api_access', 'collaborative_features', 'sso', 'audit_logs']
    };

    return tierFeatures[trialStatus.tier]?.includes(feature) || false;
  }

  // Get trial progress
  static async getTrialProgress(userId: string): Promise<TrialProgress | null> {
    await connectDB();
    
    const userTier = await UserTier.findOne({ userId }).select('tier trialStartDate trialEndDate trialAnalytics featuresUsed conversionCheckpoints');
    if (!userTier || userTier.tier !== 'trial') return null;

    const totalDays = 7;
    const daysRemaining = userTier.trialDaysRemaining || 0;
    const currentDay = Math.max(1, totalDays - daysRemaining + 1);
    
    const totalFeatures = ['claude4_access', 'pdf_export', 'word_export', 'premium_voice', 'custom_agents', 'advanced_analytics', 'collaborative_features'].length;
    const featuresUsedCount = userTier.featuresUsed.length;
    
    // Calculate engagement score from analytics
    const engagementScore = userTier.trialAnalytics.length > 0
      ? userTier.trialAnalytics.reduce((sum: number, entry: any) => sum + entry.engagementScore, 0) / userTier.trialAnalytics.length
      : 0;

    return {
      currentDay,
      totalDays,
      featuresUsedCount,
      totalFeatures,
      engagementScore: Math.round(engagementScore * 100) / 100,
      conversionCheckpoints: userTier.conversionCheckpoints.length,
      completionPercentage: Math.min((currentDay / totalDays) * 100, 100)
    };
  }

  // Get users with expiring trials (for email campaigns)
  static async getExpiringTrials(daysFromNow: number = 1): Promise<any[]> {
    await connectDB();
    
    return UserTier.findExpiringTrials(daysFromNow)
      .select('userId email trialEndDate trialDaysRemaining featuresUsed conversionCheckpoints')
      .lean();
  }

  // Get conversion metrics (for analytics)
  static async getConversionMetrics(timeframe: number = 30): Promise<any> {
    await connectDB();
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          avgTrialDuration: { 
            $avg: { 
              $cond: [
                { $eq: ['$tier', 'trial'] },
                { $subtract: [new Date(), '$trialStartDate'] },
                null
              ]
            }
          }
        }
      }
    ];

    const results = await UserTier.aggregate(pipeline);
    
    const trialUsers = results.find(r => r._id === 'trial')?.count || 0;
    const paidUsers = (results.find(r => r._id === 'pro')?.count || 0) + 
                     (results.find(r => r._id === 'enterprise')?.count || 0);
    
    const conversionRate = trialUsers > 0 ? (paidUsers / (trialUsers + paidUsers)) * 100 : 0;

    return {
      trialSignUps: trialUsers,
      paidConversions: paidUsers,
      conversionRate: Math.round(conversionRate * 100) / 100,
      timeframe
    };
  }

  // Build trial status from user tier document
  private static buildTrialStatus(userTier: any): TrialStatus {
    return {
      isTrialActive: userTier.isTrialActive,
      trialDaysRemaining: userTier.trialDaysRemaining,
      trialExpiresAt: userTier.trialEndDate,
      hasTrialExpired: userTier.hasTrialExpired,
      canExtendTrial: userTier.canExtendTrial,
      tier: userTier.tier,
      trialExtensions: userTier.trialExtensions,
      maxTrialExtensions: userTier.maxTrialExtensions
    };
  }

  // Utility methods for feature checking
  static getFeatureLimit(tier: UserTierType, feature: string): number | 'unlimited' {
    const limits: Record<string, Record<string, number | 'unlimited'>> = {
      trial: {
        messages: 'unlimited',
        exports: 'unlimited',
        voice_minutes: 'unlimited'
      },
      free: {
        messages: 100,
        exports: 5,
        voice_minutes: 10
      },
      pro: {
        messages: 'unlimited',
        exports: 'unlimited',
        voice_minutes: 'unlimited'
      },
      enterprise: {
        messages: 'unlimited',
        exports: 'unlimited',
        voice_minutes: 'unlimited'
      }
    };

    return limits[tier]?.[feature] || 0;
  }

  // Check if user is within usage limits
  static async checkUsageLimit(userId: string, feature: string): Promise<{ withinLimit: boolean; currentUsage: number; limit: number | string }> {
    await connectDB();
    
    const userTier = await UserTier.findOne({ userId }).select('tier monthlyMessageCount monthlyExportCount');
    if (!userTier) {
      return { withinLimit: false, currentUsage: 0, limit: 0 };
    }

    const limit = this.getFeatureLimit(userTier.tier, feature);
    let currentUsage = 0;

    switch (feature) {
      case 'messages':
        currentUsage = userTier.monthlyMessageCount || 0;
        break;
      case 'exports':
        currentUsage = userTier.monthlyExportCount || 0;
        break;
      default:
        currentUsage = 0;
    }

    const withinLimit = limit === 'unlimited' || currentUsage < limit;

    return {
      withinLimit,
      currentUsage,
      limit
    };
  }
}

export default TrialManager;