'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 glass-card hover-lift-subtle transition-can-code group"
      style={{
        backgroundColor: isDark ? 'rgba(45, 45, 45, 0.95)' : 'rgba(248, 249, 250, 0.95)',
        borderColor: 'var(--medium-gray)',
        border: '1px solid',
        borderRadius: 'var(--radius-md)',
        minWidth: '40px',
        minHeight: '40px'
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <Sun
          className={`absolute inset-0 ${
            isDark ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
          }`}
          style={{
            color: 'var(--text-secondary)',
            width: '20px',
            height: '20px',
            transition: `all var(--duration-slow) var(--easing-default)`
          }}
        />

        {/* Moon icon */}
        <Moon
          className={`absolute inset-0 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
          }`}
          style={{
            color: 'var(--text-secondary)',
            width: '20px',
            height: '20px',
            transition: `all var(--duration-slow) var(--easing-default)`
          }}
        />
      </div>

      {/* Hover effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-all duration-300"
        style={{ 
          backgroundColor: isDark ? 'var(--accent-secondary)' : 'var(--accent-primary)',
        }}
      />
    </button>
  );
}