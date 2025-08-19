'use client';

import { useState, useMemo } from 'react';
import { Hash, Plus, Search, Trash2, Edit3, TrendingUp } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTags } from '@/hooks/useTags';
import TagDisplay from './TagDisplay';

interface TagBrowserProps {
  onTagFilter?: (tags: string[]) => void;
  onClose?: () => void;
}

export default function TagBrowser({ onTagFilter, onClose }: TagBrowserProps) {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'usageCount' | 'name' | 'createdAt'>('usageCount');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);

  const tagOptions = useMemo(() => ({
    search: searchTerm,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    sortBy,
    limit: 100
  }), [searchTerm, selectedCategory, sortBy]);

  const { tags, loading, error, createTag, deleteTag } = useTags(tagOptions);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(tags.map(tag => tag.category).filter(Boolean))) as string[];
    return ['all', ...cats.sort()];
  }, [tags]);

  // Color palette for new tags
  const colorPalette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
  ];

  const handleCreateTag = async (tagData: {
    name: string;
    color?: string;
    category?: string;
    description?: string;
  }) => {
    const success = await createTag({
      ...tagData,
      color: tagData.color || colorPalette[Math.floor(Math.random() * colorPalette.length)]
    });
    if (success) {
      setShowCreateForm(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (confirm('Are you sure you want to delete this tag? It will be removed from all messages and sessions.')) {
      await deleteTag(tagId);
    }
  };

  const handleApplyFilter = () => {
    onTagFilter?.(selectedTags);
    onClose?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Hash style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Tags
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--accent-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="View tag analytics"
          >
            <TrendingUp style={{ width: '16px', height: '16px' }} />
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--accent-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Create new tag"
          >
            <Plus style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* Analytics View */}
      {showAnalytics && tags.length > 0 && (
        <div className="mb-4 p-4 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}>
          <TagAnalytics tags={tags} />
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search 
            style={{ 
              width: '16px', 
              height: '16px',
              color: 'var(--text-tertiary)',
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)'
            }} 
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tags..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors text-sm"
            style={{
              backgroundColor: isDark ? 'var(--bg-tertiary)' : 'white',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-2 rounded-lg border transition-colors text-sm"
          style={{
            backgroundColor: isDark ? 'var(--bg-tertiary)' : 'white',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>

        {/* Sort Options */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'usageCount' | 'name' | 'createdAt')}
          className="w-full p-2 rounded-lg border transition-colors text-sm"
          style={{
            backgroundColor: isDark ? 'var(--bg-tertiary)' : 'white',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
        >
          <option value="usageCount">Most Used</option>
          <option value="name">Alphabetical</option>
          <option value="createdAt">Recently Created</option>
        </select>
      </div>

      {/* Create Tag Form */}
      {showCreateForm && (
        <div className="mb-4 p-4 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-primary)'
        }}>
          <CreateTagForm onSubmit={handleCreateTag} onCancel={() => setShowCreateForm(false)} />
        </div>
      )}

      {/* Selected Tags for Filtering */}
      {selectedTags.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Filter by tags:
            </span>
            <button
              onClick={handleApplyFilter}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'white'
              }}
            >
              Apply Filter
            </button>
          </div>
          <TagDisplay
            tags={selectedTags}
            availableTags={tags.map(t => ({ id: t._id, name: t.name, color: t.color, category: t.category }))}
            removable
            onTagRemove={(tag) => setSelectedTags(prev => prev.filter(t => t !== tag))}
            size="sm"
          />
        </div>
      )}

      {/* Tags List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {error && (
          <div className="p-3 rounded-lg" style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#EF4444' 
          }}>
            {error}
          </div>
        )}

        {tags.length === 0 ? (
          <div className="text-center py-8">
            <Hash style={{ 
              width: '48px', 
              height: '48px', 
              color: 'var(--text-tertiary)',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              {searchTerm ? 'No tags found' : 'No tags yet'}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
              {searchTerm ? 'Try a different search term' : 'Create your first tag to get started'}
            </p>
          </div>
        ) : (
          tags.map(tag => (
            <TagItem
              key={tag._id}
              tag={tag}
              isSelected={selectedTags.includes(tag.name)}
              onSelect={(tagName) => {
                setSelectedTags(prev => 
                  prev.includes(tagName) 
                    ? prev.filter(t => t !== tagName)
                    : [...prev, tagName]
                );
              }}
              onEdit={() => setEditingTag(tag._id)}
              onDelete={() => handleDeleteTag(tag._id)}
            />
          ))
        )}
      </div>

      {/* Stats Footer */}
      {tags.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--text-tertiary)' }}>
              {tags.length} tag{tags.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp style={{ width: '14px', height: '14px', color: 'var(--text-tertiary)' }} />
              <span style={{ color: 'var(--text-tertiary)' }}>
                {tags.reduce((sum, tag) => sum + tag.usageCount, 0)} total uses
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Tag Item Component
function TagItem({ 
  tag, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete 
}: {
  tag: {
    _id: string;
    name: string;
    color: string;
    category?: string;
    description?: string;
    usageCount: number;
    createdAt: string;
    updatedAt: string;
  };
  isSelected: boolean;
  onSelect: (tagName: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
        isSelected ? 'ring-2' : ''
      }`}
      style={{
        backgroundColor: isSelected ? `${tag.color}10` : 'var(--bg-tertiary)',
        borderColor: isSelected ? tag.color : 'var(--border-primary)'
      }}
      onClick={() => onSelect(tag.name)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: tag.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {tag.name}
              </span>
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
            <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              <span>{tag.usageCount} use{tag.usageCount !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{new Date(tag.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 rounded hover:bg-current hover:bg-opacity-10 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            title="Edit tag"
          >
            <Edit3 style={{ width: '12px', height: '12px' }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-red-500 hover:bg-opacity-10 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            title="Delete tag"
          >
            <Trash2 style={{ width: '12px', height: '12px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Create Tag Form Component
function CreateTagForm({ 
  onSubmit, 
  onCancel 
}: {
  onSubmit: (data: { name: string; color: string; category?: string; description?: string }) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    category: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
      setFormData({ name: '', color: '#3B82F6', category: '', description: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Tag name..."
          className="w-full p-2 rounded border text-sm"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <input
          type="color"
          value={formData.color}
          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          className="w-full h-8 rounded border"
          style={{ borderColor: 'var(--border-primary)' }}
        />
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="Category (optional)"
          className="w-full p-2 rounded border text-sm"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)'
          }}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 py-2 px-3 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'white'
          }}
        >
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded text-sm transition-colors"
          style={{
            backgroundColor: 'var(--bg-quaternary)',
            color: 'var(--text-secondary)'
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Tag Analytics Component
function TagAnalytics({ tags }: { tags: Array<{
  _id: string;
  name: string;
  color: string;
  category?: string;
  description?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}> }) {
  const topTags = tags
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);
  
  const categoryCounts = tags.reduce((acc, tag) => {
    const category = tag.category || 'uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalUsage = tags.reduce((sum, tag) => sum + tag.usageCount, 0);
  const averageUsage = tags.length > 0 ? (totalUsage / tags.length).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <TrendingUp style={{ width: '16px', height: '16px', color: 'var(--accent-primary)' }} />
        Tag Analytics
      </h4>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>
            {tags.length}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Total Tags
          </div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>
            {totalUsage}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Total Uses
          </div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>
            {averageUsage}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Avg Uses
          </div>
        </div>
      </div>

      {/* Top Tags */}
      <div>
        <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Most Used Tags
        </h5>
        <div className="space-y-2">
          {topTags.map((tag, index) => (
            <div key={tag._id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs w-4 text-center font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  #{index + 1}
                </span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {tag.name}
                </span>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                {tag.usageCount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      {Object.keys(categoryCounts).length > 1 && (
        <div>
          <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Categories
          </h5>
          <div className="space-y-1">
            {Object.entries(categoryCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--text-primary)' }}>
                    {category === 'uncategorized' ? 'Uncategorized' : category}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {count} tag{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}