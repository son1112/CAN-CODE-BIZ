'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useMobileNavigation } from './useMobileNavigation';

interface KeyboardState {
  isVisible: boolean;
  height: number;
  previousHeight: number;
  animationDuration: number;
}

interface MobileKeyboardOptions {
  enabled?: boolean;
  adjustViewport?: boolean;
  smoothTransitions?: boolean;
  debugMode?: boolean;
  onKeyboardShow?: (height: number) => void;
  onKeyboardHide?: () => void;
  onHeightChange?: (height: number, previousHeight: number) => void;
}

export function useMobileKeyboard(options: MobileKeyboardOptions = {}) {
  const {
    enabled = true,
    adjustViewport = true,
    smoothTransitions = true,
    debugMode = false,
    onKeyboardShow,
    onKeyboardHide,
    onHeightChange
  } = options;

  const { isMobile, isTablet } = useMobileNavigation();
  const isMobileDevice = isMobile || isTablet;

  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    previousHeight: 0,
    animationDuration: 300
  });

  const initialViewportHeightRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isIOSRef = useRef<boolean>(false);

  // Debug logging
  const debugLog = useCallback((message: string, data?: any) => {
    if (debugMode) {
      console.log(`[MobileKeyboard] ${message}`, data || '');
    }
  }, [debugMode]);

  // Detect iOS specifically for keyboard handling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    isIOSRef.current = /iPad|iPhone|iPod/.test(navigator.userAgent);
    initialViewportHeightRef.current = window.innerHeight;
    
    debugLog('Initialized', { 
      isIOS: isIOSRef.current, 
      initialHeight: initialViewportHeightRef.current 
    });
  }, [debugLog]);

  // Handle viewport height changes
  const handleViewportChange = useCallback(() => {
    if (!enabled || !isMobileDevice || typeof window === 'undefined') return;

    const currentHeight = window.innerHeight;
    const initialHeight = initialViewportHeightRef.current;
    const heightDifference = initialHeight - currentHeight;
    
    debugLog('Viewport change', { currentHeight, initialHeight, heightDifference });

    // Threshold for keyboard detection (adjust for different devices)
    const keyboardThreshold = isIOSRef.current ? 150 : 100;
    const isKeyboardVisible = heightDifference > keyboardThreshold;
    
    // Calculate keyboard height (with some padding for UI elements)
    const keyboardHeight = isKeyboardVisible ? Math.max(heightDifference - 50, 0) : 0;

    setKeyboardState(prev => {
      const hasChanged = prev.isVisible !== isKeyboardVisible || prev.height !== keyboardHeight;
      
      if (hasChanged) {
        debugLog('Keyboard state change', { 
          wasVisible: prev.isVisible, 
          nowVisible: isKeyboardVisible,
          height: keyboardHeight
        });

        // Fire callbacks
        if (!prev.isVisible && isKeyboardVisible) {
          onKeyboardShow?.(keyboardHeight);
        } else if (prev.isVisible && !isKeyboardVisible) {
          onKeyboardHide?.();
        }
        
        if (prev.height !== keyboardHeight) {
          onHeightChange?.(keyboardHeight, prev.height);
        }

        return {
          ...prev,
          isVisible: isKeyboardVisible,
          previousHeight: prev.height,
          height: keyboardHeight
        };
      }

      return prev;
    });
  }, [enabled, isMobileDevice, onKeyboardShow, onKeyboardHide, onHeightChange, debugLog]);

  // Enhanced focus management for mobile inputs
  const handleInputFocus = useCallback((element: HTMLElement) => {
    if (!isMobileDevice || !enabled) return;

    debugLog('Input focused', { element: element.tagName });

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Delayed handling to allow keyboard animation
    timeoutRef.current = setTimeout(() => {
      // Ensure input is visible above keyboard
      const elementRect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const keyboardHeight = keyboardState.height;
      const availableHeight = viewportHeight - keyboardHeight;
      
      if (elementRect.bottom > availableHeight) {
        const scrollAmount = elementRect.bottom - availableHeight + 20; // 20px padding
        
        if (smoothTransitions) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        } else {
          window.scrollBy(0, scrollAmount);
        }
        
        debugLog('Scrolled to keep input visible', { scrollAmount });
      }
    }, isIOSRef.current ? 350 : 250); // iOS needs longer delay

  }, [isMobileDevice, enabled, keyboardState.height, smoothTransitions, debugLog]);

  // Enhanced blur management
  const handleInputBlur = useCallback(() => {
    if (!isMobileDevice || !enabled) return;

    debugLog('Input blurred');

    // Clear focus timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Small delay to check if another input gets focus
    timeoutRef.current = setTimeout(() => {
      if (!document.activeElement || 
          !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        debugLog('No active input, keyboard likely hiding');
      }
    }, 100);
  }, [isMobileDevice, enabled, debugLog]);

  // Setup viewport listeners
  useEffect(() => {
    if (!enabled || !isMobileDevice) return;

    // Multiple event listeners for different scenarios
    const events = [
      'resize',
      'orientationchange',
      'visualViewport' in window ? 'scroll' : null
    ].filter(Boolean) as string[];

    events.forEach(event => {
      if (event === 'scroll' && 'visualViewport' in window) {
        (window as any).visualViewport.addEventListener('resize', handleViewportChange);
      } else {
        window.addEventListener(event, handleViewportChange);
      }
    });

    // Initial check
    handleViewportChange();

    return () => {
      events.forEach(event => {
        if (event === 'scroll' && 'visualViewport' in window) {
          (window as any).visualViewport.removeEventListener('resize', handleViewportChange);
        } else {
          window.removeEventListener(event, handleViewportChange);
        }
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, isMobileDevice, handleViewportChange]);

  // CSS custom properties for keyboard height
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    document.documentElement.style.setProperty('--keyboard-height', `${keyboardState.height}px`);
    document.documentElement.style.setProperty(
      '--available-height', 
      `${window.innerHeight - keyboardState.height}px`
    );
  }, [enabled, keyboardState.height]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get safe styles for keyboard-aware positioning
  const getSafeAreaStyles = useCallback((position: 'top' | 'bottom' = 'bottom') => {
    if (!keyboardState.isVisible) {
      return {
        [position]: 'max(24px, env(safe-area-inset-bottom, 24px))'
      };
    }

    return {
      [position]: position === 'bottom' 
        ? `${keyboardState.height + 24}px`
        : '24px'
    };
  }, [keyboardState.isVisible, keyboardState.height]);

  // Get container styles for keyboard-aware layouts
  const getContainerStyles = useCallback(() => {
    const styles: React.CSSProperties = {};

    if (adjustViewport && keyboardState.isVisible) {
      styles.paddingBottom = `${keyboardState.height}px`;
      
      if (smoothTransitions) {
        styles.transition = `padding-bottom ${keyboardState.animationDuration}ms ease-out`;
      }
    }

    return styles;
  }, [adjustViewport, keyboardState.isVisible, keyboardState.height, keyboardState.animationDuration, smoothTransitions]);

  // Enhanced input element utilities
  const createInputProps = useCallback((additionalProps: any = {}) => {
    if (!isMobileDevice) return additionalProps;

    return {
      ...additionalProps,
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        handleInputFocus(e.currentTarget);
        additionalProps.onFocus?.(e);
      },
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        handleInputBlur();
        additionalProps.onBlur?.(e);
      },
      style: {
        fontSize: '16px', // Prevent iOS zoom
        ...additionalProps.style
      }
    };
  }, [isMobileDevice, handleInputFocus, handleInputBlur]);

  // Scroll to element utility
  const scrollToElement = useCallback((element: HTMLElement, options: ScrollIntoViewOptions = {}) => {
    if (!isMobileDevice) return;

    const defaultOptions: ScrollIntoViewOptions = {
      behavior: smoothTransitions ? 'smooth' : 'auto',
      block: 'center',
      inline: 'nearest',
      ...options
    };

    element.scrollIntoView(defaultOptions);
  }, [isMobileDevice, smoothTransitions]);

  return {
    // State
    isVisible: keyboardState.isVisible,
    height: keyboardState.height,
    previousHeight: keyboardState.previousHeight,
    animationDuration: keyboardState.animationDuration,
    
    // Utilities
    getSafeAreaStyles,
    getContainerStyles,
    createInputProps,
    scrollToElement,
    
    // Handlers
    onInputFocus: handleInputFocus,
    onInputBlur: handleInputBlur,
    
    // Device info
    isMobileDevice,
    isIOS: isIOSRef.current,
    
    // Computed properties
    availableHeight: typeof window !== 'undefined' ? window.innerHeight - keyboardState.height : 0,
    isKeyboardAnimating: keyboardState.height !== keyboardState.previousHeight
  };
}