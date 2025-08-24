'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  quality?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  srcSet?: string;
}

interface ImageLoadState {
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  isInView: boolean;
}

export default function ProgressiveImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+',
  blurDataURL,
  width,
  height,
  className = '',
  style = {},
  quality = 75,
  priority = false,
  loading = 'lazy',
  onLoad,
  onError,
  sizes,
  srcSet,
}: ProgressiveImageProps) {
  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileDevice = isMobile || isTablet;

  const imgRef = useRef<HTMLImageElement>(null);
  const [loadState, setLoadState] = useState<ImageLoadState>({
    isLoaded: false,
    isLoading: false,
    hasError: false,
    isInView: false
  });

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current || priority || loading === 'eager') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadState(prev => ({ ...prev, isInView: true }));
          observer.disconnect();
        }
      },
      {
        rootMargin: isMobileDevice ? '50px' : '100px', // Smaller preload margin on mobile
        threshold: 0.1
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority, loading, isMobileDevice]);

  // Handle image loading
  const handleImageLoad = useCallback(() => {
    setLoadState(prev => ({
      ...prev,
      isLoaded: true,
      isLoading: false,
      hasError: false
    }));
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setLoadState(prev => ({
      ...prev,
      isLoaded: false,
      isLoading: false,
      hasError: true
    }));
    onError?.();
  }, [onError]);

  const handleImageLoadStart = useCallback(() => {
    setLoadState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false
    }));
  }, []);

  // Determine if we should load the image
  const shouldLoadImage = priority || loading === 'eager' || loadState.isInView;

  // Generate optimized image URL
  const getOptimizedImageUrl = useCallback((originalSrc: string, targetWidth?: number): string => {
    // Return empty string for invalid sources
    if (!originalSrc || !originalSrc.trim()) {
      return '';
    }

    // For external images or data URLs, return as-is
    if (originalSrc.startsWith('http') || originalSrc.startsWith('data:')) {
      return originalSrc;
    }

    // For local images, we could implement Next.js Image optimization or similar
    // For now, return original source
    return originalSrc;
  }, []);

  // Generate responsive srcSet for different screen densities
  const getResponsiveSrcSet = useCallback((originalSrc: string, baseWidth?: number): string => {
    if (srcSet) return srcSet;
    if (!originalSrc || !originalSrc.trim() || !baseWidth) return '';

    const densities = [1, 1.5, 2, 3]; // 1x, 1.5x, 2x, 3x
    return densities
      .map(density => {
        const scaledWidth = Math.round(baseWidth * density);
        const optimizedSrc = getOptimizedImageUrl(originalSrc, scaledWidth);
        return optimizedSrc ? `${optimizedSrc} ${density}x` : '';
      })
      .filter(Boolean) // Remove empty strings
      .join(', ');
  }, [srcSet, getOptimizedImageUrl]);

  // Generate sizes attribute for responsive images
  const getResponsiveSizes = useCallback((): string => {
    if (sizes) return sizes;

    if (isMobileDevice) {
      return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw';
    }

    return '(max-width: 1024px) 50vw, 33vw';
  }, [sizes, isMobileDevice]);

  const optimizedSrc = getOptimizedImageUrl(src, width);
  const responsiveSrcSet = getResponsiveSrcSet(src, width);
  const responsiveSizes = getResponsiveSizes();

  return (
    <div
      className={`progressive-image-container relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        ...style
      }}
    >
      {/* Placeholder/Blur background */}
      {!loadState.isLoaded && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : `url(${placeholder})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: blurDataURL ? 'blur(10px)' : 'none',
            transform: blurDataURL ? 'scale(1.1)' : 'none', // Prevent blur edges
          }}
        />
      )}

      {/* Loading skeleton */}
      {loadState.isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Error state */}
      {loadState.hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <svg
            className="w-8 h-8 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Main Image */}
      {shouldLoadImage && !loadState.hasError && src && src.trim() && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={responsiveSrcSet || undefined}
          sizes={responsiveSizes}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onLoadStart={handleImageLoadStart}
          className={`progressive-image transition-opacity duration-500 ${
            loadState.isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          decoding="async"
        />
      )}

      {/* Progressive loading indicator */}
      {loadState.isLoading && (
        <div className="absolute bottom-2 right-2">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// Custom hook for managing progressive image loading state
export function useProgressiveImageLoading(src: string, options: {
  preload?: boolean;
  quality?: number;
  width?: number;
  height?: number;
} = {}) {
  const { preload = false, quality = 75, width, height } = options;
  const [loadState, setLoadState] = useState({
    isLoaded: false,
    isLoading: false,
    hasError: false,
    loadedSrc: null as string | null
  });

  const preloadImage = useCallback(async (imageSrc: string): Promise<void> => {
    // Don't attempt to load empty or invalid sources
    if (!imageSrc || !imageSrc.trim()) {
      setLoadState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true
      }));
      return Promise.reject(new Error('Invalid image source'));
    }

    setLoadState(prev => ({ ...prev, isLoading: true, hasError: false }));

    try {
      const img = new Image();

      return new Promise((resolve, reject) => {
        img.onload = () => {
          setLoadState({
            isLoaded: true,
            isLoading: false,
            hasError: false,
            loadedSrc: imageSrc
          });
          resolve();
        };

        img.onerror = () => {
          setLoadState(prev => ({
            ...prev,
            isLoading: false,
            hasError: true
          }));
          reject(new Error(`Failed to load image: ${imageSrc}`));
        };

        img.src = imageSrc;
      });
    } catch (error) {
      setLoadState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true
      }));
    }
  }, []);

  useEffect(() => {
    if (preload && src && src.trim()) {
      preloadImage(src);
    }
  }, [src, preload, preloadImage]);

  return {
    ...loadState,
    preloadImage
  };
}

// Progressive Image Gallery component
export function ProgressiveImageGallery({
  images,
  className = '',
  itemClassName = '',
  priority = 0,
}: {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
    placeholder?: string;
    blurDataURL?: string;
  }>;
  className?: string;
  itemClassName?: string;
  priority?: number; // Number of images to load with priority
}) {
  return (
    <div className={`progressive-image-gallery ${className}`}>
      {images.map((image, index) => (
        <div key={index} className={`progressive-image-gallery-item ${itemClassName}`}>
          <ProgressiveImage
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            placeholder={image.placeholder}
            blurDataURL={image.blurDataURL}
            priority={index < priority}
            loading={index < priority ? 'eager' : 'lazy'}
            className="w-full h-full"
          />
        </div>
      ))}
    </div>
  );
}

// Utility for generating blur data URLs (for use with static images)
export function generateBlurDataURL(
  width: number = 8,
  height: number = 8,
  color: string = '#f3f4f6'
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = width;
  canvas.height = height;

  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }

  return canvas.toDataURL('image/jpeg', 0.1);
}