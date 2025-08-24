'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMobileNavigation } from './useMobileNavigation';

interface ImageOptimizationOptions {
  enableLazyLoading?: boolean;
  enableWebP?: boolean;
  enableAVIF?: boolean;
  quality?: number;
  preloadCritical?: boolean;
  maxConcurrentLoads?: number;
  retryAttempts?: number;
  cacheEnabled?: boolean;
}

interface OptimizedImageData {
  src: string;
  srcSet?: string;
  sizes?: string;
  placeholder?: string;
  blurDataURL?: string;
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  loadTime?: number;
}

interface ImageLoadQueue {
  id: string;
  src: string;
  priority: number;
  retryCount: number;
  resolve: (data: OptimizedImageData) => void;
  reject: (error: Error) => void;
}

export function useImageOptimization(options: ImageOptimizationOptions = {}) {
  const {
    enableLazyLoading = true,
    enableWebP = true,
    enableAVIF = false,
    quality = 75,
    preloadCritical = true,
    maxConcurrentLoads = 3,
    retryAttempts = 2,
    cacheEnabled = true
  } = options;

  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileDevice = isMobile || isTablet;

  const imageCache = useRef<Map<string, OptimizedImageData>>(new Map());
  const loadQueue = useRef<ImageLoadQueue[]>([]);
  const activeLoads = useRef<Set<string>>(new Set());
  const [globalLoadingState, setGlobalLoadingState] = useState({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    isLoading: false
  });

  // Format detection
  const [supportedFormats, setSupportedFormats] = useState({
    webp: false,
    avif: false,
    heic: false
  });

  useEffect(() => {
    detectImageFormats();
  }, []);

  const detectImageFormats = useCallback(async () => {
    const formats = {
      webp: await supportsImageFormat('webp'),
      avif: await supportsImageFormat('avif'),
      heic: await supportsImageFormat('heic')
    };
    setSupportedFormats(formats);
  }, []);

  const supportsImageFormat = useCallback(async (format: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width === 1);
      img.onerror = () => resolve(false);

      switch (format) {
        case 'webp':
          img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
          break;
        case 'avif':
          img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZgAAAOptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA==';
          break;
        case 'heic':
          img.src = 'data:image/heic;base64,AAAAGGZ0eXBoZWljAAAAAG1pZjEAAAAoaGVpYwAAACFpbG9jAAAAREAAAAEAAQAAAAEAAAAAAAEAAAAAAAAAAAAAAAUAAAFgAAA=';
          break;
        default:
          resolve(false);
      }
    });
  }, []);

  // Optimize image URL with format detection and quality settings
  const optimizeImageUrl = useCallback((
    originalSrc: string,
    width?: number,
    height?: number,
    targetQuality?: number
  ): string => {
    // Skip optimization for data URLs or already optimized images
    if (originalSrc.startsWith('data:') || originalSrc.includes('/_next/image')) {
      return originalSrc;
    }

    let optimizedSrc = originalSrc;
    const imageQuality = targetQuality || quality;

    // Add quality parameter if supported by the image service
    if (originalSrc.includes('?')) {
      optimizedSrc += `&q=${imageQuality}`;
    } else {
      optimizedSrc += `?q=${imageQuality}`;
    }

    // Add dimensions if specified
    if (width) optimizedSrc += `&w=${width}`;
    if (height) optimizedSrc += `&h=${height}`;

    // Format selection based on browser support
    if (enableAVIF && supportedFormats.avif) {
      optimizedSrc += '&f=avif';
    } else if (enableWebP && supportedFormats.webp) {
      optimizedSrc += '&f=webp';
    }

    return optimizedSrc;
  }, [quality, enableWebP, enableAVIF, supportedFormats]);

  // Generate responsive srcSet
  const generateSrcSet = useCallback((
    originalSrc: string,
    baseWidth?: number
  ): string => {
    if (!baseWidth) return '';

    const breakpoints = isMobileDevice
      ? [375, 640, 768, 1024]
      : [640, 768, 1024, 1280, 1536];

    return breakpoints
      .filter(width => width >= (baseWidth * 0.5)) // Don't generate smaller than 50% of base
      .map(width => {
        const optimizedSrc = optimizeImageUrl(originalSrc, width);
        return `${optimizedSrc} ${width}w`;
      })
      .join(', ');
  }, [isMobileDevice, optimizeImageUrl]);

  // Generate sizes attribute for responsive images
  const generateSizes = useCallback((maxWidth?: number): string => {
    const defaultSizes = isMobileDevice
      ? '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw'
      : '(max-width: 1024px) 50vw, 33vw';

    if (maxWidth) {
      return `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`;
    }

    return defaultSizes;
  }, [isMobileDevice]);

  // Process load queue
  const processLoadQueue = useCallback(() => {
    if (loadQueue.current.length === 0 || activeLoads.current.size >= maxConcurrentLoads) {
      return;
    }

    // Sort by priority (higher number = higher priority)
    loadQueue.current.sort((a, b) => b.priority - a.priority);

    const item = loadQueue.current.shift();
    if (!item) return;

    activeLoads.current.add(item.id);
    loadImageWithRetry(item);
  }, [maxConcurrentLoads]);

  // Load image with retry logic
  const loadImageWithRetry = useCallback(async (queueItem: ImageLoadQueue) => {
    const startTime = Date.now();

    try {
      const img = new Image();

      const loadPromise = new Promise<OptimizedImageData>((resolve, reject) => {
        img.onload = () => {
          const loadTime = Date.now() - startTime;
          const imageData: OptimizedImageData = {
            src: queueItem.src,
            isLoaded: true,
            isLoading: false,
            hasError: false,
            loadTime
          };

          // Cache the loaded image
          if (cacheEnabled) {
            imageCache.current.set(queueItem.src, imageData);
          }

          resolve(imageData);
        };

        img.onerror = () => {
          reject(new Error(`Failed to load image: ${queueItem.src}`));
        };
      });

      img.src = queueItem.src;
      const imageData = await loadPromise;

      queueItem.resolve(imageData);
      setGlobalLoadingState(prev => ({
        ...prev,
        loadedImages: prev.loadedImages + 1,
        isLoading: prev.totalImages > prev.loadedImages + prev.failedImages + 1
      }));

    } catch (error) {
      if (queueItem.retryCount < retryAttempts) {
        queueItem.retryCount++;
        loadQueue.current.push(queueItem);
      } else {
        queueItem.reject(error as Error);
        setGlobalLoadingState(prev => ({
          ...prev,
          failedImages: prev.failedImages + 1,
          isLoading: prev.totalImages > prev.loadedImages + prev.failedImages
        }));
      }
    } finally {
      activeLoads.current.delete(queueItem.id);
      processLoadQueue(); // Process next item in queue
    }
  }, [retryAttempts, cacheEnabled, processLoadQueue]);

  // Load optimized image
  const loadOptimizedImage = useCallback((
    src: string,
    options: {
      width?: number;
      height?: number;
      priority?: number;
      quality?: number;
    } = {}
  ): Promise<OptimizedImageData> => {
    const { width, height, priority = 0, quality: customQuality } = options;
    const optimizedSrc = optimizeImageUrl(src, width, height, customQuality);

    // Check cache first
    if (cacheEnabled && imageCache.current.has(optimizedSrc)) {
      const cachedData = imageCache.current.get(optimizedSrc)!;
      return Promise.resolve(cachedData);
    }

    return new Promise((resolve, reject) => {
      const queueItem: ImageLoadQueue = {
        id: `${optimizedSrc}-${Date.now()}`,
        src: optimizedSrc,
        priority,
        retryCount: 0,
        resolve,
        reject
      };

      loadQueue.current.push(queueItem);
      setGlobalLoadingState(prev => ({
        ...prev,
        totalImages: prev.totalImages + 1,
        isLoading: true
      }));

      processLoadQueue();
    });
  }, [optimizeImageUrl, cacheEnabled, processLoadQueue]);

  // Preload critical images
  const preloadImages = useCallback(async (
    sources: string[],
    options: { priority?: number; width?: number; height?: number } = {}
  ) => {
    if (!preloadCritical) return;

    const { priority = 100, width, height } = options;

    const preloadPromises = sources.map(src =>
      loadOptimizedImage(src, { width, height, priority })
    );

    try {
      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.warn('Some critical images failed to preload:', error);
    }
  }, [preloadCritical, loadOptimizedImage]);

  // Clear image cache
  const clearCache = useCallback(() => {
    imageCache.current.clear();
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const cache = imageCache.current;
    const totalSize = cache.size;
    let loadedCount = 0;
    let totalLoadTime = 0;

    cache.forEach(data => {
      if (data.isLoaded) {
        loadedCount++;
        if (data.loadTime) {
          totalLoadTime += data.loadTime;
        }
      }
    });

    return {
      totalCached: totalSize,
      loaded: loadedCount,
      averageLoadTime: loadedCount > 0 ? totalLoadTime / loadedCount : 0,
      cacheSize: cache.size
    };
  }, []);

  return {
    // Image optimization functions
    optimizeImageUrl,
    generateSrcSet,
    generateSizes,
    loadOptimizedImage,
    preloadImages,

    // State and statistics
    supportedFormats,
    globalLoadingState,
    getCacheStats,
    clearCache,

    // Queue management
    activeLoadsCount: activeLoads.current.size,
    queueLength: loadQueue.current.length,

    // Configuration
    isMobileDevice,
    maxConcurrentLoads,
    cacheEnabled
  };
}

