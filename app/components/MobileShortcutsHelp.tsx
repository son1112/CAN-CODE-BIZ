'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, Keyboard, Zap, Hand, ChevronDown, ChevronUp } from 'lucide-react';
import { useMobileKeyboardShortcuts, formatShortcut, getPlatformKeySymbols } from '@/hooks/useMobileKeyboardShortcuts';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

interface MobileShortcutsHelpProps {
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export default function MobileShortcutsHelp({
  isVisible,
  onClose,
  className = ''
}: MobileShortcutsHelpProps) {
  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileDevice = isMobile || isTablet;

  const {
    shortcutsByCategory,
    gestures,
    enableGestures,
    enablePhysicalKeys,
    hapticFeedback
  } = useMobileKeyboardShortcuts();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    navigation: true,
    messaging: true,
    ui: false,
    accessibility: false
  });

  const [activeTab, setActiveTab] = useState<'shortcuts' | 'gestures'>('shortcuts');
  const keySymbols = getPlatformKeySymbols();

  // Don't render if not visible
  if (!isVisible) return null;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation': return '🧭';
      case 'messaging': return '💬';
      case 'ui': return '🎨';
      case 'accessibility': return '♿';
      default: return '⚡';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'navigation': return '#3b82f6';
      case 'messaging': return '#10b981';
      case 'ui': return '#8b5cf6';
      case 'accessibility': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const formatGestureDirection = (direction: string) => {
    const arrows = {
      up: '↑',
      down: '↓',
      left: '←',
      right: '→',
      tap: '👆',
      'long-press': '👆⏰'
    };
    return arrows[direction as keyof typeof arrows] || direction;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden ${className}`}
        style={{
          border: '1px solid var(--border-primary)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center gap-3">
            {isMobileDevice ? (
              <Smartphone className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            ) : (
              <Keyboard className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            )}
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {isMobileDevice ? 'Mobile Shortcuts' : 'Keyboard Shortcuts'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
            style={{ minWidth: '40px', minHeight: '40px' }}
          >
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Tabs */}
        {isMobileDevice && (
          <div className="flex border-b" style={{ borderColor: 'var(--border-primary)' }}>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === 'shortcuts'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Keys
            </button>
            <button
              onClick={() => setActiveTab('gestures')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === 'gestures'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Hand className="w-4 h-4" />
              Gestures
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {/* Keyboard Shortcuts Tab */}
          {(!isMobileDevice || activeTab === 'shortcuts') && (
            <div className="space-y-4">
              {/* Status */}
              {enablePhysicalKeys ? (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Keyboard shortcuts are enabled
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <X className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Keyboard shortcuts are disabled
                  </span>
                </div>
              )}

              {/* Shortcuts by Category */}
              {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
                <div key={category} className="border rounded-lg" style={{ borderColor: 'var(--border-secondary)' }}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-t-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getCategoryIcon(category)}</span>
                      <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                        {category}
                      </span>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `${getCategoryColor(category)}20`,
                          color: getCategoryColor(category)
                        }}
                      >
                        {shortcuts.length}
                      </span>
                    </div>
                    {expandedCategories[category] ? (
                      <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    )}
                  </button>

                  {expandedCategories[category] && (
                    <div className="border-t space-y-2 p-3" style={{ borderColor: 'var(--border-secondary)' }}>
                      {shortcuts.map((shortcut) => (
                        <div key={shortcut.id} className="flex items-center justify-between py-2">
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {shortcut.description}
                          </span>
                          <div
                            className="px-2 py-1 rounded text-xs font-mono"
                            style={{
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-secondary)'
                            }}
                          >
                            {formatShortcut(shortcut)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Touch Gestures Tab */}
          {isMobileDevice && activeTab === 'gestures' && (
            <div className="space-y-4">
              {/* Status */}
              {enableGestures ? (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <Hand className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Touch gestures are enabled
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <X className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Touch gestures are disabled
                  </span>
                </div>
              )}

              {/* Haptic Feedback Status */}
              {hapticFeedback && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Haptic feedback enabled
                  </span>
                </div>
              )}

              {/* Gestures List */}
              <div className="space-y-3">
                {gestures.map((gesture) => (
                  <div
                    key={gesture.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{
                      borderColor: 'var(--border-secondary)',
                      backgroundColor: 'var(--bg-secondary)'
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        {gesture.description}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {gesture.category} • {gesture.fingers} finger{gesture.fingers > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {formatGestureDirection(gesture.direction || 'tap')}
                      </span>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getCategoryColor(gesture.category) }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Gesture Guide */}
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h3 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                  Gesture Guide
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span>👆</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Single tap</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👆⏰</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Long press (500ms)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👐</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Two fingers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>↕️</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Swipe 50px min</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>
              Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">?</kbd> to toggle this help
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg transition-colors touch-target"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'white'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick gesture hint component
export function GestureHint({
  message,
  duration = 2000,
  onComplete
}: {
  message: string;
  duration?: number;
  onComplete?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-top-2 duration-300">
      <div
        className="px-4 py-2 rounded-full shadow-lg backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: 'white'
        }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
}