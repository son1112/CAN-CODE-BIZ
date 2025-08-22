'use client';

import React, { useState } from 'react';
import { Shield, Info, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { useContentSafety, type SafetyMode } from '@/contexts/ContentSafetyContext';

interface ContentSafetySettingsProps {
  isCompact?: boolean;
}

export default function ContentSafetySettings({ isCompact = false }: ContentSafetySettingsProps) {
  const { settings, updateSettings } = useContentSafety();
  const [isExpanded, setIsExpanded] = useState(false);

  const safetyModes: { mode: SafetyMode; label: string; description: string; icon: string }[] = [
    {
      mode: 'inform',
      label: 'Inform Only',
      description: 'Show warnings but allow all content through',
      icon: '💡'
    },
    {
      mode: 'review',
      label: 'Review Required',
      description: 'Pause and ask for approval when issues detected',
      icon: '⏸️'
    },
    {
      mode: 'filter',
      label: 'Auto Filter',
      description: 'Automatically remove or censor flagged content',
      icon: '🛡️'
    }
  ];

  const sensitivityLevels: { level: 'low' | 'medium' | 'high'; label: string; description: string }[] = [
    {
      level: 'low',
      label: 'Permissive',
      description: 'Only flag severe violations'
    },
    {
      level: 'medium',
      label: 'Balanced',
      description: 'Standard content safety detection'
    },
    {
      level: 'high',
      label: 'Strict',
      description: 'Flag potential issues more aggressively'
    }
  ];

  if (isCompact && !settings.enabled) {
    return (
      <button
        onClick={() => updateSettings({ enabled: true })}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
      >
        <Shield className="w-4 h-4 text-gray-500" />
        <span>Enable Content Safety</span>
      </button>
    );
  }

  return (
    <div className="content-safety-settings bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className={`w-5 h-5 ${settings.enabled ? 'text-blue-600' : 'text-gray-400'}`} />
            <h3 className="font-semibold text-gray-900">Content Safety</h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Main Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-medium text-gray-900">Enable Detection</div>
            <div className="text-sm text-gray-500">Monitor voice input for inappropriate content</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateSettings({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Expanded Settings */}
        {isExpanded && settings.enabled && (
          <div className="space-y-6 border-t pt-4">
            {/* Safety Mode Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Response Mode</span>
              </div>
              <div className="space-y-2">
                {safetyModes.map(({ mode, label, description, icon }) => (
                  <label key={mode} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="safetyMode"
                      value={mode}
                      checked={settings.mode === mode}
                      onChange={() => updateSettings({ mode })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="font-medium text-gray-900">{label}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Sensitivity Level */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">Detection Sensitivity</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {sensitivityLevels.map(({ level, label, description }) => (
                  <button
                    key={level}
                    onClick={() => updateSettings({ sensitivity: level })}
                    className={`p-3 text-center border rounded-lg transition-colors ${
                      settings.sensitivity === level
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{label}</div>
                    <div className="text-xs mt-1 opacity-75">{description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-blue-900 mb-1">What we detect:</div>
                  <div className="text-blue-800 space-y-1">
                    <div>• Violence, threats, and harmful language</div>
                    <div>• Hate speech and discriminatory content</div>
                    <div>• Profanity and explicit language</div>
                    <div>• Harassment and personal attacks</div>
                    <div>• Self-harm and dangerous content</div>
                    <div>• Inappropriate sexual content</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status when enabled but collapsed */}
        {!isExpanded && settings.enabled && (
          <div className="text-sm text-gray-500">
            Active: {safetyModes.find(m => m.mode === settings.mode)?.label} mode, {settings.sensitivity} sensitivity
          </div>
        )}
      </div>
    </div>
  );
}