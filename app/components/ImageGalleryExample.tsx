'use client';

import React, { useState } from 'react';
import ProgressiveImage, { ProgressiveImageGallery } from './ProgressiveImage';
import { useImageOptimization, useProgressiveImage } from '@/hooks/useImageOptimization';

// Example component demonstrating progressive image loading
export default function ImageGalleryExample() {
  const imageOptimizer = useImageOptimization({
    enableLazyLoading: true,
    enableWebP: true,
    quality: 85,
    maxConcurrentLoads: 4
  });

  const [viewMode, setViewMode] = useState<'single' | 'gallery'>('single');

  // Example image sources (replace with actual image URLs)
  const sampleImages = [
    {
      src: '/images/sample/landscape-1.jpg',
      alt: 'Beautiful landscape with mountains',
      width: 800,
      height: 600,
      blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8A0XGLjHYdCDTX+TV//9k='
    },
    {
      src: '/images/sample/portrait-1.jpg',
      alt: 'Portrait photography',
      width: 600,
      height: 800,
      blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8A0XGLjHYdCDTX+TV//9k='
    },
    {
      src: '/images/sample/square-1.jpg',
      alt: 'Square format image',
      width: 600,
      height: 600,
      blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8A0XGLjHYdCDTX+TV//9k='
    },
    {
      src: '/images/sample/wide-1.jpg',
      alt: 'Wide panoramic view',
      width: 1200,
      height: 400,
      blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8A0XGLjHYdCDTX+TV//9k='
    }
  ];

  const { globalLoadingState, getCacheStats, supportedFormats } = imageOptimizer;
  const cacheStats = getCacheStats();

  return (
    <div className="image-gallery-example p-6 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header with controls */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Progressive Image Loading Demo
          </h2>

          {/* View mode toggle */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setViewMode('single')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Single Image
            </button>
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Gallery View
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{globalLoadingState.loadedImages}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Loaded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{globalLoadingState.failedImages}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{cacheStats.totalCached}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cached</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(cacheStats.averageLoadTime)}ms
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Load</div>
            </div>
          </div>

          {/* Format support indicators */}
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Supported Formats:
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded ${
                supportedFormats.webp
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                WebP {supportedFormats.webp ? '✓' : '✗'}
              </span>
              <span className={`px-2 py-1 text-xs rounded ${
                supportedFormats.avif
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                AVIF {supportedFormats.avif ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'single' ? (
          <SingleImageDemo image={sampleImages[0]} />
        ) : (
          <div>
            <ProgressiveImageGallery
              images={sampleImages}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              itemClassName="progressive-image-16-9"
              priority={2} // Load first 2 images with priority
            />
          </div>
        )}

        {/* Loading indicator */}
        {globalLoadingState.isLoading && (
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Loading images...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Demo component for single image with detailed controls
function SingleImageDemo({ image }: { image: typeof ImageGalleryExample.prototype.sampleImages[0] }) {
  const [imageSettings, setImageSettings] = useState({
    width: image.width,
    height: image.height,
    quality: 75,
    priority: false
  });

  const progressiveImage = useProgressiveImage(image.src, {
    width: imageSettings.width,
    height: imageSettings.height,
    quality: imageSettings.quality,
    priority: imageSettings.priority
  });

  return (
    <div className="space-y-6">
      {/* Image controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Image Controls
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Width: {imageSettings.width}px
              </label>
              <input
                type="range"
                min="200"
                max="1200"
                value={imageSettings.width}
                onChange={(e) => setImageSettings(prev => ({
                  ...prev,
                  width: parseInt(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quality: {imageSettings.quality}%
              </label>
              <input
                type="range"
                min="20"
                max="100"
                value={imageSettings.quality}
                onChange={(e) => setImageSettings(prev => ({
                  ...prev,
                  quality: parseInt(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="priority"
                checked={imageSettings.priority}
                onChange={(e) => setImageSettings(prev => ({
                  ...prev,
                  priority: e.target.checked
                }))}
                className="mr-2"
              />
              <label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                High Priority Loading
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Image Info
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`font-medium ${
                progressiveImage.isLoaded
                  ? 'text-green-600'
                  : progressiveImage.isLoading
                    ? 'text-blue-600'
                    : progressiveImage.hasError
                      ? 'text-red-600'
                      : 'text-gray-600'
              }`}>
                {progressiveImage.isLoaded
                  ? 'Loaded'
                  : progressiveImage.isLoading
                    ? 'Loading...'
                    : progressiveImage.hasError
                      ? 'Error'
                      : 'Pending'}
              </span>
            </div>

            {progressiveImage.loadTime && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Load Time:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {progressiveImage.loadTime}ms
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {imageSettings.width} × {imageSettings.height}
              </span>
            </div>

            {progressiveImage.srcSet && (
              <div className="mt-2">
                <span className="text-gray-600 dark:text-gray-400">SrcSet:</span>
                <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs break-all">
                  {progressiveImage.srcSet}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progressive Image Display */}
      <div className="flex justify-center">
        <div className="max-w-2xl w-full">
          <ProgressiveImage
            src={image.src}
            alt={image.alt}
            width={imageSettings.width}
            height={imageSettings.height}
            blurDataURL={image.blurDataURL}
            quality={imageSettings.quality}
            priority={imageSettings.priority}
            className="rounded-lg overflow-hidden shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}