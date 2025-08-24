'use client';

import { Hash, X } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
  category?: string;
}

interface TagDisplayProps {
  tags: string[];
  availableTags?: Tag[];
  onTagClick?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  className?: string;
}

export default function TagDisplay({
  tags,
  availableTags = [],
  onTagClick,
  onTagRemove,
  size = 'md',
  removable = false,
  className = ""
}: TagDisplayProps) {

  if (!tags || tags.length === 0) return null;

  const getTagColor = (tagName: string): string => {
    const tag = availableTags.find(t => t.name === tagName);
    return tag?.color || '#3B82F6';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      case 'md':
      default:
        return 'px-3 py-2 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return '12px';
      case 'lg':
        return '18px';
      case 'md':
      default:
        return '14px';
    }
  };

  const getRemoveButtonSize = () => {
    switch (size) {
      case 'sm':
        return { minWidth: '24px', minHeight: '24px', padding: '4px' };
      case 'lg':
        return { minWidth: '28px', minHeight: '28px', padding: '6px' };
      case 'md':
      default:
        return { minWidth: '26px', minHeight: '26px', padding: '5px' };
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {tags.map((tag) => (
        <div
          key={tag}
          className={`inline-flex items-center gap-1 rounded-full font-medium transition-all duration-200 ${
            onTagClick ? 'cursor-pointer hover:scale-105 touch-target' : ''
          } ${getSizeClasses()}`}
          style={{
            backgroundColor: getTagColor(tag) + '20',
            color: getTagColor(tag),
            border: `1px solid ${getTagColor(tag)}40`,
            minHeight: onTagClick ? '44px' : 'auto'
          }}
          onClick={() => onTagClick?.(tag)}
          title={`Tag: ${tag}`}
        >
          <Hash style={{ width: getIconSize(), height: getIconSize() }} />
          <span>{tag}</span>
          {removable && onTagRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTagRemove(tag);
              }}
              className="ml-1 rounded-full hover:bg-current hover:bg-opacity-20 transition-colors touch-target flex items-center justify-center"
              style={getRemoveButtonSize()}
              title={`Remove ${tag} tag`}
            >
              <X style={{ width: getIconSize(), height: getIconSize() }} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}