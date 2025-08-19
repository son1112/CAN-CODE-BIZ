'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface AvatarData {
  imageUrl: string;
  prompt: string;
  sessionId: string;
}

interface UseDuckAvatarReturn {
  generateAvatar: (userInput: string, sessionId: string) => Promise<AvatarData | null>;
  isGenerating: boolean;
  error: string | null;
}

export function useDuckAvatar(): UseDuckAvatarReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAvatar = useCallback(async (userInput: string, sessionId: string): Promise<AvatarData | null> => {
    if (!userInput || !sessionId) {
      setError('User input and session ID are required');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-duck-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate avatar');
      }

      const data = await response.json();
      
      return {
        imageUrl: data.imageUrl,
        prompt: data.prompt,
        sessionId: data.sessionId,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Avatar generation error', { component: 'DuckAvatar', sessionId }, err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateAvatar,
    isGenerating,
    error,
  };
}