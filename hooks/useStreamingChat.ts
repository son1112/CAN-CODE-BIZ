import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useAgent } from '@/contexts/AgentContext';
import { useSession as useAuthSession } from 'next-auth/react';
import { useSession } from '@/contexts/SessionContext';
import { useModel } from '@/contexts/ModelContext';

interface StreamingChatHook {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useStreamingChat(): StreamingChatHook {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { getSystemPrompt, addContext, currentAgent, currentPowerAgent, getEffectiveModel } = useAgent();
  const { data: authSession } = useAuthSession();
  const { messages, addMessage, currentSession } = useSession();
  const { getEffectiveModel: getSessionModel } = useModel();

  const sendMessage = useCallback(async (content: string) => {
    console.log('useStreamingChat: sendMessage called with:', content);
    console.log('useStreamingChat: isStreaming:', isStreaming);
    if (!content.trim() || isStreaming) {
      console.log('useStreamingChat: Early return - empty content or streaming');
      return;
    }

    setIsStreaming(true);
    setError(null);

    try {
      // Add user message to session
      const userMessageAdded = await addMessage({
        role: 'user',
        content: content.trim(),
        agentUsed: currentAgent.id
      });

      if (!userMessageAdded) {
        throw new Error('Failed to add user message to session');
      }

      // Add user message to conversation context
      addContext(`User: ${content.trim()}`);

      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })).concat([{
            role: 'user',
            content: content.trim()
          }]),
          systemPrompt: getSystemPrompt(content.trim()),
          model: getSessionModel(currentAgent, currentPowerAgent),
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

              if (data.isComplete) {
                setIsStreaming(false);
                
                // Add assistant response to session
                if (accumulatedContent.trim()) {
                  await addMessage({
                    role: 'assistant',
                    content: accumulatedContent.trim(),
                    agentUsed: currentAgent.id
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
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, isStreaming, getSystemPrompt, addContext, addMessage, currentAgent]);

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setError(null);
    setIsStreaming(false);
    // Note: Session clearing will be handled by the ChatInterface
    // when it calls clearContext() and potentially creates a new session
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
  };
}