'use client';

import { useState, useCallback, useRef } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useMobileNavigation } from './useMobileNavigation';

interface RefreshOperation {
  id: string;
  name: string;
  action: () => Promise<void>;
  priority: number;
  timeout?: number;
}

interface RefreshResult {
  success: boolean;
  error?: string;
  duration: number;
  timestamp: Date;
}

interface RefreshManagerOptions {
  maxConcurrentOperations?: number;
  defaultTimeout?: number;
  retryAttempts?: number;
  onRefreshStart?: () => void;
  onRefreshComplete?: (results: RefreshResult[]) => void;
  onRefreshError?: (error: string) => void;
}

export function useRefreshManager(options: RefreshManagerOptions = {}) {
  const {
    maxConcurrentOperations = 3,
    defaultTimeout = 10000,
    retryAttempts = 1,
    onRefreshStart,
    onRefreshComplete,
    onRefreshError
  } = options;

  const { isMobile } = useMobileNavigation();
  const { currentSessionId, loadSession, loadSessions } = useSession();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const operationQueue = useRef<RefreshOperation[]>([]);
  const activeOperations = useRef<Set<string>>(new Set());

  // Execute a single refresh operation with timeout and retry logic
  const executeOperation = useCallback(async (operation: RefreshOperation): Promise<RefreshResult> => {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: string | undefined;

    while (attempts <= retryAttempts) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), operation.timeout || defaultTimeout)
        );

        // Race the operation against timeout
        await Promise.race([operation.action(), timeoutPromise]);

        return {
          success: true,
          duration: Date.now() - startTime,
          timestamp: new Date()
        };
      } catch (error) {
        attempts++;
        lastError = error instanceof Error ? error.message : 'Unknown error';

        if (attempts <= retryAttempts) {
          // Brief delay before retry
          await new Promise(resolve => setTimeout(resolve, 500 * attempts));
        }
      }
    }

    return {
      success: false,
      error: lastError,
      duration: Date.now() - startTime,
      timestamp: new Date()
    };
  }, [defaultTimeout, retryAttempts]);

  // Process the refresh queue
  const processQueue = useCallback(async (): Promise<RefreshResult[]> => {
    const operations = [...operationQueue.current];
    operationQueue.current = [];

    if (operations.length === 0) return [];

    const results: RefreshResult[] = [];
    const batches: RefreshOperation[][] = [];

    // Group operations into batches based on max concurrent operations
    for (let i = 0; i < operations.length; i += maxConcurrentOperations) {
      batches.push(operations.slice(i, i + maxConcurrentOperations));
    }

    // Process batches sequentially, operations within batch concurrently
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      // Update progress
      setRefreshProgress((batchIndex * maxConcurrentOperations) / operations.length);

      const batchPromises = batch.map(async (operation) => {
        activeOperations.current.add(operation.id);
        try {
          return await executeOperation(operation);
        } finally {
          activeOperations.current.delete(operation.id);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    setRefreshProgress(1);
    return results;
  }, [maxConcurrentOperations, executeOperation]);

  // Add operation to refresh queue
  const queueOperation = useCallback((operation: Omit<RefreshOperation, 'priority'> & { priority?: number }) => {
    const fullOperation: RefreshOperation = {
      priority: 1,
      ...operation
    };

    operationQueue.current.push(fullOperation);
    // Sort by priority (higher priority first)
    operationQueue.current.sort((a, b) => b.priority - a.priority);
  }, []);

  // Execute all queued refresh operations
  const executeRefresh = useCallback(async (): Promise<RefreshResult[]> => {
    if (isRefreshing || operationQueue.current.length === 0) {
      return [];
    }

    setIsRefreshing(true);
    setRefreshProgress(0);
    onRefreshStart?.();

    try {
      const results = await processQueue();
      const hasErrors = results.some(result => !result.success);

      setLastRefreshTime(new Date());
      onRefreshComplete?.(results);

      if (hasErrors) {
        const errorMessages = results
          .filter(result => !result.success)
          .map(result => result.error)
          .filter(Boolean);
        onRefreshError?.(`Some operations failed: ${errorMessages.join(', ')}`);
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Refresh failed';
      onRefreshError?.(errorMessage);
      return [];
    } finally {
      setIsRefreshing(false);
      setRefreshProgress(0);
    }
  }, [isRefreshing, processQueue, onRefreshStart, onRefreshComplete, onRefreshError]);

  // Predefined refresh operations
  const refreshSessions = useCallback(() => {
    queueOperation({
      id: 'refresh-sessions',
      name: 'Refresh Sessions',
      action: async () => {
        await loadSessions();
      },
      priority: 3,
      timeout: 8000
    });
  }, [queueOperation, loadSessions]);

  const refreshCurrentChat = useCallback(() => {
    queueOperation({
      id: 'refresh-current-chat',
      name: 'Refresh Current Chat',
      action: async () => {
        if (currentSessionId) {
          await loadSession(currentSessionId);
        }
      },
      priority: 2,
      timeout: 6000
    });
  }, [queueOperation, currentSessionId, loadSession]);

  const refreshStars = useCallback(() => {
    queueOperation({
      id: 'refresh-stars',
      name: 'Refresh Starred Messages',
      action: async () => {
        // API call to refresh starred messages
        const response = await fetch('/api/stars');
        if (!response.ok) throw new Error('Failed to refresh stars');
      },
      priority: 1,
      timeout: 5000
    });
  }, [queueOperation]);

  const refreshTags = useCallback(() => {
    queueOperation({
      id: 'refresh-tags',
      name: 'Refresh Tags',
      action: async () => {
        const response = await fetch('/api/tags');
        if (!response.ok) throw new Error('Failed to refresh tags');
      },
      priority: 1,
      timeout: 5000
    });
  }, [queueOperation]);

  // Comprehensive refresh for mobile pull-to-refresh
  const refreshAll = useCallback(async (): Promise<RefreshResult[]> => {
    // Queue common refresh operations
    refreshSessions();
    refreshCurrentChat();
    refreshStars();
    refreshTags();

    return await executeRefresh();
  }, [refreshSessions, refreshCurrentChat, refreshStars, refreshTags, executeRefresh]);

  // Smart refresh based on context
  const smartRefresh = useCallback(async (context: 'chat' | 'sessions' | 'stars' | 'tags' | 'all'): Promise<RefreshResult[]> => {
    switch (context) {
      case 'chat':
        refreshCurrentChat();
        break;
      case 'sessions':
        refreshSessions();
        break;
      case 'stars':
        refreshStars();
        break;
      case 'tags':
        refreshTags();
        break;
      case 'all':
        return refreshAll();
      default:
        refreshSessions();
        refreshCurrentChat();
    }

    return await executeRefresh();
  }, [refreshCurrentChat, refreshSessions, refreshStars, refreshTags, refreshAll, executeRefresh]);

  // Check if refresh is allowed (rate limiting)
  const canRefresh = useCallback((): boolean => {
    if (isRefreshing) return false;

    // Mobile devices: minimum 2 seconds between refreshes
    // Desktop: minimum 5 seconds
    const minInterval = isMobile ? 2000 : 5000;

    if (lastRefreshTime) {
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.getTime();
      return timeSinceLastRefresh > minInterval;
    }

    return true;
  }, [isRefreshing, lastRefreshTime, isMobile]);

  // Get refresh status for UI feedback
  const getRefreshStatus = useCallback(() => {
    const queueLength = operationQueue.current.length;
    const activeCount = activeOperations.current.size;

    return {
      isRefreshing,
      progress: refreshProgress,
      queuedOperations: queueLength,
      activeOperations: activeCount,
      canRefresh: canRefresh(),
      lastRefreshTime,
      estimatedTimeRemaining: isRefreshing ? Math.max(0, (queueLength - refreshProgress * queueLength) * 1000) : 0
    };
  }, [isRefreshing, refreshProgress, canRefresh, lastRefreshTime]);

  return {
    // Core refresh functions
    refreshAll,
    smartRefresh,
    executeRefresh,

    // Individual refresh operations
    refreshSessions,
    refreshCurrentChat,
    refreshStars,
    refreshTags,

    // Queue management
    queueOperation,

    // Status and control
    getRefreshStatus,
    canRefresh,
    isRefreshing,
    refreshProgress,
    lastRefreshTime
  };
}