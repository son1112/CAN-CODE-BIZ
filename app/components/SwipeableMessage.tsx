'use client';

import { useRef, useState, useEffect } from 'react';
import { Star, Archive, Download, RotateCcw } from 'lucide-react';
import { Message } from '@/types';
import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import MobileOptimizedMessage from './MobileOptimizedMessage';

interface SwipeAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  label: string;
  action: () => void;
}

interface SwipeableMessageProps {
  message: Message;
  isStreaming?: boolean;
  userId?: string;
  sessionId: string;
  isArchived: boolean;
  isFailedMessage?: boolean;
  onArchiveToggle: (messageId: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onStarMessage?: (messageId: string) => void;
  onExportMessage?: (messageId: string) => void;
  className?: string;
}

export default function SwipeableMessage({
  message,
  isStreaming = false,
  userId,
  sessionId,
  isArchived,
  isFailedMessage = false,
  onArchiveToggle,
  onRetryMessage,
  onStarMessage,
  onExportMessage,
  className = '',
}: SwipeableMessageProps) {
  const { isMobile, isTablet } = useMobileNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showActions, setShowActions] = useState(false);

  const isMobileDevice = isMobile || isTablet;
  const isUser = message.role === 'user';

  // Define swipe actions based on message type and state
  const leftSwipeActions: SwipeAction[] = [
    // Star action (if user is logged in)
    ...(userId ? [{
      id: 'star',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      label: 'Star',
      action: () => onStarMessage?.(message.id),
    }] : []),

    // Export action
    {
      id: 'export',
      icon: Download,
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      label: 'Export',
      action: () => onExportMessage?.(message.id),
    },
  ];

  const rightSwipeActions: SwipeAction[] = [
    // Archive action
    {
      id: 'archive',
      icon: Archive,
      color: isArchived ? 'text-blue-600' : 'text-gray-600',
      bgColor: isArchived ? 'bg-blue-500' : 'bg-gray-500',
      label: isArchived ? 'Unarchive' : 'Archive',
      action: () => onArchiveToggle(message.id),
    },

    // Retry action (for user messages)
    ...(isUser && onRetryMessage ? [{
      id: 'retry',
      icon: RotateCcw,
      color: isFailedMessage ? 'text-red-600' : 'text-blue-600',
      bgColor: isFailedMessage ? 'bg-red-500' : 'bg-blue-500',
      label: 'Retry',
      action: () => onRetryMessage(message.id),
    }] : []),
  ];

  // Handle swipe gestures
  const { swipeState, bindToElement } = useSwipeGestures({
    threshold: 80,
    restraint: 120,
    allowedTime: 400,
    preventDefault: false, // Allow scrolling
    onSwipeLeft: () => {
      if (!isMobileDevice || leftSwipeActions.length === 0) return;

      // Execute first left swipe action (star or export)
      leftSwipeActions[0]?.action();

      // Show visual feedback
      setSwipeDirection('left');
      setTimeout(() => setSwipeDirection(null), 300);
    },
    onSwipeRight: () => {
      if (!isMobileDevice || rightSwipeActions.length === 0) return;

      // Execute first right swipe action (archive)
      rightSwipeActions[0]?.action();

      // Show visual feedback
      setSwipeDirection('right');
      setTimeout(() => setSwipeDirection(null), 300);
    },
  });

  // Bind swipe gestures to container
  useEffect(() => {
    if (containerRef.current && isMobileDevice) {
      bindToElement(containerRef.current);
    }
  }, [bindToElement, isMobileDevice]);

  // Calculate action visibility and styling based on swipe progress
  const getSwipeStyles = () => {
    if (!swipeState.isActive || !isMobileDevice) {
      return { transform: 'translateX(0)', opacity: 1 };
    }

    const progress = Math.min(swipeState.progress, 1);
    const maxTranslate = 60; // Maximum translation distance

    if (swipeState.direction === 'left') {
      return {
        transform: `translateX(-${progress * maxTranslate}px)`,
        opacity: 1 - (progress * 0.2),
      };
    } else if (swipeState.direction === 'right') {
      return {
        transform: `translateX(${progress * maxTranslate}px)`,
        opacity: 1 - (progress * 0.2),
      };
    }

    return { transform: 'translateX(0)', opacity: 1 };
  };

  // Render swipe action indicators
  const renderSwipeIndicators = () => {
    if (!isMobileDevice || !swipeState.isActive) return null;

    const actions = swipeState.direction === 'left' ? leftSwipeActions : rightSwipeActions;
    const action = actions[0];

    if (!action) return null;

    const isLeft = swipeState.direction === 'left';
    const progress = swipeState.progress;
    const IconComponent = action.icon;

    return (
      <div
        className={`absolute inset-y-0 ${isLeft ? 'right-0' : 'left-0'} flex items-center justify-center`}
        style={{
          width: `${Math.min(progress * 100, 80)}px`,
          backgroundColor: action.bgColor,
          opacity: progress,
        }}
      >
        <div className="flex flex-col items-center justify-center text-white">
          <IconComponent className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{action.label}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className} ${
        swipeDirection ? 'swipe-feedback' : ''
      } ${swipeState.isActive ? 'swipe-active' : ''}`}
      style={{
        touchAction: 'pan-y', // Allow vertical scrolling but capture horizontal swipes
      }}
    >
      {/* Swipe action indicators */}
      {renderSwipeIndicators()}

      {/* Message content with swipe transform */}
      <div
        className="transition-transform duration-150 ease-out"
        style={getSwipeStyles()}
      >
        <MobileOptimizedMessage
          message={message}
          isStreaming={isStreaming}
          userId={userId}
          sessionId={sessionId}
          isArchived={isArchived}
          isFailedMessage={isFailedMessage}
          onArchiveToggle={onArchiveToggle}
          onRetryMessage={onRetryMessage}
        />
      </div>

      {/* Swipe feedback overlay */}
      {swipeDirection && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            swipeDirection === 'left' ? 'bg-green-500/10' : 'bg-blue-500/10'
          }`}
        />
      )}
    </div>
  );
}