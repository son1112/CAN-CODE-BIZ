'use client';

import { useEffect, useRef, useState } from 'react';
import { useAgent } from '@/contexts/AgentContext';
import { useSession } from '@/contexts/SessionContext';
import { useAgents } from '@/hooks/useAgents';
import { logger } from '@/lib/logger';

export function SessionAgentSync({ children }: { children: React.ReactNode }) {
  const { setAgent, setPowerAgent } = useAgent();
  const { currentSession, currentSessionId } = useSession();
  const { agents: powerAgents, loadAgents } = useAgents();
  const lastRestoredSessionId = useRef<string | null>(null);
  const [pendingPowerAgent, setPendingPowerAgent] = useState<string | null>(null);
  
  // Load power agents on mount and when needed
  useEffect(() => {
    logger.debug('Loading agents', { component: 'SessionAgentSync' });
    loadAgents().then(() => {
      logger.info('Agents loaded successfully', { component: 'SessionAgentSync' });
    }).catch((err) => {
      logger.error('Failed to load agents', { component: 'SessionAgentSync' }, err);
    });
  }, [loadAgents]);

  // Handle session changes and basic agent restoration
  useEffect(() => {
    // Only process if we're switching to a different session
    if (currentSessionId && currentSessionId !== lastRestoredSessionId.current && currentSession?.lastAgentUsed) {
      logger.debug('Attempting to restore agent from session', { 
        component: 'SessionAgentSync', 
        sessionId: currentSessionId || undefined,
        agentUsed: currentSession.lastAgentUsed 
      });
      
      // Check if it's a power agent
      if (currentSession.lastAgentUsed.startsWith('power-agent:')) {
        const powerAgentName = currentSession.lastAgentUsed.replace('power-agent:', '');
        logger.debug('Session uses power agent', { 
          component: 'SessionAgentSync', 
          powerAgentName 
        });
        
        // Store the pending power agent to restore when agents load
        setPendingPowerAgent(powerAgentName);
        
        // Try to restore immediately if agents are already loaded
        if (powerAgents.length > 0) {
          const powerAgent = powerAgents.find(a => a.name === powerAgentName);
          if (powerAgent) {
            logger.info('Restoring power agent immediately', { 
              component: 'SessionAgentSync', 
              powerAgentName,
              sessionId: currentSessionId || undefined 
            });
            setPowerAgent(powerAgent);
            lastRestoredSessionId.current = currentSessionId;
            setPendingPowerAgent(null);
          }
        }
      } else {
        // It's a basic agent - restore immediately
        logger.info('Restoring basic agent', { 
          component: 'SessionAgentSync', 
          agentName: currentSession.lastAgentUsed,
          sessionId: currentSessionId || undefined 
        });
        setAgent(currentSession.lastAgentUsed);
        lastRestoredSessionId.current = currentSessionId;
        setPendingPowerAgent(null);
      }
    }
  }, [currentSessionId, currentSession?.lastAgentUsed, setAgent, setPowerAgent, powerAgents]);

  // Handle power agents loading
  useEffect(() => {
    logger.debug('Power agents check', { 
      component: 'SessionAgentSync', 
      pendingPowerAgent, 
      agentCount: powerAgents.length 
    });
    
    if (pendingPowerAgent && powerAgents.length > 0) {
      logger.debug('Power agents loaded, attempting to restore', { 
        component: 'SessionAgentSync', 
        pendingPowerAgent,
        availableAgents: powerAgents.map(a => a.name) 
      });
      
      const powerAgent = powerAgents.find(a => a.name === pendingPowerAgent);
      if (powerAgent) {
        logger.info('Found and restoring power agent', { 
          component: 'SessionAgentSync', 
          powerAgentName: pendingPowerAgent,
          sessionId: currentSessionId || undefined 
        });
        setPowerAgent(powerAgent);
        lastRestoredSessionId.current = currentSessionId;
        setPendingPowerAgent(null);
      } else {
        logger.warn('Power agent not found in list', { 
          component: 'SessionAgentSync', 
          pendingPowerAgent,
          availableAgents: powerAgents.map(a => a.name) 
        });
        setPendingPowerAgent(null);
      }
    } else if (pendingPowerAgent && powerAgents.length === 0) {
      logger.debug('Waiting for agents to load', { 
        component: 'SessionAgentSync', 
        pendingPowerAgent 
      });
    }
  }, [powerAgents, pendingPowerAgent, setPowerAgent, currentSessionId]);

  return <>{children}</>;
}