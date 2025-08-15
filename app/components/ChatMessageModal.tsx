'use client';

import { useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import FormattedMessage from './FormattedMessage';
import { useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioMetadata?: any;
}

interface ChatMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage | null;
}

export default function ChatMessageModal({ isOpen, onClose, message }: ChatMessageModalProps) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    if (message?.content) {
      try {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !message) return null;

  const isUser = message.role === 'user';
  const timestamp = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: `1px solid var(--border-primary)`,
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{
                background: isUser
                  ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)'
                  : 'linear-gradient(135deg, #eab308 0%, #f59e0b 50%, #f97316 100%)'
              }}
            >
              {isUser ? (
                <span className="text-white text-sm font-bold">
                  {message.audioMetadata ? '🎙️' : 'U'}
                </span>
              ) : (
                <span className="text-2xl">🦆</span>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                {isUser ? 'You' : 'Rubber Ducky'}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {timestamp}
                {message.audioMetadata && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    🎙️ Voice message
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: copied ? 'var(--status-success)' : 'var(--bg-tertiary)',
                color: copied ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${copied ? 'var(--status-success)' : 'var(--border-primary)'}`
              }}
              title="Copy message"
            >
              {copied ? (
                <Check style={{ width: '16px', height: '16px' }} />
              ) : (
                <Copy style={{ width: '16px', height: '16px' }} />
              )}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: `1px solid var(--border-primary)`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--status-error)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="Close (Escape)"
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]"
          style={{
            backgroundColor: 'var(--bg-primary)'
          }}
        >
          <div
            className="prose prose-lg max-w-none"
            style={{
              color: 'var(--text-primary)',
              lineHeight: '1.7'
            }}
          >
            {isUser ? (
              <div
                className="text-lg leading-relaxed font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {message.content}
              </div>
            ) : (
              <div style={{ color: 'var(--text-primary)' }}>
                <FormattedMessage
                  content={message.content}
                  textSizeClass="text-lg"
                  expandedView={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t"
          style={{
            borderColor: 'var(--border-primary)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-tertiary)' }}>
              Click outside to close • Press Escape to close
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>
              {message.content.length} characters
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}