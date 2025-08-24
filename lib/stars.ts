import { StarableType } from '@/models/Star';

// Helper interfaces for different star types
export interface MessageStar {
  type: 'message';
  messageId: string;
  sessionId: string;
  content: string;
  agentId?: string;
  timestamp: Date;
}

export interface SessionStar {
  type: 'session';
  sessionId: string;
  sessionName: string;
  messageCount: number;
  lastAgentUsed?: string;
  createdAt: Date;
}

export interface AgentStar {
  type: 'agent';
  agentId: string;
  agentName: string;
  description: string;
}

export interface ConversationStarterStar {
  type: 'conversation-starter';
  starterId: string;
  content: string;
  agentId?: string;
}

export interface CodeSnippetStar {
  type: 'code-snippet';
  snippetId: string;
  code: string;
  language?: string;
  description?: string;
  sessionId?: string;
}

export type StarItem =
  | MessageStar
  | SessionStar
  | AgentStar
  | ConversationStarterStar
  | CodeSnippetStar;

// Star creation helpers
export interface CreateStarOptions {
  userId: string;
  itemType: StarableType;
  itemId: string;
  context?: {
    sessionId?: string;
    messageContent?: string;
    agentId?: string;
    snippet?: string;
    title?: string;
    description?: string;
  };
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
}

// Filter options for retrieving stars
export interface StarFilterOptions {
  userId: string;
  itemType?: StarableType;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  search?: string; // Search in titles, descriptions, content
  limit?: number;
  offset?: number;
  sortBy?: 'starredAt' | 'lastAccessedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// UI display helpers
export function getStarIcon(itemType: StarableType): string {
  switch (itemType) {
    case 'message': return '💬';
    case 'session': return '📝';
    case 'agent': return '🤖';
    case 'conversation-starter': return '💡';
    case 'code-snippet': return '💻';
    default: return '⭐';
  }
}

export function getStarDisplayName(itemType: StarableType): string {
  switch (itemType) {
    case 'message': return 'Message';
    case 'session': return 'Session';
    case 'agent': return 'Agent';
    case 'conversation-starter': return 'Conversation Starter';
    case 'code-snippet': return 'Code Snippet';
    default: return 'Item';
  }
}

export function getPriorityColor(priority: 'low' | 'medium' | 'high'): string {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

export function getPriorityIcon(priority: 'low' | 'medium' | 'high'): string {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

// Category auto-detection
export function deriveCategory(itemType: StarableType, context?: Record<string, unknown>): string {
  switch (itemType) {
    case 'message':
      if (context?.agentId === 'real-estate-advisor') return 'Real Estate';
      return 'Chat';
    case 'session':
      return 'Conversations';
    case 'agent':
      return 'AI Assistants';
    case 'conversation-starter':
      return 'Prompts';
    case 'code-snippet':
      return 'Code';
    default:
      return 'General';
  }
}