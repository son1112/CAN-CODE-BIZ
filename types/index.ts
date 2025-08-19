export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioMetadata?: {
    duration?: number;
    language?: string;
  };
  agentUsed?: string;
  tags?: string[];
}

export interface Conversation {
  _id?: string;
  userId?: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    title?: string;
    tags?: string[];
  };
}

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface StreamingResponse {
  content: string;
  isComplete: boolean;
  error?: string;
}