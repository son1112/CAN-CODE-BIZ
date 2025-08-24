import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tags/route';

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

// Mock the MongoDB connection
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

// Mock error handlers and API response
jest.mock('@/lib/error-handler', () => ({
  handleApiError: jest.fn((error, component) => {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }),
  validateRequest: jest.fn((body, validator) => body)
}));

jest.mock('@/lib/api-response', () => ({
  ApiResponse: {
    success: jest.fn((data, message) =>
      new Response(JSON.stringify({ success: true, data, message }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    ),
    conflict: jest.fn((message) =>
      new Response(JSON.stringify({ error: message }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    )
  }
}));

// Mock the Tag model
jest.mock('@/models/Tag', () => {
  const mockConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));

  mockConstructor.find = jest.fn();
  mockConstructor.findOne = jest.fn();

  return mockConstructor;
});

import Tag from '@/models/Tag';
import { requireAuth } from '@/lib/middleware/auth';

describe('/api/tags', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-initialize mock functions
    (Tag as any).find = jest.fn();
    (Tag as any).findOne = jest.fn();
  });

  describe('GET /api/tags', () => {
    it('should return all tags for authenticated user', async () => {
      const mockTags = [
        {
          _id: 'tag1',
          name: 'important',
          color: '#FF0000',
          category: 'priority',
          userId: 'test-user',
          usageCount: 5
        },
        {
          _id: 'tag2',
          name: 'work',
          color: '#00FF00',
          category: 'context',
          userId: 'test-user',
          usageCount: 3
        }
      ];

      (Tag as any).find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockTags),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/tags');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockTags,
        message: `Retrieved ${mockTags.length} tags`
      });
      expect(requireAuth).toHaveBeenCalledWith(request);
    });

    it('should filter tags by category', async () => {
      const mockTags = [{ _id: 'tag1', name: 'important', category: 'priority' }];

      (Tag as any).find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockTags),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/tags?category=priority');

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect((Tag as any).find).toHaveBeenCalledWith({
        userId: 'test-user',
        category: 'priority'
      });
    });

    it('should search tags by name', async () => {
      const mockTags = [{ _id: 'tag1', name: 'important' }];

      (Tag as any).find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockTags),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/tags?search=import');

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect((Tag as any).find).toHaveBeenCalledWith({
        userId: 'test-user',
        name: { $regex: 'import', $options: 'i' }
      });
    });

    it('should respect limit parameter', async () => {
      (Tag as any).find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/tags?limit=25');

      await GET(request);

      expect((Tag as any).find().sort().limit).toHaveBeenCalledWith(25);
    });

    it('should enforce maximum limit of 100', async () => {
      (Tag as any).find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/tags?limit=200');

      await GET(request);

      expect((Tag as any).find().sort().limit).toHaveBeenCalledWith(100);
    });

    it('should sort by name when specified', async () => {
      (Tag as any).find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/tags?sortBy=name');

      await GET(request);

      expect((Tag as any).find().sort).toHaveBeenCalledWith({ name: 1 });
    });
  });

  describe('POST /api/tags', () => {
    it('should create a new tag successfully', async () => {
      const newTag = {
        name: 'urgent',
        color: '#FF0000',
        category: 'priority',
        description: 'High priority items'
      };

      (Tag as any).findOne.mockResolvedValue(null); // No existing tag

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify(newTag),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Tag created successfully');
      expect(Tag).toHaveBeenCalledWith(expect.objectContaining({
        name: 'urgent',
        color: '#FF0000',
        category: 'priority',
        description: 'High priority items',
        userId: 'test-user',
        usageCount: 0
      }));
    });

    it('should return conflict if tag already exists', async () => {
      const existingTag = {
        _id: 'existing-tag',
        name: 'urgent',
        userId: 'test-user'
      };

      (Tag as any).findOne.mockResolvedValue(existingTag);

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'urgent' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Tag already exists');
    });

    it('should use default color when not provided', async () => {
      (Tag as any).findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await POST(request);

      expect(Tag).toHaveBeenCalledWith(expect.objectContaining({
        color: '#3B82F6' // Default blue color
      }));
    });

    it('should normalize tag name to lowercase', async () => {
      (Tag as any).findOne.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'URGENT' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await POST(request);

      expect((Tag as any).findOne).toHaveBeenCalledWith({
        userId: 'test-user',
        name: 'urgent'
      });
      expect(Tag).toHaveBeenCalledWith(expect.objectContaining({
        name: 'urgent'
      }));
    });

    it('should handle authentication failure', async () => {
      const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
      mockRequireAuth.mockRejectedValueOnce(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});