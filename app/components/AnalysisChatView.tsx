'use client';

import { useState, useMemo, useCallback } from 'react';
import { UserIcon, Bot, Star, Tag, MessageCircle, Clock, TrendingUp, LayoutGrid } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import type { Message } from '@/types';

interface MessageThread {
  id: string;
  messages: Message[];
  color: string;
  userCount: number;
  aiCount: number;
  startTime: Date;
  endTime: Date;
}

interface AnalysisChatViewProps {
  messages: Message[];
  onMessageClick?: (message: Message) => void;
  onTagsChange?: (messageId: string, tags: string[]) => void;
  sessionId?: string;
}

const THREAD_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald  
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6366f1'  // Indigo
];

export default function AnalysisChatView({ 
  messages, 
  onMessageClick, 
  onTagsChange,
  sessionId 
}: AnalysisChatViewProps) {
  const { isDark } = useTheme();
  const { isMobileLayout } = useMobileNavigation();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);

  // Thread detection algorithm - similar to SessionOverview
  const detectThreads = useMemo((): MessageThread[] => {
    if (!messages.length) return [];

    const threads: MessageThread[] = [];
    let currentThread: Message[] = [];
    let threadIndex = 0;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const nextMessage = messages[i + 1];

      currentThread.push(message);

      // End thread if:
      // 1. Next message is user message and current is AI (Q&A pair complete)
      // 2. We've reached the end
      const shouldEndThread = 
        !nextMessage || 
        (message.role === 'assistant' && nextMessage?.role === 'user') ||
        currentThread.length >= 8; // Max 8 messages per thread

      if (shouldEndThread && currentThread.length > 0) {
        const userMessages = currentThread.filter(m => m.role === 'user');
        const aiMessages = currentThread.filter(m => m.role === 'assistant');

        threads.push({
          id: `thread-${threadIndex}`,
          messages: currentThread,
          color: THREAD_COLORS[threadIndex % THREAD_COLORS.length],
          userCount: userMessages.length,
          aiCount: aiMessages.length,
          startTime: new Date(currentThread[0].timestamp),
          endTime: new Date(currentThread[currentThread.length - 1].timestamp)
        });

        currentThread = [];
        threadIndex++;
      }
    }

    return threads;
  }, [messages]);

  // Separate messages by role for column layout
  const userMessages = useMemo(() => 
    messages.filter(m => m.role === 'user'), [messages]);
  
  const aiMessages = useMemo(() => 
    messages.filter(m => m.role === 'assistant'), [messages]);

  const starredMessages = useMemo(() => 
    messages.filter(m => m.isStarred), [messages]);

  const taggedMessages = useMemo(() => 
    messages.filter(m => m.tags && m.tags.length > 0), [messages]);

  // Message card component
  const MessageCard = useCallback(({ 
    message, 
    thread 
  }: { 
    message: Message; 
    thread?: MessageThread;
  }) => {
    const isHovered = hoveredMessage === message.id;
    const isInSelectedThread = selectedThread === thread?.id;

    return (
      <div
        className={`message-card rounded-xl p-4 mb-3 transition-all duration-200 cursor-pointer ${
          isInSelectedThread ? 'ring-2 scale-105' : ''
        } ${isHovered ? 'shadow-lg scale-102' : 'shadow-sm'}`}
        style={{
          backgroundColor: isDark 
            ? (isInSelectedThread ? '#1e293b' : '#0f172a')
            : (isInSelectedThread ? '#f1f5f9' : '#ffffff'),
          borderLeftWidth: thread ? '4px' : '0px',
          borderLeftStyle: thread ? 'solid' : 'none',
          borderLeftColor: thread ? thread.color : 'transparent',
          borderTopColor: isInSelectedThread ? thread?.color : 'transparent',
          borderRightColor: isInSelectedThread ? thread?.color : 'transparent',
          borderBottomColor: isInSelectedThread ? thread?.color : 'transparent'
        }}
        onMouseEnter={() => setHoveredMessage(message.id)}
        onMouseLeave={() => setHoveredMessage(null)}
        onClick={() => {
          if (thread) setSelectedThread(thread.id);
          onMessageClick?.(message);
        }}
      >
        {/* Message Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {message.role === 'user' ? (
              <UserIcon className="w-4 h-4 text-blue-500" />
            ) : (
              <Bot className="w-4 h-4 text-green-500" />
            )}
            <span className="text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            {thread && (
              <div 
                className="w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: thread.color }}
                title={`Thread ${thread.id}`}
              />
            )}
          </div>
          {message.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
        </div>

        {/* Message Content */}
        <div className="text-sm leading-relaxed">
          {message.content.length > 150 
            ? `${message.content.substring(0, 150)}...`
            : message.content
          }
        </div>

        {/* Message Tags */}
        {message.tags && message.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {message.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{message.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    );
  }, [isDark, hoveredMessage, selectedThread, onMessageClick]);

  // Thread badge component
  const ThreadBadge = ({ thread }: { thread: MessageThread }) => (
    <div
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105"
      style={{
        backgroundColor: `${thread.color}15`,
        color: thread.color,
        border: `1px solid ${thread.color}30`
      }}
      onClick={() => setSelectedThread(thread.id === selectedThread ? null : thread.id)}
    >
      <div 
        className="w-2 h-2 rounded-full mr-1"
        style={{ backgroundColor: thread.color }}
      />
      Thread {thread.userCount + thread.aiCount} msgs
    </div>
  );

  // Don't render on mobile
  if (isMobileLayout) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div>
          <LayoutGrid className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Analysis view is available on desktop only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-full">
      {/* Thread Overview */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Conversation Analysis
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {messages.length} messages
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {detectThreads.length} threads
            </span>
          </div>
        </div>

        {/* Thread Badges */}
        <div className="flex flex-wrap gap-2">
          {detectThreads.map((thread, index) => (
            <ThreadBadge key={thread.id} thread={thread} />
          ))}
        </div>
      </div>

      {/* Three-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* User Messages Column */}
        <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-950">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Your Questions ({userMessages.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {userMessages.map((message) => {
              const thread = detectThreads.find(t => 
                t.messages.some(m => m.id === message.id)
              );
              return (
                <MessageCard 
                  key={message.id} 
                  message={message} 
                  thread={thread}
                />
              );
            })}
          </div>
        </div>

        {/* AI Responses Column */}
        <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-950">
            <h3 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Responses ({aiMessages.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {aiMessages.map((message) => {
              const thread = detectThreads.find(t => 
                t.messages.some(m => m.id === message.id)
              );
              return (
                <MessageCard 
                  key={message.id} 
                  message={message} 
                  thread={thread}
                />
              );
            })}
          </div>
        </div>

        {/* Highlights & Insights Column */}
        <div className="w-80 flex flex-col">
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-950">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Highlights & Insights
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Starred Messages */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Starred Messages
              </h4>
              {starredMessages.length > 0 ? (
                <div className="space-y-2">
                  {starredMessages.slice(0, 3).map((message) => (
                    <div key={message.id} className="text-sm p-2 rounded bg-gray-100 dark:bg-gray-800">
                      {message.content.substring(0, 100)}...
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No starred messages</p>
              )}
            </div>

            {/* Tagged Messages */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-500" />
                Tagged Messages
              </h4>
              {taggedMessages.length > 0 ? (
                <div className="space-y-2">
                  {taggedMessages.slice(0, 3).map((message) => (
                    <div key={message.id} className="text-sm">
                      <div className="p-2 rounded bg-gray-100 dark:bg-gray-800 mb-1">
                        {message.content.substring(0, 80)}...
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {message.tags?.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tagged messages</p>
              )}
            </div>

            {/* Session Statistics */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Session Statistics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Messages:</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Threads Detected:</span>
                  <span className="font-medium">{detectThreads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Starred:</span>
                  <span className="font-medium">{starredMessages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tagged:</span>
                  <span className="font-medium">{taggedMessages.length}</span>
                </div>
                {messages.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium">
                      {Math.round((new Date(messages[messages.length - 1].timestamp).getTime() - 
                        new Date(messages[0].timestamp).getTime()) / 60000)} min
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}