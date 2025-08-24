'use client';

import React from 'react';
import { WifiOff, RefreshCw, MessageCircle, Zap } from 'lucide-react';
import Logo from '../components/Logo';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (navigator.onLine) {
      router.push('/');
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="xl" showText={false} />
        </div>

        {/* Offline Icon */}
        <div className="relative">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
            <WifiOff className="w-10 h-10 text-gray-500" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-800">
            🦆 You're Offline
          </h1>
          <p className="text-gray-600 leading-relaxed">
            No worries! Your rubber duck is still here to help. Some features may be limited without an internet connection.
          </p>
        </div>

        {/* Features available offline */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Available Offline
          </h2>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Browse cached conversations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>View starred messages</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Draft messages (will sync when online)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Voice input (will queue until online)</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg touch-target"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-white text-blue-700 px-6 py-2.5 rounded-xl font-medium hover:bg-blue-50 transition-colors border border-blue-200 flex items-center justify-center gap-2 touch-target"
          >
            <MessageCircle className="w-4 h-4" />
            Continue Offline
          </button>
        </div>

        {/* Connection status */}
        <div className="text-xs text-gray-500 bg-gray-100/50 rounded-lg p-3">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${navigator?.onLine ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span>
              {typeof navigator !== 'undefined' && navigator.onLine 
                ? 'Connection restored! Tap "Try Again"' 
                : 'No internet connection detected'
              }
            </span>
          </div>
        </div>

        {/* Tips */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>💡 Tip: Your messages will sync automatically when you're back online</p>
          <p>🔄 Pull down to refresh or check your connection</p>
        </div>
      </div>
    </div>
  );
}