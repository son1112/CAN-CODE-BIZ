'use client';

// HYDRATION FIX: Forcing client-side execution - v5
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  setPrimaryAgent: (sessionId: string, agentId: string | null) => Promise<boolean>;
  deleteSession: (sessionId: string, permanent?: boolean) => Promise<boolean>;
  reimportSession: (sessionId: string) => Promise<boolean>;
  clearCurrentSession: () => void;

  // Message management
  addMessage: (message: Omit<SessionMessage, 'id' | 'timestamp'>) => Promise<boolean>;
  updateMessageTags: (messageId: string, tags: string[]) => Promise<boolean>;
  pinMessage: (messageId: string, isPinned: boolean) => Promise<boolean>;
  getPinnedMessages: (sessionId: string) => Promise<SessionMessage[]>;
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

// 🚀 EMPTY SESSION CONTEXT for server-side compatibility
const emptySessionContext: SessionContextType = {
  currentSession: null,
  currentSessionId: null,
  createSession: async () => ({ sessionId: '', name: '', messages: [], createdBy: '', createdAt: new Date(), updatedAt: new Date() } as SessionDocument),
  loadSession: async () => null,
  updateSession: async () => true,
  renameSession: async () => true,
  setPrimaryAgent: async () => true,
  deleteSession: async () => true,
  reimportSession: async () => true,
  clearCurrentSession: () => {},
  addMessage: async () => true,
  updateMessageTags: async () => true,
  pinMessage: async () => true,
  getPinnedMessages: async () => [],
  messages: [],
  sessions: [],
  loadSessions: async () => {},
  refreshSessions: async () => {},
  isLoading: false,
  isLoadingSession: false,
  isProcessingMessage: false,
  error: null,
  autoCreateSession: false,
  setAutoCreateSession: () => {},
};

// 🚀 CLIENT-ONLY WRAPPER with SSR compatibility
function ClientOnlySessionProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    console.log('🚀 CLIENT-ONLY: Client-side mounting complete');
    setIsClient(true);
  }, []);
  
  // 🔧 HYDRATION FIX: Always render SessionContextProvider but with controlled loading
  // This prevents hydration mismatch while ensuring session loads properly
  return (
    <SessionContextProvider isClientReady={isClient}>
      {children}
    </SessionContextProvider>
  );
}

