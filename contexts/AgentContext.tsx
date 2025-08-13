'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AgentPersona, DEFAULT_AGENT, getAgentById } from '@/lib/agents';

interface AgentContextType {
  currentAgent: AgentPersona;
  setAgent: (agentId: string) => void;
  conversationContext: string[];
  addContext: (context: string) => void;
  clearContext: () => void;
  getSystemPrompt: () => string;
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
  const [conversationContext, setConversationContext] = useState<string[]>([]);

  const setAgent = useCallback((agentId: string) => {
    const newAgent = getAgentById(agentId);
    setCurrentAgent(newAgent);
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

  const getSystemPrompt = useCallback(() => {
    let prompt = currentAgent.systemPrompt;
    
    if (conversationContext.length > 0) {
      prompt += `\n\nConversation context (recent topics and flow):\n${conversationContext.join('\n')}`;
    }
    
    return prompt;
  }, [currentAgent.systemPrompt, conversationContext]);

  return (
    <AgentContext.Provider
      value={{
        currentAgent,
        setAgent,
        conversationContext,
        addContext,
        clearContext,
        getSystemPrompt,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}