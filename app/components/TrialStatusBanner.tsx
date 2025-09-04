'use client';

import React from 'react';
import { Clock, Star, Zap, ArrowUp } from 'lucide-react';
import { useTrial } from '@/contexts/TrialContext';
import { useTrialCountdown } from '@/hooks/useTrialStatus';

interface TrialStatusBannerProps {
  className?: string;
  compact?: boolean;
  showUpgradeButton?: boolean;
}

export default function TrialStatusBanner({ 
  className = '', 
  compact = false, 
  showUpgradeButton = true 
}: TrialStatusBannerProps) {
  const { trialStatus, isTrialUser, extendTrial } = useTrial();
  const countdown = useTrialCountdown();

  if (!isTrialUser || !trialStatus?.isTrialActive) {
    return null;
  }

  const urgencyColor = {
    low: 'bg-blue-50 border-blue-200 text-blue-800',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    high: 'bg-orange-50 border-orange-200 text-orange-800',
    critical: 'bg-red-50 border-red-200 text-red-800'
  }[countdown.urgencyLevel];

  const handleExtendTrial = async () => {
    if (trialStatus?.canExtendTrial) {
      const success = await extendTrial(3);
      if (success) {
        // Could show a success toast here
        console.log('Trial extended successfully');
      }
    }
  };

  if (compact) {
    return (
      <div className={`${urgencyColor} ${className} px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2`}>
        <Clock size={16} />
        <span>
          Trial: {countdown.days}d {countdown.hours}h {countdown.minutes}m left
        </span>
        {showUpgradeButton && (
          <button 
            onClick={() => window.location.href = '/upgrade'}
            className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
          >
            Upgrade
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${urgencyColor} ${className} p-4 rounded-xl border-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Star className="text-yellow-500 fill-yellow-500" size={20} />
            <span className="font-semibold">Premium Trial Active</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span className="font-mono">
              {countdown.days > 0 && `${countdown.days}d `}
              {String(countdown.hours).padStart(2, '0')}:
              {String(countdown.minutes).padStart(2, '0')}:
              {String(countdown.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {trialStatus.canExtendTrial && countdown.urgencyLevel === 'high' && (
            <button
              onClick={handleExtendTrial}
              className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Zap size={14} />
              Extend 3 Days
            </button>
          )}
          
          {showUpgradeButton && (
            <button
              onClick={() => window.location.href = '/upgrade'}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-1"
            >
              <ArrowUp size={14} />
              Upgrade Now
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Trial Progress</span>
          <span>{7 - trialStatus.trialDaysRemaining} of 7 days used</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(5, ((7 - trialStatus.trialDaysRemaining) / 7) * 100)}%` }}
          />
        </div>
      </div>

      {/* Features highlight */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 bg-white/50 rounded">🧠 Claude 4 Access</span>
        <span className="px-2 py-1 bg-white/50 rounded">📄 Unlimited Exports</span>
        <span className="px-2 py-1 bg-white/50 rounded">🎙️ Premium Voice</span>
        <span className="px-2 py-1 bg-white/50 rounded">⚡ Priority Support</span>
      </div>
    </div>
  );
}

// Compact version for header/navigation
export function TrialStatusIndicator({ className = '' }: { className?: string }) {
  return <TrialStatusBanner className={className} compact showUpgradeButton={false} />;
}

// Full banner version for prominent placement
export function TrialStatusCard({ className = '' }: { className?: string }) {
  return <TrialStatusBanner className={className} compact={false} showUpgradeButton />;
}