import { NextRequest } from 'next/server';
import { POST } from '@/app/api/speech-token/route';

// Mock the authentication middleware
jest.mock('@/lib/middleware/auth', () => ({
  requireAuth: jest.fn(() => Promise.resolve({ userId: 'test-user' }))
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock error handler
jest.mock('@/lib/error-handler', () => ({
  handleApiError: jest.fn((error, component) => {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.statusCode || 500,
      headers: { 'Content-Type': 'application/json' }
    });
  })
}));

// Mock API response helper
jest.mock('@/lib/api-response', () => ({
  ApiResponse: {
    internalError: jest.fn((message) =>
      new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    )
  }
}));

import { requireAuth } from '@/lib/middleware/auth';

describe('/api/speech-token', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/speech-token', () => {
    it('should return API key when authenticated and configured', async () => {
      process.env.ASSEMBLYAI_API_KEY = 'test-api-key-123';

      const request = new NextRequest('http://localhost:3000/api/speech-token', {
        method: 'POST'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        apiKey: 'test-api-key-123'
      });
      expect(requireAuth).toHaveBeenCalledWith(request);
    });

    it('should return error when API key is not configured', async () => {
      delete process.env.ASSEMBLYAI_API_KEY;

      const request = new NextRequest('http://localhost:3000/api/speech-token', {
        method: 'POST'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Speech recognition service not configured'
      });
    });

    it('should handle authentication failure', async () => {
      const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
      mockRequireAuth.mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { statusCode: 401 }));

      process.env.ASSEMBLYAI_API_KEY = 'test-api-key-123';

      const request = new NextRequest('http://localhost:3000/api/speech-token', {
        method: 'POST'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: 'Unauthorized'
      });
    });
  });
});