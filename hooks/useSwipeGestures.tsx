'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

interface SwipeGestureOptions {
  enabled?: boolean;
  threshold?: number;
  restoreThreshold?: number;
  maxSwipeTime?: number;
  preventScrollOnSwipe?: boolean;
}

interface SwipeAction {
  id: string;
  icon: string;
  label: string;
  color: string;
  action: () => void | Promise<void>;
  threshold?: number;
}

interface SwipeGestureHandlers {
  onSwipeStart?: () => void;
  onSwipeMove?: (direction: 'left' | 'right', distance: number, progress: number) => void;
  onSwipeEnd?: (direction: 'left' | 'right' | null, distance: number) => void;
  onActionTrigger?: (action: SwipeAction) => void;
}

interface SwipeGestureState {
  isActive: boolean;
  direction: 'left' | 'right' | null;
  distance: number;
  progress: number;
  activeAction: SwipeAction | null;
  isThresholdReached: boolean;
}

export function useSwipeGestures(
  leftActions: SwipeAction[] = [],
  rightActions: SwipeAction[] = [],
  options: SwipeGestureOptions = {},
  handlers: SwipeGestureHandlers = {}
) {
  const {
    enabled = true,
    threshold = 80,
    restoreThreshold = 20,
    maxSwipeTime = 1000,
    preventScrollOnSwipe = true
  } = options;

  const { hapticPattern } = useHapticFeedback();
  
  const [state, setState] = useState<SwipeGestureState>({
    isActive: false,
    direction: null,
    distance: 0,
    progress: 0,
    activeAction: null,
    isThresholdReached: false
  });

  const startTimeRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const elementRef = useRef<HTMLElement | null>(null);
  const hasTriggeredHapticRef = useRef<boolean>(false);

  // Reset state
  const resetState = useCallback(() => {
    setState({
      isActive: false,
      direction: null,
      distance: 0,
      progress: 0,
      activeAction: null,
      isThresholdReached: false
    });
    hasTriggeredHapticRef.current = false;
  }, []);

  // Calculate progress and determine active action
  const calculateProgress = useCallback((distance: number, direction: 'left' | 'right') => {
    const actions = direction === 'left' ? leftActions : rightActions;
    if (actions.length === 0) return { progress: 0, activeAction: null, isThresholdReached: false };

    const maxDistance = Math.max(...actions.map(action => action.threshold || threshold));
    const progress = Math.min(Math.abs(distance) / maxDistance, 1);
    
    // Find the action that should be triggered at this distance
    const activeAction = actions.find(action => 
      Math.abs(distance) >= (action.threshold || threshold)
    ) || null;

    const isThresholdReached = activeAction !== null;

    return { progress, activeAction, isThresholdReached };
  }, [leftActions, rightActions, threshold]);

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!enabled || !elementRef.current) return;

    const touch = event.touches[0];
    startTimeRef.current = Date.now();
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = touch.clientX;

    setState(prev => ({ ...prev, isActive: true }));
    handlers.onSwipeStart?.();
  }, [enabled, handlers]);

  // Handle touch move
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!state.isActive || !elementRef.current) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if this is a horizontal swipe
    if (absDeltaX > absDeltaY && absDeltaX > 10) {
      if (preventScrollOnSwipe) {
        event.preventDefault();
      }

      const direction: 'left' | 'right' = deltaX > 0 ? 'right' : 'left';
      const distance = Math.abs(deltaX);

      const { progress, activeAction, isThresholdReached } = calculateProgress(distance, direction);

      // Trigger haptic feedback when threshold is reached
      if (isThresholdReached && !hasTriggeredHapticRef.current) {
        hapticPattern('selection');
        hasTriggeredHapticRef.current = true;
      }

      setState(prev => ({
        ...prev,
        direction,
        distance,
        progress,
        activeAction,
        isThresholdReached
      }));

      handlers.onSwipeMove?.(direction, distance, progress);
      currentXRef.current = touch.clientX;
    }
  }, [state.isActive, preventScrollOnSwipe, calculateProgress, hapticPattern, handlers]);

  // Handle touch end
  const handleTouchEnd = useCallback(async (event: TouchEvent) => {
    if (!state.isActive) return;

    const swipeTime = Date.now() - startTimeRef.current;
    const { direction, distance, activeAction, isThresholdReached } = state;

    // Check if swipe is valid and within time limit
    if (direction && distance > restoreThreshold && swipeTime < maxSwipeTime) {
      if (isThresholdReached && activeAction) {
        // Trigger action
        try {
          hapticPattern('success');
          handlers.onActionTrigger?.(activeAction);
          await activeAction.action();
        } catch (error) {
          hapticPattern('error');
          console.error('Swipe action failed:', error);
        }
      }
    }

    handlers.onSwipeEnd?.(direction, distance);
    resetState();
  }, [state, restoreThreshold, maxSwipeTime, hapticPattern, handlers, resetState]);

  // Handle mouse events for desktop testing
  const handleMouseStart = useCallback((event: MouseEvent) => {
    if (!enabled || !elementRef.current) return;
    
    startTimeRef.current = Date.now();
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    currentXRef.current = event.clientX;

    setState(prev => ({ ...prev, isActive: true }));
    handlers.onSwipeStart?.();
  }, [enabled, handlers]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!state.isActive || !elementRef.current) return;

    const deltaX = event.clientX - startXRef.current;
    const deltaY = event.clientY - startYRef.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY && absDeltaX > 10) {
      const direction: 'left' | 'right' = deltaX > 0 ? 'right' : 'left';
      const distance = Math.abs(deltaX);

      const { progress, activeAction, isThresholdReached } = calculateProgress(distance, direction);

      if (isThresholdReached && !hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = true;
      }

      setState(prev => ({
        ...prev,
        direction,
        distance,
        progress,
        activeAction,
        isThresholdReached
      }));

      handlers.onSwipeMove?.(direction, distance, progress);
      currentXRef.current = event.clientX;
    }
  }, [state.isActive, calculateProgress, handlers]);

  const handleMouseEnd = useCallback(async (event: MouseEvent) => {
    if (!state.isActive) return;

    const swipeTime = Date.now() - startTimeRef.current;
    const { direction, distance, activeAction, isThresholdReached } = state;

    if (direction && distance > restoreThreshold && swipeTime < maxSwipeTime) {
      if (isThresholdReached && activeAction) {
        try {
          handlers.onActionTrigger?.(activeAction);
          await activeAction.action();
        } catch (error) {
          console.error('Swipe action failed:', error);
        }
      }
    }

    handlers.onSwipeEnd?.(direction, distance);
    resetState();
  }, [state, restoreThreshold, maxSwipeTime, handlers, resetState]);

  // Attach event listeners to element
  const attachListeners = useCallback((element: HTMLElement) => {
    if (!enabled) return;

    elementRef.current = element;

    // Touch events for mobile
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Mouse events for desktop testing
    element.addEventListener('mousedown', handleMouseStart);
    
    const handleMouseMoveGlobal = (e: MouseEvent) => handleMouseMove(e);
    const handleMouseEndGlobal = (e: MouseEvent) => handleMouseEnd(e);
    
    document.addEventListener('mousemove', handleMouseMoveGlobal);
    document.addEventListener('mouseup', handleMouseEndGlobal);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleMouseStart);
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseEndGlobal);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseStart, handleMouseMove, handleMouseEnd]);

  // Get CSS transform for visual feedback
  const getSwipeTransform = useCallback(() => {
    if (!state.isActive || !state.direction || state.distance === 0) {
      return 'translateX(0px)';
    }

    const maxTransform = Math.min(state.distance * 0.3, 40); // Limit visual feedback
    const direction = state.direction === 'right' ? 1 : -1;
    return `translateX(${direction * maxTransform}px)`;
  }, [state.isActive, state.direction, state.distance]);

  // Get background color for visual feedback
  const getSwipeBackground = useCallback(() => {
    if (!state.isActive || !state.activeAction) {
      return 'transparent';
    }

    const opacity = Math.min(state.progress * 0.1, 0.1);
    return state.activeAction.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
  }, [state.isActive, state.activeAction, state.progress]);

  // Get action indicator styles
  const getActionIndicator = useCallback((side: 'left' | 'right') => {
    const actions = side === 'left' ? leftActions : rightActions;
    if (actions.length === 0 || !state.isActive || state.direction !== side) {
      return { opacity: 0, scale: 0.8 };
    }

    const opacity = Math.min(state.progress * 2, 1);
    const scale = state.isThresholdReached ? 1.2 : Math.min(0.8 + state.progress * 0.4, 1);

    return { opacity, scale };
  }, [leftActions, rightActions, state]);

  return {
    // State
    ...state,
    
    // Methods
    attachListeners,
    resetState,
    
    // Visual feedback helpers
    getSwipeTransform,
    getSwipeBackground,
    getActionIndicator,
    
    // Computed properties
    canSwipeLeft: leftActions.length > 0,
    canSwipeRight: rightActions.length > 0,
    isSwipeActive: state.isActive && (state.direction === 'left' || state.direction === 'right')
  };
}