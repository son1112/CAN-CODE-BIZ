'use client';

import { Fragment, useState } from 'react';
import { X, Settings, RefreshCw, Plus, User, LogOut, History, Star, Hash, Palette, Sun, Moon, Monitor, HelpCircle, Share2, Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';
import { useSession } from '@/contexts/SessionContext';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { useButtonHaptics, useNavigationHaptics } from '@/hooks/useHapticFeedback';
import ModelSelector from './ModelSelector';
import { AppShare } from './WebShare';
import MobileShortcutsHelp from './MobileShortcutsHelp';

interface MobileHamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSession: () => void;
  onShowSessionBrowser: () => void;
  onShowStarsBrowser: () => void;
  onShowTagBrowser: () => void;
  onStartTour: () => void;
}

export default function MobileHamburgerMenu({
  isOpen,
  onClose,
  onNewSession,
  onShowSessionBrowser,
  onShowStarsBrowser,
  onShowTagBrowser,
  onStartTour,
}: MobileHamburgerMenuProps) {
  const { theme, toggleTheme } = useTheme();
  const { userId } = useAuth();
  const { currentSession } = useSession();
  const { isMobile } = useMobileNavigation();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const { onPress, onLongPress, onSuccess, onError } = useButtonHaptics();
  const { onSelect, onSwipe, onBoundary } = useNavigationHaptics();

  if (!isOpen) return null;

  const handleNewSession = () => {
    onNewSession();
    onPress();
    onClose();
  };

  const handleSessionBrowser = () => {
    onShowSessionBrowser();
    onSelect();
    onClose();
  };

  const handleStarsBrowser = () => {
    onShowStarsBrowser();
    onSelect();
    onClose();
  };

  const handleTagBrowser = () => {
    onShowTagBrowser();
    onSelect();
    onClose();
  };

  const handleTour = () => {
    onStartTour();
    onPress();
    onClose();
  };

  const handleShowShortcuts = () => {
    setShowShortcutsHelp(true);
    onPress();
  };

  const handleRefresh = () => {
    window.location.reload();
    onPress();
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
    onPress();
    onClose();
  };

  const handleShare = () => {
    // The AppShare component handles the sharing logic internally
    // We just need to close the menu after interaction
    onPress();
    onClose();
  };

  const menuItems = [
    {
      icon: Plus,
      label: 'New Conversation',
      onClick: handleNewSession,
      color: '#10b981'
    },
    {
      icon: History,
      label: 'Session Browser',
      onClick: handleSessionBrowser,
      color: '#3b82f6'
    },
    {
      icon: Star,
      label: 'Starred Messages',
      onClick: handleStarsBrowser,
      color: '#f59e0b'
    },
    {
      icon: Hash,
      label: 'Tag Browser',
      onClick: handleTagBrowser,
      color: '#8b5cf6'
    },
    {
      icon: Share2,
      label: 'Share App',
      onClick: handleShare,
      color: '#10b981',
      isCustom: true // Flag to render custom component
    },
    {
      icon: RefreshCw,
      label: 'Refresh App',
      onClick: handleRefresh,
      color: '#6b7280'
    },
    {
      icon: HelpCircle,
      label: 'App Tour',
      onClick: handleTour,
      color: '#06b6d4'
    },
    {
      icon: Zap,
      label: 'Keyboard Shortcuts',
      onClick: handleShowShortcuts,
      color: '#f59e0b'
    },
  ];

  const themeOptions = [
    { icon: Sun, label: 'Light', value: 'light' },
    { icon: Moon, label: 'Dark', value: 'dark' },
    { icon: Monitor, label: 'System', value: 'system' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      data-mobile-menu
    >
      {/* Slide-in menu */}
      <div
        className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out"
        style={{
          boxShadow: '-10px 0 25px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {userId && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <div className={`font-semibold text-gray-900 dark:text-white text-sm ${
                isMobile ? 'mobile-typography-sm' : ''
              }`}>
                {userId ? 'Menu' : 'Rubber Ducky Live'}
              </div>
              {currentSession && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-48">
                  {currentSession.name}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              onPress();
              onClose();
            }}
            className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
            style={{
              minWidth: '44px',
              minHeight: '44px'
            }}
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            // Special handling for the share item
            if (item.isCustom && item.label === 'Share App') {
              return (
                <div key={index} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: item.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                    <AppShare className="ml-2" />
                  </div>
                </div>
              );
            }

            return (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: item.color }}
                  />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Model Selector */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                AI Model
              </span>
            </div>
            <div className="ml-11">
              <ModelSelector size="sm" />
            </div>
          </div>

          {/* Theme Selector */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                Theme
              </span>
            </div>
            <div className="ml-11 space-y-1">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      toggleTheme();
                      onPress();
                    }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        {userId && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Shortcuts Help Modal */}
      <MobileShortcutsHelp
        isVisible={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
}