'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMobileNavigation } from './useMobileNavigation';
import type { Message } from '@/types';

interface CachedMessage extends Message {
  cached: boolean;
  syncStatus: 'pending' | 'synced' | 'failed';
  cacheTime: Date;
  retryCount: number;
}

interface CachedSession {
  sessionId: string;
  name: string;
  messages: CachedMessage[];
  lastModified: Date;
  syncStatus: 'pending' | 'synced' | 'failed';
}

interface OfflineQueueItem {
  id: string;
  type: 'send_message' | 'create_session' | 'update_session';
  data: any;
  timestamp: Date;
  retryCount: number;
  priority: number;
}

interface OfflineManagerOptions {
  maxCacheSize?: number; // MB
  maxRetries?: number;
  retryDelay?: number; // ms
  cacheDuration?: number; // hours
  onOnlineStatusChange?: (isOnline: boolean) => void;
  onSyncProgress?: (progress: { total: number; completed: number; failed: number }) => void;
  onCacheQuotaExceeded?: () => void;
}

const STORAGE_KEYS = {
  MESSAGES: 'rubber_ducky_cached_messages',
  SESSIONS: 'rubber_ducky_cached_sessions',
  QUEUE: 'rubber_ducky_offline_queue',
  SETTINGS: 'rubber_ducky_offline_settings'
} as const;

