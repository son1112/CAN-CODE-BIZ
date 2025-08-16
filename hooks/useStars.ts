'use client';

import { useState, useEffect, useCallback } from 'react';
import { StarDocument, StarableType } from '@/models/Star';
import { CreateStarOptions, StarFilterOptions } from '@/lib/stars';

interface UseStarsReturn {
  // State
  stars: StarDocument[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  starItem: (options: Omit<CreateStarOptions, 'userId'>) => Promise<boolean>;
  unstarItem: (itemType: StarableType, itemId: string) => Promise<boolean>;
  isStarred: (itemType: StarableType, itemId: string) => boolean;
  updateStar: (starId: string, updates: Partial<StarDocument>) => Promise<boolean>;
  
  // Queries
  getStarsByType: (itemType: StarableType) => StarDocument[];
  getStarsByTag: (tag: string) => StarDocument[];
  getStarsByPriority: (priority: 'low' | 'medium' | 'high') => StarDocument[];
  searchStars: (query: string) => StarDocument[];
  
  // Management
  loadStars: (filters?: Omit<StarFilterOptions, 'userId'>) => Promise<void>;
  refreshStars: () => Promise<void>;
  
  // Stats
  getTotalStars: () => number;
  getStarCountByType: (itemType: StarableType) => number;
}

export function useStars(userId: string): UseStarsReturn {
  const [stars, setStars] = useState<StarDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const starItem = useCallback(async (options: Omit<CreateStarOptions, 'userId'>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to star item');
      }

      const { star } = await response.json();
      setStars(prev => [star, ...prev]);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to star item';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const unstarItem = useCallback(async (itemType: StarableType, itemId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/stars/item/${itemType}/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unstar item');
      }

      setStars(prev => prev.filter(star => !(star.itemType === itemType && star.itemId === itemId)));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unstar item';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const isStarred = useCallback((itemType: StarableType, itemId: string): boolean => {
    return stars.some(star => star.itemType === itemType && star.itemId === itemId);
  }, [stars]);

  const updateStar = useCallback(async (starId: string, updates: Partial<StarDocument>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/stars/${starId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update star');
      }

      const { star } = await response.json();
      setStars(prev => prev.map(s => s.starId === starId ? star : s));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update star';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStarsByType = useCallback((itemType: StarableType): StarDocument[] => {
    return stars.filter(star => star.itemType === itemType);
  }, [stars]);

  const getStarsByTag = useCallback((tag: string): StarDocument[] => {
    return stars.filter(star => star.tags?.includes(tag));
  }, [stars]);

  const getStarsByPriority = useCallback((priority: 'low' | 'medium' | 'high'): StarDocument[] => {
    return stars.filter(star => star.priority === priority);
  }, [stars]);

  const searchStars = useCallback((query: string): StarDocument[] => {
    const lowerQuery = query.toLowerCase();
    return stars.filter(star => {
      const searchContent = [
        star.context?.title,
        star.context?.description,
        star.context?.messageContent,
        star.tags?.join(' '),
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchContent.includes(lowerQuery);
    });
  }, [stars]);

  const loadStars = useCallback(async (filters?: Omit<StarFilterOptions, 'userId'>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams({
        userId,
        ...Object.fromEntries(
          Object.entries(filters || {}).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : String(value)
          ])
        )
      });

      const response = await fetch(`/api/stars?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to load stars');
      }

      const { stars: starList } = await response.json();
      setStars(starList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stars';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refreshStars = useCallback(async (): Promise<void> => {
    await loadStars();
  }, [loadStars]);

  const getTotalStars = useCallback((): number => {
    return stars.length;
  }, [stars]);

  const getStarCountByType = useCallback((itemType: StarableType): number => {
    return stars.filter(star => star.itemType === itemType).length;
  }, [stars]);

  // Load stars on mount
  useEffect(() => {
    if (userId) {
      loadStars();
    }
  }, [userId, loadStars]);

  return {
    // State
    stars,
    isLoading,
    error,
    
    // Actions
    starItem,
    unstarItem,
    isStarred,
    updateStar,
    
    // Queries
    getStarsByType,
    getStarsByTag,
    getStarsByPriority,
    searchStars,
    
    // Management
    loadStars,
    refreshStars,
    
    // Stats
    getTotalStars,
    getStarCountByType,
  };
}