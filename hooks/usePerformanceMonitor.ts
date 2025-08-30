'use client';

import { useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime?: number;
}

export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  const logMetrics = useCallback((metrics: Partial<PerformanceMetrics>) => {
    logger.debug(`[component=${componentName}] Performance metrics`, metrics);
  }, [componentName]);

  // Track component mount/render time
  useEffect(() => {
    const renderTime = performance.now() - startTime;
    logMetrics({ renderTime });

    // Track Core Web Vitals if available
    if ('web-vitals' in window) {
      // This would integrate with web-vitals library if needed
    }

    // Track cumulative layout shift and other performance metrics
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          logMetrics({
            loadTime: navEntry.loadEventEnd - navEntry.startTime,
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    } catch (error) {
      // PerformanceObserver not supported in all browsers
      logger.debug(`[component=${componentName}] PerformanceObserver not supported`);
    }

    return () => {
      try {
        observer.disconnect();
      } catch (error) {
        // Observer may not exist
      }
    };
  }, [componentName, logMetrics, startTime]);

  // Track interaction timing
  const trackInteraction = useCallback((interactionName: string) => {
    const interactionTime = performance.now();
    logMetrics({ 
      interactionTime: interactionTime - startTime,
    });
    logger.debug(`[component=${componentName}] User interaction: ${interactionName}`);
  }, [componentName, logMetrics, startTime]);

  return { trackInteraction };
}