'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ScrollNavigationProps {
  containerRef?: React.RefObject<HTMLElement>;
}

export default function ScrollNavigation({ containerRef }: ScrollNavigationProps) {
  const [showButtons, setShowButtons] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const container = containerRef?.current || document.documentElement;
    
    const checkScrollPosition = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      const atTop = scrollTop <= 10;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      
      setIsAtTop(atTop);
      setIsAtBottom(atBottom);
      
      // Show buttons if there's scrollable content (very lenient threshold)
      const hasScrollableContent = scrollHeight > clientHeight + 5;
      // Force show if content height is substantial (like when there are messages)
      const forceShow = scrollHeight > 500; // Show if content is tall enough
      setShowButtons(hasScrollableContent || forceShow);
    };

    const handleScroll = () => {
      checkScrollPosition();
    };

    // Check initial position after a small delay to ensure content is rendered
    setTimeout(() => {
      checkScrollPosition();
    }, 100);

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [containerRef]);

  const scrollToTop = () => {
    const container = containerRef?.current || document.documentElement;
    container.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    const container = containerRef?.current || document.documentElement;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  };

  if (!showButtons) return null;

  return (
    <div className="fixed right-6 bottom-32 z-50 flex flex-col gap-2">
      {/* Jump to Top */}
      {(!isAtTop || (isAtTop && isAtBottom)) && (
        <button
          onClick={scrollToTop}
          className="group rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
            borderColor: 'var(--border-primary)',
            border: '1px solid'
          }}
          title="Jump to top"
        >
          <ChevronUp 
            className="w-5 h-5 transition-colors duration-200"
            style={{ 
              color: 'var(--text-secondary)'
            }}
          />
          <div 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-200"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
        </button>
      )}

      {/* Jump to Bottom */}
      {(!isAtBottom || (isAtTop && isAtBottom)) && (
        <button
          onClick={scrollToBottom}
          className="group rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
            borderColor: 'var(--border-primary)',
            border: '1px solid'
          }}
          title="Jump to bottom"
        >
          <ChevronDown 
            className="w-5 h-5 transition-colors duration-200"
            style={{ 
              color: 'var(--text-secondary)'
            }}
          />
          <div 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-200"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
        </button>
      )}
    </div>
  );
}