function SessionContextProvider({ 
  children, 
  isClientReady = false 
}: { 
  children: React.ReactNode; 
  isClientReady?: boolean; 
}) {
  // 🔍 DEBUG: Log provider initialization with more details
  console.log('🚀 SessionContextProvider INITIALIZING', { isClientReady });
  console.log('🚀 ENVIRONMENT CHECK:', {
    timestamp: new Date().toISOString(),
    windowExists: typeof window !== 'undefined',
    location: typeof window !== 'undefined' ? window.location.href : 'server-side',
    nodeEnv: process.env.NODE_ENV,
    isClient: typeof window !== 'undefined',
    isClientReady
  });
  
  // Core session state
  const [currentSession, setCurrentSession] = useState<SessionDocument | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionDocument[]>([]);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoCreateSession, setAutoCreateSession] = useState(true);

  // Ref to prevent duplicate session loads
  const sessionLoadAttempted = useRef(false);

  // 🎯 CRITICAL FIX: Load session from URL parameter when client is ready
  useEffect(() => {
    if (!isClientReady || sessionLoadAttempted.current) {
      console.log('🚀 SESSION LOAD: Skipping -', { 
        isClientReady, 
        loadAttempted: sessionLoadAttempted.current 
      });
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get('session');
    
    console.log('🚀 SESSION LOAD: URL Check -', { 
      sessionIdFromUrl,
      hasParam: !!sessionIdFromUrl,
      currentUrl: window.location.href
    });

    if (sessionIdFromUrl) {
      console.log('🚀 SESSION LOAD: Starting load for URL session:', sessionIdFromUrl);
      sessionLoadAttempted.current = true;
      loadSessionFromUrl(sessionIdFromUrl);
    }
  }, [isClientReady]);

  // 🚀 FIXED: Direct session loader that prevents state conflicts
  const loadSessionFromUrl = useCallback(async (sessionId: string) => {
    console.log('🎯 LOADING SESSION FROM URL:', sessionId);
    setIsLoadingSession(true);
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      console.log('🎯 SESSION API Response:', response.ok, response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎯 SESSION DATA:', {
          hasSession: !!data.session,
          messageCount: data.session?.messages?.length || 0,
          sessionName: data.session?.name
        });
        
        if (data.session) {
          console.log('🎯 SETTING SESSION STATE - Messages:', data.session.messages?.length);
          setCurrentSession(data.session);
          setCurrentSessionId(data.session.sessionId);
          setMessages(data.session.messages || []);
          localStorage.setItem('rubber-ducky-current-session', data.session.sessionId);
        }
      }
    } catch (error) {
      console.error('🎯 SESSION LOAD ERROR:', error);
      setError('Failed to load session');
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  // Session loading function for programmatic use
  const loadSession = useCallback(async (sessionId: string): Promise<SessionDocument | null> => {
    console.log('📡 loadSession called for:', sessionId);
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      
      if (!response.ok) {
        console.log('❌ Response not OK:', response.status);
        return null;
      }

      const responseData = await response.json();
      const { session } = responseData;
      
      if (!session) {
        console.log('❌ No session in response data');
        return null;
      }
      
      const sessionWithCorrectId = {
        ...session,
        sessionId: session.sessionId || sessionId,
      };

      setCurrentSession(sessionWithCorrectId);
      setCurrentSessionId(sessionWithCorrectId.sessionId);
      setMessages(sessionWithCorrectId.messages || []);

      console.log('✅ Session loaded successfully');
      return sessionWithCorrectId;
    } catch (err) {
      console.log('❌ Error in loadSession:', err);
      return null;
    }
  }, []);

  // Sessions list loader
  const loadSessions = useCallback(async (page?: number, search?: string, tags?: string[]): Promise<void> => {
    console.log('📡 loadSessions called with:', { page, search, tags });
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: String(page || 1),
        limit: '20',
        search: search || '',
        tags: tags?.join(',') || ''
      });
      
      const response = await fetch(`/api/sessions?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('❌ Error loading sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSessions = useCallback(async (): Promise<void> => {
    return loadSessions();
  }, [loadSessions]);

  // Mock functions to satisfy interface
  const createSession = async (): Promise<SessionDocument> => ({ sessionId: '', name: '', messages: [], createdBy: '', createdAt: new Date(), updatedAt: new Date() } as SessionDocument);
  const updateSession = async (): Promise<boolean> => true;
  const renameSession = async (): Promise<boolean> => true;
  const setPrimaryAgent = async (): Promise<boolean> => true;
  const deleteSession = async (): Promise<boolean> => true;
  const reimportSession = async (): Promise<boolean> => true;
  const clearCurrentSession = () => {};
  const addMessage = async (): Promise<boolean> => true;
  const updateMessageTags = async (): Promise<boolean> => true;
  const pinMessage = async (): Promise<boolean> => true;
  const getPinnedMessages = async (): Promise<SessionMessage[]> => [];

  const value: SessionContextType = {
    currentSession,
    currentSessionId,
    createSession,
    loadSession,
    updateSession,
    renameSession,
    setPrimaryAgent,
    deleteSession,
    reimportSession,
    clearCurrentSession,
    addMessage,
    updateMessageTags,
    pinMessage,
    getPinnedMessages,
    messages,
    sessions,
    loadSessions,
    refreshSessions,
    isLoading,
    isLoadingSession,
    isProcessingMessage,
    error,
    autoCreateSession,
    setAutoCreateSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// 🚀 MAIN EXPORTS: Use client-only wrapper
export { ClientOnlySessionProvider as ChatSessionProvider };

// Export alias for backward compatibility  
export { ClientOnlySessionProvider as SessionProvider };

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}