'use client';

import React from 'react';
import { Mic, MicOff, AlertCircle, RotateCcw, Send, VolumeX, Volume2, MessageCircle, X } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { logger } from '@/lib/logger';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isDisabled?: boolean;
  enableContinuousMode?: boolean;
  onContinuousModeToggle?: () => void;
  isContinuousMode?: boolean;
}

export default function VoiceInput({ onTranscript, isDisabled = false, enableContinuousMode = false, onContinuousModeToggle, isContinuousMode = false }: VoiceInputProps) {
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
  } = useSpeechRecognition();

  const handleSendTranscript = () => {
    const currentTranscript = transcript.trim();
    logger.debug('Manual send triggered', { 
      component: 'VoiceInput',
      transcriptLength: currentTranscript.length,
      hasTranscript: !!currentTranscript
    });
    if (currentTranscript) {
      onTranscript(currentTranscript);
      resetTranscript();
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

  if (!isSupported) {
    return (
      <div className="flex items-center gap-4 text-amber-700 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200/50 rounded-2xl shadow-lg shadow-amber-500/10 backdrop-blur-sm">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-base leading-relaxed font-medium">
          😊 Voice chat needs a modern browser like Chrome, Firefox, or Safari to work its magic!
        </span>
      </div>
    );
  }

  return (
    <div className="voice-input-container no-text-scale">
      {/* Stable Control Panel - always in the same position */}
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
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-md" style={{ padding: '6px' }}>
          <div className="flex items-center text-red-700" style={{ gap: '6px' }}>
            <AlertCircle style={{ width: '12px', height: '12px' }} className="flex-shrink-0" />
            <span style={{ fontSize: '10px' }}>{error}</span>
          </div>
          {(error.includes('connection error') || error.includes('authentication failed')) && (
            <button
              onClick={startListening}
              disabled={isDisabled || isListening}
              className="flex items-center bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition-all duration-200"
              style={{ gap: '2px', padding: '4px 6px', fontSize: '10px' }}
            >
              <RotateCcw style={{ width: '10px', height: '10px' }} />
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}