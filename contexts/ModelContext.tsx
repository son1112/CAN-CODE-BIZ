'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ClaudeModel, DEFAULT_MODEL, SessionModelSettings, DEFAULT_SESSION_SETTINGS, ModelConfig, getAllModels, getModelConfig } from '@/lib/models';
import { AgentPersona } from '@/lib/agents';
import { Agent } from '@/hooks/useAgents';

interface ModelContextType {
  // Current model state
  currentModel: ClaudeModel;
  sessionModelSettings: SessionModelSettings;
  
  // Model management
  setSessionModel: (model: ClaudeModel, reason?: string) => void;
  resetToAgentDefault: () => void;
  
  // Model information
  availableModels: ModelConfig[];
  getModelConfig: (model: ClaudeModel) => ModelConfig;
  getEffectiveModel: (agent?: AgentPersona, powerAgent?: Agent) => ClaudeModel;
  
  // Cost and usage tracking
  messageCount: number;
  incrementMessageCount: () => void;
  resetMessageCount: () => void;
}

const ModelContext = createContext<ModelContextType | null>(null);

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within ModelProvider');
  }
  return context;
}

interface ModelProviderProps {
  children: ReactNode;
}

export function ModelProvider({ children }: ModelProviderProps) {
  const [sessionModelSettings, setSessionModelSettings] = useState<SessionModelSettings>(DEFAULT_SESSION_SETTINGS);
  const [messageCount, setMessageCount] = useState(0);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('rubber-ducky-model-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessionModelSettings({
          ...DEFAULT_SESSION_SETTINGS,
          ...parsed,
          modelHistory: parsed.modelHistory?.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          })) || []
        });
      } catch (error) {
        console.warn('Failed to parse saved model settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('rubber-ducky-model-settings', JSON.stringify(sessionModelSettings));
  }, [sessionModelSettings]);

  const setSessionModel = useCallback((model: ClaudeModel, reason: string = 'User preference') => {
    setSessionModelSettings(prev => ({
      ...prev,
      currentModel: model,
      overrideAgentDefault: true,
      modelHistory: [
        ...prev.modelHistory,
        { 
          model, 
          timestamp: new Date(), 
          reason 
        }
      ].slice(-10) // Keep only last 10 changes
    }));
  }, []);

  const resetToAgentDefault = useCallback(() => {
    setSessionModelSettings(prev => ({
      ...prev,
      overrideAgentDefault: false,
      modelHistory: [
        ...prev.modelHistory,
        { 
          model: prev.currentModel, 
          timestamp: new Date(), 
          reason: 'Reset to agent default' 
        }
      ].slice(-10)
    }));
  }, []);

  const getEffectiveModel = useCallback((agent?: AgentPersona, powerAgent?: Agent): ClaudeModel => {
    // If session has override, use it
    if (sessionModelSettings.overrideAgentDefault) {
      return sessionModelSettings.currentModel;
    }
    
    // Use power agent's preferred model if available
    if (powerAgent?.preferredModel) {
      return powerAgent.preferredModel;
    }
    
    // Use basic agent's preferred model if available
    if (agent?.preferredModel) {
      return agent.preferredModel;
    }
    
    // Fall back to session default or global default
    return sessionModelSettings.currentModel;
  }, [sessionModelSettings]);

  const incrementMessageCount = useCallback(() => {
    setMessageCount(prev => prev + 1);
  }, []);

  const resetMessageCount = useCallback(() => {
    setMessageCount(0);
  }, []);

  const availableModels = getAllModels();

  return (
    <ModelContext.Provider
      value={{
        currentModel: sessionModelSettings.currentModel,
        sessionModelSettings,
        setSessionModel,
        resetToAgentDefault,
        availableModels,
        getModelConfig,
        getEffectiveModel,
        messageCount,
        incrementMessageCount,
        resetMessageCount,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}