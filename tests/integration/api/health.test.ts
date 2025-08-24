import { NextRequest } from 'next/server';
import { GET } from '@/app/api/health/route';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock MongoDB connection
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

import connectDB from '@/lib/mongodb';

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.npm_package_version = '1.0.0';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.npm_package_version;
    delete process.env.NODE_ENV;
  });

  describe('GET /api/health', () => {
    it('should return healthy status when everything is working', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        version: '1.0.0',
        environment: 'test',
        services: {
          database: 'connected',
          api: 'operational'
        }
      });
      expect(connectDB).toHaveBeenCalled();
    });

    it('should return unhealthy status when database connection fails', async () => {
      const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
      mockConnectDB.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/health');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({
        status: 'unhealthy',
        timestamp: expect.any(String),
        error: 'Database connection failed'
      });
    });

    it('should handle unknown errors gracefully', async () => {
      const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
      mockConnectDB.mockRejectedValueOnce('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/health');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data).toEqual({
        status: 'unhealthy',
        timestamp: expect.any(String),
        error: 'Unknown error'
      });
    });

    it('should use default values when environment variables are not set', async () => {
      delete process.env.npm_package_version;
      delete process.env.NODE_ENV;

      const request = new NextRequest('http://localhost:3000/api/health');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.version).toBe('1.0.0');
      expect(data.environment).toBe('development');
    });
  });
});