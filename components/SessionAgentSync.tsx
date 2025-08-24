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
    if (currentSessionId && currentSessionId !== lastRestoredSessionId.current) {
      // Prefer primaryAgent over lastAgentUsed for better UX
      const agentToRestore = currentSession?.primaryAgent || currentSession?.lastAgentUsed;

      // Enhanced logging to debug the issue
      console.log('🔍 SessionAgentSync Debug:', {
        sessionId: currentSessionId,
        primaryAgent: currentSession?.primaryAgent,
        lastAgentUsed: currentSession?.lastAgentUsed,
        agentToRestore,
        sessionName: currentSession?.name,
        powerAgentsLoaded: powerAgents.length,
        powerAgentNames: powerAgents.map(a => a.name)
      });

      if (agentToRestore) {
        logger.debug('Attempting to restore agent from session', {
          component: 'SessionAgentSync',
          sessionId: currentSessionId || undefined,
          primaryAgent: currentSession?.primaryAgent,
          lastAgentUsed: currentSession?.lastAgentUsed,
          agentToRestore
        });

        // Check if it's a power agent (with or without prefix)
        if (agentToRestore.startsWith('power-agent:')) {
          const powerAgentName = agentToRestore.replace('power-agent:', '');
          console.log('🎯 Restoring power agent with prefix:', { powerAgentName, agentToRestore });

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
          // Check if it's actually a power agent without prefix
          const possiblePowerAgent = powerAgents.find(a => a.name === agentToRestore);
          if (possiblePowerAgent) {
            console.log('🎯 Found power agent without prefix:', { agentName: agentToRestore, agent: possiblePowerAgent });

            logger.info('Restoring power agent (no prefix)', {
              component: 'SessionAgentSync',
              powerAgentName: agentToRestore,
              sessionId: currentSessionId || undefined
            });
            setPowerAgent(possiblePowerAgent);
            lastRestoredSessionId.current = currentSessionId;
          } else {
            // It's a basic agent - restore immediately
            console.log('🎯 Restoring basic agent:', agentToRestore);

            logger.info('Restoring basic agent', {
              component: 'SessionAgentSync',
              agentName: agentToRestore,
              sessionId: currentSessionId || undefined
            });
            setAgent(agentToRestore);
            lastRestoredSessionId.current = currentSessionId;
          }
          setPendingPowerAgent(null);
        }
      }
    }
  }, [currentSessionId, currentSession?.lastAgentUsed, currentSession?.primaryAgent, setAgent, setPowerAgent, powerAgents]);

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