'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AgentPersona, DEFAULT_AGENT, getAgentById } from '@/lib/agents';
import { Agent } from '@/hooks/useAgents';
import { ClaudeModel, DEFAULT_MODEL } from '@/lib/models';

interface AgentContextType {
  currentAgent: AgentPersona;
  currentPowerAgent: Agent | null;
  setAgent: (agentId: string) => void;
  setPowerAgent: (agent: Agent | null) => void;
  conversationContext: string[];
  addContext: (context: string) => void;
  clearContext: () => void;
  getSystemPrompt: (userInput?: string) => string;
  getEffectiveModel: () => ClaudeModel;
  getModelRationale: () => string;
  isUsingPowerAgent: boolean;
}

const AgentContext = createContext<AgentContextType | null>(null);

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within AgentProvider');
  }
  return context;
}

interface AgentProviderProps {
  children: ReactNode;
}

export function AgentProvider({ children }: AgentProviderProps) {
  const [currentAgent, setCurrentAgent] = useState<AgentPersona>(DEFAULT_AGENT);
  const [currentPowerAgent, setCurrentPowerAgent] = useState<Agent | null>(null);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  
  // Load saved agent from localStorage on mount
  useEffect(() => {
    const savedAgentId = localStorage.getItem('rubber-ducky-current-agent');
    if (savedAgentId) {
      console.log('Restoring agent from localStorage:', savedAgentId);
      const agent = getAgentById(savedAgentId);
      if (agent.id !== DEFAULT_AGENT.id) {
        setCurrentAgent(agent);
        console.log('Successfully restored agent:', agent.name);
      }
    }
  }, []);

  // Save current agent ID to localStorage whenever it changes
  useEffect(() => {
    if (currentAgent.id !== DEFAULT_AGENT.id) {
      localStorage.setItem('rubber-ducky-current-agent', currentAgent.id);
      console.log('Saved current agent to localStorage:', currentAgent.id);
    } else {
      localStorage.removeItem('rubber-ducky-current-agent');
      console.log('Removed current agent from localStorage (using default)');
    }
  }, [currentAgent]);

  // Note: We'll access useModel within the callbacks to avoid hook order issues

  const setAgent = useCallback((agentId: string) => {
    const newAgent = getAgentById(agentId);
    setCurrentAgent(newAgent);
    // Clear power agent when switching to basic agent
    setCurrentPowerAgent(null);
    // Clear context when switching agents
    setConversationContext([]);
  }, []);

  const setPowerAgent = useCallback((agent: Agent | null) => {
    console.log('[DEBUG] AgentContext.setPowerAgent called with:', agent?.name || 'null');
    setCurrentPowerAgent(agent);
    // Clear context when switching agents
    setConversationContext([]);
  }, []);

  const addContext = useCallback((context: string) => {
    setConversationContext(prev => {
      const newContext = [...prev, context];
      // Keep only the last 10 context items to avoid overwhelming the prompt
      return newContext.slice(-10);
    });
  }, []);

  const clearContext = useCallback(() => {
    setConversationContext([]);
  }, []);

  const getSystemPrompt = useCallback((userInput?: string) => {
    let prompt = currentPowerAgent ? currentPowerAgent.prompt : currentAgent.systemPrompt;
    
    // Handle Power Agent template placeholders
    if (currentPowerAgent && userInput) {
      // Replace {{transcript}} with user input for Power agents that expect transcript format
      if (prompt.includes('{{transcript}}')) {
        prompt = prompt.replace(/\{\{transcript\}\}/g, userInput);
      }
      
      // Replace {{userNote}} with user input for agents that expect user notes
      if (prompt.includes('{{userNote}}')) {
        prompt = prompt.replace(/\{\{userNote\}\}/g, userInput);
      }
    }
    
    if (conversationContext.length > 0) {
      prompt += `\n\nConversation context (recent topics and flow):\n${conversationContext.join('\n')}`;
    }
    
    return prompt;
  }, [currentAgent.systemPrompt, currentPowerAgent, conversationContext]);

  const getEffectiveModel = useCallback((): ClaudeModel => {
    // Return power agent's preferred model if available
    if (currentPowerAgent?.preferredModel) {
      return currentPowerAgent.preferredModel;
    }
    
    // Return basic agent's preferred model if available
    if (currentAgent?.preferredModel) {
      return currentAgent.preferredModel;
    }
    
    // Fall back to system default
    return DEFAULT_MODEL;
  }, [currentAgent, currentPowerAgent]);

  const getModelRationale = useCallback((): string => {
    if (currentPowerAgent?.modelJustification) {
      return currentPowerAgent.modelJustification;
    }
    
    if (currentAgent?.modelRationale) {
      return currentAgent.modelRationale;
    }
    
    return 'Using default model for general conversation';
  }, [currentAgent, currentPowerAgent]);

  const isUsingPowerAgent = Boolean(currentPowerAgent);
  
  // Debug logging for power agent state
  useEffect(() => {
    console.log('[DEBUG] AgentContext state update:', {
      currentPowerAgent: currentPowerAgent?.name || 'null',
      isUsingPowerAgent
    });
  }, [currentPowerAgent, isUsingPowerAgent]);

  return (
    <AgentContext.Provider
      value={{
        currentAgent,
        currentPowerAgent,
        setAgent,
        setPowerAgent,
        conversationContext,
        addContext,
        clearContext,
        getSystemPrompt,
        getEffectiveModel,
        getModelRationale,
        isUsingPowerAgent,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}