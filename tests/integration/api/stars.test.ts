import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/stars/route'

// Mock the authentication
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
    },
  })),
}))

// Mock the MongoDB connection
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}))

// Mock the Star model with automatic jest.fn() functions
jest.mock('@/models/Star')

import Star from '@/models/Star'

const mockStar = Star as jest.Mocked<typeof Star>

describe('/api/stars', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/stars', () => {
    it('should return stars for authenticated user', async () => {
      const mockStars = [
        {
          _id: 'star1',
          starId: 'star_123',
          userId: 'test-user',
          itemType: 'message',
          itemId: 'msg1',
          context: { title: 'Test Message' },
          category: 'message',
          priority: 'medium',
          createdAt: new Date(),
        },
      ]

      mockStar.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockStars),
        }),
      } as any)
      mockStar.countDocuments.mockResolvedValue(1)

      const url = new URL('http://localhost:3000/api/stars?userId=test-user')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        stars: mockStars,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1,
        },
      })
    })

    it('should handle pagination correctly', async () => {
      mockStar.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      } as any)
      mockStar.countDocuments.mockResolvedValue(100)

      const url = new URL('http://localhost:3000/api/stars?userId=test-user&page=2&limit=10')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 100,
        pages: 10,
      })
    })

    it('should require authentication', async () => {
      // Mock auth to return null (unauthenticated)
      const { auth } = require('@/lib/auth')
      auth.mockResolvedValueOnce(null)

      const url = new URL('http://localhost:3000/api/stars?userId=test-user')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/stars', () => {
    it('should create a new star', async () => {
      const mockStar = {
        _id: 'star1',
        starId: 'star_123',
        userId: 'test-user',
        itemType: 'message',
        itemId: 'msg1',
        context: { title: 'Test Message' },
        category: 'message',
        priority: 'medium',
        createdAt: new Date(),
      }

      mockStar.create.mockResolvedValue(mockStar)

      const requestBody = {
        userId: 'test-user',
        itemType: 'message',
        itemId: 'msg1',
        context: { title: 'Test Message' },
      }

      const request = new NextRequest('http://localhost:3000/api/stars', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.star).toEqual(mockStar)
      expect(mockStar.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user',
          itemType: 'message',
          itemId: 'msg1',
          context: { title: 'Test Message' },
        })
      )
    })

    it('should validate required fields', async () => {
      const requestBody = {
        userId: 'test-user',
        // Missing itemType and itemId
      }

      const request = new NextRequest('http://localhost:3000/api/stars', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should handle database errors gracefully', async () => {
      mockStar.create.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        userId: 'test-user',
        itemType: 'message',
        itemId: 'msg1',
        context: { title: 'Test Message' },
      }

      const request = new NextRequest('http://localhost:3000/api/stars', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create star')
    })
  })
})