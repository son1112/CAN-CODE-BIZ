'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, List, GitBranch, Star, Tag, Clock, MessageCircle, Bot, User as UserIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { SessionMessage } from '@/models/Session';
import FormattedMessage from './FormattedMessage';
import StarButton from './StarButton';
import MessageTagInterface from './MessageTagInterface';

interface SessionOverviewProps {
  messages: SessionMessage[];
  sessionId: string;
  onMessageClick?: (message: SessionMessage) => void;
  onTagsChange?: (messageId: string, tags: string[]) => void;
}

interface ThreadConnection {
  sourceId: string;
  targetId: string;
  threadId: string;
  color: string;
}

interface MessageThread {
  id: string;
  messages: SessionMessage[];
  topic?: string;
  color: string;
}

export default function SessionOverview({
  messages,
  sessionId,
  onMessageClick,
  onTagsChange
}: SessionOverviewProps) {
  const { isDark } = useTheme();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'linear'>('grid');

  // Categorize messages
  const categorizedMessages = useMemo(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    const starredMessages = messages.filter(m => m.isStarred);
    const taggedMessages = messages.filter(m => m.tags && m.tags.length > 0);
    
    return {
      user: userMessages,
      assistant: assistantMessages,
      metadata: {
        starred: starredMessages,
        tagged: taggedMessages,
        total: messages.length,
        timestamp: messages[0]?.timestamp || new Date()
      }
    };
  }, [messages]);

  // Thread detection algorithm (simplified for now)
  const detectThreads = useMemo((): MessageThread[] => {
    const threads: MessageThread[] = [];
    const threadColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    let currentThread: MessageThread | null = null;
    let colorIndex = 0;

    messages.forEach((message, index) => {
      // Simple thread detection: group consecutive Q&A pairs
      if (message.role === 'user') {
        // Start new thread on user message
        if (currentThread && currentThread.messages.length > 0) {
          threads.push(currentThread);
        }
        currentThread = {
          id: `thread-${index}`,
          messages: [message],
          color: threadColors[colorIndex % threadColors.length]
        };
        colorIndex++;
      } else if (currentThread) {
        // Add assistant response to current thread
        currentThread.messages.push(message);
      }
    });

    if (currentThread && currentThread.messages.length > 0) {
      threads.push(currentThread);
    }

    return threads;
  }, [messages]);

  // Message card component
  const MessageCard = ({ message, column }: { message: SessionMessage; column: 'user' | 'assistant' | 'metadata' }) => {
    const thread = detectThreads.find(t => t.messages.some(m => m.id === message.id));
    const isInSelectedThread = selectedThread && thread?.id === selectedThread;
    const isHovered = hoveredMessage === message.id;

    return (
      <div
        className={`message-card rounded-xl p-4 mb-3 transition-all duration-200 cursor-pointer ${
          isInSelectedThread ? 'ring-2 scale-105' : ''
        } ${isHovered ? 'shadow-lg scale-102' : 'shadow-sm'}`}
        style={{
          backgroundColor: isDark 
            ? (isInSelectedThread ? '#1e293b' : '#0f172a')
            : (isInSelectedThread ? '#f1f5f9' : '#ffffff'),
          borderLeft: thread ? `4px solid ${thread.color}` : 'none',
          borderColor: isInSelectedThread ? thread?.color : undefined
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
          </div>
          {column !== 'metadata' && (
            <div className="flex items-center gap-1">
              <StarButton
                itemType="message"
                itemId={message.id}
                initialState={message.isStarred}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Message Content (truncated) */}
        <div className="message-content">
          <div className="text-sm line-clamp-3">
            {message.content.substring(0, 150)}
            {message.content.length > 150 && '...'}
          </div>
        </div>

        {/* Message Footer */}
        {message.tags && message.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
                  color: isDark ? '#94a3b8' : '#475569'
                }}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Thread connections visualization (SVG overlay)
  const ThreadConnections = () => {
    if (!selectedThread) return null;

    const thread = detectThreads.find(t => t.id === selectedThread);
    if (!thread || thread.messages.length < 2) return null;

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {/* Draw connections between messages in the thread */}
        {thread.messages.slice(0, -1).map((msg, index) => {
          // This is a simplified version - actual implementation would calculate real positions
          return (
            <line
              key={`${msg.id}-connection`}
              x1="50%"
              y1={`${(index + 1) * 100}px`}
              x2="50%"
              y2={`${(index + 2) * 100}px`}
              stroke={thread.color}
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.5"
            />
          );
        })}
      </svg>
    );
  };

  // Check if we should show the grid view (desktop only)
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1280);
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  if (!isDesktop) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">
          Session Overview is available on desktop viewports only.
          Please use a larger screen to access this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="session-overview h-full">
      {/* Header with view toggle */}
      <div className="overview-header p-4 border-b" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Session Overview</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MessageCircle className="w-4 h-4" />
              <span>{messages.length} messages</span>
              <Star className="w-4 h-4 ml-2" />
              <span>{categorizedMessages.metadata.starred.length} starred</span>
              <Tag className="w-4 h-4 ml-2" />
              <span>{categorizedMessages.metadata.tagged.length} tagged</span>
            </div>
          </div>
          
          {/* View mode toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('linear')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'linear' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
              title="Linear View"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedThread(null)}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 ml-2"
              title="Clear Thread Selection"
            >
              <GitBranch className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thread indicators */}
        <div className="mt-3 flex flex-wrap gap-2">
          {detectThreads.map(thread => (
            <button
              key={thread.id}
              onClick={() => setSelectedThread(thread.id === selectedThread ? null : thread.id)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                selectedThread === thread.id ? 'scale-110' : ''
              }`}
              style={{
                backgroundColor: selectedThread === thread.id ? thread.color : `${thread.color}20`,
                color: selectedThread === thread.id ? 'white' : thread.color,
                border: `1px solid ${thread.color}`
              }}
            >
              Thread {thread.messages.length} msgs
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Grid Layout */}
      <div className="overview-content relative" style={{ height: 'calc(100% - 120px)' }}>
        <ThreadConnections />
        
        <div className="grid grid-cols-3 gap-6 p-6 h-full">
          {/* Column 1: User Messages */}
          <div className="column-user overflow-y-auto">
            <div className="column-header mb-4 sticky top-0 bg-inherit z-20 pb-2">
              <h3 className="font-medium flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-500" />
                Your Messages ({categorizedMessages.user.length})
              </h3>
            </div>
            <div className="messages-list">
              {categorizedMessages.user.map(message => (
                <MessageCard key={message.id} message={message} column="user" />
              ))}
            </div>
          </div>

          {/* Column 2: Assistant Messages */}
          <div className="column-assistant overflow-y-auto">
            <div className="column-header mb-4 sticky top-0 bg-inherit z-20 pb-2">
              <h3 className="font-medium flex items-center gap-2">
                <Bot className="w-5 h-5 text-green-500" />
                AI Responses ({categorizedMessages.assistant.length})
              </h3>
            </div>
            <div className="messages-list">
              {categorizedMessages.assistant.map(message => (
                <MessageCard key={message.id} message={message} column="assistant" />
              ))}
            </div>
          </div>

          {/* Column 3: Metadata & Highlights */}
          <div className="column-metadata overflow-y-auto">
            <div className="column-header mb-4 sticky top-0 bg-inherit z-20 pb-2">
              <h3 className="font-medium flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Highlights & Insights
              </h3>
            </div>
            
            {/* Starred Messages Section */}
            {categorizedMessages.metadata.starred.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">
                  Starred Messages
                </h4>
                {categorizedMessages.metadata.starred.map(message => (
                  <MessageCard key={`starred-${message.id}`} message={message} column="metadata" />
                ))}
              </div>
            )}

            {/* Tagged Messages Section */}
            {categorizedMessages.metadata.tagged.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">
                  Tagged Messages
                </h4>
                {categorizedMessages.metadata.tagged.map(message => (
                  <MessageCard key={`tagged-${message.id}`} message={message} column="metadata" />
                ))}
              </div>
            )}

            {/* Session Stats */}
            <div className="stats-card rounded-xl p-4" style={{
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
            }}>
              <h4 className="font-medium mb-3">Session Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Messages</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Threads Detected</span>
                  <span className="font-medium">{detectThreads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Thread Length</span>
                  <span className="font-medium">
                    {(messages.length / detectThreads.length).toFixed(1)} msgs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Session Duration</span>
                  <span className="font-medium">
                    {messages.length > 1 
                      ? `${Math.round((new Date(messages[messages.length - 1].timestamp).getTime() - 
                          new Date(messages[0].timestamp).getTime()) / 60000)} min`
                      : '0 min'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}