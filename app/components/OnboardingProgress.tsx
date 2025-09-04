'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Star, 
  Trophy, 
  Target,
  TrendingUp,
  Gift,
  Sparkles
} from 'lucide-react';
import { useTrial } from '@/contexts/TrialContext';
import { useTrialStatus } from '@/hooks/useTrialStatus';

interface OnboardingProgressProps {
  currentStep?: number;
  totalSteps?: number;
  showTrialProgress?: boolean;
  className?: string;
}

interface ProgressMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<any>;
  value?: number;
  target?: number;
  reward?: string;
}

export default function OnboardingProgress({ 
  currentStep = 0, 
  totalSteps = 8,
  showTrialProgress = true,
  className = ''
}: OnboardingProgressProps) {
  const { trialStatus, isTrialUser } = useTrial();
  const { trialProgress, getTrialDayNumber, getTrialPercentComplete } = useTrialStatus();
  const [milestones, setMilestones] = useState<ProgressMilestone[]>([]);

  // Calculate onboarding completion percentage
  const onboardingPercent = Math.min((currentStep / totalSteps) * 100, 100);
  const trialPercent = getTrialPercentComplete();
  const trialDay = getTrialDayNumber();

  // Initialize milestones based on trial progress
  useEffect(() => {
    if (!isTrialUser) return;

    const calculatedMilestones: ProgressMilestone[] = [
      {
        id: 'welcome',
        title: 'Welcome Complete',
        description: 'Started your premium trial',
        completed: currentStep >= 1,
        icon: Gift,
        reward: 'Trial activated!'
      },
      {
        id: 'first_chat',
        title: 'First Conversation',
        description: 'Experience Claude 4 AI',
        completed: currentStep >= 2,
        icon: Sparkles,
        reward: 'Claude 4 unlocked!'
      },
      {
        id: 'voice_demo',
        title: 'Voice Feature',
        description: 'Try premium voice recognition',
        completed: currentStep >= 3,
        icon: CheckCircle,
        reward: 'Voice features enabled!'
      },
      {
        id: 'export_demo',
        title: 'Export Feature',
        description: 'Create professional documents',
        completed: currentStep >= 4,
        icon: Target,
        reward: 'Unlimited exports!'
      },
      {
        id: 'onboarding_complete',
        title: 'Tour Complete',
        description: 'All features explored',
        completed: currentStep >= totalSteps,
        icon: Trophy,
        reward: 'Ready to go!'
      }
    ];

    setMilestones(calculatedMilestones);
  }, [currentStep, totalSteps, isTrialUser]);

  if (!isTrialUser) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Onboarding Progress */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Getting Started Progress</h3>
          <span className="text-sm text-gray-600">{currentStep}/{totalSteps}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${onboardingPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {milestones.map((milestone) => {
            const Icon = milestone.icon;
            return (
              <div 
                key={milestone.id}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  milestone.completed 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon 
                  size={16} 
                  className={milestone.completed ? 'text-green-600' : 'text-gray-400'} 
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    milestone.completed ? 'text-green-900' : 'text-gray-600'
                  }`}>
                    {milestone.title}
                  </p>
                  {milestone.completed && milestone.reward && (
                    <p className="text-xs text-green-600 truncate">{milestone.reward}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trial Progress */}
      {showTrialProgress && trialStatus && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="text-yellow-500 fill-yellow-500" size={16} />
              <h3 className="font-semibold text-blue-900">Trial Progress</h3>
            </div>
            <div className="flex items-center gap-1 text-sm text-blue-700">
              <Clock size={14} />
              <span>Day {trialDay} of 7</span>
            </div>
          </div>

          <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${trialPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="font-semibold text-blue-800">{trialStatus.trialDaysRemaining}</div>
              <div className="text-blue-600">Days Left</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-800">{milestones.filter(m => m.completed).length}</div>
              <div className="text-blue-600">Features Tried</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-800">{Math.round(trialPercent)}%</div>
              <div className="text-blue-600">Complete</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-800">∞</div>
              <div className="text-blue-600">Access Level</div>
            </div>
          </div>

          {/* Trial tips based on progress */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            {trialDay <= 2 && (
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <TrendingUp size={14} />
                <span>Great start! Try the voice features and export options next.</span>
              </div>
            )}
            {trialDay >= 3 && trialDay <= 5 && (
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Target size={14} />
                <span>Explore advanced features like custom agents and analytics.</span>
              </div>
            )}
            {trialDay >= 6 && (
              <div className="flex items-center gap-2 text-sm text-orange-800">
                <Clock size={14} />
                <span>Trial ending soon! Consider upgrading to keep your premium features.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feature Usage Summary */}
      {trialProgress && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Feature Exploration</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Features Discovered</span>
              <span className="text-sm font-medium">
                {trialProgress.featuresUsedCount} / {trialProgress.totalFeatures}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(trialProgress.featuresUsedCount / trialProgress.totalFeatures) * 100}%` 
                }}
              />
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-sm text-gray-600">Engagement Score</span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(trialProgress.engagementScore * 10) / 10}/10
              </span>
            </div>
          </div>

          {/* Conversion checkpoints */}
          {trialProgress.conversionCheckpoints > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle size={14} />
                <span>
                  {trialProgress.conversionCheckpoints} conversion milestone
                  {trialProgress.conversionCheckpoints !== 1 ? 's' : ''} reached
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for header/sidebar
export function CompactOnboardingProgress({ currentStep = 0, totalSteps = 8 }: { currentStep?: number; totalSteps?: number }) {
  const { isTrialUser } = useTrial();
  const { getTrialPercentComplete } = useTrialStatus();

  if (!isTrialUser) return null;

  const onboardingPercent = Math.min((currentStep / totalSteps) * 100, 100);
  const trialPercent = getTrialPercentComplete();

  return (
    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-900">Setup Progress</span>
        <span className="text-xs text-blue-600">{currentStep}/{totalSteps}</span>
      </div>
      
      <div className="w-full bg-blue-200 rounded-full h-1.5">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${onboardingPercent}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-1 text-xs text-blue-600">
        <span>{Math.round(onboardingPercent)}% complete</span>
        <span>Trial: Day {Math.ceil(trialPercent / (100/7))}</span>
      </div>
    </div>
  );
}

// Progress step indicator for onboarding flow
export function OnboardingStepIndicator({ 
  currentStep, 
  totalSteps, 
  stepTitles 
}: { 
  currentStep: number; 
  totalSteps: number; 
  stepTitles?: string[] 
}) {
  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <div key={i} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
              ${isCompleted 
                ? 'bg-green-500 text-white' 
                : isActive 
                  ? 'bg-blue-500 text-white ring-4 ring-blue-200' 
                  : 'bg-gray-200 text-gray-600'
              }
            `}>
              {isCompleted ? (
                <CheckCircle size={16} />
              ) : (
                stepNumber
              )}
            </div>
            
            {stepTitles && stepTitles[i] && (
              <span className={`ml-2 text-sm ${
                isActive ? 'text-blue-600 font-medium' : 'text-gray-600'
              }`}>
                {stepTitles[i]}
              </span>
            )}
            
            {i < totalSteps - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${
                isCompleted ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}