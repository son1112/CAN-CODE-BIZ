'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { User, Mail, Calendar, LogOut, ArrowLeft, Settings, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import AuthGuard from '@/app/components/auth/AuthGuard';
import Logo from '@/app/components/Logo';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDeleteAccount = async () => {
    try {
      // Here you would implement account deletion logic
      // For now, we'll just sign them out
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-sky-300/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-indigo-200/20 to-blue-100/25 rounded-full blur-3xl"></div>

        {/* Header */}
        <div className="relative flex items-center justify-between px-8 py-6 bg-white/95 backdrop-blur-xl border-b border-blue-200/50 shadow-lg shadow-blue-900/5">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Chat</span>
            </Link>
            <Logo size="md" />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </div>

        {/* Profile Content */}
        <div className="relative max-w-4xl mx-auto px-8 py-12">
          <div className="bg-white/95 backdrop-blur-xl border border-blue-200/50 rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 px-8 py-12 text-white">
              <div className="flex items-center gap-8">
                <div className="relative">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={120}
                      height={120}
                      className="rounded-full border-4 border-white/20 shadow-2xl"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl">
                      <User className="w-12 h-12 text-white/80" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <h1 className="text-4xl font-bold">{session?.user?.name || 'User'}</h1>
                  <p className="text-xl text-white/80 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    {session?.user?.email}
                  </p>
                  <div className="flex items-center gap-2 text-white/70">
                    <Calendar className="w-5 h-5" />
                    <span>Member since {formatDate(new Date().toISOString())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-8 space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                {/* Account Information */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                    Account Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        {session?.user?.name || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Address</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        {session?.user?.email || 'Not provided'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Account Type</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        OAuth User (Google)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">
                    Usage Statistics
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-xl border border-blue-200/50">
                      <div className="text-3xl font-bold text-blue-700">0</div>
                      <div className="text-sm text-blue-600 font-medium">Total Conversations</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200/50">
                      <div className="text-3xl font-bold text-yellow-700">0</div>
                      <div className="text-sm text-yellow-600 font-medium">Voice Messages</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200/50">
                      <div className="text-3xl font-bold text-green-700">Today</div>
                      <div className="text-sm text-green-600 font-medium">Last Activity</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Actions</h2>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    <Settings className="w-4 h-4" />
                    Manage Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Account</h3>
                  <p className="text-gray-600">
                    Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}