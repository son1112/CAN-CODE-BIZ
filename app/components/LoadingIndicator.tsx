'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface LoadingIndicatorProps {
  type?: 'spinner' | 'dots' | 'thinking';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

export default function LoadingIndicator({ 
  type = 'thinking', 
  size = 'medium', 
  message,
  className = '' 
}: LoadingIndicatorProps) {
  const { isDark } = useTheme();

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6', 
    large: 'w-8 h-8'
  };

  const renderSpinner = () => (
    <div 
      className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${className}`}
      style={{
        borderColor: 'var(--border-secondary)',
        borderTopColor: 'transparent'
      }}
    />
  );

  const renderDots = () => (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-full animate-pulse ${size === 'small' ? 'w-1 h-1' : size === 'medium' ? 'w-2 h-2' : 'w-3 h-3'}`}
          style={{
            backgroundColor: 'var(--text-tertiary)',
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );

  const renderThinking = () => (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Rubber Ducky icon with gentle bounce */}
      <div className="relative">
        <div 
          className="text-2xl animate-bounce"
          style={{ 
            animationDuration: '2s',
            animationIterationCount: 'infinite'
          }}
        >
          🦆
        </div>
        {/* Thinking bubbles */}
        <div className="absolute -top-1 -right-1">
          <div className="flex space-x-0.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full animate-pulse"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Animated thinking dots */}
      <div className="flex items-center space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: 'var(--text-tertiary)',
              animationDelay: `${i * 0.4}s`,
              animationDuration: '1.6s'
            }}
          />
        ))}
      </div>
    </div>
  );

  const renderIndicator = () => {
    switch (type) {
      case 'spinner':
        return renderSpinner();
      case 'dots':
        return renderDots();
      case 'thinking':
      default:
        return renderThinking();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderIndicator()}
      {message && (
        <p 
          className="text-sm animate-pulse"
          style={{ color: 'var(--text-secondary)' }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

// Specific loading states for different contexts
export function SessionLoadingIndicator() {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingIndicator 
        type="thinking" 
        message="Loading session..." 
        size="medium"
      />
    </div>
  );
}

export function ChatThinkingIndicator() {
  return (
    <div className="flex items-start space-x-3 p-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary)' }}>
          <span className="text-white text-sm font-medium">🦆</span>
        </div>
      </div>
      <div className="flex-1 pt-1">
        <LoadingIndicator 
          type="thinking" 
          message="Rubber Ducky is thinking..." 
          size="small"
        />
      </div>
    </div>
  );
}

export function SessionOperationIndicator({ operation }: { operation: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <LoadingIndicator 
        type="spinner" 
        message={operation} 
        size="small"
      />
    </div>
  );
}