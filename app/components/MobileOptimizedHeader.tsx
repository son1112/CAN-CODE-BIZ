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
        className="sticky top-0 px-6 py-4 backdrop-blur-md border-b-2 border-transparent z-50"
        style={{
          zIndex: 50,
          width: '100%',
          backgroundColor: isDark ? 'rgba(13, 13, 13, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: 'var(--border-primary)',
          boxShadow: 'var(--shadow-lg)',
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
          className="sticky top-0 px-4 py-3 backdrop-blur-md border-b-2 border-transparent z-50"
          style={{
            zIndex: 50,
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
          <div className="flex items-center justify-between min-w-0">
            {/* Left Side: Logo + Session Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Logo
                size={isMobile ? "md" : "lg"}
                showText={false}
                onClick={onNavigateToHome}
              />

              {/* Session Title - Mobile Optimized */}
              <div className="min-w-0 flex-1">
                {currentSession ? (
                  <div className="flex items-center gap-2 min-w-0">
                    {isContinuousMode && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"></div>
                      </div>
                    )}
                    <span
                      className={`font-semibold truncate text-sm ${
                        isMobile ? 'mobile-typography-sm' : ''
                      }`}
                      style={{
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        maxWidth: isMobile ? '140px' : '200px'
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
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {isMobile ? 'Chat' : 'New Conversation'}
                    </span>
                  </div>
                )}

                {/* Offline Status Badge */}
                {isMobile && (
                  <OfflineStatusBadge className="ml-2" />
                )}
              </div>
            </div>

            {/* Right Side: Theme Toggle + Hamburger Menu */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Mobile Theme Toggle */}
              <ThemeToggle />
              
              {/* Hamburger Menu Button */}
              <button
                onClick={toggleMenu}
                className="rounded-lg transition-all duration-200 p-2 touch-target"
                style={{
                  minWidth: '48px', // Larger touch target
                  minHeight: '48px',
                  backgroundColor: isMenuOpen ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: isMenuOpen ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Open menu"
              >
                <Menu
                  className="w-5 h-5"
                  style={{ color: isMenuOpen ? '#3b82f6' : 'var(--text-secondary)' }}
                />
              </button>
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
          className="sticky top-0 px-6 py-4 backdrop-blur-md border-b-2 border-transparent z-50"
          style={{
            zIndex: 50,
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
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left Side: Logo + Session Info */}
            <div className="flex items-center gap-6 min-w-0 flex-1">
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
            <div className="flex items-center gap-4">
              {/* Session Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onNewSession}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
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
                    className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: currentView === 'sessions' ? 'var(--bg-tertiary)' : 'transparent',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-secondary)'
                    }}
                    title="Browse sessions"
                  >
                    <History className="w-5 h-5" />
                  </button>

                  <button
                    onClick={onShowStarsBrowser}
                    className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: currentView === 'stars' ? 'var(--bg-tertiary)' : 'transparent',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-secondary)'
                    }}
                    title="Browse starred messages"
                  >
                    <Star className="w-5 h-5" />
                  </button>

                  <button
                    onClick={onShowTagBrowser}
                    className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: currentView === 'tags' ? 'var(--bg-tertiary)' : 'transparent',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-secondary)'
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
                className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)'
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