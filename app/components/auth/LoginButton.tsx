'use client';

import { signIn, useSession } from 'next-auth/react';
import { User } from 'lucide-react';

interface LoginButtonProps {
  className?: string;
}

export default function LoginButton({ className = '' }: LoginButtonProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className={`p-3 rounded-xl ${className}`}>
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session) {
    return null; // Don't show login button if user is already logged in
  }

  return (
    <button
      onClick={() => signIn('google', { callbackUrl: '/' })}
      className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${className}`}
      title="Sign in with Google"
    >
      <User className="w-4 h-4" />
      <span className="hidden sm:inline">Sign In</span>
    </button>
  );
}