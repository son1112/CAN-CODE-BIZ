'use client';

import React, { useState, useEffect } from 'react';
import { Pin, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { SessionMessage } from '@/models/Session';
import MessagePinButton from './MessagePinButton';

interface PinnedMessagesSectionProps {
  sessionId: string;
  className?: string;
}

export default function PinnedMessagesSection({ sessionId, className = '' }: PinnedMessagesSectionProps) {
  const { getPinnedMessages } = useSession();
  const [pinnedMessages, setPinnedMessages] = useState<SessionMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadPinnedMessages();
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPinnedMessages = async () => {
    setIsLoading(true);
    try {
      const messages = await getPinnedMessages(sessionId);
      setPinnedMessages(messages);
    } catch (error) {
      console.error('Failed to load pinned messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className={`border-b border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading pinned messages...</span>
        </div>
      </div>
    );
  }

  if (pinnedMessages.length === 0) {
    return null; // Don't show section if no pinned messages
  }

  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pinned Messages ({pinnedMessages.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {pinnedMessages.map((message) => (
            <div
              key={message.id}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-3 h-3 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 capitalize">
                      {message.role}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 break-words">
                    {truncateContent(message.content)}
                  </div>
                  {message.tags && message.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <MessagePinButton
                  messageId={message.id}
                  isPinned={message.isPinned}
                  className="flex-shrink-0"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}