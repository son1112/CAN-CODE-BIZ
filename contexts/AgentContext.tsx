'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AgentPersona, DEFAULT_AGENT, getAgentById } from '@/lib/agents';
import { Agent } from '@/hooks/useAgents';

interface AgentContextType {
  currentAgent: AgentPersona;
  currentPowerAgent: Agent | null;
  setAgent: (agentId: string) => void;
  setPowerAgent: (agent: Agent | null) => void;
  conversationContext: string[];
  addContext: (context: string) => void;
  clearContext: () => void;
  getSystemPrompt: (userInput?: string) => string;
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

  const setAgent = useCallback((agentId: string) => {
    const newAgent = getAgentById(agentId);
    setCurrentAgent(newAgent);
    // Clear power agent when switching to basic agent
    setCurrentPowerAgent(null);
    // Clear context when switching agents
    setConversationContext([]);
  }, []);

  const setPowerAgent = useCallback((agent: Agent | null) => {
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

  const isUsingPowerAgent = Boolean(currentPowerAgent);

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
        isUsingPowerAgent,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}