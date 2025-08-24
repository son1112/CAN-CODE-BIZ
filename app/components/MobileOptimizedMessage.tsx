'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Bot, Mic, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types';
import MobileMessageActionsBar from './MobileMessageActionsBar';
import MessageTagInterface from './MessageTagInterface';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

interface MobileOptimizedMessageProps {
  message: Message;
  isStreaming?: boolean;
  userId?: string;
  sessionId: string;
  isArchived: boolean;
  isFailedMessage?: boolean;
  onArchiveToggle: (messageId: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onExpandMessage?: (message: Message) => void;
  className?: string;
}

export default function MobileOptimizedMessage({
  message,
  isStreaming = false,
  userId,
  sessionId,
  isArchived,
  isFailedMessage = false,
  onArchiveToggle,
  onRetryMessage,
  onExpandMessage,
  className = '',
}: MobileOptimizedMessageProps) {
  const { isMobile, isTablet } = useMobileNavigation();
  const [showActions, setShowActions] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const isUser = message.role === 'user';
  const isVoice = message.audioMetadata;
  const isMobileLayout = isMobile || isTablet;

  // Handle touch interactions for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobileLayout) return;

    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobileLayout || touchStartX === null || touchStartY === null) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // Reset touch coordinates
    setTouchStartX(null);
    setTouchStartY(null);

    // Check if this is a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      // Swipe right to reveal actions
      if (deltaX > 0 && !showActions) {
        setShowActions(true);
      }
      // Swipe left to hide actions
      else if (deltaX < 0 && showActions) {
        setShowActions(false);
      }
    }
    // Tap to toggle actions if not swiping
    else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      setShowActions(!showActions);
    }
  };

  // Close actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActions]);

  return (
    <div
      ref={messageRef}
      className={`relative group ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile swipe indicator */}
      {isMobileLayout && !showActions && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      )}

      <div className={`relative px-3 sm:px-4 py-4 sm:py-6 transition-all duration-200 ${
        isUser ? 'bg-white' : 'bg-gradient-to-br from-slate-50 to-slate-100/50'
      } ${showActions && isMobileLayout ? 'ring-2 ring-blue-200' : ''}`}>
        <div className="w-full max-w-full sm:max-w-4xl mx-auto overflow-hidden">
          <div className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-start' : 'justify-start'}`}>
            {/* Avatar - Enhanced for mobile with better touch targets */}
            <div className="flex flex-shrink-0">
              {isUser ? (
                <div className="relative">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  {isVoice && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <Mic className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`font-semibold text-sm sm:text-base ${
                  isMobileLayout ? 'mobile-typography-sm' : ''
                } ${isUser ? 'text-blue-700' : 'text-purple-700'}`}>
                  {isUser ? 'You' : 'Claude'}
                </span>
                {isVoice && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <Mic className="w-3 h-3" />
                    Voice
                  </div>
                )}
                {isStreaming && !isUser && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    Thinking...
                  </div>
                )}
              </div>

              {/* Message Bubble - Enhanced mobile styling */}
              <div className={`relative ${
                isUser
                  ? 'bg-white border border-blue-200 rounded-2xl rounded-tl-md shadow-sm'
                  : 'bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 rounded-2xl rounded-tl-md shadow-sm'
              } p-4 sm:p-5 ${isStreaming && !isUser ? 'min-h-[3rem]' : ''} max-w-full overflow-hidden`}>

                {/* Message Text - Improved mobile typography */}
                <div className={`prose prose-sm sm:prose-base max-w-none break-words ${
                  isMobileLayout ? 'mobile-typography-base mobile-message-text' : ''
                } ${
                  isUser
                    ? 'prose-blue text-gray-800'
                    : 'prose-purple text-gray-700'
                }`} style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  lineHeight: isMobileLayout ? '1.6' : '1.5' // Better mobile line height
                }}>
                  {isUser ? (
                    <p className="mb-0 leading-relaxed text-base sm:text-lg">{message.content}</p>
                  ) : (
                    <div className="claude-response">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({children}) => <p className="mb-3 last:mb-0 leading-relaxed text-base sm:text-lg">{children}</p>,
                          ul: ({children}) => <ul className="mb-3 last:mb-0 space-y-2">{children}</ul>,
                          ol: ({children}) => <ol className="mb-3 last:mb-0 space-y-2">{children}</ol>,
                          li: ({children}) => <li className="leading-relaxed">{children}</li>,
                          h1: ({children}) => <h1 className="text-xl sm:text-2xl font-semibold mb-4 text-purple-800">{children}</h1>,
                          h2: ({children}) => <h2 className="text-lg sm:text-xl font-semibold mb-3 text-purple-700">{children}</h2>,
                          h3: ({children}) => <h3 className="text-base sm:text-lg font-semibold mb-2 text-purple-600">{children}</h3>,
                          code: ({children, className}) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-mono">{children}</code>
                            ) : (
                              <code className={className}>{children}</code>
                            );
                          },
                          pre: ({children}) => (
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto mb-3">{children}</pre>
                          ),
                          blockquote: ({children}) => (
                            <blockquote className="border-l-4 border-purple-300 pl-4 italic text-purple-700 mb-3">{children}</blockquote>
                          )
                        }}
                      >
                        {message.content || (isStreaming ? '' : '')}
                      </ReactMarkdown>

                      {/* Streaming indicator */}
                      {isStreaming && (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message tail */}
                <div className={`absolute top-5 -left-2 w-4 h-4 transform rotate-45 ${
                  isUser
                    ? 'bg-white border-l border-b border-blue-200'
                    : 'bg-gradient-to-br from-white to-purple-50/30 border-l border-b border-purple-200/50'
                }`} />
              </div>

              {/* Mobile-optimized actions bar */}
              {(showActions || !isMobileLayout) && (
                <div className="mt-3">
                  <MobileMessageActionsBar
                    messageId={message.id}
                    sessionId={sessionId}
                    userId={userId}
                    isUserMessage={isUser}
                    isArchived={isArchived}
                    isFailedMessage={isFailedMessage}
                    messageContent={message.content}
                    onArchiveToggle={onArchiveToggle}
                    onRetryMessage={onRetryMessage}
                    className="w-full"
                  />
                </div>
              )}

              {/* Tag interface */}
              <div className="mt-3">
                <MessageTagInterface
                  messageId={message.id}
                  tags={message.tags || []}
                  onTagsUpdate={(newTags) => {
                    // This would typically update the parent state
                    // For demo purposes, we'll just log it
                    console.log('Tags updated:', newTags);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}