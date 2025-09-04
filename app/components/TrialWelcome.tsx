'use client';

import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Gift,
  Star,
  CheckCircle,
  Zap
} from 'lucide-react';
import { useTrial } from '@/contexts/TrialContext';
import { useTrialCountdown, useTrialStatus } from '@/hooks/useTrialStatus';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface TrialWelcomeProps {
  className?: string;
  autoStartOnboarding?: boolean;
  showUpgradePrompt?: boolean;
}

export default function TrialWelcome({ 
  className = '', 
  autoStartOnboarding = true,
  showUpgradePrompt = false
}: TrialWelcomeProps) {
  const { trialStatus, isTrialUser, isPaidUser } = useTrial();
  const countdown = useTrialCountdown();
  const { trialDaysRemaining } = useTrialStatus();
  const { startOnboarding, hasCompletedOnboarding } = useOnboarding();
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome for new trial users
  useEffect(() => {
    if (isTrialUser && !hasCompletedOnboarding && trialStatus?.isTrialActive) {
      setShowWelcome(true);
    }
  }, [isTrialUser, hasCompletedOnboarding, trialStatus?.isTrialActive]);

  const handleStartTour = () => {
    if (autoStartOnboarding) {
      startOnboarding();
    }
    setShowWelcome(false);
  };

  const handleSkipTour = () => {
    setShowWelcome(false);
  };

  // Don't show for paid users or if trial is not active
  if (!isTrialUser || !showWelcome || isPaidUser) {
    return null;
  }

  // Different urgency levels based on days remaining
  const getUrgencyColor = () => {
    if (trialDaysRemaining >= 5) return 'from-blue-500 to-purple-600';
    if (trialDaysRemaining >= 3) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-600';
  };

  const getUrgencyMessage = () => {
    if (trialDaysRemaining >= 5) return 'Welcome to your premium trial!';
    if (trialDaysRemaining >= 3) return 'Make the most of your trial time!';
    return 'Your trial is ending soon!';
  };

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${getUrgencyColor()} p-6 rounded-t-2xl text-white`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="text-yellow-300 fill-yellow-300" size={32} />
              <Sparkles className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold mb-2">{getUrgencyMessage()}</h1>
            <p className="text-white/90 text-lg">
              Experience the full power of professional AI features
            </p>
          </div>

          {/* Countdown */}
          <div className="bg-white/10 rounded-lg p-3 mt-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{countdown.days}</div>
                <div className="text-sm opacity-90">Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{countdown.hours}</div>
                <div className="text-sm opacity-90">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{countdown.minutes}</div>
                <div className="text-sm opacity-90">Minutes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Claude 4 AI</h3>
                  <p className="text-sm text-blue-700">Advanced reasoning & problem-solving</p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  <span>Superior context understanding</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  <span>Complex mathematical reasoning</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Gift className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Premium Features</h3>
                  <p className="text-sm text-purple-700">Everything unlocked for 7 days</p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-purple-800">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  <span>Unlimited exports & voice</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  <span>Custom agents & analytics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Value proposition */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-xl border border-emerald-200 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="text-yellow-500 fill-yellow-500" size={20} />
              <h3 className="font-semibold text-gray-900">What You Get</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-blue-500" />
                <span>Claude 4 unlimited access</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-purple-500" />
                <span>Unlimited PDF/Word exports</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-emerald-500" />
                <span>Premium voice recognition</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-orange-500" />
                <span>Priority support & analytics</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStartTour}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Crown size={16} />
              Start Premium Tour
              <ArrowRight size={16} />
            </button>

            <button
              onClick={handleSkipTour}
              className="sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Skip Tour
            </button>
          </div>

          {/* Upgrade prompt (conditional) */}
          {showUpgradePrompt && trialDaysRemaining <= 2 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <Clock size={14} />
                <span>
                  <strong>Trial ending soon!</strong> Keep your premium features with Pro ($19/month)
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 text-center text-sm text-gray-500">
            No credit card required • Cancel anytime • Full access for 7 days
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact banner version for when user dismisses modal
export function TrialWelcomeBanner({ className = '' }: { className?: string }) {
  const { isTrialUser } = useTrial();
  const { hasCompletedOnboarding } = useOnboarding();
  const countdown = useTrialCountdown();

  if (!isTrialUser || hasCompletedOnboarding) return null;

  return (
    <div className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-yellow-300 fill-yellow-300" />
          <span className="font-medium">Premium Trial Active</span>
          <span className="text-white/80">•</span>
          <span className="text-sm">
            {countdown.days}d {countdown.hours}h {countdown.minutes}m left
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <button 
            onClick={() => window.location.href = '/upgrade'} 
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to manage welcome modal state
export function useTrialWelcome() {
  const { isTrialUser, trialStatus } = useTrial();
  const { hasCompletedOnboarding } = useOnboarding();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Show welcome for new trial users who haven't completed onboarding
    const shouldDisplay = isTrialUser && 
                         !hasCompletedOnboarding && 
                         trialStatus?.isTrialActive &&
                         !localStorage.getItem('trial-welcome-dismissed');
    
    setShouldShow(shouldDisplay);
  }, [isTrialUser, hasCompletedOnboarding, trialStatus]);

  const dismissWelcome = () => {
    setShouldShow(false);
    localStorage.setItem('trial-welcome-dismissed', 'true');
  };

  return {
    shouldShowWelcome: shouldShow,
    dismissWelcome
  };
}