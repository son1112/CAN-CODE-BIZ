'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import type { Message } from '@/types';

interface VirtualizedMessageListProps {
  messages: Message[];
  renderMessage: (message: Message, index: number) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  maintainScrollPosition?: boolean;
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
  height: number;
}

export default function VirtualizedMessageList({
  messages,
  renderMessage,
  className = '',
  style = {},
  itemHeight = 200, // Default estimated height per message
  containerHeight,
  overscan = 3,
  onScroll,
  maintainScrollPosition = true
}: VirtualizedMessageListProps) {
  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileLayout = isMobile || isTablet;

  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [measurementCache, setMeasurementCache] = useState<Map<number, number>>(new Map());

  // Adjust item height for mobile
  const adaptiveItemHeight = useMemo(() => {
    return isMobileLayout ? Math.floor(itemHeight * 0.8) : itemHeight;
  }, [itemHeight, isMobileLayout]);

  // Calculate total height and virtual items
  const { totalHeight, virtualItems, startIndex, endIndex } = useMemo(() => {
    if (messages.length === 0) return { totalHeight: 0, virtualItems: [], startIndex: 0, endIndex: 0 };

    const height = containerHeight || containerSize.height;
    // CRITICAL FIX: Don't return empty when height is 0 - use fallback rendering
    // This prevents messages from disappearing during initial render or mobile viewport changes
    const useHeightFallback = height === 0;
    const fallbackHeight = isMobileLayout ? 600 : 800; // Reasonable fallback for mobile/desktop

    // Debug logging for troubleshooting
    if (process.env.NODE_ENV === 'development' && useHeightFallback) {
      console.warn('VirtualizedMessageList: Using height fallback', {
        messageCount: messages.length,
        containerHeight,
        containerSizeHeight: containerSize.height,
        isMobileLayout,
        fallbackHeight
      });
    }

    // Calculate total height using cached measurements or estimates
    let totalHeight = 0;
    const itemPositions: number[] = [];

    for (let i = 0; i < messages.length; i++) {
      itemPositions[i] = totalHeight;
      const cachedHeight = measurementCache.get(i);
      totalHeight += cachedHeight || adaptiveItemHeight;
    }

    // Calculate visible range with fallback handling
    const effectiveHeight = useHeightFallback ? fallbackHeight : height;
    const startIndex = Math.max(0,
      Math.floor(scrollTop / adaptiveItemHeight) - overscan
    );
    const visibleCount = Math.ceil(effectiveHeight / adaptiveItemHeight);
    
    // CRITICAL FIX: When using height fallback, show all messages to prevent disappearing
    // This ensures messages are always visible even during container size calculations
    const endIndex = useHeightFallback 
      ? messages.length - 1  // Show all messages when height is unknown
      : Math.min(messages.length - 1, startIndex + visibleCount + overscan * 2);

    // Create virtual items
    const virtualItems: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const start = itemPositions[i];
      const height = measurementCache.get(i) || adaptiveItemHeight;
      virtualItems.push({
        index: i,
        start,
        end: start + height,
        height
      });
    }

    return { totalHeight, virtualItems, startIndex, endIndex };
  }, [messages.length, scrollTop, containerSize.height, containerHeight, adaptiveItemHeight, overscan, measurementCache, isMobileLayout]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
  }, [onScroll]);

  // Measure container size with immediate size detection
  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    // CRITICAL FIX: Get initial size immediately to prevent zero height issues
    const initialSize = {
      width: element.clientWidth,
      height: element.clientHeight
    };
    
    // Set initial size if we have valid dimensions
    if (initialSize.height > 0) {
      setContainerSize(initialSize);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const newSize = {
          width: entry.contentRect.width,
          height: entry.contentRect.height
        };
        
        // Only update if we have valid dimensions
        if (newSize.height > 0) {
          setContainerSize(newSize);
        }
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  // Measure individual items after render
  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element || virtualItems.length === 0) return;

    // Use RAF to measure after render
    requestAnimationFrame(() => {
      const children = element.children[0]?.children;
      if (!children) return;

      const newMeasurements = new Map(measurementCache);
      let hasChanges = false;

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const virtualItem = virtualItems[i];
        if (virtualItem && child) {
          const height = child.offsetHeight;
          const cachedHeight = measurementCache.get(virtualItem.index);

          if (cachedHeight !== height) {
            newMeasurements.set(virtualItem.index, height);
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        setMeasurementCache(newMeasurements);
      }
    });
  }, [virtualItems, measurementCache]);

  // Scroll to bottom when new messages are added (maintain scroll position)
  useEffect(() => {
    if (!maintainScrollPosition) return;

    const element = scrollElementRef.current;
    if (!element) return;

    // Check if user is near bottom (within 100px)
    const { scrollTop, scrollHeight, clientHeight } = element;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (isNearBottom) {
      // Scroll to bottom after a short delay to allow for rendering
      setTimeout(() => {
        element.scrollTo({
          top: element.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);
    }
  }, [messages.length, maintainScrollPosition]);

  // Auto-scroll to bottom on mobile for better UX
  const scrollToBottom = useCallback(() => {
    const element = scrollElementRef.current;
    if (element) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-scroll-container ${className} ${
        isMobileLayout ? 'mobile-chat-container mobile-scroll-momentum mobile-scrollbar' : ''
      }`}
      style={{
        ...style,
        overflowY: 'auto',
        overflowX: 'hidden',
        height: containerHeight || '100%',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${virtualItems[0]?.start || 0}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {virtualItems.map((virtualItem) => (
            <div
              key={messages[virtualItem.index]?.id || virtualItem.index}
              data-index={virtualItem.index}
              style={{
                minHeight: virtualItem.height,
              }}
            >
              {renderMessage(messages[virtualItem.index], virtualItem.index)}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile scroll to bottom button */}
      {isMobileLayout && scrollTop > 500 && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-20 right-4 z-20 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center touch-target"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          }}
          aria-label="Scroll to bottom"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M7 13l3 3 3-3" />
            <path d="M7 6l3 3 3-3" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Performance monitoring hook for virtual scrolling
export function useVirtualScrollPerformance(enabled = true) {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    itemCount: 0,
    scrollFPS: 0,
  });

  const measureRender = useCallback((itemCount: number) => {
    if (!enabled) return;

    const startTime = performance.now();

    // Measure after next frame
    requestAnimationFrame(() => {
      const endTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        renderTime: endTime - startTime,
        itemCount
      }));
    });
  }, [enabled]);

  return { metrics, measureRender };
}

// Utility hook for optimizing message rendering
export function useMemoizedMessageRenderer<T extends Message>(
  messages: T[],
  renderFn: (message: T, index: number) => React.ReactNode
) {
  return useMemo(() => {
    const cache = new Map<string, React.ReactNode>();

    return (message: T, index: number) => {
      const key = `${message.id}-${(message as any).timestamp || Date.now()}`;

      if (!cache.has(key)) {
        cache.set(key, renderFn(message, index));
      }

      return cache.get(key);
    };
  }, [messages, renderFn]);
}