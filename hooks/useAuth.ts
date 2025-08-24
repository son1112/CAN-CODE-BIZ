import { useSession } from 'next-auth/react';

/**
 * Hook to get current user authentication state and ID
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const isDemoMode = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // After migration, always use the real user ID for data consistency
  // Demo mode still works but accesses the same data
  const userId = isDemoMode ? '68a33c99df2098d5e02a84e3' : session?.user?.id || null;

  return {
    userId,
    isAuthenticated: !!userId,
    isLoading: status === 'loading',
    isDemoMode,
    session
  };
}