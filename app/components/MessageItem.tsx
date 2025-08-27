'use client';

import { memo, useMemo, useEffect } from 'react';
import { Star, MoreHorizontal, Hash, Copy, RotateCcw, Archive, ArchiveRestore } from 'lucide-react';
import Image from 'next/image';
import FormattedMessage from './FormattedMessage';
import StarButton from './StarButton';
import MessageTagInterface from './MessageTagInterface';
import MessageExportButton from './MessageExportButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import type { Message } from '@/types';

interface MessageItemProps {
  message: Message;
  index: number;
  sessionId?: string;
  isCurrentlyStreaming?: boolean;
  collapsedMessages?: Set<string>;
  expandMessage?: (messageId: string) => void;
  collapseMessage?: (messageId: string) => void;
  toggleEditMessage?: (messageId: string) => void;
  editingMessageId?: string | null;
  generateMessageTitle?: (content: string, role: 'user' | 'assistant') => string;
  handleCopyMessage?: (messageId: string, content: string) => void;
  handleRetryMessage?: (messageId: string) => void;
  handleToggleArchive?: (messageId: string, isArchived: boolean) => void;
  onTagsChange?: (messageId: string, tags: string[]) => void;
  formatTokens?: (tokens: number) => string;
  formatModel?: (model: string) => string;
  currentUserId?: string;
  onOpenModal?: (message: Message) => void;
}

