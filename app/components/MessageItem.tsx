'use client';

import { memo, useMemo, useEffect, useState, useRef } from 'react';
import { Star, MoreHorizontal, Hash, Copy, RotateCcw, Archive, ArchiveRestore, X } from 'lucide-react';
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
  
  // Dropdown menu state - separate for user and assistant messages
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isAssistantDropdownOpen, setIsAssistantDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const assistantDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (assistantDropdownRef.current && !assistantDropdownRef.current.contains(event.target as Node)) {
        setIsAssistantDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen || isAssistantDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserDropdownOpen, isAssistantDropdownOpen]);

  // Debug logging removed - message visibility issue resolved

  // Memoize expensive calculations
  const isCollapsed = useMemo(() => collapsedMessages.has(message.id), [collapsedMessages, message.id]);
  const isEditing = useMemo(() => editingMessageId === message.id, [editingMessageId, message.id]);
  const messageTitle = useMemo(() => {
    const role = message.role === 'system' ? 'assistant' : message.role;
    return generateMessageTitle?.(message.content, role) || message.content.slice(0, 50) + '...';
  }, [message.content, message.role, generateMessageTitle]);

  // Professional spacing system - consistent across all devices
  const professionalSpacing = useMemo(() => ({
    // Base container spacing using design system
    container: 'px-4 py-4 space-y-4', // Consistent --spacing-sm equivalent
    padding: isMobileLayout ? 'p-4' : 'p-6', // --spacing-sm to --spacing-md progression
    titleSize: isMobileLayout ? 'text-base' : 'text-lg',
    actionButtonSize: isMobileLayout ? 'w-8 h-8' : 'w-10 h-10',
    avatarSize: isMobileLayout ? 'w-8 h-8' : 'w-12 h-12',
    // Professional spacing tokens
    marginBottom: 'mb-4', // --spacing-sm
    borderPadding: 'pb-3', // --spacing-xs + 0.25rem
    sectionGap: 'gap-4', // --spacing-sm
    actionGap: isMobileLayout ? 'gap-2' : 'gap-4' // Responsive but systematic
  }), [isMobileLayout]);

  if (message.role === 'user') {
    return (
      <div className="group">
        <div className="w-full flex justify-end">
          <div className="max-w-[80%]">
            <div
              className={`relative rounded-lg border-l-4 transition-all duration-200 ${professionalSpacing.padding}`}
              style={{
                backgroundColor: 'var(--primary-white)',
                color: 'var(--text-primary)',
                borderLeftColor: 'var(--accent-purple)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-light)',
                border: `1px solid var(--medium-gray)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-medium)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-light)';
              }}
            >
              {/* User Message Title & Header */}
              <div className={`${professionalSpacing.marginBottom} border-b ${professionalSpacing.borderPadding}`} style={{ borderColor: 'var(--medium-gray)' }}>
                <h3 className={`font-bold mb-2 ${professionalSpacing.titleSize}`} style={{
                  color: 'var(--accent-purple)',
                  backgroundImage: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-orange) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {messageTitle}
                </h3>
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${professionalSpacing.actionGap}`}>
                    <span className={`font-semibold px-2 py-1 rounded ${isMobileLayout ? 'text-xs' : 'text-xs'}`} style={{
                      backgroundColor: 'var(--light-gray)',
                      color: 'var(--accent-purple)',
                      borderRadius: 'var(--radius-sm)'
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
              <div className="space-y-4">
                <FormattedMessage
                  content={message.content}
                  textSizeClass={`${isMobileLayout ? 'text-base' : 'text-lg'} leading-relaxed`}
                />
              </div>

              {/* User Message Actions */}
              <div className={`flex items-center justify-between ${professionalSpacing.actionGap} mt-6 pt-4 border-t ${isMobileLayout ? 'flex-wrap' : ''}`}
                   style={{ borderColor: isDark ? '#404040' : '#e5e7eb' }}>
                <div className={`flex items-center ${professionalSpacing.actionGap}`}>
                  <StarButton
                    itemType="message"
                    itemId={message.id}
                    userId={currentUserId || ''}
                    context={{
                      messageContent: message.content
                    }}
                    size={isMobileLayout ? 'sm' : 'md'}
                    className={`touch-target ${professionalSpacing.actionButtonSize}`}
                  />
                  <MessageTagInterface
                    messageId={message.id}
                    tags={message.tags || []}
                    onTagsUpdate={(tags) => onTagsChange?.(message.id, tags)}
                  />
                </div>
                <div className={`flex items-center ${professionalSpacing.sectionGap}`}>
                  <MessageExportButton
                    messageId={message.id}
                    sessionId={sessionId || ""}
                    className=""
                  />
                  
                  {/* User Message Dropdown Menu */}
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('User dropdown button clicked, current state:', isUserDropdownOpen);
                        setIsUserDropdownOpen(!isUserDropdownOpen);
                      }}
                      className={`rounded-lg transition-colors touch-target flex items-center justify-center ${professionalSpacing.actionButtonSize}`}
                      style={{
                        backgroundColor: isUserDropdownOpen 
                          ? (isDark ? '#374151' : '#e5e7eb') 
                          : (isDark ? '#1f1f1f' : '#f9fafb'),
                        color: isDark ? '#b8b8b8' : '#6b7280',
                        minWidth: isMobileLayout ? '32px' : '40px',
                        padding: '8px'
                      }}
                      title="More options"
                    >
                      <MoreHorizontal className={`${isMobileLayout ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </button>

                    {/* User Message Dropdown Menu */}
                    {isUserDropdownOpen && (
                      <div
                        className="absolute right-0 top-full mt-1 rounded-lg border shadow-xl z-50 min-w-48"
                        style={{
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <div className="py-1">
                          {/* Copy Message */}
                          {handleCopyMessage && (
                            <button
                              onClick={() => {
                                handleCopyMessage(message.id, message.content);
                                setIsUserDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-sm"
                              style={{
                                color: isDark ? '#e5e7eb' : '#374151',
                                backgroundColor: 'transparent'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <Copy className="w-4 h-4" />
                              Copy message
                            </button>
                          )}

                          {/* Archive/Restore Message */}
                          {handleToggleArchive && (
                            <button
                              onClick={() => {
                                handleToggleArchive(message.id, !!(message as any).isArchived);
                                setIsUserDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-sm"
                              style={{
                                color: isDark ? '#e5e7eb' : '#374151',
                                backgroundColor: 'transparent'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {(message as any).isArchived ? (
                                <>
                                  <ArchiveRestore className="w-4 h-4" />
                                  Restore message
                                </>
                              ) : (
                                <>
                                  <Archive className="w-4 h-4" />
                                  Archive message
                                </>
                              )}
                            </button>
                          )}

                          {/* View Full Message Modal */}
                          {onOpenModal && (
                            <>
                              <hr className="my-1" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }} />
                              <button
                                onClick={() => {
                                  onOpenModal(message);
                                  setIsUserDropdownOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-sm"
                                style={{
                                  color: isDark ? '#e5e7eb' : '#374151',
                                  backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                View full message
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
      <div className={`flex items-start ${professionalSpacing.sectionGap} w-full max-w-full`}>
        {/* Assistant Avatar */}
        <div className="flex-shrink-0">
          <div className={`rounded-full overflow-hidden ${professionalSpacing.avatarSize}`} style={{ backgroundColor: '#f3f4f6' }}>
            <div className={`flex items-center justify-center ${professionalSpacing.avatarSize}`} style={{ backgroundColor: '#f59e0b' }}>
              <span className={`${isMobileLayout ? 'text-xs' : 'text-sm'}`}>🦆</span>
            </div>
          </div>
        </div>

        {/* Assistant Message Content */}
        <div className={`flex-1 relative shadow-xl transition-all duration-300 group-hover:shadow-2xl rounded-lg border-l-4 w-full max-w-full overflow-visible ${
          isCollapsed ? professionalSpacing.container : professionalSpacing.padding
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
          <div className={`${professionalSpacing.marginBottom} border-b ${professionalSpacing.borderPadding}`} style={{ borderColor: isDark ? '#404040' : '#e5e7eb' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold mb-2 ${professionalSpacing.titleSize}`} style={{
                  color: '#d97706',
                  backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {messageTitle}
                </h3>
                <div className={`flex items-center ${professionalSpacing.actionGap} flex-wrap`}>
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
                  className={`flex-shrink-0 rounded-lg transition-colors ml-3 touch-target ${professionalSpacing.actionButtonSize}`}
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
                textSizeClass={`${isMobileLayout ? 'text-base' : 'text-lg'} leading-relaxed`}
                expandedView={!isCollapsed}
              />
            </div>
          )}

          {/* Assistant Message Actions */}
          <div className={`flex items-center justify-between ${professionalSpacing.actionGap} mt-6 pt-4 border-t ${isMobileLayout ? 'flex-wrap' : ''}`}
               style={{ borderColor: isDark ? '#404040' : '#e5e7eb' }}>
            <div className={`flex items-center ${professionalSpacing.sectionGap}`}>
              <StarButton
                itemType="message"
                itemId={message.id}
                userId={currentUserId || ''}
                context={{
                  messageContent: message.content
                }}
                size={isMobileLayout ? 'sm' : 'md'}
                className={`touch-target ${professionalSpacing.actionButtonSize}`}
              />
              <MessageTagInterface
                messageId={message.id}
                tags={message.tags || []}
                onTagsUpdate={(tags) => onTagsChange?.(message.id, tags)}
              />
            </div>
            <div className={`flex items-center ${professionalSpacing.sectionGap}`}>
              <MessageExportButton
                messageId={message.id}
                sessionId={sessionId || ""}
                className=""
              />
              
              {/* Dropdown Menu */}
              <div className="relative" ref={assistantDropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Assistant dropdown button clicked, current state:', isAssistantDropdownOpen);
                    setIsAssistantDropdownOpen(!isAssistantDropdownOpen);
                  }}
                  className={`rounded-lg transition-colors touch-target flex items-center justify-center ${professionalSpacing.actionButtonSize}`}
                  style={{
                    backgroundColor: isAssistantDropdownOpen 
                      ? (isDark ? '#374151' : '#e5e7eb') 
                      : (isDark ? '#1f1f1f' : '#f9fafb'),
                    color: isDark ? '#b8b8b8' : '#6b7280',
                    minWidth: isMobileLayout ? '32px' : '40px',
                    padding: '8px'
                  }}
                  title="More options"
                >
                  <MoreHorizontal className={`${isMobileLayout ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>

                {/* Dropdown Menu */}
                {isAssistantDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 rounded-lg border shadow-xl z-50 min-w-48"
                    style={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div className="py-1">
                      {/* Copy Message */}
                      {handleCopyMessage && (
                        <button
                          onClick={() => {
                            handleCopyMessage(message.id, message.content);
                            setIsAssistantDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-sm"
                          style={{
                            color: isDark ? '#e5e7eb' : '#374151',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Copy className="w-4 h-4" />
                          Copy message
                        </button>
                      )}

                      {/* Archive/Restore Message */}
                      {handleToggleArchive && (
                        <button
                          onClick={() => {
                            handleToggleArchive(message.id, !!(message as any).isArchived);
                            setIsAssistantDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-sm"
                          style={{
                            color: isDark ? '#e5e7eb' : '#374151',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {(message as any).isArchived ? (
                            <>
                              <ArchiveRestore className="w-4 h-4" />
                              Restore message
                            </>
                          ) : (
                            <>
                              <Archive className="w-4 h-4" />
                              Archive message
                            </>
                          )}
                        </button>
                      )}

                      {/* Retry Message (for assistant messages) */}
                      {handleRetryMessage && message.role === 'assistant' && (
                        <button
                          onClick={() => {
                            handleRetryMessage(message.id);
                            setIsAssistantDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-sm"
                          style={{
                            color: isDark ? '#e5e7eb' : '#374151',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <RotateCcw className="w-4 h-4" />
                          Retry message
                        </button>
                      )}

                      {/* View Full Message Modal */}
                      {onOpenModal && (
                        <>
                          <hr className="my-1" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }} />
                          <button
                            onClick={() => {
                              onOpenModal(message);
                              setIsAssistantDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-sm"
                            style={{
                              color: isDark ? '#e5e7eb' : '#374151',
                              backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            View full message
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;