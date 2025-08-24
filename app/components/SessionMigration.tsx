'use client';

import { useState } from 'react';
import { Database, AlertCircle, CheckCircle, Clock, RefreshCw, Trash2, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface MigrationPreview {
  totalCliSessions: number;
  migratable: number;
  alreadyMigrated: number;
  preview: Array<{
    name: string;
    agentNames: string[];
    updatedAt: string;
    iterationCount: number;
    alreadyMigrated: boolean;
  }>;
}

interface MigrationResult {
  success: boolean;
  dryRun: boolean;
  summary: {
    sessionsProcessed: number;
    sessionsMigrated: number;
    sessionsSkipped: number;
    errorCount: number;
  };
  details: Array<{
    name: string;
    status: 'migrated' | 'skipped' | 'error';
    reason?: string;
    messageCount?: number;
    iterationCount?: number;
  }>;
  errors?: string[];
}

interface SessionMigrationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function SessionMigration({ isOpen, onClose, onComplete }: SessionMigrationProps) {
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'preview' | 'confirm' | 'migrating' | 'complete'>('preview');
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<Set<string>>(new Set());
  const { isDark } = useTheme();

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/migrate-sessions');
      if (response.ok) {
        const data = await response.json();
        setPreview(data);
        setStep('confirm');
      } else {
        throw new Error('Failed to load preview');
      }
    } catch (error) {
      console.error('Failed to load migration preview:', error);
      alert('Failed to load migration preview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeMigration = async (dryRun = false) => {
    if (selectedSessions.size === 0) {
      alert('Please select at least one session to migrate.');
      return;
    }

    setIsLoading(true);
    setStep('migrating');

    try {
      const response = await fetch('/api/migrate-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun,
          selectedSessions: Array.from(selectedSessions)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setStep('complete');
        if (!dryRun && onComplete) {
          onComplete();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Migration failed');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      alert(`Migration failed: ${error}`);
      setStep('confirm');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSessionSelection = (sessionName: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionName)) {
        newSet.delete(sessionName);
      } else {
        newSet.add(sessionName);
      }
      return newSet;
    });
  };

  const selectAllSessions = () => {
    if (!preview) return;
    const migratable = preview.preview.filter(s => !s.alreadyMigrated);
    setSelectedSessions(new Set(migratable.map(s => s.name)));
  };

  const clearAllSelections = () => {
    setSelectedSessions(new Set());
  };

  const deleteCliSession = async (sessionName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${sessionName}"?`)) {
      return;
    }

    setIsDeleting(prev => new Set([...prev, sessionName]));

    try {
      const response = await fetch('/api/migrate-sessions/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionName }),
      });

      if (response.ok) {
        // Refresh the preview
        await loadPreview();
        // Remove from selected if it was selected
        setSelectedSessions(prev => {
          const newSet = new Set(prev);
          newSet.delete(sessionName);
          return newSet;
        });
      } else {
        throw new Error('Failed to delete session');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setIsDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionName);
        return newSet;
      });
    }
  };

  const handleClose = () => {
    setPreview(null);
    setResult(null);
    setSelectedSessions(new Set());
    setIsDeleting(new Set());
    setStep('preview');
    onClose();
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
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative flex h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            backgroundColor: isDark ? 'var(--bg-primary)' : 'white',
            borderColor: 'var(--border-primary)'
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-6 py-4"
            style={{
              borderColor: 'var(--border-primary)',
              backgroundColor: isDark ? 'var(--bg-secondary)' : 'var(--bg-secondary)'
            }}
          >
            <div className="flex items-center gap-3">
              <Database style={{ width: '24px', height: '24px', color: 'var(--accent-primary)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                CLI Session Migration
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 transition-colors"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[70vh] p-6">
            {/* Step 1: Preview/Loading */}
            {step === 'preview' && (
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <Database
                    style={{
                      width: '64px',
                      height: '64px',
                      color: 'var(--accent-primary)',
                      margin: '0 auto'
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Migrate CLI Sessions
                    </h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      This will import your existing rubber-ducky-node CLI sessions into the web UI,
                      making them accessible through the session browser.
                    </p>
                  </div>
                </div>

                <button
                  onClick={loadPreview}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white'
                  }}
                >
                  {isLoading && <RefreshCw className="animate-spin" style={{ width: '16px', height: '16px' }} />}
                  {isLoading ? 'Scanning...' : 'Scan for Sessions'}
                </button>
              </div>
            )}

            {/* Step 2: Confirm Migration */}
            {step === 'confirm' && preview && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {preview.totalCliSessions}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      CLI Sessions Found
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedSessions.size} / {preview.migratable}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Selected to Migrate
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-2xl font-bold text-blue-600">
                      {preview.alreadyMigrated}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Already Migrated
                    </div>
                  </div>
                </div>

                {preview.migratable > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Select Sessions to Migrate:
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllSessions}
                          className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white'
                          }}
                        >
                          Select All
                        </button>
                        <button
                          onClick={clearAllSelections}
                          className="px-3 py-1 rounded-lg text-sm font-medium transition-colors border"
                          style={{
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            borderColor: 'var(--border-primary)'
                          }}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {preview.preview
                        .filter(s => !s.alreadyMigrated)
                        .map((session) => {
                          const isSelected = selectedSessions.has(session.name);
                          const isBeingDeleted = isDeleting.has(session.name);
                          return (
                            <div
                              key={session.name}
                              className="flex items-center gap-3 p-3 rounded-lg border transition-colors"
                              style={{
                                backgroundColor: isSelected ? 'var(--bg-quaternary)' : 'var(--bg-tertiary)',
                                borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-primary)',
                                opacity: isBeingDeleted ? 0.5 : 1
                              }}
                            >
                              <button
                                onClick={() => toggleSessionSelection(session.name)}
                                disabled={isBeingDeleted}
                                className="flex items-center justify-center w-5 h-5 rounded border-2 transition-colors"
                                style={{
                                  borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-secondary)',
                                  backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent'
                                }}
                              >
                                {isSelected && <Check style={{ width: '12px', height: '12px', color: 'white' }} />}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {session.name}
                                </div>
                                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                                  {session.iterationCount} iterations • {session.agentNames.join(', ')}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                  {new Date(session.updatedAt).toLocaleDateString()}
                                </div>
                                <button
                                  onClick={() => deleteCliSession(session.name)}
                                  disabled={isBeingDeleted}
                                  className="p-1 rounded transition-colors"
                                  style={{
                                    color: 'var(--status-error)',
                                    backgroundColor: 'transparent'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="Delete session permanently"
                                >
                                  {isBeingDeleted ? (
                                    <RefreshCw className="animate-spin" style={{ width: '14px', height: '14px' }} />
                                  ) : (
                                    <Trash2 style={{ width: '14px', height: '14px' }} />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => executeMigration(true)}
                        className="px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          border: `1px solid var(--border-primary)`
                        }}
                      >
                        Dry Run
                      </button>
                      <button
                        onClick={() => executeMigration(false)}
                        disabled={selectedSessions.size === 0}
                        className="px-6 py-2 rounded-lg font-medium transition-colors"
                        style={{
                          backgroundColor: selectedSessions.size === 0 ? 'var(--bg-quaternary)' : 'var(--accent-primary)',
                          color: selectedSessions.size === 0 ? 'var(--text-quaternary)' : 'white',
                          opacity: selectedSessions.size === 0 ? 0.5 : 1
                        }}
                      >
                        Migrate {selectedSessions.size} Session{selectedSessions.size !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                )}

                {preview.migratable === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle
                      style={{
                        width: '48px',
                        height: '48px',
                        color: 'var(--status-success)',
                        margin: '0 auto 16px'
                      }}
                    />
                    <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                      All sessions already migrated!
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Your CLI sessions are already accessible in the web UI.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Migrating */}
            {step === 'migrating' && (
              <div className="text-center space-y-6">
                <Clock
                  className="animate-spin"
                  style={{
                    width: '64px',
                    height: '64px',
                    color: 'var(--accent-primary)',
                    margin: '0 auto'
                  }}
                />
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Migrating Sessions...
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Please wait while we migrate your CLI sessions to the web UI.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && result && (
              <div className="space-y-6">
                <div className="text-center">
                  {result.success ? (
                    <CheckCircle
                      style={{
                        width: '64px',
                        height: '64px',
                        color: 'var(--status-success)',
                        margin: '0 auto 16px'
                      }}
                    />
                  ) : (
                    <AlertCircle
                      style={{
                        width: '64px',
                        height: '64px',
                        color: 'var(--status-error)',
                        margin: '0 auto 16px'
                      }}
                    />
                  )}
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {result.dryRun ? 'Dry Run Complete' : 'Migration Complete'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-xl font-bold text-green-600">
                      {result.summary.sessionsMigrated}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {result.dryRun ? 'Would Migrate' : 'Migrated'}
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-xl font-bold text-blue-600">
                      {result.summary.sessionsSkipped}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Skipped
                    </div>
                  </div>
                </div>

                {result.summary.errorCount > 0 && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                    <div className="font-medium text-red-600 mb-2">
                      {result.summary.errorCount} errors occurred
                    </div>
                    {result.errors && (
                      <div className="text-sm text-red-700 space-y-1">
                        {result.errors.slice(0, 5).map((error, i) => (
                          <div key={i}>• {error}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'white'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}