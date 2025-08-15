'use client';

import { useState, useEffect } from 'react';
import { History, Search, Calendar, MessageCircle, Archive, Trash2, X, Eye, Database, Check, Square, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useTheme } from '@/contexts/ThemeContext';
import SessionMigration from './SessionMigration';

interface SessionBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

export default function SessionBrowser({ isOpen, onClose, onSelectSession }: SessionBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isMigrationOpen, setIsMigrationOpen] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const { sessions, loadSessions, deleteSession, reimportSession, currentSession } = useSession();
  const { isDark } = useTheme();

  // Load sessions when component opens
  useEffect(() => {
    if (isOpen) {
      loadSessions(1, searchTerm, selectedTags);
    }
  }, [isOpen, searchTerm, selectedTags, loadSessions]);

  // Get unique tags from all sessions
  const allTags = Array.from(new Set(sessions.flatMap(session => session.tags || [])));

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleSessionSelect = (sessionId: string) => {
    onSelectSession(sessionId);
    onClose();
  };

  const handleDeleteSession = async (sessionId: string, permanent = false) => {
    const success = await deleteSession(sessionId, permanent);
    if (success) {
      // Reload sessions after deletion
      loadSessions(1, searchTerm, selectedTags);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleMigrationComplete = () => {
    // Reload sessions after migration
    loadSessions(1, searchTerm, selectedTags);
  };

  const handleReimportSession = async (sessionId: string) => {
    const confirmed = confirm('Are you sure you want to re-import this session? This will update the messages with enhanced parsing.');
    
    if (!confirmed) return;

    const success = await reimportSession(sessionId);
    if (success) {
      // Reload sessions after re-import
      loadSessions(1, searchTerm, selectedTags);
    }
  };

  // Check if a session has CLI iterations (was migrated from CLI)
  const hasCliIterations = (session: any) => {
    return session.tags?.includes('cli-migrated') || 
           session.tags?.includes('rubber-ducky-node') ||
           (session.iterationCount && session.iterationCount > 0);
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const selectAllSessions = () => {
    setSelectedSessions(new Set(sessions.map(s => s.sessionId)));
  };

  const clearAllSelections = () => {
    setSelectedSessions(new Set());
    setShowBulkActions(false);
  };

  const handleBulkDelete = async (permanent = false) => {
    if (selectedSessions.size === 0) return;
    
    const action = permanent ? 'permanently delete' : 'archive';
    const confirmed = confirm(`Are you sure you want to ${action} ${selectedSessions.size} session(s)?`);
    
    if (!confirmed) return;

    const promises = Array.from(selectedSessions).map(sessionId => 
      deleteSession(sessionId, permanent)
    );
    
    await Promise.all(promises);
    clearAllSelections();
    loadSessions(1, searchTerm, selectedTags);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative flex h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-4xl h-[80vh] rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            backgroundColor: isDark ? 'var(--bg-primary)' : 'white',
            borderColor: 'var(--border-primary)'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between border-b"
            style={{
              padding: '20px 24px',
              borderColor: 'var(--border-primary)',
              backgroundColor: isDark ? 'var(--bg-secondary)' : 'var(--bg-secondary)'
            }}
          >
            <div className="flex items-center gap-3">
              <History style={{ width: '24px', height: '24px', color: 'var(--accent-primary)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Session History
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Search and Filters */}
          <div 
            className="border-b"
            style={{
              padding: '16px 24px',
              borderColor: 'var(--border-primary)',
              backgroundColor: isDark ? 'var(--bg-primary)' : 'white'
            }}
          >
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  width: '16px', 
                  height: '16px',
                  color: 'var(--text-tertiary)'
                }} 
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sessions..."
                className="w-full rounded-lg border pl-10 pr-4 py-2 transition-colors focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                  focusRingColor: 'var(--accent-primary)'
                }}
              />
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Filter by tags:
                </p>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1 rounded-full text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: selectedTags.includes(tag) 
                          ? 'var(--accent-primary)' 
                          : isDark ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                        color: selectedTags.includes(tag) 
                          ? 'white' 
                          : 'var(--text-secondary)',
                        border: `1px solid ${selectedTags.includes(tag) ? 'var(--accent-primary)' : 'var(--border-primary)'}`
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: showArchived ? 'var(--accent-primary)' : 'transparent',
                    color: showArchived ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${showArchived ? 'var(--accent-primary)' : 'var(--border-primary)'}`
                  }}
                >
                  <Archive style={{ width: '14px', height: '14px' }} />
                  Show Archived
                </button>
                
                {sessions.length > 0 && (
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: showBulkActions ? 'var(--bg-quaternary)' : 'transparent',
                      color: 'var(--text-secondary)',
                      border: `1px solid var(--border-primary)`
                    }}
                    title="Bulk actions"
                  >
                    <MoreHorizontal style={{ width: '14px', height: '14px' }} />
                    Bulk Actions
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsMigrationOpen(true)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: `1px solid var(--border-primary)`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                }}
                title="Import CLI sessions"
              >
                <Database style={{ width: '14px', height: '14px' }} />
                Import CLI Sessions
              </button>
            </div>
            
            {/* Bulk Actions Bar */}
            {showBulkActions && (
              <div className="mt-4 p-3 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderColor: 'var(--border-primary)' 
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {selectedSessions.size} session{selectedSessions.size !== 1 ? 's' : ''} selected
                    </span>
                    {selectedSessions.size > 0 && (
                      <button
                        onClick={clearAllSelections}
                        className="text-sm px-2 py-1 rounded transition-colors"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllSessions}
                      className="px-3 py-1 rounded text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white'
                      }}
                    >
                      Select All
                    </button>
                    {selectedSessions.size > 0 && (
                      <>
                        <button
                          onClick={() => handleBulkDelete(false)}
                          className="px-3 py-1 rounded text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: 'var(--status-warning)',
                            color: 'white'
                          }}
                        >
                          Archive Selected
                        </button>
                        <button
                          onClick={() => handleBulkDelete(true)}
                          className="px-3 py-1 rounded text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: 'var(--status-error)',
                            color: 'white'
                          }}
                        >
                          Delete Selected
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32" style={{ maxHeight: 'calc(80vh - 200px)' }}>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <History style={{ width: '48px', height: '48px', color: 'var(--text-quaternary)', marginBottom: '16px' }} />
                <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  No sessions found
                </p>
                <p style={{ color: 'var(--text-tertiary)' }}>
                  Start a conversation to create your first session
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="rounded-lg border p-4 transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor: currentSession?.sessionId === session.sessionId 
                        ? isDark ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'
                        : isDark ? 'var(--bg-secondary)' : 'white',
                      borderColor: currentSession?.sessionId === session.sessionId 
                        ? 'var(--accent-primary)' 
                        : selectedSessions.has(session.sessionId) && showBulkActions
                        ? 'var(--accent-primary)'
                        : 'var(--border-primary)',
                      borderWidth: currentSession?.sessionId === session.sessionId || (selectedSessions.has(session.sessionId) && showBulkActions) ? '2px' : '1px'
                    }}
                  >
                    <div className="flex items-start justify-between">
                      {showBulkActions && (
                        <button
                          onClick={() => toggleSessionSelection(session.sessionId)}
                          className="flex items-center justify-center w-5 h-5 rounded border-2 transition-colors mr-3 mt-1"
                          style={{
                            borderColor: selectedSessions.has(session.sessionId) ? 'var(--accent-primary)' : 'var(--border-secondary)',
                            backgroundColor: selectedSessions.has(session.sessionId) ? 'var(--accent-primary)' : 'transparent'
                          }}
                        >
                          {selectedSessions.has(session.sessionId) && <Check style={{ width: '12px', height: '12px', color: 'white' }} />}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 
                            className="font-semibold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {session.name}
                          </h3>
                          {currentSession?.sessionId === session.sessionId && (
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: 'var(--accent-primary)',
                                color: 'white'
                              }}
                            >
                              Current
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>
                          <div className="flex items-center gap-1">
                            <Calendar style={{ width: '14px', height: '14px' }} />
                            {formatDate(session.lastAccessedAt || session.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle style={{ width: '14px', height: '14px' }} />
                            {session.messageCount || 0} messages
                          </div>
                        </div>

                        {session.lastMessage && (
                          <p 
                            className="text-sm truncate mb-2"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {session.lastMessage}
                          </p>
                        )}

                        {session.tags && session.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {session.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 rounded-full text-xs"
                                style={{
                                  backgroundColor: isDark ? 'var(--bg-quaternary)' : 'var(--bg-tertiary)',
                                  color: 'var(--text-tertiary)'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleSessionSelect(session.sessionId)}
                          className="p-2 rounded-lg transition-colors"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white'
                          }}
                          title="Open session"
                        >
                          <Eye style={{ width: '16px', height: '16px' }} />
                        </button>
                        {hasCliIterations(session) && (
                          <button
                            onClick={() => handleReimportSession(session.sessionId)}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                              backgroundColor: 'transparent',
                              color: 'var(--accent-secondary)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Re-import with enhanced parsing"
                          >
                            <RefreshCw style={{ width: '16px', height: '16px' }} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSession(session.sessionId, false)}
                          className="p-2 rounded-lg transition-colors"
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--status-warning)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Archive session"
                        >
                          <Archive style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.sessionId, true)}
                          className="p-2 rounded-lg transition-colors"
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--status-error)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Delete session permanently"
                        >
                          <Trash2 style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Migration Modal */}
      <SessionMigration
        isOpen={isMigrationOpen}
        onClose={() => setIsMigrationOpen(false)}
        onComplete={handleMigrationComplete}
      />
    </div>
  );
}