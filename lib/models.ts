// Claude model types and configurations
export type ClaudeModel =
  | 'claude-sonnet-4-20250514'      // Claude 4 Sonnet (primary - best balance)
  | 'claude-opus-4-1-20250805'     // Claude 4.1 Opus (highest quality)
  | 'claude-3-5-sonnet-20241022'   // Claude 3.5 Sonnet (reliable fallback)
  | 'claude-3-haiku-20240307';     // Claude 3 Haiku (fastest/cheapest fallback)

export interface ModelConfig {
  model: ClaudeModel;
  displayName: string;
  description: string;
  costTier: 'low' | 'medium' | 'high';
  strengths: string[];
  bestFor: string[];
  maxTokens: number;
  icon: string;
}

export const MODEL_CONFIGS: Record<ClaudeModel, ModelConfig> = {
  'claude-sonnet-4-20250514': {
    model: 'claude-sonnet-4-20250514',
    displayName: 'Claude 4 Sonnet',
    description: 'Latest Claude 4 model with state-of-the-art coding and reasoning',
    costTier: 'medium',
    strengths: ['Advanced coding (72.7% SWE-bench)', 'Hybrid thinking', 'Balanced performance', 'Extended reasoning'],
    bestFor: ['Programming', 'General conversation', 'Complex analysis', 'Most daily tasks'],
    maxTokens: 8192,
    icon: '🚀'
  },
  'claude-opus-4-1-20250805': {
    model: 'claude-opus-4-1-20250805',
    displayName: 'Claude 4.1 Opus',
    description: 'Most advanced model with exceptional coding and reasoning capabilities',
    costTier: 'high',
    strengths: ['Superior coding (74.5% SWE-bench)', 'Complex reasoning', 'Long-running tasks', 'Deep analysis'],
    bestFor: ['Complex coding projects', 'Research', 'Detailed analysis', 'Multi-hour tasks'],
    maxTokens: 8192,
    icon: '🎭'
  },
  'claude-3-5-sonnet-20241022': {
    model: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    description: 'Reliable Claude 3.5 model with excellent capabilities',
    costTier: 'medium',
    strengths: ['Proven reliability', 'Good speed', 'Versatile', 'Coding'],
    bestFor: ['Fallback option', 'General tasks', 'Programming help', 'Analysis'],
    maxTokens: 8192,
    icon: '⚡'
  },
  'claude-3-haiku-20240307': {
    model: 'claude-3-haiku-20240307',
    displayName: 'Claude 3 Haiku',
    description: 'Fast and cost-effective model for quick tasks',
    costTier: 'low',
    strengths: ['Speed', 'Efficiency', 'Cost-effective', 'Quick responses'],
    bestFor: ['Quick questions', 'Simple tasks', 'High-volume usage', 'Emergency fallback'],
    maxTokens: 4096,
    icon: '💨'
  }
};

export const DEFAULT_MODEL: ClaudeModel = 'claude-sonnet-4-20250514';

export function getModelConfig(model: ClaudeModel): ModelConfig {
  return MODEL_CONFIGS[model];
}

export function getAllModels(): ModelConfig[] {
  return Object.values(MODEL_CONFIGS);
}

export function getCostTierColor(tier: 'low' | 'medium' | 'high'): string {
  switch (tier) {
    case 'low': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-blue-600 bg-blue-100';
    case 'high': return 'text-purple-600 bg-purple-100';
  }
}

export interface SessionModelSettings {
  currentModel: ClaudeModel;
  overrideAgentDefault: boolean;
  modelHistory: Array<{
    model: ClaudeModel;
    timestamp: Date;
    reason: string;
  }>;
}

export const DEFAULT_SESSION_SETTINGS: SessionModelSettings = {
  currentModel: 'claude-sonnet-4-20250514',
  overrideAgentDefault: false,
  modelHistory: []
};