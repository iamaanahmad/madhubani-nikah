'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnalyticsService } from '@/lib/services/analytics.service';
import type {
  SearchAnalytics,
  UserBehavior,
  ConversionEvent,
  SearchInsights,
  UserEngagement,
  MatchingEffectiveness,
  UserJourney,
  DeviceInfo,
  LocationInfo
} from '@/lib/types/analytics.types';

interface UseAnalyticsReturn {
  // State
  searchInsights: SearchInsights | null;
  userEngagement: UserEngagement[];
  matchingEffectiveness: MatchingEffectiveness | null;
  isLoading: boolean;
  error: string | null;

  // Tracking methods
  trackSearch: (searchData: Omit<SearchAnalytics, 'searchId' | 'timestamp'>) => Promise<void>;
  trackBehavior: (behavior: Omit<UserBehavior, 'timestamp'>) => Promise<void>;
  trackConversion: (conversion: Omit<ConversionEvent, 'timestamp'>) => Promise<void>;
  trackJourneyStep: (
    userId: string,
    stepType: UserJourney['steps'][0]['stepType'],
    metadata?: Record<string, any>
  ) => Promise<void>;

  // Analytics methods
  getSearchInsights: (userId: string) => Promise<SearchInsights | null>;
  getUserEngagement: (userId: string, days?: number) => Promise<UserEngagement[]>;
  getMatchingEffectiveness: (
    userId: string,
    period?: 'daily' | 'weekly' | 'monthly'
  ) => Promise<MatchingEffectiveness | null>;

  // Utilities
  clearError: () => void;
  reset: () => void;
}

