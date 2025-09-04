import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/trial/status/route';
import { auth } from '@/lib/auth';
import UserTier from '@/models/UserTier';
import connectDB from '@/lib/mongodb';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/mongodb');
jest.mock('@/models/UserTier');

const mockedAuth = auth as jest.MockedFunction<typeof auth>;
const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedUserTier = UserTier as jest.Mocked<typeof UserTier>;

describe('/api/trial/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockResolvedValue(undefined);
  });

  describe('GET /api/trial/status', () => {
    test('should return trial status for authenticated user with existing trial', async () => {
      // Mock authenticated user
      mockedAuth.mockResolvedValue({
        user: { id: 'test-user-123' }
      } as any);

      // Mock existing user tier
      const mockUserTier = {
        userId: 'test-user-123',
        tier: 'trial',
        trialStartDate: new Date('2024-01-01'),
        trialEndDate: new Date('2024-01-08'),
        trialExtensions: 0,
        maxTrialExtensions: 2,
        isTrialActive: true,
        trialDaysRemaining: 5,
        hasTrialExpired: false,
        canExtendTrial: true,
      };

      mockedUserTier.findOne.mockResolvedValue(mockUserTier as any);

      const request = new NextRequest('http://localhost:3000/api/trial/status', { method: 'GET' });
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual({
        isTrialActive: true,
        trialDaysRemaining: 5,
        trialExpiresAt: mockUserTier.trialEndDate,
        hasTrialExpired: false,
        canExtendTrial: true,
        tier: 'trial',
        trialExtensions: 0,
        maxTrialExtensions: 2,
      });

      expect(mockedUserTier.findOne).toHaveBeenCalledWith({ userId: 'test-user-123' });
    });

    test('should create new trial user when none exists', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'new-user-456', email: 'new@example.com' }
      } as any);

      // No existing user
      mockedUserTier.findOne.mockResolvedValue(null);

      // Mock createTrialUser
      const mockNewUser = {
        userId: 'new-user-456',
        email: 'new@example.com',
        tier: 'trial',
        isTrialActive: true,
        trialDaysRemaining: 7,
        hasTrialExpired: false,
        canExtendTrial: true,
        trialExtensions: 0,
        maxTrialExtensions: 2,
        trialEndDate: new Date('2024-01-08'),
      };

      mockedUserTier.createTrialUser.mockResolvedValue(mockNewUser as any);

      const request = new NextRequest('http://localhost:3000/api/trial/status', { method: 'GET' });
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.tier).toBe('trial');
      expect(responseData.data.trialDaysRemaining).toBe(7);

      expect(mockedUserTier.createTrialUser).toHaveBeenCalledWith('new-user-456', 'new@example.com');
    });

    test('should return 401 for unauthenticated request', async () => {
      mockedAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/trial/status', { method: 'GET' });
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Authentication required');
    });

    test('should handle database connection error', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'test-user' }
      } as any);

      mockedConnectDB.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/trial/status', { method: 'GET' });
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Database connection failed');
    });

    test('should handle UserTier query error', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'test-user' }
      } as any);

      mockedUserTier.findOne.mockRejectedValue(new Error('Query failed'));

      const request = new NextRequest('http://localhost:3000/api/trial/status', { method: 'GET' });
      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Query failed');
    });
  });

  describe('PATCH /api/trial/status', () => {
    test('should update user tier successfully', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'update-user' }
      } as any);

      const mockUserTier = {
        userId: 'update-user',
        tier: 'trial',
        save: jest.fn(),
        upgradeToTier: jest.fn(),
        isTrialActive: false,
        trialDaysRemaining: 0,
        hasTrialExpired: true,
        canExtendTrial: false,
        trialExtensions: 0,
        maxTrialExtensions: 2,
        trialEndDate: new Date('2024-01-01'),
      };

      mockedUserTier.findOne.mockResolvedValue(mockUserTier as any);

      const subscriptionData = {
        subscriptionId: 'sub_123',
        status: 'active',
      };

      const request = new NextRequest('http://localhost:3000/api/trial/status', {
        method: 'PATCH',
        body: JSON.stringify({
          tier: 'pro',
          subscriptionData,
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      // After upgrade, tier should be pro
      mockUserTier.tier = 'pro';

      const response = await PATCH(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.tier).toBe('pro');

      expect(mockUserTier.upgradeToTier).toHaveBeenCalledWith('pro', subscriptionData);
      expect(mockUserTier.save).toHaveBeenCalled();
    });

    test('should update trial end date', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'update-date-user' }
      } as any);

      const newEndDate = '2024-02-01T00:00:00.000Z';
      const mockUserTier = {
        userId: 'update-date-user',
        tier: 'trial',
        trialEndDate: new Date('2024-01-08'),
        save: jest.fn(),
        isTrialActive: true,
        trialDaysRemaining: 24,
        hasTrialExpired: false,
        canExtendTrial: true,
        trialExtensions: 0,
        maxTrialExtensions: 2,
      };

      mockedUserTier.findOne.mockResolvedValue(mockUserTier as any);

      const request = new NextRequest('http://localhost:3000/api/trial/status', {
        method: 'PATCH',
        body: JSON.stringify({
          trialEndDate: newEndDate,
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      // Update the date
      mockUserTier.trialEndDate = new Date(newEndDate);

      const response = await PATCH(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(new Date(responseData.data.trialExpiresAt).toISOString()).toBe(newEndDate);

      expect(mockUserTier.trialEndDate).toEqual(new Date(newEndDate));
      expect(mockUserTier.save).toHaveBeenCalled();
    });

    test('should return 404 for non-existent user', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'non-existent-user' }
      } as any);

      mockedUserTier.findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/trial/status', {
        method: 'PATCH',
        body: JSON.stringify({ tier: 'pro' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PATCH(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('User tier not found');
    });

    test('should return 401 for unauthenticated request', async () => {
      mockedAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/trial/status', {
        method: 'PATCH',
        body: JSON.stringify({ tier: 'pro' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PATCH(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Authentication required');
    });

    test('should handle tier upgrade without subscription data', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'simple-upgrade-user' }
      } as any);

      const mockUserTier = {
        userId: 'simple-upgrade-user',
        tier: 'free',
        save: jest.fn(),
        isTrialActive: false,
        trialDaysRemaining: 0,
        hasTrialExpired: false,
        canExtendTrial: false,
        trialExtensions: 0,
        maxTrialExtensions: 2,
        trialEndDate: null,
      };

      mockedUserTier.findOne.mockResolvedValue(mockUserTier as any);

      const request = new NextRequest('http://localhost:3000/api/trial/status', {
        method: 'PATCH',
        body: JSON.stringify({ tier: 'enterprise' }),
        headers: { 'Content-Type': 'application/json' }
      });

      // After tier change
      mockUserTier.tier = 'enterprise';

      const response = await PATCH(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.tier).toBe('enterprise');

      expect(mockUserTier.save).toHaveBeenCalled();
    });

    test('should handle save error', async () => {
      mockedAuth.mockResolvedValue({
        user: { id: 'save-error-user' }
      } as any);

      const mockUserTier = {
        userId: 'save-error-user',
        tier: 'trial',
        save: jest.fn().mockRejectedValue(new Error('Save failed')),
        upgradeToTier: jest.fn(),
      };

      mockedUserTier.findOne.mockResolvedValue(mockUserTier as any);

      const request = new NextRequest('http://localhost:3000/api/trial/status', {
        method: 'PATCH',
        body: JSON.stringify({ tier: 'pro' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PATCH(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Save failed');
    });
  });
});