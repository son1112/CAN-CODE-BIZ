import { renderHook, act } from '@testing-library/react';
import { useConversationManager } from '@/hooks/useConversationManager';

// Mock Date.now for consistent timing tests
const mockDateNow = jest.fn();
const originalDateNow = Date.now;

describe('useConversationManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set a consistent timestamp for testing
    mockDateNow.mockReturnValue(1000000);
    Date.now = mockDateNow;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useConversationManager());

      expect(result.current.isInConversation).toBe(false);
      expect(result.current.lastSpeechTime).toBe(null);
      expect(result.current.conversationPauses).toBe(0);
      expect(typeof result.current.shouldAIRespond).toBe('function');
      expect(typeof result.current.startConversation).toBe('function');
      expect(typeof result.current.endConversation).toBe('function');
    });

    it('should not respond when not in conversation', () => {
      const { result } = renderHook(() => useConversationManager());

      const shouldRespond = result.current.shouldAIRespond('Hello there!', []);
      expect(shouldRespond).toBe(false);
    });
  });

  describe('conversation lifecycle', () => {
    it('should start conversation with correct state changes', () => {
      const { result } = renderHook(() => useConversationManager());

      act(() => {
        result.current.startConversation();
      });

      expect(result.current.isInConversation).toBe(true);
      expect(result.current.lastSpeechTime).toBe(1000000);
      expect(result.current.conversationPauses).toBe(0);
    });

    it('should end conversation and reset state', () => {
      const { result } = renderHook(() => useConversationManager());

      // Start conversation first
      act(() => {
        result.current.startConversation();
      });

      expect(result.current.isInConversation).toBe(true);

      // End conversation
      act(() => {
        result.current.endConversation();
      });

      expect(result.current.isInConversation).toBe(false);
      expect(result.current.lastSpeechTime).toBe(null);
      expect(result.current.conversationPauses).toBe(0);
    });

    it('should allow multiple start/end cycles', () => {
      const { result } = renderHook(() => useConversationManager());

      // First cycle
      act(() => {
        result.current.startConversation();
      });
      expect(result.current.isInConversation).toBe(true);

      act(() => {
        result.current.endConversation();
      });
      expect(result.current.isInConversation).toBe(false);

      // Second cycle
      act(() => {
        result.current.startConversation();
      });
      expect(result.current.isInConversation).toBe(true);

      act(() => {
        result.current.endConversation();
      });
      expect(result.current.isInConversation).toBe(false);
    });
  });

  describe('shouldAIRespond - first message behavior', () => {
    it('should respond to first message in conversation', () => {
      const { result } = renderHook(() => useConversationManager());

      act(() => {
        result.current.startConversation();
      });

      const shouldRespond = result.current.shouldAIRespond('Hello there!', []);
      expect(shouldRespond).toBe(true);
    });

    it('should update lastSpeechTime when evaluating response', () => {
      const { result } = renderHook(() => useConversationManager());

      act(() => {
        result.current.startConversation();
      });

      // Change the mock time
      mockDateNow.mockReturnValue(2000000);

      let shouldRespond: boolean;
      act(() => {
        shouldRespond = result.current.shouldAIRespond('Hello there!', []);
      });

      expect(result.current.lastSpeechTime).toBe(2000000);
      expect(shouldRespond!).toBe(true);
    });
  });

  describe('shouldAIRespond - context-based responses', () => {
    const setupConversation = () => {
      const { result } = renderHook(() => useConversationManager());
      act(() => {
        result.current.startConversation();
      });
      return result;
    };

    const testShouldRespond = (result: any, transcript: string, messages: any[]) => {
      let shouldRespond: boolean;
      act(() => {
        shouldRespond = result.current.shouldAIRespond(transcript, messages);
      });
      return shouldRespond!;
    };

    it('should respond when last message was from AI', () => {
      const result = setupConversation();

      const recentMessages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there! How can I help?' }
      ];

      const shouldRespond = testShouldRespond(result, 'Thanks for asking', recentMessages);
      expect(shouldRespond).toBe(true);
    });

    it('should not necessarily respond when last message was from user', () => {
      const result = setupConversation();

      const recentMessages = [
        { role: 'assistant', content: 'How can I help?' },
        { role: 'user', content: 'Just saying hi' }
      ];

      // This will trigger other logic (greeting detection in this case)
      const shouldRespond = result.current.shouldAIRespond('Yeah', recentMessages);
      // "Yeah" should trigger the acknowledgment filter and return false
      expect(shouldRespond).toBe(false);
    });
  });

  describe('shouldAIRespond - question detection', () => {
    const setupConversation = () => {
      const { result } = renderHook(() => useConversationManager());
      act(() => {
        result.current.startConversation();
      });
      return result;
    };

    const questionExamples = [
      'What is the weather like?',
      'How do I solve this problem?',
      'Why does this happen?',
      'When should I do this?',
      'Where can I find more information?',
      'Who is responsible for this?',
      'Can you help me with this?',
      'Could you explain this concept?',
      'Would you recommend this approach?',
      'Do you think this is correct?',
      'Are you familiar with this topic?',
      'Is there a better way?',
      'Tell me about machine learning',
      'Explain how this works'
    ];

    questionExamples.forEach((question) => {
      it(`should respond to question: "${question}"`, () => {
        const result = setupConversation();

        const recentMessages = [{ role: 'user', content: 'Previous message' }];
        const shouldRespond = result.current.shouldAIRespond(question, recentMessages);
        expect(shouldRespond).toBe(true);
      });
    });

    it('should be case insensitive for question detection', () => {
      const result = setupConversation();

      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond('WHAT IS THIS?', recentMessages);
      expect(shouldRespond).toBe(true);
    });
  });

  describe('shouldAIRespond - greeting detection', () => {
    const setupConversation = () => {
      const { result } = renderHook(() => useConversationManager());
      act(() => {
        result.current.startConversation();
      });
      return result;
    };

    const greetingExamples = [
      'Hello',
      'Hi there',
      'Hey',
      'Good morning',
      'Good afternoon',
      'Good evening',
      'Let\'s start',
      'Let\'s begin'
    ];

    greetingExamples.forEach((greeting) => {
      it(`should respond to greeting: "${greeting}"`, () => {
        const result = setupConversation();

        const recentMessages = [{ role: 'user', content: 'Previous message' }];
        const shouldRespond = result.current.shouldAIRespond(greeting, recentMessages);
        expect(shouldRespond).toBe(true);
      });
    });
  });

  describe('shouldAIRespond - statement detection', () => {
    const setupConversation = () => {
      const { result } = renderHook(() => useConversationManager());
      act(() => {
        result.current.startConversation();
      });
      return result;
    };

    const statementExamples = [
      'I think this is a good idea',
      'I believe we should do this',
      'My opinion is that it works well',
      'In my view, this is correct',
      'I feel like this is wrong',
      'I want to learn more about this',
      'I need help with this task',
      'Let\'s work on this together',
      'We should consider this option'
    ];

    statementExamples.forEach((statement) => {
      it(`should respond to statement: "${statement}"`, () => {
        const result = setupConversation();

        const recentMessages = [{ role: 'user', content: 'Previous message' }];
        const shouldRespond = result.current.shouldAIRespond(statement, recentMessages);
        expect(shouldRespond).toBe(true);
      });
    });
  });

  describe('shouldAIRespond - AI mention detection', () => {
    const setupConversation = () => {
      const { result } = renderHook(() => useConversationManager());
      act(() => {
        result.current.startConversation();
      });
      return result;
    };

    const aiMentionExamples = [
      'What does the agent think?',
      'Can the assistant help?',
      'I need help with this',
      'Give me some advice',
      'What do you recommend?',
      'Can you suggest something?',
      'What\'s your opinion on this?'
    ];

    aiMentionExamples.forEach((mention) => {
      it(`should respond to AI mention: "${mention}"`, () => {
        const result = setupConversation();

        const recentMessages = [{ role: 'user', content: 'Previous message' }];
        const shouldRespond = result.current.shouldAIRespond(mention, recentMessages);
        expect(shouldRespond).toBe(true);
      });
    });
  });

  describe('shouldAIRespond - substantial message detection', () => {
    const setupConversation = () => {
      const { result } = renderHook(() => useConversationManager());
      act(() => {
        result.current.startConversation();
      });
      return result;
    };

    it('should respond to substantial messages (more than 3 words)', () => {
      const result = setupConversation();

      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond(
        'This is a longer message that contains more than three words',
        recentMessages
      );
      expect(shouldRespond).toBe(true);
    });

    it('should not always respond to short messages', () => {
      const result = setupConversation();

      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond('Short', recentMessages);
      // Short messages that don't match other patterns default to responding
      expect(shouldRespond).toBe(true);
    });
  });

  describe('shouldAIRespond - acknowledgment filtering', () => {
    const setupConversation = () => {
      const { result } = renderHook(() => useConversationManager());
      act(() => {
        result.current.startConversation();
      });
      return result;
    };

    const acknowledgmentExamples = [
      'yeah',
      'yes',
      'ok',
      'okay',
      'sure',
      'right',
      'exactly',
      'true',
      'no',
      'nope',
      'yeah.',
      'OK.',
      'Sure!'
    ];

    acknowledgmentExamples.forEach((ack) => {
      it(`should not respond to acknowledgment: "${ack}"`, () => {
        const result = setupConversation();

        const recentMessages = [{ role: 'user', content: 'Previous message' }];
        const shouldRespond = result.current.shouldAIRespond(ack, recentMessages);
        expect(shouldRespond).toBe(false);
      });
    });

    it('should be case insensitive for acknowledgments', () => {
      const result = setupConversation();

      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond('YEAH', recentMessages);
      expect(shouldRespond).toBe(false);
    });

    it('should handle acknowledgments with punctuation', () => {
      const result = setupConversation();

      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond('okay.', recentMessages);
      expect(shouldRespond).toBe(false);
    });
  });

  describe('shouldAIRespond - default behavior', () => {
    const setupConversation = () => {
      const { result } = renderHook(() => useConversationManager());
      act(() => {
        result.current.startConversation();
      });
      return result;
    };

    it('should default to responding for unmatched patterns', () => {
      const result = setupConversation();

      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond('Random statement here', recentMessages);
      expect(shouldRespond).toBe(true);
    });

    it('should handle empty messages', () => {
      const result = setupConversation();

      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond('', recentMessages);
      expect(shouldRespond).toBe(true); // Empty string defaults to responding
    });

    it('should handle messages with only whitespace', () => {
      const result = setupConversation();

      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond('   ', recentMessages);
      expect(shouldRespond).toBe(true); // Whitespace defaults to responding
    });
  });

  describe('shouldAIRespond - complex scenarios', () => {
    const setupConversation = () => {
      const { result } = renderHook(() => useConversationManager());
      act(() => {
        result.current.startConversation();
      });
      return result;
    };

    it('should handle mixed case and special characters', () => {
      const result = setupConversation();

      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond('What\'s YOUR opinion?!', recentMessages);
      expect(shouldRespond).toBe(true);
    });

    it('should prioritize specific patterns over default behavior', () => {
      const result = setupConversation();

      // Test that acknowledgment pattern overrides default response
      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond('yes', recentMessages);
      expect(shouldRespond).toBe(false); // Acknowledgment should override default
    });

    it('should handle long conversation history', () => {
      const result = setupConversation();

      const recentMessages = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i + 1}`
      }));

      const shouldRespond = result.current.shouldAIRespond('What do you think?', recentMessages);
      expect(shouldRespond).toBe(true);
    });

    it('should work with undefined or null recentMessages', () => {
      const result = setupConversation();

      // Test with undefined (should default to empty array)
      const shouldRespond1 = result.current.shouldAIRespond('Hello', undefined as any);
      expect(shouldRespond1).toBe(true); // First message behavior

      // Test with null
      const shouldRespond2 = result.current.shouldAIRespond('Hello', null as any);
      expect(shouldRespond2).toBe(true); // First message behavior
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very long transcripts', () => {
      const { result } = renderHook(() => useConversationManager());

      act(() => {
        result.current.startConversation();
      });

      const longTranscript = 'word '.repeat(1000); // 1000 words
      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond(longTranscript, recentMessages);
      expect(shouldRespond).toBe(true); // Should be treated as substantial
    });

    it('should handle special characters and Unicode', () => {
      const { result } = renderHook(() => useConversationManager());

      act(() => {
        result.current.startConversation();
      });

      const unicodeMessage = '你好, what do you think? 🤔';
      const recentMessages = [{ role: 'user', content: 'Previous message' }];
      const shouldRespond = result.current.shouldAIRespond(unicodeMessage, recentMessages);
      expect(shouldRespond).toBe(true); // Contains "what" - question pattern
    });

    it('should maintain state consistency during rapid calls', () => {
      const { result } = renderHook(() => useConversationManager());

      act(() => {
        result.current.startConversation();
      });

      // Simulate rapid calls with different timestamps
      mockDateNow.mockReturnValueOnce(1000000);
      act(() => {
        result.current.shouldAIRespond('First message', []);
      });

      mockDateNow.mockReturnValueOnce(1001000);
      act(() => {
        result.current.shouldAIRespond('Second message', []);
      });

      expect(result.current.lastSpeechTime).toBe(1001000);
      expect(result.current.isInConversation).toBe(true);
    });
  });
});