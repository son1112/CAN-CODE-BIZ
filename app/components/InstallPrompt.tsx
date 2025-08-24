'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { usePWAStatus } from './ServiceWorkerRegistration';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';
import { logger } from '@/lib/logger';

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function InstallPrompt({ onInstall, onDismiss, className = '' }: InstallPromptProps) {
  const { isInstallable, promptInstall } = usePWAStatus();
  const { isMobile, isTablet } = useMobileNavigation();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      if (dismissedTime > oneWeekAgo) {
        setIsDismissed(true);
        return;
      }
    }

    // Show prompt after a short delay if installable and not dismissed
    if (isInstallable && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isDismissed]);

  const handleInstall = async () => {
    try {
      const success = await promptInstall();
      if (success) {
        setIsVisible(false);
        onInstall?.();
        logger.info('✅ PWA: App installed successfully');
      }
    } catch (error) {
      logger.error('❌ PWA: Install failed');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onDismiss?.();
    logger.info('❌ PWA: Install prompt dismissed');
  };

  if (!isVisible || !isInstallable) {
    return null;
  }

  const isMobileDevice = isMobile || isTablet;

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white rounded-2xl shadow-2xl backdrop-blur-sm border border-blue-500/20 animate-slide-up">
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                {isMobileDevice ? (
                  <Smartphone className="w-6 h-6 text-white" />
                ) : (
                  <Monitor className="w-6 h-6 text-white" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-white">
                  🦆 Install Rubber Ducky Live
                </h3>
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors ml-2 touch-target"
                  aria-label="Dismiss install prompt"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>

              <p className="text-blue-100 text-sm mb-4 leading-relaxed">
                {isMobileDevice 
                  ? "Add our app to your home screen for a faster, app-like experience with offline support!"
                  : "Install our desktop app for quick access and better performance!"
                }
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="flex items-center gap-2 text-blue-100">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Offline support</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Faster loading</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Native feel</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Easy access</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-white text-blue-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-lg touch-target"
                >
                  <Download className="w-4 h-4" />
                  <span>{isMobileDevice ? 'Add to Home' : 'Install App'}</span>
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 rounded-xl text-blue-100 hover:bg-white/10 transition-colors text-sm font-medium touch-target"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="h-1 bg-blue-800 rounded-b-2xl">
          <div className="h-full bg-gradient-to-r from-blue-300 to-blue-400 rounded-b-2xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

// Floating install button for persistent access
export function InstallButton({ className = '' }: { className?: string }) {
  const { isInstallable, promptInstall } = usePWAStatus();
  const [isHovered, setIsHovered] = useState(false);

  if (!isInstallable) return null;

  const handleInstall = async () => {
    try {
      await promptInstall();
    } catch (error) {
      logger.error('❌ PWA: Install button failed');
    }
  };

  return (
    <button
      onClick={handleInstall}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-4 right-4 z-40 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 touch-target ${className}`}
      style={{
        padding: '12px',
        background: isHovered 
          ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
          : 'linear-gradient(135deg, #3b82f6, #2563eb)'
      }}
      title="Install Rubber Ducky Live"
      aria-label="Install app"
    >
      <Download className="w-5 h-5" />
      
      {/* Pulse animation when available */}
      <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping"></div>
    </button>
  );
}

// Custom CSS for slide-up animation
const slideUpKeyframes = `
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
`;

// Inject CSS
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = slideUpKeyframes;
  document.head.appendChild(style);
}