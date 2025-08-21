'use client';

import { useState, useEffect } from 'react';
import { History, Search, Calendar, MessageCircle, Archive, Trash2, X, Eye, Database, Check, MoreHorizontal, RefreshCw, Heart, FileText, Copy } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SessionOperationIndicator } from './LoadingIndicator';
import SessionMigration from './SessionMigration';
import StarButton from './StarButton';
import { useAuth } from '@/hooks/useAuth';

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
  const [isProcessingOperation, setIsProcessingOperation] = useState(false);
  
  // Enhanced filtering states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [messageCountFilter, setMessageCountFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showTemplatesOnly, setShowTemplatesOnly] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateDialog, setShowTemplateDialog] = useState<string | null>(null);
  const { sessions, loadSessions, deleteSession, reimportSession, currentSession } = useSession();
  const { isDark } = useTheme();
  const { userId } = useAuth();

  // Load sessions when component opens
  useEffect(() => {
    if (isOpen) {
      loadSessions(1, searchTerm, selectedTags);
    }
  }, [isOpen, searchTerm, selectedTags, loadSessions]);

  // Get unique tags from all sessions
  const allTags = Array.from(new Set((sessions || []).flatMap(session => session.tags || [])));
  
  // Get unique agents from all sessions
  const allAgents = Array.from(new Set((sessions || [])
    .filter(session => session.lastAgentUsed)
    .map(session => session.lastAgentUsed)
  )).filter(Boolean);

  // Apply enhanced filtering to sessions
  const filteredSessions = (sessions || []).filter(session => {
    // Apply existing filters
    if (!showArchived && session.isArchived) return false;
    
    // Text search filter
    if (searchTerm && !session.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Tag filter
    if (selectedTags.length > 0 && !selectedTags.some(tag => session.tags?.includes(tag))) {
      return false;
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const sessionDate = new Date(session.lastAccessedAt || session.createdAt);
      const now = new Date();
      const diffTime = now.getTime() - sessionDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          if (diffDays > 1) return false;
          break;
        case 'week':
          if (diffDays > 7) return false;
          break;
        case 'month':
          if (diffDays > 30) return false;
          break;
      }
    }
    
    // Message count filter
    if (messageCountFilter !== 'all') {
      const messageCount = session.messages?.length || 0;
      switch (messageCountFilter) {
        case 'short':
          if (messageCount > 10) return false;
          break;
        case 'medium':
          if (messageCount < 11 || messageCount > 50) return false;
          break;
        case 'long':
          if (messageCount < 51) return false;
          break;
      }
    }
    
    // Agent filter
    if (agentFilter !== 'all' && session.lastAgentUsed !== agentFilter) {
      return false;
    }
    
    // Favorites filter
    if (showFavoritesOnly && !session.isFavorite) {
      return false;
    }
    
    // Templates filter
    if (showTemplatesOnly && !session.isTemplate) {
      return false;
    }
    
    return true;
  });

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
    setIsProcessingOperation(true);
    try {
      const success = await deleteSession(sessionId, permanent);
      if (success) {
        // Reload sessions after deletion
        loadSessions(1, searchTerm, selectedTags);
      }
    } finally {
      setIsProcessingOperation(false);
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

    setIsProcessingOperation(true);
    try {
      const success = await reimportSession(sessionId);
      if (success) {
        // Reload sessions after re-import
        loadSessions(1, searchTerm, selectedTags);
      }
    } finally {
      setIsProcessingOperation(false);
    }
  };

  // Check if a session has CLI iterations (was migrated from CLI)
  const hasCliIterations = (session: { tags?: string[]; iterationCount?: number }) => {
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
    setSelectedSessions(new Set((sessions || []).map(s => s.sessionId)));
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

  const handleBulkExport = async (format: 'pdf' | 'word') => {
    if (selectedSessions.size === 0) return;
    
    const confirmed = confirm(`Export ${selectedSessions.size} session(s) as ${format.toUpperCase()}? This may take a few moments.`);
    if (!confirmed) return;

    setIsProcessingOperation(true);
    
    try {
      // Create a bulk export by generating individual exports for each session
      const sessionIds = Array.from(selectedSessions);
      const exportPromises = sessionIds.map(async (sessionId) => {
        try {
          const response = await fetch(`/api/export/${format}-local`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              sessionId,
              includeAllMessages: true,
              bulkExport: true
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to export session ${sessionId}`);
          }

          const blob = await response.blob();
          const session = sessions?.find(s => s.sessionId === sessionId);
          const filename = `${session?.name || 'session'}-${sessionId.slice(0, 8)}.${format === 'pdf' ? 'pdf' : 'docx'}`;
          
          // Download the file
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          return true;
        } catch (error) {
          console.error(`Failed to export session ${sessionId}:`, error);
          return false;
        }
      });

      const results = await Promise.all(exportPromises);
      const successCount = results.filter(Boolean).length;
      const failureCount = results.length - successCount;
      
      if (successCount > 0) {
        alert(`Successfully exported ${successCount} session(s) as ${format.toUpperCase()}.${failureCount > 0 ? ` ${failureCount} export(s) failed.` : ''}`);
      } else {
        alert('All exports failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Bulk export failed:', error);
      alert('Bulk export failed. Please try again.');
    } finally {
      setIsProcessingOperation(false);
    }
  };

  // Handle create from template
  const handleCreateFromTemplate = async (templateSessionId: string, newSessionName: string) => {
    try {
      const response = await fetch('/api/sessions/from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          templateSessionId, 
          newSessionName
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Refresh sessions to show the new one
        await loadSessions(1, searchTerm, selectedTags);
        
        // Open the new session
        handleSessionSelect(result.session.sessionId);
        
        alert(`New session "${newSessionName}" created from template successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create session from template:', errorData);
        alert(errorData.error || 'Failed to create session from template. Please try again.');
      }
    } catch (error) {
      console.error('Error creating session from template:', error);
      alert('Error creating session from template. Please try again.');
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (sessionId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: !currentValue }),
      });

      if (response.ok) {
        // Refresh sessions to get updated data
        await loadSessions(1, searchTerm, selectedTags);
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Handle template toggle
  const handleToggleTemplate = async (sessionId: string, currentValue: boolean) => {
    if (!currentValue && !templateName.trim()) {
      setShowTemplateDialog(sessionId);
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isTemplate: !currentValue,
          templateName: !currentValue ? templateName.trim() : undefined
        }),
      });

      if (response.ok) {
        setShowTemplateDialog(null);
        setTemplateName('');
        // Refresh sessions to get updated data
        await loadSessions(1, searchTerm, selectedTags);
      } else {
        console.error('Failed to toggle template');
      }
    } catch (error) {
      console.error('Error toggling template:', error);
    }
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
                  color: 'var(--text-primary)'
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

            {/* Advanced Filters */}
            <div className="mb-4">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>Advanced Filters</span>
                <span style={{ 
                  transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}>
                  ▼
                </span>
              </button>
              
              {showAdvancedFilters && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Date Filter */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      Date Range
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                      className="w-full rounded border px-2 py-1 text-sm"
                      style={{
                        backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                  
                  {/* Message Count Filter */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      Message Count
                    </label>
                    <select
                      value={messageCountFilter}
                      onChange={(e) => setMessageCountFilter(e.target.value as 'all' | 'short' | 'medium' | 'long')}
                      className="w-full rounded border px-2 py-1 text-sm"
                      style={{
                        backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="all">Any Length</option>
                      <option value="short">Short (≤10 messages)</option>
                      <option value="medium">Medium (11-50 messages)</option>
                      <option value="long">Long (51+ messages)</option>
                    </select>
                  </div>
                  
                  {/* Agent Filter */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      Last Agent Used
                    </label>
                    <select
                      value={agentFilter}
                      onChange={(e) => setAgentFilter(e.target.value)}
                      className="w-full rounded border px-2 py-1 text-sm"
                      style={{
                        backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="all">All Agents</option>
                      {allAgents.map((agent) => (
                        <option key={agent} value={agent}>
                          {agent}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Favorites and Templates Toggles */}
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFavoritesOnly}
                        onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Favorites Only</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showTemplatesOnly}
                        onChange={(e) => setShowTemplatesOnly(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <FileText className={`w-4 h-4 ${showTemplatesOnly ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Templates Only</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

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
                
                {(sessions?.length || 0) > 0 && (
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
                        <button
                          onClick={() => handleBulkExport('pdf')}
                          disabled={isProcessingOperation}
                          className="px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--accent-secondary)',
                            color: 'white'
                          }}
                        >
                          Export PDF
                        </button>
                        <button
                          onClick={() => handleBulkExport('word')}
                          disabled={isProcessingOperation}
                          className="px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--accent-secondary)',
                            color: 'white'
                          }}
                        >
                          Export Word
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sessions List */}
          <div className="relative flex-1 overflow-y-auto px-6 pt-6 pb-32" style={{ maxHeight: 'calc(80vh - 200px)' }}>
            {/* Loading overlay */}
            {isProcessingOperation && (
              <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(2px)' }}>
                <SessionOperationIndicator operation="Processing..." />
              </div>
            )}
            {(sessions?.length || 0) === 0 ? (
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
                {filteredSessions.map((session) => (
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
                            {(session as unknown as { messageCount?: number }).messageCount || 0} messages
                          </div>
                        </div>

                        {(session as unknown as { lastMessage?: string }).lastMessage && (
                          <p 
                            className="text-sm truncate mb-2"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {(session as unknown as { lastMessage?: string }).lastMessage}
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
                        {userId && (
                          <StarButton
                            userId={userId}
                          itemType="session"
                          itemId={session.sessionId}
                          context={{
                            title: session.name,
                            description: `${(session as unknown as { messageCount?: number }).messageCount || 0} messages • Last accessed ${formatDate(session.lastAccessedAt || session.createdAt)}`,
                            agentId: session.lastAgentUsed,
                          }}
                          size="sm"
                          />
                        )}
                        
                        {/* Favorite Button */}
                        <button
                          onClick={() => handleToggleFavorite(session.sessionId, session.isFavorite || false)}
                          className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                          title={session.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart 
                            className={`w-4 h-4 transition-colors ${
                              session.isFavorite 
                                ? 'text-red-500 fill-red-500' 
                                : 'text-gray-400 hover:text-red-400'
                            }`} 
                          />
                        </button>

                        {/* Template Button */}
                        <button
                          onClick={() => handleToggleTemplate(session.sessionId, session.isTemplate || false)}
                          className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                          title={session.isTemplate ? "Remove template status" : "Make template"}
                        >
                          <FileText 
                            className={`w-4 h-4 transition-colors ${
                              session.isTemplate 
                                ? 'text-blue-500' 
                                : 'text-gray-400 hover:text-blue-400'
                            }`} 
                          />
                        </button>

                        {/* Create from Template Button */}
                        {session.isTemplate && (
                          <button
                            onClick={() => {
                              const newName = prompt('Enter name for new session from template:');
                              if (newName?.trim()) {
                                handleCreateFromTemplate(session.sessionId, newName.trim());
                              }
                            }}
                            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Create session from template"
                          >
                            <Copy className="w-4 h-4 text-gray-400 hover:text-green-400" />
                          </button>
                        )}
                        
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

      {/* Template Name Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] mx-4"
            style={{
              backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
              borderColor: 'var(--border-primary)'
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Create Template
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Enter a name for this template:
            </p>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="w-full p-3 rounded-lg border"
              style={{
                backgroundColor: isDark ? 'var(--bg-tertiary)' : 'white',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && templateName.trim()) {
                  handleToggleTemplate(showTemplateDialog, false);
                }
              }}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTemplateDialog(null);
                  setTemplateName('');
                }}
                className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                style={{
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (templateName.trim()) {
                    handleToggleTemplate(showTemplateDialog, false);
                  }
                }}
                disabled={!templateName.trim()}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: templateName.trim() ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: templateName.trim() ? 'white' : 'var(--text-tertiary)'
                }}
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Migration Modal */}
      <SessionMigration
        isOpen={isMigrationOpen}
        onClose={() => setIsMigrationOpen(false)}
        onComplete={handleMigrationComplete}
      />
    </div>
  );
}