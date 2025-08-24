'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-xl transition-all duration-200 group"
      style={{
        backgroundColor: isDark ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)',
        border: '1px solid'
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <Sun
          className={`absolute inset-0 transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
          }`}
          style={{
            color: 'var(--text-secondary)',
            width: '20px',
            height: '20px'
          }}
        />

        {/* Moon icon */}
        <Moon
          className={`absolute inset-0 transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
          }`}
          style={{
            color: 'var(--text-secondary)',
            width: '20px',
            height: '20px'
          }}
        />
      </div>

      {/* Hover effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ backgroundColor: 'var(--accent-primary)', opacity: '0.1' }}
      />
    </button>
  );
}