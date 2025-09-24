'use client';

import { useState, useCallback, useEffect } from 'react';
import { MatchRecommendationService } from '@/lib/services/match-recommendation.service';
import type { Profile } from '@/lib/services/profile.service';
import type {
  MatchRecommendation,
  UserPreferences
} from '@/lib/types/compatibility.types';
import type {
  RecommendationFilters,
  UserInteraction
} from '@/lib/services/match-recommendation.service';

interface UseMatchRecommendationsReturn {
  // State
  recommendations: MatchRecommendation[];
  trendingMatches: Profile[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;

  // Actions
  getRecommendations: (
    userId: string,
    limit?: number,
    filters?: RecommendationFilters
  ) => Promise<MatchRecommendation[]>;
  
  refreshRecommendations: (userId: string) => Promise<MatchRecommendation[]>;
  
  getTrendingMatches: (userId: string, limit?: number) => Promise<Profile[]>;
  
  recordInteraction: (interaction: UserInteraction) => Promise<void>;
  
  recordFeedback: (
    userId: string,
    matchUserId: string,
    feedback: 'excellent' | 'good' | 'average' | 'poor',
    reasons?: string[]
  ) => Promise<void>;

  // Utilities
  clearError: () => void;
  reset: () => void;
}

export function useMatchRecommendations(): UseMatchRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [trendingMatches, setTrendingMatches] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setRecommendations([]);
    setTrendingMatches([]);
    setError(null);
    setIsLoading(false);
    setHasMore(true);
  }, []);

  const getRecommendations = useCallback(async (
    userId: string,
    limit: number = 20,
    filters?: RecommendationFilters
  ): Promise<MatchRecommendation[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // First try to get cached recommendations
      const cached = await MatchRecommendationService.getCachedRecommendations(userId, 24);
      
      if (cached.length > 0) {
        setRecommendations(cached);
        setHasMore(cached.length >= limit);
        return cached;
      }

      // Generate fresh recommendations
      const newRecommendations = await MatchRecommendationService.getPersonalizedRecommendations(
        userId,
        limit,
        filters
      );

      setRecommendations(newRecommendations);
      setHasMore(newRecommendations.length >= limit);
      return newRecommendations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
      console.error('Get recommendations error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshRecommendations = useCallback(async (userId: string): Promise<MatchRecommendation[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const freshRecommendations = await MatchRecommendationService.refreshRecommendations(userId);
      setRecommendations(freshRecommendations);
      setHasMore(freshRecommendations.length >= 20);
      return freshRecommendations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh recommendations';
      setError(errorMessage);
      console.error('Refresh recommendations error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTrendingMatches = useCallback(async (
    userId: string,
    limit: number = 10
  ): Promise<Profile[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const trending = await MatchRecommendationService.getTrendingMatches(userId, limit);
      setTrendingMatches(trending);
      return trending;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get trending matches';
      setError(errorMessage);
      console.error('Get trending matches error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recordInteraction = useCallback(async (interaction: UserInteraction): Promise<void> => {
    try {
      await MatchRecommendationService.recordUserInteraction(interaction);
    } catch (err) {
      console.warn('Failed to record interaction:', err);
      // Don't set error state for interaction recording as it's background
    }
  }, []);

  const recordFeedback = useCallback(async (
    userId: string,
    matchUserId: string,
    feedback: 'excellent' | 'good' | 'average' | 'poor',
    reasons?: string[]
  ): Promise<void> => {
    try {
      await MatchRecommendationService.recordMatchFeedback(userId, matchUserId, feedback, reasons);
    } catch (err) {
      console.warn('Failed to record feedback:', err);
      // Don't set error state for feedback recording as it's background
    }
  }, []);

  return {
    // State
    recommendations,
    trendingMatches,
    isLoading,
    error,
    hasMore,

    // Actions
    getRecommendations,
    refreshRecommendations,
    getTrendingMatches,
    recordInteraction,
    recordFeedback,

    // Utilities
    clearError,
    reset,
  };
}

/**
 * Hook for tracking user interactions automatically
 */
export function useInteractionTracker(userId: string) {
  const { recordInteraction } = useMatchRecommendations();

  const trackProfileView = useCallback(async (targetUserId: string, contextData?: Record<string, any>) => {
    await recordInteraction({
      userId,
      targetUserId,
      interactionType: 'view',
      timestamp: new Date().toISOString(),
      contextData
    });
  }, [userId, recordInteraction]);

  const trackInterestSent = useCallback(async (targetUserId: string, contextData?: Record<string, any>) => {
    await recordInteraction({
      userId,
      targetUserId,
      interactionType: 'interest',
      timestamp: new Date().toISOString(),
      contextData
    });
  }, [userId, recordInteraction]);

  const trackProfileFavorite = useCallback(async (targetUserId: string, contextData?: Record<string, any>) => {
    await recordInteraction({
      userId,
      targetUserId,
      interactionType: 'favorite',
      timestamp: new Date().toISOString(),
      contextData
    });
  }, [userId, recordInteraction]);

  const trackProfileSkip = useCallback(async (targetUserId: string, contextData?: Record<string, any>) => {
    await recordInteraction({
      userId,
      targetUserId,
      interactionType: 'skip',
      timestamp: new Date().toISOString(),
      contextData
    });
  }, [userId, recordInteraction]);

  return {
    trackProfileView,
    trackInterestSent,
    trackProfileFavorite,
    trackProfileSkip
  };
}