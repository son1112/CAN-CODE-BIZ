import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useAgent } from '@/contexts/AgentContext';
import { useSession as useAuthSession } from 'next-auth/react';
import { useSession } from '@/contexts/SessionContext';
import { useModel } from '@/contexts/ModelContext';
import { selectOptimalContext, getAdaptiveConfig, getContextStats } from '@/lib/context-manager';

interface StreamingChatHook {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  fallbackMessage: string | null;
  failedMessages: Set<string>;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  clearMessages: () => void;
  resetStreamingState: () => void;
}

export function useStreamingChat(): StreamingChatHook {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { getSystemPrompt, addContext, currentAgent, currentPowerAgent, getEffectiveModel } = useAgent();
  const { data: authSession } = useAuthSession();
  const { messages, addMessage, currentSession } = useSession();
  const { getEffectiveModel: getSessionModel } = useModel();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) {
      return;
    }

    setIsStreaming(true);
    setError(null);
    setFallbackMessage(null);
    
    // Set timeout to auto-clear streaming state if it gets stuck (30 seconds)
    streamingTimeoutRef.current = setTimeout(() => {
      console.warn('useStreamingChat: Streaming timeout reached, auto-clearing state');
      setIsStreaming(false);
      setError('Response timeout - please try again');
    }, 30000);

    let currentUserMessageId: string | null = null;

    try {
      // Add user message to session
      const agentId = currentPowerAgent ? `power-agent:${currentPowerAgent.name}` : currentAgent.id;
      const userMessageAdded = await addMessage({
        role: 'user',
        content: content.trim(),
        agentUsed: agentId
      });

      if (!userMessageAdded) {
        throw new Error('Failed to add user message to session');
      }

      // Find the user message that was just added
      const recentUserMessages = messages.filter(msg =>
        msg.role === 'user' && msg.content === content.trim()
      );
      if (recentUserMessages.length > 0) {
        currentUserMessageId = recentUserMessages[recentUserMessages.length - 1].id;
      }

      // Add user message to conversation context
      addContext(`User: ${content.trim()}`);

      abortControllerRef.current = new AbortController();

      // Smart context management - select optimal messages for better performance
      const adaptiveConfig = getAdaptiveConfig(messages);
      const contextResult = selectOptimalContext(messages, adaptiveConfig);

      // Add the current user message to the optimized context
      const messagesForAPI = [
        ...contextResult.messages,
        {
          role: 'user' as const,
          content: content.trim()
        }
      ];


      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForAPI,
          systemPrompt: getSystemPrompt(content.trim()),
          model: getSessionModel(currentAgent || undefined, currentPowerAgent || undefined),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              

              if (data.content) {
                accumulatedContent += data.content;
              }

              // Handle fallback notification
              if (data.fallbackMessage) {
                setFallbackMessage(data.fallbackMessage);
                // Auto-clear fallback message after 5 seconds
                setTimeout(() => setFallbackMessage(null), 5000);
              }

              if (data.isComplete) {
                // Clear timeout since streaming completed successfully
                if (streamingTimeoutRef.current) {
                  clearTimeout(streamingTimeoutRef.current);
                  streamingTimeoutRef.current = null;
                }
                setIsStreaming(false);

                // Add assistant response to session
                if (accumulatedContent.trim()) {
                  const agentId = currentPowerAgent ? `power-agent:${currentPowerAgent.name}` : currentAgent.id;
                  await addMessage({
                    role: 'assistant',
                    content: accumulatedContent.trim(),
                    agentUsed: agentId
                  });

                  // Add assistant response to conversation context
                  addContext(`Assistant: ${accumulatedContent.trim()}`);
                }
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error:', err);
        setError(err.message || 'Failed to send message');

        // Mark the most recent user message as failed
        const recentUserMessages = messages.filter(msg => msg.role === 'user');
        if (recentUserMessages.length > 0) {
          const lastUserMessage = recentUserMessages[recentUserMessages.length - 1];
          setFailedMessages(prev => new Set([...prev, lastUserMessage.id]));
        }
      }
    } finally {
      // Clear timeout in case of any errors
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, isStreaming, getSystemPrompt, addContext, addMessage, currentAgent, currentPowerAgent]);

  const retryMessage = useCallback(async (messageId: string) => {
    // Find the failed message
    const failedMessage = messages.find(msg => msg.id === messageId);
    if (!failedMessage || failedMessage.role !== 'user') {
      console.error('Could not find failed user message to retry');
      return;
    }

    // Remove from failed messages set
    setFailedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });

    // Resend the message
    await sendMessage(failedMessage.content);
  }, [messages, sendMessage]);

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setError(null);
    setFallbackMessage(null);
    setFailedMessages(new Set());
    setIsStreaming(false);
    // Note: Session clearing will be handled by the ChatInterface
    // when it calls clearContext() and potentially creates a new session
  }, []);

  // Emergency reset function for stuck streaming state
  const resetStreamingState = useCallback(() => {
    // Clear timeout if active
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
      streamingTimeoutRef.current = null;
    }
    setIsStreaming(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    messages,
    isStreaming,
    error,
    fallbackMessage,
    failedMessages,
    sendMessage,
    retryMessage,
    clearMessages,
    resetStreamingState,
  };
}