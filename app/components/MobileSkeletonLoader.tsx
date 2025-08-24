'use client';

import { useMobileNavigation } from '@/hooks/useMobileNavigation';

interface MobileSkeletonLoaderProps {
  type: 'message' | 'session' | 'session-list' | 'chat-input' | 'header';
  count?: number;
  className?: string;
}

export default function MobileSkeletonLoader({
  type,
  count = 1,
  className = ''
}: MobileSkeletonLoaderProps) {
  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileLayout = isMobile || isTablet;

  const renderMessageSkeleton = () => (
    <div className={`p-4 mb-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Avatar skeleton */}
        <div className={`
          rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0
          ${isMobileLayout ? 'w-8 h-8' : 'w-10 h-10'}
        `} />

        {/* Message content skeleton */}
        <div className="flex-1 space-y-2">
          {/* Message header */}
          <div className="flex items-center space-x-2">
            <div className={`
              h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse
              ${isMobileLayout ? 'w-16' : 'w-20'}
            `} />
            <div className={`
              h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse
              ${isMobileLayout ? 'w-12' : 'w-16'}
            `} />
          </div>

          {/* Message text lines */}
          <div className="space-y-2">
            <div className={`
              h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse
              ${isMobileLayout ? 'w-full' : 'w-3/4'}
            `} />
            <div className={`
              h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse
              ${isMobileLayout ? 'w-4/5' : 'w-2/3'}
            `} />
            <div className={`
              h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse
              ${isMobileLayout ? 'w-3/5' : 'w-1/2'}
            `} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSessionSkeleton = () => (
    <div className={`
      border rounded-lg p-4 mb-3 bg-white dark:bg-gray-800 animate-pulse
      ${isMobileLayout ? 'border-gray-200 dark:border-gray-700' : ''}
      ${className}
    `}>
      <div className="flex items-center space-x-3">
        {/* Session avatar */}
        <div className={`
          rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0
          ${isMobileLayout ? 'w-10 h-10' : 'w-12 h-12'}
        `} />

        <div className="flex-1 min-w-0">
          {/* Session title */}
          <div className={`
            h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2
            ${isMobileLayout ? 'w-3/4' : 'w-2/3'}
          `} />

          {/* Session metadata */}
          <div className="flex items-center space-x-4">
            <div className={`
              h-3 bg-gray-200 dark:bg-gray-700 rounded
              ${isMobileLayout ? 'w-16' : 'w-20'}
            `} />
            <div className={`
              h-3 bg-gray-200 dark:bg-gray-700 rounded
              ${isMobileLayout ? 'w-12' : 'w-16'}
            `} />
            {!isMobileLayout && (
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSessionListSkeleton = () => (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          {renderSessionSkeleton()}
        </div>
      ))}
    </div>
  );

  const renderChatInputSkeleton = () => (
    <div className={`
      border rounded-lg p-4 bg-white dark:bg-gray-800 animate-pulse
      ${isMobileLayout ? 'mx-4 mb-4' : 'mx-6 mb-6'}
      ${className}
    `}>
      <div className="space-y-3">
        {/* Input field skeleton */}
        <div className={`
          h-12 bg-gray-200 dark:bg-gray-700 rounded-lg
          ${isMobileLayout ? 'w-full' : 'w-full'}
        `} />

        {/* Button group skeleton */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <div className={`
              bg-gray-200 dark:bg-gray-700 rounded-lg
              ${isMobileLayout ? 'w-8 h-8' : 'w-10 h-10'}
            `} />
            <div className={`
              bg-gray-200 dark:bg-gray-700 rounded-lg
              ${isMobileLayout ? 'w-8 h-8' : 'w-10 h-10'}
            `} />
          </div>

          <div className={`
            bg-gray-200 dark:bg-gray-700 rounded-lg
            ${isMobileLayout ? 'w-16 h-8' : 'w-20 h-10'}
          `} />
        </div>
      </div>
    </div>
  );

  const renderHeaderSkeleton = () => (
    <div className={`
      border-b p-4 bg-white dark:bg-gray-800 animate-pulse
      ${isMobileLayout ? 'border-gray-200 dark:border-gray-700' : ''}
      ${className}
    `}>
      <div className="flex items-center justify-between">
        {/* Logo and title area */}
        <div className="flex items-center space-x-3">
          <div className={`
            rounded-full bg-gray-200 dark:bg-gray-700
            ${isMobileLayout ? 'w-8 h-8' : 'w-10 h-10'}
          `} />
          <div className={`
            h-6 bg-gray-200 dark:bg-gray-700 rounded
            ${isMobileLayout ? 'w-24' : 'w-32'}
          `} />
        </div>

        {/* Action buttons area */}
        <div className="flex space-x-2">
          <div className={`
            bg-gray-200 dark:bg-gray-700 rounded
            ${isMobileLayout ? 'w-8 h-8' : 'w-10 h-10'}
          `} />
          {!isMobileLayout && (
            <>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'message':
        return Array.from({ length: count }, (_, i) => (
          <div key={i}>{renderMessageSkeleton()}</div>
        ));
      case 'session':
        return renderSessionSkeleton();
      case 'session-list':
        return renderSessionListSkeleton();
      case 'chat-input':
        return renderChatInputSkeleton();
      case 'header':
        return renderHeaderSkeleton();
      default:
        return renderMessageSkeleton();
    }
  };

  return (
    <div className="mobile-skeleton-container">
      {renderSkeleton()}
    </div>
  );
}

// Specialized mobile skeleton components
export function MobileChatSkeleton({ messageCount = 3 }: { messageCount?: number }) {
  return (
    <div className="flex flex-col h-full">
      <MobileSkeletonLoader type="header" />
      <div className="flex-1 overflow-hidden">
        <div className="p-4 space-y-4">
          <MobileSkeletonLoader type="message" count={messageCount} />
        </div>
      </div>
      <MobileSkeletonLoader type="chat-input" />
    </div>
  );
}

export function MobileSessionListSkeleton({ sessionCount = 5 }: { sessionCount?: number }) {
  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <MobileSkeletonLoader type="session-list" count={sessionCount} />
    </div>
  );
}

export function MobileLoadingOverlay({
  message = "Loading...",
  type = "spinner"
}: {
  message?: string;
  type?: "spinner" | "dots" | "pulse"
}) {
  const { isMobile } = useMobileNavigation();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className={`
        bg-white dark:bg-gray-800 rounded-2xl p-6 mx-4 shadow-2xl border
        ${isMobile ? 'w-full max-w-sm' : 'max-w-md'}
      `}>
        <div className="flex flex-col items-center space-y-4">
          {/* Loading animation */}
          <div className="relative">
            {type === 'spinner' && (
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            )}
            {type === 'dots' && (
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            )}
            {type === 'pulse' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse" />
            )}
          </div>

          {/* Loading message */}
          <p className="text-center text-gray-600 dark:text-gray-300 font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}