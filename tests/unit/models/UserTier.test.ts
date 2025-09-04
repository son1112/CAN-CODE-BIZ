import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserTier from '@/models/UserTier';
import type { UserTierDocument } from '@/models/UserTier';

describe('UserTier Model', () => {
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

  describe('Model Creation', () => {
    test('should create a new trial user with defaults', async () => {
      const userTier = new UserTier({
        userId: 'test-user-1',
        email: 'test@example.com',
      });

      await userTier.save();

      expect(userTier.userId).toBe('test-user-1');
      expect(userTier.email).toBe('test@example.com');
      expect(userTier.tier).toBe('trial');
      expect(userTier.trialExtensions).toBe(0);
      expect(userTier.maxTrialExtensions).toBe(2);
      expect(userTier.featuresUsed).toEqual([]);
      expect(userTier.conversionCheckpoints).toEqual([]);
      expect(userTier.trialAnalytics).toEqual([]);
    });

    test('should set trial dates correctly on creation', async () => {
      const beforeCreate = Date.now();
      
      const userTier = new UserTier({
        userId: 'test-user-2',
      });

      await userTier.save();

      const afterCreate = Date.now();

      expect(userTier.trialStartDate.getTime()).toBeGreaterThanOrEqual(beforeCreate);
      expect(userTier.trialStartDate.getTime()).toBeLessThanOrEqual(afterCreate);
      
      // Trial should end 7 days after start
      const expectedEndTime = userTier.trialStartDate.getTime() + (7 * 24 * 60 * 60 * 1000);
      expect(Math.abs(userTier.trialEndDate.getTime() - expectedEndTime)).toBeLessThan(1000);
    });

    test('should enforce required fields', async () => {
      const userTier = new UserTier({});

      await expect(userTier.save()).rejects.toThrow();
    });

    test('should enforce unique userId', async () => {
      await UserTier.create({
        userId: 'duplicate-user',
        email: 'user1@example.com',
      });

      const duplicateUser = new UserTier({
        userId: 'duplicate-user',
        email: 'user2@example.com',
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });
  });

  describe('Virtual Fields', () => {
    let activeTrialUser: UserTierDocument;
    let expiredTrialUser: UserTierDocument;

    beforeEach(async () => {
      activeTrialUser = await UserTier.create({
        userId: 'active-trial',
        tier: 'trial',
        trialStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      });

      expiredTrialUser = await UserTier.create({
        userId: 'expired-trial',
        tier: 'trial',
        trialStartDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        trialEndDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      });
    });

    describe('isTrialActive', () => {
      test('should return true for active trial user', () => {
        expect(activeTrialUser.isTrialActive).toBe(true);
      });

      test('should return false for expired trial user', () => {
        expect(expiredTrialUser.isTrialActive).toBe(false);
      });

      test('should return false for non-trial user', async () => {
        const proUser = await UserTier.create({
          userId: 'pro-user',
          tier: 'pro',
        });

        expect(proUser.isTrialActive).toBe(false);
      });
    });

    describe('trialDaysRemaining', () => {
      test('should calculate remaining days correctly', () => {
        const daysRemaining = activeTrialUser.trialDaysRemaining;
        expect(daysRemaining).toBeGreaterThan(3);
        expect(daysRemaining).toBeLessThanOrEqual(4);
      });

      test('should return 0 for expired trial', () => {
        expect(expiredTrialUser.trialDaysRemaining).toBe(0);
      });

      test('should return 0 for non-trial user', async () => {
        const freeUser = await UserTier.create({
          userId: 'free-user',
          tier: 'free',
        });

        expect(freeUser.trialDaysRemaining).toBe(0);
      });
    });

    describe('hasTrialExpired', () => {
      test('should return false for active trial', () => {
        expect(activeTrialUser.hasTrialExpired).toBe(false);
      });

      test('should return true for expired trial', () => {
        expect(expiredTrialUser.hasTrialExpired).toBe(true);
      });

      test('should return false for non-trial user', async () => {
        const enterpriseUser = await UserTier.create({
          userId: 'enterprise-user',
          tier: 'enterprise',
        });

        expect(enterpriseUser.hasTrialExpired).toBe(false);
      });
    });

    describe('canExtendTrial', () => {
      test('should return true when within extension limits', () => {
        expect(activeTrialUser.canExtendTrial).toBe(true);
      });

      test('should return false when max extensions reached', async () => {
        const maxExtendedUser = await UserTier.create({
          userId: 'max-extended',
          tier: 'trial',
          trialStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          trialEndDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          trialExtensions: 2,
          maxTrialExtensions: 2,
        });

        expect(maxExtendedUser.canExtendTrial).toBe(false);
      });

      test('should return false for non-trial user', async () => {
        const proUser = await UserTier.create({
          userId: 'pro-user-2',
          tier: 'pro',
        });

        expect(proUser.canExtendTrial).toBe(false);
      });
    });
  });

  describe('Instance Methods', () => {
    let testUser: UserTierDocument;

    beforeEach(async () => {
      testUser = await UserTier.create({
        userId: 'method-test-user',
        tier: 'trial',
        trialStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        trialEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        trialExtensions: 0,
        maxTrialExtensions: 2,
      });
    });

    describe('extendTrial', () => {
      test('should extend trial by specified days', () => {
        const originalEndDate = testUser.trialEndDate.getTime();
        const extended = testUser.extendTrial(3);

        expect(extended).toBe(true);
        expect(testUser.trialExtensions).toBe(1);
        
        const expectedNewEndDate = originalEndDate + (3 * 24 * 60 * 60 * 1000);
        expect(testUser.trialEndDate.getTime()).toBe(expectedNewEndDate);
      });

      test('should use default 3 days when no parameter provided', () => {
        const originalEndDate = testUser.trialEndDate.getTime();
        const extended = testUser.extendTrial();

        expect(extended).toBe(true);
        expect(testUser.trialExtensions).toBe(1);
        
        const expectedNewEndDate = originalEndDate + (3 * 24 * 60 * 60 * 1000);
        expect(testUser.trialEndDate.getTime()).toBe(expectedNewEndDate);
      });

      test('should not extend beyond maximum extensions', () => {
        testUser.trialExtensions = 2; // At maximum
        const originalEndDate = testUser.trialEndDate.getTime();
        
        const extended = testUser.extendTrial(3);

        expect(extended).toBe(false);
        expect(testUser.trialExtensions).toBe(2); // Unchanged
        expect(testUser.trialEndDate.getTime()).toBe(originalEndDate); // Unchanged
      });

      test('should handle missing trialEndDate', () => {
        testUser.trialEndDate = undefined;
        const beforeExtend = Date.now();
        
        const extended = testUser.extendTrial(2);

        expect(extended).toBe(true);
        expect(testUser.trialExtensions).toBe(1);
        
        const expectedMinEndDate = beforeExtend + (2 * 24 * 60 * 60 * 1000);
        expect(testUser.trialEndDate.getTime()).toBeGreaterThanOrEqual(expectedMinEndDate);
      });
    });

    describe('trackFeatureUsage', () => {
      test('should add feature to featuresUsed array', () => {
        const initialLength = testUser.featuresUsed.length;
        
        testUser.trackFeatureUsage('claude4_access', 'high');

        expect(testUser.featuresUsed).toHaveLength(initialLength + 1);
        expect(testUser.featuresUsed).toContain('claude4_access');
      });

      test('should not duplicate features in featuresUsed', () => {
        testUser.trackFeatureUsage('pdf_export', 'medium');
        testUser.trackFeatureUsage('pdf_export', 'high');

        expect(testUser.featuresUsed.filter(f => f === 'pdf_export')).toHaveLength(1);
      });

      test('should add conversion checkpoint', () => {
        const initialCheckpoints = testUser.conversionCheckpoints.length;
        
        testUser.trackFeatureUsage('voice_demo', 'low');

        expect(testUser.conversionCheckpoints).toHaveLength(initialCheckpoints + 1);
        
        const checkpoint = testUser.conversionCheckpoints[testUser.conversionCheckpoints.length - 1];
        expect(checkpoint.feature).toBe('voice_demo');
        expect(checkpoint.engagement).toBe('low');
        expect(checkpoint.convertedToUpgrade).toBe(false);
      });

      test('should default to medium engagement', () => {
        testUser.trackFeatureUsage('custom_agents');

        const checkpoint = testUser.conversionCheckpoints[testUser.conversionCheckpoints.length - 1];
        expect(checkpoint.engagement).toBe('medium');
      });
    });

    describe('recordTrialAnalytics', () => {
      test('should add analytics entry with calculated trial day', () => {
        const initialAnalytics = testUser.trialAnalytics.length;
        
        testUser.recordTrialAnalytics({
          featuresUsed: ['claude4', 'export'],
          sessionDuration: 300,
          messagesCount: 5,
          engagementScore: 7.5,
        });

        expect(testUser.trialAnalytics).toHaveLength(initialAnalytics + 1);
        
        const analytics = testUser.trialAnalytics[testUser.trialAnalytics.length - 1];
        expect(analytics.day).toBe(3); // 2 days ago + 1
        expect(analytics.featuresUsed).toEqual(['claude4', 'export']);
        expect(analytics.sessionDuration).toBe(300);
        expect(analytics.messagesCount).toBe(5);
        expect(analytics.engagementScore).toBe(7.5);
      });

      test('should not record analytics for non-trial user', async () => {
        const freeUser = await UserTier.create({
          userId: 'free-analytics-test',
          tier: 'free',
        });

        const initialAnalytics = freeUser.trialAnalytics.length;
        
        freeUser.recordTrialAnalytics({
          sessionDuration: 100,
          messagesCount: 2,
        });

        expect(freeUser.trialAnalytics).toHaveLength(initialAnalytics);
      });

      test('should default trial day to 1 when no start date', () => {
        testUser.trialStartDate = undefined;
        
        testUser.recordTrialAnalytics({
          engagementScore: 5,
        });

        const analytics = testUser.trialAnalytics[testUser.trialAnalytics.length - 1];
        expect(analytics.day).toBe(1);
      });
    });

    describe('upgradeToTier', () => {
      test('should change tier and mark checkpoints as converted', () => {
        // Add some conversion checkpoints first
        testUser.trackFeatureUsage('feature1', 'high');
        testUser.trackFeatureUsage('feature2', 'medium');

        const subscriptionData = {
          subscriptionId: 'sub_123',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };

        testUser.upgradeToTier('pro', subscriptionData);

        expect(testUser.tier).toBe('pro');
        expect(testUser.subscriptionId).toBe('sub_123');
        expect(testUser.subscriptionStatus).toBe('active');
        expect(testUser.currentPeriodStart).toBeDefined();
        expect(testUser.currentPeriodEnd).toBeDefined();

        // All checkpoints should be marked as converted
        testUser.conversionCheckpoints.forEach(checkpoint => {
          expect(checkpoint.convertedToUpgrade).toBe(true);
        });
      });

      test('should work without subscription data', () => {
        testUser.upgradeToTier('enterprise');

        expect(testUser.tier).toBe('enterprise');
        expect(testUser.subscriptionId).toBeUndefined();
        expect(testUser.subscriptionStatus).toBeUndefined();
      });
    });

    describe('resetUsageCounters', () => {
      test('should reset counters when more than 30 days passed', () => {
        // Set usage counters and old reset date
        testUser.monthlyMessageCount = 100;
        testUser.monthlyExportCount = 20;
        testUser.lastUsageReset = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago

        testUser.resetUsageCounters();

        expect(testUser.monthlyMessageCount).toBe(0);
        expect(testUser.monthlyExportCount).toBe(0);
        expect(testUser.lastUsageReset.getTime()).toBeGreaterThan(Date.now() - 1000);
      });

      test('should not reset counters when less than 30 days passed', () => {
        testUser.monthlyMessageCount = 50;
        testUser.monthlyExportCount = 10;
        testUser.lastUsageReset = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000); // 20 days ago

        testUser.resetUsageCounters();

        expect(testUser.monthlyMessageCount).toBe(50); // Unchanged
        expect(testUser.monthlyExportCount).toBe(10); // Unchanged
      });
    });
  });

  describe('Static Methods', () => {
    describe('createTrialUser', () => {
      test('should create new trial user with correct defaults', async () => {
        const userTier = await UserTier.createTrialUser('static-test-user', 'static@example.com');

        expect(userTier.userId).toBe('static-test-user');
        expect(userTier.email).toBe('static@example.com');
        expect(userTier.tier).toBe('trial');
        expect(userTier.trialStartDate).toBeDefined();
        expect(userTier.trialEndDate).toBeDefined();
        expect(userTier.featuresUsed).toEqual([]);
        expect(userTier.conversionCheckpoints).toEqual([]);
        expect(userTier.trialAnalytics).toEqual([]);

        // Should be saved to database
        const found = await UserTier.findOne({ userId: 'static-test-user' });
        expect(found).toBeTruthy();
      });

      test('should return existing user if already exists', async () => {
        const existing = await UserTier.create({
          userId: 'existing-user',
          tier: 'pro',
          email: 'existing@example.com',
        });

        const result = await UserTier.createTrialUser('existing-user', 'new@example.com');

        expect(result._id.toString()).toBe(existing._id.toString());
        expect(result.tier).toBe('pro'); // Unchanged
        expect(result.email).toBe('existing@example.com'); // Unchanged
      });

      test('should work without email parameter', async () => {
        const userTier = await UserTier.createTrialUser('no-email-user');

        expect(userTier.userId).toBe('no-email-user');
        expect(userTier.email).toBeUndefined();
        expect(userTier.tier).toBe('trial');
      });
    });

    describe('findExpiringTrials', () => {
      beforeEach(async () => {
        // Create test users with different expiration dates
        await UserTier.create({
          userId: 'expiring-today',
          tier: 'trial',
          trialEndDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
        });

        await UserTier.create({
          userId: 'expiring-tomorrow',
          tier: 'trial',
          trialEndDate: new Date(Date.now() + 30 * 60 * 60 * 1000), // 30 hours from now
        });

        await UserTier.create({
          userId: 'expiring-next-week',
          tier: 'trial',
          trialEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
        });

        await UserTier.create({
          userId: 'already-expired',
          tier: 'trial',
          trialEndDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        });

        await UserTier.create({
          userId: 'pro-user',
          tier: 'pro', // Should not be included
        });
      });

      test('should find trials expiring within 1 day (default)', async () => {
        const expiringTrials = await UserTier.findExpiringTrials();

        expect(expiringTrials).toHaveLength(1);
        expect(expiringTrials[0].userId).toBe('expiring-today');
      });

      test('should find trials expiring within specified days', async () => {
        const expiringIn2Days = await UserTier.findExpiringTrials(2);

        expect(expiringIn2Days).toHaveLength(2);
        const userIds = expiringIn2Days.map(t => t.userId);
        expect(userIds).toContain('expiring-today');
        expect(userIds).toContain('expiring-tomorrow');
      });

      test('should not include expired trials', async () => {
        const expiringIn10Days = await UserTier.findExpiringTrials(10);

        const userIds = expiringIn10Days.map(t => t.userId);
        expect(userIds).not.toContain('already-expired');
      });

      test('should not include non-trial users', async () => {
        const expiringIn10Days = await UserTier.findExpiringTrials(10);

        const userIds = expiringIn10Days.map(t => t.userId);
        expect(userIds).not.toContain('pro-user');
      });
    });

    describe('getTrialAnalytics', () => {
      beforeEach(async () => {
        const analyticsUser = await UserTier.create({
          userId: 'analytics-user',
          tier: 'trial',
        });

        analyticsUser.trackFeatureUsage('claude4', 'high');
        analyticsUser.trackFeatureUsage('export', 'medium');
        analyticsUser.recordTrialAnalytics({
          featuresUsed: ['claude4'],
          sessionDuration: 600,
          messagesCount: 10,
          engagementScore: 8.5,
        });

        await analyticsUser.save();
      });

      test('should return analytics data for user', async () => {
        const analytics = await UserTier.getTrialAnalytics('analytics-user');

        expect(analytics).toBeTruthy();
        expect(analytics.tier).toBe('trial');
        expect(analytics.featuresUsed).toContain('claude4');
        expect(analytics.featuresUsed).toContain('export');
        expect(analytics.conversionCheckpoints).toHaveLength(2);
        expect(analytics.trialAnalytics).toHaveLength(1);
      });

      test('should return null for non-existent user', async () => {
        const analytics = await UserTier.getTrialAnalytics('non-existent-user');

        expect(analytics).toBeNull();
      });

      test('should only return selected fields', async () => {
        const analytics = await UserTier.getTrialAnalytics('analytics-user');

        // Should have analytics fields
        expect(analytics.trialAnalytics).toBeDefined();
        expect(analytics.conversionCheckpoints).toBeDefined();
        expect(analytics.featuresUsed).toBeDefined();
        expect(analytics.tier).toBeDefined();

        // Should not have other fields like email, subscriptionId, etc.
        expect(analytics.email).toBeUndefined();
        expect(analytics.subscriptionId).toBeUndefined();
      });
    });
  });

  describe('Pre-save Middleware', () => {
    test('should set trial dates for new trial user without dates', async () => {
      const userTier = new UserTier({
        userId: 'middleware-test',
        tier: 'trial',
        // No trialStartDate or trialEndDate provided
      });

      await userTier.save();

      expect(userTier.trialStartDate).toBeDefined();
      expect(userTier.trialEndDate).toBeDefined();
      
      // End date should be 7 days after start date
      const timeDiff = userTier.trialEndDate.getTime() - userTier.trialStartDate.getTime();
      const expectedDiff = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      expect(Math.abs(timeDiff - expectedDiff)).toBeLessThan(1000); // Within 1 second
    });

    test('should not modify existing trial dates', async () => {
      const specificStartDate = new Date('2024-01-01T00:00:00Z');
      const specificEndDate = new Date('2024-01-08T00:00:00Z');

      const userTier = new UserTier({
        userId: 'existing-dates-test',
        tier: 'trial',
        trialStartDate: specificStartDate,
        trialEndDate: specificEndDate,
      });

      await userTier.save();

      expect(userTier.trialStartDate.getTime()).toBe(specificStartDate.getTime());
      expect(userTier.trialEndDate.getTime()).toBe(specificEndDate.getTime());
    });

    test('should reset usage counters if needed', async () => {
      const oldResetDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000); // 35 days ago
      
      const userTier = new UserTier({
        userId: 'reset-test',
        monthlyMessageCount: 100,
        monthlyExportCount: 20,
        lastUsageReset: oldResetDate,
      });

      await userTier.save();

      expect(userTier.monthlyMessageCount).toBe(0);
      expect(userTier.monthlyExportCount).toBe(0);
      expect(userTier.lastUsageReset.getTime()).toBeGreaterThan(oldResetDate.getTime());
    });
  });
});