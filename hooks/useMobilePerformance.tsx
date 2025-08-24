'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useMobileNavigation } from './useMobileNavigation';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay  
  cls?: number; // Cumulative Layout Shift
  
  // Performance metrics
  ttfb?: number; // Time to First Byte
  fcp?: number;  // First Contentful Paint
  
  // Memory metrics (if available)
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
  
  // Network metrics
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  
  // Custom metrics
  frameDrops: number;
  longTasks: number;
  memoryPressure: 'low' | 'medium' | 'high';
  batteryLevel?: number;
  isCharging?: boolean;
}

interface PerformanceAlert {
  type: 'warning' | 'error';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
}

interface MobilePerformanceOptions {
  enabled?: boolean;
  trackWebVitals?: boolean;
  trackMemory?: boolean;
  trackNetwork?: boolean;
  trackBattery?: boolean;
  alertThresholds?: {
    lcp?: number;
    fid?: number;  
    cls?: number;
    memoryUsage?: number;
    frameDrops?: number;
  };
  onAlert?: (alert: PerformanceAlert) => void;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  debugMode?: boolean;
}

export function useMobilePerformance(options: MobilePerformanceOptions = {}) {
  const {
    enabled = true,
    trackWebVitals = true,
    trackMemory = true,
    trackNetwork = true,
    trackBattery = false,
    alertThresholds = {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      memoryUsage: 0.8,
      frameDrops: 10
    },
    onAlert,
    onMetricsUpdate,
    debugMode = false
  } = options;

  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileDevice = isMobile || isTablet;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    frameDrops: 0,
    longTasks: 0,
    memoryPressure: 'low'
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const observersRef = useRef<{
    lcpObserver?: PerformanceObserver;
    fidObserver?: PerformanceObserver;
    clsObserver?: PerformanceObserver;
    longTaskObserver?: PerformanceObserver;
  }>({});

  const frameCountRef = useRef(0);
  const droppedFramesRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  // Debug logging
  const debugLog = useCallback((message: string, data?: any) => {
    if (debugMode) {
      console.log(`[MobilePerformance] ${message}`, data || '');
    }
  }, [debugMode]);

  // Create performance alert
  const createAlert = useCallback((
    type: 'warning' | 'error',
    metric: string,
    value: number,
    threshold: number,
    message: string
  ) => {
    const alert: PerformanceAlert = {
      type,
      metric,
      value,
      threshold,
      message,
      timestamp: new Date()
    };

    setAlerts(prev => [...prev.slice(-9), alert]); // Keep last 10 alerts
    onAlert?.(alert);
    debugLog(`Performance Alert: ${message}`, alert);

    return alert;
  }, [onAlert, debugLog]);

  // Check thresholds and create alerts
  const checkThresholds = useCallback((updatedMetrics: PerformanceMetrics) => {
    if (!alertThresholds) return;

    // LCP threshold check
    if (updatedMetrics.lcp && alertThresholds.lcp && updatedMetrics.lcp > alertThresholds.lcp) {
      createAlert(
        'warning',
        'lcp',
        updatedMetrics.lcp,
        alertThresholds.lcp,
        `Largest Contentful Paint is slow: ${updatedMetrics.lcp}ms (threshold: ${alertThresholds.lcp}ms)`
      );
    }

    // FID threshold check
    if (updatedMetrics.fid && alertThresholds.fid && updatedMetrics.fid > alertThresholds.fid) {
      createAlert(
        'warning',
        'fid',
        updatedMetrics.fid,
        alertThresholds.fid,
        `First Input Delay is high: ${updatedMetrics.fid}ms (threshold: ${alertThresholds.fid}ms)`
      );
    }

    // CLS threshold check
    if (updatedMetrics.cls && alertThresholds.cls && updatedMetrics.cls > alertThresholds.cls) {
      createAlert(
        'warning',
        'cls',
        updatedMetrics.cls,
        alertThresholds.cls,
        `Cumulative Layout Shift is high: ${updatedMetrics.cls} (threshold: ${alertThresholds.cls})`
      );
    }

    // Memory usage check
    if (updatedMetrics.usedJSHeapSize && updatedMetrics.jsHeapSizeLimit && alertThresholds.memoryUsage) {
      const memoryUsage = updatedMetrics.usedJSHeapSize / updatedMetrics.jsHeapSizeLimit;
      if (memoryUsage > alertThresholds.memoryUsage) {
        createAlert(
          'error',
          'memory',
          memoryUsage,
          alertThresholds.memoryUsage,
          `High memory usage: ${Math.round(memoryUsage * 100)}% (threshold: ${Math.round(alertThresholds.memoryUsage * 100)}%)`
        );
      }
    }

    // Frame drops check
    if (updatedMetrics.frameDrops && alertThresholds.frameDrops && updatedMetrics.frameDrops > alertThresholds.frameDrops) {
      createAlert(
        'warning',
        'frameDrops',
        updatedMetrics.frameDrops,
        alertThresholds.frameDrops,
        `High frame drops detected: ${updatedMetrics.frameDrops} (threshold: ${alertThresholds.frameDrops})`
      );
    }
  }, [alertThresholds, createAlert]);

  // Update metrics and trigger callbacks
  const updateMetrics = useCallback((newMetrics: Partial<PerformanceMetrics>) => {
    setMetrics(prev => {
      const updated = { ...prev, ...newMetrics };
      
      // Check thresholds
      checkThresholds(updated);
      
      // Fire callback
      onMetricsUpdate?.(updated);
      
      return updated;
    });
  }, [checkThresholds, onMetricsUpdate]);

  // Web Vitals measurement
  const measureWebVitals = useCallback(() => {
    if (!trackWebVitals || typeof window === 'undefined') return;

    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            updateMetrics({ lcp: lastEntry.startTime });
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        observersRef.current.lcpObserver = lcpObserver;
      } catch (error) {
        debugLog('LCP observer failed', error);
      }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            updateMetrics({ fid: entry.processingStart - entry.startTime });
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        observersRef.current.fidObserver = fidObserver;
      } catch (error) {
        debugLog('FID observer failed', error);
      }

      // CLS (Cumulative Layout Shift)
      try {
        let clsScore = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
              updateMetrics({ cls: clsScore });
            }
          });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        observersRef.current.clsObserver = clsObserver;
      } catch (error) {
        debugLog('CLS observer failed', error);
      }

      // Long Tasks
      try {
        const longTaskObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          updateMetrics({ longTasks: entries.length });
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
        observersRef.current.longTaskObserver = longTaskObserver;
      } catch (error) {
        debugLog('Long task observer failed', error);
      }
    }

    // Navigation timing
    if (window.performance?.timing) {
      const timing = window.performance.timing;
      const ttfb = timing.responseStart - timing.navigationStart;
      updateMetrics({ ttfb });
    }

    // Paint timing
    if (window.performance?.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        updateMetrics({ fcp: fcpEntry.startTime });
      }
    }
  }, [trackWebVitals, updateMetrics, debugLog]);

  // Memory monitoring
  const measureMemory = useCallback(() => {
    if (!trackMemory || typeof window === 'undefined') return;

    // JavaScript heap size
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      const memoryMetrics = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
      
      // Determine memory pressure
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      const memoryPressure: 'low' | 'medium' | 'high' = 
        usageRatio > 0.8 ? 'high' :
        usageRatio > 0.6 ? 'medium' : 'low';

      updateMetrics({ ...memoryMetrics, memoryPressure });
    }
  }, [trackMemory, updateMetrics]);

  // Network monitoring
  const measureNetwork = useCallback(() => {
    if (!trackNetwork || typeof navigator === 'undefined') return;

    // Network Information API
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      updateMetrics({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });
    }
  }, [trackNetwork, updateMetrics]);

  // Battery monitoring
  const measureBattery = useCallback(async () => {
    if (!trackBattery || typeof navigator === 'undefined') return;

    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        updateMetrics({
          batteryLevel: battery.level,
          isCharging: battery.charging
        });
      }
    } catch (error) {
      debugLog('Battery measurement failed', error);
    }
  }, [trackBattery, updateMetrics, debugLog]);

  // Frame rate monitoring
  const measureFrameRate = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    const checkFrame = (timestamp: number) => {
      frameCountRef.current++;
      
      if (lastFrameTimeRef.current) {
        const frameDelta = timestamp - lastFrameTimeRef.current;
        
        // Expected frame time at 60fps is ~16.67ms
        if (frameDelta > 20) { // Frame took longer than expected
          droppedFramesRef.current++;
        }
      }
      
      lastFrameTimeRef.current = timestamp;
      
      // Update metrics every 60 frames
      if (frameCountRef.current % 60 === 0) {
        updateMetrics({ frameDrops: droppedFramesRef.current });
        droppedFramesRef.current = 0; // Reset counter
      }
      
      requestAnimationFrame(checkFrame);
    };

    requestAnimationFrame(checkFrame);
  }, [enabled, updateMetrics]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!enabled || !isMobileDevice || isMonitoring) return;

    debugLog('Starting performance monitoring');
    setIsMonitoring(true);

    // Initial measurements
    measureWebVitals();
    measureMemory();
    measureNetwork();
    measureBattery();
    measureFrameRate();

    // Set up periodic measurements
    const memoryInterval = setInterval(measureMemory, 5000); // Every 5 seconds
    const networkInterval = setInterval(measureNetwork, 10000); // Every 10 seconds
    const batteryInterval = setInterval(measureBattery, 30000); // Every 30 seconds

    return () => {
      clearInterval(memoryInterval);
      clearInterval(networkInterval);  
      clearInterval(batteryInterval);
    };
  }, [enabled, isMobileDevice, isMonitoring, measureWebVitals, measureMemory, measureNetwork, measureBattery, measureFrameRate, debugLog]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    debugLog('Stopping performance monitoring');
    setIsMonitoring(false);

    // Disconnect observers
    Object.values(observersRef.current).forEach(observer => {
      observer?.disconnect();
    });
    observersRef.current = {};
  }, [isMonitoring, debugLog]);

  // Initialize monitoring
  useEffect(() => {
    if (enabled && isMobileDevice) {
      const cleanup = startMonitoring();
      return cleanup;
    } else {
      stopMonitoring();
    }
  }, [enabled, isMobileDevice, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Performance optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];

    if (metrics.lcp && metrics.lcp > 2500) {
      suggestions.push('Consider optimizing images and reducing bundle size for better LCP');
    }

    if (metrics.memoryPressure === 'high') {
      suggestions.push('High memory usage detected - consider lazy loading and cleanup');
    }

    if (metrics.frameDrops > 10) {
      suggestions.push('Frame drops detected - review animations and heavy computations');
    }

    if (metrics.longTasks > 5) {
      suggestions.push('Multiple long tasks detected - consider breaking up heavy operations');
    }

    return suggestions;
  }, [metrics]);

  return {
    // State
    metrics,
    alerts,
    isMonitoring,
    
    // Controls
    startMonitoring,
    stopMonitoring,
    
    // Utilities
    getOptimizationSuggestions,
    
    // Device info
    isMobileDevice,
    
    // Performance status
    isGoodPerformance: metrics.lcp ? metrics.lcp < 2500 : true,
    memoryPressure: metrics.memoryPressure,
    hasPerformanceIssues: alerts.some(alert => alert.type === 'error')
  };
}