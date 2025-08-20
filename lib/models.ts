// Claude model types and configurations
export type ClaudeModel = 
  | 'claude-3-opus-20240229'
  | 'claude-3-5-sonnet-20241022' 
  | 'claude-3-haiku-20240307';

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
  'claude-3-opus-20240229': {
    model: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    description: 'Most capable Claude 3 model with exceptional reasoning',
    costTier: 'high',
    strengths: ['Complex reasoning', 'Creative writing', 'Detailed analysis', 'Code review'],
    bestFor: ['Research', 'Creative projects', 'Complex problem solving', 'Code analysis'],
    maxTokens: 4096,
    icon: '🎭'
  },
  'claude-3-5-sonnet-20241022': {
    model: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    description: 'Balanced performance model with excellent capabilities',
    costTier: 'medium',
    strengths: ['Balanced capabilities', 'Good speed', 'Versatile', 'Coding'],
    bestFor: ['General conversation', 'Programming help', 'Analysis', 'Most daily tasks'],
    maxTokens: 8192,
    icon: '⚡'
  },
  'claude-3-haiku-20240307': {
    model: 'claude-3-haiku-20240307',
    displayName: 'Claude 3 Haiku',
    description: 'Fast and efficient model for quick tasks',
    costTier: 'low',
    strengths: ['Speed', 'Efficiency', 'Cost-effective', 'Quick responses'],
    bestFor: ['Quick questions', 'Simple tasks', 'High-volume usage', 'Fast chat'],
    maxTokens: 4096,
    icon: '⚡'
  }
};

export const DEFAULT_MODEL: ClaudeModel = 'claude-3-5-sonnet-20241022';

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
  currentModel: 'claude-3-5-sonnet-20241022',
  overrideAgentDefault: false,
  modelHistory: []
};