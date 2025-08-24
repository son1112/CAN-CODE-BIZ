'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Global cache to prevent multiple API calls for tags
const tagsCache = new Map<string, {
  data: Tag[];
  timestamp: number;
  loading: boolean;
}>();

const CACHE_DURATION = 30000; // 30 seconds

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
  const loadingRef = useRef(false);

  const fetchTags = useCallback(async () => {
    // Prevent multiple concurrent requests
    if (loadingRef.current) return;

    const cacheKey = JSON.stringify(options);
    const cached = tagsCache.get(cacheKey);
    const now = Date.now();

    // Use cache if valid and recent
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      setTags(cached.data);
      setLoading(cached.loading);
      return;
    }

    // If already loading for this cache key, don't start another request
    if (cached?.loading) {
      setLoading(true);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    // Mark as loading in cache
    tagsCache.set(cacheKey, { data: tags, timestamp: now, loading: true });

    try {
      const params = new URLSearchParams();
      if (options.category) params.append('category', options.category);
      if (options.search) params.append('search', options.search);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/tags?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const responseData = await response.json();
      const fetchedTags = responseData.data || responseData; // Handle both new and old response formats
      setTags(Array.isArray(fetchedTags) ? fetchedTags : []);

      // Update cache with fresh data
      const tagsArray = Array.isArray(fetchedTags) ? fetchedTags : [];
      tagsCache.set(cacheKey, {
        data: tagsArray,
        timestamp: now,
        loading: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');

      // Remove loading flag from cache on error
      if (cached) {
        tagsCache.set(cacheKey, { ...cached, loading: false });
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [tags]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTags();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [JSON.stringify(options)]); // Remove fetchTags dependency to prevent infinite loop

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

      const responseData = await response.json();
      const newTag = responseData.data || responseData; // Handle both new and old response formats
      setTags(prev => [newTag, ...prev]);

      // Invalidate cache after successful tag creation
      tagsCache.clear();

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

      const responseData = await response.json();
      const updatedTag = responseData.data || responseData; // Handle both new and old response formats
      setTags(prev =>
        prev.map(tag => tag._id === tagId ? updatedTag : tag)
      );

      // Invalidate cache after successful tag update
      tagsCache.clear();

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

      // Invalidate cache after successful tag deletion
      tagsCache.clear();

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