'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, RotateCcw, Send, VolumeX, Volume2, MessageCircle, X, MoreHorizontal, ChevronUp, ChevronDown } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useContentSafety } from '@/contexts/ContentSafetyContext';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { logger } from '@/lib/logger';
import VoiceWaveform, { useAudioLevel } from './VoiceWaveform';
import { useButtonHaptics } from '@/hooks/useHapticFeedback';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isDisabled?: boolean;
  enableContinuousMode?: boolean;
  onContinuousModeToggle?: () => void;
  isContinuousMode?: boolean;
}

export default function VoiceInput({ onTranscript, isDisabled = false, enableContinuousMode = false, onContinuousModeToggle, isContinuousMode = false }: VoiceInputProps) {
  const { settings: safetySettings } = useContentSafety();
  const { isMobile, isTablet } = useMobileNavigation();
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  // Mobile-first: Show mobile layout for mobile and tablet
  const isMobileLayout = isMobile || isTablet;

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    cancelRecording,
    resetTranscript,
    error,
    isInContinuousMode,
    startContinuousMode,
    stopContinuousMode,
    autoSendCountdown,
    autoSendReason,
    isMuted,
    toggleMute,
    sentimentAnalysis,
    sentimentHistory,
    currentSpeaker,
    speakerLabels,
    speakerHistory,
    contentSafety,
    safetyWarnings,
    transcriptionQuality,
    qualityMetrics,
    qualityHistory,
  } = useSpeechRecognition();
  
  // Audio level for waveform visualization
  const audioLevel = useAudioLevel(isListening || isInContinuousMode);
  
  // Haptic feedback for mobile interactions
  const { onPress, onLongPress, onSuccess, onError } = useButtonHaptics();

  // Track if we're still checking browser support (to prevent hydration flash)
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);

  useEffect(() => {
    // Give a moment for the support check to complete
    const timer = setTimeout(() => {
      setIsCheckingSupport(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getSentimentDisplay = (sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE', confidence: number) => {
    const icons = {
      POSITIVE: '😊',
      NEUTRAL: '😐',
      NEGATIVE: '😞'
    };

    const colors = {
      POSITIVE: 'text-green-700 bg-green-50 border-green-200',
      NEUTRAL: 'text-gray-700 bg-gray-50 border-gray-200',
      NEGATIVE: 'text-red-700 bg-red-50 border-red-200'
    };

    return {
      icon: icons[sentiment],
      color: colors[sentiment],
      label: sentiment.charAt(0) + sentiment.slice(1).toLowerCase(),
      confidenceText: `${Math.round(confidence * 100)}% confident`
    };
  };

  const getSafetyDisplay = (safety: any) => {
    const riskColors = {
      low: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      medium: 'text-orange-700 bg-orange-50 border-orange-200',
      high: 'text-red-700 bg-red-50 border-red-200'
    };

    const riskIcons = {
      low: '⚠️',
      medium: '🚨',
      high: '🛑'
    };

    return {
      color: riskColors[safety.summary.riskLevel as keyof typeof riskColors] || riskColors.medium,
      icon: riskIcons[safety.summary.riskLevel as keyof typeof riskIcons] || riskIcons.medium,
      level: safety.summary.riskLevel.charAt(0).toUpperCase() + safety.summary.riskLevel.slice(1),
      categories: safety.summary.flaggedCategories
    };
  };

  const getSpeakerDisplay = (speaker: string) => {
    const colors = [
      'text-blue-700 bg-blue-50 border-blue-200',
      'text-purple-700 bg-purple-50 border-purple-200',
      'text-green-700 bg-green-50 border-green-200',
      'text-orange-700 bg-orange-50 border-orange-200',
      'text-pink-700 bg-pink-50 border-pink-200',
      'text-teal-700 bg-teal-50 border-teal-200'
    ];

    // Hash speaker name to get consistent color
    const hash = speaker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % colors.length;

    return {
      color: colors[colorIndex],
      icon: '🎤',
      displayName: speaker === 'A' ? 'Speaker A' : speaker === 'B' ? 'Speaker B' : speaker
    };
  };

  const getQualityDisplay = (quality: any) => {
    const qualityColors = {
      excellent: 'text-green-700 bg-green-50 border-green-200',
      good: 'text-blue-700 bg-blue-50 border-blue-200',
      fair: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      poor: 'text-red-700 bg-red-50 border-red-200'
    };

    const qualityIcons = {
      excellent: '🎯',
      good: '✅',
      fair: '⚠️',
      poor: '🔴'
    };

    return {
      color: qualityColors[quality.audioQuality as keyof typeof qualityColors] || qualityColors.fair,
      icon: qualityIcons[quality.audioQuality as keyof typeof qualityIcons] || qualityIcons.fair,
      label: quality.audioQuality.charAt(0).toUpperCase() + quality.audioQuality.slice(1),
      confidenceText: `${Math.round(quality.confidence * 100)}% confidence`,
      clarityScore: `${Math.round(quality.speechClarityScore)}% clarity`
    };
  };

  const handleSendTranscript = () => {
    const currentTranscript = transcript.trim();
    logger.debug('Manual send triggered', {
      component: 'VoiceInput',
      transcriptLength: currentTranscript.length,
      hasTranscript: !!currentTranscript
    });
    if (currentTranscript) {
      // Haptic feedback on successful send
      if (isMobileLayout) {
        onSuccess();
      }
      onTranscript(currentTranscript);
      resetTranscript();
    } else {
      // Error haptic if no transcript
      if (isMobileLayout) {
        onError();
      }
    }
  };

  const handleContinuousToggle = () => {
    if (isInContinuousMode) {
      logger.info('Stopping continuous mode', { component: 'VoiceInput' });
      stopContinuousMode();
    } else {
      logger.info('Starting continuous mode', { component: 'VoiceInput' });
      startContinuousMode(onTranscript);
    }
  };

  const handleMicToggle = () => {
    // Haptic feedback for mobile
    if (isMobileLayout) {
      if (isListening || isInContinuousMode) {
        onSuccess(); // Success haptic when stopping
      } else {
        onLongPress(); // Strong haptic when starting
      }
    }
    
    if (enableContinuousMode) {
      handleContinuousToggle();
    } else {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    }
  };

  // Show loading state during initial support check to prevent hydration flash
  if (isCheckingSupport) {
    return (
      <div className="flex items-center gap-4 text-blue-700 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200/50 rounded-2xl shadow-lg shadow-blue-500/10 backdrop-blur-sm">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
        <span className="text-base leading-relaxed font-medium">
          🔍 Checking voice chat compatibility...
        </span>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex flex-col gap-3 text-amber-700 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200/50 rounded-2xl shadow-lg shadow-amber-500/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span className="text-base leading-relaxed font-semibold mobile-typography-base">
            😊 Voice Chat Not Available
          </span>
        </div>
        <div className="text-sm text-amber-600 mobile-typography-sm">
          {isMobileLayout 
            ? "Voice chat requires microphone access. Please use Chrome, Firefox, or Safari browser and allow microphone permissions when prompted."
            : "Voice chat needs a modern browser like Chrome, Firefox, or Safari to work its magic!"
          }
        </div>
        {isMobileLayout && (
          <div className="bg-amber-100/50 border border-amber-200 rounded-lg p-3 mt-2">
            <div className="text-xs text-amber-700 font-medium mb-1">📱 Mobile Tips:</div>
            <ul className="text-xs text-amber-600 space-y-1 ml-4">
              <li>• Check microphone permissions in browser settings</li>
              <li>• Try refreshing the page and allowing permissions</li>
              <li>• Ensure you're using HTTPS (secure connection)</li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="voice-input-container no-text-scale">
      {isMobileLayout ? (
        /* Mobile-Optimized Control Panel */
        <div className="voice-controls-mobile">
          {/* Primary Controls Row */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* Enhanced Main Action Button - Mobile Optimized */}
            <button
              onClick={handleMicToggle}
              disabled={isDisabled}
              className={`
                relative rounded-3xl transition-all duration-300 shadow-xl transform active:scale-95 touch-target
                ${(isListening || isInContinuousMode)
                  ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-red-500/40'
                  : 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-blue-500/40 hover:shadow-blue-500/50'
                }
                ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
                overflow-hidden
              `}
              style={{ 
                padding: '20px', 
                minHeight: '72px', 
                minWidth: '72px',
                position: 'relative'
              }}
              title={
                enableContinuousMode
                  ? (isInContinuousMode ? '🛑 Stop chat' : 'Start chat!')
                  : (isListening ? '⏹️ Stop recording' : 'Start recording')
              }
            >
              {/* Background pulse effect */}
              {(isListening || isInContinuousMode) && (
                <>
                  <span className="absolute inset-0 rounded-3xl animate-ping bg-red-400/40" style={{ animationDuration: '2s' }} />
                  <span className="absolute inset-2 rounded-3xl animate-pulse bg-red-400/20" style={{ animationDuration: '3s' }} />
                  <span className="absolute inset-4 rounded-3xl animate-ping bg-white/20" style={{ animationDuration: '1.5s' }} />
                </>
              )}
              
              {/* Microphone icon with enhanced styling */}
              <div className="relative z-10 flex items-center justify-center">
                {(isListening || isInContinuousMode) ? (
                  <MicOff style={{ width: '28px', height: '28px' }} className="text-white drop-shadow-lg" />
                ) : (
                  <Mic style={{ width: '28px', height: '28px' }} className="text-white drop-shadow-lg" />
                )}
              </div>
              
              {/* Recording indicator ring */}
              {(isListening || isInContinuousMode) && (
                <div className="absolute inset-1 rounded-3xl border-2 border-white/50 animate-pulse" style={{ animationDuration: '2s' }} />
              )}
            </button>

            {/* Send Button - show when transcript available */}
            {!enableContinuousMode && transcript.trim() && (
              <button
                onClick={() => {
                  if (isMobileLayout) onPress();
                  handleSendTranscript();
                }}
                disabled={isDisabled}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl transition-all duration-300 shadow-lg transform active:scale-95 touch-target relative overflow-hidden"
                style={{ padding: '16px', minHeight: '64px', minWidth: '64px' }}
                title="Send message"
              >
                <Send style={{ width: '24px', height: '24px' }} className="drop-shadow-lg" />
                <div className="absolute inset-1 rounded-xl border border-white/20 animate-pulse" />
              </button>
            )}

            {/* Cancel Button - show when active */}
            {(isListening || isInContinuousMode || transcript.trim()) && (
              <button
                onClick={() => {
                  if (isMobileLayout) onPress();
                  cancelRecording();
                }}
                disabled={isDisabled}
                className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl transition-all duration-300 shadow-lg transform active:scale-95 touch-target"
                style={{ padding: '14px', minHeight: '56px', minWidth: '56px' }}
                title="Cancel"
              >
                <X style={{ width: '22px', height: '22px' }} className="drop-shadow-lg" />
              </button>
            )}

            {/* Advanced Controls Toggle */}
            <button
              onClick={() => {
                if (isMobileLayout) onPress();
                setShowAdvancedControls(!showAdvancedControls);
              }}
              disabled={isDisabled}
              className={`bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl transition-all duration-300 shadow-lg transform active:scale-95 touch-target relative ${
                showAdvancedControls ? 'ring-2 ring-purple-300 shadow-purple-500/40' : ''
              }`}
              style={{ padding: '14px', minHeight: '56px', minWidth: '56px' }}
              title="More options"
            >
              {showAdvancedControls ?
                <ChevronUp style={{ width: '22px', height: '22px' }} className="drop-shadow-lg" /> :
                <MoreHorizontal style={{ width: '22px', height: '22px' }} className="drop-shadow-lg" />
              }
              {showAdvancedControls && (
                <div className="absolute inset-1 rounded-xl border border-white/30 animate-pulse" />
              )}
            </button>
          </div>

          {/* Enhanced Mobile Status Display */}
          <div className="text-center mb-3">
            {(isListening || isInContinuousMode) ? (
              <div className="bg-gradient-to-r from-red-50 via-red-100 to-red-50 border-2 border-red-200 rounded-2xl px-4 py-3 shadow-lg animate-pulse">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="relative">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-ping" />
                    <div className="absolute inset-0 w-4 h-4 bg-red-600 rounded-full animate-pulse" />
                  </div>
                  <span className="font-bold text-red-700 text-base mobile-typography-base">
                    {isInContinuousMode
                      ? (isMuted ? '🔇 Muted' : '🎤 Listening...')
                      : '🔴 Recording...'
                    }
                  </span>
                </div>
                {/* Enhanced bouncing dots */}
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-3 h-3 bg-red-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
                  <span className="w-3 h-3 bg-red-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-4 py-2">
                <span className="text-blue-700 text-base font-semibold mobile-typography-base">
                  {enableContinuousMode ? '🎤 Tap to start chat mode' : '🎤 Tap to start talking'}
                </span>
              </div>
            )}
          </div>

          {/* Voice Waveform Visualization - Mobile Only */}
          {isMobileLayout && (isListening || isInContinuousMode) && (
            <div className="mb-4">
              <div className="bg-gradient-to-r from-red-50/80 via-red-100/50 to-red-50/80 border border-red-200/50 rounded-2xl p-3 backdrop-blur-sm">
                <div className="text-center mb-2">
                  <span className="text-red-600 text-xs font-medium mobile-typography-sm">
                    🎵 Voice Activity
                  </span>
                </div>
                <VoiceWaveform
                  isActive={isListening || isInContinuousMode}
                  audioLevel={audioLevel}
                  color="#ef4444"
                  barCount={16}
                  height={32}
                  className="rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Advanced Controls - Collapsible */}
          {showAdvancedControls && (
            <div className="advanced-controls bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200 shadow-inner">
              {/* Continuous Mode Toggle */}
              {onContinuousModeToggle && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Continuous Chat</span>
                  </div>
                  <button
                    data-onboarding="continuous-mode"
                    onClick={() => {
                      if (isMobileLayout) onPress();
                      onContinuousModeToggle?.();
                    }}
                    disabled={isDisabled}
                    className={`rounded-xl transition-all duration-300 touch-target relative overflow-hidden ${
                      isContinuousMode
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600 hover:from-gray-400 hover:to-gray-500'
                    }`}
                    style={{ padding: '12px', minHeight: '44px', minWidth: '44px' }}
                    title={isContinuousMode ? 'Disable continuous mode' : 'Enable continuous mode'}
                  >
                    <MessageCircle style={{ width: '18px', height: '18px' }} />
                    {isContinuousMode && (
                      <div className="absolute inset-1 rounded-lg border border-white/30 animate-pulse" />
                    )}
                  </button>
                </div>
              )}

              {/* Mute Control - show when in continuous mode */}
              {enableContinuousMode && (isListening || isInContinuousMode) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isMuted ? <VolumeX className="w-4 h-4 text-gray-600" /> : <Volume2 className="w-4 h-4 text-gray-600" />}
                    <span className="text-sm font-medium text-gray-700">
                      {isMuted ? 'Unmute' : 'Mute'}
                    </span>
                  </div>
                  <button
                    onClick={toggleMute}
                    disabled={isDisabled}
                    className={`rounded-xl transition-all duration-300 ${
                      isMuted
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-purple-500 text-white shadow-lg'
                    }`}
                    style={{ padding: '8px', minHeight: '36px', minWidth: '36px' }}
                  >
                    {isMuted ? <VolumeX style={{ width: '16px', height: '16px' }} /> : <Volume2 style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Desktop Control Panel - Original Layout */
        <div className="voice-controls-panel flex flex-wrap items-center" style={{ gap: '8px', minHeight: '48px' }}>
          {/* Microphone Button */}
          <button
            onClick={handleMicToggle}
            disabled={isDisabled}
            className={`
              relative rounded-2xl transition-all duration-300 shadow-lg transform hover:scale-105
              ${(isListening || isInContinuousMode)
                ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white scale-110 shadow-red-500/25'
                : 'bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 text-white shadow-yellow-500/25 hover:shadow-xl'
              }
              ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
            `}
            style={{ padding: '12px', minHeight: '44px', minWidth: '44px' }}
            title={
              enableContinuousMode
                ? (isInContinuousMode ? '🛑 Stop chat' : 'Start chat!')
                : (isListening ? '⏹️ Stop recording' : 'Start recording')
            }
          >
            {(isListening || isInContinuousMode) ? (
              <MicOff style={{ width: '20px', height: '20px' }} className="text-white" />
            ) : (
              <Mic style={{ width: '20px', height: '20px' }} className="text-white" />
            )}

            {(isListening || isInContinuousMode) && (
              <>
                <span className="absolute inset-0 rounded-2xl animate-ping bg-red-400/50" />
                <span className="absolute inset-1 rounded-2xl animate-pulse bg-red-400/30" />
              </>
            )}
          </button>

          {/* Continuous Mode Toggle */}
          {onContinuousModeToggle && (
            <button
              data-onboarding="continuous-mode"
              onClick={onContinuousModeToggle}
              disabled={isDisabled}
              className={`rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 ${
                isContinuousMode
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25'
                  : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-gray-500/25 hover:shadow-xl'
              }`}
              style={{ padding: '10px', minHeight: '38px', minWidth: '38px' }}
              title={isContinuousMode ? 'Disable continuous conversation' : 'Enable continuous conversation'}
            >
              <MessageCircle style={{ width: '18px', height: '18px' }} />
            </button>
          )}

          {/* Mute Button - show in continuous mode when listening */}
          {enableContinuousMode && (isListening || isInContinuousMode) && (
            <button
              onClick={toggleMute}
              disabled={isDisabled}
              className={`rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 ${
                isMuted
                  ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-500/25'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25 hover:shadow-xl'
              }`}
              style={{ padding: '8px', minHeight: '34px', minWidth: '34px' }}
              title={isMuted ? '🔊 Unmute to continue conversation' : '🔇 Mute and send current message'}
            >
              {isMuted ? <VolumeX style={{ width: '16px', height: '16px' }} /> : <Volume2 style={{ width: '16px', height: '16px' }} />}
            </button>
          )}

          {/* Send Button - only show in manual mode */}
          {!enableContinuousMode && transcript.trim() && (
            <button
              onClick={handleSendTranscript}
              disabled={isDisabled}
              className="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 hover:from-yellow-400 hover:via-amber-400 hover:to-orange-500 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg shadow-yellow-500/25 hover:shadow-xl transform hover:scale-105"
              style={{ padding: '8px', minHeight: '32px', minWidth: '32px' }}
              title="Send message"
            >
              <Send style={{ width: '16px', height: '16px' }} className="filter drop-shadow-sm" />
            </button>
          )}

          {/* Cancel Button - show when recording or has transcript */}
          {(isListening || isInContinuousMode || transcript.trim()) && (
            <button
              onClick={cancelRecording}
              disabled={isDisabled}
              className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg shadow-red-500/25 hover:shadow-xl transform hover:scale-105"
              style={{ padding: '8px', minHeight: '32px', minWidth: '32px' }}
              title="Cancel recording and discard transcript"
            >
              <X style={{ width: '16px', height: '16px' }} className="filter drop-shadow-sm" />
            </button>
          )}

          {/* Status Indicator - always visible in a stable position */}
          <div className="voice-status flex items-center" style={{ gap: '8px', minHeight: '24px' }}>
            {(isListening || isInContinuousMode) && (
              <>
                <span className="font-semibold text-gray-700" style={{ fontSize: '12px' }}>
                  {isInContinuousMode
                    ? (isMuted ? '🔇 Muted' : 'Listening...')
                    : '🔴 Recording...'
                  }
                </span>
                <div className="flex" style={{ gap: '2px' }}>
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
                </div>
              </>
            )}

            {/* Instructions when idle */}
            {!isListening && !isInContinuousMode && !transcript.trim() && (
              <div className="text-gray-600 leading-relaxed font-medium" style={{ fontSize: '10px' }}>
                {enableContinuousMode
                  ? 'Click to start chat mode'
                  : 'Click to talk'
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expandable Transcript Area - positioned below controls */}
      <div className="voice-transcript-area" style={{ marginTop: '8px' }}>
        {/* Current Transcript */}
        {transcript.trim() && (
          <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border border-yellow-200/50 rounded-xl shadow-sm shadow-yellow-500/10 backdrop-blur-sm" style={{ padding: '6px', marginBottom: '6px' }}>
            <div className="text-yellow-800 font-bold flex items-center" style={{ fontSize: '9px', marginBottom: '4px', gap: '4px' }}>
              <span className="filter drop-shadow-sm" style={{ fontSize: '11px' }}>🦆</span>
              What you said:
            </div>
            <div className="text-yellow-900 leading-relaxed font-medium overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-300 scrollbar-track-transparent" style={{ fontSize: '11px', marginBottom: '4px', maxHeight: '60px' }}>{transcript.trim()}</div>

            {/* Speaker Diarization Display */}
            {currentSpeaker && (
              <div className={`inline-flex items-center rounded-lg border shadow-sm ${getSpeakerDisplay(currentSpeaker).color}`} style={{ gap: '4px', padding: '3px 6px', marginBottom: '4px', fontSize: '10px' }}>
                <span style={{ fontSize: '12px' }}>{getSpeakerDisplay(currentSpeaker).icon}</span>
                <span className="font-semibold">{getSpeakerDisplay(currentSpeaker).displayName}</span>
              </div>
            )}

            {/* Content Safety Display */}
            {safetySettings.enabled && contentSafety && contentSafety.summary.flaggedCategories.length > 0 && (
              <div className={`inline-flex items-center rounded-lg border shadow-sm ${getSafetyDisplay(contentSafety).color}`} style={{ gap: '4px', padding: '3px 6px', marginBottom: '4px', fontSize: '10px' }}>
                <span style={{ fontSize: '12px' }}>{getSafetyDisplay(contentSafety).icon}</span>
                <span className="font-semibold">{getSafetyDisplay(contentSafety).level} Risk</span>
                <span className="opacity-75">({getSafetyDisplay(contentSafety).categories.join(', ')})</span>
              </div>
            )}

            {/* Sentiment Analysis Display */}
            {sentimentAnalysis && (
              <div className={`inline-flex items-center rounded-lg border shadow-sm ${getSentimentDisplay(sentimentAnalysis.sentiment, sentimentAnalysis.confidence).color}`} style={{ gap: '4px', padding: '3px 6px', marginBottom: '4px', fontSize: '10px' }}>
                <span style={{ fontSize: '12px' }}>{getSentimentDisplay(sentimentAnalysis.sentiment, sentimentAnalysis.confidence).icon}</span>
                <span className="font-semibold">{getSentimentDisplay(sentimentAnalysis.sentiment, sentimentAnalysis.confidence).label}</span>
                <span className="opacity-75">({getSentimentDisplay(sentimentAnalysis.sentiment, sentimentAnalysis.confidence).confidenceText})</span>
              </div>
            )}

            {/* Transcription Quality Display */}
            {transcriptionQuality && (
              <div className={`inline-flex items-center rounded-lg border shadow-sm ${getQualityDisplay(transcriptionQuality).color}`} style={{ gap: '4px', padding: '3px 6px', marginBottom: '4px', fontSize: '10px' }}>
                <span style={{ fontSize: '12px' }}>{getQualityDisplay(transcriptionQuality).icon}</span>
                <span className="font-semibold">{getQualityDisplay(transcriptionQuality).label} Quality</span>
                <span className="opacity-75">({getQualityDisplay(transcriptionQuality).confidenceText})</span>
              </div>
            )}

            {/* Auto-send countdown */}
            {autoSendCountdown !== null && autoSendReason && (
              <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm" style={{ gap: '6px', padding: '6px' }}>
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <div className="border-2 border-yellow-500 border-t-transparent rounded-full animate-spin shadow-sm" style={{ width: '12px', height: '12px' }}></div>
                  <span className="font-semibold text-gray-800" style={{ fontSize: '10px' }}>
                    Sending in {autoSendCountdown}s
                  </span>
                  <span className="text-yellow-800 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-full border border-yellow-300/50 font-semibold shadow-sm" style={{ fontSize: '10px', padding: '2px 6px' }}>
                    {autoSendReason}
                  </span>
                </div>
                <button
                  onClick={cancelRecording}
                  disabled={isDisabled}
                  className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-md transition-all duration-300 disabled:opacity-50 shadow-sm transform hover:scale-105"
                  style={{ padding: '4px', fontSize: '8px' }}
                  title="Cancel auto-send"
                >
                  <X style={{ width: '10px', height: '10px' }} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Speaker History - show if multiple speakers detected */}
        {Object.keys(speakerHistory).length > 1 && (
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200/50 rounded-lg shadow-sm backdrop-blur-sm" style={{ padding: '6px', marginBottom: '6px' }}>
            <div className="text-gray-700 font-semibold flex items-center" style={{ fontSize: '9px', marginBottom: '4px', gap: '4px' }}>
              <span className="filter drop-shadow-sm" style={{ fontSize: '11px' }}>👥</span>
              Multiple speakers detected:
            </div>
            <div className="flex flex-wrap" style={{ gap: '4px' }}>
              {Object.keys(speakerHistory).map((speaker) => (
                <div key={speaker} className={`inline-flex items-center rounded-md border shadow-sm ${getSpeakerDisplay(speaker).color}`} style={{ gap: '2px', padding: '2px 4px', fontSize: '9px' }}>
                  <span style={{ fontSize: '10px' }}>{getSpeakerDisplay(speaker).icon}</span>
                  <span className="font-semibold">{getSpeakerDisplay(speaker).displayName}</span>
                  <span className="opacity-75">({speakerHistory[speaker].length} messages)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality Metrics Panel - show if we have quality data and recommendations */}
        {qualityMetrics.totalWords > 0 && qualityMetrics.recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-lg shadow-sm backdrop-blur-sm" style={{ padding: '6px', marginBottom: '6px' }}>
            <div className="text-blue-700 font-semibold flex items-center" style={{ fontSize: '9px', marginBottom: '4px', gap: '4px' }}>
              <span className="filter drop-shadow-sm" style={{ fontSize: '11px' }}>📊</span>
              Voice Quality Insights:
            </div>
            <div className="flex flex-wrap" style={{ gap: '4px', marginBottom: '4px' }}>
              <div className="inline-flex items-center bg-white/70 border border-blue-200 rounded-md shadow-sm" style={{ gap: '2px', padding: '2px 4px', fontSize: '9px' }}>
                <span className="text-blue-600 font-semibold">Avg: {Math.round(qualityMetrics.averageConfidence * 100)}%</span>
              </div>
              <div className="inline-flex items-center bg-white/70 border border-blue-200 rounded-md shadow-sm" style={{ gap: '2px', padding: '2px 4px', fontSize: '9px' }}>
                <span className="text-green-600 font-semibold">High: {qualityMetrics.highConfidenceWords}</span>
              </div>
              <div className="inline-flex items-center bg-white/70 border border-blue-200 rounded-md shadow-sm" style={{ gap: '2px', padding: '2px 4px', fontSize: '9px' }}>
                <span className="text-red-600 font-semibold">Low: {qualityMetrics.lowConfidenceWords}</span>
              </div>
              <div className="inline-flex items-center bg-white/70 border border-blue-200 rounded-md shadow-sm" style={{ gap: '2px', padding: '2px 4px', fontSize: '9px' }}>
                <span className="text-gray-600 font-semibold">Trend: {qualityMetrics.qualityTrend === 'improving' ? '↗️' : qualityMetrics.qualityTrend === 'declining' ? '↘️' : '➡️'} {qualityMetrics.qualityTrend}</span>
              </div>
            </div>
            {qualityMetrics.recommendations.length > 0 && (
              <div className="text-blue-800 bg-blue-100/50 border border-blue-200 rounded-md" style={{ padding: '3px', fontSize: '9px' }}>
                <span className="font-semibold">Tips:</span> {qualityMetrics.recommendations.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Interim Transcript */}
        {interimTranscript && (
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200/50 rounded-lg shadow-sm backdrop-blur-sm" style={{ padding: '6px' }}>
            <div className="text-gray-700 font-semibold flex items-center" style={{ fontSize: '9px', marginBottom: '4px', gap: '4px' }}>
              <div className="bg-gray-500 rounded-full animate-pulse shadow-sm" style={{ width: '5px', height: '5px' }} />
              Processing...
            </div>
            <div className="text-gray-800 italic leading-relaxed font-medium overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" style={{ fontSize: '11px', maxHeight: '50px' }}>{interimTranscript}</div>
          </div>
        )}
      </div>

      {error && (
        <div className={`voice-error-container ${
          isMobileLayout 
            ? 'bg-gradient-to-r from-red-50 via-red-100 to-red-50 border-2 border-red-200 rounded-2xl p-4 shadow-lg'
            : 'bg-red-50 border border-red-200 rounded-md'
        }`} style={isMobileLayout ? {} : { padding: '6px' }}>
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle 
              className={`flex-shrink-0 ${isMobileLayout ? 'w-5 h-5' : 'w-3 h-3'}`} 
              style={{ color: '#dc2626' }} 
            />
            <div className="flex-1">
              <div className={`font-semibold text-red-700 mb-1 ${
                isMobileLayout ? 'text-sm mobile-typography-sm' : 'text-xs'
              }`}>
                🎤 Voice Error
              </div>
              <div className={`text-red-600 ${
                isMobileLayout ? 'text-sm mobile-typography-sm' : 'text-xs'
              }`}>
                {error}
              </div>
              
              {/* Mobile-specific error help */}
              {isMobileLayout && error.includes('permission') && (
                <div className="bg-red-100/50 border border-red-200/50 rounded-lg p-2 mt-2">
                  <div className="text-xs text-red-700 font-medium mb-1">🔍 Troubleshooting:</div>
                  <ul className="text-xs text-red-600 space-y-1">
                    <li>• Check browser microphone permissions</li>
                    <li>• Close other apps using the microphone</li>
                    <li>• Try refreshing the page</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {(error.includes('connection error') || error.includes('authentication failed') || error.includes('permission')) && (
            <div className="flex gap-2">
              <button
                onClick={startListening}
                disabled={isDisabled || isListening}
                className={`flex items-center bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-200 touch-target ${
                  isMobileLayout ? 'px-4 py-2 text-sm' : 'px-2 py-1 text-xs'
                }`}
                style={isMobileLayout ? {} : { gap: '2px' }}
              >
                <RotateCcw className={isMobileLayout ? 'w-4 h-4 mr-2' : 'w-3 h-3'} />
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}