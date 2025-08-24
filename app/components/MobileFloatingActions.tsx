'use client';

import { useState, useCallback, useRef } from 'react';
import { Plus, Mic, Send, MessageCircle, Settings, Zap, X, ChevronUp } from 'lucide-react';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { useMobileKeyboardShortcuts } from '@/hooks/useMobileKeyboardShortcuts';
import { useButtonHaptics } from '@/hooks/useHapticFeedback';
import { GestureHint } from './MobileShortcutsHelp';

interface FloatingAction {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  action: () => void;
  color: string;
  shortcut?: string;
  primary?: boolean;
}

interface MobileFloatingActionsProps {
  actions?: FloatingAction[];
  onNewMessage?: () => void;
  onStartVoice?: () => void;
  onSendMessage?: () => void;
  onShowSettings?: () => void;
  onToggleShortcuts?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}

export default function MobileFloatingActions({
  actions: customActions = [],
  onNewMessage,
  onStartVoice,
  onSendMessage,
  onShowSettings,
  onToggleShortcuts,
  position = 'bottom-right',
  className = ''
}: MobileFloatingActionsProps) {
  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileDevice = isMobile || isTablet;

  const [isExpanded, setIsExpanded] = useState(false);
  const [showGestureHint, setShowGestureHint] = useState<string | null>(null);
  const expandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { triggerHapticFeedback, lastGesture } = useMobileKeyboardShortcuts([], {
    hapticFeedback: true,
    onShortcutTriggered: (shortcut) => {
      setShowGestureHint(`Shortcut: ${shortcut.description}`);
      setTimeout(() => setShowGestureHint(null), 2000);
    }
  });

  const { onPress, onLongPress, onSuccess, onError } = useButtonHaptics();

  // Default floating actions
  const defaultActions: FloatingAction[] = [
    {
      id: 'new-message',
      icon: MessageCircle,
      label: 'New Conversation',
      action: () => {
        onNewMessage?.();
        onPress();
        collapse();
      },
      color: '#10b981',
      shortcut: '⌘+N'
    },
    {
      id: 'voice-input',
      icon: Mic,
      label: 'Voice Input',
      action: () => {
        onStartVoice?.();
        onLongPress();
        collapse();
      },
      color: '#3b82f6',
      shortcut: 'Space'
    },
    {
      id: 'send-message',
      icon: Send,
      label: 'Send Message',
      action: () => {
        onSendMessage?.();
        onSuccess();
        collapse();
      },
      color: '#8b5cf6',
      shortcut: '⌘+↵'
    },
    {
      id: 'shortcuts-help',
      icon: Zap,
      label: 'Shortcuts',
      action: () => {
        onToggleShortcuts?.();
        collapse();
      },
      color: '#f59e0b',
      shortcut: '?'
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      action: () => {
        onShowSettings?.();
        collapse();
      },
      color: '#6b7280'
    }
  ];

  // Define all hooks first (Rules of Hooks - hooks must be called in the same order every time)
  const expand = useCallback(() => {
    setIsExpanded(true);
    onPress();

    // Auto-collapse after 5 seconds of inactivity
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
    }
    expandTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 5000);
  }, [onPress]);

  const collapse = useCallback(() => {
    setIsExpanded(false);
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
      expandTimeoutRef.current = null;
    }
  }, []);

  const toggleExpanded = useCallback(() => {
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  }, [isExpanded, expand, collapse]);

  // Long press handler for main FAB (defined after expand is available)
  const handleLongPress = useCallback(() => {
    expand();
    onLongPress();
  }, [expand, onLongPress]);

  const longPressProps = useLongPress(handleLongPress);

  // Now compute derived values
  const allActions = [...defaultActions, ...customActions].filter(action =>
    // Only show actions that have handlers
    action.action
  );

  const primaryAction = allActions.find(a => a.primary) || allActions[0];
  const secondaryActions = allActions.filter(a => a !== primaryAction);

  // Don't render on non-mobile devices (after all hooks are called)
  if (!isMobileDevice) return null;

  // Position classes with safe area consideration for mobile
  const positionClasses = {
    'bottom-right': isMobileDevice ? 'right-4 safe-area-bottom' : 'bottom-6 right-6',
    'bottom-left': isMobileDevice ? 'left-4 safe-area-bottom' : 'bottom-6 left-6',
    'bottom-center': isMobileDevice ? 'left-1/2 transform -translate-x-1/2 safe-area-bottom' : 'bottom-6 left-1/2 transform -translate-x-1/2'
  };

  // Calculate bottom position dynamically for mobile to avoid keyboard/input conflicts
  const getBottomPosition = () => {
    if (!isMobileDevice) return {};
    return {
      bottom: 'max(180px, calc(160px + env(safe-area-inset-bottom, 24px)))' // Above input area + safe area
    };
  };

  return (
    <>
      {/* Gesture Hint */}
      {(showGestureHint || lastGesture) && (
        <GestureHint
          message={showGestureHint || lastGesture || ''}
          onComplete={() => setShowGestureHint(null)}
        />
      )}

      {/* Floating Actions Container */}
      <div
        className={`fixed z-40 ${positionClasses[position]} ${className}`}
        style={{ 
          pointerEvents: 'auto',
          ...getBottomPosition()
        }}
      >
        {/* Secondary Actions (appear when expanded) */}
        {isExpanded && (
          <div className="absolute bottom-20 right-0 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-300">
            {secondaryActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="group flex items-center gap-3 touch-target rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: action.color + '15',
                    border: `2px solid ${action.color}30`,
                    minWidth: '56px',
                    minHeight: '56px',
                    animationDelay: `${index * 50}ms`
                  }}
                  title={action.label}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: action.color }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Label (shows on hover/focus) */}
                  <div className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity whitespace-nowrap pr-3">
                    <span className="text-sm font-medium" style={{ color: action.color }}>
                      {action.label}
                    </span>
                    {action.shortcut && (
                      <div className="text-xs opacity-70" style={{ color: action.color }}>
                        {action.shortcut}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Main FAB Button */}
        {primaryAction && (
          <button
            onClick={isExpanded ? collapse : (primaryAction.primary ? primaryAction.action : toggleExpanded)}
            {...longPressProps}
            className="relative group touch-target rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: isExpanded ? '#ef4444' : primaryAction.color,
              minWidth: '64px',
              minHeight: '64px',
              transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)'
            }}
            title={isExpanded ? 'Close' : primaryAction.label}
          >
            {isExpanded ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <primaryAction.icon className="w-6 h-6 text-white" />
            )}

            {/* Pulse animation for primary action */}
            {!isExpanded && primaryAction.primary && (
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{ backgroundColor: primaryAction.color }}
              />
            )}

            {/* Expansion indicator */}
            {!isExpanded && secondaryActions.length > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <ChevronUp className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        )}

        {/* Quick Access Shortcuts Overlay */}
        {isExpanded && (
          <div className="absolute bottom-20 left-0 right-0 text-center">
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white'
              }}
            >
              Long press for quick actions
            </div>
          </div>
        )}
      </div>

      {/* Backdrop (closes expanded state) */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={collapse}
          style={{ pointerEvents: 'auto' }}
        />
      )}
    </>
  );
}

// Hook for managing floating actions
export function useFloatingActions() {
  const [actions, setActions] = useState<FloatingAction[]>([]);

  const addAction = useCallback((action: FloatingAction) => {
    setActions(prev => [...prev, action]);
  }, []);

  const removeAction = useCallback((id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  }, []);

  const updateAction = useCallback((id: string, updates: Partial<FloatingAction>) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const clearActions = useCallback(() => {
    setActions([]);
  }, []);

  return {
    actions,
    addAction,
    removeAction,
    updateAction,
    clearActions
  };
}

// Note: Long press functionality is implemented using the useLongPress hook
// which provides proper touch and mouse event handlers

// Custom hook for long press detection
export function useLongPress(callback: () => void, ms: number = 500) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(callback, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop
  };
}