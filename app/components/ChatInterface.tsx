'use client';

import { useRef, useEffect, useState } from 'react';
import { Send, Trash2, Download, MessageCircle, Type } from 'lucide-react';
import Image from 'next/image';
import VoiceInput from './VoiceInput';
import AgentSelector from './AgentSelector';
import Logo from './Logo';
import UserMenu from './auth/UserMenu';
import FormattedMessage from './FormattedMessage';
import ThemeToggle from './ThemeToggle';
import ChatMessageModal from './ChatMessageModal';
import { useTheme } from '@/contexts/ThemeContext';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useAgent } from '@/contexts/AgentContext';
import { useDropdown } from '@/contexts/DropdownContext';
import { useConversationManager } from '@/hooks/useConversationManager';

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState('');
  const [conversationStarter, setConversationStarter] = useState('');
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { messages, isStreaming, error, sendMessage, clearMessages } = useStreamingChat();
  const { currentAgent, clearContext } = useAgent();
  const { isDropdownOpen } = useDropdown();
  const { shouldAIRespond, isInConversation, startConversation, endConversation } = useConversationManager();
  const { isDark } = useTheme();

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
    }
  };

  const handleVoiceTranscript = async (transcript: string) => {
    console.log('ChatInterface: Voice transcript received:', transcript);
    console.log('ChatInterface: isStreaming:', isStreaming);
    console.log('ChatInterface: isContinuousMode:', isContinuousMode);
    
    if (transcript.trim() && !isStreaming) {
      console.log('ChatInterface: Sending voice message to Claude...');
      await sendMessage(transcript);
      
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

  const handleClearMessages = () => {
    clearMessages();
    clearContext();
    if (isContinuousMode) {
      endConversation();
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

  const exportChat = () => {
    const chatContent = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\\n\\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${currentAgent.name.toLowerCase().replace(/\\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;
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
          padding: '16px 24px', 
          position: 'relative', 
          zIndex: 100, 
          width: '100%',
          backgroundColor: isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div className="flex items-center" style={{ gap: '16px' }}>
          <Logo 
            size="md" 
            onClick={() => window.location.reload()}
          />
          <AgentSelector />
        </div>
        <div className="flex items-center" style={{ gap: '8px' }}>
          {isContinuousMode && (
            <div 
              className="flex items-center rounded-full font-semibold backdrop-blur-sm border" 
              style={{ 
                gap: '8px', 
                padding: '8px 12px', 
                fontSize: '12px',
                backgroundColor: 'var(--accent-primary)',
                borderColor: 'var(--accent-secondary)',
                color: 'white'
              }}
            >
              <div className="relative">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"></div>
                <div className="absolute inset-0 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
              </div>
              Live Mode Active
            </div>
          )}
          
          {/* User Menu */}
          <UserMenu />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          <button
            onClick={toggleContinuousMode}
            className="rounded-xl transition-all duration-300"
            style={{ 
              padding: '8px',
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
              className="rounded-xl transition-all duration-300"
              style={{ 
                padding: '8px',
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
            className="rounded-xl transition-all duration-300"
            style={{ 
              padding: '8px',
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
          <button
            onClick={handleClearMessages}
            disabled={messages.length === 0}
            className="rounded-xl transition-all duration-300"
            style={{ 
              padding: '8px',
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
        {messages.length === 0 ? (
          /* Premium Empty State */
          <div className={`relative flex-1 flex items-center justify-center p-12 ${isDropdownOpen ? 'pointer-events-none' : ''}`}>
            <div className="relative max-w-2xl text-center space-y-12">
              {/* Agent Introduction */}
              <div className="space-y-8">
                <div className="flex justify-center">
                  <Logo size="xl" variant="minimal" showText={false} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                    🦆 Hi! I&apos;m your Rubber Ducky
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
                        <p className="text-gray-700 font-semibold text-base">🦆 Let&apos;s chat about:</p>
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
                  <p className="text-2xl font-bold text-gray-800">🦆 What we can explore together:</p>
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
                      <span className="text-blue-800 font-bold text-lg">🦆 Rubber Ducky Live!</span>
                      <span className="text-blue-700 text-sm font-medium">I&apos;m listening and ready to help you think</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Premium Chat Interface */
          <div className="relative flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                const isCurrentlyStreaming = isStreaming && !isUser && index === messages.length - 1;
                
                return (
                  <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`flex gap-4 max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      {/* Avatar */}
                      <div 
                        className="rounded-full flex items-center justify-center flex-shrink-0 relative shadow-lg transform transition-transform duration-300 group-hover:scale-110"
                        style={{
                          width: '64px',
                          height: '64px',
                          background: isUser 
                            ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)' 
                            : 'linear-gradient(135deg, #eab308 0%, #f59e0b 50%, #f97316 100%)',
                          boxShadow: isUser 
                            ? '0 10px 15px -3px rgba(30, 58, 138, 0.3)' 
                            : '0 10px 15px -3px rgba(234, 179, 8, 0.3)'
                        }}
                      >
                        {isUser ? (
                          <span className="text-white text-lg font-bold filter drop-shadow-sm">
                            {message.audioMetadata ? '🎙️' : 'U'}
                          </span>
                        ) : (
                          <Image
                            src="/rubber-duck-avatar.png"
                            alt="Rubber Ducky"
                            width={56}
                            height={56}
                            className="object-cover scale-125 rounded-full"
                            style={{ objectPosition: 'center center' }}
                            priority
                          />
                        )}
                        {isUser && message.audioMetadata && (
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white">
                            <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5" />
                          </div>
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div 
                        className="relative shadow-xl max-w-full backdrop-blur-sm transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02] rounded-[2rem] bg-gray-800 text-white cursor-pointer"
                        style={{ 
                          padding: '2rem 3rem',
                          border: `4px solid ${isUser ? '#1e40af' : '#eab308'}`,
                          boxShadow: isUser 
                            ? '0 25px 50px -12px rgba(30, 64, 175, 0.3)' 
                            : '0 25px 50px -12px rgba(234, 179, 8, 0.2)'
                        }}
                        onClick={() => handleMessageClick(message)}
                        title="Click to expand message"
                      >
                        {!isUser && (
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-500/5 rounded-[2rem]"></div>
                        )}
                        
                        {/* Message Content */}
                        <div className="relative">
                          {isUser ? (
                            <div className={`${getTextSizeClass()} leading-relaxed font-medium text-white`}>
                              {message.content}
                            </div>
                          ) : (
                            <>
                              <FormattedMessage 
                                content={message.content || (isCurrentlyStreaming ? '' : '')}
                                textSizeClass={getTextSizeClass()}
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
                        
                        {/* Timestamp and status */}
                        <div className="text-xs mt-2 font-medium text-gray-300">
                          {new Date().toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                          {isCurrentlyStreaming && !isUser && (
                            <span className="ml-2 inline-flex items-center">
                              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-sm"></span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Fixed-Size Message Composer */}
      <div 
        className="relative border-t border-blue-200/50 bg-white/95 backdrop-blur-xl shadow-2xl shadow-black/5 scale-locked-footer" 
        style={{ 
          padding: '12px 16px', 
          position: 'relative', 
          zIndex: 100, 
          width: '100%'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 to-transparent"></div>
        <div className="relative max-w-6xl mx-auto">
          <div className="flex items-end" style={{ gap: '12px' }}>
            {/* Temporarily disabled VoiceInput for debugging blank page */}
            {/* <VoiceInput 
              onTranscript={handleVoiceTranscript}
              isDisabled={isStreaming}
              enableContinuousMode={isContinuousMode}
            /> */}
            
            <form onSubmit={handleSubmit} className="flex-1 flex" style={{ gap: '10px' }}>
              <div className="flex-1 relative">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Share your thoughts with the rubber ducky..."
                    disabled={isStreaming}
                    rows={1}
                    className="w-full border-2 border-gray-200 bg-white/90 backdrop-blur-sm text-gray-900 rounded-xl resize-none focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 disabled:opacity-50 disabled:bg-gray-50 transition-all duration-300 placeholder-gray-400 shadow-lg shadow-black/5 font-medium"
                    style={{ 
                      padding: '12px 16px',
                      fontSize: '14px',
                      lineHeight: '20px',
                      minHeight: '44px', 
                      maxHeight: '100px' 
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
    </div>
  );
}