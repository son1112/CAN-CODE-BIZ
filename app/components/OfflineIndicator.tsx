'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, Upload, RefreshCw, X, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
  className?: string;
}

export default function OfflineIndicator({
  position = 'bottom',
  showDetails = true,
  className = ''
}: OfflineIndicatorProps) {
  const { isMobile, isTablet, isHydrated } = useMobileNavigation();
  const isMobileDevice = isMobile || isTablet;

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ success: number; failed: number; total: number } | null>(null);

  const {
    isOnline,
    isSyncing,
    cacheStats,
    syncPendingItems,
    clearCache,
    cancelSync
  } = useOfflineMode({
    onSyncProgress: (progress) => {
      // Update progress in real-time if modal is open
      if (showSyncModal) {
        console.log('Sync progress:', progress);
      }
    }
  });

  // Auto-hide sync results after delay
  useEffect(() => {
    if (lastSyncResult) {
      const timer = setTimeout(() => setLastSyncResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastSyncResult]);

  // Handle manual sync
  const handleSync = async () => {
    if (isSyncing) return;

    setShowSyncModal(true);
    const result = await syncPendingItems();
    setLastSyncResult(result);

    // Auto-close modal if no pending items or all successful
    if (result.total === 0 || result.failed === 0) {
      setTimeout(() => setShowSyncModal(false), 2000);
    }
  };

  // Handle cache clear
  const handleClearCache = async () => {
    const confirmed = confirm(
      `Clear all cached data? This will remove ${cacheStats.totalMessages} cached messages and ${cacheStats.pendingItems} pending sync items.`
    );

    if (confirmed) {
      await clearCache();
      setShowSyncModal(false);
    }
  };

  // Don't render until hydrated to prevent mismatch
  if (!isHydrated) {
    return null;
  }

  // Don't render if online and no pending items (unless forced to show details)
  if (isOnline && cacheStats.pendingItems === 0 && !showDetails) {
    return null;
  }

  const statusColor = isOnline ? '#10b981' : '#ef4444';
  const bgColor = isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
  const borderColor = isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';

  return (
    <>
      {/* Main Status Indicator */}
      <div
        className={`fixed z-40 flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm border transition-all duration-300 ${
          isMobileDevice ? 'left-4 right-4' : 'left-6'
        } ${
          position === 'top' ? 'top-20' : 'bottom-4'
        } ${className}`}
        style={{
          backgroundColor: bgColor,
          borderColor: borderColor,
          maxWidth: isMobileDevice ? 'calc(100% - 2rem)' : '300px'
        }}
      >
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {isSyncing ? (
            <RefreshCw
              className="w-4 h-4 animate-spin"
              style={{ color: '#3b82f6' }}
            />
          ) : isOnline ? (
            <Wifi className="w-4 h-4" style={{ color: statusColor }} />
          ) : (
            <WifiOff className="w-4 h-4" style={{ color: statusColor }} />
          )}
        </div>

        {/* Status Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium truncate"
              style={{ color: statusColor }}
            >
              {isSyncing
                ? 'Syncing...'
                : isOnline
                  ? 'Online'
                  : 'Offline'
              }
            </span>

            {cacheStats.pendingItems > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6'
                }}
              >
                {cacheStats.pendingItems} pending
              </span>
            )}
          </div>

          {/* Additional info for mobile */}
          {isMobileDevice && (cacheStats.totalMessages > 0 || cacheStats.pendingItems > 0) && (
            <div className="text-xs" style={{ color: '#6b7280' }}>
              {cacheStats.totalMessages} cached • {Math.round(cacheStats.cacheSize * 100) / 100}MB
            </div>
          )}
        </div>

        {/* Action Button */}
        {showDetails && (cacheStats.pendingItems > 0 || !isOnline) && (
          <button
            onClick={() => setShowSyncModal(true)}
            className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors touch-target"
            style={{ minWidth: '32px', minHeight: '32px' }}
            title="Sync details"
          >
            <Database className="w-3 h-3" style={{ color: '#6b7280' }} />
          </button>
        )}

        {/* Sync Result Indicator */}
        {lastSyncResult && !showSyncModal && (
          <div className="flex-shrink-0 ml-1">
            {lastSyncResult.failed > 0 ? (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </div>
        )}
      </div>

      {/* Sync Details Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-hidden"
            style={{
              border: '1px solid var(--border-primary)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Offline Status
              </h3>
              <button
                onClick={() => setShowSyncModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
              >
                <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
              {/* Connection Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: bgColor }}>
                {isOnline ? (
                  <Wifi className="w-5 h-5" style={{ color: statusColor }} />
                ) : (
                  <WifiOff className="w-5 h-5" style={{ color: statusColor }} />
                )}
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {isOnline ? 'Connected' : 'Offline Mode'}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {isOnline
                      ? 'All features available'
                      : 'Messages will sync when online'
                    }
                  </div>
                </div>
              </div>

              {/* Cache Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cached Messages</div>
                  <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {cacheStats.totalMessages}
                  </div>
                </div>

                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cache Size</div>
                  <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {Math.round(cacheStats.cacheSize * 100) / 100}MB
                  </div>
                </div>
              </div>

              {/* Pending Sync Items */}
              {cacheStats.pendingItems > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Pending Sync
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {cacheStats.pendingItems} items waiting to sync
                  </div>
                </div>
              )}

              {/* Last Sync Result */}
              {lastSyncResult && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    {lastSyncResult.failed > 0 ? (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Last Sync
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {lastSyncResult.success} successful, {lastSyncResult.failed} failed
                  </div>
                </div>
              )}

              {/* Sync in Progress */}
              {isSyncing && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Syncing data...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t p-4 space-y-3" style={{ borderColor: 'var(--border-primary)' }}>
              {/* Sync Button */}
              {isOnline && cacheStats.pendingItems > 0 && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors touch-target"
                  style={{
                    backgroundColor: isSyncing ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                    color: 'white',
                    opacity: isSyncing ? 0.6 : 1
                  }}
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isSyncing ? 'Syncing...' : `Sync ${cacheStats.pendingItems} items`}
                </button>
              )}

              {/* Cancel Sync Button */}
              {isSyncing && (
                <button
                  onClick={cancelSync}
                  className="w-full px-4 py-2 rounded-lg transition-colors touch-target"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-secondary)'
                  }}
                >
                  Cancel Sync
                </button>
              )}

              {/* Clear Cache Button */}
              {(cacheStats.totalMessages > 0 || cacheStats.pendingItems > 0) && (
                <button
                  onClick={handleClearCache}
                  className="w-full px-4 py-2 rounded-lg transition-colors touch-target"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-secondary)'
                  }}
                >
                  Clear Cache
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Compact version for headers or status bars
export function OfflineStatusBadge({ className = '' }: { className?: string }) {
  const { isOnline, cacheStats } = useOfflineMode();
  const { isHydrated } = useMobileNavigation();

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return null;
  }

  // Don't show if online and no pending items
  if (isOnline && cacheStats.pendingItems === 0) return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: isOnline ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: isOnline ? '#3b82f6' : '#ef4444'
      }}
    >
      {isOnline ? (
        <Upload className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      {!isOnline ? 'Offline' : `${cacheStats.pendingItems} pending`}
    </div>
  );
}