'use client';

import { Menu, MessageCircle, Settings, User, History, Star, Tag, Plus } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession } from '@/contexts/SessionContext';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import MobileHamburgerMenu from './MobileHamburgerMenu';
import MobileBreadcrumb, { BREADCRUMB_ITEMS } from './MobileBreadcrumb';
import { OfflineStatusBadge } from './OfflineIndicator';

interface MobileOptimizedHeaderProps {
  onNewSession: () => void;
  onShowSessionBrowser: () => void;
  onShowStarsBrowser: () => void;
  onShowTagBrowser: () => void;
  onStartTour: () => void;
  onNavigateToHome: () => void;
  isContinuousMode?: boolean;
  isLoadingSession?: boolean;
  showBreadcrumb?: boolean;
  currentView?: 'chat' | 'sessions' | 'stars' | 'tags' | null;
}

export default function MobileOptimizedHeader({
  onNewSession,
  onShowSessionBrowser,
  onShowStarsBrowser,
  onShowTagBrowser,
  onStartTour,
  onNavigateToHome,
  isContinuousMode = false,
  isLoadingSession = false,
  showBreadcrumb = true,
  currentView = null,
}: MobileOptimizedHeaderProps) {
  const { isDark } = useTheme();
  const { currentSession } = useSession();
  const { isMenuOpen, isMobile, isTablet, isHydrated, toggleMenu, closeMenu } = useMobileNavigation();

  // Determine if we should show mobile layout - only after hydration
  const showMobileLayout = isHydrated && (isMobile || isTablet);

  // Show loading state until hydrated to prevent mismatch
  if (!isHydrated) {
    return (
      <div
        className="sticky top-0 px-6 backdrop-blur-md border-b z-50"
        style={{
          zIndex: 50,
          width: '100%',
          height: '72px',
          backgroundColor: isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(248, 249, 250, 0.95)',
          borderBottomColor: isDark ? 'var(--medium-gray)' : 'var(--medium-gray)',
          boxShadow: 'var(--shadow-light)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo
              size="lg"
              showText={false}
              onClick={onNavigateToHome}
              className="cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <MessageCircle
                className="w-5 h-5 flex-shrink-0"
                style={{ color: 'var(--text-secondary)' }}
              />
              <span
                className="text-lg font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Loading...
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    );
  }

  // Generate breadcrumb items based on current view
  const getBreadcrumbItems = () => {
    const items = [{ ...BREADCRUMB_ITEMS.home, onClick: onNavigateToHome, isActive: !currentView && !currentSession }];

    if (currentView === 'sessions') {
      items.push({ ...BREADCRUMB_ITEMS.sessions, onClick: onShowSessionBrowser, isActive: true });
    } else if (currentView === 'stars') {
      items.push({ ...BREADCRUMB_ITEMS.stars, onClick: onShowStarsBrowser, isActive: true });
    } else if (currentView === 'tags') {
      items.push({ ...BREADCRUMB_ITEMS.tags, onClick: onShowTagBrowser, isActive: true });
    } else if (currentSession) {
      items.push({
        ...BREADCRUMB_ITEMS.chat,
        label: currentSession.name.length > 20
          ? currentSession.name.slice(0, 17) + '...'
          : currentSession.name,
        isActive: true,
        onClick: () => {}
      });
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <>
      {/* Mobile/Tablet Header */}
      {showMobileLayout ? (
        <div
          className="sticky top-0 backdrop-blur-md border-b z-50 mobile-optimized-header"
          style={{
            zIndex: 50,
            width: '100%',
            height: isMobile ? '64px' : '72px',
            backgroundColor: isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(248, 249, 250, 0.95)',
            borderBottomColor: isDark ? 'var(--medium-gray)' : 'var(--medium-gray)',
            boxShadow: 'var(--shadow-light)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: isMobile ? '12px' : '20px',
            paddingRight: isMobile ? '12px' : '20px'
          }}
        >
          <div className="header-container">
            {/* Left Side: Logo + Session Info */}
            <div className="header-left">
              <div className="logo-container">
                <Logo
                  size={isMobile ? "sm" : "md"}
                  showText={false}
                  onClick={onNavigateToHome}
                  className="flex-shrink-0"
                />
              </div>

              {/* Session Title - Mobile Optimized */}
              <div className="session-title-container">
                {currentSession ? (
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    {isContinuousMode && (
                      <div className="continuous-mode-indicator">
                        <div className={`bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50 ${
                          isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'
                        }`}></div>
                      </div>
                    )}
                    <span
                      className={`session-title font-semibold truncate ${
                        isMobile ? 'text-sm mobile-typography-sm' : 'text-base'
                      }`}
                      style={{
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        maxWidth: isMobile ? 'calc(100vw - 200px)' : 'calc(100vw - 300px)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={currentSession.name}
                    >
                      {currentSession.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <MessageCircle
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                    <span
                      className={`font-medium truncate ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}
                      style={{ 
                        color: 'var(--text-secondary)',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isMobile ? 'Chat' : 'New Conversation'}
                    </span>
                  </div>
                )}

                {/* Offline Status Badge - Only show when not in session to prevent overcrowding */}
                {isMobile && !currentSession && (
                  <div className="flex-shrink-0 ml-2">
                    <OfflineStatusBadge />
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Theme Toggle + Hamburger Menu */}
            <div className="header-right">
              {/* Mobile Theme Toggle - Smaller on mobile */}
              <div className="theme-toggle-container">
                <ThemeToggle />
              </div>
              
              {/* Hamburger Menu Button */}
              <div className="menu-button-container">
                <button
                onClick={toggleMenu}
                className="rounded-lg transition-all duration-200 p-2 touch-target flex-shrink-0"
                style={{
                  minWidth: '44px', // Slightly smaller for better fit
                  minHeight: '44px',
                  backgroundColor: isMenuOpen ? 'rgba(111, 66, 193, 0.1)' : 'transparent',
                  border: isMenuOpen ? '1px solid rgba(111, 66, 193, 0.3)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'var(--backdrop-blur-light)',
                  borderRadius: 'var(--radius-md)'
                }}
                aria-label="Open menu"
              >
                <Menu
                  className={isMobile ? 'w-4 h-4' : 'w-5 h-5'}
                  style={{ color: isMenuOpen ? '#6f42c1' : 'var(--text-secondary)' }}
                />
                </button>
              </div>
            </div>
          </div>

          {/* Continuous Mode Banner - Mobile */}
          {isContinuousMode && isMobile && (
            <div className="mt-2 flex items-center justify-center">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  borderColor: 'var(--accent-secondary)',
                  color: 'white',
                }}
              >
                <div className="relative">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                </div>
                Live Mode Active
              </div>
            </div>
          )}
        </div>
      ) : (
        // Optimized Desktop Header
        <div
          className="sticky top-0 px-6 backdrop-blur-md border-b z-50"
          style={{
            zIndex: 50,
            width: '100%',
            height: '72px',
            backgroundColor: isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(248, 249, 250, 0.95)',
            borderBottomColor: isDark ? 'var(--medium-gray)' : 'var(--medium-gray)',
            boxShadow: 'var(--shadow-light)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div className="header-container w-full px-4 lg:px-6 xl:px-8 flex items-center justify-between">
            {/* Left Side: Logo + Session Info */}
            <div className="header-left flex items-center gap-4 lg:gap-6 min-w-0 flex-1">
              <Logo
                size="lg"
                showText={false}
                onClick={onNavigateToHome}
                className="cursor-pointer"
              />
              
              {/* Session Information */}
              <div className="flex items-center gap-4 min-w-0">
                {currentSession ? (
                  <div className="flex items-center gap-3">
                    {isContinuousMode && (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"></div>
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          Live Mode
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MessageCircle
                        className="w-5 h-5 flex-shrink-0"
                        style={{ color: 'var(--text-secondary)' }}
                      />
                      <span
                        className="text-lg font-semibold truncate max-w-md"
                        style={{
                          color: 'var(--text-primary)',
                          letterSpacing: '-0.01em'
                        }}
                        title={currentSession.name}
                      >
                        {currentSession.name}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <MessageCircle
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: 'var(--text-secondary)' }}
                    />
                    <span
                      className="text-lg font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      New Conversation
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Controls */}
            <div className="header-right flex items-center gap-3 lg:gap-4 flex-shrink-0">
              {/* Session Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onNewSession}
                  className="btn btn-primary flex items-center gap-2 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--text-primary)',
                    color: 'var(--primary-white)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-light)',
                    minHeight: '48px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-medium)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-light)';
                  }}
                  title="Start new conversation"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">New Chat</span>
                </button>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={onShowSessionBrowser}
                    className="p-2 transition-all duration-200"
                    style={{
                      backgroundColor: currentView === 'sessions' ? 'var(--light-gray)' : 'transparent',
                      border: '1px solid var(--medium-gray)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-secondary)',
                      minHeight: '40px',
                      minWidth: '40px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.backgroundColor = 'var(--light-gray)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.backgroundColor = currentView === 'sessions' ? 'var(--light-gray)' : 'transparent';
                    }}
                    title="Browse sessions"
                  >
                    <History className="w-5 h-5" />
                  </button>

                  <button
                    onClick={onShowStarsBrowser}
                    className="p-2 transition-all duration-200"
                    style={{
                      backgroundColor: currentView === 'stars' ? 'var(--light-gray)' : 'transparent',
                      border: '1px solid var(--medium-gray)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-secondary)',
                      minHeight: '40px',
                      minWidth: '40px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.backgroundColor = 'var(--light-gray)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.backgroundColor = currentView === 'stars' ? 'var(--light-gray)' : 'transparent';
                    }}
                    title="Browse starred messages"
                  >
                    <Star className="w-5 h-5" />
                  </button>

                  <button
                    onClick={onShowTagBrowser}
                    className="p-2 transition-all duration-200"
                    style={{
                      backgroundColor: currentView === 'tags' ? 'var(--light-gray)' : 'transparent',
                      border: '1px solid var(--medium-gray)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-secondary)',
                      minHeight: '40px',
                      minWidth: '40px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.backgroundColor = 'var(--light-gray)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.backgroundColor = currentView === 'tags' ? 'var(--light-gray)' : 'transparent';
                    }}
                    title="Browse tags"
                  >
                    <Tag className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Settings/Profile */}
              <button
                onClick={onStartTour}
                className="p-2 transition-all duration-200"
                style={{
                  border: '1px solid var(--medium-gray)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent',
                  minHeight: '40px',
                  minWidth: '40px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.backgroundColor = 'var(--light-gray)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Start tour"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Offline Status */}
              <OfflineStatusBadge />
            </div>
          </div>

          {/* Continuous Mode Banner - Desktop */}
          {isContinuousMode && (
            <div className="mt-3 flex items-center justify-center">
              <div
                className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  borderColor: 'var(--accent-secondary)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"></div>
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                </div>
                <span>Live Conversation Mode Active</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Breadcrumb Navigation */}
      {showMobileLayout && showBreadcrumb && breadcrumbItems.length > 1 && (
        <MobileBreadcrumb items={breadcrumbItems} />
      )}

      {/* Hamburger Menu */}
      <MobileHamburgerMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onNewSession={onNewSession}
        onShowSessionBrowser={onShowSessionBrowser}
        onShowStarsBrowser={onShowStarsBrowser}
        onShowTagBrowser={onShowTagBrowser}
        onStartTour={onStartTour}
      />
    </>
  );
}