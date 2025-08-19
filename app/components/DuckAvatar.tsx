'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface DuckAvatarProps {
  imageUrl?: string;
  prompt?: string;
  isGenerating?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPrompt?: boolean;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16', 
  lg: 'w-24 h-24',
  xl: 'w-32 h-32'
};

export default function DuckAvatar({ 
  imageUrl, 
  prompt, 
  isGenerating = false,
  className = '',
  size = 'lg',
  showPrompt = false
}: DuckAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (isGenerating) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full animate-pulse flex items-center justify-center">
          <div className="text-lg animate-bounce">🦆</div>
        </div>
        {showPrompt && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Crafting your duck...
          </div>
        )}
      </div>
    );
  }

  if (!imageUrl || imageError) {
    // Default rubber duck avatar
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-2xl">🦆</span>
        </div>
        {showPrompt && prompt && (
          <div className="mt-2 text-xs text-gray-600 text-center max-w-32">
            {prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative group`}>
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full shadow-lg">
        <Image
          src={imageUrl}
          alt="Generated rubber duck avatar"
          fill
          className={`rounded-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          sizes={size === 'xl' ? '128px' : size === 'lg' ? '96px' : size === 'md' ? '64px' : '48px'}
          priority
        />
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-lg animate-pulse">🦆</div>
          </div>
        )}
      </div>
      
      {/* Hover effect - show prompt tooltip */}
      {showPrompt && prompt && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {prompt.length > 60 ? `${prompt.substring(0, 60)}...` : prompt}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  );
}