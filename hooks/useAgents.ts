import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Agent {
  name: string;
  description: string;
  prompt: string;
}

interface UseAgentsReturn {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  selectedAgent: Agent | null;
  loadAgents: () => Promise<void>;
  selectAgent: (agent: Agent | null) => void;
  processWithAgent: (agentName: string, content: string) => Promise<string>;
}

export function useAgents(): UseAgentsReturn {
  const { data: session, status } = useSession();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load agents from the API
  const loadAgents = useCallback(async () => {
    if (status === 'loading' || !session?.user?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/agents');
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required');
          return;
        }
        throw new Error('Failed to load agents');
      }

      const data = await response.json();
      setAgents(data.agents || []);
      
      // If we have agents but no selected agent, select the first one
      if (data.agents.length > 0 && !selectedAgent) {
        setSelectedAgent(data.agents[0]);
      }
    } catch (err: any) {
      console.error('Error loading agents:', err);
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  // Load agents when session is ready
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Select an agent
  const selectAgent = useCallback((agent: Agent | null) => {
    setSelectedAgent(agent);
  }, []);

  // Process content with a specific agent
  const processWithAgent = useCallback(async (agentName: string, content: string): Promise<string> => {
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'process',
          agentName,
          transcript: content
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process with agent');
      }

      const data = await response.json();
      return data.result || 'No response received';
    } catch (err: any) {
      console.error('Error processing with agent:', err);
      throw new Error(err.message || 'Failed to process with agent');
    }
  }, [session]);

  return {
    agents,
    loading,
    error,
    selectedAgent,
    loadAgents,
    selectAgent,
    processWithAgent,
  };
}