'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Send, X, MoreHorizontal, RefreshCw, User, LogOut, Settings, Hash, Star, Archive, ArchiveRestore, History, MessageSquare, LayoutGrid } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import VoiceInput from './VoiceInput';
import Logo from './Logo';
import FormattedMessage from './FormattedMessage';
import { SessionLoadingIndicator } from './LoadingIndicator';
import dynamic from 'next/dynamic';

// Lazy load non-critical components
const AgentSelector = dynamic(() => import('./AgentSelector'), { ssr: false });
const ThemeToggle = dynamic(() => import('./ThemeToggle'), { ssr: false });
const ChatMessageModal = dynamic(() => import('./ChatMessageModal'), { ssr: false });
const ModelSelector = dynamic(() => import('./ModelSelector'), { ssr: false });
const ScrollNavigation = dynamic(() => import('./ScrollNavigation'), { ssr: false });
const StarButton = dynamic(() => import('./StarButton'), { ssr: false });
const StarsBrowser = dynamic(() => import('./StarsBrowser'), { ssr: false });
const TagBrowser = dynamic(() => import('./TagBrowser'), { ssr: false });
const MessageTagInterface = dynamic(() => import('./MessageTagInterface'), { ssr: false });
const MessageExportButton = dynamic(() => import('./MessageExportButton'), { ssr: false });
const InstallPrompt = dynamic(() => import('./InstallPrompt').then(mod => ({ default: mod.default })), { ssr: false });
const InstallButton = dynamic(() => import('./InstallPrompt').then(mod => ({ default: mod.InstallButton })), { ssr: false });
// Lazy load more components for better performance
const PrimaryAgentSelector = dynamic(() => import('./PrimaryAgentSelector'), { ssr: false });
const SessionHeader = dynamic(() => import('./SessionHeader'), { ssr: false });
const MobileOptimizedHeader = dynamic(() => import('./MobileOptimizedHeader'), { ssr: false });
const VirtualizedMessageList = dynamic(() => import('./VirtualizedMessageList'), { ssr: false });
const MessageItem = dynamic(() => import('./MessageItem'), { ssr: false });
import { useMessageVirtualization } from '@/hooks/useMessageVirtualization';
import { useDuckAvatar } from '@/hooks/useDuckAvatar';
import { useTheme } from '@/contexts/ThemeContext';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useAgent } from '@/contexts/AgentContext';
import { useDropdown } from '@/contexts/DropdownContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useConversationManager } from '@/hooks/useConversationManager';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/contexts/SessionContext';
const SessionBrowser = dynamic(() => import('./SessionBrowser'), { ssr: false });
const AnalysisChatView = dynamic(() => import('./AnalysisChatView'), { ssr: false });
import { useSession as useAuthSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { getAgentById, getRandomConversationStarter } from '@/lib/agents';
import { useAgents } from '@/hooks/useAgents';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
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
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
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
  // Hydration-safe component with consistent server/client rendering
  const [isClient, setIsClient] = useState(false);
  
  const { agents } = useAgents();
  const { userId } = useAuth();
  const { isMobile, isTablet } = useMobileNavigation();
  
  // Set client flag after hydration to avoid hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Helper function to get agent display name
  const getAgentDisplayName = (agentUsed: string | undefined): string => {
    if (!agentUsed) return 'Default Agent';

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
  const [chatViewMode, setChatViewMode] = useState<'linear' | 'analysis'>('linear');
  const [showUserHistory, setShowUserHistory] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isEditingSessionName, setIsEditingSessionName] = useState(false);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set());
  const [isStarsBrowserOpen, setIsStarsBrowserOpen] = useState(false);
  const [isTagBrowserOpen, setIsTagBrowserOpen] = useState(false);
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

  const { messages, isStreaming, error, fallbackMessage, failedMessages, sendMessage, retryMessage, clearMessages, resetStreamingState } = useStreamingChat();

  // Virtual scrolling optimization
  const {
    shouldVirtualize,
    getAdaptiveItemHeight,
    getAdaptiveOverscan,
    getScrollBehavior,
    isMobileLayout: isVirtualMobileLayout,
    virtualizationConfig
  } = useMessageVirtualization(messages, {
    enabled: false, // DISABLED AGAIN - messages still disappearing with virtualization
    threshold: 20, // Enable for 20+ messages
    estimatedItemHeight: isMobile ? 160 : 200,
    maintainScrollPosition: true
  });

  const { startOnboarding } = useOnboarding();
  const { generateAvatar, isGenerating: isGeneratingAvatar, error: avatarError } = useDuckAvatar();
  const { currentSession, currentSessionId, createSession, loadSession, renameSession, isLoadingSession, isProcessingMessage, clearCurrentSession, updateMessageTags, addMessage } = useSession();
  const { currentAgent, clearContext } = useAgent();
  const { isDropdownOpen } = useDropdown();
  const { shouldAIRespond, isInConversation, startConversation, endConversation } = useConversationManager();
  const { isDark } = useTheme();
  const { data: authSession } = useAuthSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Debug: Check if we have search params
  console.log('🔍 SEARCH PARAMS:', {
    searchParams: searchParams ? 'exists' : 'null',
    sessionParam: searchParams?.get('session'),
    url: typeof window !== 'undefined' ? window.location.href : 'server-side'
  });

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

  // Filter messages based on active tag filter and archive status (hydration-safe)
  const filteredMessages = useMemo(() => {
    // Prioritize session messages when we have a current session
    // Only use after client hydration to avoid server/client mismatches
    if (!isClient) {
      return []; // Return empty array on server-side to prevent hydration issues
    }
    
    const sourceMessages = (currentSession?.messages && currentSession.messages.length > 0) 
      ? currentSession.messages 
      : messages;
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
  }, [isClient, messages, currentSession?.messages, activeTagFilter, archivedMessages, showArchivedMessages]);

  // Debug logging removed - session loading issue resolved

  // Debug logging removed - session loading issue resolved

  // Client-side session loading with hydration safety
  useEffect(() => {
    // Only run on client side after mount
    if (typeof window === 'undefined' || !isClient) return;
    
    const sessionParam = new URLSearchParams(window.location.search).get('session');
    
    // Load session if URL has session parameter and we don't have one loaded
    if (sessionParam && !currentSession && !isLoadingSession) {
      console.log('🚨 Loading session from URL:', sessionParam);
      loadSession(sessionParam);
    }
  }, [isClient, currentSession, isLoadingSession, loadSession]);

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
    console.log('handleQuickNewSession: Starting new session creation...');
    try {
      console.log('handleQuickNewSession: Calling createSession()...');
      const newSession = await createSession(); // Creates session with auto-generated name
      
      if (!newSession) {
        console.error('handleQuickNewSession: createSession returned null/undefined');
        setError('Failed to create new session. Please try again.');
        return;
      }
      
      console.log('handleQuickNewSession: New session created:', newSession);
      
      // Update URL to reflect new session
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('session', newSession.sessionId);
      console.log('handleQuickNewSession: Updating URL to:', newUrl.toString());
      router.replace(newUrl.pathname + newUrl.search);

      console.log('handleQuickNewSession: Clearing messages and context...');
      clearMessages();
      clearContext();
      if (isContinuousMode) {
        console.log('handleQuickNewSession: Ending continuous mode conversation...');
        endConversation();
      }

      // Add welcome message from current agent
      console.log('handleQuickNewSession: Adding welcome message...');
      await addWelcomeMessage();
      console.log('handleQuickNewSession: New session setup complete!');
    } catch (error) {
      console.error('handleQuickNewSession: Failed to create new session:', error);
      console.error('handleQuickNewSession: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setError('Failed to create new session. Please try again.');
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
    console.log('ChatInterface: Transcript length:', transcript.length);
    console.log('ChatInterface: Trimmed transcript:', transcript.trim());
    console.log('ChatInterface: isStreaming:', isStreaming);
    console.log('ChatInterface: isContinuousMode:', isContinuousMode);

    // Update current transcript for display
    setCurrentTranscript(transcript);

    // Check if transcript is empty
    if (!transcript.trim()) {
      console.warn('ChatInterface: Voice transcript is empty, not sending');
      return;
    }

    // Check if streaming is in progress
    if (isStreaming) {
      console.error('ChatInterface: BLOCKED - System is currently streaming, cannot send voice message');
      console.error('ChatInterface: This is likely the bug - streaming state is stuck at true');
      
      // Log more debugging info
      console.log('ChatInterface: Current messages count:', messages.length);
      console.log('ChatInterface: Last message:', messages[messages.length - 1]);
      
      // Check if the last message was completed (assistant message exists)
      const lastMessage = messages[messages.length - 1];
      const secondLastMessage = messages[messages.length - 2];
      
      // If we have a completed assistant response, the streaming might be stuck
      if (lastMessage?.role === 'assistant' && secondLastMessage?.role === 'user') {
        console.warn('ChatInterface: Detected potentially stuck streaming state - last message is from assistant');
        console.warn('ChatInterface: Attempting to reset streaming state...');
        resetStreamingState();
        
        // Try sending the message after reset
        setTimeout(async () => {
          console.log('ChatInterface: Retrying voice message after reset...');
          if (!isStreaming) {
            await sendMessage(transcript);
            setCurrentTranscript('');
          }
        }, 100);
      } else {
        // Show error to user
        setError('Please wait for the current response to complete before sending a new message');
      }
      return;
    }

    try {
      console.log('ChatInterface: Sending voice message to Claude...');
      const result = await sendMessage(transcript);
      console.log('ChatInterface: sendMessage completed, result:', result);

      // Clear transcript after sending
      setCurrentTranscript('');

      // In continuous mode, determine if AI should respond based on conversation context
      if (isContinuousMode && isInConversation) {
        const shouldRespond = shouldAIRespond(transcript, messages);
        console.log('ChatInterface: Should AI respond?', shouldRespond);
        // The AI response is already triggered by sendMessage, so we don't need to do anything extra
      }
    } catch (error) {
      console.error('ChatInterface: Failed to send voice transcript:', error);
      setError('Failed to send voice message. Please try again.');
      // Clear streaming state in case it's stuck
      console.log('ChatInterface: Attempting to clear potentially stuck streaming state');
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

  // Handle copying message content to clipboard
  const handleCopyMessage = useCallback(async (messageContent: string) => {
    try {
      await navigator.clipboard.writeText(messageContent);
      console.log('Message copied to clipboard', {
        component: 'ChatInterface',
        messageLength: messageContent.length
      });
    } catch (error) {
      console.error('Failed to copy message to clipboard', {
        component: 'ChatInterface',
        error
      });
    }
  }, []);

  // Handle updating message tags
  const handleTagsChange = useCallback(async (messageId: string, tags: string[]) => {
    try {
      await updateMessageTags(messageId, tags);
      console.log('Message tags updated', {
        component: 'ChatInterface',
        messageId,
        tagsCount: tags.length
      });
    } catch (error) {
      console.error('Failed to update message tags', {
        component: 'ChatInterface',
        messageId,
        error
      });
    }
  }, [updateMessageTags]);

  // Message renderer for virtual scrolling
  const renderMessage = useCallback((message: Message, index: number) => {
    const reversedIndex = filteredMessages.length - 1 - index;
    const isCurrentlyStreaming = isStreaming && message.role === 'assistant' && reversedIndex === 0;

    // Message rendering - debug logging removed

    return (
      <MessageItem
        key={message.id}
        message={message}
        index={reversedIndex}
        sessionId={currentSession?.sessionId}
        isCurrentlyStreaming={isCurrentlyStreaming}
        collapsedMessages={collapsedMessages}
        expandMessage={(messageId) => {
          setCollapsedMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(messageId);
            return newSet;
          });
        }}
        collapseMessage={(messageId) => {
          setCollapsedMessages(prev => new Set([...prev, messageId]));
        }}
        generateMessageTitle={generateMessageTitle}
        handleCopyMessage={handleCopyMessage}
        handleRetryMessage={(messageId) => {
          retryMessage(messageId);
        }}
        onTagsChange={handleTagsChange}
        formatTokens={formatTokens}
        formatModel={formatModelName}
        currentUserId={userId || undefined}
        onOpenModal={(message) => {
          setSelectedMessage(message);
          setIsModalOpen(true);
        }}
      />
    );
  }, [
    filteredMessages.length,
    isStreaming,
    collapsedMessages,
    generateMessageTitle,
    handleCopyMessage,
    handleTagsChange,
    formatTokens,
    formatModelName,
    userId,
    retryMessage,
    filteredMessages
  ]);

  return (
    <div
      data-testid="chat-interface"
      className="flex flex-col h-screen relative overflow-hidden bg-primary"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)'
          : 'linear-gradient(135deg, #fafafa 0%, #f0f9ff 50%, #e0f2fe 100%)'
      }}
      suppressHydrationWarning
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

      {/* Mobile-Optimized Header */}
      <MobileOptimizedHeader
        onNewSession={handleQuickNewSession}
        onShowSessionBrowser={() => setIsSessionBrowserOpen(true)}
        onShowStarsBrowser={() => setIsStarsBrowserOpen(true)}
        onShowTagBrowser={() => setIsTagBrowserOpen(true)}
        onStartTour={startOnboarding}
        onNavigateToHome={handleNavigateToHome}
        isContinuousMode={isContinuousMode}
        isLoadingSession={isLoadingSession}
      />


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
              right: '-22px',
              top: '50%',
              transform: 'translateY(-50%)',
              paddingTop: '12px',
              paddingRight: '8px', 
              paddingBottom: '12px',
              paddingLeft: '8px',
              backgroundColor: isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderTopWidth: '2px',
              borderTopStyle: 'solid', 
              borderTopColor: '#3b82f6',
              borderRightWidth: '2px',
              borderRightStyle: 'solid',
              borderRightColor: '#3b82f6', 
              borderBottomWidth: '2px',
              borderBottomStyle: 'solid',
              borderBottomColor: '#3b82f6',
              borderLeftWidth: '0px',
              zIndex: 9999,
              borderTopRightRadius: '12px',
              borderBottomRightRadius: '12px', 
              borderTopLeftRadius: '0px',
              borderBottomLeftRadius: '0px',
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
                      borderLeftWidth: '3px',
                      borderLeftStyle: 'solid',
                      borderLeftColor: activeTab === 'menu' ? '#3b82f6' : 'transparent'
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
                      borderLeftWidth: '3px',
                      borderLeftStyle: 'solid', 
                      borderLeftColor: activeTab === 'tags' ? '#10b981' : 'transparent'
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
        <div data-onboarding="chat-area" className="flex-1 flex overflow-hidden" suppressHydrationWarning>
          {/* Render loading state during hydration, then actual content */}
          {!isClient ? (
            <div className="relative flex-1 flex items-center justify-center p-12">
              <div className="text-center space-y-4">
                <div className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Loading...
                </div>
              </div>
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
              {/* Session Header Component */}
              <SessionHeader
                currentSession={currentSession}
                filteredMessages={filteredMessages}
                isEditingSessionName={isEditingSessionName}
                editingSessionName={editingSessionName}
                activeTagFilter={activeTagFilter}
                isDark={isDark}
                isStreaming={isStreaming}
                formatSessionTitle={formatSessionTitle}
                getAgentDisplayName={getAgentDisplayName}
                setEditingSessionName={setEditingSessionName}
                setIsEditingSessionName={setIsEditingSessionName}
                setActiveTagFilter={setActiveTagFilter}
                renameSession={renameSession}
                loadSession={async (sessionId: string) => {
                  await loadSession(sessionId);
                }}
              />

              {/* View Mode Toggle - Desktop Only */}
              {!isMobileLayout && typeof window !== 'undefined' && window.innerWidth >= 1280 && filteredMessages.length > 0 && (
                <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => setChatViewMode('linear')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          chatViewMode === 'linear' 
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        title="Linear Chat View"
                      >
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        Chat
                      </button>
                      <button
                        onClick={() => setChatViewMode('analysis')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          chatViewMode === 'analysis' 
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        title="Analysis - 3 Column Layout"
                      >
                        <LayoutGrid className="w-4 h-4 inline mr-1" />
                        Analysis
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Chat View Rendering */}
              {chatViewMode === 'analysis' && !isMobileLayout ? (
                // Analysis View - 3 Column Layout
                <div className="flex-1 overflow-hidden">
                  <AnalysisChatView 
                    messages={filteredMessages}
                    onMessageClick={(message) => {
                      setSelectedMessage(message);
                      setIsModalOpen(true);
                    }}
                    sessionId={currentSession?.sessionId}
                  />
                </div>
              ) : (
                // Traditional Linear Chat View
                <div
                  ref={chatContainerRef}
                  className={`flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-8 py-4 sm:pb-4 space-y-4 sm:space-y-6 w-full max-w-full ${
                    (isMobile || isTablet) ? 'mobile-chat-container mobile-scroll-momentum mobile-scrollbar' : ''
                  }`}
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

                {shouldVirtualize ? (
                  <VirtualizedMessageList
                    messages={[...filteredMessages].reverse()}
                    renderMessage={renderMessage}
                    className="space-y-4 sm:space-y-6"
                    itemHeight={virtualizationConfig.itemHeight}
                    overscan={getAdaptiveOverscan()}
                    onScroll={(scrollTop) => {
                      // Optional scroll tracking for analytics
                    }}
                  />
                ) : (
                  // Fallback to regular rendering for small lists
                  <div className="space-y-4 sm:space-y-6">
                    {[...filteredMessages].reverse().map((message, index) => {
                      const isCurrentlyStreaming = isStreaming && message.role === 'assistant' && index === 0;

                      return renderMessage(message, index);
                    })}
                  </div>
                )}

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
                          borderTopWidth: '1px',
                          borderRightWidth: '1px',
                          borderBottomWidth: '1px',
                          borderLeftWidth: '4px',
                          borderTopStyle: 'solid',
                          borderRightStyle: 'solid',
                          borderBottomStyle: 'solid',
                          borderLeftStyle: 'solid',
                          borderTopColor: '#e5e7eb',
                          borderRightColor: '#e5e7eb',
                          borderBottomColor: '#e5e7eb',
                          borderLeftColor: '#eab308'
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

                <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-xl text-red-800 shadow-sm shadow-red-500/10 backdrop-blur-sm" style={{ marginTop: '0px', marginRight: '12px', marginBottom: '6px', marginLeft: '12px', paddingTop: '8px', paddingRight: '8px', paddingBottom: '8px', paddingLeft: '8px', fontSize: '12px' }}>
          <div className="flex items-center" style={{ gap: '6px' }}>
            <div className="bg-red-500 rounded-full flex-shrink-0 animate-pulse shadow-sm" style={{ width: '6px', height: '6px' }} />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Fallback message display */}
      {fallbackMessage && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-xl text-amber-800 shadow-sm shadow-amber-500/10 backdrop-blur-sm" style={{ marginTop: '0px', marginRight: '12px', marginBottom: '6px', marginLeft: '12px', paddingTop: '8px', paddingRight: '8px', paddingBottom: '8px', paddingLeft: '8px', fontSize: '12px' }}>
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
          paddingTop: isVirtualMobileLayout ? '20px' : '16px',
          paddingRight: '16px',
          paddingLeft: '16px',
          paddingBottom: isVirtualMobileLayout ? 'max(60px, env(safe-area-inset-bottom, 60px))' : '48px',
          position: 'relative',
          zIndex: 100,
          width: '100%',
          minHeight: isVirtualMobileLayout ? '160px' : '140px',
          maxHeight: isVirtualMobileLayout ? 'min(55vh, 500px)' : 'min(50vh, 450px)',
          backgroundColor: isDark ? 'rgba(13, 13, 13, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          borderTopColor: 'var(--border-primary)',
          borderRightColor: 'var(--border-primary)',
          borderBottomColor: 'var(--border-primary)', 
          borderLeftColor: 'var(--border-primary)',
          overflow: 'hidden'
        }}
      >
        <div className="absolute inset-0" style={{ background: isDark ? 'linear-gradient(to top, rgba(13, 13, 13, 0.2), transparent)' : 'linear-gradient(to top, rgba(59, 130, 246, 0.08), transparent)' }}></div>
        <div className="relative max-w-6xl mx-auto space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-4 pt-4 pb-12" style={{ maxHeight: 'min(35vh, 280px)' }}>


          {/* Current Input/Transcription Area - Split Layout */}
          <div className="flex flex-col sm:flex-row items-start" style={{ gap: '12px' }}>
            {/* Voice Input Section - Left Side */}
            <div data-onboarding="voice-input" className="voice-input-wrapper w-full sm:w-auto flex-shrink-0">
              <VoiceInput
                onTranscript={handleVoiceTranscript}
                isDisabled={isStreaming}
                enableContinuousMode={isContinuousMode}
                onContinuousModeToggle={toggleContinuousMode}
                isContinuousMode={isContinuousMode}
              />
            </div>

            {/* Text Input Section - Right Side */}
            <form data-onboarding="message-input" onSubmit={handleSubmit} className="flex-1 flex" style={{ gap: '10px' }}>
              <div className="flex-1 relative">
                {/* Current Transcription Display - Enhanced */}
                {currentTranscript && (
                  <div
                    className="mb-4 p-4 rounded-lg border-2 animate-pulse shadow-md"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--accent-primary)',
                      color: 'var(--text-secondary)',
                      maxHeight: '120px',
                      overflow: 'hidden'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-500 text-sm font-semibold">🎙️ Current Transcription:</span>
                    </div>
                    <div className="text-sm italic overflow-y-auto font-medium" style={{ maxHeight: '80px' }}>&quot;{currentTranscript}&quot;</div>
                  </div>
                )}
                
                {/* Streaming State Debug Indicator - Improved Visibility */}
                {isStreaming && (
                  <div
                    className="mb-4 p-3 rounded-lg border-2 flex items-center justify-between shadow-lg"
                    style={{
                      backgroundColor: 'var(--bg-warning)',
                      borderColor: 'var(--border-warning)',
                      color: 'var(--text-warning)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">⚠️ Streaming Active</span>
                      <span className="text-sm opacity-75">Voice input blocked</span>
                    </div>
                    <button
                      onClick={() => {
                        console.log('Manual reset of streaming state triggered');
                        resetStreamingState();
                      }}
                      className="text-sm px-3 py-2 rounded-lg hover:bg-opacity-20 hover:bg-black transition-colors font-medium"
                      style={{ 
                        borderTopWidth: '2px',
                        borderRightWidth: '2px', 
                        borderBottomWidth: '2px',
                        borderLeftWidth: '2px',
                        borderTopStyle: 'solid',
                        borderRightStyle: 'solid',
                        borderBottomStyle: 'solid', 
                        borderLeftStyle: 'solid',
                        borderTopColor: 'currentColor',
                        borderRightColor: 'currentColor',
                        borderBottomColor: 'currentColor',
                        borderLeftColor: 'currentColor'
                      }}
                    >
                      Reset
                    </button>
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
                    className={`w-full border-2 backdrop-blur-sm resize-none focus:outline-none transition-all duration-300 font-medium rounded-xl ${
                      isVirtualMobileLayout
                        ? 'mobile-input-optimized mobile-textarea-optimized mobile-keyboard-optimized'
                        : ''
                    } ${debouncedInputValue.trim() ? 'border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600' : 'border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'} disabled:opacity-50`}
                    style={useMemo(() => ({
                      paddingTop: isVirtualMobileLayout ? '16px' : '12px',
                      paddingRight: isVirtualMobileLayout ? '18px' : '16px',
                      paddingBottom: isVirtualMobileLayout ? '16px' : '12px',
                      paddingLeft: isVirtualMobileLayout ? '18px' : '16px',
                      fontSize: isVirtualMobileLayout ? '16px' : '14px', // Prevent iOS zoom
                      lineHeight: isVirtualMobileLayout ? '24px' : '20px',
                      minHeight: isVirtualMobileLayout ? '52px' : '44px',
                      maxHeight: isVirtualMobileLayout ? '160px' : '100px',
                      backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                      color: 'var(--text-primary)',
                      WebkitTextSizeAdjust: '100%', // Prevent iOS font scaling
                      WebkitAppearance: 'none', // Remove iOS styling
                      overflowY: 'auto', // Enable scrolling for long text
                      scrollbarWidth: 'thin', // Modern scrollbar styling
                    }), [isDark, isVirtualMobileLayout])}
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
                className="relative bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 text-white rounded-xl hover:from-yellow-400 hover:via-amber-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg shadow-yellow-500/25 hover:shadow-xl hover:shadow-yellow-500/30 transform hover:scale-105 touch-target"
                style={{
                  paddingTop: isVirtualMobileLayout ? '16px' : '12px',
                  paddingRight: isVirtualMobileLayout ? '20px' : '16px',
                  paddingBottom: isVirtualMobileLayout ? '16px' : '12px',
                  paddingLeft: isVirtualMobileLayout ? '20px' : '16px',
                  minWidth: isVirtualMobileLayout ? '52px' : '44px',
                  minHeight: isVirtualMobileLayout ? '52px' : '44px',
                  alignSelf: 'flex-end' // Align button to bottom when textarea grows
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
      
      {/* PWA Install Prompts */}
      <InstallPrompt />
      <InstallButton />

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
                  paddingTop: '20px',
                  paddingRight: '24px',
                  paddingBottom: '20px',
                  paddingLeft: '24px',
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
          left: '0px',
          top: '50%',
          transform: 'translateY(-50%)',
          paddingTop: '12px',
          paddingRight: '8px',
          paddingBottom: '12px', 
          paddingLeft: '8px',
          backgroundColor: isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: '2px',
          borderTopStyle: 'solid',
          borderTopColor: '#10b981',
          borderRightWidth: '2px', 
          borderRightStyle: 'solid',
          borderRightColor: '#10b981',
          borderBottomWidth: '2px',
          borderBottomStyle: 'solid',
          borderBottomColor: '#10b981',
          borderLeftWidth: '0px',
          zIndex: 9999,
          borderTopRightRadius: '12px',
          borderBottomRightRadius: '12px',
          borderTopLeftRadius: '0px',
          borderBottomLeftRadius: '0px',
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