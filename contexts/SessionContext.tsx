'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SessionDocument, SessionMessage } from '@/models/Session';

export interface SessionContextType {
  // Current session state
  currentSession: SessionDocument | null;
  currentSessionId: string | null;
  
  // Session management
  createSession: (name?: string, tags?: string[]) => Promise<SessionDocument>;
  loadSession: (sessionId: string) => Promise<SessionDocument | null>;
  updateSession: (sessionId: string, updates: Partial<SessionDocument>) => Promise<boolean>;
  renameSession: (sessionId: string, name: string) => Promise<boolean>;
  deleteSession: (sessionId: string, permanent?: boolean) => Promise<boolean>;
  reimportSession: (sessionId: string) => Promise<boolean>;
  clearCurrentSession: () => void;
  
  // Message management
  addMessage: (message: Omit<SessionMessage, 'id' | 'timestamp'>) => Promise<boolean>;
  updateMessageTags: (messageId: string, tags: string[]) => Promise<boolean>;
  messages: SessionMessage[];
  
  // Session list management
  sessions: SessionDocument[];
  loadSessions: (page?: number, search?: string, tags?: string[]) => Promise<void>;
  refreshSessions: () => Promise<void>;
  
  // UI state
  isLoading: boolean;
  isLoadingSession: boolean;
  isProcessingMessage: boolean;
  error: string | null;
  
  // Auto-session management
  autoCreateSession: boolean;
  setAutoCreateSession: (enabled: boolean) => void;
  
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<SessionDocument | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionDocument[]>([]);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoCreateSession, setAutoCreateSession] = useState(true);

  // Auto-create session when first message is sent if none exists
  const ensureSession = async (): Promise<string | null> => {
    if (currentSessionId) return currentSessionId;
    
    if (!autoCreateSession) return null;
    
    try {
      const session = await createSession();
      return session.sessionId;
    } catch (err) {
      console.error('Failed to auto-create session:', err);
      return null;
    }
  };

  const createSession = async (name?: string, tags: string[] = []): Promise<SessionDocument> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, tags }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const { session } = await response.json();
      
      // Load the full session data
      const fullSession = await loadSession(session.sessionId);
      if (fullSession) {
        setCurrentSession(fullSession);
        setCurrentSessionId(fullSession.sessionId);
        setMessages(fullSession.messages || []);
        await refreshSessions();
        return fullSession;
      }
      
      throw new Error('Failed to load created session');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string): Promise<SessionDocument | null> => {
    setIsLoadingSession(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Session not found');
          return null;
        }
        throw new Error('Failed to load session');
      }

      const { session } = await response.json();
      setCurrentSession(session);
      setCurrentSessionId(session.sessionId);
      setMessages(session.messages || []);
      
      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoadingSession(false);
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<SessionDocument>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update session');
      }

      const { session } = await response.json();
      
      // Update current session if it's the one being updated
      if (currentSessionId === sessionId) {
        setCurrentSession(session);
      }
      
      await refreshSessions();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const renameSession = async (sessionId: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename session');
      }

      const { session: updatedSession } = await response.json();
      
      // Update current session if it's the one being renamed
      if (currentSessionId === sessionId && currentSession) {
        setCurrentSession({
          ...currentSession,
          name: updatedSession.name,
          updatedAt: updatedSession.updatedAt
        });
      }
      
      await refreshSessions();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename session';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string, permanent = false): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}?permanent=${permanent}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete session');
      }

      // Clear current session if it's the one being deleted
      if (currentSessionId === sessionId) {
        setCurrentSession(null);
        setCurrentSessionId(null);
        setMessages([]);
      }
      
      await refreshSessions();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reimportSession = async (sessionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/reimport`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to re-import session');
      }

      const { session: updatedSession } = await response.json();
      
      // Update current session if it's the one being re-imported
      if (currentSessionId === sessionId && currentSession) {
        // Reload the session to get the updated messages
        await loadSession(sessionId);
      }
      
      await refreshSessions();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to re-import session';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCurrentSession = () => {
    setCurrentSession(null);
    setCurrentSessionId(null);
    setMessages([]);
    // Note: localStorage will be cleared automatically by the useEffect
  };

  const addMessage = async (message: Omit<SessionMessage, 'id' | 'timestamp'>): Promise<boolean> => {
    // Ensure we have a session
    const sessionId = await ensureSession();
    if (!sessionId) {
      setError('No active session');
      return false;
    }

    setIsProcessingMessage(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add message');
      }

      const { message: newMessage } = await response.json();
      
      // Update local messages array
      setMessages(prev => [...prev, newMessage]);
      
      // Update current session's last accessed time
      if (currentSession) {
        setCurrentSession({
          ...currentSession,
          lastAccessedAt: new Date(),
          messages: [...messages, newMessage]
        });
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add message';
      setError(errorMessage);
      return false;
    } finally {
      setIsProcessingMessage(false);
    }
  };

  const updateMessageTags = async (messageId: string, tags: string[]): Promise<boolean> => {
    setError(null);
    
    try {
      const response = await fetch(`/api/sessions/messages/${messageId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update message tags');
      }
      
      // Update local messages array
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, tags } : msg
      ));
      
      // Update current session messages if available
      if (currentSession) {
        const updatedMessages = currentSession.messages.map(msg => 
          msg.id === messageId ? { ...msg, tags } : msg
        );
        setCurrentSession({
          ...currentSession,
          messages: updatedMessages
        });
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update message tags';
      setError(errorMessage);
      return false;
    }
  };

  const loadSessions = useCallback(async (page = 1, search = '', tags: string[] = []): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        tags: tags.join(',')
      });

      const response = await fetch(`/api/sessions?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const { sessions: sessionList } = await response.json();
      setSessions(sessionList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSessions = useCallback(async (): Promise<void> => {
    await loadSessions();
  }, [loadSessions]);

  // Load current session from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('rubber-ducky-current-session');
    if (savedSessionId) {
      console.log('Restoring session from localStorage:', savedSessionId);
      loadSession(savedSessionId).then((session) => {
        if (session) {
          console.log('Successfully restored session:', session.name);
        } else {
          console.log('Failed to restore session, clearing localStorage');
          localStorage.removeItem('rubber-ducky-current-session');
        }
      }).catch((error) => {
        console.error('Error restoring session:', error);
        localStorage.removeItem('rubber-ducky-current-session');
      });
    }
    loadSessions();
  }, [loadSessions]);

  // Save current session ID to localStorage whenever it changes
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('rubber-ducky-current-session', currentSessionId);
      console.log('Saved current session to localStorage:', currentSessionId);
    } else {
      localStorage.removeItem('rubber-ducky-current-session');
      console.log('Removed current session from localStorage');
    }
  }, [currentSessionId]);

  const value: SessionContextType = {
    // Current session state
    currentSession,
    currentSessionId,
    
    // Session management
    createSession,
    loadSession,
    updateSession,
    renameSession,
    deleteSession,
    reimportSession,
    clearCurrentSession,
    
    // Message management
    addMessage,
    updateMessageTags,
    messages,
    
    // Session list management
    sessions,
    loadSessions,
    refreshSessions,
    
    // UI state
    isLoading,
    isLoadingSession,
    isProcessingMessage,
    error,
    
    // Auto-session management
    autoCreateSession,
    setAutoCreateSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}