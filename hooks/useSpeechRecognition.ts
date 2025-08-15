import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  sendCurrentTranscript: () => void;
  error: string | null;
  setAutoSend: (callback: ((text: string) => void) | null) => void;
  isInContinuousMode: boolean;
  startContinuousMode: (callback: (text: string) => void) => void;
  stopContinuousMode: () => void;
  autoSendCountdown: number | null;
  autoSendReason: string | null;
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInContinuousMode, setIsInContinuousMode] = useState(false);
  const [autoSendCountdown, setAutoSendCountdown] = useState<number | null>(null);
  const [autoSendReason, setAutoSendReason] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxAccumulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const onTranscriptCallbackRef = useRef<((text: string) => void) | null>(null);
  const continuousCallbackRef = useRef<((text: string) => void) | null>(null);
  const isInContinuousModeRef = useRef<boolean>(false);
  
  // Professional conversation thresholds for interview-quality discussions
  const SILENCE_THRESHOLD = 5000; // 5 seconds of silence for complete thoughts
  const MAX_ACCUMULATION_TIME = 15000; // 15 seconds max before forced send  
  const MIN_TRANSCRIPT_LENGTH = 8; // Minimum words for professional conversations

  useEffect(() => {
    // Check if browser supports required APIs
    if (typeof window !== 'undefined' && 
        'MediaRecorder' in window && 
        'WebSocket' in window) {
      setIsSupported(true);
      console.log('AssemblyAI Speech Recognition supported');
    }
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    console.log('🔄 isInContinuousMode changed to:', isInContinuousMode);
    isInContinuousModeRef.current = isInContinuousMode;
  }, [isInContinuousMode]);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      // Cleanup AudioContext if it exists
      const ws = wsRef.current as any;
      if (ws.audioContext) {
        try {
          ws.audioContext.close();
        } catch (e) {
          console.warn('Error closing AudioContext:', e);
        }
      }
      if (ws.processor) {
        try {
          ws.processor.disconnect();
        } catch (e) {
          console.warn('Error disconnecting processor:', e);
        }
      }
      
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    clearAllTimers();
  }, []);

  const clearAllTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxAccumulationTimerRef.current) {
      clearTimeout(maxAccumulationTimerRef.current);
      maxAccumulationTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoSendCountdown(null);
    setAutoSendReason(null);
  }, []);

  const startCountdown = useCallback((duration: number, reason: string, callback: () => void) => {
    setAutoSendReason(reason);
    let remaining = Math.ceil(duration / 1000);
    setAutoSendCountdown(remaining);
    
    const countdownInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        setAutoSendCountdown(null);
        setAutoSendReason(null);
        callback();
      } else {
        setAutoSendCountdown(remaining);
      }
    }, 1000);
    
    countdownTimerRef.current = countdownInterval as any;
  }, []);

  const shouldAutoSend = useCallback((currentTranscript: string) => {
    const trimmed = currentTranscript.trim();
    if (!trimmed) return false;
    
    const wordCount = trimmed.split(/\s+/).length;
    
    // Professional conversation requires substantial content
    if (wordCount < MIN_TRANSCRIPT_LENGTH) return false;
    
    // Block obvious incomplete fragments
    const blockPatterns = [
      // Trailing conjunctions/prepositions
      /\b(and|but|or|if|when|then|so|because|since|while|although|though|unless|until|where|after|before|with|without|about|for|of|in|on|at|by|to|from|up|down|out|off|now|still|really|just|only|even|also|very|quite|actually|basically|literally|definitely|probably|maybe|perhaps)$/i,
      
      // Incomplete "to be" patterns
      /\b(i am|i'm|you are|you're|he is|she is|it is|we are|they are|there is|there are)\s*$/i,
      
      // Incomplete modal patterns  
      /\b(i can|you can|he can|she can|we can|they can|i should|you should|we should|they should|i will|you will|we will|they will)\s*$/i,
      
      // Single trailing words that clearly indicate incomplete thoughts
      /\b(code|did|not|you|me|getting|making|trying|going|working|talking|saying|thinking|looking|still|chopping|resisting)$/i
    ];
    
    // Reject if matches incomplete patterns
    if (blockPatterns.some(pattern => pattern.test(trimmed))) {
      return false;
    }
    
    // Check for natural endings that indicate complete thoughts
    const hasNaturalEnding = (
      /[.!?]$/.test(trimmed) || // Punctuation
      /\b(thanks|thank you|that's all|done|finished|complete|exactly|right|correct|absolutely|definitely|certainly|perfect|excellent|great|okay|alright)$/i.test(trimmed)
    );
    
    // Professional conversation requirements:
    // 1. Very substantial content (15+ words) is likely complete
    // 2. Good length with natural ending (10+ words) 
    // 3. Clear questions (8+ words ending with ?)
    if (wordCount >= 15) {
      return true; // Very substantial content
    } else if (wordCount >= 10 && hasNaturalEnding) {
      return true; // Good length with clear ending
    } else if (wordCount >= MIN_TRANSCRIPT_LENGTH && /\?$/.test(trimmed)) {
      return true; // Clear questions
    }
    
    return false;
  }, []);

  const triggerAutoSend = useCallback((reason: string, transcriptToSend?: string) => {
    const currentTranscript = (transcriptToSend || transcript).trim();
    console.log(`Auto-send triggered by ${reason}:`, currentTranscript);
    
    if (isInContinuousModeRef.current && continuousCallbackRef.current && shouldAutoSend(currentTranscript)) {
      clearAllTimers();
      
      // Use setTimeout to ensure this doesn't conflict with React render
      setTimeout(() => {
        if (continuousCallbackRef.current) {
          continuousCallbackRef.current(currentTranscript);
        }
      }, 0);
      
      setTranscript('');
      setInterimTranscript('');
      lastActivityTimeRef.current = Date.now();
      
      // Restart max accumulation timer for next speech segment
      maxAccumulationTimerRef.current = setTimeout(() => {
        triggerAutoSend('max accumulation time');
      }, MAX_ACCUMULATION_TIME);
    }
  }, [transcript, isInContinuousMode, shouldAutoSend, clearAllTimers]);

  const startListening = useCallback(async () => {
    if (isListening) return;
    
    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      
      // Get microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      streamRef.current = stream;
      
      // Get API key from environment
      const apiKeyResponse = await fetch('/api/speech-token', {
        method: 'POST',
      });
      
      if (!apiKeyResponse.ok) {
        const errorData = await apiKeyResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get API key');
      }
      
      const { apiKey } = await apiKeyResponse.json();
      
      console.log('API Key received:', apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined');
      
      // Create WebSocket connection to AssemblyAI Universal Streaming
      // Universal Streaming requires specific parameters
      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&encoding=pcm_s16le&token=${apiKey}`;
      console.log('Connecting to Universal Streaming WebSocket URL:', wsUrl.replace(apiKey, apiKey ? `${apiKey.substring(0, 8)}...` : 'undefined'));
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('AssemblyAI Universal Streaming WebSocket connected');
        setIsListening(true);
        
        // Create AudioContext for proper PCM16 conversion
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        
        // Use ScriptProcessor for now (will be replaced with AudioWorklet in future)
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (event) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputBuffer = event.inputBuffer;
            const inputData = inputBuffer.getChannelData(0);
            
            // Convert float32 to PCM16 little-endian
            const pcm16Buffer = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const sample = Math.max(-1, Math.min(1, inputData[i]));
              pcm16Buffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            }
            
            // Send as raw ArrayBuffer (PCM16 little-endian)
            if (pcm16Buffer.byteLength > 0) {
              ws.send(pcm16Buffer.buffer);
            }
          }
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        // Store for cleanup
        (wsRef.current as any).audioContext = audioContext;
        (wsRef.current as any).processor = processor;
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('AssemblyAI message:', data);
          
          // Handle AssemblyAI Universal Streaming message format
          if (data.type === 'Begin') {
            console.log('AssemblyAI Universal Streaming session started:', data.id);
          } else if (data.hasOwnProperty('transcript')) {
            // This is a transcript message with turn_order, end_of_turn, transcript fields
            const transcript = data.transcript || '';
            const isEndOfTurn = data.end_of_turn === true;
            
            if (!isEndOfTurn && transcript) {
              // Partial transcript - update interim
              setInterimTranscript(transcript);
              lastActivityTimeRef.current = Date.now();
              
              // Reset silence timer on partial transcript
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
              }
            } else if (isEndOfTurn && transcript) {
              // Final transcript - add to main transcript
              console.log('AssemblyAI FinalTranscript received:', transcript);
              lastActivityTimeRef.current = Date.now();
              
              setTranscript(prev => {
                const newTranscript = prev + transcript.trim() + ' ';
                console.log('Setting transcript to:', newTranscript);
                console.log('🚨 DEBUG: isInContinuousMode:', isInContinuousMode);
                console.log('🚨 DEBUG: isInContinuousModeRef.current:', isInContinuousModeRef.current);
                console.log('🚨 DEBUG: continuousCallbackRef.current:', continuousCallbackRef.current);
                
                // In continuous mode, implement multi-condition auto-send
                // Don't process new speech while muted
                if (isInContinuousModeRef.current && continuousCallbackRef.current && !isMuted) {
                  console.log('🔍 Debug: In continuous mode, checking auto-send conditions');
                  console.log('🔍 Debug: newTranscript:', newTranscript.trim());
                  console.log('🔍 Debug: shouldAutoSend result:', shouldAutoSend(newTranscript));
                  
                  // Check if we should send immediately based on content
                  const shouldSendImmediately = (
                    // Questions with proper punctuation
                    /\?$/.test(transcript.trim()) ||
                    // Complete sentences with natural endings
                    /[.!]$/.test(transcript.trim()) ||
                    // Clear conversation enders
                    /\b(thanks|thank you|that's all|goodbye|bye|see you|done|finished|period|end|stop)\b$/i.test(transcript.trim()) ||
                    // Clear commands/greetings that are complete thoughts
                    /^(hello|hi|hey|good morning|good afternoon|good evening)\b.*[.!]?$/i.test(newTranscript.trim()) ||
                    // Complete requests that don't need more context (must be substantial)
                    /^(please|can you|could you|would you|tell me|show me|explain|help me)\b.{10,}[.!?]?$/i.test(newTranscript.trim())
                  );
                  
                  console.log('🔍 Debug: shouldSendImmediately:', shouldSendImmediately);
                  
                  if (shouldSendImmediately && shouldAutoSend(newTranscript)) {
                    // Immediate send for natural conversation breaks - defer to avoid render conflict
                    console.log('🚀 Triggering immediate send for natural conversation break');
                    clearAllTimers();
                    setTimeout(() => triggerAutoSend('natural conversation break', newTranscript), 100);
                  } else if (shouldAutoSend(newTranscript)) {
                    // Clear existing countdown to restart it
                    if (countdownTimerRef.current) {
                      console.log('🔄 Clearing existing countdown');
                      clearTimeout(countdownTimerRef.current);
                      countdownTimerRef.current = null;
                      setAutoSendCountdown(null);
                      setAutoSendReason(null);
                    }
                    
                    // Standard silence detection with countdown
                    console.log('⏰ Starting countdown for:', newTranscript.trim());
                    startCountdown(SILENCE_THRESHOLD, 'silence detected', () => {
                      triggerAutoSend('silence detection', newTranscript);
                    });
                  } else {
                    console.log('❌ Not auto-sending - shouldAutoSend returned false');
                  }
                  
                  // Start max accumulation timer if not already running
                  if (!maxAccumulationTimerRef.current && newTranscript.trim()) {
                    console.log('⏳ Starting max accumulation timer');
                    maxAccumulationTimerRef.current = setTimeout(() => {
                      triggerAutoSend('max accumulation time');
                    }, MAX_ACCUMULATION_TIME);
                  }
                }
                
                return newTranscript;
              });
              setInterimTranscript('');
            }
          } else if (data.type === 'Error' || data.error) {
            console.error('AssemblyAI error:', data.error || data);
            setError(`Speech recognition error: ${data.error || 'Unknown error'}`);
            stopListening();
          }
        } catch (parseError) {
          console.error('Error parsing AssemblyAI response:', parseError, event.data);
        }
      };
      
      ws.onerror = (error) => {
        console.error('AssemblyAI WebSocket error:', error);
        setError('Speech recognition connection error. Please try again.');
        stopListening();
      };
      
      ws.onclose = (event) => {
        console.log('AssemblyAI WebSocket closed:', event.code, event.reason);
        setIsListening(false);
        
        // Handle specific error codes from AssemblyAI
        switch (event.code) {
          case 4001:
            setError('Invalid AssemblyAI API key. Please check your configuration.');
            break;
          case 4002:
            setError('AssemblyAI quota exceeded. Please check your account.');
            break;
          case 3005:
            setError('Invalid audio data sent to AssemblyAI. Microphone may have issues.');
            console.warn('Error 3005: Check audio encoding and data validation');
            break;
          case 4008:
            setError('AssemblyAI session timeout. Please try again.');
            break;
          case 1000:
          case 1001:
            // Normal closure, don't show error
            break;
          default:
            if (event.code >= 4000) {
              setError(`AssemblyAI error (${event.code}): ${event.reason || 'Unknown error'}`);
            } else if (event.code !== 1000 && event.code !== 1001) {
              setError('Speech recognition service disconnected unexpectedly.');
            }
        }
      };
      
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      
      let errorMessage = 'Failed to start speech recognition.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.';
      }
      
      setError(errorMessage);
      cleanup();
    }
  }, [isListening, cleanup]);

  const stopListening = useCallback(() => {
    if (!isListening) return;
    
    setIsListening(false);
    cleanup();
  }, [isListening, cleanup]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const sendCurrentTranscript = useCallback(() => {
    const currentTranscript = transcript.trim();
    console.log('sendCurrentTranscript called with:', currentTranscript);
    if (currentTranscript && onTranscriptCallbackRef.current) {
      onTranscriptCallbackRef.current(currentTranscript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const setAutoSend = useCallback((callback: ((text: string) => void) | null) => {
    onTranscriptCallbackRef.current = callback;
  }, []);

  const startContinuousMode = useCallback(async (callback: (text: string) => void) => {
    console.log('🚀 Starting continuous conversation mode');
    continuousCallbackRef.current = callback;
    console.log('🚀 Setting isInContinuousMode to true');
    setIsInContinuousMode(true);
    console.log('🚀 About to start listening');
    await startListening();
    console.log('🚀 Start listening completed');
  }, [startListening]);

  const stopContinuousMode = useCallback(() => {
    console.log('Stopping continuous conversation mode');
    setIsInContinuousMode(false);
    continuousCallbackRef.current = null;
    clearAllTimers();
    stopListening();
  }, [stopListening, clearAllTimers]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMutedState = !prev;
      
      // When muting, trigger auto-send immediately (simulate silence) - defer to avoid render conflict
      if (newMutedState && transcript.trim()) {
        setTimeout(() => {
          triggerAutoSend('muted - artificial silence');
        }, 0);
      }
      
      return newMutedState;
    });
  }, [transcript, triggerAutoSend]);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    sendCurrentTranscript,
    error,
    setAutoSend,
    isInContinuousMode,
    startContinuousMode,
    stopContinuousMode,
    autoSendCountdown,
    autoSendReason,
    isMuted,
    setMuted: setIsMuted,
    toggleMute,
  };
}