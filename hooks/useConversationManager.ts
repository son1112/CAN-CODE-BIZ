import { useState, useCallback, useRef } from 'react';

interface ConversationManagerHook {
  shouldAIRespond: (transcript: string, recentMessages: any[]) => boolean;
  isInConversation: boolean;
  startConversation: () => void;
  endConversation: () => void;
  lastSpeechTime: number | null;
  conversationPauses: number;
}

export function useConversationManager(): ConversationManagerHook {
  const [isInConversation, setIsInConversation] = useState(false);
  const [lastSpeechTime, setLastSpeechTime] = useState<number | null>(null);
  const [conversationPauses, setConversationPauses] = useState(0);
  const lastUserMessageRef = useRef<string>('');

  const shouldAIRespond = useCallback((transcript: string, recentMessages: any[] = []) => {
    if (!isInConversation) return false;

    const now = Date.now();
    setLastSpeechTime(now);

    // Store current transcript for future reference
    lastUserMessageRef.current = transcript;

    // Always respond if this is the first message
    if (recentMessages.length === 0) {
      console.log('ConversationManager: First message - AI should respond');
      return true;
    }

    // Get the last few messages to understand context
    const lastMessage = recentMessages[recentMessages.length - 1];
    const isLastFromAI = lastMessage?.role === 'assistant';

    // If the last message was from AI, then human is responding - AI should respond back
    if (isLastFromAI) {
      console.log('ConversationManager: User responding to AI - AI should respond');
      return true;
    }

    // Check if user is asking a direct question
    const isQuestion = /\?|what|how|why|when|where|who|can you|could you|would you|do you|are you|is there|tell me|explain/i.test(transcript);
    if (isQuestion) {
      console.log('ConversationManager: Question detected - AI should respond');
      return true;
    }

    // Check if user is giving a greeting or conversation starter
    const isGreeting = /hello|hi|hey|good morning|good afternoon|good evening|start|begin/i.test(transcript);
    if (isGreeting) {
      console.log('ConversationManager: Greeting detected - AI should respond');
      return true;
    }

    // Check if user is making a statement that warrants a response
    const isStatement = /i think|i believe|my opinion|in my view|i feel|i want|i need|let's|we should/i.test(transcript);
    if (isStatement) {
      console.log('ConversationManager: Statement that needs response - AI should respond');
      return true;
    }

    // Check if user mentions the AI agent or asks for advice/help
    const mentionsAI = /agent|assistant|help|advice|recommend|suggest|opinion/i.test(transcript);
    if (mentionsAI) {
      console.log('ConversationManager: AI mentioned - AI should respond');
      return true;
    }

    // If transcript is substantial (more than just "yeah", "ok", etc.), respond
    const substantialResponse = transcript.trim().split(/\s+/).length > 3;
    if (substantialResponse) {
      console.log('ConversationManager: Substantial message - AI should respond');
      return true;
    }

    // For short acknowledgments, don't always respond to avoid being too chatty
    const acknowledgments = /^(yeah|yes|ok|okay|sure|right|exactly|true|no|nope)\.?$/i;
    if (acknowledgments.test(transcript.trim())) {
      console.log('ConversationManager: Short acknowledgment - AI should not respond');
      return false;
    }

    // Default to responding for most other cases
    console.log('ConversationManager: Default response behavior - AI should respond');
    return true;
  }, [isInConversation]);

  const startConversation = useCallback(() => {
    console.log('ConversationManager: Starting conversation');
    setIsInConversation(true);
    setLastSpeechTime(Date.now());
    setConversationPauses(0);
    lastUserMessageRef.current = '';
  }, []);

  const endConversation = useCallback(() => {
    console.log('ConversationManager: Ending conversation');
    setIsInConversation(false);
    setLastSpeechTime(null);
    setConversationPauses(0);
    lastUserMessageRef.current = '';
  }, []);

  return {
    shouldAIRespond,
    isInConversation,
    startConversation,
    endConversation,
    lastSpeechTime,
    conversationPauses,
  };
}