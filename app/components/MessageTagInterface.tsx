'use client';

import { useState } from 'react';
import { Hash, Plus } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import TagInput from './TagInput';
import TagDisplay from './TagDisplay';

interface MessageTagInterfaceProps {
  messageId: string;
  tags: string[];
  onTagsUpdate: (tags: string[]) => void;
}

export default function MessageTagInterface({ 
  messageId, 
  tags, 
  onTagsUpdate 
}: MessageTagInterfaceProps) {
  const [isEditingTags, setIsEditingTags] = useState(false);
  const { tags: availableTags } = useTags({ limit: 50 });

  const handleTagsChange = async (newTags: string[]) => {
    try {
      // Update tags in the database
      const response = await fetch(`/api/sessions/messages/${messageId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags: newTags }),
      });

      if (response.ok) {
        onTagsUpdate(newTags);
        setIsEditingTags(false);
        console.log('Successfully updated message tags');
      } else {
        const errorData = await response.text();
        console.log('Failed to update message tags. Status:', response.status, 'Response:', errorData);
      }
    } catch (error) {
      console.error('Error updating message tags:', error);
    }
  };

  const mappedAvailableTags = (availableTags || []).map(tag => ({
    id: tag._id,
    name: tag.name,
    color: tag.color,
    category: tag.category
  }));

  return (
    <div className="mt-4 pt-3 border-t border-opacity-20" style={{ borderColor: 'var(--border-primary)' }}>
      {/* Tags Display/Edit Toggle */}
      <div className="flex items-center justify-between mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <Hash style={{ width: '14px', height: '14px', color: 'var(--text-tertiary)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Tags
          </span>
        </div>
        
        {!isEditingTags && (
          <button
            onClick={() => setIsEditingTags(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors"
            style={{ 
              color: 'var(--text-tertiary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Add tags"
          >
            <Plus style={{ width: '12px', height: '12px' }} />
            Add
          </button>
        )}
      </div>

      {/* Tags Content */}
      {isEditingTags ? (
        <div className="mb-2">
          <TagInput
            tags={tags}
            onTagsChange={handleTagsChange}
            availableTags={mappedAvailableTags}
            placeholder="Add tags to this message..."
            maxTags={8}
            className="text-sm"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setIsEditingTags(false)}
              className="px-2 py-1 rounded text-xs transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div onClick={() => setIsEditingTags(true)} className="cursor-pointer">
          {tags.length > 0 ? (
            <TagDisplay
              tags={tags}
              availableTags={mappedAvailableTags}
              size="sm"
              onTagClick={() => setIsEditingTags(true)}
            />
          ) : (
            <div 
              className="flex items-center gap-2 py-2 px-3 rounded-lg border-2 border-dashed transition-colors text-sm opacity-0 group-hover:opacity-100"
              style={{
                borderColor: 'var(--border-primary)',
                color: 'var(--text-tertiary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border-primary)';
              }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>Click to add tags...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}