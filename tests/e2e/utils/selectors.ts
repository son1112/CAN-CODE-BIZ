/**
 * Standardized selectors for Playwright tests
 * This file centralizes all test selectors to ensure consistency and maintainability
 */

export const selectors = {
  // Core Chat Interface
  chatInterface: '[data-testid="chat-interface"]',
  messageInput: '[data-testid="message-input"]',
  sendButton: '[data-testid="send-button"]',
  voiceButton: '[data-testid="voice-button"]',
  
  // Messages
  userMessage: '[data-testid="user-message"]',
  aiMessage: '[data-testid="ai-message"]',
  thinkingIndicator: '[data-testid="thinking-indicator"]',
  messageContainer: '[data-testid="message-container"]',
  
  // Message Actions
  starButton: '[data-testid="star-button"]',
  tagButton: '[data-testid="tag-button"]',
  copyButton: '[data-testid="copy-button"]',
  retryButton: '[data-testid="retry-button"]',
  messageMenu: '[data-testid="message-menu"]',
  
  // Message Management
  messageTag: '[data-testid="message-tag"]',
  tagInput: '[data-testid="tag-input"]',
  starredMessage: '[data-testid="star-button"][data-starred="true"]',
  
  // Navigation
  sidebarToggle: '[data-testid="sidebar-toggle"]',
  newSessionButton: '[data-testid="new-session"]',
  sessionHistoryButton: '[data-testid="session-history"]',
  starredItemsButton: '[data-testid="starred-items"]',
  
  // Agent System
  agentSelector: '[data-testid="agent-selector"]',
  agentDropdown: '[data-testid="agent-dropdown"]',
  createAgentButton: '[data-testid="create-agent"]',
  
  // Voice Recognition
  voiceStatus: '[data-testid="voice-status"]',
  qualityMetrics: '[data-testid="quality-metrics"]',
  confidenceScore: '[data-testid="confidence-score"]',
  audioQuality: '[data-testid="audio-quality"]',
  sentimentDisplay: '[data-testid="sentiment-display"]',
  speakerDisplay: '[data-testid="speaker-display"]',
  safetyStatus: '[data-testid="safety-status"]',
  
  // Continuous Mode
  continuousMode: '[data-testid="continuous-mode"]',
  liveModeIndicator: '[data-testid="live-mode"]',
  
  // User Profile & Settings
  userAvatar: '[data-testid="user-avatar"]',
  profileMenu: '[data-testid="profile-menu"]',
  settingsLink: '[data-testid="settings-link"]',
  profileLink: '[data-testid="profile-link"]',
  signOutButton: '[data-testid="sign-out"]',
  
  // Settings Page
  settingsPage: '[data-testid="settings-page"]',
  contentSafetySection: '[data-testid="content-safety-section"]',
  contentSafetyHeader: '[data-testid="content-safety-header"]',
  contentSafetyToggle: '[data-testid="content-safety-toggle"]',
  sentimentAnalysisToggle: '[data-testid="sentiment-analysis-toggle"]',
  speakerDiarizationToggle: '[data-testid="speaker-diarization-toggle"]',
  saveSettingsButton: '[data-testid="save-settings"]',
  
  // Content Safety Settings
  contentSafetyEnable: '[data-testid="content-safety-enable"]',
  safetyModeInform: '[data-testid="safety-mode-inform"]',
  safetyModeReview: '[data-testid="safety-mode-review"]',
  safetyModeFilter: '[data-testid="safety-mode-filter"]',
  sensitivityLow: '[data-testid="sensitivity-low"]',
  sensitivityMedium: '[data-testid="sensitivity-medium"]',
  sensitivityHigh: '[data-testid="sensitivity-high"]',
  
  // Export Functionality
  exportButton: '[data-testid="export-button"]',
  exportMenu: '[data-testid="export-menu"]',
  exportPdf: '[data-testid="export-pdf"]',
  exportWord: '[data-testid="export-word"]',
  exportText: '[data-testid="export-text"]',
  exportOptions: '[data-testid="export-options"]',
  downloadLocal: '[data-testid="download-local"]',
  uploadGoogleDrive: '[data-testid="upload-google-drive"]',
  
  // Modals and Dialogs
  modal: '[data-testid="modal"]',
  modalClose: '[data-testid="modal-close"]',
  confirmDialog: '[data-testid="confirm-dialog"]',
  confirmButton: '[data-testid="confirm-button"]',
  cancelButton: '[data-testid="cancel-button"]',
  
  // Session Management
  sessionBrowser: '[data-testid="session-browser"]',
  sessionItem: '[data-testid="session-item"]',
  sessionTitle: '[data-testid="session-title"]',
  sessionDate: '[data-testid="session-date"]',
  sessionDelete: '[data-testid="session-delete"]',
  
  // Stars Browser
  starsBrowser: '[data-testid="stars-browser"]',
  starredItem: '[data-testid="starred-item"]',
  
  // Onboarding Tour
  onboardingTooltip: '[data-testid="onboarding-tooltip"]',
  tourNext: '[data-testid="tour-next"]',
  tourPrevious: '[data-testid="tour-previous"]',
  tourSkip: '[data-testid="tour-skip"]',
  tourFinish: '[data-testid="tour-finish"]',
  tourClose: '[data-testid="tour-close"]',
  
  // Onboarding Target Elements (data-onboarding attributes)
  onboardingLogo: '[data-onboarding="logo"]',
  onboardingChatArea: '[data-onboarding="chat-area"]',
  onboardingVoiceInput: '[data-onboarding="voice-input"]',
  onboardingAgentSelector: '[data-onboarding="agent-selector"]',
  onboardingSidebarToggle: '[data-onboarding="sidebar-toggle"]',
  onboardingContinuousMode: '[data-onboarding="continuous-mode"]',
  onboardingMessageInput: '[data-onboarding="message-input"]',
  
  // Loading States
  loadingSpinner: '[data-testid="loading-spinner"]',
  loadingMessage: '[data-testid="loading-message"]',
  
  // Error States
  errorMessage: '[data-testid="error-message"]',
  errorRetry: '[data-testid="retry-button"]',
  errorDetails: '[data-testid="error-details"]',
  
  // Success States
  successMessage: '[data-testid="success-message"]',
  successIcon: '[data-testid="success-icon"]',
  
  // Theme Toggle
  themeToggle: '[data-testid="theme-toggle"]',
  
  // Mobile Specific
  mobileMenu: '[data-testid="mobile-menu"]',
  mobileMenuToggle: '[data-testid="mobile-menu-toggle"]',
  desktopNav: '[data-testid="desktop-nav"]',
  
  // Performance Monitoring
  performanceMetrics: '[data-testid="performance-metrics"]',
  responseTime: '[data-testid="response-time"]',
  
  // Authentication
  signInButton: 'button[type="submit"]',
  signInForm: '[data-testid="sign-in-form"]',
  authProvider: '[data-testid="auth-provider"]',
} as const;

