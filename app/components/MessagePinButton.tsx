'use client';

import React, { useState } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface MessagePinButtonProps {
  messageId: string;
  isPinned?: boolean;
  className?: string;
}

export default function MessagePinButton({ messageId, isPinned = false, className = '' }: MessagePinButtonProps) {
  const { pinMessage } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleTogglePin = async () => {
    setIsLoading(true);
    try {
      await pinMessage(messageId, !isPinned);
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleTogglePin}
      disabled={isLoading}
      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 ${className}`}
      title={isPinned ? 'Unpin message' : 'Pin message'}
    >
      {isPinned ? (
        <Pin className="w-3 h-3 text-blue-500" />
      ) : (
        <PinOff className="w-3 h-3 text-gray-400 hover:text-blue-500" />
      )}
    </button>
  );
}