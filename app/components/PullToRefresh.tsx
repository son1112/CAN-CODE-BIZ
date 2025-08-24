'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  maxPull?: number;
  enabled?: boolean;
  className?: string;
  refreshMessage?: string;
  pullMessage?: string;
}

interface TouchState {
  startY: number;
  currentY: number;
  isDragging: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPull = 120,
  enabled = true,
  className = '',
  refreshMessage = 'Refreshing...',
  pullMessage = 'Pull to refresh'
}: PullToRefreshProps) {
  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileLayout = isMobile || isTablet;
  const { hapticPattern } = useHapticFeedback();

  const containerRef = useRef<HTMLDivElement>(null);
  const prevPullDistanceRef = useRef(0);
  const [touchState, setTouchState] = useState<TouchState>({
    startY: 0,
    currentY: 0,
    isDragging: false,
    pullDistance: 0,
    isRefreshing: false
  });

  // Only enable on mobile devices
  const isEnabled = enabled && isMobileLayout;

  // Calculate pull progress (0-1)
  const pullProgress = Math.min(touchState.pullDistance / threshold, 1);
  const canRefresh = touchState.pullDistance >= threshold;

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isEnabled || touchState.isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only allow pull-to-refresh when at the top of the scroll container
    if (container.scrollTop > 0) return;

    setTouchState(prev => ({
      ...prev,
      startY: e.touches[0].clientY,
      currentY: e.touches[0].clientY,
      isDragging: true,
      pullDistance: 0
    }));
  }, [isEnabled, touchState.isRefreshing]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isEnabled || !touchState.isDragging || touchState.isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchState.startY;

    // Only allow downward pulls
    if (deltaY <= 0) return;

    // Apply resistance curve for natural feel
    const resistance = Math.max(0, 1 - (deltaY / maxPull) * 0.5);
    const pullDistance = Math.min(deltaY * resistance, maxPull);

    // Trigger haptic feedback when crossing threshold
    const isNowAboveThreshold = pullDistance >= threshold;
    const wasAboveThreshold = prevPullDistanceRef.current >= threshold;

    if (!wasAboveThreshold && isNowAboveThreshold) {
      hapticPattern('pull-refresh');
    }

    prevPullDistanceRef.current = pullDistance;

    setTouchState(prev => ({
      ...prev,
      currentY,
      pullDistance
    }));

    // Prevent default scrolling when pulling
    if (pullDistance > 10) {
      e.preventDefault();
    }
  }, [isEnabled, touchState.isDragging, touchState.startY, touchState.isRefreshing, maxPull]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!isEnabled || !touchState.isDragging) return;

    const shouldRefresh = canRefresh && !touchState.isRefreshing;

    if (shouldRefresh) {
      setTouchState(prev => ({
        ...prev,
        isDragging: false,
        isRefreshing: true,
        pullDistance: threshold // Keep at threshold during refresh
      }));

      try {
        // Enhanced haptic feedback for refresh action
        hapticPattern('success');

        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh failed:', error);
      } finally {
        // Smooth transition back to normal state
        setTouchState(prev => ({ ...prev, isRefreshing: false }));

        // Animate back to normal position
        setTimeout(() => {
          setTouchState(prev => ({
            ...prev,
            pullDistance: 0,
            isDragging: false
          }));
        }, 150);
      }
    } else {
      // Return to normal state
      setTouchState(prev => ({
        ...prev,
        isDragging: false,
        pullDistance: 0
      }));
    }
  }, [isEnabled, touchState.isDragging, canRefresh, touchState.isRefreshing, onRefresh, threshold]);

  // Add touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isEnabled) return;

    // Use passive listeners where possible for better performance
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isEnabled]);

  // Calculate dynamic styles
  const containerStyle = {
    transform: `translateY(${touchState.pullDistance * 0.5}px)`,
    transition: touchState.isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  };

  const refreshIndicatorStyle = {
    height: `${Math.max(0, touchState.pullDistance)}px`,
    opacity: pullProgress * 0.8 + 0.2
  };

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh-container ${className}`}
      style={{
        position: 'relative',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Pull-to-Refresh Indicator */}
      {isEnabled && touchState.pullDistance > 0 && (
        <div
          className="pull-to-refresh-indicator"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isMobile
              ? 'rgba(59, 130, 246, 0.05)'
              : 'rgba(59, 130, 246, 0.08)',
            backdropFilter: 'blur(8px)',
            borderBottom: canRefresh
              ? '2px solid rgba(59, 130, 246, 0.3)'
              : '1px solid rgba(59, 130, 246, 0.1)',
            ...refreshIndicatorStyle
          }}
        >
          <div className="flex items-center gap-3 py-2">
            {/* Refresh Icon */}
            <div
              style={{
                transform: `rotate(${pullProgress * 180}deg) scale(${0.8 + pullProgress * 0.4})`,
                transition: touchState.isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
            >
              {touchState.isRefreshing ? (
                <RefreshCw
                  className="w-5 h-5 animate-spin text-blue-600"
                  style={{ animationDuration: '1s' }}
                />
              ) : canRefresh ? (
                <RefreshCw className="w-5 h-5 text-blue-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-500" />
              )}
            </div>

            {/* Refresh Text */}
            <span
              className="text-sm font-medium"
              style={{
                color: canRefresh ? '#2563eb' : '#64748b',
                transform: `scale(${0.9 + pullProgress * 0.1})`,
                transition: touchState.isDragging ? 'none' : 'all 0.2s ease-out'
              }}
            >
              {touchState.isRefreshing
                ? refreshMessage
                : canRefresh
                  ? 'Release to refresh'
                  : pullMessage
              }
            </span>
          </div>

          {/* Progress Bar */}
          <div
            className="absolute bottom-0 left-0 bg-blue-600 h-0.5 transition-all duration-200"
            style={{
              width: `${pullProgress * 100}%`,
              opacity: pullProgress > 0.1 ? 1 : 0
            }}
          />
        </div>
      )}

      {/* Content Container */}
      <div
        className="pull-to-refresh-content"
        style={containerStyle}
      >
        {children}
      </div>
    </div>
  );
}

// Hook for managing pull-to-refresh state across components
export function usePullToRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const refresh = useCallback(async (refreshFn: () => Promise<void>) => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshFn();
      setLastRefreshTime(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const canRefresh = useCallback(() => {
    if (isRefreshing) return false;

    // Prevent rapid refresh attempts (minimum 2 seconds between refreshes)
    if (lastRefreshTime) {
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.getTime();
      return timeSinceLastRefresh > 2000;
    }

    return true;
  }, [isRefreshing, lastRefreshTime]);

  return {
    isRefreshing,
    lastRefreshTime,
    refresh,
    canRefresh
  };
}

// Specialized pull-to-refresh components for different contexts
export function ChatPullToRefresh({
  onRefresh,
  children
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <PullToRefresh
      onRefresh={onRefresh}
      threshold={70}
      maxPull={100}
      refreshMessage="Syncing messages..."
      pullMessage="Pull to sync"
      className="chat-pull-to-refresh"
    >
      {children}
    </PullToRefresh>
  );
}

export function SessionsPullToRefresh({
  onRefresh,
  children
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <PullToRefresh
      onRefresh={onRefresh}
      threshold={80}
      maxPull={120}
      refreshMessage="Refreshing sessions..."
      pullMessage="Pull to refresh sessions"
      className="sessions-pull-to-refresh"
    >
      {children}
    </PullToRefresh>
  );
}