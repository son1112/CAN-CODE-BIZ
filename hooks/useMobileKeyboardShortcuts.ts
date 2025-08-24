'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useMobileNavigation } from './useMobileNavigation';

interface KeyboardShortcut {
  id: string;
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'messaging' | 'ui' | 'accessibility';
  mobileOnly?: boolean;
  enabled?: boolean;
}

interface TouchGesture {
  id: string;
  description: string;
  fingers: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'tap' | 'long-press';
  action: () => void;
  category: 'navigation' | 'messaging' | 'ui';
  enabled?: boolean;
}

interface MobileKeyboardShortcutsOptions {
  enableGestures?: boolean;
  enablePhysicalKeys?: boolean;
  hapticFeedback?: boolean;
  showHints?: boolean;
  onShortcutTriggered?: (shortcut: KeyboardShortcut | TouchGesture) => void;
  onHelpRequested?: () => void;
}

export function useMobileKeyboardShortcuts(
  shortcuts: KeyboardShortcut[] = [],
  options: MobileKeyboardShortcutsOptions = {}
) {
  const {
    enableGestures = true,
    enablePhysicalKeys = true,
    hapticFeedback = true,
    showHints = false,
    onShortcutTriggered,
    onHelpRequested
  } = options;

  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileDevice = isMobile || isTablet;

  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [lastGesture, setLastGesture] = useState<string | null>(null);

  // Touch tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Default mobile shortcuts
  const defaultShortcuts: KeyboardShortcut[] = [
    {
      id: 'new-message',
      key: 'n',
      metaKey: true,
      description: 'Start new conversation',
      action: () => console.log('New conversation shortcut'),
      category: 'navigation',
      mobileOnly: true
    },
    {
      id: 'send-message',
      key: 'Enter',
      metaKey: true,
      description: 'Send message (Cmd+Enter)',
      action: () => console.log('Send message shortcut'),
      category: 'messaging'
    },
    {
      id: 'toggle-menu',
      key: 'm',
      metaKey: true,
      description: 'Toggle mobile menu',
      action: () => console.log('Toggle menu shortcut'),
      category: 'navigation',
      mobileOnly: true
    },
    {
      id: 'focus-input',
      key: 'f',
      metaKey: true,
      description: 'Focus message input',
      action: () => {
        const input = document.querySelector('textarea[placeholder*="message"], input[placeholder*="message"]') as HTMLElement;
        input?.focus();
      },
      category: 'accessibility'
    },
    {
      id: 'scroll-top',
      key: 'Home',
      description: 'Scroll to top of conversation',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      category: 'navigation'
    },
    {
      id: 'scroll-bottom',
      key: 'End',
      description: 'Scroll to bottom of conversation',
      action: () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      },
      category: 'navigation'
    },
    {
      id: 'show-help',
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => {
        setIsHelpVisible(true);
        onHelpRequested?.();
      },
      category: 'ui'
    }
  ];

  // Default mobile gestures
  const defaultGestures: TouchGesture[] = [
    {
      id: 'swipe-left-menu',
      description: 'Swipe left to open menu',
      fingers: 1,
      direction: 'left',
      action: () => console.log('Swipe left menu gesture'),
      category: 'navigation'
    },
    {
      id: 'swipe-right-back',
      description: 'Swipe right to go back',
      fingers: 1,
      direction: 'right',
      action: () => console.log('Swipe right back gesture'),
      category: 'navigation'
    },
    {
      id: 'two-finger-scroll-top',
      description: 'Two finger swipe up to scroll to top',
      fingers: 2,
      direction: 'up',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        triggerHapticFeedback('light');
      },
      category: 'navigation'
    },
    {
      id: 'two-finger-scroll-bottom',
      description: 'Two finger swipe down to scroll to bottom',
      fingers: 2,
      direction: 'down',
      action: () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        triggerHapticFeedback('light');
      },
      category: 'navigation'
    },
    {
      id: 'long-press-menu',
      description: 'Long press for context menu',
      fingers: 1,
      direction: 'long-press',
      action: () => {
        console.log('Long press context menu');
        triggerHapticFeedback('medium');
      },
      category: 'ui'
    }
  ];

  // Combine default and custom shortcuts
  const allShortcuts = [...defaultShortcuts, ...shortcuts];
  const enabledShortcuts = allShortcuts.filter(s => s.enabled !== false);
  const mobileShortcuts = enabledShortcuts.filter(s => !s.mobileOnly || isMobileDevice);

  // Trigger haptic feedback
  const triggerHapticFeedback = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback || !navigator.vibrate) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };

    navigator.vibrate(patterns[intensity]);
  }, [hapticFeedback]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enablePhysicalKeys) return;

    const shortcut = mobileShortcuts.find(s => {
      return s.key === event.key &&
             !!s.metaKey === event.metaKey &&
             !!s.ctrlKey === event.ctrlKey &&
             !!s.shiftKey === event.shiftKey &&
             !!s.altKey === event.altKey;
    });

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();

      shortcut.action();
      onShortcutTriggered?.(shortcut);
      triggerHapticFeedback('light');

      // Visual feedback for mobile
      if (isMobileDevice) {
        setLastGesture(shortcut.description);
        setTimeout(() => setLastGesture(null), 2000);
      }
    }
  }, [enablePhysicalKeys, mobileShortcuts, onShortcutTriggered, triggerHapticFeedback, isMobileDevice]);

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!enableGestures || !isMobileDevice) return;

    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Start long press detection
    if (event.touches.length === 1) {
      longPressTimeoutRef.current = setTimeout(() => {
        const longPressGesture = defaultGestures.find(g => g.direction === 'long-press');
        if (longPressGesture && longPressGesture.enabled !== false) {
          longPressGesture.action();
          onShortcutTriggered?.(longPressGesture);
          setLastGesture(longPressGesture.description);
          setTimeout(() => setLastGesture(null), 2000);
        }
      }, 500);
    }
  }, [enableGestures, isMobileDevice, onShortcutTriggered]);

  // Handle touch end
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!enableGestures || !isMobileDevice || !touchStartRef.current) return;

    // Clear long press timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const touch = event.changedTouches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    const startTouch = touchStartRef.current;
    const endTouch = touchEndRef.current;

    const deltaX = endTouch.x - startTouch.x;
    const deltaY = endTouch.y - startTouch.y;
    const deltaTime = endTouch.time - startTouch.time;

    // Minimum distance for gesture recognition
    const minSwipeDistance = 50;
    const maxSwipeTime = 500;

    // Detect gesture direction
    let direction: 'up' | 'down' | 'left' | 'right' | 'tap' | null = null;

    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
      direction = 'tap';
    } else if (deltaTime < maxSwipeTime) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          direction = deltaX > 0 ? 'right' : 'left';
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          direction = deltaY > 0 ? 'down' : 'up';
        }
      }
    }

    if (direction) {
      const fingerCount = event.touches.length + 1; // +1 for the lifted finger

      const gesture = defaultGestures.find(g =>
        g.direction === direction &&
        g.fingers === fingerCount &&
        g.enabled !== false
      );

      if (gesture) {
        gesture.action();
        onShortcutTriggered?.(gesture);

        setLastGesture(gesture.description);
        setTimeout(() => setLastGesture(null), 2000);
      }
    }

    touchStartRef.current = null;
  }, [enableGestures, isMobileDevice, onShortcutTriggered]);

  // Add event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (enablePhysicalKeys) {
      document.addEventListener('keydown', handleKeyDown);
    }

    if (enableGestures && isMobileDevice) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);

      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current);
      }
    };
  }, [enablePhysicalKeys, enableGestures, isMobileDevice, handleKeyDown, handleTouchStart, handleTouchEnd]);

  // Group shortcuts by category
  const shortcutsByCategory = mobileShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  // Register a new shortcut
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcuts.push(shortcut);
  }, [shortcuts]);

  // Unregister a shortcut
  const unregisterShortcut = useCallback((id: string) => {
    const index = shortcuts.findIndex(s => s.id === id);
    if (index >= 0) {
      shortcuts.splice(index, 1);
    }
  }, [shortcuts]);

  // Show help modal
  const showHelp = useCallback(() => {
    setIsHelpVisible(true);
    onHelpRequested?.();
  }, [onHelpRequested]);

  // Hide help modal
  const hideHelp = useCallback(() => {
    setIsHelpVisible(false);
  }, []);

  return {
    // State
    isHelpVisible,
    lastGesture,
    shortcuts: mobileShortcuts,
    shortcutsByCategory,
    gestures: defaultGestures.filter(g => g.enabled !== false),

    // Configuration
    enableGestures,
    enablePhysicalKeys,
    hapticFeedback,
    isMobileDevice,

    // Actions
    registerShortcut,
    unregisterShortcut,
    showHelp,
    hideHelp,
    triggerHapticFeedback
  };
}

// Format keyboard shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.metaKey) parts.push('⌘');
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('⇧');

  parts.push(shortcut.key);

  return parts.join(' + ');
}

// Get appropriate key symbols for the platform
export function getPlatformKeySymbols() {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return {
    meta: isMac ? '⌘' : 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: '⇧',
    enter: '↵',
    escape: '⎋',
    backspace: '⌫',
    delete: '⌦',
    tab: '⇥',
    space: '␣'
  };
}