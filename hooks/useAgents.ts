import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { ClaudeModel } from '@/lib/models';

// Global cache to prevent multiple API calls
const agentsCache = new Map<string, {
  data: Agent[];
  timestamp: number;
  loading: boolean;
}>();

const CACHE_DURATION = 300000; // 5 minutes for agents (they change less frequently than other data)

export interface Agent {
  name: string;
  description: string;
  prompt: string;
  preferredModel?: ClaudeModel;
  modelJustification?: string;
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
  const loadingRef = useRef(false);

  // Load agents from the API
  const loadAgents = useCallback(async () => {
    const isDemoMode = typeof window !== 'undefined' &&
                      window.location.hostname === 'localhost' &&
                      process.env.NODE_ENV === 'development';

    // In demo mode, bypass session check; otherwise require authentication
    if (status === 'loading' || (!isDemoMode && !session?.user?.id) || loadingRef.current) {
      return;
    }

    const cacheKey = 'agents';
    const cached = agentsCache.get(cacheKey);
    const now = Date.now();

    // Use cache if valid and recent
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      setAgents(cached.data);
      setLoading(cached.loading);
      return;
    }

    // If already loading, don't start another request
    if (cached?.loading) {
      setLoading(true);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    // Mark as loading in cache
    agentsCache.set(cacheKey, { data: agents, timestamp: now, loading: true });

    try {
      const response = await fetch('/api/agents');

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required');
          return;
        }
        throw new Error('Failed to load agents');
      }

      const data = await response.json();
      const agentsList = data.agents || [];
      setAgents(agentsList);

      // Update cache with fresh data
      agentsCache.set(cacheKey, {
        data: agentsList,
        timestamp: now,
        loading: false
      });

      // If we have agents but no selected agent, select the first one
      if (agentsList.length > 0) {
        setSelectedAgent(prevSelected => prevSelected || agentsList[0]);
      }
    } catch (err: any) {
      console.error('Error loading agents:', err);
      setError(err.message || 'Failed to load agents');

      // Remove loading flag from cache on error
      if (cached) {
        agentsCache.set(cacheKey, { ...cached, loading: false });
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [agents]);

  // Load agents when session is ready (or in demo mode)
  useEffect(() => {
    const isDemoMode = typeof window !== 'undefined' &&
                      window.location.hostname === 'localhost' &&
                      process.env.NODE_ENV === 'development';

    if (status !== 'loading' && (session?.user?.id || isDemoMode)) {
      loadAgents();
    }
  }, [session?.user?.id, status]); // Remove loadAgents dependency to prevent infinite loop

  // Select an agent
  const selectAgent = useCallback((agent: Agent | null) => {
    setSelectedAgent(agent);
  }, []);

  // Process content with a specific agent
  const processWithAgent = useCallback(async (agentName: string, content: string): Promise<string> => {
    const isDemoMode = typeof window !== 'undefined' &&
                      window.location.hostname === 'localhost' &&
                      process.env.NODE_ENV === 'development';

    if (!isDemoMode && !session?.user?.id) {
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