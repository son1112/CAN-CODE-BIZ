'use client';

import { useRef, useEffect, useState } from 'react';
import { Send, Trash2, Download, MessageCircle, Type, History, ChevronUp, ChevronDown, Edit3, Check, X, Minimize2, Maximize2, Star } from 'lucide-react';
import Image from 'next/image';
import VoiceInput from './VoiceInput';
import AgentSelector from './AgentSelector';
import Logo from './Logo';
import UserMenu from './auth/UserMenu';
import FormattedMessage from './FormattedMessage';
import ThemeToggle from './ThemeToggle';
import ChatMessageModal from './ChatMessageModal';
import ModelSelector from './ModelSelector';
import ScrollNavigation from './ScrollNavigation';
import StarButton from './StarButton';
import StarsBrowser from './StarsBrowser';
import { SessionLoadingIndicator, ChatThinkingIndicator } from './LoadingIndicator';
import { useTheme } from '@/contexts/ThemeContext';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useAgent } from '@/contexts/AgentContext';
import { useDropdown } from '@/contexts/DropdownContext';
import { useConversationManager } from '@/hooks/useConversationManager';
import { useSession } from '@/contexts/SessionContext';
import { useModel } from '@/contexts/ModelContext';
import SessionBrowser from './SessionBrowser';

