import { renderHook, act, waitFor } from '@testing-library/react'
import { useAgents, Agent, clearAgentsCache } from '@/hooks/useAgents'

// Mock next-auth
const mockSession = {
  user: {
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
  },
}

const mockUseSession = jest.fn()
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}))

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock agent data for testing
const mockAgent1: Agent = {
  name: 'code-reviewer',
  description: 'A helpful assistant that reviews code for best practices',
  prompt: 'Review the following code: {{transcript}}',
  preferredModel: 'claude-3-5-sonnet-20241022',
  modelJustification: 'Best for code analysis'
}

const mockAgent2: Agent = {
  name: 'documentation-writer',
  description: 'Generates comprehensive documentation',
  prompt: 'Create documentation for: {{transcript}}',
  preferredModel: 'claude-3-opus-20240229',
  modelJustification: 'Best for writing tasks'
}

describe('useAgents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()

    // Clear any global cache that might interfere with tests
    jest.resetModules()

    // Mock successful session
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    })

    // Mock successful fetch by default
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        agents: [mockAgent1, mockAgent2],
        count: 2
      })
    })

    // Clear the global cache between tests
    clearAgentsCache()
  })

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useAgents())

      expect(result.current.agents).toEqual([])
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe(null)
      expect(result.current.selectedAgent).toBe(null)
    })

    it('should load agents on mount when authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          agents: [mockAgent1, mockAgent2],
          count: 2
        })
      })

      const { result } = renderHook(() => useAgents())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/agents')
      expect(result.current.agents).toEqual([mockAgent1, mockAgent2])
      expect(result.current.selectedAgent).toBe(mockAgent1) // Should auto-select first agent
      expect(result.current.error).toBe(null)
    })

    it('should not load agents when not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      })

      const { result } = renderHook(() => useAgents())

      await waitFor(() => {
        expect(result.current.loading).toBe(true) // Should remain loading
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.agents).toEqual([])
    })

    it('should not load agents when session is loading', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      })

      const { result } = renderHook(() => useAgents())

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result.current.loading).toBe(true)
    })

    it('should handle 401 authentication error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      })

      const { result } = renderHook(() => useAgents())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Authentication required')
      expect(result.current.agents).toEqual([])
    })

    it('should handle general load error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      })

      const { result } = renderHook(() => useAgents())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to load agents')
      expect(result.current.agents).toEqual([])
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAgents())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
      expect(result.current.agents).toEqual([])
    })
  })

  describe('loadAgents', () => {
    it('should reload agents manually', async () => {
      // Reset and set up specific mocks for this test
      mockFetch.mockReset()

      // Set up all expected fetch calls in sequence
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ agents: [mockAgent1] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ agents: [mockAgent1, mockAgent2] })
        })

      const { result } = renderHook(() => useAgents())

      await waitFor(() => {
        expect(result.current.agents).toHaveLength(1)
      })

      // Clear cache to allow manual reload
      clearAgentsCache()

      // Manual reload with more agents
      await act(async () => {
        await result.current.loadAgents()
      })

      expect(result.current.agents).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle empty agents response', async () => {
      // Reset mock to override the default
      mockFetch.mockReset()
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ agents: [] })
      })

      const { result } = renderHook(() => useAgents())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.agents).toEqual([])
      expect(result.current.selectedAgent).toBe(null)
    })

    it('should preserve selected agent if it exists in new data', async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ agents: [mockAgent1, mockAgent2] })
      })

      const { result } = renderHook(() => useAgents())

      await waitFor(() => {
        expect(result.current.selectedAgent).toBe(mockAgent1)
      })

      // Select second agent
      act(() => {
        result.current.selectAgent(mockAgent2)
      })

      expect(result.current.selectedAgent).toBe(mockAgent2)

      // Reload agents
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ agents: [mockAgent1, mockAgent2] })
      })

      await act(async () => {
        await result.current.loadAgents()
      })

      // Selected agent should be preserved
      expect(result.current.selectedAgent).toBe(mockAgent2) // Agent selection should be preserved
    })
  })

  describe('selectAgent', () => {
    it('should select an agent', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ agents: [mockAgent1, mockAgent2] })
      })

      const { result } = renderHook(() => useAgents())

      await waitFor(() => {
        expect(result.current.selectedAgent).toBe(mockAgent1)
      })

      act(() => {
        result.current.selectAgent(mockAgent2)
      })

      expect(result.current.selectedAgent).toBe(mockAgent2)
    })

    it('should allow deselecting agent (set to null)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ agents: [mockAgent1] })
      })

      const { result } = renderHook(() => useAgents())

      await waitFor(() => {
        expect(result.current.selectedAgent).toBe(mockAgent1)
      })

      act(() => {
        result.current.selectAgent(null)
      })

      expect(result.current.selectedAgent).toBe(null)
    })
  })

  describe('processWithAgent', () => {
    it('should successfully process content with agent', async () => {
      // Reset mock and set up implementation to handle different request types
      mockFetch.mockReset()
      mockFetch.mockImplementation((url, options) => {
        // Handle GET request (load agents)
        if (!options || options.method !== 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ agents: [mockAgent1, mockAgent2] })
          })
        }
        
        // Handle POST request (process with agent)
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            result: 'This code looks good! Well structured and follows best practices.',
            agent: 'code-reviewer'
          })
        })
      })

      const { result } = renderHook(() => useAgents())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let processResult: string
      await act(async () => {
        processResult = await result.current.processWithAgent('code-reviewer', 'function add(a, b) { return a + b; }')
      })

      expect(processResult!).toBe('This code looks good! Well structured and follows best practices.')
      expect(mockFetch).toHaveBeenLastCalledWith('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process',
          agentName: 'code-reviewer',
          transcript: 'function add(a, b) { return a + b; }'
        })
      })
    })

    it('should handle process error response', async () => {
      // Reset mock and set up implementation to handle different request types
      mockFetch.mockReset()
      mockFetch.mockImplementation((url, options) => {
        // Handle GET request (load agents)
        if (!options || options.method !== 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ agents: [mockAgent1, mockAgent2] })
          })
        }
        
        // Handle POST request (process with agent) - return error
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Agent not found' })
        })
      })

      const { result } = renderHook(() => useAgents())

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.agents).toEqual([mockAgent1, mockAgent2])
      }, { timeout: 5000 })

      await act(async () => {
        await expect(
          result.current.processWithAgent('nonexistent-agent', 'test content')
        ).rejects.toThrow('Agent not found')
      })
    })

    it('should handle network error during processing', async () => {
      // Reset mock and set up implementation to handle different request types
      mockFetch.mockReset()
      mockFetch.mockImplementation((url, options) => {
        // Handle GET request (load agents)
        if (!options || options.method !== 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ agents: [mockAgent1, mockAgent2] })
          })
        }
        
        // Handle POST request (process with agent) - throw network error
        return Promise.reject(new Error('Network failed'))
      })

      const { result } = renderHook(() => useAgents())

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.agents).toEqual([mockAgent1, mockAgent2])
      }, { timeout: 5000 })

      await act(async () => {
        await expect(
          result.current.processWithAgent('code-reviewer', 'test content')
        ).rejects.toThrow('Network failed')
      })
    })

    it('should handle malformed JSON response', async () => {
      // Reset mock and set up implementation to handle different request types
      mockFetch.mockReset()
      mockFetch.mockImplementation((url, options) => {
        // Handle GET request (load agents)
        if (!options || options.method !== 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ agents: [mockAgent1, mockAgent2] })
          })
        }
        
        // Handle POST request (process with agent) - return malformed JSON
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.reject(new Error('Invalid JSON'))
        })
      })

      const { result } = renderHook(() => useAgents())

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.agents).toEqual([mockAgent1, mockAgent2])
      }, { timeout: 5000 })

      await act(async () => {
        await expect(
          result.current.processWithAgent('code-reviewer', 'test content')
        ).rejects.toThrow('Failed to process with agent')
      })
    })

    it('should require authentication for processing', async () => {
      // Set session to null (unauthenticated)
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      })

      const { result } = renderHook(() => useAgents())

      await act(async () => {
        await expect(
          result.current.processWithAgent('code-reviewer', 'test content')
        ).rejects.toThrow('Authentication required')
      })
    })

    it('should handle empty result', async () => {
      // First, mock the initial agents load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ agents: [mockAgent1, mockAgent2] })
      })

      const { result } = renderHook(() => useAgents())

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.agents).toEqual([mockAgent1, mockAgent2])
      }, { timeout: 5000 })

      // Mock response with no result
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      let processResult: string
      await act(async () => {
        processResult = await result.current.processWithAgent('code-reviewer', 'test content')
      })

      expect(processResult!).toBe('No response received')
    })
  })

  describe('session changes', () => {
    it('should reload agents when manually called', async () => {
      // Reset and set up specific mocks for this test
      mockFetch.mockReset()

      // Set up all expected fetch calls in sequence
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ agents: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ agents: [mockAgent1, mockAgent2] })
        })

      const { result } = renderHook(() => useAgents())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.agents).toEqual([])

      // Clear cache to allow manual reload
      clearAgentsCache()

      // Manual reload
      await act(async () => {
        await result.current.loadAgents()
      })

      expect(result.current.agents).toEqual([mockAgent1, mockAgent2])
      expect(result.current.loading).toBe(false)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})