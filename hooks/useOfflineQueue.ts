import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface QueuedMessage {
  id: string;
  content: string;
  sessionId?: string;
  agentId?: string;
  timestamp: number;
  retries: number;
  status: 'pending' | 'sending' | 'failed' | 'sent';
}

interface OfflineQueueState {
  messages: QueuedMessage[];
  isOnline: boolean;
  isSyncing: boolean;
  queueSize: number;
}

export function useOfflineQueue() {
  const [state, setState] = useState<OfflineQueueState>({
    messages: [],
    isOnline: navigator?.onLine ?? true,
    isSyncing: false,
    queueSize: 0
  });

  // Monitor online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      logger.info('🌐 Offline Queue: Back online, starting sync...');
      syncQueue();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      logger.info('📵 Offline Queue: Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load queued messages from localStorage on mount
    loadQueueFromStorage();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load queue from localStorage
  const loadQueueFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('offline-message-queue');
      if (stored) {
        const messages: QueuedMessage[] = JSON.parse(stored);
        setState(prev => ({ 
          ...prev, 
          messages: messages.filter(m => m.status !== 'sent'),
          queueSize: messages.filter(m => m.status !== 'sent').length
        }));
        logger.debug(`📦 Offline Queue: Loaded ${messages.length} messages from storage`);
      }
    } catch (error) {
      logger.error('❌ Offline Queue: Failed to load from storage');
    }
  }, []);

  // Save queue to localStorage
  const saveQueueToStorage = useCallback((messages: QueuedMessage[]) => {
    try {
      localStorage.setItem('offline-message-queue', JSON.stringify(messages));
      logger.debug(`💾 Offline Queue: Saved ${messages.length} messages to storage`);
    } catch (error) {
      logger.error('❌ Offline Queue: Failed to save to storage');
    }
  }, []);

  // Add message to queue
  const queueMessage = useCallback(async (
    content: string,
    sessionId?: string,
    agentId?: string
  ): Promise<QueuedMessage> => {
    const message: QueuedMessage = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      sessionId,
      agentId,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };

    setState(prev => {
      const newMessages = [...prev.messages, message];
      saveQueueToStorage(newMessages);
      return {
        ...prev,
        messages: newMessages,
        queueSize: newMessages.length
      };
    });

    // If using service worker, delegate to it
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const controller = registration.active;
        
        if (controller) {
          controller.postMessage({
            type: 'QUEUE_OFFLINE_MESSAGE',
            message: {
              content,
              sessionId,
              agentId,
              timestamp: message.timestamp
            }
          });
        }
      } catch (error) {
        logger.error('❌ Offline Queue: Failed to notify service worker');
      }
    }

    logger.info(`📤 Offline Queue: Queued message ${message.id}`);
    return message;
  }, [saveQueueToStorage]);

  // Remove message from queue
  const removeMessage = useCallback((messageId: string) => {
    setState(prev => {
      const newMessages = prev.messages.filter(m => m.id !== messageId);
      saveQueueToStorage(newMessages);
      return {
        ...prev,
        messages: newMessages,
        queueSize: newMessages.length
      };
    });
  }, [saveQueueToStorage]);

  // Update message status
  const updateMessageStatus = useCallback((
    messageId: string, 
    status: QueuedMessage['status'],
    incrementRetries = false
  ) => {
    setState(prev => {
      const newMessages = prev.messages.map(m => 
        m.id === messageId 
          ? { 
              ...m, 
              status, 
              retries: incrementRetries ? m.retries + 1 : m.retries 
            }
          : m
      );
      saveQueueToStorage(newMessages);
      return {
        ...prev,
        messages: newMessages
      };
    });
  }, [saveQueueToStorage]);

  // Sync queue when online
  const syncQueue = useCallback(async () => {
    if (!state.isOnline || state.isSyncing) return;

    const pendingMessages = state.messages.filter(m => 
      m.status === 'pending' || (m.status === 'failed' && m.retries < 3)
    );

    if (pendingMessages.length === 0) return;

    setState(prev => ({ ...prev, isSyncing: true }));
    logger.info(`🔄 Offline Queue: Syncing ${pendingMessages.length} messages...`);

    for (const message of pendingMessages) {
      try {
        updateMessageStatus(message.id, 'sending');

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message.content,
            sessionId: message.sessionId,
            agentId: message.agentId,
            fromOfflineQueue: true
          })
        });

        if (response.ok) {
          updateMessageStatus(message.id, 'sent');
          logger.info(`✅ Offline Queue: Synced message ${message.id}`);
          
          // Remove sent message after short delay
          setTimeout(() => removeMessage(message.id), 1000);
        } else {
          updateMessageStatus(message.id, 'failed', true);
          logger.warn(`⚠️ Offline Queue: Failed to sync message ${message.id}, will retry`);
        }
      } catch (error) {
        updateMessageStatus(message.id, 'failed', true);
        logger.error(`❌ Offline Queue: Error syncing message ${message.id}`);
      }

      // Small delay between requests to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setState(prev => ({ ...prev, isSyncing: false }));
    logger.info('✅ Offline Queue: Sync completed');
  }, [state.isOnline, state.isSyncing, state.messages, updateMessageStatus, removeMessage]);

  // Auto-sync when online
  useEffect(() => {
    if (state.isOnline && !state.isSyncing && state.messages.some(m => m.status === 'pending')) {
      const timeout = setTimeout(() => {
        syncQueue();
      }, 1000); // Wait 1 second after coming online

      return () => clearTimeout(timeout);
    }
  }, [state.isOnline, state.isSyncing, syncQueue, state.messages]);

  // Clear all sent messages
  const clearSentMessages = useCallback(() => {
    setState(prev => {
      const remainingMessages = prev.messages.filter(m => m.status !== 'sent');
      saveQueueToStorage(remainingMessages);
      return {
        ...prev,
        messages: remainingMessages,
        queueSize: remainingMessages.length
      };
    });
  }, [saveQueueToStorage]);

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      queueSize: 0
    }));
    localStorage.removeItem('offline-message-queue');
    logger.info('🗑️ Offline Queue: Cleared all messages');
  }, []);

  return {
    // State
    messages: state.messages,
    isOnline: state.isOnline,
    isSyncing: state.isSyncing,
    queueSize: state.queueSize,
    
    // Actions
    queueMessage,
    removeMessage,
    syncQueue,
    clearSentMessages,
    clearQueue,
    
    // Utils
    getPendingCount: () => state.messages.filter(m => m.status === 'pending').length,
    getFailedCount: () => state.messages.filter(m => m.status === 'failed').length,
    hasMessages: state.messages.length > 0
  };
}