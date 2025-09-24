/**
 * Types for search analytics and user behavior tracking
 */

export interface SearchAnalytics {
  userId: string;
  searchId: string;
  searchQuery?: string;
  filters: SearchFilters;
  resultsCount: number;
  searchDuration: number; // in milliseconds
  timestamp: string;
  source: 'manual_search' | 'filter_change' | 'recommendation_click' | 'auto_suggestion';
  sessionId: string;
}

export interface SearchFilters {
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  districts?: string[];
  educationLevels?: string[];
  sects?: string[];
  occupations?: string[];
  maritalStatus?: string[];
  isVerified?: boolean;
  hasPhoto?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserBehavior {
  userId: string;
  sessionId: string;
  behaviorType: 'profile_view' | 'search' | 'filter_change' | 'interest_sent' | 'profile_favorite' | 'profile_skip';
  targetUserId?: string;
  metadata: Record<string, any>;
  timestamp: string;
  duration?: number; // time spent on action in milliseconds
  deviceInfo?: DeviceInfo;
  location?: LocationInfo;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
}

export interface ConversionEvent {
  userId: string;
  eventType: 'search_to_view' | 'view_to_interest' | 'interest_to_acceptance' | 'profile_completion' | 'verification_request';
  sourceId: string; // search ID, profile ID, etc.
  targetId?: string; // profile ID for interests
  conversionTime: number; // time from source to conversion in milliseconds
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SearchPattern {
  userId: string;
  patternType: 'frequent_filters' | 'age_preference_trend' | 'location_expansion' | 'education_preference';
  pattern: Record<string, any>;
  frequency: number;
  lastSeen: string;
  confidence: number; // 0-1 confidence in pattern
}

export interface UserEngagement {
  userId: string;
  date: string; // YYYY-MM-DD format
  metrics: {
    sessionsCount: number;
    totalTimeSpent: number; // in minutes
    profilesViewed: number;
    searchesPerformed: number;
    interestsSent: number;
    interestsReceived: number;
    profileUpdates: number;
    loginCount: number;
  };
  engagementScore: number; // 0-100 calculated engagement score
}

export interface PlatformAnalytics {
  date: string;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    newRegistrations: number;
    totalSearches: number;
    totalProfileViews: number;
    totalInterestsSent: number;
    successfulMatches: number;
    averageSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  demographics: {
    ageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    locationDistribution: Record<string, number>;
    educationDistribution: Record<string, number>;
  };
}

export interface SearchInsights {
  userId: string;
  insights: {
    mostSearchedFilters: Array<{ filter: string; count: number }>;
    averageResultsPerSearch: number;
    searchToViewConversionRate: number;
    viewToInterestConversionRate: number;
    preferredSearchTimes: Array<{ hour: number; count: number }>;
    searchPatternTrends: Array<{
      pattern: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      changePercent: number;
    }>;
  };
  recommendations: string[];
  lastUpdated: string;
}

export interface MatchingEffectiveness {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  metrics: {
    recommendationsShown: number;
    recommendationsViewed: number;
    recommendationsInterested: number;
    averageCompatibilityScore: number;
    highQualityMatches: number; // compatibility > 80%
    successfulConnections: number;
    userSatisfactionScore: number; // based on feedback
  };
  trends: {
    improvementRate: number; // percentage improvement over previous period
    qualityTrend: 'improving' | 'declining' | 'stable';
    engagementTrend: 'increasing' | 'decreasing' | 'stable';
  };
  timestamp: string;
}

export interface UserJourney {
  userId: string;
  journeyId: string;
  startTime: string;
  endTime?: string;
  steps: Array<{
    stepType: 'registration' | 'profile_creation' | 'first_search' | 'first_view' | 'first_interest' | 'first_match';
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  currentStage: 'onboarding' | 'exploring' | 'engaging' | 'matching' | 'connected';
  completionRate: number; // 0-100 percentage of journey completed
}

export interface ABTestResult {
  testId: string;
  userId: string;
  variant: string;
  metric: string;
  value: number;
  timestamp: string;
  conversionEvent?: string;
}

export interface SearchOptimization {
  searchId: string;
  originalQuery: SearchFilters;
  optimizedQuery: SearchFilters;
  originalResultsCount: number;
  optimizedResultsCount: number;
  improvementScore: number;
  optimizationReason: string;
  timestamp: string;
}