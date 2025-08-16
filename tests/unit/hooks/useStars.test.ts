import { renderHook, act, waitFor } from '@testing-library/react'
import { useStars } from '@/hooks/useStars'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock star data for testing
const mockStarData = {
  _id: 'star1',
  starId: 'star_123',
  userId: 'test-user',
  itemType: 'message' as const,
  itemId: 'msg1',
  context: { 
    title: 'Test Message',
    description: 'A test message for starring',
    messageContent: 'Hello world'
  },
  category: 'message',
  priority: 'medium' as const,
  tags: ['important', 'test'],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockStarData2 = {
  ...mockStarData,
  _id: 'star2',
  starId: 'star_456',
  itemType: 'session' as const,
  itemId: 'session1',
  priority: 'high' as const,
  tags: ['session', 'work'],
  context: {
    title: 'Work Session',
    description: 'Important work session'
  }
}

describe('useStars', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      expect(result.current.stars).toEqual([])
      expect(result.current.isLoading).toBe(true) // Loading initially
      expect(result.current.error).toBe(null)
    })

    it('should load stars on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [mockStarData] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/stars?userId=test-user')
      expect(result.current.stars).toEqual([mockStarData])
      expect(result.current.error).toBe(null)
    })

    it('should handle load error on mount', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stars).toEqual([])
      expect(result.current.error).toBe('Network error')
    })
  })

  describe('starItem', () => {
    it('should successfully star an item', async () => {
      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock star creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ star: mockStarData })
      })

      let starResult: boolean
      await act(async () => {
        starResult = await result.current.starItem({
          itemType: 'message',
          itemId: 'msg1',
          context: { title: 'Test Message' }
        })
      })

      expect(starResult!).toBe(true)
      expect(result.current.stars).toContain(mockStarData)
      expect(result.current.error).toBe(null)
      expect(mockFetch).toHaveBeenLastCalledWith('/api/stars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'message',
          itemId: 'msg1',
          context: { title: 'Test Message' },
          userId: 'test-user'
        })
      })
    })

    it('should handle star creation error', async () => {
      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Item already starred' })
      })

      let starResult: boolean
      await act(async () => {
        starResult = await result.current.starItem({
          itemType: 'message',
          itemId: 'msg1',
          context: { title: 'Test Message' }
        })
      })

      expect(starResult!).toBe(false)
      expect(result.current.stars).toEqual([])
      expect(result.current.error).toBe('Item already starred')
    })
  })

  describe('unstarItem', () => {
    it('should successfully unstar an item', async () => {
      // Mock initial load with starred item
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [mockStarData] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.stars).toEqual([mockStarData])
      })

      // Mock unstar success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      let unstarResult: boolean
      await act(async () => {
        unstarResult = await result.current.unstarItem('message', 'msg1')
      })

      expect(unstarResult!).toBe(true)
      expect(result.current.stars).toEqual([])
      expect(result.current.error).toBe(null)
    })

    it('should handle unstar error', async () => {
      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [mockStarData] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.stars).toEqual([mockStarData])
      })

      // Mock error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Star not found' })
      })

      let unstarResult: boolean
      await act(async () => {
        unstarResult = await result.current.unstarItem('message', 'msg1')
      })

      expect(unstarResult!).toBe(false)
      expect(result.current.stars).toEqual([mockStarData]) // Should remain unchanged
      expect(result.current.error).toBe('Star not found')
    })
  })

  describe('isStarred', () => {
    it('should return true for starred items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [mockStarData] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.stars).toEqual([mockStarData])
      })

      expect(result.current.isStarred('message', 'msg1')).toBe(true)
      expect(result.current.isStarred('message', 'msg2')).toBe(false)
      expect(result.current.isStarred('session', 'msg1')).toBe(false)
    })
  })

  describe('updateStar', () => {
    it('should successfully update a star', async () => {
      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [mockStarData] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.stars).toEqual([mockStarData])
      })

      // Mock update response
      const updatedStar = { ...mockStarData, priority: 'high' as const }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ star: updatedStar })
      })

      let updateResult: boolean
      await act(async () => {
        updateResult = await result.current.updateStar('star_123', { priority: 'high' })
      })

      expect(updateResult!).toBe(true)
      expect(result.current.stars[0].priority).toBe('high')
      expect(result.current.error).toBe(null)
    })
  })

  describe('query functions', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [mockStarData, mockStarData2] })
      })
    })

    it('should filter stars by type', async () => {
      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.stars).toHaveLength(2)
      })

      const messageStars = result.current.getStarsByType('message')
      const sessionStars = result.current.getStarsByType('session')

      expect(messageStars).toHaveLength(1)
      expect(messageStars[0].itemType).toBe('message')
      expect(sessionStars).toHaveLength(1)
      expect(sessionStars[0].itemType).toBe('session')
    })

    it('should filter stars by tag', async () => {
      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.stars).toHaveLength(2)
      })

      const testStars = result.current.getStarsByTag('test')
      const workStars = result.current.getStarsByTag('work')

      expect(testStars).toHaveLength(1)
      expect(testStars[0].tags).toContain('test')
      expect(workStars).toHaveLength(1)
      expect(workStars[0].tags).toContain('work')
    })

    it('should filter stars by priority', async () => {
      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.stars).toHaveLength(2)
      })

      const mediumStars = result.current.getStarsByPriority('medium')
      const highStars = result.current.getStarsByPriority('high')

      expect(mediumStars).toHaveLength(1)
      expect(highStars).toHaveLength(1)
    })

    it('should search stars by content', async () => {
      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.stars).toHaveLength(2)
      })

      const testResults = result.current.searchStars('test')
      const workResults = result.current.searchStars('work')
      const helloResults = result.current.searchStars('hello')

      expect(testResults).toHaveLength(1)
      expect(workResults).toHaveLength(1)
      expect(helloResults).toHaveLength(1) // Should find "Hello world" in messageContent
    })
  })

  describe('stats functions', () => {
    it('should return total star count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [mockStarData, mockStarData2] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.stars).toHaveLength(2)
      })

      expect(result.current.getTotalStars()).toBe(2)
    })

    it('should return star count by type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [mockStarData, mockStarData2] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.stars).toHaveLength(2)
      })

      expect(result.current.getStarCountByType('message')).toBe(1)
      expect(result.current.getStarCountByType('session')).toBe(1)
      expect(result.current.getStarCountByType('agent')).toBe(0)
    })
  })

  describe('loadStars with filters', () => {
    it('should load stars with filters', async () => {
      // Mock initial load (empty)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock filtered load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [mockStarData] })
      })

      await act(async () => {
        await result.current.loadStars({
          itemType: 'message',
          priority: 'high',
          tags: ['important']
        })
      })

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/api/stars?userId=test-user&itemType=message&priority=high&tags=important')
      )
      expect(result.current.stars).toEqual([mockStarData])
    })
  })

  describe('refreshStars', () => {
    it('should refresh stars', async () => {
      // Mock initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [mockStarData] })
      })

      const { result } = renderHook(() => useStars('test-user'))

      await waitFor(() => {
        expect(result.current.stars).toEqual([mockStarData])
      })

      // Mock refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stars: [mockStarData, mockStarData2] })
      })

      await act(async () => {
        await result.current.refreshStars()
      })

      expect(result.current.stars).toHaveLength(2)
    })
  })
})