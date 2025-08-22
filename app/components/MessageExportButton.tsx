'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileText, FileImage, File, ExternalLink, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { loadGoogleServices, isGoogleServicesReady } from '@/lib/googleServices';

interface MessageExportButtonProps {
  messageId: string;
  sessionId: string;
  className?: string;
}

interface ExportState {
  isExporting: boolean;
  exportType: 'pdf' | 'word' | 'text' | null;
  error: string | null;
  success: { type: 'pdf' | 'word' | 'text'; link: string } | null;
}

export default function MessageExportButton({
  messageId,
  sessionId,
  className = ''
}: MessageExportButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    exportType: null,
    error: null,
    success: null
  });
  const [googleServicesReady, setGoogleServicesReady] = useState(false);

  // Load Google services dynamically
  useEffect(() => {
    const initializeGoogleServices = async () => {
      // Check if already ready
      if (isGoogleServicesReady() && 
          !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
          process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
        logger.info('Google services already ready', { component: 'MessageExportButton' });
        setGoogleServicesReady(true);
        return;
      }

      // Skip if demo mode or no client ID
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        logger.info('Skipping Google services - demo mode or no client ID', {
          component: 'MessageExportButton',
          isDemoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
          hasClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        });
        return;
      }

      try {
        logger.info('Starting Google services dynamic load', { 
          component: 'MessageExportButton',
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID 
        });

        const loaded = await loadGoogleServices();
        
        logger.info('Google services load result', {
          component: 'MessageExportButton',
          loaded,
          hasGoogle: !!window.google,
          hasAccounts: !!window.google?.accounts,
          hasOAuth2: !!window.google?.accounts?.oauth2
        });

        setGoogleServicesReady(loaded);
      } catch (error) {
        logger.warn('Failed to load Google services - falling back to local downloads', {
          component: 'MessageExportButton',
          error: error instanceof Error ? error.message : String(error)
        }, error);
        
        // Gracefully degrade to local download mode
        setGoogleServicesReady(false);
        
        console.log('📥 Google Drive integration disabled - using local download mode');
      }
    };

    initializeGoogleServices();
  }, []);

  const handleGoogleAuth = async (): Promise<string | null> => {
    try {
      // Check if environment is configured
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable.');
      }

      // Check if Google Identity Services is loaded
      if (typeof window === 'undefined' || !window.google) {
        throw new Error('Google Identity Services not loaded. Please refresh the page and try again.');
      }

      logger.info('Starting Google Drive authentication', {
        component: 'MessageExportButton',
        messageId
      });

      return new Promise((resolve, reject) => {
        // Use Google Identity Services for modern OAuth
        const client = window.google!.accounts.oauth2.initTokenClient({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: (response: { access_token?: string; error?: string }) => {
            if (response.error) {
              logger.error('Google authentication failed', {
                component: 'MessageExportButton',
                messageId,
                error: response.error
              });
              reject(new Error(`Google authentication failed: ${response.error}`));
              return;
            }

            if (response.access_token) {
              logger.info('Google authentication successful', {
                component: 'MessageExportButton',
                messageId
              });
              resolve(response.access_token);
            } else {
              reject(new Error('No access token received from Google'));
            }
          },
        });

        // Request access token
        client.requestAccessToken();
      });
    } catch (error) {
      logger.error('Google authentication setup failed', {
        component: 'MessageExportButton',
        messageId
      }, error);
      return null;
    }
  };

  const handleExport = async (type: 'pdf' | 'word' | 'text') => {
    setExportState({
      isExporting: true,
      exportType: type,
      error: null,
      success: null
    });
    setShowDropdown(false);

    try {
      logger.info('Starting export process', {
        component: 'MessageExportButton',
        messageId,
        sessionId,
        exportType: type,
        hasGoogleClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        hasGoogleIdentityServices: typeof window !== 'undefined' && !!window.google?.accounts?.oauth2,
        windowGoogleAvailable: typeof window !== 'undefined' ? !!window.google : 'undefined window'
      });

      // Check if Google services are ready for use
      if (!googleServicesReady) {
        // Google services not ready - use local download mode
        logger.info('Using local download mode (Google Drive services not ready)', {
          component: 'MessageExportButton',
          messageId,
          googleServicesReady,
          hasGoogleClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          isDemoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
        });

        // Call local export API (without Google Drive upload)
        const endpoint = type === 'pdf' ? '/api/export/pdf-local' : 
                        type === 'word' ? '/api/export/word-local' : 
                        '/api/export/text-local';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId,
            sessionId,
            includeMetadata: true,
            includeTimestamp: true,
            includeBranding: true
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please log in to export messages');
          } else if (response.status === 404) {
            throw new Error('Export feature is not available');
          } else {
            throw new Error(`Export failed with status ${response.status}`);
          }
        }

        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `message-export-${Date.now()}.${type === 'pdf' ? 'pdf' : type === 'word' ? 'docx' : 'txt'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Show success message
        setExportState({
          isExporting: false,
          exportType: null,
          error: null,
          success: {
            type,
            link: '#' // No link for local download
          }
        });

        logger.info('Local export completed successfully', {
          component: 'MessageExportButton',
          messageId,
          exportType: type
        });

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setExportState(prev => ({ ...prev, success: null }));
        }, 3000);

        return;
      }

      // Full Google Drive flow for production
      const accessToken = await handleGoogleAuth();
      if (!accessToken) {
        throw new Error('Failed to authenticate with Google Drive. The authentication was cancelled or failed.');
      }

      // Call export API
      const endpoint = type === 'pdf' ? '/api/export/pdf' : 
                      type === 'word' ? '/api/export/word' : 
                      '/api/export/text';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          sessionId,
          googleAccessToken: accessToken,
          includeMetadata: true,
          includeTimestamp: true,
          includeBranding: true
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to export messages');
        } else if (response.status === 404) {
          throw new Error('Export feature is not available');
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Export failed with status ${response.status}`);
        }
      }

      const result = await response.json();
      
      setExportState({
        isExporting: false,
        exportType: null,
        error: null,
        success: {
          type,
          link: result.data.webViewLink
        }
      });

      logger.info('Export completed successfully', {
        component: 'MessageExportButton',
        messageId,
        exportType: type,
        fileId: result.data.fileId
      });

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setExportState(prev => ({ ...prev, success: null }));
      }, 3000);

    } catch (error) {
      logger.error('Export failed', {
        component: 'MessageExportButton',
        messageId,
        exportType: type
      }, error);

      setExportState({
        isExporting: false,
        exportType: null,
        error: error instanceof Error ? error.message : 'Export failed',
        success: null
      });

      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setExportState(prev => ({ ...prev, error: null }));
      }, 5000);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Export Button */}
      <button
        data-testid="export-button"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={exportState.isExporting}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export message to Google Drive"
      >
        {exportState.isExporting ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">Export</span>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && !exportState.isExporting && (
        <div 
          data-testid="export-menu"
          className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl shadow-2xl shadow-blue-500/20 z-[60] min-w-52 animate-in slide-in-from-top-2 duration-200 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-3 px-2 flex items-center gap-2">
              <Download className="w-3 h-3" />
              {googleServicesReady ? 'Export to Google Drive' : 'Export & Download'}
            </div>
            
            <button
              data-testid="export-pdf"
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-700 transition-colors duration-200 mb-2"
            >
              <FileImage className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <div>Export as PDF</div>
                <div className="text-xs text-red-500/70">Portable document format</div>
              </div>
            </button>
            
            <button
              data-testid="export-word"
              onClick={() => handleExport('word')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-200 mb-2"
            >
              <FileText className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <div>Export as Word</div>
                <div className="text-xs text-blue-500/70">Microsoft Word document</div>
              </div>
            </button>
            
            <button
              data-testid="export-text"
              onClick={() => handleExport('text')}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300 hover:border-green-300 dark:hover:border-green-700 transition-colors duration-200"
            >
              <File className="w-5 h-5 text-green-500" />
              <div className="text-left">
                <div>Export as Text</div>
                <div className="text-xs text-green-500/70">Plain text file</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {exportState.isExporting && (
        <div className="absolute right-0 top-full mt-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 z-[65] min-w-64 pointer-events-none">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Loader className="w-4 h-4 animate-spin" />
            <span>
              Exporting {exportState.exportType?.toUpperCase()}...
            </span>
          </div>
        </div>
      )}

      {exportState.success && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 z-[65] min-w-64 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>
              {exportState.success.type.toUpperCase()} exported successfully!
            </span>
          </div>
          {exportState.success.link !== '#' ? (
            <a
              href={exportState.success.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open in Google Drive</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Download className="w-3 h-3 text-green-600" />
              <span>Downloaded to your device</span>
            </div>
          )}
        </div>
      )}

      {exportState.error && (
        <div className="absolute right-0 top-full mt-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 z-[65] min-w-64 pointer-events-none">
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4" />
            <span>{exportState.error}</span>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}