'use client';

import { useState, useCallback } from 'react';
import { CompatibilityService } from '@/lib/services/compatibility.service';
import type { Profile } from '@/lib/services/profile.service';
import type {
  CompatibilityScore,
  MatchRecommendation,
  UserPreferences,
  MatchAnalytics
} from '@/lib/types/compatibility.types';

interface UseCompatibilityReturn {
  // State
  compatibilityScore: CompatibilityScore | null;
  matchRecommendations: MatchRecommendation[];
  matchAnalytics: MatchAnalytics | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  calculateCompatibility: (
    userProfile: Profile,
    candidateProfile: Profile,
    userPreferences?: UserPreferences
  ) => Promise<CompatibilityScore | null>;
  
  getMatchRecommendations: (userId: string, limit?: number) => Promise<MatchRecommendation[]>;
  
  generateMatchRecommendations: (
    userProfile: Profile,
    candidateProfiles: Profile[],
    userPreferences?: UserPreferences
  ) => Promise<MatchRecommendation[]>;
  
  getUserAnalytics: (userId: string) => Promise<MatchAnalytics | null>;
  
  getCachedCompatibility: (
    userId: string,
    candidateUserId: string
  ) => Promise<CompatibilityScore | null>;

  // Utilities
  clearError: () => void;
  reset: () => void;
}

export function useCompatibility(): UseCompatibilityReturn {
  const [compatibilityScore, setCompatibilityScore] = useState<CompatibilityScore | null>(null);
  const [matchRecommendations, setMatchRecommendations] = useState<MatchRecommendation[]>([]);
  const [matchAnalytics, setMatchAnalytics] = useState<MatchAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setCompatibilityScore(null);
    setMatchRecommendations([]);
    setMatchAnalytics(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const calculateCompatibility = useCallback(async (
    userProfile: Profile,
    candidateProfile: Profile,
    userPreferences?: UserPreferences
  ): Promise<CompatibilityScore | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // First check for cached result
      const cached = await CompatibilityService.getCachedCompatibility(
        userProfile.userId,
        candidateProfile.userId
      );

      if (cached) {
        setCompatibilityScore(cached);
        return cached;
      }

      // Calculate new compatibility score
      const score = await CompatibilityService.calculateProfileCompatibility(
        userProfile,
        candidateProfile,
        userPreferences
      );

      setCompatibilityScore(score);
      return score;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate compatibility';
      setError(errorMessage);
      console.error('Compatibility calculation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMatchRecommendations = useCallback(async (
    userId: string,
    limit: number = 10
  ): Promise<MatchRecommendation[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const recommendations = await CompatibilityService.getMatchRecommendations(userId, limit);
      setMatchRecommendations(recommendations);
      return recommendations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get match recommendations';
      setError(errorMessage);
      console.error('Match recommendations error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateMatchRecommendations = useCallback(async (
    userProfile: Profile,
    candidateProfiles: Profile[],
    userPreferences?: UserPreferences
  ): Promise<MatchRecommendation[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const recommendations = await CompatibilityService.generateMatchRecommendations(
        userProfile,
        candidateProfiles,
        userPreferences
      );

      setMatchRecommendations(recommendations);
      return recommendations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate match recommendations';
      setError(errorMessage);
      console.error('Generate recommendations error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserAnalytics = useCallback(async (userId: string): Promise<MatchAnalytics | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const analytics = await CompatibilityService.getUserMatchAnalytics(userId);
      setMatchAnalytics(analytics);
      return analytics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user analytics';
      setError(errorMessage);
      console.error('User analytics error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCachedCompatibility = useCallback(async (
    userId: string,
    candidateUserId: string
  ): Promise<CompatibilityScore | null> => {
    try {
      const cached = await CompatibilityService.getCachedCompatibility(userId, candidateUserId);
      if (cached) {
        setCompatibilityScore(cached);
      }
      return cached;
    } catch (err) {
      console.warn('Failed to get cached compatibility:', err);
      return null;
    }
  }, []);

  return {
    // State
    compatibilityScore,
    matchRecommendations,
    matchAnalytics,
    isLoading,
    error,

    // Actions
    calculateCompatibility,
    getMatchRecommendations,
    generateMatchRecommendations,
    getUserAnalytics,
    getCachedCompatibility,

    // Utilities
    clearError,
    reset,
  };
}