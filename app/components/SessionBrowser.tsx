'use client';

import { useState, useEffect } from 'react';
import { History, Search, Calendar, MessageCircle, Archive, Trash2, X, Eye } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useTheme } from '@/contexts/ThemeContext';

interface SessionBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

export default function SessionBrowser({ isOpen, onClose, onSelectSession }: SessionBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const { sessions, loadSessions, deleteSession, currentSession } = useSession();
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

            {/* Archive Toggle */}
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
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-6">
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
                        : 'var(--border-primary)',
                      borderWidth: currentSession?.sessionId === session.sessionId ? '2px' : '1px'
                    }}
                  >
                    <div className="flex items-start justify-between">
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
    </div>
  );
}