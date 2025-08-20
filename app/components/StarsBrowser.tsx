'use client';

import { useState } from 'react';
import { X, Search, Filter, Star } from 'lucide-react';
import { StarDocument, StarableType } from '@/models/Star';
import { useStars } from '@/hooks/useStars';
import { getStarIcon, getStarDisplayName, getPriorityColor, getPriorityIcon } from '@/lib/stars';
import { useTheme } from '@/contexts/ThemeContext';

interface StarsBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSelectStar?: (star: StarDocument) => void;
}

export default function StarsBrowser({
  isOpen,
  onClose,
  userId,
  onSelectStar,
}: StarsBrowserProps) {
  const { isDark } = useTheme();
  const { stars, isLoading, unstarItem } = useStars(userId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<StarableType | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'all'>('all');
  const [sortBy] = useState<'starredAt' | 'lastAccessedAt' | 'priority'>('starredAt');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort stars
  const filteredStars = (stars || [])
    .filter(star => {
      // Type filter
      if (selectedType !== 'all' && star.itemType !== selectedType) return false;
      
      // Priority filter
      if (selectedPriority !== 'all' && star.priority !== selectedPriority) return false;
      
      // Search filter
      if (searchQuery) {
        const searchContent = [
          star.context?.title,
          star.context?.description,
          star.context?.messageContent,
          star.tags?.join(' '),
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchContent.includes(searchQuery.toLowerCase())) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'starredAt':
          return new Date(b.starredAt).getTime() - new Date(a.starredAt).getTime();
        case 'lastAccessedAt':
          return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2);
        default:
          return 0;
      }
    });

  const starTypes: Array<{ value: StarableType | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All Items', icon: '⭐' },
    { value: 'message', label: 'Messages', icon: '💬' },
    { value: 'session', label: 'Sessions', icon: '📝' },
    { value: 'agent', label: 'Agents', icon: '🤖' },
    { value: 'conversation-starter', label: 'Starters', icon: '💡' },
    { value: 'code-snippet', label: 'Code', icon: '💻' },
  ];

  const priorityOptions = [
    { value: 'all' as const, label: 'All Priorities', icon: '⚪' },
    { value: 'high' as const, label: 'High Priority', icon: '🔴' },
    { value: 'medium' as const, label: 'Medium Priority', icon: '🟡' },
    { value: 'low' as const, label: 'Low Priority', icon: '🟢' },
  ];

  const handleUnstar = async (star: StarDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    await unstarItem(star.itemType, star.itemId);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const getStarPreview = (star: StarDocument) => {
    switch (star.itemType) {
      case 'message':
        return star.context?.messageContent?.slice(0, 100) + '...' || 'Message content';
      case 'session':
        return star.context?.title || 'Chat Session';
      case 'agent':
        return star.context?.description || 'AI Agent';
      case 'conversation-starter':
        return star.context?.snippet || 'Conversation starter';
      case 'code-snippet':
        return star.context?.snippet || 'Code snippet';
      default:
        return 'Starred item';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative flex h-full items-center justify-center p-4">
        <div 
          className="relative w-full max-w-4xl h-[80vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
          style={{
            backgroundColor: isDark ? 'var(--bg-primary)' : 'white',
            borderColor: 'var(--border-primary)'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between border-b flex-shrink-0"
            style={{
              padding: '20px 24px',
              borderColor: 'var(--border-primary)',
              backgroundColor: isDark ? 'var(--bg-secondary)' : 'var(--bg-secondary)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6" style={{ color: '#eab308' }} fill="currentColor" />
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Starred Items
                </h2>
              </div>
              <span 
                className="px-2 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)'
                }}
              >
                {filteredStars.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: showFilters ? 'var(--bg-tertiary)' : 'transparent',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Filter style={{ width: '16px', height: '16px' }} />
                Filters
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-colors"
                style={{
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div 
              className="border-b p-4 flex-shrink-0"
              style={{
                borderColor: 'var(--border-primary)',
                backgroundColor: isDark ? 'var(--bg-secondary)' : 'var(--bg-secondary)'
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Search
                  </label>
                  <div className="relative">
                    <Search 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                      style={{ color: 'var(--text-tertiary)' }}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search starred items..."
                      className="w-full pl-10 pr-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: isDark ? 'var(--bg-primary)' : 'white',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as StarableType | 'all')}
                    className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: isDark ? 'var(--bg-primary)' : 'white',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {starTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Priority
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as 'low' | 'medium' | 'high' | 'all')}
                    className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: isDark ? 'var(--bg-primary)' : 'white',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {priorityOptions.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.icon} {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div 
                    className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-2"
                    style={{ borderColor: 'var(--accent-primary)' }}
                  />
                  <p style={{ color: 'var(--text-secondary)' }}>Loading starred items...</p>
                </div>
              </div>
            ) : filteredStars.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    No starred items found
                  </p>
                  <p style={{ color: 'var(--text-tertiary)' }}>
                    Start starring messages, sessions, or agents to see them here
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStars.map((star) => (
                  <div
                    key={star.starId}
                    className="group border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg"
                    style={{
                      backgroundColor: isDark ? 'var(--bg-secondary)' : 'white',
                      borderColor: 'var(--border-primary)'
                    }}
                    onClick={() => onSelectStar?.(star)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg">{getStarIcon(star.itemType)}</span>
                          <span 
                            className="text-sm font-medium px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {getStarDisplayName(star.itemType)}
                          </span>
                          {star.priority && star.priority !== 'medium' && (
                            <span 
                              className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(star.priority)}`}
                            >
                              {getPriorityIcon(star.priority)} {star.priority}
                            </span>
                          )}
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            {formatDate(star.starredAt)}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="mb-2">
                          {star.context?.title && (
                            <h4 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                              {star.context.title}
                            </h4>
                          )}
                          <p 
                            className="text-sm line-clamp-2"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {getStarPreview(star)}
                          </p>
                        </div>

                        {/* Tags */}
                        {star.tags && star.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {star.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 rounded-full"
                                style={{
                                  backgroundColor: 'var(--bg-quaternary)',
                                  color: 'var(--text-tertiary)'
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                            {star.tags.length > 3 && (
                              <span
                                className="text-xs px-2 py-1 rounded-full"
                                style={{
                                  backgroundColor: 'var(--bg-quaternary)',
                                  color: 'var(--text-tertiary)'
                                }}
                              >
                                +{star.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleUnstar(star, e)}
                          className="p-1 rounded-lg transition-colors"
                          style={{ color: 'var(--text-tertiary)' }}
                          title="Remove star"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                            e.currentTarget.style.color = 'var(--status-error)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                          }}
                        >
                          <Star className="w-4 h-4" fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}