// Role-based selectors for accessibility testing
export const roleSelectors = {
  buttons: 'button',
  links: 'a',
  headings: 'h1, h2, h3, h4, h5, h6',
  textboxes: 'input[type="text"], textarea',
  checkboxes: 'input[type="checkbox"]',
  radioButtons: 'input[type="radio"]',
  listItems: 'li',
  navigation: 'nav',
  main: 'main',
} as const;

// Text-based selectors for content verification
export const textSelectors = {
  appTitle: 'Rubber Ducky Live',
  thinking: 'Rubber Ducky is thinking',
  signIn: 'Sign in',
  settings: 'Settings',
  profile: 'Profile',
  sessionHistory: 'Session History',
  starredItems: 'Starred Items',
  liveMode: 'Live Mode',
  contentSafety: 'Content Safety',
  voiceQuality: 'Voice Quality',
  powerAgents: 'Power Agents',
  welcomeMessage: 'Welcome to Rubber Ducky Live',
} as const;

// URL patterns for navigation testing
export const urlPatterns = {
  home: '/',
  settings: '/settings',
  profile: '/profile',
  auth: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: (id: string) => `/sessions/${id}`,
} as const;

// Helper functions for common selector operations
export const selectorHelpers = {
  /**
   * Get message by index (0-based)
   */
  messageByIndex: (index: number, type: 'user' | 'ai' = 'ai') => 
    `[data-testid="${type}-message"]:nth-child(${index + 1})`,
  
  /**
   * Get starred message button
   */
  starButtonForMessage: (messageId: string) => 
    `[data-testid="message-${messageId}"] [data-testid="star-button"]`,
  
  /**
   * Get tag for specific message
   */
  tagForMessage: (messageId: string, tagText: string) => 
    `[data-testid="message-${messageId}"] [data-testid="message-tag"]:has-text("${tagText}")`,
  
  /**
   * Get session item by title
   */
  sessionByTitle: (title: string) => 
    `[data-testid="session-item"]:has([data-testid="session-title"]:has-text("${title}"))`,
  
  /**
   * Get setting toggle by name
   */
  settingToggle: (settingName: string) => 
    `[data-testid="${settingName}-toggle"]`,
  
  /**
   * Get button by aria-label
   */
  buttonByLabel: (label: string) => 
    `button[aria-label="${label}"]`,
  
  /**
   * Get form field by label
   */
  fieldByLabel: (label: string) => 
    `[aria-label="${label}"], [placeholder*="${label}"]`,
} as const;

// Export types for TypeScript support
export type Selector = keyof typeof selectors;
export type RoleSelector = keyof typeof roleSelectors;
export type TextSelector = keyof typeof textSelectors;