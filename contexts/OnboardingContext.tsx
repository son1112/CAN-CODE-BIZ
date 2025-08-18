'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface OnboardingStep {
  target: string;
  content: React.ReactNode;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  disableBeacon?: boolean;
  spotlightClicks?: boolean;
  hideCloseButton?: boolean;
  hideFooter?: boolean;
  showProgress?: boolean;
  showSkipButton?: boolean;
  styles?: object;
}

interface OnboardingContextType {
  isOnboardingActive: boolean;
  hasCompletedOnboarding: boolean;
  currentStepIndex: number;
  startOnboarding: () => void;
  stopOnboarding: () => void;
  resetOnboarding: () => void;
  completeOnboarding: () => void;
  steps: OnboardingStep[];
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = 'rubber-ducky-onboarding-completed';

export const onboardingSteps: OnboardingStep[] = [
  {
    target: '[data-onboarding="logo"]',
    title: 'Welcome to Rubber Ducky Live! 🦆',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          Your AI thinking companion is here to help you work through problems, just like the classic <strong>rubber duck debugging</strong> technique!
        </p>
        <p className="text-sm text-gray-600">
          Talk through your thoughts, get AI insights, and solve problems together.
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-onboarding="chat-area"]',
    title: 'Your Conversation Space',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          This is where all your conversations happen. Each message gets its own <strong>professional document-style</strong> presentation with titles and timestamps.
        </p>
        <p className="text-sm text-gray-600">
          Messages are organized like papers in a filing system for easy reference.
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-onboarding="voice-input"]',
    title: 'Voice Recognition Magic 🎙️',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          Click the microphone to <strong>talk directly</strong> to your AI companion! Enable <strong>continuous mode</strong> for hands-free conversations.
        </p>
        <p className="text-sm text-gray-600">
          Perfect for thinking out loud while you work.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-onboarding="agent-selector"]',
    title: 'Choose Your AI Personality',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          Select from different <strong>AI agents</strong> with specialized knowledge and personalities. Each agent brings unique expertise to your conversations.
        </p>
        <p className="text-sm text-gray-600">
          From coding help to creative thinking - there's an agent for every need.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-onboarding="sidebar-toggle"]',
    title: 'Session Management',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          Access your <strong>conversation history</strong>, manage sessions, and organize your thoughts. All conversations are automatically saved.
        </p>
        <p className="text-sm text-gray-600">
          Never lose track of important insights or previous discussions.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-onboarding="continuous-mode"]',
    title: 'Live Conversation Mode',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          Toggle <strong>continuous conversation mode</strong> for seamless, hands-free interaction. I'll listen and respond naturally as you think out loud.
        </p>
        <p className="text-sm text-gray-600">
          Perfect for rubber duck debugging sessions!
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-onboarding="message-input"]',
    title: 'Ready to Start! 🚀',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          You're all set! <strong>Type or speak</strong> to start your first conversation. Ask me anything, share your thoughts, or just start thinking out loud.
        </p>
        <p className="text-sm text-gray-600 font-medium">
          Remember: I'm here to help you think through problems, just like a rubber duck! 🦆
        </p>
      </div>
    ),
    placement: 'top',
  },
];

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    setHasCompletedOnboarding(completed);
    
    // Auto-start onboarding for new users (disabled for testing)
    // if (!completed) {
    //   // Small delay to ensure DOM is ready
    //   const timer = setTimeout(() => {
    //     setIsOnboardingActive(true);
    //   }, 1000);
    //   return () => clearTimeout(timer);
    // }
  }, []);

  const startOnboarding = () => {
    setCurrentStepIndex(0);
    setIsOnboardingActive(true);
  };

  const stopOnboarding = () => {
    setIsOnboardingActive(false);
    setCurrentStepIndex(0);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setHasCompletedOnboarding(false);
    startOnboarding();
  };

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setHasCompletedOnboarding(true);
    setIsOnboardingActive(false);
    setCurrentStepIndex(0);
  };

  const value: OnboardingContextType = {
    isOnboardingActive,
    hasCompletedOnboarding,
    currentStepIndex,
    startOnboarding,
    stopOnboarding,
    resetOnboarding,
    completeOnboarding,
    steps: onboardingSteps,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}