// Hook for managing progressive image loading in components
export function useProgressiveImage(
  src: string,
  options: {
    width?: number;
    height?: number;
    priority?: boolean;
    quality?: number;
    generateSrcSet?: boolean;
    placeholder?: string;
  } = {}
) {
  const {
    width,
    height,
    priority = false,
    quality,
    generateSrcSet = true,
    placeholder
  } = options;

  const imageOptimizer = useImageOptimization();
  const [imageData, setImageData] = useState<OptimizedImageData>({
    src,
    isLoaded: false,
    isLoading: false,
    hasError: false
  });

  useEffect(() => {
    if (!src) return;

    setImageData(prev => ({ ...prev, isLoading: true, hasError: false }));

    const loadImage = async () => {
      try {
        const optimizedData = await imageOptimizer.loadOptimizedImage(src, {
          width,
          height,
          priority: priority ? 100 : 0,
          quality
        });

        const enhancedData: OptimizedImageData = {
          ...optimizedData,
          srcSet: generateSrcSet ? imageOptimizer.generateSrcSet(src, width) : undefined,
          sizes: imageOptimizer.generateSizes(width),
          placeholder
        };

        setImageData(enhancedData);
      } catch (error) {
        setImageData(prev => ({
          ...prev,
          isLoading: false,
          hasError: true
        }));
      }
    };

    loadImage();
  }, [src, width, height, priority, quality, generateSrcSet, placeholder, imageOptimizer]);

  return {
    ...imageData,
    optimizeImageUrl: imageOptimizer.optimizeImageUrl,
    supportedFormats: imageOptimizer.supportedFormats
  };
}