const MessageItem = memo(function MessageItem({
  message,
  index,
  sessionId,
  isCurrentlyStreaming = false,
  collapsedMessages = new Set(),
  expandMessage,
  collapseMessage,
  toggleEditMessage,
  editingMessageId,
  generateMessageTitle,
  handleCopyMessage,
  handleRetryMessage,
  handleToggleArchive,
  onTagsChange,
  formatTokens,
  formatModel,
  currentUserId,
  onOpenModal
}: MessageItemProps) {
  const { isDark } = useTheme();
  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileLayout = isMobile || isTablet;

  // 🔍 CRITICAL DEBUG: Add lifecycle logging to track message mounting/unmounting
  useEffect(() => {
    console.log('💬 MessageItem MOUNTED:', {
      messageId: message.id,
      role: message.role,
      contentLength: message.content?.length || 0,
      contentPreview: message.content?.substring(0, 50),
      sessionId,
      timestamp: new Date().toISOString()
    });

    return () => {
      console.log('💬 MessageItem UNMOUNTING:', {
        messageId: message.id,
        role: message.role,
        sessionId,
        timestamp: new Date().toISOString()
      });
    };
  }, [message.id, message.role, message.content, sessionId]);

  // 🔍 CRITICAL DEBUG: Log when MessageItem props change
  useEffect(() => {
    console.log('💬 MessageItem PROPS CHANGED:', {
      messageId: message.id,
      role: message.role,
      isCollapsed: collapsedMessages.has(message.id),
      sessionId,
      hasSessionId: !!sessionId,
      timestamp: new Date().toISOString()
    });
  }, [message.id, message.role, collapsedMessages, sessionId]);

  // Memoize expensive calculations
  const isCollapsed = useMemo(() => collapsedMessages.has(message.id), [collapsedMessages, message.id]);
  const isEditing = useMemo(() => editingMessageId === message.id, [editingMessageId, message.id]);
  const messageTitle = useMemo(() => {
    const role = message.role === 'system' ? 'assistant' : message.role;
    return generateMessageTitle?.(message.content, role) || message.content.slice(0, 50) + '...';
  }, [message.content, message.role, generateMessageTitle]);

  // Mobile-optimized styling
  const mobileResponsiveClasses = useMemo(() => ({
    container: isMobileLayout ? 'px-3 py-3 space-y-3' : 'px-4 py-4 space-y-4',
    padding: isMobileLayout ? 'p-3 sm:p-6' : 'p-4 sm:p-8 lg:p-12',
    titleSize: isMobileLayout ? 'text-base' : 'text-lg',
    actionButtonSize: isMobileLayout ? 'w-8 h-8' : 'w-10 h-10',
    avatarSize: isMobileLayout ? 'w-8 h-8' : 'w-12 h-12'
  }), [isMobileLayout]);

  if (message.role === 'user') {
    return (
      <div className="group">
        <div className="w-full flex justify-end">
          <div className="max-w-[80%]">
            <div
              className={`relative shadow-xl rounded-lg border-l-4 ${mobileResponsiveClasses.padding}`}
              style={{
                backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
                color: isDark ? '#e5e5e5' : '#1f2937',
                borderLeftColor: '#3b82f6',
                boxShadow: isDark 
                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
                border: isDark ? '1px solid #404040' : '1px solid #e5e7eb',
              }}
            >
              {/* User Message Title & Header */}
              <div className="mb-3 border-b pb-2" style={{ borderColor: isDark ? '#404040' : '#e5e7eb' }}>
                <h3 className={`font-bold mb-1 ${mobileResponsiveClasses.titleSize}`} style={{
                  color: '#1e40af',
                  backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {messageTitle}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold px-2 py-1 rounded ${isMobileLayout ? 'text-xs' : 'text-xs'}`} style={{
                      backgroundColor: isDark ? '#404040' : '#f3f4f6',
                      color: '#3b82f6'
                    }}>
                      You
                    </span>
                    {message.audioMetadata && (
                      <span className={`px-2 py-1 rounded ${isMobileLayout ? 'text-xs' : 'text-xs'}`} style={{
                        backgroundColor: '#fef3c7',
                        color: '#d97706'
                      }}>
                        🎤 Voice
                      </span>
                    )}
                  </div>
                  <span className={`${isMobileLayout ? 'text-xs' : 'text-sm'}`} style={{ color: '#6b7280' }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* User Message Content */}
              <div className="space-y-3">
                <FormattedMessage
                  content={message.content}
                  textSizeClass={`${isMobileLayout ? 'text-sm' : 'text-base'} leading-relaxed`}
                />
              </div>

              {/* User Message Actions */}
              <div className={`flex items-center justify-between gap-2 mt-4 pt-3 border-t ${isMobileLayout ? 'flex-wrap' : ''}`}
                   style={{ borderColor: isDark ? '#404040' : '#e5e7eb' }}>
                <div className="flex items-center gap-1">
                  <StarButton
                    itemType="message"
                    itemId={message.id}
                    userId={currentUserId || ''}
                    context={{
                      messageContent: message.content
                    }}
                    size={isMobileLayout ? 'sm' : 'md'}
                    className={`touch-target ${mobileResponsiveClasses.actionButtonSize}`}
                  />
                  <MessageTagInterface
                    messageId={message.id}
                    tags={message.tags || []}
                    onTagsUpdate={(tags) => onTagsChange?.(message.id, tags)}
                  />
                  {handleCopyMessage && (
                    <button
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      className={`rounded-lg transition-colors touch-target ${mobileResponsiveClasses.actionButtonSize}`}
                      style={{
                        backgroundColor: isDark ? '#1f1f1f' : '#f9fafb',
                        color: isDark ? '#b8b8b8' : '#6b7280'
                      }}
                      title="Copy message"
                    >
                      <Copy className={`${isMobileLayout ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </button>
                  )}
                </div>
                <MessageExportButton
                  messageId={message.id}
                  sessionId={sessionId || ""}
                  className={`touch-target ${mobileResponsiveClasses.actionButtonSize}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="group w-full">
      <div className="flex items-start gap-3 w-full max-w-full">
        {/* Assistant Avatar */}
        <div className="flex-shrink-0">
          <div className={`rounded-full overflow-hidden ${mobileResponsiveClasses.avatarSize}`} style={{ backgroundColor: '#f3f4f6' }}>
            <div className={`flex items-center justify-center ${mobileResponsiveClasses.avatarSize}`} style={{ backgroundColor: '#f59e0b' }}>
              <span className={`${isMobileLayout ? 'text-xs' : 'text-sm'}`}>🦆</span>
            </div>
          </div>
        </div>

        {/* Assistant Message Content */}
        <div className={`flex-1 relative shadow-xl transition-all duration-300 group-hover:shadow-2xl rounded-lg border-l-4 w-full max-w-full overflow-visible ${
          isCollapsed ? mobileResponsiveClasses.container : mobileResponsiveClasses.padding
        }`}
        style={{
          borderLeftColor: '#eab308',
          backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
          color: isDark ? '#e5e5e5' : '#1f2937',
          boxShadow: isDark 
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
          border: isDark ? '1px solid #404040' : '1px solid #e5e7eb',
          borderLeft: '4px solid #eab308'
        }}>
          {/* Assistant Message Header */}
          <div className="mb-3 border-b pb-2" style={{ borderColor: isDark ? '#404040' : '#e5e7eb' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold mb-2 ${mobileResponsiveClasses.titleSize}`} style={{
                  color: '#d97706',
                  backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {messageTitle}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-semibold px-2 py-1 rounded ${isMobileLayout ? 'text-xs' : 'text-xs'}`} style={{
                    backgroundColor: isDark ? '#404040' : '#fef3c7',
                    color: '#d97706'
                  }}>
                    🦆 Assistant
                  </span>
                  {message.agentUsed && (
                    <span className={`px-2 py-1 rounded ${isMobileLayout ? 'text-xs' : 'text-xs'}`} style={{
                      backgroundColor: isDark ? '#404040' : '#f0f9ff',
                      color: '#0369a1'
                    }}>
                      {formatModel ? formatModel(message.agentUsed) : message.agentUsed}
                    </span>
                  )}
                  <span className={`${isMobileLayout ? 'text-xs' : 'text-sm'}`} style={{ color: '#6b7280' }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Collapse/Expand Button */}
              {expandMessage && collapseMessage && (
                <button
                  onClick={() => isCollapsed ? expandMessage(message.id) : collapseMessage(message.id)}
                  className={`flex-shrink-0 rounded-lg transition-colors ml-2 touch-target ${mobileResponsiveClasses.actionButtonSize}`}
                  style={{
                    backgroundColor: isDark ? '#1f1f1f' : '#f9fafb',
                    color: isDark ? '#b8b8b8' : '#6b7280'
                  }}
                  title={isCollapsed ? 'Expand message' : 'Collapse message'}
                >
                  {isCollapsed ? (
                    <svg className={`${isMobileLayout ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  ) : (
                    <svg className={`${isMobileLayout ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Assistant Message Content */}
          {!isCollapsed && (
            <div className="space-y-4">
              <FormattedMessage
                content={message.content}
                textSizeClass={`${isMobileLayout ? 'text-sm' : 'text-base'} leading-relaxed`}
                expandedView={!isCollapsed}
              />
            </div>
          )}

          {/* Assistant Message Actions */}
          <div className={`flex items-center justify-between gap-2 mt-4 pt-3 border-t ${isMobileLayout ? 'flex-wrap' : ''}`}
               style={{ borderColor: isDark ? '#404040' : '#e5e7eb' }}>
            <div className="flex items-center gap-1">
              <StarButton
                itemType="message"
                itemId={message.id}
                userId={currentUserId || ''}
                context={{
                  messageContent: message.content
                }}
                size={isMobileLayout ? 'sm' : 'md'}
                className={`touch-target ${mobileResponsiveClasses.actionButtonSize}`}
              />
              <MessageTagInterface
                messageId={message.id}
                tags={message.tags || []}
                onTagsUpdate={(tags) => onTagsChange?.(message.id, tags)}
              />
              {handleCopyMessage && (
                <button
                  onClick={() => handleCopyMessage(message.id, message.content)}
                  className={`rounded-lg transition-colors touch-target ${mobileResponsiveClasses.actionButtonSize}`}
                  style={{
                    backgroundColor: isDark ? '#1f1f1f' : '#f9fafb',
                    color: isDark ? '#b8b8b8' : '#6b7280'
                  }}
                  title="Copy message"
                >
                  <Copy className={`${isMobileLayout ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
              )}
              {handleRetryMessage && (
                <button
                  onClick={() => handleRetryMessage(message.id)}
                  className={`rounded-lg transition-colors touch-target ${mobileResponsiveClasses.actionButtonSize}`}
                  style={{
                    backgroundColor: isDark ? '#1f1f1f' : '#f9fafb',
                    color: isDark ? '#b8b8b8' : '#6b7280'
                  }}
                  title="Retry message"
                >
                  <RotateCcw className={`${isMobileLayout ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <MessageExportButton
                messageId={message.id}
                sessionId={sessionId || ""}
                className={`touch-target ${mobileResponsiveClasses.actionButtonSize}`}
              />
              {onOpenModal && (
                <button
                  onClick={() => onOpenModal(message)}
                  className={`rounded-lg transition-colors touch-target ${mobileResponsiveClasses.actionButtonSize}`}
                  style={{
                    backgroundColor: isDark ? '#1f1f1f' : '#f9fafb',
                    color: isDark ? '#b8b8b8' : '#6b7280'
                  }}
                  title="View in modal"
                >
                  <MoreHorizontal className={`${isMobileLayout ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;