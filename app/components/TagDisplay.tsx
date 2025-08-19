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
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      case 'md':
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return '10px';
      case 'lg':
        return '16px';
      case 'md':
      default:
        return '12px';
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {tags.map((tag) => (
        <div
          key={tag}
          className={`inline-flex items-center gap-1 rounded-full font-medium transition-all duration-200 ${
            onTagClick ? 'cursor-pointer hover:scale-105' : ''
          } ${getSizeClasses()}`}
          style={{
            backgroundColor: getTagColor(tag) + '20',
            color: getTagColor(tag),
            border: `1px solid ${getTagColor(tag)}40`
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
              className="ml-1 p-0.5 rounded-full hover:bg-current hover:bg-opacity-20 transition-colors"
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