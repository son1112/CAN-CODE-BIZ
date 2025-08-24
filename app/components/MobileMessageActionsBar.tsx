'use client';

import { useState } from 'react';
import { Star, Download, Archive, ArchiveRestore, RotateCcw, Copy, MoreVertical } from 'lucide-react';
import { useButtonHaptics } from '@/hooks/useHapticFeedback';
import StarButton from './StarButton';
import MessageExportButton from './MessageExportButton';
import { MessageShare } from './WebShare';

interface MobileMessageActionsBarProps {
  messageId: string;
  sessionId: string;
  userId?: string;
  isUserMessage: boolean;
  isArchived: boolean;
  isFailedMessage?: boolean;
  messageContent: string;
  onArchiveToggle: (messageId: string) => void;
  onRetryMessage?: (messageId: string) => void;
  className?: string;
}

export default function MobileMessageActionsBar({
  messageId,
  sessionId,
  userId,
  isUserMessage,
  isArchived,
  isFailedMessage = false,
  messageContent,
  onArchiveToggle,
  onRetryMessage,
  className = '',
}: MobileMessageActionsBarProps) {
  const [showAllActions, setShowAllActions] = useState(false);
  const { onPress, onSuccess } = useButtonHaptics();

  // Primary actions always visible (max 3 for mobile)
  const primaryActions = [
    // Star action (if user is logged in)
    userId && {
      id: 'star',
      component: (
        <StarButton
          userId={userId}
          itemType="message"
          itemId={messageId}
          context={{
            sessionId: sessionId,
            messageContent: messageContent.substring(0, 100),
          }}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 touch-target"
        />
      ),
    },

    // Share action
    {
      id: 'share',
      component: (
        <div className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <MessageShare
            message={{
              id: messageId,
              content: messageContent,
              timestamp: new Date(),
              role: isUserMessage ? 'user' : 'assistant'
            }}
            sessionName={`Chat Session`}
            className="hover:bg-gray-100 rounded-lg touch-target"
          />
        </div>
      ),
    },

    // Export action
    {
      id: 'export',
      component: (
        <MessageExportButton
          messageId={messageId}
          sessionId={sessionId}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 touch-target p-0"
        />
      ),
    },

    // Archive action
    {
      id: 'archive',
      component: (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchiveToggle(messageId);
            onPress();
          }}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 touch-target"
          title={isArchived ? "Unarchive message" : "Archive message"}
          aria-label={isArchived ? "Unarchive message" : "Archive message"}
        >
          {isArchived ? (
            <ArchiveRestore className="w-5 h-5 text-blue-600" />
          ) : (
            <Archive className="w-5 h-5 text-gray-600" />
          )}
        </button>
      ),
    },
  ].filter(Boolean);

  // Secondary actions (shown when "more" is tapped)
  const secondaryActions = [
    // Copy action (for user messages or when more actions are shown)
    {
      id: 'copy',
      component: (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            try {
              await navigator.clipboard.writeText(messageContent);
              onSuccess();
            } catch (error) {
              onPress();
            }
          }}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 touch-target"
          title="Copy message to clipboard"
          aria-label="Copy message to clipboard"
        >
          <Copy className="w-5 h-5 text-gray-600" />
        </button>
      ),
    },

    // Retry action (for user messages)
    isUserMessage && {
      id: 'retry',
      component: (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRetryMessage?.(messageId);
          }}
          className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 touch-target"
          title="Retry this message"
          aria-label="Retry this message"
        >
          <RotateCcw className={`w-5 h-5 ${isFailedMessage ? 'text-red-600' : 'text-blue-600'}`} />
        </button>
      ),
    },
  ].filter(Boolean);

  // On mobile, show max 2 primary actions + "more" button if there are secondary actions
  const maxPrimaryActions = 2;
  const visiblePrimaryActions = primaryActions.slice(0, maxPrimaryActions);
  const hasMoreActions = secondaryActions.length > 0 || primaryActions.length > maxPrimaryActions;

  return (
    <div className={`mobile-actions-bar ${className}`}>
      {/* Mobile-optimized action bar */}
      <div className="flex items-center gap-2 sm:hidden">
        {/* Always visible primary actions */}
        {visiblePrimaryActions.filter(Boolean).map((action, index) => action && (
          <div key={action.id || index} className="flex-shrink-0">
            {action.component}
          </div>
        ))}

        {/* "More" button if there are additional actions */}
        {hasMoreActions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllActions(!showAllActions);
              onPress();
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 touch-target"
            title="More actions"
            aria-label="More actions"
            aria-expanded={showAllActions}
          >
            <MoreVertical className={`w-5 h-5 text-gray-600 transform transition-transform ${showAllActions ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {/* Expanded secondary actions (mobile) */}
      {showAllActions && (
        <div className="flex items-center gap-2 mt-2 sm:hidden animate-in slide-in-from-top-1 duration-200">
          {/* Remaining primary actions */}
          {primaryActions.slice(maxPrimaryActions).filter(Boolean).map((action, index) => action && (
            <div key={action.id || index} className="flex-shrink-0">
              {action.component}
            </div>
          ))}

          {/* Secondary actions */}
          {secondaryActions.filter(Boolean).map((action, index) => action && (
            <div key={action.id || index} className="flex-shrink-0">
              {action.component}
            </div>
          ))}
        </div>
      )}

      {/* Desktop view - show all actions horizontally */}
      <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {primaryActions.filter(Boolean).map((action, index) => action && (
          <div key={action.id || index} className="flex-shrink-0">
            {action.component}
          </div>
        ))}
        {secondaryActions.filter(Boolean).map((action, index) => action && (
          <div key={action.id || index} className="flex-shrink-0">
            {action.component}
          </div>
        ))}
      </div>
    </div>
  );
}