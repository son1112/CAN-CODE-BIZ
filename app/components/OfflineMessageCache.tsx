'use client';

import { useEffect, useCallback, useState } from 'react';
import { useOfflineMessaging } from '@/hooks/useOfflineMode';
import { useSession } from '@/contexts/SessionContext';
import type { Message } from '@/types';

interface OfflineMessageCacheProps {
  sessionId: string;
  onCachedMessagesLoaded?: (messages: Message[]) => void;
  onOfflineMessageSent?: (messageId: string, queued: boolean) => void;
}

export default function OfflineMessageCache({
  sessionId,
  onCachedMessagesLoaded,
  onOfflineMessageSent
}: OfflineMessageCacheProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { currentSession } = useSession();

  const {
    isOnline,
    isInitialized: offlineInitialized,
    getCachedMessages,
    cacheMessage,
    sendMessage
  } = useOfflineMessaging();

  // Load cached messages when component mounts or session changes
  useEffect(() => {
    if (!offlineInitialized || !sessionId || isInitialized) return;

    loadCachedMessages();
    setIsInitialized(true);
  }, [sessionId, offlineInitialized, isInitialized]);

  // Cache new messages when they're received
  useEffect(() => {
    if (!currentSession || !currentSession.messages) return;

    // Cache each message individually
    currentSession.messages.forEach(async (message) => {
      if (message.id) {
        await cacheMessage(message, sessionId);
      }
    });
  }, [currentSession?.messages, sessionId, cacheMessage]);

  const loadCachedMessages = useCallback(async () => {
    try {
      const cachedMessages = await getCachedMessages(sessionId);

      if (cachedMessages.length > 0) {
        // Filter out sync status properties for the main app
        const cleanMessages: Message[] = cachedMessages.map(({ cached, syncStatus, cacheTime, retryCount, ...message }) => message);
        onCachedMessagesLoaded?.(cleanMessages);
      }
    } catch (error) {
      console.error('Failed to load cached messages:', error);
    }
  }, [sessionId, getCachedMessages, onCachedMessagesLoaded]);

  // Offline message sending wrapper
  const handleOfflineMessageSend = useCallback(async (
    content: string,
    options: { agentId?: string; model?: string } = {}
  ): Promise<{ success: boolean; messageId?: string; queued?: boolean }> => {
    try {
      const result = await sendMessage(content, sessionId, options);

      if (result.success && result.messageId) {
        onOfflineMessageSent?.(result.messageId, result.queued || false);
      }

      return result;
    } catch (error) {
      console.error('Failed to send offline message:', error);
      return { success: false };
    }
  }, [sessionId, sendMessage, onOfflineMessageSent]);

  // Expose the offline message sending function to parent components
  // This component acts as a bridge between the offline system and the UI
  return null; // This is a logic-only component
}

// Hook for components that need offline message functionality
export function useOfflineMessageCache(sessionId: string) {
  const [cachedMessages, setCachedMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set());

  const {
    isOnline,
    isOfflineMode,
    cacheStats,
    sendMessage,
    getCachedMessages
  } = useOfflineMessaging();

  // Load cached messages for current session
  const loadCachedMessages = useCallback(async () => {
    if (!sessionId) return;

    try {
      const cached = await getCachedMessages(sessionId);
      const cleanMessages: Message[] = cached.map(({ cached, syncStatus, cacheTime, retryCount, ...message }) => message);
      setCachedMessages(cleanMessages);
    } catch (error) {
      console.error('Failed to load cached messages:', error);
    }
  }, [sessionId, getCachedMessages]);

  // Send message with offline support
  const sendMessageWithOfflineSupport = useCallback(async (
    content: string,
    options: { agentId?: string; model?: string } = {}
  ): Promise<{ success: boolean; messageId?: string; queued?: boolean }> => {
    try {
      const result = await sendMessage(content, sessionId, options);

      if (result.queued && result.messageId) {
        setPendingMessages(prev => new Set([...prev, result.messageId!]));
      }

      return result;
    } catch (error) {
      console.error('Failed to send message with offline support:', error);
      return { success: false };
    }
  }, [sessionId, sendMessage]);

  // Remove message from pending when sync completes
  const markMessageSynced = useCallback((messageId: string) => {
    setPendingMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  }, []);

  // Check if a message is pending sync
  const isMessagePending = useCallback((messageId: string) => {
    return pendingMessages.has(messageId);
  }, [pendingMessages]);

  useEffect(() => {
    loadCachedMessages();
  }, [loadCachedMessages]);

  return {
    // State
    cachedMessages,
    pendingMessages: Array.from(pendingMessages),
    isOnline,
    isOfflineMode,
    cacheStats,

    // Functions
    sendMessageWithOfflineSupport,
    loadCachedMessages,
    markMessageSynced,
    isMessagePending
  };
}

// Message status indicator for showing offline/pending state
export function MessageOfflineStatus({
  messageId,
  className = ''
}: {
  messageId: string;
  className?: string;
}) {
  const { isMessagePending, isOfflineMode } = useOfflineMessageCache('');
  const isPending = isMessagePending(messageId);

  if (!isPending && !isOfflineMode) return null;

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      {isPending ? (
        <>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span style={{ color: '#3b82f6' }}>Syncing...</span>
        </>
      ) : isOfflineMode ? (
        <>
          <div className="w-2 h-2 bg-gray-500 rounded-full" />
          <span style={{ color: '#6b7280' }}>Cached</span>
        </>
      ) : null}
    </div>
  );
}