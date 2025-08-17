'use client';

import { useState, useEffect, useCallback } from 'react';

interface Tag {
  _id: string;
  name: string;
  color: string;
  category?: string;
  description?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface UseTagsOptions {
  category?: string;
  search?: string;
  sortBy?: 'usageCount' | 'name' | 'createdAt';
  limit?: number;
}

export function useTags(options: UseTagsOptions = {}) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.category) params.append('category', options.category);
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/tags?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const fetchedTags = await response.json();
      setTags(fetchedTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.category, options.search, options.sortBy, options.limit]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTags();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchTags]);

  const createTag = async (tagData: {
    name: string;
    color?: string;
    category?: string;
    description?: string;
  }): Promise<Tag | null> => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tag');
      }

      const newTag = await response.json();
      setTags(prev => [newTag, ...prev]);
      return newTag;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
      return null;
    }
  };

  const updateTag = async (
    tagId: string,
    updates: Partial<Pick<Tag, 'name' | 'color' | 'category' | 'description'>>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tag');
      }

      const updatedTag = await response.json();
      setTags(prev => 
        prev.map(tag => tag._id === tagId ? updatedTag : tag)
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag');
      return false;
    }
  };

  const deleteTag = async (tagId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete tag');
      }

      setTags(prev => prev.filter(tag => tag._id !== tagId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
      return false;
    }
  };

  const getTagByName = useCallback((name: string): Tag | undefined => {
    return tags.find(tag => tag.name === name.toLowerCase());
  }, [tags]);

  const getTagsByCategory = useCallback((category: string): Tag[] => {
    return tags.filter(tag => tag.category === category);
  }, [tags]);

  const searchTags = useCallback((query: string): Tag[] => {
    const lowercaseQuery = query.toLowerCase();
    return tags.filter(tag => 
      tag.name.includes(lowercaseQuery) ||
      tag.category?.includes(lowercaseQuery) ||
      tag.description?.includes(lowercaseQuery)
    );
  }, [tags]);

  return {
    tags,
    loading,
    error,
    refetch: fetchTags,
    createTag,
    updateTag,
    deleteTag,
    getTagByName,
    getTagsByCategory,
    searchTags,
  };
}