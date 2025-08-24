'use client';

import { useState } from 'react';
import { Message } from '@/types';
import SwipeableMessage from './SwipeableMessage';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

// Demo component to showcase swipe gestures
export default function SwipeGestureDemo() {
  const { isMobile, isTablet } = useMobileNavigation();
  const [archivedMessages, setArchivedMessages] = useState(new Set<string>());
  const [feedback, setFeedback] = useState<string>('');

  const isMobileDevice = isMobile || isTablet;

  // Demo messages
  const demoMessages: Message[] = [
    {
      id: '1',
      content: 'This is a demo message. On mobile, try swiping left to star/export or right to archive!',
      role: 'assistant',
      timestamp: new Date(),
      tags: [],
    },
    {
      id: '2',
      content: 'Swipe me left for actions, right to archive. The swipe threshold is 80px.',
      role: 'user',
      timestamp: new Date(),
      tags: [],
    },
    {
      id: '3',
      content: 'Mobile-first swipe gestures: Left swipe reveals star and export actions, right swipe archives the message. Visual feedback shows your progress!',
      role: 'assistant',
      timestamp: new Date(),
      tags: [],
    },
  ];

  // Demo action handlers
  const showFeedback = (action: string, messageId: string) => {
    setFeedback(`${action} action triggered for message ${messageId}`);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleArchiveToggle = (messageId: string) => {
    const isCurrentlyArchived = archivedMessages.has(messageId);
    setArchivedMessages(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyArchived) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
    showFeedback(isCurrentlyArchived ? 'Unarchive' : 'Archive', messageId);
  };

  const handleStarMessage = (messageId: string) => {
    showFeedback('Star', messageId);
  };

  const handleExportMessage = (messageId: string) => {
    showFeedback('Export', messageId);
  };

  const handleRetryMessage = (messageId: string) => {
    showFeedback('Retry', messageId);
  };

  if (!isMobileDevice) {
    return (
      <div className="p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          📱 Mobile Swipe Gesture Demo
        </h3>
        <p className="text-yellow-700">
          This demo is optimized for mobile devices. Please resize your browser to mobile width (390px) or use mobile device emulation to test swipe gestures.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Demo header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4">
        <h2 className="text-lg font-semibold">🚀 Phase 3A: Swipe Gestures</h2>
        <p className="text-sm opacity-90 mt-1">
          Swipe left for actions, right to archive
        </p>
      </div>

      {/* Feedback display */}
      {feedback && (
        <div className="bg-green-100 border-l-4 border-green-400 p-3 m-4 rounded">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">
                ✅ {feedback}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border-b">
        <h3 className="font-medium text-blue-900 mb-2">How to test:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Swipe left</strong>: Star or export message</li>
          <li>• <strong>Swipe right</strong>: Archive/unarchive message</li>
          <li>• <strong>Visual feedback</strong>: Progress indicators show action</li>
          <li>• <strong>Threshold</strong>: 80px minimum swipe distance</li>
        </ul>
      </div>

      {/* Demo messages */}
      <div className="divide-y divide-gray-200">
        {demoMessages.map((message) => (
          <SwipeableMessage
            key={message.id}
            message={message}
            userId="demo-user" // Enable star action
            sessionId="demo-session"
            isArchived={archivedMessages.has(message.id)}
            onArchiveToggle={handleArchiveToggle}
            onStarMessage={handleStarMessage}
            onExportMessage={handleExportMessage}
            onRetryMessage={handleRetryMessage}
            className="bg-white"
          />
        ))}
      </div>

      {/* Demo footer */}
      <div className="p-4 bg-gray-50 text-center">
        <p className="text-xs text-gray-600">
          Demo: Touch-optimized swipe gestures with 44px+ touch targets
        </p>
      </div>
    </div>
  );
}