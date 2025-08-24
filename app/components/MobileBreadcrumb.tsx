'use client';

import { ChevronRight, Home, MessageCircle, History, Star, Hash, Settings } from 'lucide-react';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

interface BreadcrumbItem {
  label: string;
  icon?: React.ElementType;
  onClick?: () => void;
  isActive?: boolean;
}

interface MobileBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function MobileBreadcrumb({ items, className = '' }: MobileBreadcrumbProps) {
  const { isMobile, isTablet } = useMobileNavigation();

  if (!isMobile && !isTablet) return null;

  // Don't show breadcrumb if there's only one item
  if (items.length <= 1) return null;

  return (
    <div className={`flex items-center gap-1 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 ${className}`}>
      <div className="flex items-center gap-1 min-w-0">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1 min-w-0">
            {/* Breadcrumb Item */}
            <div
              className={`flex items-center gap-1.5 min-w-0 ${
                item.onClick ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors touch-target' : ''
              }`}
              onClick={item.onClick}
              style={{
                minHeight: item.onClick ? '48px' : '32px', // Larger touch targets
                minWidth: item.onClick ? '48px' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {item.icon && (
                <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${
                  item.isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
              )}
              <span className={`text-sm font-medium truncate mobile-typography-sm ${
                item.isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300'
              }`} style={{ maxWidth: '80px' }}>
                {item.label}
              </span>
            </div>

            {/* Separator */}
            {index < items.length - 1 && (
              <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Predefined breadcrumb items for common navigation
export const BREADCRUMB_ITEMS = {
  home: { label: 'Home', icon: Home },
  chat: { label: 'Chat', icon: MessageCircle },
  sessions: { label: 'Sessions', icon: History },
  stars: { label: 'Starred', icon: Star },
  tags: { label: 'Tags', icon: Hash },
  settings: { label: 'Settings', icon: Settings },
};