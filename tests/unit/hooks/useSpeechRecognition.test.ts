import { renderHook, act, waitFor } from '@testing-library/react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'

// Mock browser APIs
const mockMediaDevices = {
  getUserMedia: jest.fn()
}

const mockMediaStream = {
  getTracks: jest.fn(() => [
    { stop: jest.fn() }
  ])
}

const mockAudioContext = {
  createMediaStreamSource: jest.fn(),
  createScriptProcessor: jest.fn(),
  close: jest.fn(),
  sampleRate: 16000
}

const mockSource = {
  connect: jest.fn()
}

const mockProcessor = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  onaudioprocess: null
}

const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  state: 'inactive'
}

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3

  readyState = MockWebSocket.OPEN
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null

  constructor(public url: string) {}

  send = jest.fn()
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure' } as CloseEvent)
    }
  })

  // Helper methods for testing
  simulateOpen() {
    if (this.onopen) this.onopen({} as Event)
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent)
    }
  }

  simulateError() {
    if (this.onerror) this.onerror({} as Event)
  }

  simulateClose(code = 1000, reason = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED
    if (this.onclose) {
      this.onclose({ code, reason } as CloseEvent)
    }
  }
}

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useSpeechRecognition', () => {
  let mockWs: MockWebSocket

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup browser API mocks
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: mockMediaDevices,
      writable: true
    })

    mockMediaDevices.getUserMedia.mockResolvedValue(mockMediaStream)

    // Mock AudioContext
    global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext)
    mockAudioContext.createMediaStreamSource.mockReturnValue(mockSource)
    mockAudioContext.createScriptProcessor.mockReturnValue(mockProcessor)

    // Mock MediaRecorder
    global.MediaRecorder = jest.fn().mockImplementation(() => mockMediaRecorder)

    // Mock WebSocket
    global.WebSocket = jest.fn().mockImplementation((url) => {
      mockWs = new MockWebSocket(url)
      return mockWs
    })

    // Mock window APIs
    Object.defineProperty(window, 'MediaRecorder', { value: global.MediaRecorder })
    Object.defineProperty(window, 'WebSocket', { value: global.WebSocket })

    // Mock API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ apiKey: 'test-api-key-123' })
    })

    // Clear timers
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useSpeechRecognition())

      expect(result.current.transcript).toBe('')
      expect(result.current.interimTranscript).toBe('')
      expect(result.current.isListening).toBe(false)
      expect(result.current.isSupported).toBe(true) // In our test environment
      expect(result.current.error).toBe(null)
      expect(result.current.isInContinuousMode).toBe(false)
      expect(result.current.autoSendCountdown).toBe(null)
      expect(result.current.autoSendReason).toBe(null)
      expect(result.current.isMuted).toBe(false)
    })

    it('should detect browser support correctly', () => {
      const { result } = renderHook(() => useSpeechRecognition())
      expect(result.current.isSupported).toBe(true)
    })

    it('should detect lack of browser support', () => {
      // Remove required APIs
      delete (window as any).MediaRecorder
      delete (window as any).WebSocket

      const { result } = renderHook(() => useSpeechRecognition())
      expect(result.current.isSupported).toBe(false)
    })
  })

  describe('startListening', () => {
    it('should successfully start listening', async () => {
      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startListening()
      })

      expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/speech-token', {
        method: 'POST',
      })

      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('wss://streaming.assemblyai.com/v3/ws')
      )

      // Simulate WebSocket open
      act(() => {
        mockWs.simulateOpen()
      })

      expect(result.current.isListening).toBe(true)
      expect(result.current.error).toBe(null)
    })

    it('should handle microphone access denied', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValue(
        Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' })
      )

      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startListening()
      })

      expect(result.current.error).toBe('Microphone access denied. Please allow microphone permissions.')
      expect(result.current.isListening).toBe(false)
    })

    it('should handle no microphone found', async () => {
      mockMediaDevices.getUserMedia.mockRejectedValue(
        Object.assign(new Error('No microphone'), { name: 'NotFoundError' })
      )

      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startListening()
      })

      expect(result.current.error).toBe('No microphone found. Please connect a microphone.')
      expect(result.current.isListening).toBe(false)
    })

    it('should handle API key fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'API key error' })
      })

      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startListening()
      })

      expect(result.current.error).toBe('Failed to start speech recognition.')
      expect(result.current.isListening).toBe(false)
    })

    it('should not start if already listening', async () => {
      const { result } = renderHook(() => useSpeechRecognition())

      // First start
      await act(async () => {
        await result.current.startListening()
      })

      act(() => {
        mockWs.simulateOpen()
      })

      expect(result.current.isListening).toBe(true)

      const firstCallCount = mockMediaDevices.getUserMedia.mock.calls.length

      // Try to start again
      await act(async () => {
        await result.current.startListening()
      })

      // Should not call getUserMedia again
      expect(mockMediaDevices.getUserMedia.mock.calls.length).toBe(firstCallCount)
    })
  })

  describe('WebSocket message handling', () => {
    let hookResult: any

    beforeEach(async () => {
      const { result } = renderHook(() => useSpeechRecognition())
      hookResult = result

      await act(async () => {
        await result.current.startListening()
      })

      act(() => {
        mockWs.simulateOpen()
      })
    })

    it('should handle Begin message', () => {
      act(() => {
        mockWs.simulateMessage({
          type: 'Begin',
          id: 'session-123'
        })
      })

      // Should not cause any errors
      expect(hookResult.current.error).toBe(null)
    })

    it('should handle partial transcript', () => {
      act(() => {
        mockWs.simulateMessage({
          transcript: 'Hello world',
          end_of_turn: false
        })
      })

      expect(hookResult.current.interimTranscript).toBe('Hello world')
      expect(hookResult.current.transcript).toBe('')
    })

    it('should handle final transcript', () => {
      act(() => {
        mockWs.simulateMessage({
          transcript: 'Hello world',
          end_of_turn: true
        })
      })

      expect(hookResult.current.transcript).toBe('Hello world ')
      expect(hookResult.current.interimTranscript).toBe('')
    })

    it('should handle error messages', async () => {
      expect(hookResult.current.isListening).toBe(true) // Should be listening initially

      act(() => {
        mockWs.simulateMessage({
          type: 'Error',
          error: 'Connection failed'
        })
      })

      await waitFor(() => {
        expect(hookResult.current.error).toBe('Speech recognition error: Connection failed')
      })

      await waitFor(() => {
        expect(hookResult.current.isListening).toBe(false)
      })
    })

    it('should handle malformed JSON gracefully', () => {
      // Simulate malformed JSON by calling onmessage directly with bad data
      act(() => {
        if (mockWs.onmessage) {
          mockWs.onmessage({ data: 'invalid json' } as MessageEvent)
        }
      })

      // Should not crash or set error
      expect(hookResult.current.error).toBe(null)
    })
  })

  describe('stopListening', () => {
    it('should stop listening and cleanup resources', async () => {
      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startListening()
      })

      act(() => {
        mockWs.simulateOpen()
      })

      expect(result.current.isListening).toBe(true)

      act(() => {
        result.current.stopListening()
      })

      expect(result.current.isListening).toBe(false)
      expect(mockWs.close).toHaveBeenCalled()
    })

    it('should not error if called when not listening', () => {
      const { result } = renderHook(() => useSpeechRecognition())

      act(() => {
        result.current.stopListening()
      })

      expect(result.current.isListening).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  describe('transcript management', () => {
    it('should reset transcript', () => {
      const { result } = renderHook(() => useSpeechRecognition())

      // Manually set some transcript
      act(() => {
        result.current.resetTranscript()
      })

      expect(result.current.transcript).toBe('')
      expect(result.current.interimTranscript).toBe('')
    })

    it('should send current transcript via callback', async () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition())

      act(() => {
        result.current.setAutoSend(mockCallback)
      })

      // Start listening to set up WebSocket
      await act(async () => {
        await result.current.startListening()
      })

      act(() => {
        mockWs.simulateOpen()
      })

      // Simulate some transcript content
      act(() => {
        mockWs.simulateMessage({
          transcript: 'Test message',
          end_of_turn: true
        })
      })

      act(() => {
        result.current.sendCurrentTranscript()
      })

      expect(mockCallback).toHaveBeenCalledWith('Test message')
      expect(result.current.transcript).toBe('')
    })
  })

  describe('continuous mode', () => {
    it('should start continuous mode', async () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startContinuousMode(mockCallback)
      })

      act(() => {
        mockWs.simulateOpen()
      })

      expect(result.current.isInContinuousMode).toBe(true)
      expect(result.current.isListening).toBe(true)
    })

    it('should stop continuous mode', async () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startContinuousMode(mockCallback)
      })

      act(() => {
        mockWs.simulateOpen()
      })

      expect(result.current.isInContinuousMode).toBe(true)

      act(() => {
        result.current.stopContinuousMode()
      })

      expect(result.current.isInContinuousMode).toBe(false)
      expect(result.current.isListening).toBe(false)
    })

    it('should auto-send on substantial content', async () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startContinuousMode(mockCallback)
      })

      act(() => {
        mockWs.simulateOpen()
      })

      // Simulate substantial content that should auto-send
      act(() => {
        mockWs.simulateMessage({
          transcript: 'This is a very substantial message with more than fifteen words that should trigger an automatic send.',
          end_of_turn: true
        })
      })

      // Run timers to trigger auto-send
      act(() => {
        jest.runAllTimers()
      })

      expect(mockCallback).toHaveBeenCalled()
    })

    it('should auto-send on questions', async () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startContinuousMode(mockCallback)
      })

      act(() => {
        mockWs.simulateOpen()
      })

      // Simulate a question (needs to be longer to meet auto-send criteria)
      act(() => {
        mockWs.simulateMessage({
          transcript: 'How are you doing today and what are your thoughts?',
          end_of_turn: true
        })
      })

      // Should auto-send immediately for questions
      act(() => {
        jest.runAllTimers()
      })

      expect(mockCallback).toHaveBeenCalled()
    })

    it('should not auto-send incomplete fragments', async () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startContinuousMode(mockCallback)
      })

      act(() => {
        mockWs.simulateOpen()
      })

      // Simulate incomplete content
      act(() => {
        mockWs.simulateMessage({
          transcript: 'I am',
          end_of_turn: true
        })
      })

      act(() => {
        jest.runAllTimers()
      })

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should handle countdown timer', async () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startContinuousMode(mockCallback)
      })

      act(() => {
        mockWs.simulateOpen()
      })

      // Simulate content that should trigger countdown (8-14 words, no natural ending, not incomplete)
      act(() => {
        mockWs.simulateMessage({
          transcript: 'I would like to discuss the project details concerning everyone',
          end_of_turn: true
        })
      })

      // Check countdown is active
      expect(result.current.autoSendCountdown).not.toBe(null)
      expect(result.current.autoSendReason).toBe('silence detected')

      // Fast-forward countdown
      act(() => {
        jest.advanceTimersByTime(6000) // Advance past the 5 second threshold
      })

      expect(mockCallback).toHaveBeenCalled()
      expect(result.current.autoSendCountdown).toBe(null)
    })
  })

  describe('mute functionality', () => {
    it('should toggle mute state', () => {
      const { result } = renderHook(() => useSpeechRecognition())

      expect(result.current.isMuted).toBe(false)

      act(() => {
        result.current.toggleMute()
      })

      expect(result.current.isMuted).toBe(true)

      act(() => {
        result.current.toggleMute()
      })

      expect(result.current.isMuted).toBe(false)
    })

    it('should set mute state directly', () => {
      const { result } = renderHook(() => useSpeechRecognition())

      act(() => {
        result.current.setMuted(true)
      })

      expect(result.current.isMuted).toBe(true)

      act(() => {
        result.current.setMuted(false)
      })

      expect(result.current.isMuted).toBe(false)
    })

    it('should trigger auto-send when muting with content', async () => {
      const mockCallback = jest.fn()
      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startContinuousMode(mockCallback)
      })

      act(() => {
        mockWs.simulateOpen()
      })

      // Add some transcript content that meets auto-send criteria
      act(() => {
        mockWs.simulateMessage({
          transcript: 'This is a substantial message with more than fifteen words that should definitely be sent when muted because it meets all criteria',
          end_of_turn: true
        })
      })

      // Mute should trigger auto-send
      act(() => {
        result.current.toggleMute()
      })

      act(() => {
        jest.advanceTimersByTime(100) // Small advance to trigger the setTimeout
      })

      expect(result.current.isMuted).toBe(true)
      expect(mockCallback).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle WebSocket errors', async () => {
      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startListening()
      })

      act(() => {
        mockWs.simulateError()
      })

      expect(result.current.error).toBe('Speech recognition connection error. Please try again.')
      expect(result.current.isListening).toBe(false)
    })

    it('should handle different WebSocket close codes', async () => {
      const { result } = renderHook(() => useSpeechRecognition())

      // Test invalid API key error
      await act(async () => {
        await result.current.startListening()
      })

      act(() => {
        mockWs.simulateClose(4001, 'Invalid API key')
      })

      expect(result.current.error).toBe('Invalid AssemblyAI API key. Please check your configuration.')

      // Test quota exceeded error - reset error first
      act(() => {
        result.current.stopListening()
      })

      await act(async () => {
        await result.current.startListening()
      })

      act(() => {
        mockWs.simulateClose(4002, 'Quota exceeded')
      })

      expect(result.current.error).toBe('AssemblyAI quota exceeded. Please check your account.')

      // Test invalid audio data error
      act(() => {
        result.current.stopListening()
      })

      await act(async () => {
        await result.current.startListening()
      })

      act(() => {
        mockWs.simulateClose(3005, 'Invalid audio data')
      })

      expect(result.current.error).toBe('Invalid audio data sent to AssemblyAI. Microphone may have issues.')

      // Test session timeout
      act(() => {
        result.current.stopListening()
      })

      await act(async () => {
        await result.current.startListening()
      })

      act(() => {
        mockWs.simulateClose(4008, 'Session timeout')
      })

      expect(result.current.error).toBe('AssemblyAI session timeout. Please try again.')
    })
  })

  describe('cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startListening()
      })

      act(() => {
        mockWs.simulateOpen()
      })

      expect(result.current.isListening).toBe(true)

      unmount()

      expect(mockWs.close).toHaveBeenCalled()
    })

    it('should cleanup audio resources properly', async () => {
      const { result } = renderHook(() => useSpeechRecognition())

      await act(async () => {
        await result.current.startListening()
      })

      act(() => {
        mockWs.simulateOpen()
      })

      act(() => {
        result.current.stopListening()
      })

      expect(mockAudioContext.close).toHaveBeenCalled()
      expect(mockProcessor.disconnect).toHaveBeenCalled()
    })
  })
})