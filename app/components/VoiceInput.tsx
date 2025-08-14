'use client';

import React from 'react';
import { Mic, MicOff, AlertCircle, RotateCcw, Send, VolumeX, Volume2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isDisabled?: boolean;
  enableContinuousMode?: boolean;
}

export default function VoiceInput({ onTranscript, isDisabled = false, enableContinuousMode = false }: VoiceInputProps) {
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
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
    console.log('VoiceInput: Manual send triggered with:', currentTranscript);
    if (currentTranscript) {
      onTranscript(currentTranscript);
      resetTranscript();
    }
  };

  const handleContinuousToggle = () => {
    if (isInContinuousMode) {
      console.log('VoiceInput: Stopping continuous mode');
      stopContinuousMode();
    } else {
      console.log('VoiceInput: Starting continuous mode');
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {/* Microphone Button */}
        <button
          onClick={handleMicToggle}
          disabled={isDisabled}
          className={`
            relative p-4 rounded-2xl transition-all duration-300 shadow-lg transform hover:scale-105
            ${(isListening || isInContinuousMode)
              ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white scale-110 shadow-red-500/25' 
              : 'bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 text-white shadow-yellow-500/25 hover:shadow-xl'
            }
            ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
          `}
          title={
            enableContinuousMode 
              ? (isInContinuousMode ? '🛑 Stop rubber ducky chat' : '🦆 Start rubber ducky chat!')
              : (isListening ? '⏹️ Stop recording' : '🦆 Start recording')
          }
        >
          {(isListening || isInContinuousMode) ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
          
          {(isListening || isInContinuousMode) && (
            <>
              <span className="absolute inset-0 rounded-2xl animate-ping bg-red-400/50" />
              <span className="absolute inset-1 rounded-2xl animate-pulse bg-red-400/30" />
            </>
          )}
        </button>

        {/* Mute Button - show in continuous mode when listening */}
        {enableContinuousMode && (isListening || isInContinuousMode) && (
          <button
            onClick={toggleMute}
            disabled={isDisabled}
            className={`p-3 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 ${
              isMuted 
                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-500/25' 
                : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25 hover:shadow-xl'
            }`}
            title={isMuted ? '🔊 Unmute to continue conversation' : '🔇 Mute and send current message'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}

        {/* Send Button - only show in manual mode */}
        {!enableContinuousMode && transcript.trim() && (
          <button
            onClick={handleSendTranscript}
            disabled={isDisabled}
            className="p-3 bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 hover:from-yellow-400 hover:via-amber-400 hover:to-orange-500 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg shadow-yellow-500/25 hover:shadow-xl transform hover:scale-105"
            title="🦆 Send to Rubber Ducky"
          >
            <Send className="w-5 h-5 filter drop-shadow-sm" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          {(isListening || isInContinuousMode) && (
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-semibold text-gray-700">
                {isInContinuousMode 
                  ? (isMuted ? '🔇 Muted (not listening) - unmute to continue' : '🦆 Rubber ducky listening...')
                  : '🔴 Recording...'
                }
              </span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          {/* Current Transcript */}
          {transcript.trim() && (
            <div className="p-6 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-200/50 rounded-2xl shadow-lg shadow-yellow-500/10 backdrop-blur-sm">
              <div className="text-sm text-yellow-800 font-bold mb-4 flex items-center gap-3">
                <span className="text-lg filter drop-shadow-sm">🦆</span>
                What you said:
              </div>
              <div className="text-base text-yellow-900 leading-relaxed mb-4 font-medium">{transcript.trim()}</div>
              
              {/* Auto-send countdown */}
              {autoSendCountdown !== null && autoSendReason && (
                <div className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200/50 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin shadow-sm"></div>
                    <span className="text-sm font-semibold text-gray-800">
                      Sending to ducky in {autoSendCountdown}s
                    </span>
                  </div>
                  <span className="text-sm text-yellow-800 bg-gradient-to-r from-yellow-100 to-amber-100 px-3 py-2 rounded-full border-2 border-yellow-300/50 font-semibold shadow-sm">
                    {autoSendReason}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Interim Transcript */}
          {interimTranscript && (
            <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200/50 rounded-xl shadow-lg backdrop-blur-sm">
              <div className="text-sm text-gray-700 font-semibold mb-3 flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse shadow-sm" />
                Processing...
              </div>
              <div className="text-base text-gray-800 italic leading-relaxed font-medium">{interimTranscript}</div>
            </div>
          )}

          {/* Instructions */}
          {!isListening && !isInContinuousMode && !transcript.trim() && (
            <div className="text-sm text-gray-600 leading-relaxed py-2 font-medium">
              {enableContinuousMode 
                ? '🦆 Click to start rubber ducky mode'
                : '🦆 Click to talk to your rubber ducky'
              }
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
          {(error.includes('connection error') || error.includes('authentication failed')) && (
            <button
              onClick={startListening}
              disabled={isDisabled || isListening}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all duration-200"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}