'use client';

import React from 'react';
import { MessageCircle, Clock, Zap, Activity, Hash, Check, X } from 'lucide-react';
import StarButton from './StarButton';
import AgentSelector from './AgentSelector';
import PrimaryAgentSelector from './PrimaryAgentSelector';

interface SessionHeaderProps {
  currentSession: any;
  filteredMessages: any[];
  isEditingSessionName: boolean;
  editingSessionName: string;
  activeTagFilter: string[];
  isDark: boolean;
  isStreaming: boolean;
  formatSessionTitle: (title: string) => string;
  getAgentDisplayName: (agentId: string) => string;
  setEditingSessionName: (name: string) => void;
  setIsEditingSessionName: (editing: boolean) => void;
  setActiveTagFilter: (filter: string[]) => void;
  renameSession: (sessionId: string, name: string) => Promise<boolean>;
  loadSession: (sessionId: string) => Promise<void>;
}

export default function SessionHeader({
  currentSession,
  filteredMessages,
  isEditingSessionName,
  editingSessionName,
  activeTagFilter,
  isDark,
  isStreaming,
  formatSessionTitle,
  getAgentDisplayName,
  setEditingSessionName,
  setIsEditingSessionName,
  setActiveTagFilter,
  renameSession,
  loadSession
}: SessionHeaderProps) {
  if (!currentSession || filteredMessages.length === 0) {
    return null;
  }

  return (
    <div
      className="sticky top-0 z-10 border-b backdrop-blur-md px-4 sm:px-6 py-4"
      style={{
        backgroundColor: isDark ? 'rgba(13, 13, 13, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        boxShadow: 'var(--shadow-lg)',
        borderImage: 'linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(234, 179, 8, 0.3), rgba(16, 185, 129, 0.3)) 1'
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Session Title & Metadata Row */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
              {isEditingSessionName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editingSessionName}
                    onChange={(e) => setEditingSessionName(e.target.value)}
                    className="text-lg sm:text-xl font-bold px-3 py-1 rounded-lg border flex-1 min-w-0"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                    autoFocus
                    onBlur={() => setIsEditingSessionName(false)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        if (editingSessionName.trim()) {
                          const success = await renameSession(currentSession.sessionId, editingSessionName.trim());
                          if (success) {
                            setIsEditingSessionName(false);
                            setEditingSessionName('');
                          }
                        }
                      }
                      if (e.key === 'Escape') {
                        setIsEditingSessionName(false);
                        setEditingSessionName('');
                      }
                    }}
                  />
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={async () => {
                        if (editingSessionName.trim()) {
                          const success = await renameSession(currentSession.sessionId, editingSessionName.trim());
                          if (success) {
                            setIsEditingSessionName(false);
                            setEditingSessionName('');
                          }
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors touch-target"
                      title="Save"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingSessionName(false);
                        setEditingSessionName('');
                      }}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors touch-target"
                      title="Cancel"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1
                    className="text-lg sm:text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity truncate"
                    style={{
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em'
                    }}
                    onClick={() => {
                      setEditingSessionName(currentSession.name);
                      setIsEditingSessionName(true);
                    }}
                    title="Click to rename session"
                  >
                    {formatSessionTitle(currentSession.name)}
                  </h1>
                  
                  {/* Session Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {/* Session Star/Favorite Button */}
                    <StarButton
                      userId={currentSession.userId || 'demo-user'}
                      itemType="session"
                      itemId={currentSession.sessionId}
                      context={{
                        sessionId: currentSession.sessionId,
                        title: formatSessionTitle(currentSession.name),
                        description: `Session with ${filteredMessages.length} messages`
                      }}
                      size="sm"
                      onStarChange={async (isStarred) => {
                        try {
                          const response = await fetch(`/api/sessions/${currentSession.sessionId}/favorite`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isFavorite: isStarred })
                          });
                          if (!response.ok) throw new Error('Failed to update favorite');
                          
                          // Refresh session data to reflect the change
                          await loadSession(currentSession.sessionId);
                        } catch (error) {
                          console.error('Failed to toggle session favorite:', error);
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          
            {/* Session Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
              {/* Creation Date */}
              {currentSession.createdAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {new Date(currentSession.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: new Date(currentSession.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              
              {/* Agent Used */}
              {currentSession.lastAgentUsed && (
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {getAgentDisplayName(currentSession.lastAgentUsed)}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Session Metrics & Controls */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-6">
            
            {/* Current Session Metrics */}
            <div className="flex items-center gap-4 text-sm">
              {/* Message Count */}
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {filteredMessages.length}
                </span>
              </div>
              
              {/* Session Duration */}
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {(() => {
                    if (!currentSession.createdAt) return 'Active';
                    const duration = Date.now() - new Date(currentSession.createdAt).getTime();
                    const hours = Math.floor(duration / (1000 * 60 * 60));
                    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                    if (hours > 0) return `${hours}h ${minutes}m`;
                    if (minutes > 0) return `${minutes}m`;
                    return 'Just started';
                  })()}
                </span>
              </div>
              
              {/* Session Status */}
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{
                    backgroundColor: isStreaming ? 'var(--status-warning)' : 'var(--status-success)'
                  }}
                />
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {isStreaming ? 'Active' : 'Ready'}
                </span>
              </div>
            </div>
            
            {/* Session Controls */}
            <div className="flex items-center gap-3">
              {/* Agent Selector */}
              <div data-onboarding="agent-selector">
                <AgentSelector />
              </div>
              
              {/* Primary Agent Selector */}
              {currentSession && (
                <div className="lg:max-w-xs">
                  <PrimaryAgentSelector
                    sessionId={currentSession.sessionId}
                    currentPrimaryAgent={currentSession.primaryAgent}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Tag Filter Indicator */}
      {activeTagFilter.length > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <Hash style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Filtering by: {activeTagFilter.join(', ')}
          </span>
          <button
            onClick={() => setActiveTagFilter([])}
            className="text-xs px-2 py-1 rounded transition-colors"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-tertiary)'
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}