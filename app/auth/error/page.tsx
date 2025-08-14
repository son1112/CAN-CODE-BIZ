'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Logo from '@/app/components/Logo';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          description: 'There is a problem with the server configuration. Please contact support.'
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to sign in with this account.'
        };
      case 'Verification':
        return {
          title: 'Verification Error',
          description: 'The verification token has expired or has already been used.'
        };
      default:
        return {
          title: 'Authentication Error',
          description: 'An error occurred during authentication. Please try again.'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-sky-300/15 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-indigo-200/20 to-blue-100/25 rounded-full blur-3xl"></div>
      
      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 border border-blue-200/50 p-8 text-center">
          {/* Header */}
          <div className="space-y-6 mb-8">
            <div className="flex justify-center">
              <Logo size="lg" variant="minimal" showText={false} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{errorInfo.title}</h1>
              <p className="text-gray-600 mt-2">{errorInfo.description}</p>
            </div>
          </div>

          {/* Error Details */}
          {error && (
            <div className="mb-8 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-2xl">
              <div className="flex items-center justify-center gap-3 text-red-800 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0" />
                <span className="font-medium">Error code: {error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/auth/signin"
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl font-semibold transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
              Go Home
            </Link>
          </div>

          {/* Support Link */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Need help?{' '}
              <a href="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}