// Random Gemini Image Component
function RandomGeminiImage() {
  const [selectedImage, setSelectedImage] = useState<string>('');
  
  const geminiImages = [
    '/Gemini_Generated_Image_6xo6qa6xo6qa6xo6.png',
    '/Gemini_Generated_Image_kn11nekn11nekn11.png',
    '/Gemini_Generated_Image_nqfygcnqfygcnqfy.png'
  ];
  
  useEffect(() => {
    // Select a random image on component mount
    const randomIndex = Math.floor(Math.random() * geminiImages.length);
    setSelectedImage(geminiImages[randomIndex]);
  }, []);
  
  if (!selectedImage) return null;
  
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <Image
        src={selectedImage}
        alt="Rubber Ducky AI Companion"
        width={800}
        height={600}
        className="w-full h-auto object-cover rounded-3xl shadow-2xl shadow-black/10"
        style={{
          filter: 'drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.25))',
          maxHeight: '400px'
        }}
        priority
      />
    </div>
  );
}

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [conversationStarter, setConversationStarter] = useState('');
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionBrowserOpen, setIsSessionBrowserOpen] = useState(false);
  const [showUserHistory, setShowUserHistory] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isEditingSessionName, setIsEditingSessionName] = useState(false);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());
  const [isStarsBrowserOpen, setIsStarsBrowserOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { messages, isStreaming, error, sendMessage, clearMessages } = useStreamingChat();
  const { currentAgent, clearContext } = useAgent();
  const { isDropdownOpen } = useDropdown();
  const { shouldAIRespond, isInConversation, startConversation, endConversation } = useConversationManager();
  const { isDark } = useTheme();
  const { currentSession, createSession, loadSession, renameSession, isLoadingSession, isProcessingMessage } = useSession();
  const { currentModel } = useModel();

  // Get text size class based on current setting
  const getTextSizeClass = () => {
    switch (textSize) {
      case 'sm': return 'text-sm';
      case 'base': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-base';
    }
  };

  // Get prose size class for AI responses
  const getProseSize = () => {
    switch (textSize) {
      case 'sm': return 'prose-sm';
      case 'base': return 'prose-base';
      case 'lg': return 'prose-lg';
      case 'xl': return 'prose-xl';
      default: return 'prose-base';
    }
  };

  // Set conversation starter on client side to avoid hydration mismatch
  useEffect(() => {
    if (currentAgent.conversationStarters && currentAgent.conversationStarters.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentAgent.conversationStarters.length);
      setConversationStarter(currentAgent.conversationStarters[randomIndex]);
    }
  }, [currentAgent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isStreaming) {
      await sendMessage(inputValue);
      setInputValue('');
      setCurrentTranscript('');
    }
  };

  const handleVoiceTranscript = async (transcript: string) => {
    console.log('ChatInterface: Voice transcript received:', transcript);
    console.log('ChatInterface: isStreaming:', isStreaming);
    console.log('ChatInterface: isContinuousMode:', isContinuousMode);
    
    // Update current transcript for display
    setCurrentTranscript(transcript);
    
    if (transcript.trim() && !isStreaming) {
      console.log('ChatInterface: Sending voice message to Claude...');
      await sendMessage(transcript);
      
      // Clear transcript after sending
      setCurrentTranscript('');
      
      // In continuous mode, determine if AI should respond based on conversation context
      if (isContinuousMode && isInConversation) {
        const shouldRespond = shouldAIRespond(transcript, messages);
        console.log('ChatInterface: Should AI respond?', shouldRespond);
        // The AI response is already triggered by sendMessage, so we don't need to do anything extra
      }
    } else {
      console.log('ChatInterface: NOT sending voice message - empty transcript or streaming in progress');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  const handleClearMessages = async () => {
    clearMessages();
    clearContext();
    if (isContinuousMode) {
      endConversation();
    }
    // Show new session modal to allow naming
    setShowNewSessionModal(true);
  };

  const handleCreateNewSession = async () => {
    try {
      const sessionName = newSessionName.trim() || undefined;
      await createSession(sessionName);
      setShowNewSessionModal(false);
      setNewSessionName('');
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  const toggleContinuousMode = () => {
    if (isContinuousMode) {
      setIsContinuousMode(false);
      endConversation();
    } else {
      setIsContinuousMode(true);
      startConversation();
    }
  };

  const handleMessageClick = (message: any) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      await loadSession(sessionId);
      // Clear any streaming state when switching sessions
      clearMessages();
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const toggleMessageCollapse = (messageId: string) => {
    setCollapsedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const expandAllMessages = () => {
    setCollapsedMessages(new Set());
  };

  const collapseAllMessages = () => {
    const allMessageIds = new Set(messages.map(msg => msg.id));
    setCollapsedMessages(allMessageIds);
  };

  const exportChat = () => {
    const sessionName = currentSession?.name || 'Untitled Session';
    const chatContent = [
      `Session: ${sessionName}`,
      `Agent: ${currentAgent.name}`,
      `Created: ${currentSession?.createdAt ? new Date(currentSession.createdAt).toLocaleString() : 'Unknown'}`,
      `Messages: ${messages.length}`,
      '',
      ...messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    ].join('\\n\\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${sessionName.toLowerCase().replace(/\\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="flex flex-col h-screen relative overflow-hidden bg-primary"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)'
          : 'linear-gradient(135deg, #fafafa 0%, #f0f9ff 50%, #e0f2fe 100%)'
      }}
    >
      {/* Modern Background Elements */}
      <div 
        className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)'
        }}
      ></div>
      <div 
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)'
        }}
      ></div>
      
      {/* Modern Header */}
      <div 
        className="relative flex items-center justify-between backdrop-blur-xl border-b scale-locked-header" 
        style={{ 
          padding: '12px 20px', 
          position: 'relative', 
          zIndex: 100, 
          width: '100%',
          backgroundColor: isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div className="flex items-center" style={{ gap: '20px' }}>
          <Logo 
            size="md" 
            onClick={() => window.location.reload()}
          />
          
          {/* Session Name Display/Edit */}
          {currentSession && (
            <div className="flex items-center gap-2">
              {isEditingSessionName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingSessionName}
                    onChange={(e) => setEditingSessionName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        if (editingSessionName.trim()) {
                          const success = await renameSession(currentSession.sessionId, editingSessionName.trim());
                          if (success) {
                            setIsEditingSessionName(false);
                            setEditingSessionName('');
                          }
                        }
                      } else if (e.key === 'Escape') {
                        setIsEditingSessionName(false);
                        setEditingSessionName('');
                      }
                    }}
                    autoFocus
                    className="px-2 py-1 rounded text-sm border"
                    style={{
                      backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)',
                      minWidth: '150px'
                    }}
                    placeholder="Session name..."
                  />
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
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--status-success)' }}
                    title="Save name"
                  >
                    <Check style={{ width: '14px', height: '14px' }} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingSessionName(false);
                      setEditingSessionName('');
                    }}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="Cancel"
                  >
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium truncate max-w-xs cursor-pointer hover:underline"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={() => {
                      setEditingSessionName(currentSession.name);
                      setIsEditingSessionName(true);
                    }}
                    title="Click to rename session"
                  >
                    {currentSession.name}
                  </span>
                  <button
                    onClick={() => {
                      setEditingSessionName(currentSession.name);
                      setIsEditingSessionName(true);
                    }}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="Rename session"
                  >
                    <Edit3 style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              )}
            </div>
          )}
          
          <AgentSelector />
        </div>
        <div className="flex items-center" style={{ gap: '12px' }}>
          {isContinuousMode && (
            <div 
              className="flex items-center rounded-full font-semibold backdrop-blur-sm border mr-2" 
              style={{ 
                gap: '6px', 
                padding: '6px 12px', 
                fontSize: '11px',
                backgroundColor: 'var(--accent-primary)',
                borderColor: 'var(--accent-secondary)',
                color: 'white',
                whiteSpace: 'nowrap'
              }}
            >
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
              </div>
              Live Mode Active
            </div>
          )}
          
          {/* User Menu */}
          <UserMenu />
          
          {/* Model Selector */}
          <ModelSelector size="sm" />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Session History */}
          <button
            onClick={() => setIsSessionBrowserOpen(true)}
            className="rounded-lg transition-all duration-300"
            style={{ 
              padding: '6px',
              color: 'var(--text-secondary)',
              border: '1px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            title="Session History"
          >
            <History style={{ width: '16px', height: '16px' }} />
          </button>
          
          {/* Stars Browser */}
          <button
            onClick={() => setIsStarsBrowserOpen(true)}
            className="rounded-lg transition-all duration-300"
            style={{ 
              padding: '6px',
              color: 'var(--text-secondary)',
              border: '1px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            title="Starred Items"
          >
            <Star style={{ width: '16px', height: '16px' }} />
          </button>
          
          <button
            onClick={toggleContinuousMode}
            className="rounded-lg transition-all duration-300"
            style={{ 
              padding: '6px',
              backgroundColor: isContinuousMode ? 'var(--accent-primary)' : 'transparent',
              color: isContinuousMode ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${isContinuousMode ? 'var(--accent-primary)' : 'transparent'}`,
              boxShadow: isContinuousMode ? 'var(--shadow-md)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (!isContinuousMode) {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isContinuousMode) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
            title={isContinuousMode ? 'Disable continuous conversation' : 'Enable continuous conversation'}
          >
            <MessageCircle style={{ width: '16px', height: '16px' }} />
          </button>
          <div className="relative">
            <button
              onClick={() => {
                const sizes: Array<'sm' | 'base' | 'lg' | 'xl'> = ['sm', 'base', 'lg', 'xl'];
                const currentIndex = sizes.indexOf(textSize);
                const nextIndex = (currentIndex + 1) % sizes.length;
                setTextSize(sizes[nextIndex]);
              }}
              className="rounded-lg transition-all duration-300"
              style={{ 
                padding: '6px',
                color: 'var(--text-secondary)',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              title={`Text size: ${textSize.toUpperCase()}`}
            >
              <Type style={{ width: '16px', height: '16px' }} />
              <span 
                className="absolute rounded-full flex items-center justify-center font-bold" 
                style={{ 
                  top: '-2px', 
                  right: '-2px', 
                  fontSize: '10px', 
                  width: '16px', 
                  height: '16px',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white'
                }}
              >
                {textSize === 'sm' ? 'S' : textSize === 'base' ? 'M' : textSize === 'lg' ? 'L' : 'XL'}
              </span>
            </button>
          </div>
          <button
            onClick={exportChat}
            disabled={messages.length === 0}
            className="rounded-lg transition-all duration-300"
            style={{ 
              padding: '6px',
              color: messages.length === 0 ? 'var(--text-quaternary)' : 'var(--text-secondary)',
              border: '1px solid transparent',
              opacity: messages.length === 0 ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (messages.length > 0) {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (messages.length > 0) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
            title="Export chat"
          >
            <Download style={{ width: '16px', height: '16px' }} />
          </button>
          {/* Collapse/Expand All Messages */}
          {messages.length > 0 && (
            <>
              <button
                onClick={expandAllMessages}
                disabled={collapsedMessages.size === 0}
                className="rounded-lg transition-all duration-300"
                style={{ 
                  padding: '6px',
                  color: collapsedMessages.size === 0 ? 'var(--text-quaternary)' : 'var(--text-secondary)',
                  border: '1px solid transparent',
                  opacity: collapsedMessages.size === 0 ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (collapsedMessages.size > 0) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (collapsedMessages.size > 0) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
                title="Expand all messages"
              >
                <Maximize2 style={{ width: '16px', height: '16px' }} />
              </button>
              <button
                onClick={collapseAllMessages}
                disabled={messages.length === 0}
                className="rounded-lg transition-all duration-300"
                style={{ 
                  padding: '6px',
                  color: messages.length === 0 ? 'var(--text-quaternary)' : 'var(--text-secondary)',
                  border: '1px solid transparent',
                  opacity: messages.length === 0 ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (messages.length > 0) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (messages.length > 0) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
                title="Collapse all messages"
              >
                <Minimize2 style={{ width: '16px', height: '16px' }} />
              </button>
            </>
          )}
          <button
            onClick={handleClearMessages}
            disabled={messages.length === 0}
            className="rounded-lg transition-all duration-300"
            style={{ 
              padding: '6px',
              color: messages.length === 0 ? 'var(--text-quaternary)' : 'var(--status-error)',
              border: '1px solid transparent',
              opacity: messages.length === 0 ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (messages.length > 0) {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'var(--status-error)';
              }
            }}
            onMouseLeave={(e) => {
              if (messages.length > 0) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
            title="Clear chat"
          >
            <Trash2 style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* Modern Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {isLoadingSession ? (
          /* Session Loading State */
          <div className={`relative flex-1 flex items-center justify-center p-12 ${isDropdownOpen ? 'pointer-events-none' : ''}`}>
            <SessionLoadingIndicator />
          </div>
        ) : messages.length === 0 ? (
          /* Premium Empty State */
          <div className={`relative flex-1 flex items-center justify-center p-12 ${isDropdownOpen ? 'pointer-events-none' : ''}`}>
            <div className="relative max-w-2xl text-center space-y-12">
              {/* Agent Introduction */}
              <div className="space-y-8">
                <div className="flex justify-center">
                  <RandomGeminiImage />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                    Hi! I&apos;m your Rubber Ducky
                  </h2>
                  <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto font-medium">
                    I&apos;m here to help you think out loud, solve problems, and have friendly conversations. Just like the classic rubber duck debugging technique!
                  </p>
                </div>
              </div>
              
              {conversationStarter && (
                <div className="relative bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-2xl shadow-black/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-3xl"></div>
                  <div className="relative">
                    <div className="flex items-start gap-6">
                      <Logo size="md" variant="minimal" showText={false} />
                      <div className="text-left space-y-3">
                        <p className="text-gray-700 font-semibold text-base">Let&apos;s chat about:</p>
                        <p className="text-gray-800 text-lg leading-relaxed font-medium italic">
                          &ldquo;{conversationStarter}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentAgent.keyTopics && currentAgent.keyTopics.length > 0 && (
                <div className="space-y-6">
                  <p className="text-2xl font-bold text-gray-800">What we can explore together:</p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {currentAgent.keyTopics.map((topic) => (
                      <span
                        key={topic}
                        className="px-6 py-3 bg-gradient-to-br from-white to-blue-50 hover:from-yellow-50 hover:to-amber-50 border border-blue-200 hover:border-yellow-300 text-blue-800 hover:text-yellow-800 rounded-2xl text-base font-semibold transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg transform hover:-translate-y-1"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center space-y-8">
                <p className="text-xl text-gray-600 font-medium">
                  🎙️ Ready to chat? Use your voice or type a message below!
                </p>
                
                {isContinuousMode && (
                  <div className="inline-flex items-center gap-6 px-8 py-4 bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-100 border-2 border-yellow-300/50 rounded-2xl shadow-lg shadow-yellow-500/10 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"></div>
                        <div className="absolute inset-0 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                      </div>
                      <span className="text-2xl filter drop-shadow-sm animate-pulse">🦆</span>
                    </div>
                    <div className="text-left space-y-2">
                      <span className="text-blue-800 font-bold text-lg">Rubber Ducky Live!</span>
                      <span className="text-blue-700 text-sm font-medium">I&apos;m listening and ready to help you think</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* AI-Focused Chat Interface */
          <div className="relative flex-1 flex flex-col">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-8 space-y-8">
              {messages
                .filter(message => message.role === 'assistant')
                .map((message, index, aiMessages) => {
                  const isCurrentlyStreaming = isStreaming && index === aiMessages.length - 1;
                  
                  return (
                    <div key={message.id} className="group">
                      {/* Full-width AI Response */}
                      <div className="w-full">
                        <div className="flex items-start gap-6">
                          {/* AI Avatar */}
                          <div 
                            className="rounded-full flex items-center justify-center flex-shrink-0 relative shadow-lg transform transition-transform duration-300 group-hover:scale-110"
                            style={{
                              width: '64px',
                              height: '64px',
                              background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 50%, #f97316 100%)',
                              boxShadow: '0 10px 15px -3px rgba(234, 179, 8, 0.3)'
                            }}
                          >
                            <Image
                              src="/rubber-duck-avatar.png"
                              alt="Rubber Ducky"
                              width={56}
                              height={56}
                              className="object-cover scale-125 rounded-full"
                              style={{ objectPosition: 'center center' }}
                              priority
                            />
                          </div>
                          
                          {/* Full-width AI Message */}
                          <div 
                            className="flex-1 relative shadow-xl backdrop-blur-sm transition-all duration-300 group-hover:shadow-2xl rounded-[2rem]"
                            style={{ 
                              padding: '2rem 3rem',
                              border: '4px solid #eab308',
                              boxShadow: '0 25px 50px -12px rgba(234, 179, 8, 0.2)',
                              backgroundColor: isDark ? 'var(--bg-secondary)' : 'white'
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 rounded-[2rem]"></div>
                            
                            {/* Message Header with Collapse Button */}
                            <div className="relative flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                  {new Date(message.timestamp || new Date()).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </span>
                                {isCurrentlyStreaming && (
                                  <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-sm"></span>
                                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Responding...</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <StarButton
                                    userId="demo-user" // TODO: Replace with actual user ID from auth
                                    itemType="message"
                                    itemId={message.id}
                                    context={{
                                      sessionId: currentSession?.sessionId,
                                      messageContent: message.content,
                                      agentId: message.agentUsed || currentAgent.id,
                                      title: `Message from ${new Date(message.timestamp || new Date()).toLocaleDateString()}`,
                                    }}
                                    size="sm"
                                  />
                                </div>
                                <button
                                  onClick={() => handleMessageClick(message)}
                                  className="p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                  style={{ color: 'var(--text-tertiary)' }}
                                  title="Expand message"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <Maximize2 style={{ width: '14px', height: '14px' }} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMessageCollapse(message.id);
                                  }}
                                  className="p-1 rounded-lg transition-colors"
                                  style={{ color: 'var(--text-secondary)' }}
                                  title={collapsedMessages.has(message.id) ? "Expand message" : "Collapse message"}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  {collapsedMessages.has(message.id) ? 
                                    <Maximize2 style={{ width: '14px', height: '14px' }} /> : 
                                    <Minimize2 style={{ width: '14px', height: '14px' }} />
                                  }
                                </button>
                              </div>
                            </div>
                            
                            {/* Message Content */}
                            <div className="relative">
                              {collapsedMessages.has(message.id) ? (
                                /* Collapsed View */
                                <div className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>
                                  Message collapsed • Click expand to view
                                </div>
                              ) : (
                                /* Full Content */
                                <>
                                  <FormattedMessage 
                                    content={message.content || (isCurrentlyStreaming ? '' : '')}
                                    textSizeClass={getTextSizeClass()}
                                    expandedView={true}
                                  />
                                  {isCurrentlyStreaming && (
                                    <div className="flex items-center gap-1 mt-4">
                                      <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }}></div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {/* Show thinking bubble when processing a message */}
              {isProcessingMessage && (
                <div className="group">
                  {/* Thinking bubble that matches AI response style */}
                  <div className="w-full">
                    <div className="flex items-start gap-6">
                      {/* AI Avatar */}
                      <div 
                        className="rounded-full flex items-center justify-center flex-shrink-0 relative shadow-lg"
                        style={{
                          width: '64px',
                          height: '64px',
                          background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 50%, #f97316 100%)',
                          boxShadow: '0 10px 15px -3px rgba(234, 179, 8, 0.3)'
                        }}
                      >
                        <Image
                          src="/rubber-duck-avatar.png"
                          alt="Rubber Ducky"
                          width={56}
                          height={56}
                          className="object-cover scale-125 rounded-full"
                          style={{ objectPosition: 'center center' }}
                          priority
                        />
                      </div>
                      
                      {/* Thinking bubble */}
                      <div 
                        className="flex-1 relative shadow-xl backdrop-blur-sm rounded-[2rem] animate-pulse"
                        style={{ 
                          padding: '2rem 3rem',
                          border: '4px solid #eab308',
                          boxShadow: '0 25px 50px -12px rgba(234, 179, 8, 0.2)',
                          backgroundColor: isDark ? 'var(--bg-secondary)' : 'white'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 rounded-[2rem]"></div>
                        
                        {/* Thinking content */}
                        <div className="relative flex items-center justify-center py-4">
                          <div className="flex items-center space-x-3">
                            {/* Rubber Ducky icon with gentle bounce */}
                            <div className="relative">
                              <div 
                                className="text-2xl animate-bounce"
                                style={{ 
                                  animationDuration: '2s',
                                  animationIterationCount: 'infinite'
                                }}
                              >
                                🦆
                              </div>
                              {/* Thinking bubbles */}
                              <div className="absolute -top-1 -right-1">
                                <div className="flex space-x-0.5">
                                  {[0, 1, 2].map((i) => (
                                    <div
                                      key={i}
                                      className="w-1 h-1 rounded-full animate-pulse"
                                      style={{
                                        backgroundColor: 'var(--accent-primary)',
                                        animationDelay: `${i * 0.3}s`,
                                        animationDuration: '1.5s'
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {/* Thinking text with animated dots */}
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Rubber Ducky is thinking
                              </span>
                              <div className="flex items-center space-x-1">
                                {[0, 1, 2].map((i) => (
                                  <div
                                    key={i}
                                    className="w-2 h-2 rounded-full animate-pulse"
                                    style={{
                                      backgroundColor: 'var(--text-tertiary)',
                                      animationDelay: `${i * 0.4}s`,
                                      animationDuration: '1.6s'
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-xl text-red-800 shadow-sm shadow-red-500/10 backdrop-blur-sm" style={{ margin: '0 12px 6px 12px', padding: '8px', fontSize: '12px' }}>
          <div className="flex items-center" style={{ gap: '6px' }}>
            <div className="bg-red-500 rounded-full flex-shrink-0 animate-pulse shadow-sm" style={{ width: '6px', height: '6px' }} />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Enhanced Footer with User Input History */}
      <div 
        className="relative border-t backdrop-blur-xl shadow-2xl scale-locked-footer" 
        style={{ 
          padding: '12px 16px', 
          position: 'relative', 
          zIndex: 100, 
          width: '100%',
          backgroundColor: isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <div className="absolute inset-0" style={{ background: isDark ? 'linear-gradient(to top, rgba(13, 13, 13, 0.1), transparent)' : 'linear-gradient(to top, rgba(59, 130, 246, 0.05), transparent)' }}></div>
        <div className="relative max-w-6xl mx-auto space-y-3">
          
          {/* User Input History Dropdown */}
          {messages.filter(m => m.role === 'user').length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowUserHistory(!showUserHistory)}
                className="flex items-center gap-2 text-sm font-medium transition-colors rounded-lg px-3 py-2"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: showUserHistory ? 'var(--bg-secondary)' : 'transparent',
                  border: `1px solid ${showUserHistory ? 'var(--border-primary)' : 'transparent'}`
                }}
              >
                {showUserHistory ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronUp style={{ width: '14px', height: '14px' }} />}
                Your Input History ({messages.filter(m => m.role === 'user').length})
              </button>
              
              {showUserHistory && (
                <div 
                  className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border shadow-lg overflow-hidden"
                  style={{
                    backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                    borderColor: 'var(--border-primary)',
                    maxHeight: '200px'
                  }}
                >
                  <div className="overflow-y-auto max-h-48 p-2 space-y-1">
                    {messages
                      .filter(m => m.role === 'user')
                      .slice(-10) // Show last 10 user inputs
                      .reverse() // Most recent first
                      .map((message, index) => (
                        <div 
                          key={message.id}
                          className="p-2 rounded-lg cursor-pointer transition-colors text-sm"
                          style={{
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-quaternary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                          }}
                          onClick={() => {
                            setInputValue(message.content);
                            setShowUserHistory(false);
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
                              {new Date(message.timestamp || new Date()).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                            {message.audioMetadata && (
                              <span className="text-green-500" style={{ fontSize: '11px' }}>🎙️</span>
                            )}
                          </div>
                          <div className="line-clamp-2">{message.content}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Current Input/Transcription Area */}
          <div className="flex items-end" style={{ gap: '12px' }}>
            <VoiceInput 
              onTranscript={handleVoiceTranscript}
              isDisabled={isStreaming}
              enableContinuousMode={isContinuousMode}
            />
            
            <form onSubmit={handleSubmit} className="flex-1 flex" style={{ gap: '10px' }}>
              <div className="flex-1 relative">
                {/* Current Transcription Display */}
                {currentTranscript && (
                  <div 
                    className="mb-2 p-3 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-500 text-xs font-medium">🎙️ Current Transcription:</span>
                    </div>
                    <div className="text-sm italic">"{currentTranscript}"</div>
                  </div>
                )}
                
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentTranscript ? "Voice input active..." : "Share your thoughts with the rubber ducky..."}
                    disabled={isStreaming}
                    rows={1}
                    className="w-full border-2 backdrop-blur-sm resize-none focus:outline-none focus:ring-2 disabled:opacity-50 transition-all duration-300 font-medium rounded-xl"
                    style={{ 
                      padding: '12px 16px',
                      fontSize: '14px',
                      lineHeight: '20px',
                      minHeight: '44px', 
                      maxHeight: '100px',
                      backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                      borderColor: inputValue.trim() ? 'var(--accent-primary)' : 'var(--border-primary)',
                      color: 'var(--text-primary)',
                      focusRingColor: 'var(--accent-primary)',
                      '&::placeholder': {
                        color: 'var(--text-tertiary)'
                      }
                    }}
                  />
                  {inputValue.trim() && (
                    <div className="absolute top-1/2 -translate-y-1/2" style={{ right: '16px' }}>
                      <div className="relative">
                        <div className="bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50" style={{ width: '8px', height: '8px' }}></div>
                        <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75" style={{ width: '8px', height: '8px' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isStreaming}
                className="relative bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 text-white rounded-xl hover:from-yellow-400 hover:via-amber-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30 transform hover:scale-105"
                style={{ 
                  padding: '12px 16px',
                  minWidth: '44px',
                  height: '44px'
                }}
              >
                <Send className="filter drop-shadow-sm" style={{ width: '16px', height: '16px' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 to-transparent rounded-xl"></div>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Chat Message Modal */}
      <ChatMessageModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        message={selectedMessage}
      />

      {/* Session Browser */}
      <SessionBrowser
        isOpen={isSessionBrowserOpen}
        onClose={() => setIsSessionBrowserOpen(false)}
        onSelectSession={handleSelectSession}
      />

      {/* Stars Browser */}
      <StarsBrowser
        isOpen={isStarsBrowserOpen}
        onClose={() => setIsStarsBrowserOpen(false)}
        userId="demo-user" // TODO: Replace with actual user ID from auth
        onSelectStar={(star) => {
          // Handle star selection - could navigate to the starred item
          console.log('Selected star:', star);
          setIsStarsBrowserOpen(false);
        }}
      />

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-sm"
            style={{
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'
            }}
            onClick={() => {
              setShowNewSessionModal(false);
              setNewSessionName('');
            }}
          />
          
          {/* Modal */}
          <div className="relative flex h-full items-center justify-center p-4">
            <div 
              className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
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
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Start New Chat
                </h2>
                <button
                  onClick={() => {
                    setShowNewSessionModal(false);
                    setNewSessionName('');
                  }}
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
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '24px' }}>
                <div className="space-y-4">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2" 
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Session Name (optional)
                    </label>
                    <input
                      type="text"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateNewSession();
                        } else if (e.key === 'Escape') {
                          setShowNewSessionModal(false);
                          setNewSessionName('');
                        }
                      }}
                      placeholder="Give your chat a name..."
                      className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)',
                        focusRingColor: 'var(--accent-primary)'
                      }}
                      autoFocus
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                      Leave empty to auto-generate a name
                    </p>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowNewSessionModal(false);
                        setNewSessionName('');
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: 'transparent',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateNewSession}
                      className="flex-1 px-4 py-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      Start New Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Scroll Navigation */}
      <ScrollNavigation containerRef={chatContainerRef} />
    </div>
  );
}