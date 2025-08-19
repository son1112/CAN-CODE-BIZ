'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { StarableType } from '@/models/Star';
import { useStars } from '@/hooks/useStars';
import { CreateStarOptions } from '@/lib/stars';

interface StarButtonProps {
  userId: string;
  itemType: StarableType;
  itemId: string;
  context?: {
    sessionId?: string;
    messageContent?: string;
    agentId?: string;
    snippet?: string;
    title?: string;
    description?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  onStarChange?: (isStarred: boolean) => void;
}

export default function StarButton({
  userId,
  itemType,
  itemId,
  context,
  size = 'md',
  showLabel = false,
  className = '',
  onStarChange,
}: StarButtonProps) {
  const { isStarred, starItem, unstarItem, isLoading } = useStars(userId);
  const [isHovered, setIsHovered] = useState(false);
  
  const starred = isStarred(itemType, itemId);
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-5 h-5';
      case 'lg': return 'w-6 h-6';
      default: return 'w-5 h-5';
    }
  };
  
  const getPaddingClasses = () => {
    switch (size) {
      case 'sm': return 'p-1';
      case 'md': return 'p-1.5';
      case 'lg': return 'p-2';
      default: return 'p-1.5';
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isLoading) return;
    
    try {
      if (starred) {
        const success = await unstarItem(itemType, itemId);
        if (success) {
          onStarChange?.(false);
        }
      } else {
        const starOptions: Omit<CreateStarOptions, 'userId'> = {
          itemType,
          itemId,
          context,
        };
        const success = await starItem(starOptions);
        if (success) {
          onStarChange?.(true);
        }
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        rounded-lg transition-all duration-200 flex items-center gap-1.5
        ${getPaddingClasses()}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}
        ${className}
      `}
      style={{
        color: starred ? '#eab308' : 'var(--text-tertiary)',
        backgroundColor: isHovered ? 'var(--bg-tertiary)' : 'transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={starred ? `Unstar this ${itemType}` : `Star this ${itemType}`}
    >
      {starred ? (
        <Star 
          className={`${getSizeClasses()} transition-colors duration-200`}
          fill="currentColor"
        />
      ) : (
        <Star 
          className={`${getSizeClasses()} transition-colors duration-200`}
        />
      )}
      
      {showLabel && (
        <span className="text-sm font-medium">
          {starred ? 'Starred' : 'Star'}
        </span>
      )}
      
      {isLoading && (
        <div 
          className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--text-tertiary)' }}
        />
      )}
    </button>
  );
}