import { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

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

    // Always respond if this is the first message or no messages provided
    if (!recentMessages || recentMessages.length === 0) {
      logger.debug('First message detected', { component: 'ConversationManager' });
      return true;
    }

    // Get the last few messages to understand context
    const lastMessage = recentMessages[recentMessages.length - 1];
    const isLastFromAI = lastMessage?.role === 'assistant';

    // If the last message was from AI, then human is responding - AI should respond back
    if (isLastFromAI) {
      logger.debug('User responding to AI', { component: 'ConversationManager' });
      return true;
    }

    // Check if user is asking a direct question
    const isQuestion = /\?|what|how|why|when|where|who|can you|could you|would you|do you|are you|is there|tell me|explain/i.test(transcript);
    if (isQuestion) {
      logger.debug('Question detected', { component: 'ConversationManager' });
      return true;
    }

    // Check if user is giving a greeting or conversation starter
    const isGreeting = /hello|hi|hey|good morning|good afternoon|good evening|start|begin/i.test(transcript);
    if (isGreeting) {
      logger.debug('Greeting detected', { component: 'ConversationManager' });
      return true;
    }

    // Check if user is making a statement that warrants a response
    const isStatement = /i think|i believe|my opinion|in my view|i feel|i want|i need|let's|we should/i.test(transcript);
    if (isStatement) {
      logger.debug('Statement requiring response detected', { component: 'ConversationManager' });
      return true;
    }

    // Check if user mentions the AI agent or asks for advice/help
    const mentionsAI = /agent|assistant|help|advice|recommend|suggest|opinion/i.test(transcript);
    if (mentionsAI) {
      logger.debug('AI mention detected', { component: 'ConversationManager' });
      return true;
    }

    // If transcript is substantial (more than just "yeah", "ok", etc.), respond
    const substantialResponse = transcript.trim().split(/\s+/).length > 3;
    if (substantialResponse) {
      logger.debug('Substantial message detected', { component: 'ConversationManager', wordCount: transcript.trim().split(/\s+/).length });
      return true;
    }

    // For short acknowledgments, don't always respond to avoid being too chatty
    const acknowledgments = /^(yeah|yes|ok|okay|sure|right|exactly|true|no|nope)[.!]?$/i;
    if (acknowledgments.test(transcript.trim())) {
      logger.debug('Short acknowledgment detected', { component: 'ConversationManager' });
      return false;
    }

    // Default to responding for most other cases
    logger.debug('Using default response behavior', { component: 'ConversationManager' });
    return true;
  }, [isInConversation]);

  const startConversation = useCallback(() => {
    logger.info('Starting conversation', { component: 'ConversationManager' });
    setIsInConversation(true);
    setLastSpeechTime(Date.now());
    setConversationPauses(0);
    lastUserMessageRef.current = '';
  }, []);

  const endConversation = useCallback(() => {
    logger.info('Ending conversation', { component: 'ConversationManager' });
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