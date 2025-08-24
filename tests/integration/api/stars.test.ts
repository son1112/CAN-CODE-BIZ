import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/stars/route'

// Mock the authentication middleware
jest.mock('@/lib/middleware/auth', () => ({
  requireAuth: jest.fn(() => Promise.resolve({ userId: 'test-user' }))
}))

// Mock the MongoDB connection
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}))

// Mock the Star model with both constructor and static methods
jest.mock('@/models/Star', () => {
  const mockConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  }))

  // Add static methods to the constructor
  mockConstructor.find = jest.fn()
  mockConstructor.countDocuments = jest.fn()
  mockConstructor.findOne = jest.fn()

  return mockConstructor
})

import Star from '@/models/Star'

const mockStar = Star as jest.Mocked<typeof Star>

describe('/api/stars', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Re-initialize mock functions after clearing
    mockStar.find = jest.fn()
    mockStar.countDocuments = jest.fn()
    mockStar.findOne = jest.fn()
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
          createdAt: new Date().toISOString(),
        },
      ]

      mockStar.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockStars),
            }),
          }),
        }),
      } as any)
      mockStar.countDocuments.mockResolvedValue(1)

      const url = new URL('http://localhost:3000/api/stars?userId=test-user')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Stars retrieved successfully',
        data: mockStars,
        pagination: {
          page: 1,
          limit: 50,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      })
    })

    it('should handle pagination correctly', async () => {
      mockStar.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
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
        totalCount: 100,
        totalPages: 10,
        hasNextPage: true,
        hasPreviousPage: true,
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
      expect(data.error).toBe('Authentication required')
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
        createdAt: new Date().toISOString(),
      }

      // Mock findOne to return null (no duplicate found)
      mockStar.findOne = jest.fn().mockResolvedValue(null)

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
      expect(data.star).toBeDefined()
      expect(data.star).toEqual(expect.objectContaining({
        userId: 'test-user',
        itemType: 'message',
        itemId: 'msg1',
        context: { title: 'Test Message' },
        priority: 'medium',
        tags: []
      }))
      expect(data.star.starId).toMatch(/^star_\d+_[a-z0-9]+$/)
      // Check that the constructor was called with the correct data
      expect(Star).toHaveBeenCalledWith(
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
      expect(data.error).toBe('Request validation failed')
    })

    it('should handle database errors gracefully', async () => {
      // Mock findOne to return null (no duplicate found)
      mockStar.findOne = jest.fn().mockResolvedValue(null)

      // Reset Star mock and make it return an object with a failing save method
      ;(Star as jest.MockedFunction<any>).mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      }))

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
      expect(data.error).toBe('Internal server error')
    })
  })
})