export function useOfflineMode(options: OfflineManagerOptions = {}) {
  const {
    maxCacheSize = 50, // 50 MB default
    maxRetries = 3,
    retryDelay = 2000,
    cacheDuration = 24, // 24 hours
    onOnlineStatusChange,
    onSyncProgress,
    onCacheQuotaExceeded
  } = options;

  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileDevice = isMobile || isTablet;

  // Core state
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    cacheSize: 0, // in MB
    lastSync: null as Date | null,
    pendingItems: 0
  });

  // Refs for managing sync operations
  const syncQueue = useRef<OfflineQueueItem[]>([]);
  const isInitialized = useRef(false);
  const syncController = useRef<AbortController | null>(null);

  // Initialize offline functionality
  useEffect(() => {
    if (isInitialized.current) return;

    initializeOfflineMode();
    isInitialized.current = true;
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onOnlineStatusChange?.(true);
      // Auto-sync when coming back online
      syncPendingItems();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOnlineStatusChange?.(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [onOnlineStatusChange]);

  // Initialize offline storage and load cached data
  const initializeOfflineMode = useCallback(async () => {
    try {
      // Load cached data
      await loadCacheStats();
      await loadOfflineQueue();

      // Clean up expired cache
      await cleanupExpiredCache();

      // Initialize service worker for advanced caching (if supported)
      if (isMobileDevice && 'serviceWorker' in navigator) {
        await initializeServiceWorker();
      }
    } catch (error) {
      console.error('Failed to initialize offline mode:', error);
    }
  }, [isMobileDevice, cacheDuration]);

  // Service worker initialization for advanced offline capabilities
  const initializeServiceWorker = useCallback(async () => {
    try {
      // Check if service worker is already registered
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        // Register service worker (would be created separately)
        console.log('Service worker not found - would register offline-worker.js');
        // await navigator.serviceWorker.register('/offline-worker.js');
      }
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  }, []);

  // Load cache statistics
  const loadCacheStats = useCallback(async () => {
    try {
      const sessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      const messages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const queue = localStorage.getItem(STORAGE_KEYS.QUEUE);

      let cacheSize = 0;
      let totalSessions = 0;
      let totalMessages = 0;
      let pendingItems = 0;

      if (sessions) {
        const sessionData = JSON.parse(sessions);
        totalSessions = Object.keys(sessionData).length;
        cacheSize += new Blob([sessions]).size;
      }

      if (messages) {
        const messageData = JSON.parse(messages);
        totalMessages = Object.values(messageData).reduce((sum: number, msgs: any) => sum + msgs.length, 0);
        cacheSize += new Blob([messages]).size;
      }

      if (queue) {
        const queueData = JSON.parse(queue);
        pendingItems = queueData.length;
        cacheSize += new Blob([queue]).size;
      }

      // Convert to MB
      cacheSize = cacheSize / (1024 * 1024);

      setCacheStats(prev => ({
        ...prev,
        totalSessions,
        totalMessages,
        cacheSize,
        pendingItems
      }));

      // Check cache quota
      if (cacheSize > maxCacheSize) {
        onCacheQuotaExceeded?.();
      }
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  }, [maxCacheSize, onCacheQuotaExceeded]);

  // Load offline queue
  const loadOfflineQueue = useCallback(async () => {
    try {
      const queueData = localStorage.getItem(STORAGE_KEYS.QUEUE);
      if (queueData) {
        syncQueue.current = JSON.parse(queueData, (key, value) => {
          if (key === 'timestamp') return new Date(value);
          return value;
        });
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      syncQueue.current = [];
    }
  }, []);

  // Clean up expired cache entries
  const cleanupExpiredCache = useCallback(async () => {
    try {
      const now = new Date();
      const expirationTime = cacheDuration * 60 * 60 * 1000; // Convert hours to ms

      // Clean messages cache
      const messagesData = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (messagesData) {
        const messages = JSON.parse(messagesData, (key, value) => {
          if (key === 'cacheTime') return new Date(value);
          return value;
        });

        let hasExpired = false;
        for (const sessionId in messages) {
          messages[sessionId] = messages[sessionId].filter((msg: CachedMessage) => {
            const isExpired = now.getTime() - msg.cacheTime.getTime() > expirationTime;
            if (isExpired) hasExpired = true;
            return !isExpired;
          });

          if (messages[sessionId].length === 0) {
            delete messages[sessionId];
          }
        }

        if (hasExpired) {
          localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired cache:', error);
    }
  }, [cacheDuration]);

  // Cache a message for offline access
  const cacheMessage = useCallback(async (message: Message, sessionId: string): Promise<boolean> => {
    try {
      const messagesData = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      const messages = messagesData ? JSON.parse(messagesData) : {};

      if (!messages[sessionId]) {
        messages[sessionId] = [];
      }

      const cachedMessage: CachedMessage = {
        ...message,
        cached: true,
        syncStatus: 'synced',
        cacheTime: new Date(),
        retryCount: 0
      };

      // Check if message already exists (avoid duplicates)
      const existingIndex = messages[sessionId].findIndex((m: CachedMessage) => m.id === message.id);
      if (existingIndex >= 0) {
        messages[sessionId][existingIndex] = cachedMessage;
      } else {
        messages[sessionId].push(cachedMessage);
      }

      // Sort by timestamp
      messages[sessionId].sort((a: CachedMessage, b: CachedMessage) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      await loadCacheStats();

      return true;
    } catch (error) {
      console.error('Failed to cache message:', error);
      return false;
    }
  }, [loadCacheStats]);

  // Get cached messages for a session
  const getCachedMessages = useCallback(async (sessionId: string): Promise<CachedMessage[]> => {
    try {
      const messagesData = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!messagesData) return [];

      const messages = JSON.parse(messagesData, (key, value) => {
        if (key === 'timestamp' || key === 'cacheTime') return new Date(value);
        return value;
      });

      return messages[sessionId] || [];
    } catch (error) {
      console.error('Failed to get cached messages:', error);
      return [];
    }
  }, []);

  // Add item to offline sync queue
  const queueForSync = useCallback(async (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> => {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0
    };

    syncQueue.current.push(queueItem);
    syncQueue.current.sort((a, b) => b.priority - a.priority); // Higher priority first

    try {
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(syncQueue.current));
      await loadCacheStats();
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }

    // Try to sync immediately if online
    if (isOnline) {
      syncPendingItems();
    }

    return queueItem.id;
  }, [isOnline, loadCacheStats]);

  // Sync pending items when online
  const syncPendingItems = useCallback(async (): Promise<{ success: number; failed: number; total: number }> => {
    if (isSyncing || !isOnline || syncQueue.current.length === 0) {
      return { success: 0, failed: 0, total: 0 };
    }

    setIsSyncing(true);
    syncController.current = new AbortController();

    const results = { success: 0, failed: 0, total: syncQueue.current.length };
    const itemsToProcess = [...syncQueue.current];

    try {
      for (const item of itemsToProcess) {
        if (syncController.current.signal.aborted) break;

        try {
          await syncItem(item);
          results.success++;

          // Remove from queue on success
          syncQueue.current = syncQueue.current.filter(q => q.id !== item.id);
        } catch (error) {
          console.error(`Sync failed for item ${item.id}:`, error);
          results.failed++;

          // Increment retry count
          const queueItem = syncQueue.current.find(q => q.id === item.id);
          if (queueItem) {
            queueItem.retryCount++;

            // Remove if max retries reached
            if (queueItem.retryCount >= maxRetries) {
              syncQueue.current = syncQueue.current.filter(q => q.id !== item.id);
            }
          }
        }

        // Update progress
        onSyncProgress?.({
          total: results.total,
          completed: results.success + results.failed,
          failed: results.failed
        });

        // Brief delay between syncs to avoid overwhelming the server
        if (!syncController.current.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Save updated queue
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(syncQueue.current));
      await loadCacheStats();

    } finally {
      setIsSyncing(false);
      syncController.current = null;
    }

    return results;
  }, [isSyncing, isOnline, maxRetries, onSyncProgress, loadCacheStats]);

  // Sync individual item
  const syncItem = useCallback(async (item: OfflineQueueItem): Promise<void> => {
    const { signal } = syncController.current || {};

    switch (item.type) {
      case 'send_message':
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
          signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        break;

      case 'create_session':
      case 'update_session':
        const sessionResponse = await fetch('/api/sessions', {
          method: item.type === 'create_session' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data),
          signal
        });

        if (!sessionResponse.ok) {
          throw new Error(`HTTP ${sessionResponse.status}: ${sessionResponse.statusText}`);
        }
        break;

      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  }, []);

  // Clear all cached data
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.QUEUE);

      syncQueue.current = [];
      setCacheStats({
        totalSessions: 0,
        totalMessages: 0,
        cacheSize: 0,
        lastSync: null,
        pendingItems: 0
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, []);

  // Cancel ongoing sync operation
  const cancelSync = useCallback((): void => {
    if (syncController.current) {
      syncController.current.abort();
      syncController.current = null;
      setIsSyncing(false);
    }
  }, []);

  return {
    // State
    isOnline,
    isOfflineMode: !isOnline,
    isSyncing,
    cacheStats,

    // Core functionality
    cacheMessage,
    getCachedMessages,
    queueForSync,
    syncPendingItems,

    // Management
    clearCache,
    cancelSync,

    // Utilities
    isMobileDevice,
    isInitialized: isInitialized.current
  };
}

// Hook for offline-aware message sending
export function useOfflineMessaging() {
  const offlineManager = useOfflineMode();
  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileDevice = isMobile || isTablet;

  const sendMessage = useCallback(async (
    content: string,
    sessionId: string,
    options: { agentId?: string; model?: string } = {}
  ): Promise<{ success: boolean; messageId?: string; queued?: boolean }> => {
    const messageData = {
      content,
      sessionId,
      ...options,
      timestamp: new Date(),
      role: 'user' as const
    };

    if (offlineManager.isOnline) {
      // Try to send immediately
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData)
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, messageId: result.messageId };
        }
      } catch (error) {
        console.warn('Failed to send message online, queuing for later:', error);
      }
    }

    // Queue for offline sync
    const queueId = await offlineManager.queueForSync({
      type: 'send_message',
      data: messageData,
      priority: 5 // High priority for messages
    });

    return { success: true, messageId: queueId, queued: true };
  }, [offlineManager]);

  return {
    ...offlineManager,
    sendMessage,
    isMobileDevice
  };
}