'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
}

export default function ServiceWorkerRegistration() {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isOnline: true,
    updateAvailable: false
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if service workers are supported
    const isSupported = 'serviceWorker' in navigator;
    
    setStatus(prev => ({ 
      ...prev, 
      isSupported,
      isOnline: navigator.onLine 
    }));

    if (!isSupported) {
      logger.info('Service Worker not supported in this browser');
      return;
    }

    registerServiceWorker();
    setupOnlineOfflineListeners();
  }, []);

  const registerServiceWorker = async () => {
    try {
      logger.info('🦆 PWA: Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      setStatus(prev => ({ ...prev, isRegistered: true }));
      logger.info('✅ PWA: Service worker registered successfully');

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              setStatus(prev => ({ ...prev, updateAvailable: true }));
              logger.info('🔄 PWA: New service worker version available');
            }
          });
        }
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        logger.debug('📨 PWA: Message from service worker:', event.data);
      });

    } catch (error) {
      logger.error('❌ PWA: Service worker registration failed');
    }
  };

  const setupOnlineOfflineListeners = () => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      logger.info('🌐 PWA: Back online');
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      logger.info('📵 PWA: Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  const updateServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const waitingWorker = registration.waiting;
      
      if (waitingWorker) {
        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      logger.error('❌ PWA: Failed to update service worker');
    }
  };

  // Expose offline message queuing function globally
  useEffect(() => {
    if (status.isRegistered && typeof window !== 'undefined') {
      (window as any).queueOfflineMessage = async (messageData: any) => {
        try {
          const registration = await navigator.serviceWorker.ready;
          const controller = registration.active;
          
          if (controller) {
            controller.postMessage({
              type: 'QUEUE_OFFLINE_MESSAGE',
              message: messageData
            });
            logger.info('💾 PWA: Queued message for offline sync');
          }
        } catch (error) {
          logger.error('❌ PWA: Failed to queue offline message');
        }
      };
    }
  }, [status.isRegistered]);

  // Don't render anything visible - this is a service component
  return null;
}

// Hook to access PWA status
export function usePWAStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      logger.info('🏠 PWA: Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      logger.info('✅ PWA: App installed successfully');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        logger.info('✅ PWA: User accepted the install prompt');
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        logger.info('❌ PWA: User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      logger.error('❌ PWA: Install prompt failed');
      return false;
    }
  };

  return {
    isOnline,
    isInstallable,
    promptInstall
  };
}