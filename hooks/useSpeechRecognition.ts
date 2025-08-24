import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { useContentSafety } from '@/contexts/ContentSafetyContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface SentimentAnalysis {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  confidence: number;
  timestamp: number;
}

interface SpeakerLabel {
  speaker: string;
  startTime: number;
  endTime: number;
  confidence: number;
  text: string;
}

interface ContentSafetyResult {
  violence: { detected: boolean; confidence: number };
  hate_speech: { detected: boolean; confidence: number };
  profanity: { detected: boolean; confidence: number };
  harassment: { detected: boolean; confidence: number };
  self_harm: { detected: boolean; confidence: number };
  sexual_content: { detected: boolean; confidence: number };
  summary: {
    riskLevel: 'low' | 'medium' | 'high';
    flaggedCategories: string[];
  };
  timestamp: number;
}

interface TranscriptionQuality {
  confidence: number;
  audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
  noiseLevel: 'low' | 'medium' | 'high';
  speechClarityScore: number;
  timestamp: number;
}

interface QualityMetrics {
  averageConfidence: number;
  totalWords: number;
  highConfidenceWords: number;
  lowConfidenceWords: number;
  qualityTrend: 'improving' | 'stable' | 'declining';
  sessionDuration: number;
  recommendations: string[];
}

interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  cancelRecording: () => void;
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
  sentimentAnalysis: SentimentAnalysis | null;
  sentimentHistory: SentimentAnalysis[];
  currentSpeaker: string | null;
  speakerLabels: SpeakerLabel[];
  speakerHistory: { [speaker: string]: string[] };
  contentSafety: ContentSafetyResult | null;
  safetyWarnings: ContentSafetyResult[];
  transcriptionQuality: TranscriptionQuality | null;
  qualityMetrics: QualityMetrics;
  qualityHistory: TranscriptionQuality[];
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const { settings: safetySettings } = useContentSafety();
  const { preferences } = useUserPreferences();

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInContinuousMode, setIsInContinuousMode] = useState(false);
  const [autoSendCountdown, setAutoSendCountdown] = useState<number | null>(null);
  const [autoSendReason, setAutoSendReason] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<SentimentAnalysis | null>(null);
  const [sentimentHistory, setSentimentHistory] = useState<SentimentAnalysis[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [speakerLabels, setSpeakerLabels] = useState<SpeakerLabel[]>([]);
  const [speakerHistory, setSpeakerHistory] = useState<{ [speaker: string]: string[] }>({});
  const [contentSafety, setContentSafety] = useState<ContentSafetyResult | null>(null);
  const [safetyWarnings, setSafetyWarnings] = useState<ContentSafetyResult[]>([]);
  const [transcriptionQuality, setTranscriptionQuality] = useState<TranscriptionQuality | null>(null);
  const [qualityHistory, setQualityHistory] = useState<TranscriptionQuality[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    averageConfidence: 0,
    totalWords: 0,
    highConfidenceWords: 0,
    lowConfidenceWords: 0,
    qualityTrend: 'stable',
    sessionDuration: 0,
    recommendations: []
  });

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
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Professional conversation thresholds for interview-quality discussions
  // Use user preference for silence threshold, default to 5 seconds if not available
  const SILENCE_THRESHOLD = (preferences?.voice?.silenceThreshold || 5) * 1000; // Convert seconds to milliseconds
  const MAX_ACCUMULATION_TIME = 15000; // 15 seconds max before forced send
  const MIN_TRANSCRIPT_LENGTH = 8; // Minimum words for professional conversations

  // Quality analysis helper functions
  const analyzeAudioQuality = useCallback((confidence: number, noiseLevel: 'low' | 'medium' | 'high'): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (confidence > 0.9 && noiseLevel === 'low') return 'excellent';
    if (confidence > 0.8 && noiseLevel !== 'high') return 'good';
    if (confidence > 0.6) return 'fair';
    return 'poor';
  }, []);

  const calculateQualityMetrics = useCallback((history: TranscriptionQuality[]): QualityMetrics => {
    if (history.length === 0) {
      return {
        averageConfidence: 0,
        totalWords: 0,
        highConfidenceWords: 0,
        lowConfidenceWords: 0,
        qualityTrend: 'stable',
        sessionDuration: 0,
        recommendations: []
      };
    }

    const avgConfidence = history.reduce((sum, q) => sum + q.confidence, 0) / history.length;
    const totalWords = history.length; // Each quality entry represents a word/phrase
    const highConfidenceWords = history.filter(q => q.confidence > 0.8).length;
    const lowConfidenceWords = history.filter(q => q.confidence < 0.6).length;

    // Calculate trend from last 10 entries
    const recent = history.slice(-10);
    const older = history.slice(-20, -10);
    let qualityTrend: 'improving' | 'stable' | 'declining' = 'stable';

    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, q) => sum + q.confidence, 0) / recent.length;
      const olderAvg = older.reduce((sum, q) => sum + q.confidence, 0) / older.length;

      if (recentAvg > olderAvg + 0.05) qualityTrend = 'improving';
      else if (recentAvg < olderAvg - 0.05) qualityTrend = 'declining';
    }

    const sessionDuration = Date.now() - sessionStartTimeRef.current;

    // Generate recommendations based on metrics
    const recommendations: string[] = [];
    if (avgConfidence < 0.7) {
      recommendations.push('Try speaking closer to the microphone');
      recommendations.push('Reduce background noise if possible');
    }
    if (lowConfidenceWords / totalWords > 0.3) {
      recommendations.push('Speak more clearly and slowly');
    }
    if (qualityTrend === 'declining') {
      recommendations.push('Check microphone positioning');
    }

    return {
      averageConfidence: avgConfidence,
      totalWords,
      highConfidenceWords,
      lowConfidenceWords,
      qualityTrend,
      sessionDuration,
      recommendations
    };
  }, []);

  const updateQualityMetrics = useCallback((newQuality: TranscriptionQuality) => {
    setQualityHistory(prev => {
      const updated = [...prev.slice(-29), newQuality]; // Keep last 30 entries
      const metrics = calculateQualityMetrics(updated);
      setQualityMetrics(metrics);
      return updated;
    });
  }, [calculateQualityMetrics]);

  const analyzeEndOfTurn = useCallback((transcriptText: string, silenceDuration: number) => {
    const trimmed = transcriptText.trim();
    const words = trimmed.split(/\s+/);
    const wordCount = words.length;

    // Scoring system for end-of-turn detection
    let endOfTurnScore = 0;

    // 1. Silence duration factor (most important)
    const silenceThresholdMs = SILENCE_THRESHOLD;
    const silenceScore = Math.min(silenceDuration / silenceThresholdMs, 2.0); // Max 2x weight
    endOfTurnScore += silenceScore * 40; // 40% weight

    // 2. Punctuation completion
    if (/[.!?]$/.test(trimmed)) {
      endOfTurnScore += 25; // Strong indicator
    } else if (/[,;:]$/.test(trimmed)) {
      endOfTurnScore -= 10; // Indicates continuation
    }

    // 3. Sentence completeness patterns
    const completePatterns = [
      /\b(thank you|thanks|that's all|perfect|exactly|right|correct|done|finished)\b$/i,
      /\b(goodbye|bye|see you|talk to you later)\b$/i,
      /\b(yes|no|okay|alright|sure|absolutely|definitely)\b$/i
    ];

    const incompletePatterns = [
      /\b(and|but|or|if|when|then|so|because|since|while|although|though|unless|until|where|after|before|with|without|about|for|of|in|on|at|by|to|from|up|down|out|off)$/i,
      /\b(i am|i'm|you are|you're|he is|she is|it is|we are|they are|there is|there are)\s*$/i,
      /\b(i can|you can|he can|she can|we can|they can|i should|you should|we should|they should|i will|you will|we will|they will)\s*$/i
    ];

    if (completePatterns.some(pattern => pattern.test(trimmed))) {
      endOfTurnScore += 20;
    }

    if (incompletePatterns.some(pattern => pattern.test(trimmed))) {
      endOfTurnScore -= 25;
    }

    // 4. Length considerations
    if (wordCount >= 15) {
      endOfTurnScore += 15; // Substantial content is likely complete
    } else if (wordCount < 5) {
      endOfTurnScore -= 15; // Too short, likely incomplete
    }

    // 5. Question detection
    if (/\?$/.test(trimmed) && wordCount >= 5) {
      endOfTurnScore += 15;
    }

    // 6. Natural conversation flow
    const naturalEndings = [
      /\b(you know|I think|I believe|in my opinion|basically|essentially|overall|in conclusion)\b.*$/i,
      /\b(that's|thats)\b.*\b(it|all|right|correct|good|what I mean)\b$/i
    ];

    if (naturalEndings.some(pattern => pattern.test(trimmed))) {
      endOfTurnScore += 10;
    }

    // Normalize score to 0-100 range
    const normalizedScore = Math.max(0, Math.min(100, endOfTurnScore));

    logger.debug('End-of-turn analysis', {
      component: 'SpeechRecognition',
      transcript: trimmed.substring(0, 50) + '...',
      silenceDuration,
      wordCount,
      endOfTurnScore: normalizedScore,
      threshold: 60 // Consider end-of-turn if score >= 60
    });

    return {
      score: normalizedScore,
      isEndOfTurn: normalizedScore >= 60,
      confidence: normalizedScore / 100,
      factors: {
        silenceScore,
        wordCount,
        hasPunctuation: /[.!?]$/.test(trimmed),
        hasCompletePattern: completePatterns.some(pattern => pattern.test(trimmed)),
        hasIncompletePattern: incompletePatterns.some(pattern => pattern.test(trimmed))
      }
    };
  }, [SILENCE_THRESHOLD]);

  useEffect(() => {
    // Browser support detection - runs only on client after hydration
    const checkBrowserSupport = () => {
      if (typeof window !== 'undefined') {
        const hasMediaRecorder = 'MediaRecorder' in window;
        const hasWebSocket = 'WebSocket' in window;
        const hasMediaDevices = !!navigator?.mediaDevices?.getUserMedia;
        const isSupported = hasMediaRecorder && hasWebSocket && hasMediaDevices;

        setIsSupported(isSupported);

        if (isSupported) {
          logger.info('AssemblyAI Speech Recognition supported', { component: 'SpeechRecognition' });
        } else {
          logger.warn('AssemblyAI Speech Recognition not supported', {
            component: 'SpeechRecognition',
            hasMediaRecorder,
            hasWebSocket,
            hasMediaDevices
          });
        }
      }
    };

    checkBrowserSupport();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    logger.debug('Continuous mode state changed', { component: 'SpeechRecognition', isInContinuousMode });
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
          logger.warn('Error closing AudioContext', { component: 'SpeechRecognition' }, e);
        }
      }
      if (ws.processor) {
        try {
          ws.processor.disconnect();
        } catch (e) {
          logger.warn('Error disconnecting processor', { component: 'SpeechRecognition' }, e);
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
    logger.info('Auto-send triggered', {
      component: 'SpeechRecognition',
      reason,
      transcriptLength: currentTranscript.length
    });

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

      logger.info('Requesting microphone access', { component: 'SpeechRecognition' });

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser');
      }

      // Get microphone access first with timeout
      const streamPromise = navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Microphone access timeout after 10 seconds')), 10000)
      );

      const stream = await Promise.race([streamPromise, timeoutPromise]) as MediaStream;
      logger.info('Microphone access granted', { component: 'SpeechRecognition' });

      streamRef.current = stream;

      // Get API key from environment
      logger.info('Requesting speech token from API', { component: 'SpeechRecognition' });
      const apiKeyResponse = await fetch('/api/speech-token', {
        method: 'POST',
      });

      if (!apiKeyResponse.ok) {
        const errorData = await apiKeyResponse.json().catch(() => ({}));
        logger.error('Failed to get speech token', { component: 'SpeechRecognition', status: apiKeyResponse.status }, errorData);
        throw new Error(errorData.error || `Failed to get API key (${apiKeyResponse.status})`);
      }

      const { apiKey } = await apiKeyResponse.json();
      logger.info('Speech token received successfully', { component: 'SpeechRecognition' });

      logger.debug('API Key received', {
        component: 'SpeechRecognition',
        hasApiKey: !!apiKey
      });

      // Create WebSocket connection to AssemblyAI Universal Streaming
      // Universal Streaming requires specific parameters, including sentiment analysis, speaker labels, and optional content safety
      const safetyParam = safetySettings.enabled ? '&content_safety_detection=true' : '';
      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&encoding=pcm_s16le&sentiment_analysis=true&speaker_labels=true${safetyParam}&token=${apiKey}`;

      const features = ['sentiment analysis', 'speaker diarization'];
      if (safetySettings.enabled) {
        features.push(`content safety (${safetySettings.mode} mode)`);
      }

      logger.info(`Connecting to AssemblyAI Universal Streaming with ${features.join(', ')}`, { component: 'SpeechRecognition' });

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.info('AssemblyAI WebSocket connected', { component: 'SpeechRecognition' });
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
          logger.debug('AssemblyAI message received', { component: 'SpeechRecognition', type: data.type });

          // Handle AssemblyAI Universal Streaming message format
          if (data.type === 'Begin') {
            logger.info('AssemblyAI session started', { component: 'SpeechRecognition', sessionId: data.id });
          } else if (data.type === 'sentiment') {
            // Handle sentiment analysis results
            const sentimentData: SentimentAnalysis = {
              sentiment: data.sentiment as 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE',
              confidence: data.confidence || 0,
              timestamp: Date.now()
            };

            logger.debug('Sentiment analysis received', {
              component: 'SpeechRecognition',
              sentiment: sentimentData.sentiment,
              confidence: sentimentData.confidence
            });

            setSentimentAnalysis(sentimentData);
            setSentimentHistory(prev => [...prev.slice(-9), sentimentData]); // Keep last 10 entries
          } else if (data.type === 'speaker_labels' || data.hasOwnProperty('speaker_labels')) {
            // Handle speaker diarization results
            const labels = data.speaker_labels || data.labels || [];

            logger.debug('Speaker labels received', {
              component: 'SpeechRecognition',
              labelCount: labels.length
            });

            labels.forEach((label: any) => {
              const speakerLabel: SpeakerLabel = {
                speaker: label.speaker || 'Unknown',
                startTime: label.start || 0,
                endTime: label.end || 0,
                confidence: label.confidence || 0,
                text: label.text || ''
              };

              setSpeakerLabels(prev => [...prev.slice(-49), speakerLabel]); // Keep last 50 entries

              // Update current speaker
              setCurrentSpeaker(speakerLabel.speaker);

              // Add to speaker history
              setSpeakerHistory(prev => ({
                ...prev,
                [speakerLabel.speaker]: [
                  ...(prev[speakerLabel.speaker] || []).slice(-9), // Keep last 10 per speaker
                  speakerLabel.text
                ].filter(text => text.trim())
              }));
            });
          } else if (data.type === 'content_safety' || data.hasOwnProperty('content_safety')) {
            // Handle content safety results
            if (safetySettings.enabled) {
              const safetyData = data.content_safety || data;

              // Process safety categories
              const categories = {
                violence: safetyData.violence || { detected: false, confidence: 0 },
                hate_speech: safetyData.hate_speech || { detected: false, confidence: 0 },
                profanity: safetyData.profanity || { detected: false, confidence: 0 },
                harassment: safetyData.harassment || { detected: false, confidence: 0 },
                self_harm: safetyData.self_harm || { detected: false, confidence: 0 },
                sexual_content: safetyData.sexual_content || { detected: false, confidence: 0 }
              };

              // Determine risk level and flagged categories
              const flaggedCategories = Object.entries(categories)
                .filter(([_, result]) => result.detected)
                .map(([category, _]) => category);

              const highConfidenceFlags = Object.entries(categories)
                .filter(([_, result]) => result.detected && result.confidence > 0.7)
                .map(([category, _]) => category);

              const riskLevel =
                highConfidenceFlags.length > 0 ? 'high' :
                flaggedCategories.length > 1 ? 'medium' :
                flaggedCategories.length > 0 ? 'low' : 'low';

              const safetyResult: ContentSafetyResult = {
                ...categories,
                summary: {
                  riskLevel,
                  flaggedCategories
                },
                timestamp: Date.now()
              };

              logger.debug('Content safety analysis received', {
                component: 'SpeechRecognition',
                riskLevel,
                flaggedCategories,
                mode: safetySettings.mode
              });

              setContentSafety(safetyResult);

              if (flaggedCategories.length > 0) {
                setSafetyWarnings(prev => [...prev.slice(-4), safetyResult]); // Keep last 5 warnings
              }
            }
          } else if (data.hasOwnProperty('transcript')) {
            // This is a transcript message with turn_order, end_of_turn, transcript fields
            const transcript = data.transcript || '';
            const isEndOfTurn = data.end_of_turn === true;
            const confidence = data.confidence || 0.5; // Default confidence if not provided

            // Track transcription quality for both partial and final transcripts
            if (transcript) {
              const noiseLevel: 'low' | 'medium' | 'high' = confidence > 0.8 ? 'low' : confidence > 0.6 ? 'medium' : 'high';
              const qualityData: TranscriptionQuality = {
                confidence,
                audioQuality: analyzeAudioQuality(confidence, noiseLevel),
                noiseLevel,
                speechClarityScore: confidence * 100,
                timestamp: Date.now()
              };

              setTranscriptionQuality(qualityData);

              // Only add to history for final transcripts to avoid spam
              if (isEndOfTurn) {
                updateQualityMetrics(qualityData);
              }
            }

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
              // Final transcript - add to main transcript with speaker information
              const speaker = data.speaker || currentSpeaker;
              const speakerPrefix = speaker ? `[${speaker}] ` : '';

              logger.debug('Final transcript received', {
                component: 'SpeechRecognition',
                transcript,
                speaker: speaker || 'Unknown'
              });
              lastActivityTimeRef.current = Date.now();

              setTranscript(prev => {
                const newTranscript = prev + speakerPrefix + transcript.trim() + ' ';
                logger.debug('Updating transcript', {
                  component: 'SpeechRecognition',
                  newLength: newTranscript.length,
                  isInContinuousMode,
                  hasCallback: !!continuousCallbackRef.current
                });

                // In continuous mode, implement multi-condition auto-send
                // Don't process new speech while muted
                if (isInContinuousModeRef.current && continuousCallbackRef.current && !isMuted) {
                  const shouldSend = shouldAutoSend(newTranscript);
                  logger.debug('Checking auto-send conditions', {
                    component: 'SpeechRecognition',
                    transcriptLength: newTranscript.trim().length,
                    shouldAutoSend: shouldSend
                  });

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

                  logger.debug('Immediate send check', { component: 'SpeechRecognition', shouldSendImmediately });

                  if (shouldSendImmediately && shouldAutoSend(newTranscript)) {
                    // Immediate send for natural conversation breaks - defer to avoid render conflict
                    logger.info('Triggering immediate send', { component: 'SpeechRecognition', reason: 'natural conversation break' });
                    clearAllTimers();
                    setTimeout(() => triggerAutoSend('natural conversation break', newTranscript), 100);
                  } else if (shouldAutoSend(newTranscript)) {
                    // Clear existing countdown to restart it
                    if (countdownTimerRef.current) {
                      logger.debug('Clearing existing countdown', { component: 'SpeechRecognition' });
                      clearTimeout(countdownTimerRef.current);
                      countdownTimerRef.current = null;
                      setAutoSendCountdown(null);
                      setAutoSendReason(null);
                    }

                    // Enhanced end-of-turn detection with dynamic countdown
                    const currentTime = Date.now();
                    const silenceDuration = currentTime - lastActivityTimeRef.current;
                    const endOfTurnAnalysis = analyzeEndOfTurn(newTranscript, silenceDuration);

                    logger.debug('Enhanced end-of-turn detection', {
                      component: 'SpeechRecognition',
                      transcriptLength: newTranscript.trim().length,
                      endOfTurnScore: endOfTurnAnalysis.score,
                      confidence: endOfTurnAnalysis.confidence,
                      silenceScore: endOfTurnAnalysis.factors.silenceScore,
                      wordCount: endOfTurnAnalysis.factors.wordCount,
                      hasPunctuation: endOfTurnAnalysis.factors.hasPunctuation
                    });

                    // Adjust countdown duration based on end-of-turn confidence
                    const baseDuration = SILENCE_THRESHOLD;
                    const confidenceMultiplier = endOfTurnAnalysis.confidence > 0.8 ? 0.7 : // High confidence = faster send
                                                endOfTurnAnalysis.confidence > 0.6 ? 0.85 : // Medium confidence = slightly faster
                                                1.2; // Low confidence = wait longer
                    const adjustedDuration = baseDuration * confidenceMultiplier;

                    logger.debug('Adjusted silence countdown', {
                      component: 'SpeechRecognition',
                      baseDuration,
                      adjustedDuration: Math.round(adjustedDuration),
                      confidenceMultiplier,
                      endOfTurnScore: endOfTurnAnalysis.score
                    });

                    startCountdown(adjustedDuration, `smart detection (${Math.round(endOfTurnAnalysis.score)}% confidence)`, () => {
                      triggerAutoSend('enhanced end-of-turn detection', newTranscript);
                    });
                  } else {
                    logger.debug('Auto-send conditions not met', { component: 'SpeechRecognition' });
                  }

                  // Start max accumulation timer if not already running
                  if (!maxAccumulationTimerRef.current && newTranscript.trim()) {
                    logger.debug('Starting max accumulation timer', { component: 'SpeechRecognition' });
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
            logger.error('AssemblyAI error received', { component: 'SpeechRecognition' }, data.error || data);
            setError(`Speech recognition error: ${data.error || 'Unknown error'}`);
            stopListening();
          }
        } catch (parseError) {
          logger.error('Error parsing AssemblyAI response', { component: 'SpeechRecognition' }, parseError);
        }
      };

      ws.onerror = (error) => {
        logger.error('AssemblyAI WebSocket error', { component: 'SpeechRecognition' }, error);
        setError('Speech recognition connection error. Please try again.');
        stopListening();
      };

      ws.onclose = (event) => {
        logger.info('AssemblyAI WebSocket closed', {
          component: 'SpeechRecognition',
          code: event.code,
          reason: event.reason
        });
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
            logger.warn('Audio encoding error detected', { component: 'SpeechRecognition' });
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
      logger.error('Failed to start speech recognition', { component: 'SpeechRecognition' }, err);

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

  const cancelRecording = useCallback(() => {
    logger.info('Canceling recording and discarding transcript', { component: 'SpeechRecognition' });

    // Stop listening first
    if (isListening) {
      setIsListening(false);
      cleanup();
    }

    // Clear all transcripts, sentiment data, speaker data, safety data, quality data, and timers
    setTranscript('');
    setInterimTranscript('');
    setSentimentAnalysis(null);
    setCurrentSpeaker(null);
    setSpeakerLabels([]);
    setContentSafety(null);
    setSafetyWarnings([]);
    setTranscriptionQuality(null);
    setQualityHistory([]);
    setQualityMetrics({
      averageConfidence: 0,
      totalWords: 0,
      highConfidenceWords: 0,
      lowConfidenceWords: 0,
      qualityTrend: 'stable',
      sessionDuration: 0,
      recommendations: []
    });
    clearAllTimers();

    // If in continuous mode, also stop that
    if (isInContinuousMode) {
      setIsInContinuousMode(false);
      continuousCallbackRef.current = null;
    }
  }, [isListening, isInContinuousMode, cleanup, clearAllTimers]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setSentimentAnalysis(null);
    setCurrentSpeaker(null);
    setContentSafety(null);
    setTranscriptionQuality(null);
  }, []);

  const sendCurrentTranscript = useCallback(() => {
    const currentTranscript = transcript.trim();
    logger.debug('Sending current transcript', {
      component: 'SpeechRecognition',
      transcriptLength: currentTranscript.length
    });
    if (currentTranscript && onTranscriptCallbackRef.current) {
      onTranscriptCallbackRef.current(currentTranscript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const setAutoSend = useCallback((callback: ((text: string) => void) | null) => {
    onTranscriptCallbackRef.current = callback;
  }, []);

  const startContinuousMode = useCallback(async (callback: (text: string) => void) => {
    logger.info('Starting continuous conversation mode', { component: 'SpeechRecognition' });
    continuousCallbackRef.current = callback;
    setIsInContinuousMode(true);
    await startListening();
    logger.info('Continuous mode started successfully', { component: 'SpeechRecognition' });
  }, [startListening]);

  const stopContinuousMode = useCallback(() => {
    logger.info('Stopping continuous conversation mode', { component: 'SpeechRecognition' });
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
    cancelRecording,
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
  };
}