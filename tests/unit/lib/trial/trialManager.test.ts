import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TrialManager } from '@/lib/trial/trialManager';
import UserTier from '@/models/UserTier';

// Mock the mongodb connection
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true),
}));

describe('TrialManager', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await UserTier.deleteMany({});
  });

  describe('Trial Lifecycle Management', () => {
    describe('initializeTrialUser', () => {
      test('should create new trial user when none exists', async () => {
        const trialStatus = await TrialManager.initializeTrialUser('new-user', 'new@example.com');

        expect(trialStatus).toBeDefined();
        expect(trialStatus.tier).toBe('trial');
        expect(trialStatus.isTrialActive).toBe(true);
        expect(trialStatus.trialDaysRemaining).toBeGreaterThan(6);
        expect(trialStatus.canExtendTrial).toBe(true);

        // Verify user was created in database
        const user = await UserTier.findOne({ userId: 'new-user' });
        expect(user).toBeTruthy();
        expect(user.email).toBe('new@example.com');
      });

      test('should return existing user trial status', async () => {
        // Create existing user
        const existingUser = await UserTier.create({
          userId: 'existing-user',
          tier: 'pro',
          email: 'existing@example.com',
        });

        const trialStatus = await TrialManager.initializeTrialUser('existing-user', 'different@example.com');

        expect(trialStatus.tier).toBe('pro');
        
        // Should not change existing user data
        const user = await UserTier.findOne({ userId: 'existing-user' });
        expect(user.email).toBe('existing@example.com');
      });
    });

    describe('getTrialStatus', () => {
      test('should return trial status for existing user', async () => {
        const testUser = await UserTier.create({
          userId: 'status-test-user',
          tier: 'trial',
          trialStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          trialEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          trialExtensions: 1,
          maxTrialExtensions: 2,
        });

        const status = await TrialManager.getTrialStatus('status-test-user');

        expect(status).toBeDefined();
        expect(status.tier).toBe('trial');
        expect(status.isTrialActive).toBe(true);
        expect(status.trialDaysRemaining).toBeCloseTo(5, 0);
        expect(status.hasTrialExpired).toBe(false);
        expect(status.canExtendTrial).toBe(true);
        expect(status.trialExtensions).toBe(1);
        expect(status.maxTrialExtensions).toBe(2);
      });

      test('should return null for non-existent user', async () => {
        const status = await TrialManager.getTrialStatus('non-existent-user');
        expect(status).toBeNull();
      });

      test('should return correct status for expired trial', async () => {
        await UserTier.create({
          userId: 'expired-user',
          tier: 'trial',
          trialStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          trialEndDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Expired
        });

        const status = await TrialManager.getTrialStatus('expired-user');

        expect(status.isTrialActive).toBe(false);
        expect(status.hasTrialExpired).toBe(true);
        expect(status.trialDaysRemaining).toBe(0);
      });
    });

    describe('extendTrial', () => {
      test('should extend trial by specified days', async () => {
        const testUser = await UserTier.create({
          userId: 'extend-test-user',
          tier: 'trial',
          trialStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          trialEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          trialExtensions: 0,
          maxTrialExtensions: 2,
        });

        const originalEndDate = testUser.trialEndDate.getTime();
        const success = await TrialManager.extendTrial('extend-test-user', 5);

        expect(success).toBe(true);

        // Verify extension in database
        const updatedUser = await UserTier.findOne({ userId: 'extend-test-user' });
        expect(updatedUser.trialExtensions).toBe(1);
        expect(updatedUser.trialEndDate.getTime()).toBe(originalEndDate + 5 * 24 * 60 * 60 * 1000);
        expect(updatedUser.featuresUsed).toContain('trial_extended');
      });

      test('should use default 3 days when no days specified', async () => {
        await UserTier.create({
          userId: 'default-extend-user',
          tier: 'trial',
          trialStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          trialExtensions: 0,
          maxTrialExtensions: 2,
        });

        const success = await TrialManager.extendTrial('default-extend-user');
        expect(success).toBe(true);

        const updatedUser = await UserTier.findOne({ userId: 'default-extend-user' });
        expect(updatedUser.trialExtensions).toBe(1);
      });

      test('should fail when user cannot extend trial', async () => {
        await UserTier.create({
          userId: 'max-extended-user',
          tier: 'trial',
          trialExtensions: 2,
          maxTrialExtensions: 2, // Already at maximum
        });

        const success = await TrialManager.extendTrial('max-extended-user', 3);
        expect(success).toBe(false);

        const user = await UserTier.findOne({ userId: 'max-extended-user' });
        expect(user.trialExtensions).toBe(2); // Unchanged
      });

      test('should fail for non-existent user', async () => {
        const success = await TrialManager.extendTrial('non-existent-user');
        expect(success).toBe(false);
      });
    });

    describe('upgradeUser', () => {
      test('should upgrade user to paid tier', async () => {
        const testUser = await UserTier.create({
          userId: 'upgrade-test-user',
          tier: 'trial',
        });

        const subscriptionData = {
          subscriptionId: 'sub_test123',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };

        const success = await TrialManager.upgradeUser('upgrade-test-user', 'pro', subscriptionData);
        expect(success).toBe(true);

        const updatedUser = await UserTier.findOne({ userId: 'upgrade-test-user' });
        expect(updatedUser.tier).toBe('pro');
        expect(updatedUser.subscriptionId).toBe('sub_test123');
        expect(updatedUser.subscriptionStatus).toBe('active');
      });

      test('should upgrade without subscription data', async () => {
        await UserTier.create({
          userId: 'simple-upgrade-user',
          tier: 'free',
        });

        const success = await TrialManager.upgradeUser('simple-upgrade-user', 'enterprise');
        expect(success).toBe(true);

        const updatedUser = await UserTier.findOne({ userId: 'simple-upgrade-user' });
        expect(updatedUser.tier).toBe('enterprise');
      });

      test('should fail for non-existent user', async () => {
        const success = await TrialManager.upgradeUser('non-existent', 'pro');
        expect(success).toBe(false);
      });
    });
  });

  describe('Feature Usage Tracking', () => {
    describe('trackFeatureUsage', () => {
      test('should track feature usage for existing user', async () => {
        await UserTier.create({
          userId: 'tracking-user',
          tier: 'trial',
          monthlyMessageCount: 5,
          monthlyExportCount: 2,
        });

        await TrialManager.trackFeatureUsage('tracking-user', 'claude4_access', 'high');

        const user = await UserTier.findOne({ userId: 'tracking-user' });
        expect(user.featuresUsed).toContain('claude4_access');
        expect(user.monthlyMessageCount).toBe(6); // Incremented
        expect(user.conversionCheckpoints).toHaveLength(1);
        expect(user.conversionCheckpoints[0].feature).toBe('claude4_access');
        expect(user.conversionCheckpoints[0].engagement).toBe('high');
      });

      test('should increment export count for export features', async () => {
        await UserTier.create({
          userId: 'export-tracking-user',
          tier: 'trial',
          monthlyExportCount: 3,
        });

        await TrialManager.trackFeatureUsage('export-tracking-user', 'pdf_export', 'medium');

        const user = await UserTier.findOne({ userId: 'export-tracking-user' });
        expect(user.monthlyExportCount).toBe(4);
        expect(user.featuresUsed).toContain('pdf_export');
      });

      test('should handle non-existent user gracefully', async () => {
        // Should not throw an error
        await expect(TrialManager.trackFeatureUsage('non-existent', 'test_feature')).resolves.not.toThrow();
      });

      test('should default to medium engagement', async () => {
        await UserTier.create({ userId: 'default-engagement-user', tier: 'trial' });

        await TrialManager.trackFeatureUsage('default-engagement-user', 'voice_demo');

        const user = await UserTier.findOne({ userId: 'default-engagement-user' });
        const checkpoint = user.conversionCheckpoints[0];
        expect(checkpoint.engagement).toBe('medium');
      });
    });

    describe('recordAnalytics', () => {
      test('should record analytics for trial user', async () => {
        await UserTier.create({
          userId: 'analytics-user',
          tier: 'trial',
          trialStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        });

        const analyticsData = {
          sessionDuration: 600,
          messagesCount: 8,
          featuresUsed: ['claude4', 'export'],
          engagementScore: 7.5,
        };

        await TrialManager.recordAnalytics('analytics-user', analyticsData);

        const user = await UserTier.findOne({ userId: 'analytics-user' });
        expect(user.trialAnalytics).toHaveLength(1);
        
        const analytics = user.trialAnalytics[0];
        expect(analytics.day).toBe(4); // Day 4 of trial
        expect(analytics.sessionDuration).toBe(600);
        expect(analytics.messagesCount).toBe(8);
        expect(analytics.featuresUsed).toEqual(['claude4', 'export']);
        expect(analytics.engagementScore).toBe(7.5);
      });

      test('should not record analytics for non-trial user', async () => {
        await UserTier.create({
          userId: 'pro-analytics-user',
          tier: 'pro',
        });

        await TrialManager.recordAnalytics('pro-analytics-user', { sessionDuration: 300 });

        const user = await UserTier.findOne({ userId: 'pro-analytics-user' });
        expect(user.trialAnalytics).toHaveLength(0);
      });
    });
  });

  describe('Feature Access Control', () => {
    describe('hasFeatureAccess', () => {
      test('should allow trial users access to premium features', async () => {
        await UserTier.create({
          userId: 'trial-access-user',
          tier: 'trial',
          trialStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          trialEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        });

        const hasClaud4Access = await TrialManager.hasFeatureAccess('trial-access-user', 'claude4');
        const hasExportAccess = await TrialManager.hasFeatureAccess('trial-access-user', 'unlimited_exports');
        const hasVoiceAccess = await TrialManager.hasFeatureAccess('trial-access-user', 'premium_voice');

        expect(hasClaud4Access).toBe(true);
        expect(hasExportAccess).toBe(true);
        expect(hasVoiceAccess).toBe(true);
      });

      test('should restrict free users from premium features', async () => {
        await UserTier.create({
          userId: 'free-access-user',
          tier: 'free',
        });

        const hasClaud4Access = await TrialManager.hasFeatureAccess('free-access-user', 'claude4');
        const hasExportAccess = await TrialManager.hasFeatureAccess('free-access-user', 'unlimited_exports');
        
        expect(hasClaud4Access).toBe(false);
        expect(hasExportAccess).toBe(false);
      });

      test('should allow pro users access to all features', async () => {
        await UserTier.create({
          userId: 'pro-access-user',
          tier: 'pro',
        });

        const hasClaud4Access = await TrialManager.hasFeatureAccess('pro-access-user', 'claude4');
        const hasAPIAccess = await TrialManager.hasFeatureAccess('pro-access-user', 'api_access');
        
        expect(hasClaud4Access).toBe(true);
        expect(hasAPIAccess).toBe(true);
      });

      test('should return false for non-existent user', async () => {
        const hasAccess = await TrialManager.hasFeatureAccess('non-existent-user', 'claude4');
        expect(hasAccess).toBe(false);
      });

      test('should return false for unknown feature', async () => {
        await UserTier.create({
          userId: 'unknown-feature-user',
          tier: 'pro',
        });

        const hasAccess = await TrialManager.hasFeatureAccess('unknown-feature-user', 'unknown_feature');
        expect(hasAccess).toBe(false);
      });
    });

    describe('checkUsageLimit', () => {
      test('should return within limit for unlimited tier features', async () => {
        await UserTier.create({
          userId: 'unlimited-user',
          tier: 'trial',
          monthlyMessageCount: 1000,
        });

        const result = await TrialManager.checkUsageLimit('unlimited-user', 'messages');

        expect(result.withinLimit).toBe(true);
        expect(result.currentUsage).toBe(1000);
        expect(result.limit).toBe('unlimited');
      });

      test('should check message limits for free users', async () => {
        await UserTier.create({
          userId: 'limited-user',
          tier: 'free',
          monthlyMessageCount: 50,
        });

        const result = await TrialManager.checkUsageLimit('limited-user', 'messages');

        expect(result.withinLimit).toBe(true); // 50 < 100 (free limit)
        expect(result.currentUsage).toBe(50);
        expect(result.limit).toBe(100);
      });

      test('should detect over-limit usage', async () => {
        await UserTier.create({
          userId: 'over-limit-user',
          tier: 'free',
          monthlyMessageCount: 150, // Over 100 limit
        });

        const result = await TrialManager.checkUsageLimit('over-limit-user', 'messages');

        expect(result.withinLimit).toBe(false);
        expect(result.currentUsage).toBe(150);
        expect(result.limit).toBe(100);
      });

      test('should handle export limits', async () => {
        await UserTier.create({
          userId: 'export-limit-user',
          tier: 'free',
          monthlyExportCount: 3,
        });

        const result = await TrialManager.checkUsageLimit('export-limit-user', 'exports');

        expect(result.withinLimit).toBe(true); // 3 < 5 (free limit)
        expect(result.currentUsage).toBe(3);
        expect(result.limit).toBe(5);
      });
    });

    describe('getFeatureLimit', () => {
      test('should return correct limits for trial tier', () => {
        expect(TrialManager.getFeatureLimit('trial', 'messages')).toBe('unlimited');
        expect(TrialManager.getFeatureLimit('trial', 'exports')).toBe('unlimited');
        expect(TrialManager.getFeatureLimit('trial', 'voice_minutes')).toBe('unlimited');
      });

      test('should return correct limits for free tier', () => {
        expect(TrialManager.getFeatureLimit('free', 'messages')).toBe(100);
        expect(TrialManager.getFeatureLimit('free', 'exports')).toBe(5);
        expect(TrialManager.getFeatureLimit('free', 'voice_minutes')).toBe(10);
      });

      test('should return correct limits for pro tier', () => {
        expect(TrialManager.getFeatureLimit('pro', 'messages')).toBe('unlimited');
        expect(TrialManager.getFeatureLimit('pro', 'exports')).toBe('unlimited');
        expect(TrialManager.getFeatureLimit('pro', 'voice_minutes')).toBe('unlimited');
      });

      test('should return 0 for unknown features', () => {
        expect(TrialManager.getFeatureLimit('trial', 'unknown_feature')).toBe(0);
      });

      test('should return 0 for unknown tiers', () => {
        expect(TrialManager.getFeatureLimit('unknown_tier' as any, 'messages')).toBe(0);
      });
    });
  });

  describe('Analytics and Reporting', () => {
    describe('getTrialProgress', () => {
      test('should calculate progress for trial user', async () => {
        const testUser = await UserTier.create({
          userId: 'progress-user',
          tier: 'trial',
          trialStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
          featuresUsed: ['claude4', 'export', 'voice'],
          conversionCheckpoints: [
            { feature: 'claude4', engagement: 'high', timestamp: new Date(), convertedToUpgrade: false },
            { feature: 'export', engagement: 'medium', timestamp: new Date(), convertedToUpgrade: false },
          ],
          trialAnalytics: [
            { day: 1, featuresUsed: [], sessionDuration: 0, messagesCount: 0, engagementScore: 5, timestamp: new Date() },
            { day: 2, featuresUsed: [], sessionDuration: 0, messagesCount: 0, engagementScore: 7, timestamp: new Date() },
            { day: 3, featuresUsed: [], sessionDuration: 0, messagesCount: 0, engagementScore: 8, timestamp: new Date() },
          ],
        });

        const progress = await TrialManager.getTrialProgress('progress-user');

        expect(progress).toBeDefined();
        expect(progress.currentDay).toBe(4); // Day 4 of 7
        expect(progress.totalDays).toBe(7);
        expect(progress.featuresUsedCount).toBe(3);
        expect(progress.totalFeatures).toBe(7); // As defined in the method
        expect(progress.engagementScore).toBeCloseTo(6.67, 1); // Average of 5, 7, 8
        expect(progress.conversionCheckpoints).toBe(2);
        expect(progress.completionPercentage).toBeCloseTo(57.14, 1); // 4/7 * 100
      });

      test('should return null for non-trial user', async () => {
        await UserTier.create({
          userId: 'non-trial-progress-user',
          tier: 'pro',
        });

        const progress = await TrialManager.getTrialProgress('non-trial-progress-user');
        expect(progress).toBeNull();
      });

      test('should return null for non-existent user', async () => {
        const progress = await TrialManager.getTrialProgress('non-existent-user');
        expect(progress).toBeNull();
      });

      test('should handle user with no analytics', async () => {
        await UserTier.create({
          userId: 'no-analytics-user',
          tier: 'trial',
          trialStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          trialEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          featuresUsed: ['claude4'],
          conversionCheckpoints: [],
          trialAnalytics: [],
        });

        const progress = await TrialManager.getTrialProgress('no-analytics-user');

        expect(progress).toBeDefined();
        expect(progress.engagementScore).toBe(0);
        expect(progress.conversionCheckpoints).toBe(0);
        expect(progress.featuresUsedCount).toBe(1);
      });
    });

    describe('getExpiringTrials', () => {
      beforeEach(async () => {
        const now = Date.now();
        
        // Create trials with different expiration times
        await UserTier.create({
          userId: 'expiring-6-hours',
          email: 'expire6h@example.com',
          tier: 'trial',
          trialEndDate: new Date(now + 6 * 60 * 60 * 1000),
          featuresUsed: ['claude4'],
          conversionCheckpoints: [{ feature: 'claude4', engagement: 'high', timestamp: new Date(), convertedToUpgrade: false }],
        });

        await UserTier.create({
          userId: 'expiring-18-hours',
          email: 'expire18h@example.com', 
          tier: 'trial',
          trialEndDate: new Date(now + 18 * 60 * 60 * 1000),
          featuresUsed: ['export'],
        });

        await UserTier.create({
          userId: 'expiring-3-days',
          email: 'expire3d@example.com',
          tier: 'trial',
          trialEndDate: new Date(now + 3 * 24 * 60 * 60 * 1000),
        });

        // Create non-trial user
        await UserTier.create({
          userId: 'pro-user',
          tier: 'pro',
        });
      });

      test('should find trials expiring within 1 day by default', async () => {
        const expiringTrials = await TrialManager.getExpiringTrials();

        expect(expiringTrials).toHaveLength(2);
        const userIds = expiringTrials.map(t => t.userId);
        expect(userIds).toContain('expiring-6-hours');
        expect(userIds).toContain('expiring-18-hours');
        expect(userIds).not.toContain('expiring-3-days');
      });

      test('should find trials expiring within specified days', async () => {
        const expiringIn4Days = await TrialManager.getExpiringTrials(4);

        expect(expiringIn4Days).toHaveLength(3);
        const userIds = expiringIn4Days.map(t => t.userId);
        expect(userIds).toContain('expiring-6-hours');
        expect(userIds).toContain('expiring-18-hours');
        expect(userIds).toContain('expiring-3-days');
      });

      test('should return lean documents with selected fields', async () => {
        const expiringTrials = await TrialManager.getExpiringTrials(1);

        expect(expiringTrials.length).toBeGreaterThan(0);
        
        const trial = expiringTrials[0];
        expect(trial.userId).toBeDefined();
        expect(trial.email).toBeDefined();
        expect(trial.trialEndDate).toBeDefined();
        expect(trial.trialDaysRemaining).toBeDefined();
        expect(trial.featuresUsed).toBeDefined();
        expect(trial.conversionCheckpoints).toBeDefined();

        // Should not include fields not selected
        expect(trial.subscriptionId).toBeUndefined();
        expect(trial.monthlyMessageCount).toBeUndefined();
      });
    });

    describe('getConversionMetrics', () => {
      beforeEach(async () => {
        const now = new Date();
        const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
        const oldDate = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 days ago

        // Recent users
        await UserTier.create({
          userId: 'recent-trial',
          tier: 'trial',
          createdAt: recentDate,
          trialStartDate: recentDate,
        });

        await UserTier.create({
          userId: 'recent-pro',
          tier: 'pro',
          createdAt: recentDate,
        });

        await UserTier.create({
          userId: 'recent-enterprise',
          tier: 'enterprise',
          createdAt: recentDate,
        });

        // Old users (should not be included in 30-day metrics)
        await UserTier.create({
          userId: 'old-trial',
          tier: 'trial',
          createdAt: oldDate,
          trialStartDate: oldDate,
        });
      });

      test('should calculate conversion metrics for default timeframe', async () => {
        const metrics = await TrialManager.getConversionMetrics();

        expect(metrics.timeframe).toBe(30);
        expect(metrics.trialSignUps).toBe(1); // Only recent-trial
        expect(metrics.paidConversions).toBe(2); // recent-pro + recent-enterprise
        expect(metrics.conversionRate).toBeCloseTo(66.67, 1); // 2/(1+2) * 100
      });

      test('should calculate metrics for custom timeframe', async () => {
        const metrics = await TrialManager.getConversionMetrics(50); // 50 days

        expect(metrics.timeframe).toBe(50);
        expect(metrics.trialSignUps).toBe(2); // recent-trial + old-trial
        expect(metrics.paidConversions).toBe(2); // recent-pro + recent-enterprise
        expect(metrics.conversionRate).toBe(50); // 2/(2+2) * 100
      });

      test('should handle no data gracefully', async () => {
        // Clear all data
        await UserTier.deleteMany({});

        const metrics = await TrialManager.getConversionMetrics();

        expect(metrics.trialSignUps).toBe(0);
        expect(metrics.paidConversions).toBe(0);
        expect(metrics.conversionRate).toBe(0);
      });

      test('should handle only trial users', async () => {
        // Clear existing data and add only trials
        await UserTier.deleteMany({});
        
        await UserTier.create({
          userId: 'only-trial-1',
          tier: 'trial',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        });

        await UserTier.create({
          userId: 'only-trial-2',
          tier: 'trial',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        });

        const metrics = await TrialManager.getConversionMetrics();

        expect(metrics.trialSignUps).toBe(2);
        expect(metrics.paidConversions).toBe(0);
        expect(metrics.conversionRate).toBe(0);
      });
    });
  });
});