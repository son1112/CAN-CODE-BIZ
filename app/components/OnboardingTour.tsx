'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { X, ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';

interface TooltipPosition {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  transform?: string;
}

export default function OnboardingTour() {
  const {
    isOnboardingActive,
    steps,
    stopOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({});
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const currentStep = steps[currentStepIndex];

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calculateTooltipPosition = useCallback((targetSelector: string, placement: string = 'bottom') => {
    const target = document.querySelector(targetSelector);
    if (!target) {
      console.warn(`Onboarding target not found: ${targetSelector}`);
      // Return center position as fallback
      return {
        top: window.innerHeight / 2 - 125,
        left: window.innerWidth / 2 - (isMobile ? 175 : 200),
        transform: 'none'
      };
    }

    const rect = target.getBoundingClientRect();
    const tooltipWidth = isMobile ? Math.min(350, window.innerWidth - 40) : 400;
    const tooltipHeight = isMobile ? 250 : 200; // More height for mobile content
    const offset = isMobile ? 15 : 20;

    const position: TooltipPosition = {};

    switch (placement) {
      case 'top':
        position.top = rect.top - tooltipHeight - offset;
        position.left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        position.top = rect.bottom + offset;
        position.left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        position.top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        position.left = rect.left - tooltipWidth - offset;
        break;
      case 'right':
        position.top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        position.left = rect.right + offset;
        break;
      case 'center':
        position.top = window.innerHeight / 2 - tooltipHeight / 2;
        position.left = window.innerWidth / 2 - tooltipWidth / 2;
        break;
      default:
        position.top = rect.bottom + offset;
        position.left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    }

    // Enhanced mobile viewport constraints
    const margin = isMobile ? 20 : 10;
    const safeAreaTop = isMobile ? 50 : 10; // Account for mobile status bar
    const safeAreaBottom = isMobile ? 100 : 10; // Account for mobile home indicator
    
    // Ensure tooltip stays within safe areas
    if (position.left && position.left < margin) position.left = margin;
    if (position.left && position.left + tooltipWidth > window.innerWidth - margin) {
      position.left = window.innerWidth - tooltipWidth - margin;
    }
    if (position.top && position.top < safeAreaTop) position.top = safeAreaTop;
    if (position.top && position.top + tooltipHeight > window.innerHeight - safeAreaBottom) {
      position.top = window.innerHeight - tooltipHeight - safeAreaBottom;
    }

    // On mobile, prefer center positioning for better readability
    if (isMobile && (placement === 'left' || placement === 'right')) {
      position.top = Math.max(safeAreaTop, Math.min(
        window.innerHeight - tooltipHeight - safeAreaBottom,
        rect.top + (rect.height / 2) - (tooltipHeight / 2)
      ));
      position.left = margin;
      position.transform = 'none';
    }

    return position;
  }, [isMobile]);

  const scrollToTarget = useCallback((targetSelector: string) => {
    const target = document.querySelector(targetSelector);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }, []);

  const highlightTarget = useCallback((targetSelector: string) => {
    // Remove previous highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });

    // Add highlight to current target
    const target = document.querySelector(targetSelector);
    if (target) {
      target.classList.add('onboarding-highlight');
    }
  }, []);

  const updateTooltipPosition = useCallback(() => {
    if (!currentStep) return;

    const position = calculateTooltipPosition(currentStep.target, currentStep.placement);
    setTooltipPosition(position);
    highlightTarget(currentStep.target);
  }, [currentStep, calculateTooltipPosition, highlightTarget]);

  useEffect(() => {
    if (isOnboardingActive && currentStep) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        scrollToTarget(currentStep.target);
        updateTooltipPosition();
        setIsVisible(true);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      // Remove highlights when closing
      document.querySelectorAll('.onboarding-highlight').forEach(el => {
        el.classList.remove('onboarding-highlight');
      });
    }
  }, [isOnboardingActive, currentStep, scrollToTarget, updateTooltipPosition]);

  useEffect(() => {
    const handleResize = () => {
      if (isOnboardingActive) {
        updateTooltipPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOnboardingActive, updateTooltipPosition]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    stopOnboarding();
  };

  const handleClose = () => {
    stopOnboarding();
  };

  if (!isOnboardingActive || !currentStep || !isVisible) {
    return null;
  }

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
          pointerEvents: 'auto'
        }}
        onClick={handleClose}
      />

      {/* Spotlight */}
      <style jsx global>{`
        .onboarding-highlight {
          position: relative;
          z-index: 45;
          border-radius: 12px;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 0 9999px rgba(0, 0, 0, 0.5) !important;
          animation: onboarding-pulse 2s infinite;
        }

        @keyframes onboarding-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>

      {/* Tooltip */}
      <div
        className={`fixed ${isMobile ? 'max-w-none mx-5' : 'max-w-sm'}`}
        style={{
          ...tooltipPosition,
          pointerEvents: 'auto',
          zIndex: 9999,
          width: isMobile ? `${Math.min(350, window.innerWidth - 40)}px` : 'auto'
        }}
      >
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ${
            isMobile ? 'text-sm' : ''
          }`}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Close Button - Mobile Optimized */}
          <button
            onClick={handleClose}
            className={`absolute top-4 right-4 z-10 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ${
              isMobile ? 'p-3' : 'p-2'
            }`}
            style={{ minWidth: '44px', minHeight: '44px' }} // Touch-friendly minimum size
          >
            <X size={isMobile ? 20 : 16} />
          </button>

          {/* Content */}
          <div className="p-6 pb-4">
            {currentStep.title && (
              <h3 className="text-xl font-bold text-gray-900 mb-3 pr-8">
                {currentStep.title}
              </h3>
            )}
            <div className="text-gray-700 leading-relaxed">
              {currentStep.content}
            </div>
          </div>

          {/* Footer - Mobile Responsive */}
          <div className={`px-6 py-4 bg-gray-50 border-t border-gray-100 ${
            isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-between'
          }`}>
            {/* Top row on mobile - Progress and Skip */}
            <div className={`flex items-center ${isMobile ? 'justify-between' : 'gap-3'}`}>
              <button
                onClick={handleSkip}
                className={`text-gray-500 hover:text-gray-700 font-medium transition-colors flex items-center gap-1 ${
                  isMobile ? 'text-sm py-2 px-1' : 'text-sm'
                }`}
                style={{ minHeight: '44px' }} // Touch-friendly
              >
                <SkipForward size={isMobile ? 16 : 14} />
                Skip Tour
              </button>

              <div className={`text-gray-400 font-medium ${
                isMobile ? 'text-sm' : 'text-xs'
              }`}>
                {currentStepIndex + 1} of {steps.length}
              </div>
            </div>

            {/* Bottom row on mobile - Navigation buttons */}
            <div className={`flex items-center gap-3 ${
              isMobile ? 'w-full' : ''
            }`}>
              {!isFirstStep && (
                <button
                  onClick={handlePrevious}
                  className={`text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-1 ${
                    isMobile ? 'px-4 py-3 text-base flex-1' : 'px-4 py-2 text-sm'
                  }`}
                  style={{ minHeight: '44px' }} // Touch-friendly
                >
                  <ArrowLeft size={isMobile ? 16 : 14} />
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-1 shadow-sm ${
                  isMobile ? 'px-6 py-3 text-base flex-1 justify-center' : 'px-5 py-2 text-sm'
                }`}
                style={{ minHeight: '44px' }} // Touch-friendly
              >
                {isLastStep ? (
                  <>
                    Get Started
                    <span className="text-lg">🦆</span>
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight size={isMobile ? 16 : 14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}