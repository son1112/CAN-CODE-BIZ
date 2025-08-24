'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMobileNavigation } from './useMobileNavigation';
import type { Message } from '@/types';

interface MessageVirtualizationOptions {
  enabled?: boolean;
  threshold?: number; // Minimum number of messages to enable virtualization
  estimatedItemHeight?: number;
  overscan?: number;
  maintainScrollPosition?: boolean;
}

interface VirtualizationMetrics {
  totalMessages: number;
  visibleMessages: number;
  renderTime: number;
  memoryUsage: number;
  scrollPerformance: number;
}

export function useMessageVirtualization(
  messages: Message[],
  options: MessageVirtualizationOptions = {}
) {
  const {
    enabled = true,
    threshold = 20, // Enable virtualization after 20 messages
    estimatedItemHeight = 200,
    overscan = 3,
    maintainScrollPosition = true
  } = options;

  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileLayout = isMobile || isTablet;

  // State for virtualization
  const [shouldVirtualize, setShouldVirtualize] = useState(false);
  const [metrics, setMetrics] = useState<VirtualizationMetrics>({
    totalMessages: 0,
    visibleMessages: 0,
    renderTime: 0,
    memoryUsage: 0,
    scrollPerformance: 0
  });

  // Performance monitoring
  const renderTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // Determine if virtualization should be enabled
  useEffect(() => {
    const shouldEnable = enabled && messages.length >= threshold;
    setShouldVirtualize(shouldEnable);
  }, [enabled, messages.length, threshold]);

  // Adaptive item height based on device type and message content
  const getAdaptiveItemHeight = useCallback((message: Message): number => {
    let baseHeight = estimatedItemHeight;

    // Adjust for mobile
    if (isMobileLayout) {
      baseHeight *= 0.8;
    }

    // Adjust based on message content
    const contentLength = message.content.length;
    if (contentLength > 500) {
      baseHeight *= 1.5;
    } else if (contentLength > 1000) {
      baseHeight *= 2;
    }

    // Adjust for message role
    if (message.role === 'assistant') {
      baseHeight *= 1.2; // Assistant messages tend to be longer
    }

    // Adjust for metadata (audio, export info, etc.)
    if (message.audioMetadata) {
      baseHeight += 50;
    }

    return Math.round(baseHeight);
  }, [estimatedItemHeight, isMobileLayout]);

  // Performance measurement
  const measureRenderPerformance = useCallback(() => {
    if (!shouldVirtualize) return;

    const startTime = performance.now();
    renderTimeRef.current = startTime;

    requestAnimationFrame(() => {
      const endTime = performance.now();
      const renderTime = endTime - renderTimeRef.current;

      // Calculate FPS
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFrameTimeRef.current >= 1000) {
        const fps = frameCountRef.current;
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;

        setMetrics(prev => ({
          ...prev,
          renderTime,
          scrollPerformance: fps,
          totalMessages: messages.length
        }));
      }
    });
  }, [shouldVirtualize, messages.length]);

  // Memory usage estimation
  const estimateMemoryUsage = useCallback(() => {
    if (!shouldVirtualize) return 0;

    // Rough estimation based on message count and content
    const avgMessageSize = messages.reduce((acc, msg) => acc + msg.content.length, 0) / messages.length || 0;
    const estimatedSizePerMessage = avgMessageSize * 2 + 1000; // Include DOM overhead
    return messages.length * estimatedSizePerMessage;
  }, [messages, shouldVirtualize]);

  // Update metrics
  useEffect(() => {
    if (shouldVirtualize) {
      measureRenderPerformance();
      const memoryUsage = estimateMemoryUsage();

      setMetrics(prev => ({
        ...prev,
        totalMessages: messages.length,
        memoryUsage
      }));
    }
  }, [messages.length, shouldVirtualize, measureRenderPerformance, estimateMemoryUsage]);

  // Smart scroll behavior for mobile
  const getScrollBehavior = useCallback(() => {
    if (!isMobileLayout) return 'smooth';

    // Use instant scroll for large lists on mobile to improve performance
    return messages.length > 100 ? 'instant' : 'smooth';
  }, [isMobileLayout, messages.length]);

  // Intelligent overscan calculation
  const getAdaptiveOverscan = useCallback(() => {
    if (!shouldVirtualize) return 0;

    let adaptiveOverscan = overscan;

    // Increase overscan on mobile for smoother scrolling
    if (isMobileLayout) {
      adaptiveOverscan += 2;
    }

    // Reduce overscan for very large lists to save memory
    if (messages.length > 500) {
      adaptiveOverscan = Math.max(1, adaptiveOverscan - 1);
    }

    return adaptiveOverscan;
  }, [shouldVirtualize, overscan, isMobileLayout, messages.length]);

  // Scroll optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];

    if (metrics.renderTime > 16) { // More than one frame
      suggestions.push('Consider reducing message complexity or enabling virtualization');
    }

    if (metrics.scrollPerformance < 30) { // Less than 30 FPS
      suggestions.push('Scroll performance is low. Consider optimizing animations or reducing overscan');
    }

    if (metrics.memoryUsage > 50 * 1024 * 1024) { // More than 50MB
      suggestions.push('High memory usage detected. Consider implementing message pagination');
    }

    if (messages.length > 1000 && !shouldVirtualize) {
      suggestions.push('Large message list detected. Consider enabling virtualization');
    }

    return suggestions;
  }, [metrics, messages.length, shouldVirtualize]);

  return {
    shouldVirtualize,
    metrics,
    getAdaptiveItemHeight,
    getAdaptiveOverscan,
    getScrollBehavior,
    getOptimizationSuggestions,
    isMobileLayout,
    virtualizationConfig: {
      enabled: shouldVirtualize,
      itemHeight: estimatedItemHeight,
      overscan: getAdaptiveOverscan(),
      maintainScrollPosition,
      threshold
    }
  };
}

// Hook for message list performance monitoring
export function useMessageListPerformance() {
  const [performanceData, setPerformanceData] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    peakRenderTime: 0,
    memoryPressure: false
  });

  const measureRender = useCallback(() => {
    const startTime = performance.now();

    requestAnimationFrame(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      setPerformanceData(prev => ({
        renderCount: prev.renderCount + 1,
        averageRenderTime: (prev.averageRenderTime * prev.renderCount + renderTime) / (prev.renderCount + 1),
        peakRenderTime: Math.max(prev.peakRenderTime, renderTime),
        memoryPressure: (performance as any).memory ?
          (performance as any).memory.usedJSHeapSize > 100 * 1024 * 1024 : false
      }));
    });
  }, []);

  const resetMetrics = useCallback(() => {
    setPerformanceData({
      renderCount: 0,
      averageRenderTime: 0,
      peakRenderTime: 0,
      memoryPressure: false
    });
  }, []);

  return {
    performanceData,
    measureRender,
    resetMetrics
  };
}