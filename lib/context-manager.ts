import { Message } from '@/types';

interface ContextConfig {
  maxRecentMessages: number;
  maxTotalTokens: number;
  keepFirstMessages: number;
  keepImportantMessages: boolean;
}

interface ContextResult {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  totalTokens: number;
  truncated: boolean;
  strategy: string;
}

const DEFAULT_CONFIG: ContextConfig = {
  maxRecentMessages: 12, // Keep last 12 messages for immediate context
  maxTotalTokens: 8000, // Conservative token limit for good performance
  keepFirstMessages: 2, // Keep first 2 messages for context setup
  keepImportantMessages: true
};

/**
 * Estimate token count for a message (rough approximation)
 * More accurate would require tiktoken, but this gives us a good estimate
 */
function estimateTokens(content: string): number {
  // Rough estimation: ~4 characters per token on average
  // This includes some buffer for message overhead
  return Math.ceil(content.length / 3.5);
}

/**
 * Check if a message might be contextually important
 */
function isImportantMessage(message: Message, index: number, totalMessages: number): boolean {
  const content = message.content.toLowerCase();

  // First few messages often contain important context
  if (index < 3) return true;

  // Messages with specific keywords that indicate importance
  const importantKeywords = [
    'remember', 'important', 'context', 'background',
    'my name is', 'i am', 'project', 'working on',
    'objective', 'goal', 'requirement', 'specification'
  ];

  return importantKeywords.some(keyword => content.includes(keyword));
}

/**
 * Smart context selection that optimizes for performance while maintaining quality
 */
export function selectOptimalContext(
  messages: Message[],
  config: ContextConfig = DEFAULT_CONFIG
): ContextResult {
  if (messages.length === 0) {
    return {
      messages: [],
      totalTokens: 0,
      truncated: false,
      strategy: 'empty'
    };
  }

  // Convert to API format
  const apiMessages = messages.map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content
  }));

  // If we have few messages, send all
  if (messages.length <= config.maxRecentMessages) {
    const totalTokens = apiMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

    if (totalTokens <= config.maxTotalTokens) {
      return {
        messages: apiMessages,
        totalTokens,
        truncated: false,
        strategy: 'full-context'
      };
    }
  }

  // Strategy 1: Recent messages only (most common case)
  const recentMessages = apiMessages.slice(-config.maxRecentMessages);
  const recentTokens = recentMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

  if (recentTokens <= config.maxTotalTokens) {
    return {
      messages: recentMessages,
      totalTokens: recentTokens,
      truncated: messages.length > config.maxRecentMessages,
      strategy: 'recent-window'
    };
  }

  // Strategy 2: Important messages + recent context
  if (config.keepImportantMessages && messages.length > config.maxRecentMessages) {
    const importantMessages: Array<{ msg: typeof apiMessages[0], index: number }> = [];
    const recentStartIndex = messages.length - config.maxRecentMessages;

    // Collect important messages from early conversation
    messages.slice(0, recentStartIndex).forEach((msg, index) => {
      if (isImportantMessage(msg, index, messages.length)) {
        importantMessages.push({
          msg: { role: msg.role as 'user' | 'assistant' | 'system', content: msg.content },
          index
        });
      }
    });

    // Keep first few messages as context anchors
    const contextAnchors = apiMessages.slice(0, Math.min(config.keepFirstMessages, recentStartIndex));

    // Build optimized message list
    let selectedMessages = [...contextAnchors];
    let currentTokens = contextAnchors.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

    // Add important messages if they fit
    for (const { msg } of importantMessages.slice(0, 3)) { // Limit important messages
      const tokens = estimateTokens(msg.content);
      if (currentTokens + tokens <= config.maxTotalTokens * 0.4) { // Reserve 60% for recent messages
        selectedMessages.push(msg);
        currentTokens += tokens;
      }
    }

    // Add recent messages with remaining token budget
    const remainingBudget = config.maxTotalTokens - currentTokens;
    let recentTokenCount = 0;
    const recentMessagesReversed = apiMessages.slice(-config.maxRecentMessages).reverse();

    for (const msg of recentMessagesReversed) {
      const tokens = estimateTokens(msg.content);
      if (recentTokenCount + tokens <= remainingBudget) {
        recentTokenCount += tokens;
      } else {
        break;
      }
    }

    // Take as many recent messages as fit in budget
    const recentMessageCount = recentMessagesReversed.findIndex((msg, i) => {
      const tokens = recentMessagesReversed.slice(0, i + 1).reduce((sum, m) => sum + estimateTokens(m.content), 0);
      return tokens > remainingBudget;
    });

    const recentMessagesToInclude = recentMessageCount === -1
      ? apiMessages.slice(-config.maxRecentMessages)
      : apiMessages.slice(-(recentMessageCount === 0 ? 1 : recentMessageCount));

    selectedMessages = selectedMessages.concat(recentMessagesToInclude);

    return {
      messages: selectedMessages,
      totalTokens: selectedMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0),
      truncated: true,
      strategy: 'important-plus-recent'
    };
  }

  // Strategy 3: Aggressive truncation - keep only essential recent messages
  let budgetRemaining = config.maxTotalTokens;
  const essentialMessages: typeof apiMessages = [];

  for (const msg of apiMessages.reverse()) {
    const tokens = estimateTokens(msg.content);
    if (tokens <= budgetRemaining) {
      essentialMessages.unshift(msg);
      budgetRemaining -= tokens;
    } else {
      break;
    }
  }

  return {
    messages: essentialMessages,
    totalTokens: config.maxTotalTokens - budgetRemaining,
    truncated: true,
    strategy: 'aggressive-truncation'
  };
}

/**
 * Get context statistics for debugging/monitoring
 */
export function getContextStats(messages: Message[]): {
  totalMessages: number;
  totalTokens: number;
  averageTokensPerMessage: number;
} {
  const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

  return {
    totalMessages: messages.length,
    totalTokens,
    averageTokensPerMessage: messages.length > 0 ? Math.round(totalTokens / messages.length) : 0
  };
}

/**
 * Adaptive configuration based on conversation characteristics
 */
export function getAdaptiveConfig(messages: Message[]): ContextConfig {
  const stats = getContextStats(messages);

  // For conversations with very long messages, be more aggressive
  if (stats.averageTokensPerMessage > 200) {
    return {
      ...DEFAULT_CONFIG,
      maxRecentMessages: 8,
      maxTotalTokens: 6000
    };
  }

  // For conversations with many short messages, can include more
  if (stats.averageTokensPerMessage < 50) {
    return {
      ...DEFAULT_CONFIG,
      maxRecentMessages: 20,
      maxTotalTokens: 10000
    };
  }

  return DEFAULT_CONFIG;
}