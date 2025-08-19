'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from '@/app/components/Logo';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingStartTime] = useState(Date.now());
  const [loadingDuration, setLoadingDuration] = useState(0);
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Demo mode bypass for testing
  const isDemoMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Add timeout for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'loading') {
        const loadingTime = Date.now() - loadingStartTime;
        console.log(`AuthGuard: Timeout reached after ${loadingTime}ms, redirecting to signin`);
        setTimeoutReached(true);
        router.push('/auth/signin?timeout=true');
      }
    }, 8000); // Reduced to 8 second timeout

    return () => clearTimeout(timer);
  }, [status, router, loadingStartTime]);

  // Update loading duration counter
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setLoadingDuration(Date.now() - loadingStartTime);
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [status, loadingStartTime]);

  useEffect(() => {
    console.log('AuthGuard: status =', status, 'session =', !!session, 'demoMode =', isDemoMode);
    if (status === 'loading' && !isDemoMode) return; // Still loading

    if (!session && !isDemoMode) {
      console.log('AuthGuard: No session, redirecting to signin');
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router, isDemoMode]);

  if (status === 'loading' && !isDemoMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-sky-300/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-indigo-200/20 to-blue-100/25 rounded-full blur-3xl"></div>
        
        <div className="relative text-center space-y-8">
          <div className="flex justify-center">
            <Logo size="xl" variant="minimal" showText={false} />
          </div>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
              <p className="text-gray-600">Checking your authentication status</p>
              <p className="text-sm text-gray-500">
                {Math.round(loadingDuration / 100) / 10}s
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}