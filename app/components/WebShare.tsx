'use client';

import { useState, useCallback } from 'react';
import { Share, Share2, Copy, Download, Link, MessageSquare, FileText, Globe } from 'lucide-react';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import type { Message } from '@/types';

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface WebShareProps {
  data: ShareData;
  children?: React.ReactNode;
  className?: string;
  fallbackToClipboard?: boolean;
  showFallbackUI?: boolean;
  onShare?: (method: 'native' | 'clipboard' | 'download') => void;
  onError?: (error: string) => void;
}

interface ShareResult {
  success: boolean;
  method: 'native' | 'clipboard' | 'download' | 'fallback';
  error?: string;
}

export default function WebShare({
  data,
  children,
  className = '',
  fallbackToClipboard = true,
  showFallbackUI = true,
  onShare,
  onError
}: WebShareProps) {
  const { isMobile, isTablet } = useMobileNavigation();
  const [isSharing, setIsSharing] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Check if Web Share API is supported
  const isWebShareSupported = useCallback(() => {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }, []);

  // Check if the data can be shared natively
  const canShare = useCallback((shareData: ShareData) => {
    if (!isWebShareSupported()) return false;

    try {
      return navigator.canShare ? navigator.canShare(shareData) : true;
    } catch {
      return false;
    }
  }, [isWebShareSupported]);

  // Handle native sharing
  const handleNativeShare = useCallback(async (shareData: ShareData): Promise<ShareResult> => {
    if (!canShare(shareData)) {
      return { success: false, method: 'native', error: 'Native sharing not supported' };
    }

    try {
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } catch (error) {
      // User cancelled or sharing failed
      const errorMessage = error instanceof Error ? error.message : 'Share cancelled';
      return { success: false, method: 'native', error: errorMessage };
    }
  }, [canShare]);

  // Handle clipboard fallback
  const handleClipboardShare = useCallback(async (shareData: ShareData): Promise<ShareResult> => {
    try {
      const textToShare = [
        shareData.title,
        shareData.text,
        shareData.url
      ].filter(Boolean).join('\n\n');

      if (!textToShare) {
        return { success: false, method: 'clipboard', error: 'No content to share' };
      }

      await navigator.clipboard.writeText(textToShare);
      return { success: true, method: 'clipboard' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Clipboard access failed';
      return { success: false, method: 'clipboard', error: errorMessage };
    }
  }, []);

  // Handle download fallback
  const handleDownloadShare = useCallback(async (shareData: ShareData): Promise<ShareResult> => {
    try {
      const content = [
        shareData.title && `# ${shareData.title}`,
        shareData.text,
        shareData.url && `Link: ${shareData.url}`
      ].filter(Boolean).join('\n\n');

      if (!content) {
        return { success: false, method: 'download', error: 'No content to download' };
      }

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${shareData.title?.replace(/[^a-z0-9]/gi, '_') || 'shared_content'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, method: 'download' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      return { success: false, method: 'download', error: errorMessage };
    }
  }, []);

  // Main share handler
  const handleShare = useCallback(async () => {
    if (isSharing) return;

    setIsSharing(true);
    setShowFallback(false);

    try {
      // Try native sharing first
      if (canShare(data)) {
        const result = await handleNativeShare(data);
        if (result.success) {
          onShare?.('native');
          return;
        } else if (result.error === 'AbortError' || result.error?.includes('cancelled')) {
          // User cancelled - don't show error
          return;
        }
      }

      // Fallback to clipboard if enabled
      if (fallbackToClipboard) {
        const result = await handleClipboardShare(data);
        if (result.success) {
          onShare?.('clipboard');
          return;
        }
      }

      // Show fallback UI if enabled
      if (showFallbackUI) {
        setShowFallback(true);
      } else {
        onError?.('Sharing not supported on this device');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      onError?.(errorMessage);
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, data, canShare, handleNativeShare, fallbackToClipboard, handleClipboardShare, showFallbackUI, onShare, onError]);

  // Handle fallback option selection
  const handleFallbackOption = useCallback(async (method: 'clipboard' | 'download') => {
    setIsSharing(true);

    try {
      let result: ShareResult;

      if (method === 'clipboard') {
        result = await handleClipboardShare(data);
      } else {
        result = await handleDownloadShare(data);
      }

      if (result.success) {
        onShare?.(method);
        setShowFallback(false);
      } else {
        onError?.(result.error || 'Action failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action failed';
      onError?.(errorMessage);
    } finally {
      setIsSharing(false);
    }
  }, [data, handleClipboardShare, handleDownloadShare, onShare, onError]);

  // Determine the appropriate share icon
  const ShareIcon = isWebShareSupported() ? Share : Share2;

  return (
    <div className={`web-share-container ${className}`}>
      {/* Main Share Button */}
      {children ? (
        <div onClick={handleShare} style={{ cursor: isSharing ? 'not-allowed' : 'pointer' }}>
          {children}
        </div>
      ) : (
        <button
          onClick={handleShare}
          disabled={isSharing}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 touch-target
            ${isMobile || isTablet ? 'min-w-[44px] min-h-[44px]' : ''}
          `}
          style={{
            backgroundColor: isSharing ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
            color: isSharing ? 'var(--text-tertiary)' : 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            opacity: isSharing ? 0.6 : 1
          }}
          title={isWebShareSupported() ? 'Share' : 'Copy to clipboard'}
        >
          {isSharing ? (
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
          ) : (
            <ShareIcon className="w-4 h-4" />
          )}
          {!isMobile && <span className="text-sm">Share</span>}
        </button>
      )}

      {/* Fallback Options Modal */}
      {showFallback && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50 p-4">
          <div
            className={`
              bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-md transition-all duration-300
              ${isMobile ? 'rounded-t-2xl' : 'rounded-2xl'}
            `}
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-primary)',
              maxHeight: '50vh'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Share Options
              </h3>
              <button
                onClick={() => setShowFallback(false)}
                className="p-2 rounded-lg transition-colors touch-target"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            {/* Share Options */}
            <div className="p-4 space-y-3">
              {/* Copy to Clipboard */}
              <button
                onClick={() => handleFallbackOption('clipboard')}
                disabled={isSharing}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left touch-target"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)'
                }}
              >
                <Copy className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <div className="font-medium">Copy to Clipboard</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Copy content to device clipboard
                  </div>
                </div>
              </button>

              {/* Download as File */}
              <button
                onClick={() => handleFallbackOption('download')}
                disabled={isSharing}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left touch-target"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)'
                }}
              >
                <Download className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
                <div>
                  <div className="font-medium">Download as File</div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Save content as a text file
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for managing share capabilities and state
export function useWebShare() {
  const { isMobile } = useMobileNavigation();
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);

  const isSupported = useCallback(() => {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }, []);

  const canShareFiles = useCallback(() => {
    return isSupported() && navigator.canShare && typeof navigator.canShare === 'function';
  }, [isSupported]);

  const share = useCallback(async (data: ShareData): Promise<ShareResult> => {
    if (!isSupported()) {
      return { success: false, method: 'fallback', error: 'Web Share API not supported' };
    }

    try {
      await navigator.share(data);
      const result: ShareResult = { success: true, method: 'native' };
      setShareResult(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      const result: ShareResult = { success: false, method: 'native', error: errorMessage };
      setShareResult(result);
      return result;
    }
  }, [isSupported]);

  const clearResult = useCallback(() => {
    setShareResult(null);
  }, []);

  return {
    isSupported: isSupported(),
    canShareFiles: canShareFiles(),
    isMobile,
    share,
    shareResult,
    clearResult
  };
}

// Specialized share components for different content types
export function MessageShare({
  message,
  sessionName,
  className = ''
}: {
  message: Message;
  sessionName?: string;
  className?: string;
}) {
  const shareData: ShareData = {
    title: `Message from ${sessionName || 'Rubber Ducky Live'}`,
    text: message.content,
    url: `${window.location.origin}/chat`
  };

  return (
    <WebShare
      data={shareData}
      className={className}
      onShare={(method) => {
        console.log(`Message shared via ${method}`);
      }}
      onError={(error) => {
        console.error('Share failed:', error);
      }}
    />
  );
}

export function SessionShare({
  sessionId,
  sessionName,
  messageCount,
  className = ''
}: {
  sessionId: string;
  sessionName: string;
  messageCount?: number;
  className?: string;
}) {
  const shareData: ShareData = {
    title: `Chat Session: ${sessionName}`,
    text: `Check out this conversation${messageCount ? ` with ${messageCount} messages` : ''} from Rubber Ducky Live`,
    url: `${window.location.origin}/chat?session=${sessionId}`
  };

  return (
    <WebShare
      data={shareData}
      className={className}
      onShare={(method) => {
        console.log(`Session shared via ${method}`);
      }}
      onError={(error) => {
        console.error('Session share failed:', error);
      }}
    />
  );
}

export function AppShare({
  className = ''
}: {
  className?: string;
}) {
  const shareData: ShareData = {
    title: 'Rubber Ducky Live - AI Chat Assistant',
    text: 'Check out Rubber Ducky Live - a voice-enabled AI chat companion powered by Claude AI!',
    url: window.location.origin
  };

  return (
    <WebShare
      data={shareData}
      className={className}
      onShare={(method) => {
        console.log(`App shared via ${method}`);
      }}
      onError={(error) => {
        console.error('App share failed:', error);
      }}
    />
  );
}