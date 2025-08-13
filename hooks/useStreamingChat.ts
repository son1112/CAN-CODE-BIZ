import { useState, useCallback, useRef } from 'react';
import { Message } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useAgent } from '@/contexts/AgentContext';

interface StreamingChatHook {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useStreamingChat(): StreamingChatHook {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { getSystemPrompt, addContext } = useAgent();

  const sendMessage = useCallback(async (content: string) => {
    console.log('useStreamingChat: sendMessage called with:', content);
    console.log('useStreamingChat: isStreaming:', isStreaming);
    if (!content.trim() || isStreaming) {
      console.log('useStreamingChat: Early return - empty content or streaming');
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();
      
      // Add user message to conversation context
      addContext(`User: ${content.trim()}`);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          systemPrompt: getSystemPrompt(),
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
                
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              }

              if (data.isComplete) {
                setIsStreaming(false);
                // Add assistant response to conversation context
                if (accumulatedContent.trim()) {
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
        
        // Remove empty assistant message on error
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, isStreaming, getSystemPrompt, addContext]);

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
  };
}