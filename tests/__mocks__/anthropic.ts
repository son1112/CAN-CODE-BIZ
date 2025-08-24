// Mock for Anthropic Claude API
export const mockAnthropicResponse = {
  content: [
    {
      type: 'text',
      text: 'This is a mock response from Claude AI for testing purposes.',
    },
  ],
  model: 'claude-3-5-sonnet-20241022',
  role: 'assistant',
  stop_reason: 'end_turn',
  stop_sequence: null,
  type: 'message',
  usage: {
    input_tokens: 10,
    output_tokens: 20,
  },
}

export const mockAnthropicStreamResponse = function* () {
  const chunks = [
    'This ',
    'is ',
    'a ',
    'mock ',
    'streaming ',
    'response ',
    'from ',
    'Claude ',
    'AI.',
  ]

  for (const chunk of chunks) {
    yield {
      type: 'content_block_delta',
      delta: {
        type: 'text_delta',
        text: chunk,
      },
    }
  }
}

export const mockAnthropic = {
  messages: {
    create: jest.fn().mockResolvedValue(mockAnthropicResponse),
    stream: jest.fn().mockReturnValue(mockAnthropicStreamResponse()),
  },
}

// Mock the entire Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => mockAnthropic)
})