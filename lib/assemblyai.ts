if (!process.env.ASSEMBLYAI_API_KEY) {
  console.error('ASSEMBLYAI_API_KEY environment variable is required');
}

export const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY!;

// AssemblyAI Universal Streaming uses direct WebSocket connection with API key
export function getStreamingWebSocketUrl() {
  return 'wss://api.assemblyai.com/v2/realtime/ws';
}

export function getStreamingConfig() {
  return {
    sample_rate: 16000,
    word_boost: ['Claude', 'AI', 'assistant'],
    encoding: 'pcm_s16le'
  };
}