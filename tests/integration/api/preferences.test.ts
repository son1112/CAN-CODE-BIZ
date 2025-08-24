import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/preferences/route';

// Mock the authentication middleware
jest.mock('@/lib/middleware/auth', () => ({
  requireAuth: jest.fn(() => Promise.resolve({ userId: 'test-user' }))
}));

// Mock the MongoDB connection
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

// Mock the UserPreferences model
jest.mock('@/models/UserPreferences', () => {
  const mockConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }));
  
  mockConstructor.findOne = jest.fn();
  mockConstructor.findOneAndUpdate = jest.fn();
  
  return mockConstructor;
});

import UserPreferences from '@/models/UserPreferences';
import { requireAuth } from '@/lib/middleware/auth';

describe('/api/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Re-initialize mock functions
    (UserPreferences as any).findOne = jest.fn();
    (UserPreferences as any).findOneAndUpdate = jest.fn();
  });

  describe('GET /api/preferences', () => {
    it('should return existing preferences for authenticated user', async () => {
      const mockPreferences = {
        _id: 'pref1',
        userId: 'test-user',
        notifications: {
          soundEffects: true,
          voiceAlerts: false,
          systemNotifications: true,
        },
        voice: {
          autoSend: false,
          silenceThreshold: 3,
          voiceQuality: 'medium',
        },
        display: {
          theme: 'dark',
          language: 'en',
          reducedMotion: true,
        },
        privacy: {
          saveConversations: false,
          shareUsageData: true,
          showOnlineStatus: false,
        },
      };

      (UserPreferences as any).findOne.mockResolvedValue(mockPreferences);

      const request = new NextRequest('http://localhost:3000/api/preferences');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPreferences);
      expect(UserPreferences.findOne).toHaveBeenCalledWith({ userId: 'test-user' });
      expect(requireAuth).toHaveBeenCalledWith(request);
    });

    it('should create and return default preferences when none exist', async () => {
      (UserPreferences as any).findOne.mockResolvedValue(null);

      const defaultPreferences = {
        userId: 'test-user',
        notifications: {
          soundEffects: true,
          voiceAlerts: true,
          systemNotifications: false,
        },
        voice: {
          autoSend: true,
          silenceThreshold: 2,
          voiceQuality: 'high',
        },
        display: {
          theme: 'light',
          language: 'en',
          reducedMotion: false,
        },
        privacy: {
          saveConversations: true,
          shareUsageData: false,
          showOnlineStatus: true,
        },
      };

      const request = new NextRequest('http://localhost:3000/api/preferences');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(defaultPreferences);
      expect(UserPreferences).toHaveBeenCalledWith(defaultPreferences);
      expect(UserPreferences.findOne).toHaveBeenCalledWith({ userId: 'test-user' });
    });

    it('should handle authentication failure', async () => {
      const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
      mockRequireAuth.mockRejectedValueOnce(new Error('Authentication required'));

      const request = new NextRequest('http://localhost:3000/api/preferences');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should handle database errors', async () => {
      (UserPreferences as any).findOne.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/preferences');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch preferences');
    });
  });

  describe('PUT /api/preferences', () => {
    it('should update existing preferences successfully', async () => {
      const updatedPreferences = {
        _id: 'pref1',
        userId: 'test-user',
        notifications: {
          soundEffects: false,
          voiceAlerts: true,
          systemNotifications: false,
        },
        voice: {
          autoSend: false,
          silenceThreshold: 4,
          voiceQuality: 'low',
        },
        display: {
          theme: 'dark',
          language: 'es',
          reducedMotion: true,
        },
        privacy: {
          saveConversations: true,
          shareUsageData: true,
          showOnlineStatus: false,
        },
        updatedAt: new Date(),
      };

      (UserPreferences as any).findOneAndUpdate.mockResolvedValue(updatedPreferences);

      const requestBody = {
        preferences: {
          notifications: {
            soundEffects: false,
            voiceAlerts: true,
            systemNotifications: false,
          },
          voice: {
            autoSend: false,
            silenceThreshold: 4,
            voiceQuality: 'low',
          },
          display: {
            theme: 'dark',
            language: 'es',
            reducedMotion: true,
          },
          privacy: {
            saveConversations: true,
            shareUsageData: true,
            showOnlineStatus: false,
          },
        }
      };

      const request = new NextRequest('http://localhost:3000/api/preferences', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        _id: 'pref1',
        userId: 'test-user',
        notifications: {
          soundEffects: false,
          voiceAlerts: true,
          systemNotifications: false,
        },
        voice: {
          autoSend: false,
          silenceThreshold: 4,
          voiceQuality: 'low',
        },
        display: {
          theme: 'dark',
          language: 'es',
          reducedMotion: true,
        },
        privacy: {
          saveConversations: true,
          shareUsageData: true,
          showOnlineStatus: false,
        },
      });
      expect(data.updatedAt).toBeDefined();
      expect(UserPreferences.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'test-user' },
        {
          ...requestBody.preferences,
          userId: 'test-user',
          updatedAt: expect.anything(),
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );
    });

    it('should return 400 when preferences data is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Preferences data is required');
    });

    it('should create new preferences when none exist (upsert)', async () => {
      const newPreferences = {
        _id: 'new-pref',
        userId: 'test-user',
        notifications: {
          soundEffects: true,
          voiceAlerts: false,
          systemNotifications: true,
        },
        updatedAt: new Date(),
      };

      (UserPreferences as any).findOneAndUpdate.mockResolvedValue(newPreferences);

      const requestBody = {
        preferences: {
          notifications: {
            soundEffects: true,
            voiceAlerts: false,
            systemNotifications: true,
          },
        }
      };

      const request = new NextRequest('http://localhost:3000/api/preferences', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        _id: 'new-pref',
        userId: 'test-user',
        notifications: {
          soundEffects: true,
          voiceAlerts: false,
          systemNotifications: true,
        },
      });
      expect(data.updatedAt).toBeDefined();
      expect(UserPreferences.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'test-user' },
        {
          ...requestBody.preferences,
          userId: 'test-user',
          updatedAt: expect.anything(),
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );
    });

    it('should handle authentication failure', async () => {
      const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
      mockRequireAuth.mockRejectedValueOnce(new Error('Authentication required'));

      const request = new NextRequest('http://localhost:3000/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences: {} }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should handle database errors', async () => {
      (UserPreferences as any).findOneAndUpdate.mockRejectedValue(new Error('Database update failed'));

      const request = new NextRequest('http://localhost:3000/api/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences: { theme: 'dark' } }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update preferences');
    });

    it('should handle partial preference updates', async () => {
      const partialUpdate = {
        _id: 'pref1',
        userId: 'test-user',
        display: { theme: 'dark' },
        updatedAt: new Date(),
      };

      (UserPreferences as any).findOneAndUpdate.mockResolvedValue(partialUpdate);

      const requestBody = {
        preferences: {
          display: { theme: 'dark' }
        }
      };

      const request = new NextRequest('http://localhost:3000/api/preferences', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        _id: 'pref1',
        userId: 'test-user',
        display: { theme: 'dark' },
      });
      expect(data.updatedAt).toBeDefined();
    });

    it('should handle invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/preferences', {
        method: 'PUT',
        body: 'invalid-json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update preferences');
    });
  });
});