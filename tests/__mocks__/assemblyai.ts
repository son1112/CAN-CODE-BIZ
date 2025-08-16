// Mock for AssemblyAI Speech Recognition API
export const mockAssemblyAIResponse = {
  token: 'mock-temporary-token-for-testing',
}

export const mockRealtimeTranscriber = {
  connect: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  off: jest.fn(),
  sendAudio: jest.fn(),
}

export const mockAssemblyAI = {
  realtime: {
    createTemporaryToken: jest.fn().mockResolvedValue(mockAssemblyAIResponse),
    createTranscriber: jest.fn().mockReturnValue(mockRealtimeTranscriber),
  },
}

// Mock the entire AssemblyAI SDK
jest.mock('assemblyai', () => ({
  AssemblyAI: jest.fn().mockImplementation(() => mockAssemblyAI),
}))