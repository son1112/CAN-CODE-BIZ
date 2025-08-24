'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

export interface SwipeGestureConfig {
  threshold?: number; // Minimum distance for swipe (default: 80px)
  restraint?: number; // Maximum perpendicular movement (default: 100px)
  allowedTime?: number; // Maximum time for gesture (default: 300ms)
  preventDefault?: boolean; // Prevent default touch behavior
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface SwipeState {
  isActive: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  progress: number; // 0-1 based on threshold
}

export const useSwipeGestures = (config: SwipeGestureConfig = {}) => {
  const {
    threshold = 80,
    restraint = 100,
    allowedTime = 300,
    preventDefault = true,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = config;

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isActive: false,
    direction: null,
    distance: 0,
    progress: 0,
  });

  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
  } | null>(null);

  const elementRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    setSwipeState({
      isActive: false,
      direction: null,
      distance: 0,
      progress: 0,
    });
  }, [preventDefault]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    if (preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const distX = touch.clientX - touchStartRef.current.x;
    const distY = touch.clientY - touchStartRef.current.y;
    const absDistX = Math.abs(distX);
    const absDistY = Math.abs(distY);

    // Determine primary direction
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    let distance = 0;
    let restraintViolation = false;

    if (absDistX >= absDistY) {
      // Horizontal swipe
      if (absDistX >= 10) { // Minimum movement to detect direction
        direction = distX > 0 ? 'right' : 'left';
        distance = absDistX;
        restraintViolation = absDistY > restraint;
      }
    } else {
      // Vertical swipe
      if (absDistY >= 10) { // Minimum movement to detect direction
        direction = distY > 0 ? 'down' : 'up';
        distance = absDistY;
        restraintViolation = absDistX > restraint;
      }
    }

    if (direction && !restraintViolation) {
      const progress = Math.min(distance / threshold, 1);

      setSwipeState({
        isActive: true,
        direction,
        distance,
        progress,
      });
    } else {
      setSwipeState({
        isActive: false,
        direction: null,
        distance: 0,
        progress: 0,
      });
    }
  }, [threshold, restraint, preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;

    if (preventDefault) {
      e.preventDefault();
    }

    const touch = e.changedTouches[0];
    const distX = touch.clientX - touchStartRef.current.x;
    const distY = touch.clientY - touchStartRef.current.y;
    const elapsedTime = Date.now() - touchStartRef.current.time;
    const absDistX = Math.abs(distX);
    const absDistY = Math.abs(distY);

    // Reset swipe state
    setSwipeState({
      isActive: false,
      direction: null,
      distance: 0,
      progress: 0,
    });

    // Check if this qualifies as a valid swipe
    if (elapsedTime <= allowedTime) {
      if (absDistX >= threshold && absDistY <= restraint) {
        // Horizontal swipe
        if (distX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else if (absDistY >= threshold && absDistX <= restraint) {
        // Vertical swipe
        if (distY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    touchStartRef.current = null;
  }, [threshold, restraint, allowedTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, preventDefault]);

  const handleTouchCancel = useCallback(() => {
    touchStartRef.current = null;
    setSwipeState({
      isActive: false,
      direction: null,
      distance: 0,
      progress: 0,
    });
  }, []);

  // Attach event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const options = { passive: !preventDefault };

    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);
    element.addEventListener('touchcancel', handleTouchCancel, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, preventDefault]);

  // Helper function to bind to element
  const bindToElement = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  return {
    swipeState,
    bindToElement,
    elementRef,
  };
};