export function useAnalytics(): UseAnalyticsReturn {
  const [searchInsights, setSearchInsights] = useState<SearchInsights | null>(null);
  const [userEngagement, setUserEngagement] = useState<UserEngagement[]>([]);
  const [matchingEffectiveness, setMatchingEffectiveness] = useState<MatchingEffectiveness | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setSearchInsights(null);
    setUserEngagement([]);
    setMatchingEffectiveness(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const trackSearch = useCallback(async (searchData: Omit<SearchAnalytics, 'searchId' | 'timestamp'>) => {
    try {
      await AnalyticsService.trackSearch(searchData);
    } catch (err) {
      console.warn('Failed to track search:', err);
      // Don't set error state for tracking as it's background
    }
  }, []);

  const trackBehavior = useCallback(async (behavior: Omit<UserBehavior, 'timestamp'>) => {
    try {
      await AnalyticsService.trackUserBehavior(behavior);
    } catch (err) {
      console.warn('Failed to track behavior:', err);
      // Don't set error state for tracking as it's background
    }
  }, []);

  const trackConversion = useCallback(async (conversion: Omit<ConversionEvent, 'timestamp'>) => {
    try {
      await AnalyticsService.trackConversion(conversion);
    } catch (err) {
      console.warn('Failed to track conversion:', err);
      // Don't set error state for tracking as it's background
    }
  }, []);

  const trackJourneyStep = useCallback(async (
    userId: string,
    stepType: UserJourney['steps'][0]['stepType'],
    metadata?: Record<string, any>
  ) => {
    try {
      await AnalyticsService.trackUserJourney(userId, stepType, metadata);
    } catch (err) {
      console.warn('Failed to track journey step:', err);
      // Don't set error state for tracking as it's background
    }
  }, []);

  const getSearchInsights = useCallback(async (userId: string): Promise<SearchInsights | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const insights = await AnalyticsService.getUserSearchInsights(userId);
      setSearchInsights(insights);
      return insights;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get search insights';
      setError(errorMessage);
      console.error('Get search insights error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserEngagement = useCallback(async (userId: string, days: number = 30): Promise<UserEngagement[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const engagement = await AnalyticsService.getUserEngagement(userId, days);
      setUserEngagement(engagement);
      return engagement;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user engagement';
      setError(errorMessage);
      console.error('Get user engagement error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMatchingEffectiveness = useCallback(async (
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<MatchingEffectiveness | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const effectiveness = await AnalyticsService.getMatchingEffectiveness(userId, period);
      setMatchingEffectiveness(effectiveness);
      return effectiveness;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get matching effectiveness';
      setError(errorMessage);
      console.error('Get matching effectiveness error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    searchInsights,
    userEngagement,
    matchingEffectiveness,
    isLoading,
    error,

    // Tracking methods
    trackSearch,
    trackBehavior,
    trackConversion,
    trackJourneyStep,

    // Analytics methods
    getSearchInsights,
    getUserEngagement,
    getMatchingEffectiveness,

    // Utilities
    clearError,
    reset,
  };
}

/**
 * Hook for automatic behavior tracking
 */
export function useBehaviorTracker(userId: string, sessionId: string) {
  const { trackBehavior } = useAnalytics();

  // Get device info
  const getDeviceInfo = useCallback((): DeviceInfo => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const screenResolution = `${screen.width}x${screen.height}`;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    return {
      userAgent,
      platform,
      screenResolution,
      isMobile,
      isTablet,
      isDesktop
    };
  }, []);

  // Get location info (simplified - would use geolocation API in real implementation)
  const getLocationInfo = useCallback((): LocationInfo => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return {
      timezone,
      // country, region, city would be determined from IP or geolocation
    };
  }, []);

  const trackProfileView = useCallback(async (
    targetUserId: string,
    metadata: Record<string, any> = {},
    duration?: number
  ) => {
    await trackBehavior({
      userId,
      sessionId,
      behaviorType: 'profile_view',
      targetUserId,
      metadata: {
        ...metadata,
        viewedAt: new Date().toISOString()
      },
      duration,
      deviceInfo: getDeviceInfo(),
      location: getLocationInfo()
    });
  }, [userId, sessionId, trackBehavior, getDeviceInfo, getLocationInfo]);

  const trackSearch = useCallback(async (
    metadata: Record<string, any> = {},
    duration?: number
  ) => {
    await trackBehavior({
      userId,
      sessionId,
      behaviorType: 'search',
      metadata: {
        ...metadata,
        searchedAt: new Date().toISOString()
      },
      duration,
      deviceInfo: getDeviceInfo(),
      location: getLocationInfo()
    });
  }, [userId, sessionId, trackBehavior, getDeviceInfo, getLocationInfo]);

  const trackFilterChange = useCallback(async (
    metadata: Record<string, any> = {},
    duration?: number
  ) => {
    await trackBehavior({
      userId,
      sessionId,
      behaviorType: 'filter_change',
      metadata: {
        ...metadata,
        changedAt: new Date().toISOString()
      },
      duration,
      deviceInfo: getDeviceInfo(),
      location: getLocationInfo()
    });
  }, [userId, sessionId, trackBehavior, getDeviceInfo, getLocationInfo]);

  const trackInterestSent = useCallback(async (
    targetUserId: string,
    metadata: Record<string, any> = {},
    duration?: number
  ) => {
    await trackBehavior({
      userId,
      sessionId,
      behaviorType: 'interest_sent',
      targetUserId,
      metadata: {
        ...metadata,
        sentAt: new Date().toISOString()
      },
      duration,
      deviceInfo: getDeviceInfo(),
      location: getLocationInfo()
    });
  }, [userId, sessionId, trackBehavior, getDeviceInfo, getLocationInfo]);

  const trackProfileFavorite = useCallback(async (
    targetUserId: string,
    metadata: Record<string, any> = {},
    duration?: number
  ) => {
    await trackBehavior({
      userId,
      sessionId,
      behaviorType: 'profile_favorite',
      targetUserId,
      metadata: {
        ...metadata,
        favoritedAt: new Date().toISOString()
      },
      duration,
      deviceInfo: getDeviceInfo(),
      location: getLocationInfo()
    });
  }, [userId, sessionId, trackBehavior, getDeviceInfo, getLocationInfo]);

  const trackProfileSkip = useCallback(async (
    targetUserId: string,
    metadata: Record<string, any> = {},
    duration?: number
  ) => {
    await trackBehavior({
      userId,
      sessionId,
      behaviorType: 'profile_skip',
      targetUserId,
      metadata: {
        ...metadata,
        skippedAt: new Date().toISOString()
      },
      duration,
      deviceInfo: getDeviceInfo(),
      location: getLocationInfo()
    });
  }, [userId, sessionId, trackBehavior, getDeviceInfo, getLocationInfo]);

  return {
    trackProfileView,
    trackSearch,
    trackFilterChange,
    trackInterestSent,
    trackProfileFavorite,
    trackProfileSkip
  };
}

/**
 * Hook for session management and tracking
 */
export function useSessionTracking(userId: string) {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [sessionStartTime] = useState(() => Date.now());

  const getSessionDuration = useCallback(() => {
    return Date.now() - sessionStartTime;
  }, [sessionStartTime]);

  // Track session end on unmount
  useEffect(() => {
    return () => {
      // Track session end
      const duration = Date.now() - sessionStartTime;
      console.log(`Session ended: ${sessionId}, Duration: ${duration}ms`);
      // Could send session end event here
    };
  }, [sessionId, sessionStartTime]);

  return {
    sessionId,
    sessionStartTime,
    getSessionDuration
  };
}