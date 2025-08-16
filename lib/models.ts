// Claude model types and configurations
export type ClaudeModel = 
  | 'claude-3-opus-20240229'
  | 'claude-3-5-sonnet-20241022' 
  | 'claude-3-haiku-20240307'
  | 'claude-4-sonnet-20250514'
  | 'claude-4-opus-20250521'
  | 'claude-4-haiku-20250521';

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
  'claude-4-sonnet-20250514': {
    model: 'claude-4-sonnet-20250514',
    displayName: 'Claude 4 Sonnet',
    description: 'Latest generation model with enhanced capabilities and reasoning',
    costTier: 'medium',
    strengths: ['Advanced reasoning', 'Superior coding', 'Enhanced analysis', 'Latest features'],
    bestFor: ['Complex coding', 'Advanced analysis', 'Research', 'General conversation'],
    maxTokens: 8192,
    icon: '🚀'
  },
  'claude-4-opus-20250521': {
    model: 'claude-4-opus-20250521',
    displayName: 'Claude 4 Opus',
    description: 'Most advanced model with exceptional reasoning and creative capabilities',
    costTier: 'high',
    strengths: ['Exceptional reasoning', 'Advanced creativity', 'Complex analysis', 'Research excellence'],
    bestFor: ['Complex research', 'Advanced creativity', 'Deep analysis', 'Expert-level tasks'],
    maxTokens: 8192,
    icon: '🎭'
  },
  'claude-4-haiku-20250521': {
    model: 'claude-4-haiku-20250521',
    displayName: 'Claude 4 Haiku',
    description: 'Fastest new generation model for quick tasks and high-volume usage',
    costTier: 'low',
    strengths: ['Ultra-fast responses', 'Efficiency', 'Cost-effective', 'Latest speed'],
    bestFor: ['Quick questions', 'Fast chat', 'High-volume usage', 'Rapid responses'],
    maxTokens: 8192,
    icon: '⚡'
  },
  'claude-3-opus-20240229': {
    model: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus (Legacy)',
    description: 'Previous generation - most capable Claude 3 model',
    costTier: 'high',
    strengths: ['Complex reasoning', 'Creative writing', 'Detailed analysis', 'Code review'],
    bestFor: ['Research', 'Creative projects', 'Complex problem solving', 'Code analysis'],
    maxTokens: 4096,
    icon: '🎭'
  },
  'claude-3-5-sonnet-20241022': {
    model: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet (Legacy)',
    description: 'Previous generation - balanced performance model',
    costTier: 'medium',
    strengths: ['Balanced capabilities', 'Good speed', 'Versatile', 'Coding'],
    bestFor: ['General conversation', 'Programming help', 'Analysis', 'Most daily tasks'],
    maxTokens: 8192,
    icon: '⚡'
  },
  'claude-3-haiku-20240307': {
    model: 'claude-3-haiku-20240307',
    displayName: 'Claude 3 Haiku (Legacy)',
    description: 'Previous generation - fast and efficient model',
    costTier: 'low',
    strengths: ['Speed', 'Efficiency', 'Cost-effective', 'Quick responses'],
    bestFor: ['Quick questions', 'Simple tasks', 'High-volume usage', 'Fast chat'],
    maxTokens: 4096,
    icon: '⚡'
  }
};

export const DEFAULT_MODEL: ClaudeModel = 'claude-4-sonnet-20250514';

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
  currentModel: 'claude-4-sonnet-20250514',
  overrideAgentDefault: false,
  modelHistory: []
};