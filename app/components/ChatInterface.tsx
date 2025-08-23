'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Send, MessageCircle, Type, History, Edit3, Check, X, Minimize2, Maximize2, Star, Plus, MoreHorizontal, Hash, RefreshCw, User, LogOut, Archive, ArchiveRestore, RotateCcw, Copy, Clock, Zap, TrendingUp, Activity } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VoiceInput from './VoiceInput';
import AgentSelector from './AgentSelector';
import Logo from './Logo';
import FormattedMessage from './FormattedMessage';
import ThemeToggle from './ThemeToggle';
import ChatMessageModal from './ChatMessageModal';
import ModelSelector from './ModelSelector';
import ScrollNavigation from './ScrollNavigation';
import StarButton from './StarButton';
import StarsBrowser from './StarsBrowser';
import TagBrowser from './TagBrowser';
import MessageTagInterface from './MessageTagInterface';
import MessageExportButton from './MessageExportButton';
import PrimaryAgentSelector from './PrimaryAgentSelector';
import { SessionLoadingIndicator } from './LoadingIndicator';
import { useDuckAvatar } from '@/hooks/useDuckAvatar';
import { useTheme } from '@/contexts/ThemeContext';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useAgent } from '@/contexts/AgentContext';
import { useDropdown } from '@/contexts/DropdownContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useConversationManager } from '@/hooks/useConversationManager';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/contexts/SessionContext';
import SessionBrowser from './SessionBrowser';
import { useSession as useAuthSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { Settings } from 'lucide-react';
import { getAgentById, getRandomConversationStarter } from '@/lib/agents';
import { useAgents } from '@/hooks/useAgents';
import type { Message } from '@/types';

// Format token count for display
const formatTokens = (tokens: number): string => {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  if (tokens < 1000000000) return `${(tokens / 1000000).toFixed(1)}M`;
  return `${(tokens / 1000000000).toFixed(1)}B`;
};

// Format model names for display
const formatModelName = (modelName: string): string => {
  if (modelName.includes('opus')) return 'Opus';
  if (modelName.includes('sonnet')) return 'Sonnet';
  return modelName.split('-')[1] || modelName;
};

// Array of available hero images
const heroImages = [
  '/Gemini_Generated_Image_35trpk35trpk35tr.png',
  '/Gemini_Generated_Image_63t3fb63t3fb63t3.png',
  '/Gemini_Generated_Image_ght25qght25qght2.png',
  '/Gemini_Generated_Image_tnr5a2tnr5a2tnr5.png',
  '/Gemini_Generated_Image_yphrpuyphrpuyphr.png',
];

// Fast-loading Hero Section with cycling images
function HeroSection() {
  // Start with first image to avoid hydration mismatch
  const [heroImage, setHeroImage] = useState(heroImages[0]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client flag and randomize initial image after hydration
    setIsClient(true);
    setHeroImage(heroImages[Math.floor(Math.random() * heroImages.length)]);
  }, []);

  useEffect(() => {
    if (!isClient) return; // Only start cycling after hydration

    // Change image every 10 seconds
    const interval = setInterval(() => {
      setHeroImage(prev => {
        const currentIndex = heroImages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % heroImages.length;
        return heroImages[nextIndex];
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [isClient]);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="w-full h-64 rounded-3xl shadow-2xl shadow-black/10 relative overflow-hidden">
        <Image
          src={heroImage}
          alt="Rubber Ducky Hero"
          fill
          className="object-cover"
          priority // Load immediately for welcome view
        />
        
        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Rubber duck logo in corner */}
        <div className="absolute bottom-4 right-4">
          <Image
            src="/rdlogo081525-cutout.png"
            alt="Rubber Ducky Logo"
            width={80}
            height={80}
            className="drop-shadow-2xl"
            priority
          />
        </div>
      </div>
    </div>
  );
}

// Helper function to extract and truncate the first sentence
function getFirstSentencePreview(content: string, maxLength: number = 80): string {
  if (!content) return '';
  
  // Clean up the content first - remove markdown formatting for preview
  const cleanContent = content
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
    .replace(/`(.*?)`/g, '$1') // Remove inline code
    .replace(/```[\s\S]*?```/g, '[code block]') // Replace code blocks
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  // Find the first sentence (look for period, exclamation, or question mark followed by space/end)
  const sentenceMatch = cleanContent.match(/^[^.!?]*[.!?](?:\s|$)/);
  const firstSentence = sentenceMatch ? sentenceMatch[0].trim() : cleanContent;
  
  // Truncate if too long
  if (firstSentence.length <= maxLength) {
    return firstSentence;
  }
  
  // Find the last complete word that fits
  const truncated = firstSentence.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.7) { // If we can preserve most of the text
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
}


export default function ChatInterface() {
  const { agents } = useAgents();
  const { userId } = useAuth();
  
  // Helper function to get agent display name
  const getAgentDisplayName = (agentUsed: string | undefined) => {
    if (!agentUsed) return null;
    
    if (agentUsed.startsWith('power-agent:')) {
      const powerAgentId = agentUsed.replace('power-agent:', '');
      const powerAgent = agents.find(a => a.name === powerAgentId);
      return powerAgent?.name || powerAgentId;
    }
    
    return getAgentById(agentUsed).name;
  };
  
  const [inputValue, setInputValue] = useState('');
  const [conversationStarter, setConversationStarter] = useState('');
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const textSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl' = 'base';
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionBrowserOpen, setIsSessionBrowserOpen] = useState(false);
  const [showUserHistory, setShowUserHistory] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isEditingSessionName, setIsEditingSessionName] = useState(false);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());
  const [isStarsBrowserOpen, setIsStarsBrowserOpen] = useState(false);
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'tags'>('menu');
  const [activeTagFilter, setActiveTagFilter] = useState<string[]>([]);
  const [archivedMessages, setArchivedMessages] = useState<Set<string>>(new Set());
  const [showArchivedMessages, setShowArchivedMessages] = useState(false);
  const [usageData, setUsageData] = useState<{
    projectTokens: number;
    dailyInputTokens: number;
    dailyOutputTokens: number;
    dailyTotalTokens: number;
    recentSessions: number;
    dailyModels?: string[];
    projectModels?: string[];
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Debounce input changes to reduce re-renders
  const [debouncedInputValue, setDebouncedInputValue] = useState('');
  const inputDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const { messages, isStreaming, error, fallbackMessage, failedMessages, sendMessage, retryMessage, clearMessages } = useStreamingChat();
  const { startOnboarding } = useOnboarding();
  const { generateAvatar, isGenerating: isGeneratingAvatar, error: avatarError } = useDuckAvatar();
  const { currentSession, createSession, loadSession, renameSession, isLoadingSession, isProcessingMessage, clearCurrentSession, updateMessageTags, addMessage } = useSession();
  const { currentAgent, clearContext } = useAgent();
  const { isDropdownOpen } = useDropdown();
  const { shouldAIRespond, isInConversation, startConversation, endConversation } = useConversationManager();
  const { isDark } = useTheme();
  const { data: authSession } = useAuthSession();
  const router = useRouter();

  // Helper function to format session names into readable titles
  const formatSessionTitle = (sessionName: string) => {
    if (!sessionName || sessionName === 'Untitled Session') {
      return 'Untitled Session';
    }
    
    // Handle date-based names like "Chat 8/17/2025, 10:52:01 PM"
    if (sessionName.startsWith('Chat ')) {
      const dateString = sessionName.replace('Chat ', '');
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return `Chat from ${date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`;
        }
      } catch {
        // Fall through to default formatting
      }
    }
    
    // Handle other automatic names or clean up user-provided names
    return sessionName
      .split(/[\s_-]+/) // Split on spaces, underscores, hyphens
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Title case
      .join(' ')
      .replace(/\b(And|Or|The|A|An|In|On|At|To|For|Of|With|By)\b/g, word => word.toLowerCase()) // Lowercase articles/prepositions
      .replace(/^[a-z]/, char => char.toUpperCase()); // Ensure first letter is capitalized
  };

  // Helper function to generate message titles from content
  const generateMessageTitle = (content: string, role: 'user' | 'assistant') => {
    if (!content) return role === 'user' ? 'Your Message' : 'AI Response';
    
    // Clean up the content first - remove markdown formatting for title
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .trim();
    
    // Get first sentence
    const sentences = cleanContent.split(/[.!?]+/);
    let firstSentence = sentences[0]?.trim() || '';
    
    // If first sentence is too short, try to get more context
    if (firstSentence.length < 10 && sentences[1]) {
      firstSentence = (firstSentence + '. ' + sentences[1]).trim();
    }
    
    // Limit length and ensure it ends properly
    if (firstSentence.length > 60) {
      firstSentence = firstSentence.substring(0, 57) + '...';
    }
    
    // If still empty or too short, use generic titles
    if (!firstSentence || firstSentence.length < 5) {
      return role === 'user' ? 'Your Message' : 'AI Response';
    }
    
    // Ensure first letter is capitalized
    return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
  };
  
  // Filter messages based on active tag filter and archive status (optimized)
  const filteredMessages = useMemo(() => {
    // Use session messages if available and streaming messages if not
    // This ensures we show session content when loaded from URL
    const sourceMessages = messages.length > 0 ? messages : (currentSession?.messages || []);
    let filtered = sourceMessages;
    
    // Filter by tags first
    if (activeTagFilter.length > 0) {
      const tagSet = new Set(activeTagFilter);
      filtered = filtered.filter(message => {
        return (message as Message & { tags?: string[] }).tags?.some((tag: string) => tagSet.has(tag));
      });
    }
    
    // Filter by archive status
    filtered = filtered.filter(message => {
      const isArchived = archivedMessages.has(message.id);
      return showArchivedMessages ? isArchived : !isArchived;
    });
    
    return filtered;
  }, [messages, currentSession?.messages, activeTagFilter, archivedMessages, showArchivedMessages]);

  // Get text size class based on current setting
  const getTextSizeClass = () => {
    return 'text-base'; // textSize is hardcoded to 'base'
  };


  // Helper function to clean markdown formatting for front page display
  const cleanMarkdownForDisplay = (text: string): string => {
    // Extract just the first sentence/paragraph before any formatting sections
    const firstParagraph = text.split('\n\n')[0];
    return firstParagraph
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/🎯|💭|🚀|📊|💼|🏠/g, '') // Remove emojis
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Set conversation starter on client side to avoid hydration mismatch
  useEffect(() => {
    if (currentAgent.conversationStarters && currentAgent.conversationStarters.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentAgent.conversationStarters.length);
      const rawStarter = currentAgent.conversationStarters[randomIndex];
      const cleanedStarter = cleanMarkdownForDisplay(rawStarter);
      setConversationStarter(cleanedStarter);
    }
  }, [currentAgent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addWelcomeMessage = async () => {
    try {
      const welcomeMessage = getRandomConversationStarter(currentAgent);
      await addMessage({
        role: 'assistant',
        content: welcomeMessage,
        agentUsed: currentAgent.id
      });
    } catch (error) {
      console.error('Failed to add welcome message:', error);
    }
  };

  const handleNavigateToHome = () => {
    console.log('Logo clicked - navigating to home');
    // Clear any ongoing conversations
    clearMessages();
    clearContext();
    if (isContinuousMode) {
      endConversation();
    }
    // Clear current session state (this will also clear localStorage)
    clearCurrentSession();
    // Navigate to home page and remove session URL parameter
    router.push('/');
  };

  const handleQuickNewSession = async () => {
    try {
      const newSession = await createSession(); // Creates session with auto-generated name
      // Update URL to reflect new session
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('session', newSession.sessionId);
      router.replace(newUrl.pathname + newUrl.search);
      
      clearMessages();
      clearContext();
      if (isContinuousMode) {
        endConversation();
      }
      
      // Add welcome message from current agent
      await addWelcomeMessage();
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add keyboard shortcut for new session (Ctrl/Cmd + N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        handleQuickNewSession();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [createSession, clearMessages, clearContext, isContinuousMode, endConversation]);

  // Close overflow menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOverflowMenuOpen && !target.closest('.md\\:hidden')) {
        setIsOverflowMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOverflowMenuOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isStreaming) {
      const userInput = inputValue.trim();
      
      // Check if we should generate an avatar - either first user message OR no avatar exists yet
      // IMPORTANT: Check BEFORE sending the message
      const shouldGenerateAvatar = currentSession && 
        !currentSession.avatar && // No avatar exists yet
        userInput.trim().length > 10; // Meaningful message (not just "hi")
        
      console.log('Avatar generation check (BEFORE sending):', {
        sessionId: currentSession?.sessionId,
        hasMessages: !!currentSession?.messages,
        messageCount: currentSession?.messages?.length || 0,
        userMessageCount: currentSession?.messages?.filter(m => m.role === 'user').length || 0,
        hasAvatar: !!currentSession?.avatar,
        shouldGenerateAvatar
      });
      
      // Generate avatar BEFORE sending message if we should generate one
      if (shouldGenerateAvatar && currentSession) {
        console.log('🦆 Generating avatar for message (no avatar exists yet):', userInput);
        
        // Start avatar generation in parallel (don't await)
        generateAvatar(userInput, currentSession.sessionId)
          .then(async (avatarData) => {
            if (avatarData) {
              console.log('🎨 Avatar generated, saving to session:', avatarData.imageUrl);
              // Save the avatar to the session
              await fetch(`/api/sessions/${currentSession.sessionId}/avatar`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  imageUrl: avatarData.imageUrl,
                  prompt: avatarData.prompt,
                }),
              });
              console.log('✅ Avatar saved to session successfully!');
            }
          })
          .catch(error => {
            console.error('❌ Failed to generate or save avatar:', error);
          });
      }
      
      // Send the message
      await sendMessage(userInput);
      
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

  // Optimized input handler with debouncing for expensive operations
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value); // Immediate UI update
    
    // Debounce expensive operations
    if (inputDebounceRef.current) {
      clearTimeout(inputDebounceRef.current);
    }
    inputDebounceRef.current = setTimeout(() => {
      setDebouncedInputValue(value);
    }, 100); // 100ms debounce
  }, []);


  const handleCreateNewSession = async () => {
    try {
      const sessionName = newSessionName.trim() || undefined;
      await createSession(sessionName);
      setShowNewSessionModal(false);
      setNewSessionName('');
      
      // Add welcome message from current agent
      await addWelcomeMessage();
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

  const handleMessageClick = useCallback((message: Message) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      await loadSession(sessionId);
      // Update URL to reflect current session
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('session', sessionId);
      router.replace(newUrl.pathname + newUrl.search);
      // Clear any streaming state when switching sessions
      clearMessages();
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const toggleMessageCollapse = useCallback((messageId: string) => {
    setCollapsedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);



  // Auto-collapse agent responses when there are more than 10 (optimized)
  const lastMessageCount = useRef(0);
  useEffect(() => {
    // Only run when message count actually increases (not on every state change)
    if (messages.length <= lastMessageCount.current || messages.length <= 10) {
      lastMessageCount.current = messages.length;
      return;
    }
    
    // Auto-collapse messages for better conversation scanning
    const agentMessages = messages.filter(msg => msg.role === 'assistant');
    const userMessages = messages.filter(msg => msg.role === 'user');
    
    setCollapsedMessages(prev => {
      const newSet = new Set(prev);
      
      // Collapse all user messages by default (they can be expanded on click)
      userMessages.forEach(msg => newSet.add(msg.id));
      
      // Auto-collapse older AI messages when conversation gets long
      if (agentMessages.length > 10) {
        // Get IDs of all agent messages except the last 3 (keep recent ones expanded)
        const messagesToCollapse = agentMessages
          .slice(0, -3)
          .map(msg => msg.id);
        
        messagesToCollapse.forEach(id => newSet.add(id));
      }
      
      return newSet;
    });
    
    lastMessageCount.current = messages.length;
  }, [messages.length]); // Only depend on length, not entire messages array

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (inputDebounceRef.current) {
        clearTimeout(inputDebounceRef.current);
      }
    };
  }, []);

  // Load archived messages from session data
  useEffect(() => {
    if (currentSession?.messages) {
      const archivedIds = new Set<string>();
      currentSession.messages.forEach(message => {
        if (message.isArchived) {
          archivedIds.add(message.id);
        }
      });
      setArchivedMessages(archivedIds);
    }
  }, [currentSession?.sessionId, currentSession?.messages]);

  // Fetch ccusage data for metrics
  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const response = await fetch('/api/usage');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setUsageData(result.data);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch usage data:', error);
      }
    };

    // Fetch data on component mount and then every 5 minutes
    fetchUsageData();
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Archive/unarchive message functions
  const toggleArchiveMessage = async (messageId: string) => {
    const isCurrentlyArchived = archivedMessages.has(messageId);
    const newArchivedState = !isCurrentlyArchived;
    
    // Optimistic update
    setArchivedMessages(prev => {
      const newSet = new Set(prev);
      if (newArchivedState) {
        newSet.add(messageId);
      } else {
        newSet.delete(messageId);
      }
      return newSet;
    });

    try {
      const response = await fetch(`/api/sessions/messages/${messageId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isArchived: newArchivedState,
          sessionId: currentSession?.sessionId || ''
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update archive status');
      }

      const result = await response.json();
      
      console.log('Message archive status updated', {
        component: 'ChatInterface',
        messageId,
        isArchived: result.isArchived
      });

    } catch (error) {
      // Revert optimistic update on error
      setArchivedMessages(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyArchived) {
          newSet.add(messageId);
        } else {
          newSet.delete(messageId);
        }
        return newSet;
      });
      
      console.error('Failed to toggle message archive status', {
        component: 'ChatInterface',
        messageId,
        error
      });
    }
  };

  return (
    <div 
      data-testid="chat-interface"
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
      
      {/* Modern Header with Color Accents */}
      <div 
        className="relative flex items-center justify-between backdrop-blur-xl border-b scale-locked-header" 
        style={{ 
          padding: '8px 16px', 
          position: 'relative', 
          zIndex: 100, 
          width: '100%',
          backgroundColor: isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-lg)',
          borderImage: 'linear-gradient(90deg, #3b82f6, #eab308, #10b981) 1',
          borderBottom: '2px solid transparent',
          backgroundImage: isDark 
            ? 'linear-gradient(rgba(13, 13, 13, 0.95), rgba(13, 13, 13, 0.95)), linear-gradient(90deg, #3b82f6, #eab308, #10b981)'
            : 'linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), linear-gradient(90deg, #3b82f6, #eab308, #10b981)',
          backgroundClip: 'padding-box, border-box',
          backgroundOrigin: 'padding-box, border-box'
        }}
      >
        <div className="flex items-center min-w-0 flex-1 gap-3 sm:gap-5">
          <div data-onboarding="logo">
            <Logo 
              size="lg" 
              showText={false}
              onClick={handleNavigateToHome}
            />
          </div>
          
          {/* Refresh button to reload current state */}
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors hover:shadow-md p-3 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
            title="Refresh page"
          >
            <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
          
          {/* Removed session title from header - now in chat window */}
          {false && currentSession ? (
            <div className="flex items-center gap-2 min-w-0 flex-shrink">
              {isEditingSessionName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingSessionName}
                    onChange={(e) => setEditingSessionName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        if (editingSessionName.trim() && currentSession) {
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
                    className="px-3 py-1.5 rounded-lg text-lg font-semibold border-2 transition-colors"
                    style={{
                      backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                      borderColor: 'var(--accent-primary)',
                      color: 'var(--text-primary)',
                      minWidth: '200px',
                      letterSpacing: '-0.01em'
                    }}
                    placeholder="Session name..."
                  />
                  <button
                    onClick={async () => {
                      if (editingSessionName.trim() && currentSession) {
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
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageCircle 
                      style={{ 
                        width: '18px', 
                        height: '18px', 
                        color: 'var(--accent-primary)' 
                      }} 
                    />
                    <span
                      className="text-lg font-semibold truncate cursor-pointer hover:opacity-80 transition-all duration-200"
                      style={{ 
                        backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.01em'
                      }}
                      onClick={() => {
                        if (currentSession) {
                          setEditingSessionName(currentSession.name);
                          setIsEditingSessionName(true);
                        }
                      }}
                      title="Click to rename session"
                    >
                      {formatSessionTitle(currentSession?.name || '')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (currentSession) {
                          setEditingSessionName(currentSession.name);
                          setIsEditingSessionName(true);
                        }
                      }}
                      className="p-1.5 rounded-lg transition-colors hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
                      style={{ color: 'var(--text-tertiary)' }}
                      title="Rename session"
                    >
                      <Edit3 style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleQuickNewSession}
              className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 cursor-pointer px-3 py-2.5 sm:px-2 sm:py-1 min-h-[44px] sm:min-h-0"
              title="Start a new conversation"
            >
              <MessageCircle 
                style={{ 
                  width: '18px', 
                  height: '18px', 
                  color: 'var(--text-tertiary)' 
                }} 
              />
              <span
                className="text-lg font-semibold"
                style={{ 
                  color: 'var(--text-tertiary)',
                  letterSpacing: '-0.01em'
                }}
              >
                New Conversation
              </span>
            </button>
          )}
        </div>
        <div className="flex items-center" style={{ gap: '8px' }}>
          {isContinuousMode && (
            <div 
              className="hidden sm:flex items-center rounded-full font-semibold backdrop-blur-sm border mr-2" 
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
          
          {/* Core Controls - Always Visible */}
          <ModelSelector size="sm" />
          <ThemeToggle />
          
          {/* Desktop Controls - Hidden on small screens */}
          <div className="flex items-center" style={{ gap: '8px' }}>
            {/* New Session */}
            <button
              onClick={handleQuickNewSession}
              className="rounded-lg transition-all duration-300"
              style={{ 
                padding: '6px',
                color: '#10b981',
                border: '1px solid transparent',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title="New Session (Ctrl/Cmd + N)"
              disabled={isLoadingSession}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
            </button>
            
            
            {/* Tour Button */}
            <button
              onClick={startOnboarding}
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
              title="Show App Tour"
            >
              <Type style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
          
          {/* Mobile Overflow Menu */}
          <div className="md:hidden relative">
            <button
              onClick={() => setIsOverflowMenuOpen(!isOverflowMenuOpen)}
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
              title="More options"
            >
              <MoreHorizontal style={{ width: '16px', height: '16px' }} />
            </button>
            
            {/* Overflow Menu Dropdown */}
            {isOverflowMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-2 py-2 rounded-lg shadow-lg border z-50"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border-primary)',
                  minWidth: '180px'
                }}
              >
                {/* New Session */}
                <button
                  onClick={() => {
                    handleQuickNewSession();
                    setIsOverflowMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  disabled={isLoadingSession}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  <span className="text-sm">New Session</span>
                </button>
                
                {/* Session History */}
                <button
                  onClick={() => {
                    setIsSessionBrowserOpen(true);
                    setIsOverflowMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <History style={{ width: '16px', height: '16px' }} />
                  <span className="text-sm">Session History</span>
                </button>
                
                {/* Stars Browser */}
                <button
                  onClick={() => {
                    setIsStarsBrowserOpen(true);
                    setIsOverflowMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Star style={{ width: '16px', height: '16px' }} />
                  <span className="text-sm">Starred Items</span>
                </button>
                
                {/* Continuous Mode */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  data-onboarding="continuous-mode"
                  onClick={() => {
                    toggleContinuousMode();
                    setIsOverflowMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                  style={{ color: isContinuousMode ? 'var(--accent-primary)' : 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <MessageCircle style={{ width: '16px', height: '16px' }} />
                  <span className="text-sm">
                    {isContinuousMode ? 'Disable Live Mode' : 'Enable Live Mode'}
                  </span>
                  {isContinuousMode && (
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
                
                {/* Onboarding Tour */}
                <button
                  onClick={() => {
                    startOnboarding();
                    setIsOverflowMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Type style={{ width: '16px', height: '16px' }} />
                  <span className="text-sm">Show App Tour</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modern Chat Interface with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div 
          className={`relative transition-all duration-300 ease-in-out border-r ${
            isSidebarOpen ? 'w-80' : 'w-0'
          } ${isSidebarOpen ? 'overflow-visible' : 'overflow-hidden'}`}
          style={{ 
            borderColor: 'var(--border-primary)',
            backgroundColor: isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Sidebar Toggle Button - Positioned relative to sidebar */}
          <button
            data-onboarding="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg"
            style={{
              right: '-22px', // Position halfway outside the sidebar edge
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '12px 8px',
              backgroundColor: isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              border: '2px solid #3b82f6', // Blue when open
              zIndex: 9999, // Very high to ensure it's above all content
              borderLeft: 'none', // No left border - attached to sidebar
              borderTopRightRadius: '12px',
              borderBottomRightRadius: '12px',
              borderTopLeftRadius: '0px', // Square left edge - attached to sidebar
              borderBottomLeftRadius: '0px', // Square left edge - attached to sidebar
              boxShadow: 'var(--shadow-xl)',
              backdropFilter: 'blur(12px)',
              color: 'var(--accent-primary)',
              cursor: 'pointer'
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              style={{ 
                width: '20px', 
                height: '20px'
              }} 
              fill="none" 
              stroke="currentColor"
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          {isSidebarOpen && (
            <div className="h-full flex flex-col p-6">
              {/* Sidebar Header with Tabs */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {activeTab === 'menu' ? 'Menu' : 'Tags'}
                  </h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
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

                {/* Tab Navigation */}
                <div className="flex rounded-lg p-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${
                      activeTab === 'menu' ? 'font-medium' : ''
                    }`}
                    style={{
                      backgroundColor: activeTab === 'menu' ? '#ffffff' : 'transparent',
                      color: activeTab === 'menu' ? '#3b82f6' : 'var(--text-secondary)',
                      boxShadow: activeTab === 'menu' ? '0 2px 4px rgba(59, 130, 246, 0.15)' : 'none',
                      borderLeft: activeTab === 'menu' ? '3px solid #3b82f6' : '3px solid transparent'
                    }}
                  >
                    <MoreHorizontal style={{ width: '16px', height: '16px' }} />
                    <span className="text-sm">Menu</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('tags')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${
                      activeTab === 'tags' ? 'font-medium' : ''
                    }`}
                    style={{
                      backgroundColor: activeTab === 'tags' ? '#ffffff' : 'transparent',
                      color: activeTab === 'tags' ? '#10b981' : 'var(--text-secondary)',
                      boxShadow: activeTab === 'tags' ? '0 2px 4px rgba(16, 185, 129, 0.15)' : 'none',
                      borderLeft: activeTab === 'tags' ? '3px solid #10b981' : '3px solid transparent'
                    }}
                  >
                    <Hash style={{ width: '16px', height: '16px' }} />
                    <span className="text-sm">Tags</span>
                  </button>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'menu' ? (
                  <div className="space-y-4">
                {/* Session History */}
                <button
                  onClick={() => {
                    setIsSessionBrowserOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <History style={{ width: '18px', height: '18px' }} />
                  <span>Session History</span>
                </button>

                {/* Stars Browser */}
                <button
                  onClick={() => {
                    setIsStarsBrowserOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Star style={{ width: '18px', height: '18px' }} />
                  <span>Starred Items</span>
                </button>

                {/* Input History Toggle */}
                <button
                  onClick={() => setShowUserHistory(!showUserHistory)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                  style={{ 
                    backgroundColor: showUserHistory ? 'var(--bg-tertiary)' : 'transparent',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (!showUserHistory) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showUserHistory) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <History style={{ width: '18px', height: '18px' }} />
                  <span>Input History</span>
                  {showUserHistory && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>

                {/* Archive Messages Toggle */}
                <button
                  onClick={() => setShowArchivedMessages(!showArchivedMessages)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                  style={{ 
                    backgroundColor: showArchivedMessages ? 'var(--bg-tertiary)' : 'transparent',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (!showArchivedMessages) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showArchivedMessages) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {showArchivedMessages ? (
                    <ArchiveRestore style={{ width: '18px', height: '18px' }} />
                  ) : (
                    <Archive style={{ width: '18px', height: '18px' }} />
                  )}
                  <span>{showArchivedMessages ? 'Show Active Messages' : 'Show Archived Messages'}</span>
                  {showArchivedMessages && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  {archivedMessages.size > 0 && !showArchivedMessages && (
                    <span className="ml-auto text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                      {archivedMessages.size}
                    </span>
                  )}
                </button>


                {/* Input History Section */}
                {showUserHistory && messages.filter(m => m.role === 'user').length > 0 && (
                  <div className="border-t pt-4" style={{ borderColor: 'var(--border-primary)' }}>
                    <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                      Recent Inputs ({messages.filter(m => m.role === 'user').length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {messages
                        .filter(m => m.role === 'user')
                        .slice(-10) // Show last 10 user inputs
                        .reverse() // Most recent first
                        .map((message) => (
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
                              setIsSidebarOpen(false);
                              inputRef.current?.focus();
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
                ) : (
                  /* Tags Tab */
                  <TagBrowser 
                    onTagFilter={(tags) => {
                      setActiveTagFilter(tags);
                      setIsSidebarOpen(false);
                    }}
                    onClose={() => setIsSidebarOpen(false)}
                  />
                )}
              </div>

              {/* Account Menu at Bottom */}
              {authSession?.user && (
                <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    {authSession.user.image && (
                      <Image
                        src={authSession.user.image}
                        alt={authSession.user.name || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {authSession.user.name || 'User'}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {authSession.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors text-sm"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <User style={{ width: '16px', height: '16px' }} />
                      <span>Profile</span>
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors text-sm"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Settings style={{ width: '16px', height: '16px' }} />
                      <span>Settings</span>
                    </Link>

                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm text-left"
                      style={{ color: 'var(--text-error)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <LogOut style={{ width: '16px', height: '16px' }} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div data-onboarding="chat-area" className="flex-1 flex overflow-hidden">
          {isLoadingSession ? (
            <div className={`relative flex-1 flex items-center justify-center p-12 ${isDropdownOpen ? 'pointer-events-none' : ''}`}>
              <SessionLoadingIndicator />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className={`relative flex-1 flex items-center justify-center p-12 ${isDropdownOpen ? 'pointer-events-none' : ''}`}>
              {activeTagFilter.length > 0 ? (
                <div className="text-center space-y-4">
                  <Hash style={{ width: '48px', height: '48px', color: 'var(--text-tertiary)', margin: '0 auto' }} />
                  <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    No messages with selected tags
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    No messages found with tags: {activeTagFilter.join(', ')}
                  </p>
                  <button
                    onClick={() => setActiveTagFilter([])}
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'white'
                    }}
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div className="relative max-w-2xl text-center space-y-12">
                  <div className="space-y-8">
                    <div className="flex justify-center">
                      <HeroSection />
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
                              &quot;{conversationStarter}&quot;
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
              )}
            </div>
          ) : (
            <div className="relative flex-1 flex flex-col max-w-full overflow-hidden">
            {/* Session Title - Sticky */}
            {currentSession && filteredMessages.length > 0 && (
              <div 
                className="sticky top-0 z-10 text-center py-3 sm:py-6 border-b border-opacity-20 px-2 sm:px-0 max-w-full overflow-hidden"
                style={{ 
                  borderColor: 'var(--border-primary)',
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.1) 50%, rgba(16, 185, 129, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.05) 50%, rgba(16, 185, 129, 0.05) 100%)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-8 py-3 sm:py-4 rounded-2xl border-2 max-w-full overflow-hidden" style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.08) 100%)',
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)'
                }}>
                  <MessageCircle 
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      color: 'var(--accent-primary)' 
                    }} 
                  />
                  {isEditingSessionName ? (
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
                      className="text-2xl font-bold px-3 py-1 border-2 border-blue-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all duration-200 text-center bg-white/90"
                      style={{
                        backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.02em',
                        minWidth: '300px'
                      }}
                      placeholder="Session name..."
                    />
                  ) : (
                    <h1 
                      className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-all duration-200"
                      style={{ 
                        backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.02em'
                      }}
                      onClick={() => {
                        setEditingSessionName(currentSession.name);
                        setIsEditingSessionName(true);
                      }}
                      title="Click to rename session"
                    >
                      {formatSessionTitle(currentSession.name)}
                    </h1>
                  )}


                  {/* Edit controls when editing session name */}
                  {isEditingSessionName && (
                    <div className="flex items-center gap-2">
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
                        className="p-2 rounded-lg transition-colors bg-green-500 hover:bg-green-600 text-white shadow-sm"
                        title="Save name"
                      >
                        <Check style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingSessionName(false);
                          setEditingSessionName('');
                        }}
                        className="p-2 rounded-lg transition-colors bg-gray-500 hover:bg-gray-600 text-white shadow-sm"
                        title="Cancel"
                      >
                        <X style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  )}
                  
                  {/* Agent selector in chat window title area */}
                  <div data-onboarding="agent-selector">
                    <AgentSelector />
                  </div>
                  
                  {/* Primary agent selector for session */}
                  {currentSession && (
                    <div className="mt-2">
                      <PrimaryAgentSelector 
                        sessionId={currentSession.sessionId}
                        currentPrimaryAgent={currentSession.primaryAgent}
                      />
                    </div>
                  )}
                </div>
                {currentSession.createdAt && (
                  <p 
                    className="mt-2 text-sm"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Started {new Date(currentSession.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
                
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
            )}

            {/* Session Metrics Status Bar */}
            {currentSession && filteredMessages.length > 0 && (
              <div 
                className="sticky top-0 z-10 border-b bg-gradient-to-r backdrop-blur-sm"
                style={{
                  borderColor: 'var(--border-primary)',
                  backgroundColor: isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)'
                }}
              >
                <div className="max-w-6xl mx-auto px-6 py-3">
                  <div className="flex items-center justify-between gap-4 text-xs">
                    {/* Left side metrics */}
                    <div className="flex items-center gap-6">
                      {/* Message Count */}
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {filteredMessages.length} messages
                        </span>
                      </div>

                      {/* Session Duration */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {(() => {
                            if (!currentSession.createdAt) return 'New session';
                            const duration = Date.now() - new Date(currentSession.createdAt).getTime();
                            const hours = Math.floor(duration / (1000 * 60 * 60));
                            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
                            if (hours > 0) return `${hours}h ${minutes}m`;
                            if (minutes > 0) return `${minutes}m`;
                            return 'Just started';
                          })()}
                        </span>
                      </div>

                      {/* Agent Usage */}
                      {currentSession.lastAgentUsed && (
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" style={{ color: 'var(--status-success)' }} />
                          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {getAgentDisplayName(currentSession.lastAgentUsed)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right side metrics */}
                    <div className="flex items-center gap-6">
                      {/* Project Tokens (ccusage data) */}
                      {usageData && (
                        <div className="flex items-center gap-2" title={`Total tokens consumed by this project. Models used: ${usageData.projectModels?.map(formatModelName).join(', ') || 'Unknown'}.`}>
                          <Activity className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
                          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {formatTokens(usageData.projectTokens)} project
                            {usageData.projectModels && usageData.projectModels.length > 0 && (
                              <span className="text-xs opacity-70 ml-1">
                                ({usageData.projectModels.map(formatModelName).join('/')})
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Daily Output Tokens */}
                      {usageData && usageData.dailyOutputTokens > 0 && (
                        <div className="flex items-center gap-2" title={`Output tokens generated today. Models used: ${usageData.dailyModels?.map(formatModelName).join(', ') || 'Unknown'}.`}>
                          <TrendingUp className="w-4 h-4" style={{ color: 'var(--status-success)' }} />
                          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                            {formatTokens(usageData.dailyOutputTokens)} today
                            {usageData.dailyModels && usageData.dailyModels.length > 0 && (
                              <span className="text-xs opacity-70 ml-1">
                                ({usageData.dailyModels.map(formatModelName).join('/')})
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Response Performance */}
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {(() => {
                            const userMessages = filteredMessages.filter(m => m.role === 'user').length;
                            const assistantMessages = filteredMessages.filter(m => m.role === 'assistant').length;
                            const responseRate = userMessages > 0 ? Math.round((assistantMessages / userMessages) * 100) : 0;
                            return `${responseRate}% response rate`;
                          })()}
                        </span>
                      </div>

                      {/* Session Status */}
                      <div className="flex items-center gap-2">
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
                  </div>
                </div>
              </div>
            )}
            
            <div 
              ref={chatContainerRef} 
              className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-8 py-4 sm:pb-4 space-y-4 sm:space-y-6 w-full max-w-full"
              style={{
                backgroundColor: '#f0f0f0',
                backgroundImage: `
                  linear-gradient(90deg, #d1d5db 1px, transparent 1px),
                  linear-gradient(#d1d5db 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 0 0'
              }}
            >
              
              {[...filteredMessages]
                .reverse()
                .map((message, index) => {
                  const isCurrentlyStreaming = isStreaming && message.role === 'assistant' && index === 0;
                  
                  return (
                    <div key={message.id} className="group">
                      {message.role === 'user' ? (
                        /* User Message - Professional Paper Style */
                        <div className="w-full flex justify-end">
                          <div className="max-w-[80%]">
                            <div 
                              className="relative shadow-xl rounded-lg border-l-4"
                              style={{ 
                                padding: '1.5rem 2rem',
                                backgroundColor: isDark ? '#ffffff' : '#ffffff',
                                color: isDark ? '#1f2937' : '#1f2937',
                                borderLeftColor: '#3b82f6',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
                                border: '1px solid #e5e7eb',
                              }}
                            >
                              {/* User Message Title & Header */}
                              <div className="mb-3 border-b pb-2" style={{ borderColor: '#e5e7eb' }}>
                                <h3 className="text-lg font-bold mb-1" style={{ 
                                  color: '#1e40af',
                                  backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text'
                                }}>
                                  {generateMessageTitle(message.content, 'user')}
                                </h3>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold px-2 py-1 rounded" style={{ 
                                      backgroundColor: '#f3f4f6',
                                      color: '#3b82f6'
                                    }}>
                                      You
                                    </span>
                                  {message.audioMetadata && (
                                    <span className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ 
                                      backgroundColor: '#dbeafe',
                                      color: '#3b82f6'
                                    }}>
                                      🎙️ Voice
                                    </span>
                                  )}
                                  {message.agentUsed && (
                                    <span className="text-xs px-2 py-1 rounded" style={{ 
                                      backgroundColor: '#f0f9ff',
                                      color: '#0284c7',
                                      fontSize: '10px'
                                    }}>
                                      to {getAgentDisplayName(message.agentUsed)}
                                    </span>
                                  )}
                                  {/* Archive button for user messages */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleArchiveMessage(message.id);
                                    }}
                                    className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                                    title={archivedMessages.has(message.id) ? "Unarchive message" : "Archive message"}
                                  >
                                    {archivedMessages.has(message.id) ? (
                                      <ArchiveRestore style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                                    ) : (
                                      <Archive style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                                    )}
                                  </button>

                                  {/* Retry button for all user messages */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      retryMessage(message.id);
                                    }}
                                    className={`opacity-60 hover:opacity-100 transition-opacity p-1 rounded ${
                                      failedMessages.has(message.id) ? 'hover:bg-red-100' : 'hover:bg-blue-100'
                                    }`}
                                    title={failedMessages.has(message.id) ? "Retry failed message" : "Retry this message"}
                                    disabled={isStreaming}
                                  >
                                    <RotateCcw style={{ 
                                      width: '14px', 
                                      height: '14px', 
                                      color: failedMessages.has(message.id) ? '#dc2626' : '#3b82f6'
                                    }} />
                                  </button>

                                  {/* Copy button for user messages */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(message.content);
                                    }}
                                    className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
                                    title="Copy message to clipboard"
                                  >
                                    <Copy style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                                  </button>
                                </div>
                                <span className="text-xs" style={{ color: '#6b7280' }}>
                                  {new Date(message.timestamp || new Date()).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </span>
                              </div>
                            </div>
                              {/* User Message Content */}
                              <div className="text-sm leading-relaxed">
                                {message.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* AI Assistant Message */
                        <div className="w-full max-w-full overflow-hidden">
                          <div className="flex items-start gap-2 sm:gap-6">
                            {/* AI Avatar */}
                            <div 
                              className="hidden lg:flex rounded-full items-center justify-center flex-shrink-0 relative shadow-lg transform transition-transform duration-300 group-hover:scale-110"
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
                          
                          {/* Full-width AI Message - Professional Paper Style */}
                          <div 
                            className={`flex-1 relative shadow-xl transition-all duration-300 group-hover:shadow-2xl rounded-lg border-l-4 w-full max-w-full overflow-hidden ${
                              collapsedMessages.has(message.id) ? 'p-3 sm:p-6' : 'p-4 sm:p-8 lg:p-12'
                            }`}
                            style={{
                              borderLeftColor: '#eab308',
                              backgroundColor: isDark ? '#ffffff' : '#ffffff',
                              color: isDark ? '#1f2937' : '#1f2937',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
                              border: '1px solid #e5e7eb',
                              borderLeft: '4px solid #eab308'
                            }}
                          >
                            {/* Professional document-style watermark */}
                            <div className="absolute top-3 right-3 opacity-10">
                              <div className="w-6 h-6 border-2 border-amber-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              </div>
                            </div>
                            
                            {/* Message Title & Header with Collapse Button */}
                            <div className="mb-3 border-b pb-2" style={{ borderColor: '#e5e7eb' }}>
                              <h3 className="text-lg font-bold mb-1" style={{ 
                                color: '#d97706',
                                backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                              }}>
                                {generateMessageTitle(message.content, 'assistant')}
                              </h3>
                              <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold px-2 py-1 rounded" style={{ 
                                      backgroundColor: '#fef3c7', 
                                      color: '#d97706' 
                                    }}>
                                      AI Assistant
                                    </span>
                                  {message.agentUsed && (
                                    <span className="text-xs px-2 py-1 rounded" style={{ 
                                      backgroundColor: '#f0f9ff', 
                                      color: '#0284c7' 
                                    }}>
                                      {getAgentDisplayName(message.agentUsed)}
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-medium" style={{ color: '#6b7280' }}>
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
                                {userId && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <StarButton
                                      userId={userId}
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
                                )}
                                <MessageExportButton
                                  messageId={message.id}
                                  sessionId={currentSession?.sessionId || ''}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleArchiveMessage(message.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-100"
                                  style={{ color: archivedMessages.has(message.id) ? '#3b82f6' : 'var(--text-tertiary)' }}
                                  title={archivedMessages.has(message.id) ? "Unarchive message" : "Archive message"}
                                >
                                  {archivedMessages.has(message.id) ? (
                                    <ArchiveRestore style={{ width: '16px', height: '16px' }} />
                                  ) : (
                                    <Archive style={{ width: '16px', height: '16px' }} />
                                  )}
                                </button>
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
                            </div>
                            
                            {/* Message Content */}
                            <div className="relative">
                              {collapsedMessages.has(message.id) ? (
                                /* Collapsed View - Lower Profile */
                                <div className="py-1">
                                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {getFirstSentencePreview(message.content)}
                                  </div>
                                  <div className="text-xs mt-0.5 opacity-50" style={{ color: 'var(--text-tertiary)' }}>
                                    Click to expand
                                  </div>
                                </div>
                              ) : (
                                /* Full Content */
                                <>
                                  <FormattedMessage 
                                    content={message.content || (isCurrentlyStreaming ? '' : '')}
                                    textSizeClass={getTextSizeClass()}
                                    expandedView={true}
                                  />
                                  
                                  {/* Message Tags */}
                                  <MessageTagInterface 
                                    messageId={message.id}
                                    tags={message.tags || []}
                                    onTagsUpdate={async (tags) => {
                                      await updateMessageTags(message.id, tags);
                                    }}
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
                      )}
                    </div>
                  );
                })}
              
              {/* Show thinking bubble when processing a message or when streaming but no content yet */}
              {(isProcessingMessage || (isStreaming && messages.filter(m => m.role === 'assistant').length === 0)) && (
                <div className="group">
                  {/* Thinking bubble that matches AI response style */}
                  <div className="w-full max-w-full overflow-hidden">
                    <div className="flex items-start gap-2 sm:gap-6">
                      {/* AI Avatar */}
                      <div 
                        className="hidden lg:flex rounded-full items-center justify-center flex-shrink-0 relative shadow-lg"
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
                      
                      {/* Thinking bubble - Professional Paper Style */}
                      <div 
                        className="flex-1 relative shadow-xl rounded-lg border-l-4 animate-pulse w-full max-w-full overflow-hidden p-4 sm:p-8 lg:p-12"
                        style={{
                          borderLeftColor: '#eab308',
                          backgroundColor: isDark ? '#ffffff' : '#ffffff',
                          color: isDark ? '#1f2937' : '#1f2937',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
                          border: '1px solid #e5e7eb',
                          borderLeft: '4px solid #eab308'
                        }}
                      >
                        {/* Thinking Title */}
                        <div className="mb-3 border-b pb-2" style={{ borderColor: '#e5e7eb' }}>
                          <h3 className="text-lg font-bold" style={{ color: '#1f2937' }}>
                            Thinking...
                          </h3>
                        </div>
                        {/* Professional document-style watermark */}
                        <div className="absolute top-3 right-3 opacity-10">
                          <div className="w-6 h-6 border-2 border-amber-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          </div>
                        </div>
                        
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
                            
                            {/* Enhanced thinking indicator with more prominent animations */}
                            <div className="flex flex-col items-center space-y-4">
                              <div className="flex items-center space-x-3">
                                <span className="text-xl font-semibold animate-pulse" style={{ color: '#d97706' }}>
                                  🦆 Rubber Ducky is thinking
                                </span>
                                <div className="flex items-center space-x-1">
                                  {[0, 1, 2].map((i) => (
                                    <div
                                      key={i}
                                      className="w-3 h-3 rounded-full animate-bounce"
                                      style={{
                                        backgroundColor: '#eab308',
                                        animationDelay: `${i * 0.2}s`,
                                        animationDuration: '1s'
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              {/* Progress indicator */}
                              <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full animate-pulse"
                                  style={{
                                    width: '100%',
                                    animationDuration: '2s',
                                    animationIterationCount: 'infinite'
                                  }}
                                />
                              </div>
                              
                              <span className="text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
                                Processing your message with Claude AI...
                              </span>
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
        </div>
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

      {/* Fallback message display */}
      {fallbackMessage && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-xl text-amber-800 shadow-sm shadow-amber-500/10 backdrop-blur-sm" style={{ margin: '0 12px 6px 12px', padding: '8px', fontSize: '12px' }}>
          <div className="flex items-center" style={{ gap: '6px' }}>
            <RefreshCw className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium">{fallbackMessage}</span>
          </div>
        </div>
      )}

      {/* Prominent Processing Indicator - Fixed position toast */}
      {(isStreaming || isProcessingMessage) && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in-0 duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-3">
              {/* Animated duck icon */}
              <div className="relative">
                <span className="text-xl animate-bounce">🦆</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
              
              {/* Processing text with animation */}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {isStreaming ? 'Claude is responding' : 'Processing your message'}
                </span>
                <div className="flex items-center space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                      style={{ 
                        animationDelay: `${i * 150}ms`,
                        animationDuration: '1s' 
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Footer with User Input History */}
      <div 
        className="relative border-t backdrop-blur-xl shadow-2xl scale-locked-footer" 
        style={{ 
          padding: '16px 16px 20px 16px',
          position: 'relative', 
          zIndex: 100, 
          width: '100%',
          minHeight: '140px', // Increased minimum height to accommodate stable controls
          maxHeight: 'min(50vh, 450px)', // Slightly increased max height
          backgroundColor: isDark ? 'rgba(13, 13, 13, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          borderColor: 'var(--border-primary)',
          overflow: 'hidden' // Prevent content from extending beyond footer
        }}
      >
        <div className="absolute inset-0" style={{ background: isDark ? 'linear-gradient(to top, rgba(13, 13, 13, 0.2), transparent)' : 'linear-gradient(to top, rgba(59, 130, 246, 0.08), transparent)' }}></div>
        <div className="relative max-w-6xl mx-auto space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" style={{ maxHeight: 'min(35vh, 280px)' }}>
          
          
          {/* Current Input/Transcription Area */}
          <div className="flex flex-col sm:flex-row items-start" style={{ gap: '12px' }}>
            <div data-onboarding="voice-input" className="voice-input-wrapper w-full sm:w-auto flex-shrink-0">
              <VoiceInput 
                onTranscript={handleVoiceTranscript}
                isDisabled={isStreaming}
                enableContinuousMode={isContinuousMode}
                onContinuousModeToggle={toggleContinuousMode}
                isContinuousMode={isContinuousMode}
              />
            </div>
            
            <form data-onboarding="message-input" onSubmit={handleSubmit} className="flex-1 flex" style={{ gap: '10px' }}>
              <div className="flex-1 relative">
                {/* Current Transcription Display */}
                {currentTranscript && (
                  <div 
                    className="mb-3 p-2.5 rounded-lg border animate-pulse"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-secondary)',
                      maxHeight: '100px',
                      overflow: 'hidden'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-500 text-xs font-medium">🎙️ Current Transcription:</span>
                    </div>
                    <div className="text-sm italic overflow-y-auto" style={{ maxHeight: '60px' }}>&quot;{currentTranscript}&quot;</div>
                  </div>
                )}
                
                <div className="relative">
                  <textarea
                    data-testid="message-input"
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isStreaming ? "Claude is responding..." : 
                      isProcessingMessage ? "Processing your message..." :
                      currentTranscript ? "Voice input active..." : 
                      "Share your thoughts with the rubber ducky..."
                    }
                    disabled={isStreaming || isProcessingMessage}
                    rows={1}
                    className={`w-full border-2 backdrop-blur-sm resize-none focus:outline-none transition-all duration-300 font-medium rounded-xl ${debouncedInputValue.trim() ? 'border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600' : 'border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'} disabled:opacity-50`}
                    style={useMemo(() => ({ 
                      padding: '12px 16px',
                      fontSize: '14px',
                      lineHeight: '20px',
                      minHeight: '44px', 
                      maxHeight: '100px',
                      backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                      color: 'var(--text-primary)'
                    }), [isDark])}
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
                data-testid="send-button"
                type="submit"
                disabled={!inputValue.trim() || isStreaming || isProcessingMessage}
                className="relative bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 text-white rounded-xl hover:from-yellow-400 hover:via-amber-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30 transform hover:scale-105"
                style={{ 
                  padding: '12px 16px',
                  minWidth: '44px',
                  height: '44px'
                }}
              >
                {(isStreaming || isProcessingMessage) ? (
                  <RefreshCw className="filter drop-shadow-sm animate-spin" style={{ width: '16px', height: '16px' }} />
                ) : (
                  <Send className="filter drop-shadow-sm" style={{ width: '16px', height: '16px' }} />
                )}
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
      {userId && (
        <StarsBrowser
          isOpen={isStarsBrowserOpen}
          onClose={() => setIsStarsBrowserOpen(false)}
          userId={userId}
        onSelectStar={async (star) => {
          setIsStarsBrowserOpen(false);
          
          // Handle navigation based on star type
          if (star.itemType === 'session') {
            try {
              await loadSession(star.itemId);
              // Update URL to reflect current session
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set('session', star.itemId);
              router.replace(newUrl.pathname + newUrl.search);
              // Clear any streaming state when switching sessions
              clearMessages();
            } catch (error) {
              console.error('Failed to load starred session:', error);
            }
          } else {
            // For non-session items, just log for now
            // Future: could implement navigation for other types
            console.log('Selected star:', star);
          }
        }}
        />
      )}

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
                        color: 'var(--text-primary)'
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

      {/* Floating Sidebar Toggle - Only when closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg"
          style={{
          left: '0px', // Always at left edge when collapsed
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '12px 8px',
          backgroundColor: isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #10b981', // Green when closed
          zIndex: 9999, // Very high to ensure it's above all content
          borderLeft: 'none', // No left border - attached to edge
          borderTopRightRadius: '12px',
          borderBottomRightRadius: '12px',
          borderTopLeftRadius: '0px', // Square left edge
          borderBottomLeftRadius: '0px', // Square left edge
          boxShadow: 'var(--shadow-xl)',
          backdropFilter: 'blur(12px)',
          color: 'var(--accent-primary)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)';
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)';
          e.currentTarget.style.borderColor = 'var(--border-primary)';
        }}
        title={isSidebarOpen ? 'Close Menu' : 'Open Menu'}
      >
        <svg 
          style={{ 
            width: '20px', 
            height: '20px',
            transition: 'transform 0.3s ease-in-out',
            transform: isSidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2.5} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </button>
      )}

      {/* Floating Scroll Navigation */}
      <ScrollNavigation containerRef={chatContainerRef} />
    </div>
  );
}