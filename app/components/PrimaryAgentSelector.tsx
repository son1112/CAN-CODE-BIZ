'use client';

import React, { useState } from 'react';
import { Pin, PinOff, Check, X } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useAgent } from '@/contexts/AgentContext';
import { useAgents } from '@/hooks/useAgents';
import { getAgentById } from '@/lib/agents';

interface PrimaryAgentSelectorProps {
  sessionId: string;
  currentPrimaryAgent?: string;
}

export default function PrimaryAgentSelector({ sessionId, currentPrimaryAgent }: PrimaryAgentSelectorProps) {
  const { setPrimaryAgent } = useSession();
  const { currentAgent, currentPowerAgent } = useAgent();
  const { agents: powerAgents } = useAgents();
  const [isEditing, setIsEditing] = useState(false);
  const [pendingAgent, setPendingAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current effective agent ID
  const currentEffectiveAgentId = currentPowerAgent ? `power-agent:${currentPowerAgent.name}` : currentAgent.id;

  // Get display name for an agent ID
  const getAgentDisplayName = (agentId: string | null | undefined) => {
    if (!agentId) return 'None';
    
    if (agentId.startsWith('power-agent:')) {
      const powerAgentName = agentId.replace('power-agent:', '');
      const powerAgent = powerAgents.find(a => a.name === powerAgentName);
      return powerAgent?.name || powerAgentName;
    }
    
    return getAgentById(agentId).name;
  };

  // Get all available agents for selection
  const getAllAgents = () => {
    const basicAgents = [
      { id: 'rubber-ducky', name: 'Rubber Ducky 🦆' },
      { id: 'conversational-assistant', name: 'Conversational Assistant' },
      { id: 'real-estate-advisor', name: 'Real Estate Advisor' },
    ];

    const powerAgentOptions = powerAgents.map(agent => ({
      id: `power-agent:${agent.name}`,
      name: agent.name
    }));

    return [
      { id: null, name: 'None (use last message agent)' },
      ...basicAgents,
      ...powerAgentOptions
    ];
  };

  const handleSavePrimaryAgent = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      await setPrimaryAgent(sessionId, pendingAgent);
      setIsEditing(false);
      setPendingAgent(null);
    } catch (error) {
      console.error('Failed to set primary agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPendingAgent(null);
  };

  const handleSetToCurrent = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      await setPrimaryAgent(sessionId, currentEffectiveAgentId);
    } catch (error) {
      console.error('Failed to set primary agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Pin className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Primary Agent:</span>
        <select
          value={pendingAgent || ''}
          onChange={(e) => setPendingAgent(e.target.value || null)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {getAllAgents().map((agent) => (
            <option key={agent.id || 'none'} value={agent.id || ''}>
              {agent.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSavePrimaryAgent}
          disabled={isLoading}
          className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
          title="Save primary agent"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="p-1 text-red-600 hover:text-red-700"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-2">
        {currentPrimaryAgent ? (
          <Pin className="w-3 h-3" />
        ) : (
          <PinOff className="w-3 h-3" />
        )}
        <span>
          Primary: <span className="font-medium">{getAgentDisplayName(currentPrimaryAgent)}</span>
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        {!currentPrimaryAgent && (
          <button
            onClick={handleSetToCurrent}
            disabled={isLoading}
            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50"
            title={`Set current agent (${getAgentDisplayName(currentEffectiveAgentId)}) as primary`}
          >
            Pin Current
          </button>
        )}
        
        <button
          onClick={() => {
            setPendingAgent(currentPrimaryAgent);
            setIsEditing(true);
          }}
          disabled={isLoading}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          title="Change primary agent"
        >
          Change
        </button>
      </div>
    </div>
  );
}