import { NextRequest } from 'next/server';
import { POST } from '@/app/api/generate-duck-avatar/route';

// Mock the authentication middleware
jest.mock('@/lib/middleware/auth', () => ({
  requireAuth: jest.fn(() => Promise.resolve({ userId: 'test-user' }))
}));

// Mock setTimeout to avoid delays in tests
jest.spyOn(global, 'setTimeout').mockImplementation((callback: any, delay?: number) => {
  // For the Promise pattern used in the API, call callback immediately
  if (typeof callback === 'function') {
    callback();
  }
  return 1 as any; // Return a dummy timer ID
});

import { requireAuth } from '@/lib/middleware/auth';

describe('/api/generate-duck-avatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/generate-duck-avatar', () => {
    it('should generate coding duck avatar for programming input', async () => {
      const requestBody = {
        userInput: 'I need help with debugging my code',
        sessionId: 'session123'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        imageUrl: '/mock-avatars/coding-duck.png',
        prompt: expect.stringContaining('wearing tiny glasses and a programmer hoodie'),
        sessionId: 'session123'
      });
      expect(requireAuth).toHaveBeenCalledWith(request);
    });

    it('should generate design duck avatar for creative input', async () => {
      const requestBody = {
        userInput: 'Help me with art and design ideas',
        sessionId: 'session456'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.imageUrl).toBe('/mock-avatars/design-duck.png');
      expect(data.prompt).toContain('wearing a beret and holding a tiny paintbrush');
    });

    it('should generate data duck avatar for analysis input', async () => {
      const requestBody = {
        userInput: 'I need help with data analysis and graphs',
        sessionId: 'session789'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.imageUrl).toBe('/mock-avatars/data-duck.png');
      expect(data.prompt).toContain('wearing a business tie and small reading glasses');
    });

    it('should generate gaming duck avatar for game input', async () => {
      const requestBody = {
        userInput: 'Let\'s talk about fun games and play',
        sessionId: 'session101'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.imageUrl).toBe('/mock-avatars/gaming-duck.png');
      expect(data.prompt).toContain('wearing a gaming headset and controller accessories');
    });

    it('should generate business duck avatar for business input', async () => {
      const requestBody = {
        userInput: 'Help me prepare for a business meeting',
        sessionId: 'session202'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.imageUrl).toBe('/mock-avatars/business-duck.png');
    });

    it('should generate student duck avatar for learning input', async () => {
      const requestBody = {
        userInput: 'I want to learn something new and study',
        sessionId: 'session303'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.imageUrl).toBe('/mock-avatars/student-duck.png');
    });

    it('should generate default duck avatar for generic input', async () => {
      const requestBody = {
        userInput: 'Just having a general conversation',
        sessionId: 'session404'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.imageUrl).toBe('/mock-avatars/default-duck.png');
      expect(data.prompt).toContain('with a friendly expression and cheerful demeanor');
    });

    it('should return 400 for missing userInput', async () => {
      const requestBody = {
        sessionId: 'session505'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User input is required');
    });

    it('should return 400 for non-string userInput', async () => {
      const requestBody = {
        userInput: 123,
        sessionId: 'session606'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User input is required');
    });

    it('should return 400 for empty string userInput', async () => {
      const requestBody = {
        userInput: '',
        sessionId: 'session707'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User input is required');
    });

    it('should handle authentication failure', async () => {
      const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
      mockRequireAuth.mockRejectedValueOnce(new Error('Unauthorized'));

      const requestBody = {
        userInput: 'test input',
        sessionId: 'session808'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate duck avatar');
    });

    it('should be case insensitive for keyword matching', async () => {
      const requestBody = {
        userInput: 'HELP ME WITH CODING AND PROGRAMMING',
        sessionId: 'session909'
      };

      const request = new NextRequest('http://localhost:3000/api/generate-duck-avatar', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.imageUrl).toBe('/mock-avatars/coding-duck.png');
    });
  });
});