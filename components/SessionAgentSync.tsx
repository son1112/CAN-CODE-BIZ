'use client';

import { useEffect } from 'react';
import { useAgent } from '@/contexts/AgentContext';
import { useSession } from '@/contexts/SessionContext';

export function SessionAgentSync({ children }: { children: React.ReactNode }) {
  const { setAgent } = useAgent();
  const { currentSession } = useSession();

  // Restore agent when session changes
  useEffect(() => {
    if (currentSession?.lastAgentUsed) {
      console.log('Restoring agent from session:', currentSession.lastAgentUsed);
      setAgent(currentSession.lastAgentUsed);
    }
  }, [currentSession, setAgent]);

  return <>{children}</>;
}