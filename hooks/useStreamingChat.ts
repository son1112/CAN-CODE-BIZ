import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useAgent } from '@/contexts/AgentContext';
import { useSession } from 'next-auth/react';

interface StreamingChatHook {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  saveConversation: () => Promise<void>;
  currentConversationId: string | null;
}

export function useStreamingChat(): StreamingChatHook {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { getSystemPrompt, addContext } = useAgent();
  const { data: session } = useSession();

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
                // Auto-save conversation after each complete response
                setTimeout(() => autoSaveConversation(), 1000);
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

  const saveConversation = useCallback(async () => {
    if (!session?.user?.id || messages.length === 0) {
      console.log('Cannot save conversation: no user ID or no messages');
      return;
    }

    try {
      const conversationData = {
        userId: session.user.id,
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          audioMetadata: msg.audioMetadata,
        })),
        metadata: {
          title: messages[0]?.content?.slice(0, 50) || 'Untitled Conversation',
          tags: ['chat'],
        },
      };

      if (currentConversationId) {
        // Update existing conversation
        const response = await fetch('/api/conversations', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: currentConversationId,
            messages: conversationData.messages,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update conversation');
        }

        console.log('Conversation updated successfully');
      } else {
        // Create new conversation
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(conversationData),
        });

        if (!response.ok) {
          throw new Error('Failed to save conversation');
        }

        const savedConversation = await response.json();
        setCurrentConversationId(savedConversation._id);
        console.log('New conversation saved with ID:', savedConversation._id);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, [messages, session, currentConversationId]);

  const autoSaveConversation = useCallback(async () => {
    // Only auto-save if we have meaningful conversation (at least 1 user message and 1 assistant response)
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    if (userMessages.length >= 1 && assistantMessages.length >= 1) {
      await saveConversation();
    }
  }, [messages, saveConversation]);

  const clearMessages = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    setCurrentConversationId(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    saveConversation,
    currentConversationId,
  };
}