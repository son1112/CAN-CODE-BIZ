'use client';

import { useEffect, useRef, useState } from 'react';
import { useAgent } from '@/contexts/AgentContext';
import { useSession } from '@/contexts/SessionContext';
import { useAgents } from '@/hooks/useAgents';

export function SessionAgentSync({ children }: { children: React.ReactNode }) {
  const { setAgent, setPowerAgent } = useAgent();
  const { currentSession, currentSessionId } = useSession();
  const { agents: powerAgents, loadAgents } = useAgents();
  const lastRestoredSessionId = useRef<string | null>(null);
  const [pendingPowerAgent, setPendingPowerAgent] = useState<string | null>(null);
  
  // Load power agents on mount and when needed
  useEffect(() => {
    console.log('Calling loadAgents...');
    loadAgents().then(() => {
      console.log('Agents loaded successfully');
    }).catch((err) => {
      console.error('Failed to load agents:', err);
    });
  }, [loadAgents]);

  // Handle session changes and basic agent restoration
  useEffect(() => {
    // Only process if we're switching to a different session
    if (currentSessionId && currentSessionId !== lastRestoredSessionId.current && currentSession?.lastAgentUsed) {
      console.log('Attempting to restore agent from session:', currentSession.lastAgentUsed);
      
      // Check if it's a power agent
      if (currentSession.lastAgentUsed.startsWith('power-agent:')) {
        const powerAgentName = currentSession.lastAgentUsed.replace('power-agent:', '');
        console.log('Session uses power agent:', powerAgentName);
        
        // Store the pending power agent to restore when agents load
        setPendingPowerAgent(powerAgentName);
        
        // Try to restore immediately if agents are already loaded
        if (powerAgents.length > 0) {
          const powerAgent = powerAgents.find(a => a.name === powerAgentName);
          if (powerAgent) {
            console.log('Restoring power agent immediately:', powerAgentName);
            setPowerAgent(powerAgent);
            lastRestoredSessionId.current = currentSessionId;
            setPendingPowerAgent(null);
          }
        }
      } else {
        // It's a basic agent - restore immediately
        console.log('Restoring basic agent:', currentSession.lastAgentUsed);
        setAgent(currentSession.lastAgentUsed);
        lastRestoredSessionId.current = currentSessionId;
        setPendingPowerAgent(null);
      }
    }
  }, [currentSessionId, currentSession?.lastAgentUsed, setAgent, setPowerAgent, powerAgents]);

  // Handle power agents loading
  useEffect(() => {
    console.log('Power agents check - pending:', pendingPowerAgent, 'agents count:', powerAgents.length);
    if (powerAgents.length > 0) {
      console.log('All agent structures:', JSON.stringify(powerAgents, null, 2));
      console.log('Available power agent names:', powerAgents.map(a => `"${a.name}"`));
      console.log('Pending agent name:', `"${pendingPowerAgent}"`);
    }
    if (pendingPowerAgent && powerAgents.length > 0) {
      console.log('Power agents loaded, attempting to restore:', pendingPowerAgent);
      console.log('Exact name comparison - pending:', `"${pendingPowerAgent}"`, 'type:', typeof pendingPowerAgent);
      powerAgents.forEach((agent, index) => {
        console.log(`Agent ${index}:`, `"${agent.name}"`, 'type:', typeof agent.name, 'matches:', agent.name === pendingPowerAgent);
      });
      const powerAgent = powerAgents.find(a => a.name === pendingPowerAgent);
      if (powerAgent) {
        console.log('Found and restoring power agent:', powerAgent);
        setPowerAgent(powerAgent);
        lastRestoredSessionId.current = currentSessionId;
        setPendingPowerAgent(null);
      } else {
        console.log('Power agent not found in list:', pendingPowerAgent);
        console.log('Available agents:', powerAgents.map(a => a.name));
        setPendingPowerAgent(null);
      }
    } else if (pendingPowerAgent && powerAgents.length === 0) {
      console.log('Waiting for agents to load, pending:', pendingPowerAgent);
    }
  }, [powerAgents, pendingPowerAgent, setPowerAgent, currentSessionId]);

  return <>{children}</>;
}