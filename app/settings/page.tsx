'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useUserPreferences, UserPreferences } from '@/hooks/useUserPreferences';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  Mic, 
  Moon, 
  Sun, 
  Globe, 
  Save,
  Settings as SettingsIcon
} from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/app/components/auth/AuthGuard';
import Logo from '@/app/components/Logo';


export default function SettingsPage() {
  const { status } = useSession();
  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    updatePreferences,
    savePreferences,
    isModified
  } = useUserPreferences();
  
  const [isSaving, setIsSaving] = useState(false);

  if (status === 'loading' || preferencesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">Failed to load settings</p>
          {preferencesError && <p className="text-sm text-gray-600">{preferencesError}</p>}
        </div>
      </div>
    );
  }

  const updateSettings = (category: keyof UserPreferences, key: string, value: string | boolean | number) => {
    updatePreferences({
      [category]: {
        ...preferences[category],
        [key]: value,
      },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePreferences();
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
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
            <h1 
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <SettingsIcon className="w-6 h-6" />
              Settings
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200"
            >
              <User className="w-4 h-4" />
              <span className="font-medium">Profile</span>
            </Link>
          </div>
        </div>

        {/* Settings Content */}
        <div className="relative max-w-6xl mx-auto px-8 py-12">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Notifications Settings */}
            <div className="bg-white/95 backdrop-blur-xl border border-blue-200/50 rounded-3xl shadow-2xl shadow-blue-900/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Sound Effects</h3>
                    <p className="text-sm text-gray-600">Play sounds for interactions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.notifications.soundEffects}
                      onChange={(e) => updateSettings('notifications', 'soundEffects', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Voice Alerts</h3>
                    <p className="text-sm text-gray-600">Audio feedback for voice input</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.notifications.voiceAlerts}
                      onChange={(e) => updateSettings('notifications', 'voiceAlerts', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">System Notifications</h3>
                    <p className="text-sm text-gray-600">Browser notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.notifications.systemNotifications}
                      onChange={(e) => updateSettings('notifications', 'systemNotifications', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Voice Settings */}
            <div className="bg-white/95 backdrop-blur-xl border border-blue-200/50 rounded-3xl shadow-2xl shadow-blue-900/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Mic className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Voice Input</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Auto-Send</h3>
                    <p className="text-sm text-gray-600">Automatically send after silence</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.voice.autoSend}
                      onChange={(e) => updateSettings('voice', 'autoSend', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Silence Threshold</h3>
                    <span className="text-sm font-medium text-gray-600">{preferences.voice.silenceThreshold}s</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={preferences.voice.silenceThreshold}
                    onChange={(e) => updateSettings('voice', 'silenceThreshold', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1s</span>
                    <span>10s</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Voice Quality</h3>
                  <div className="space-y-2">
                    {(['low', 'medium', 'high'] as const).map((quality) => (
                      <label key={quality} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="voiceQuality"
                          value={quality}
                          checked={preferences.voice.voiceQuality === quality}
                          onChange={(e) => updateSettings('voice', 'voiceQuality', e.target.value)}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-900 capitalize">{quality} Quality</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-white/95 backdrop-blur-xl border border-blue-200/50 rounded-3xl shadow-2xl shadow-blue-900/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Sun className="w-6 h-6 text-yellow-600" />
                <h2 className="text-2xl font-bold text-gray-900">Display</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Theme</h3>
                  <div className="space-y-2">
                    {(['light', 'dark', 'system'] as const).map((theme) => (
                      <label key={theme} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value={theme}
                          checked={preferences.display.theme === theme}
                          onChange={(e) => updateSettings('display', 'theme', e.target.value)}
                          className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 focus:ring-yellow-500"
                        />
                        <span className="text-sm text-gray-900 capitalize flex items-center gap-2">
                          {theme === 'light' && <Sun className="w-4 h-4" />}
                          {theme === 'dark' && <Moon className="w-4 h-4" />}
                          {theme === 'system' && <Globe className="w-4 h-4" />}
                          {theme} Theme
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Language</h3>
                  <select
                    value={preferences.display.language}
                    onChange={(e) => updateSettings('display', 'language', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Reduced Motion</h3>
                    <p className="text-sm text-gray-600">Minimize animations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.display.reducedMotion}
                      onChange={(e) => updateSettings('display', 'reducedMotion', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white/95 backdrop-blur-xl border border-blue-200/50 rounded-3xl shadow-2xl shadow-blue-900/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Privacy</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Save Conversations</h3>
                    <p className="text-sm text-gray-600">Store chat history</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.privacy.saveConversations}
                      onChange={(e) => updateSettings('privacy', 'saveConversations', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Share Usage Data</h3>
                    <p className="text-sm text-gray-600">Help improve the app</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.privacy.shareUsageData}
                      onChange={(e) => updateSettings('privacy', 'shareUsageData', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Show Online Status</h3>
                    <p className="text-sm text-gray-600">Let others see when you&apos;re active</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.privacy.showOnlineStatus}
                      onChange={(e) => updateSettings('privacy', 'showOnlineStatus', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-12 text-center">
            <button
              onClick={handleSave}
              disabled={isSaving || !isModified}
              className={`inline-flex items-center gap-3 px-8 py-4 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-lg ${
                isModified 
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/25' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : isModified ? (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  No Changes to Save
                </>
              )}
            </button>
            {preferencesError && (
              <div className="mt-4 text-red-600 text-sm">
                Error: {preferencesError}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}