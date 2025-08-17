'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Hash } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface Tag {
  id: string;
  name: string;
  color: string;
  category?: string;
}

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: Tag[];
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export default function TagInput({
  tags,
  onTagsChange,
  availableTags = [],
  placeholder = "Add tags...",
  maxTags = 10,
  className = ""
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = availableTags.filter(tag => 
        tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !tags.includes(tag.name)
      ).slice(0, 5);
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [inputValue, availableTags, tags]);

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.toLowerCase().trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onTagsChange([...tags, trimmedTag]);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const getTagColor = (tagName: string): string => {
    const tag = availableTags.find(t => t.name === tagName);
    return tag?.color || '#3B82F6';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Tags Display and Input */}
      <div
        className="flex flex-wrap items-center gap-2 p-3 rounded-lg border transition-colors cursor-text"
        style={{
          backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
          borderColor: isOpen ? 'var(--accent-primary)' : 'var(--border-primary)'
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Existing Tags */}
        {tags.map((tag) => (
          <div
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: getTagColor(tag) + '20',
              color: getTagColor(tag),
              border: `1px solid ${getTagColor(tag)}40`
            }}
          >
            <Hash style={{ width: '12px', height: '12px' }} />
            <span>{tag}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-1 p-0.5 rounded-full hover:bg-current hover:bg-opacity-20 transition-colors"
            >
              <X style={{ width: '12px', height: '12px' }} />
            </button>
          </div>
        ))}

        {/* Input */}
        {tags.length < maxTags && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Plus 
              style={{ 
                width: '14px', 
                height: '14px',
                color: 'var(--text-tertiary)' 
              }} 
            />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setIsOpen(false), 150)}
              placeholder={tags.length === 0 ? placeholder : "Add another..."}
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-xl z-50 overflow-hidden"
          style={{
            backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-xl)'
          }}
        >
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              onClick={() => addTag(tag.name)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Hash style={{ width: '14px', height: '14px', color: tag.color }} />
                  <span className="font-medium">{tag.name}</span>
                  {tag.category && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--bg-quaternary)',
                        color: 'var(--text-tertiary)'
                      }}
                    >
                      {tag.category}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Tag Limit Indicator */}
      {tags.length >= maxTags && (
        <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Maximum {maxTags} tags reached
        </div>
      )}
    </div>
  );
}