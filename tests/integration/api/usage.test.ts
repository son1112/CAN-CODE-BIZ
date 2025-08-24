import { NextRequest } from 'next/server';
import { GET } from '@/app/api/usage/route';

// Mock the authentication middleware
jest.mock('@/lib/middleware/auth', () => ({
  requireAuth: jest.fn(() => Promise.resolve({ userId: 'test-user' }))
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the ccusage utility
jest.mock('@/lib/ccusage', () => ({
  getCurrentProjectUsage: jest.fn()
}));

import { requireAuth } from '@/lib/middleware/auth';
import { getCurrentProjectUsage } from '@/lib/ccusage';

describe('/api/usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/usage', () => {
    it('should return usage data when available', async () => {
      const mockUsageData = {
        projectTokens: 1500,
        dailyTotalTokens: 5000,
        currentUsage: {
          messages: 150,
          sessions: 25,
          agents: 3
        },
        limits: {
          maxMessages: 1000,
          maxSessions: 100,
          maxAgents: 10
        }
      };

      (getCurrentProjectUsage as jest.Mock).mockResolvedValue(mockUsageData);

      const request = new NextRequest('http://localhost:3000/api/usage');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockUsageData
      });
      expect(requireAuth).toHaveBeenCalledWith(request);
      expect(getCurrentProjectUsage).toHaveBeenCalled();
    });

    it('should return error when no usage data is available', async () => {
      (getCurrentProjectUsage as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/usage');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: false,
        message: 'No usage data available'
      });
    });

    it('should handle authentication failure', async () => {
      const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
      mockRequireAuth.mockRejectedValueOnce(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/usage');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch usage data'
      });
    });

    it('should handle ccusage service errors', async () => {
      (getCurrentProjectUsage as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/usage');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch usage data'
      });
    });
  });
});