'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTrial } from './TrialContext';

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
  // Trial-specific properties
  trialFeature?: string;
  premiumHighlight?: boolean;
  demoAction?: string;
  conversionValue?: number;
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
  // Trial-specific methods
  trackOnboardingProgress: (stepIndex: number) => void;
  getOnboardingProgress: () => { current: number; total: number; percentage: number };
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = 'rubber-ducky-onboarding-completed';

export const onboardingSteps: OnboardingStep[] = [
  {
    target: '[data-onboarding="logo"]',
    title: 'Welcome to Your 7-Day Premium Trial! 🦆✨',
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <p className="text-base leading-relaxed font-medium text-blue-900">
            Experience the full power of <strong>Claude 4 AI</strong>, unlimited exports, premium voice features, and priority support - completely free for 7 days!
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-50 p-2 rounded border border-green-200">
            <span className="font-semibold text-green-800">🧠 Claude 4 Access</span>
          </div>
          <div className="bg-green-50 p-2 rounded border border-green-200">
            <span className="font-semibold text-green-800">📄 Unlimited Exports</span>
          </div>
          <div className="bg-green-50 p-2 rounded border border-green-200">
            <span className="font-semibold text-green-800">🎙️ Premium Voice</span>
          </div>
          <div className="bg-green-50 p-2 rounded border border-green-200">
            <span className="font-semibold text-green-800">⚡ Priority Support</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 italic">
          Your trial starts now - let's explore these premium features together!
        </p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
    trialFeature: 'trial_welcome',
    premiumHighlight: true,
    conversionValue: 10,
  },
  {
    target: '[data-onboarding="chat-area"]',
    title: 'Professional Conversation Interface',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          This is where all your conversations happen with <strong>Claude 4's advanced reasoning</strong>. Each message gets professional document-style presentation with timestamps and metadata.
        </p>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-800">
            🎁 Trial Bonus: Try asking complex questions that showcase Claude 4's superior reasoning abilities!
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Messages export beautifully to PDF and Word during your trial - perfect for documentation and sharing.
        </p>
      </div>
    ),
    placement: 'left',
    trialFeature: 'claude4_access',
    premiumHighlight: true,
    demoAction: 'show_claude4_capabilities',
    conversionValue: 8,
  },
  {
    target: '[data-onboarding="voice-input"]',
    title: 'Premium Voice Recognition 🎙️✨',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          <span className="sm:hidden">Tap</span><span className="hidden sm:inline">Click</span> the microphone to experience <strong>premium voice quality</strong> with crystal-clear recognition! Your trial includes <strong>unlimited voice minutes</strong> with advanced features.
        </p>
        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <p className="text-sm font-medium text-purple-800">
            🎯 Premium Features: Real-time quality metrics, confidence scoring, smart turn detection, and noise cancellation
          </p>
        </div>
        <p className="text-sm text-gray-600">
          <span className="sm:hidden">Try a voice conversation right now - it's included in your trial!</span><span className="hidden sm:inline">Experience professional-grade voice AI that free users don't get access to.</span>
        </p>
      </div>
    ),
    placement: 'top',
    trialFeature: 'premium_voice',
    premiumHighlight: true,
    demoAction: 'demo_voice_quality',
    conversionValue: 7,
  },
  {
    target: '[data-onboarding="agent-selector"]',
    title: 'Premium AI Agents & Custom Personalities',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          Select from different <strong>premium AI agents</strong> with specialized knowledge and personalities. Your trial unlocks <strong>custom agent creation</strong> - build AI assistants tailored to your specific needs!
        </p>
        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
          <p className="text-sm font-medium text-emerald-800">
            🚀 Trial Exclusive: Create unlimited custom agents with specialized prompts, knowledge bases, and personalities
          </p>
        </div>
        <p className="text-sm text-gray-600">
          From coding experts to creative writing coaches - build your AI team during the trial period.
        </p>
      </div>
    ),
    placement: 'bottom',
    trialFeature: 'custom_agents',
    premiumHighlight: true,
    demoAction: 'show_agent_creation',
    conversionValue: 6,
  },
  {
    target: '[data-onboarding="sidebar-toggle"]',
    title: 'Premium Session Management & Export Hub',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          <span className="sm:hidden">Tap the menu</span><span className="hidden sm:inline">Click here</span> to access your <strong>unlimited conversation history</strong>, premium export options, and advanced analytics during your trial.
        </p>
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
          <p className="text-sm font-medium text-amber-800">
            💎 Trial Features: Unlimited PDF/Word exports, conversation analytics, priority support access
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Export any conversation to professional documents - perfect for reports, documentation, and sharing insights.
        </p>
      </div>
    ),
    placement: 'right',
    trialFeature: 'unlimited_exports',
    premiumHighlight: true,
    demoAction: 'demo_export_options',
    conversionValue: 8,
  },
  {
    target: '[data-onboarding="continuous-mode"]',
    title: 'Premium Continuous Conversation Mode',
    content: (
      <div className="space-y-3">
        <p className="text-base leading-relaxed">
          Toggle <strong>premium continuous mode</strong> for seamless, hands-free interaction with Claude 4. Experience natural conversations with superior context understanding.
        </p>
        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
          <p className="text-sm font-medium text-indigo-800">
            🎭 Premium Advantage: Claude 4's advanced reasoning maintains context better across long conversations
          </p>
        </div>
        <p className="text-sm text-gray-600">
          Perfect for complex problem-solving sessions that require deep, contextual understanding.
        </p>
      </div>
    ),
    placement: 'bottom',
    trialFeature: 'claude4_access',
    premiumHighlight: true,
    demoAction: 'demo_continuous_mode',
    conversionValue: 5,
  },
  {
    target: '[data-onboarding="logo"]',
    title: 'Premium AI Capabilities Unlocked! 🧠✨',
    content: (
      <div className="space-y-4">
        <p className="text-base leading-relaxed font-medium">
          Your trial unlocks enterprise-grade AI capabilities that give you a competitive advantage:
        </p>
        <div className="grid grid-cols-1 gap-2">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-2 rounded border">
            <span className="text-sm font-semibold text-blue-800">🧠 Claude 4: Superior reasoning & complex problem-solving</span>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-2 rounded border">
            <span className="text-sm font-semibold text-purple-800">🔍 Advanced Analytics: Conversation insights & productivity metrics</span>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-2 rounded border">
            <span className="text-sm font-semibold text-emerald-800">🔒 Enterprise Security: Content safety & privacy controls</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 italic">
          These professional features are only available to trial and paid users.
        </p>
      </div>
    ),
    placement: 'center',
    trialFeature: 'advanced_analytics',
    premiumHighlight: true,
    conversionValue: 9,
  },
  {
    target: '[data-onboarding="message-input"]',
    title: 'Start Your Premium Trial Experience! 🚀✨',
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200">
          <p className="text-base leading-relaxed font-medium text-green-800">
            You're ready to experience the full power of premium AI! <strong>Type or speak</strong> to start with Claude 4 - try complex questions that showcase its advanced reasoning.
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600">
            🆕 7-Day Trial Active | 💎 All Premium Features Unlocked
          </p>
        </div>
        <p className="text-sm text-gray-600 font-medium text-center">
          Ask anything, export conversations, use voice features - it's all included! 🦆✨
        </p>
      </div>
    ),
    placement: 'top',
    trialFeature: 'trial_complete',
    premiumHighlight: true,
    conversionValue: 10,
  },
];

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false); // Fixed: default to false
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Trial integration
  const { trackFeatureUsage, recordTrialAnalytics } = useTrial();

  useEffect(() => {
    // Check localStorage for onboarding completion status
    const checkOnboardingStatus = () => {
      try {
        const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
        setHasCompletedOnboarding(completed);

        // Auto-start onboarding for new users (only if not completed)
        if (!completed) {
          // Wait for DOM to be ready and all essential elements to load
          const startOnboardingWhenReady = () => {
            // Check if essential tour targets exist
            const essentialTargets = [
              '[data-onboarding="logo"]',
              '[data-onboarding="message-input"]'
            ];

            const allTargetsExist = essentialTargets.every(selector =>
              document.querySelector(selector)
            );

            if (allTargetsExist) {
              setIsOnboardingActive(true);
            } else {
              // Retry after a short delay if targets aren't ready
              setTimeout(startOnboardingWhenReady, 500);
            }
          };

          // Initial delay to let the page settle, then check readiness
          const timer = setTimeout(startOnboardingWhenReady, 1500);
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.warn('Failed to check onboarding status:', error);
        // Default to not showing onboarding if localStorage fails
        setHasCompletedOnboarding(true);
      }
    };

    checkOnboardingStatus();
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
    
    // Track onboarding completion
    trackFeatureUsage('onboarding_completed', 'high');
    recordTrialAnalytics({
      onboardingCompleted: true,
      stepsCompleted: onboardingSteps.length,
      timeSpent: Date.now() // Could calculate actual time spent
    });
  };

  // Trial-specific methods
  const trackOnboardingProgress = (stepIndex: number) => {
    const step = onboardingSteps[stepIndex];
    if (step?.trialFeature) {
      trackFeatureUsage(step.trialFeature, 'medium');
      
      if (step.conversionValue) {
        recordTrialAnalytics({
          onboardingStep: stepIndex,
          feature: step.trialFeature,
          conversionValue: step.conversionValue
        });
      }
    }
  };

  const getOnboardingProgress = () => {
    return {
      current: currentStepIndex,
      total: onboardingSteps.length,
      percentage: Math.min((currentStepIndex / onboardingSteps.length) * 100, 100)
    };
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
    // Trial-specific methods
    trackOnboardingProgress,
    getOnboardingProgress,
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