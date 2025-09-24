import { databases, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS } from '../appwrite-config';
import { Query, ID } from 'appwrite';
import type {
  SearchAnalytics,
  UserBehavior,
  ConversionEvent,
  SearchPattern,
  UserEngagement,
  SearchInsights,
  MatchingEffectiveness,
  UserJourney,
  SearchOptimization,
  DeviceInfo,
  LocationInfo
} from '../types/analytics.types';

export class AnalyticsService {
  /**
   * Track search analytics
   */
  static async trackSearch(searchData: Omit<SearchAnalytics, 'searchId' | 'timestamp'>): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const searchAnalytics: SearchAnalytics = {
        ...searchData,
        searchId: ID.unique(),
        timestamp: new Date().toISOString()
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.USER_ACTIVITIES,
        ID.unique(),
        {
          userId: searchAnalytics.userId,
          activityType: 'search',
          searchData: JSON.stringify(searchAnalytics),
          timestamp: searchAnalytics.timestamp,
          sessionId: searchAnalytics.sessionId
        }
      );

      // Update search patterns
      await this.updateSearchPatterns(searchAnalytics);
    }, 'trackSearch');
  }

  /**
   * Track user behavior
   */
  static async trackUserBehavior(behavior: Omit<UserBehavior, 'timestamp'>): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const userBehavior: UserBehavior = {
        ...behavior,
        timestamp: new Date().toISOString()
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.USER_ACTIVITIES,
        ID.unique(),
        {
          userId: userBehavior.userId,
          activityType: userBehavior.behaviorType,
          targetUserId: userBehavior.targetUserId,
          metadata: JSON.stringify(userBehavior.metadata),
          timestamp: userBehavior.timestamp,
          sessionId: userBehavior.sessionId,
          duration: userBehavior.duration
        }
      );

      // Track conversion events if applicable
      await this.checkAndTrackConversions(userBehavior);
    }, 'trackUserBehavior');
  }

  /**
   * Track conversion events
   */
  static async trackConversion(conversion: Omit<ConversionEvent, 'timestamp'>): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const conversionEvent: ConversionEvent = {
        ...conversion,
        timestamp: new Date().toISOString()
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_ANALYTICS,
        ID.unique(),
        {
          userId: conversionEvent.userId,
          eventType: conversionEvent.eventType,
          sourceId: conversionEvent.sourceId,
          targetId: conversionEvent.targetId,
          conversionTime: conversionEvent.conversionTime,
          timestamp: conversionEvent.timestamp,
          metadata: JSON.stringify(conversionEvent.metadata || {})
        }
      );
    }, 'trackConversion');
  }

  /**
   * Get user search insights
   */
  static async getUserSearchInsights(userId: string): Promise<SearchInsights> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get user's search history
      const searchHistory = await this.getUserSearchHistory(userId, 100);
      
      // Analyze search patterns
      const insights = await this.analyzeSearchPatterns(searchHistory);
      
      // Generate recommendations
      const recommendations = await this.generateSearchRecommendations(userId, insights);

      return {
        userId,
        insights,
        recommendations,
        lastUpdated: new Date().toISOString()
      };
    }, 'getUserSearchInsights');
  }

  /**
   * Get user engagement metrics
   */
  static async getUserEngagement(userId: string, days: number = 30): Promise<UserEngagement[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const activities = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.USER_ACTIVITIES,
        [
          Query.equal('userId', userId),
          Query.greaterThan('timestamp', startDate.toISOString()),
          Query.limit(1000)
        ]
      );

      // Group activities by date and calculate metrics
      const engagementByDate = this.calculateDailyEngagement(activities.documents);
      
      return engagementByDate;
    }, 'getUserEngagement');
  }

  /**
   * Get matching effectiveness metrics
   */
  static async getMatchingEffectiveness(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<MatchingEffectiveness> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const periodDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

      // Get recommendations and interactions for the period
      const [recommendations, interactions, conversions] = await Promise.all([
        this.getUserRecommendations(userId, startDate),
        this.getUserInteractions(userId, startDate),
        this.getUserConversions(userId, startDate)
      ]);

      const metrics = this.calculateMatchingMetrics(recommendations, interactions, conversions);
      const trends = await this.calculateMatchingTrends(userId, period);

      return {
        userId,
        period,
        metrics,
        trends,
        timestamp: new Date().toISOString()
      };
    }, 'getMatchingEffectiveness');
  }

  /**
   * Optimize search results based on user behavior
   */
  static async optimizeSearch(
    userId: string,
    originalFilters: any,
    searchHistory: SearchAnalytics[]
  ): Promise<SearchOptimization> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Analyze user's search patterns
      const patterns = await this.analyzeUserSearchPatterns(userId, searchHistory);
      
      // Generate optimized filters
      const optimizedFilters = this.generateOptimizedFilters(originalFilters, patterns);
      
      // Calculate improvement score
      const improvementScore = this.calculateOptimizationScore(originalFilters, optimizedFilters, patterns);

      const optimization: SearchOptimization = {
        searchId: ID.unique(),
        originalQuery: originalFilters,
        optimizedQuery: optimizedFilters,
        originalResultsCount: 0, // Would be filled by calling service
        optimizedResultsCount: 0, // Would be filled by calling service
        improvementScore,
        optimizationReason: this.generateOptimizationReason(patterns),
        timestamp: new Date().toISOString()
      };

      // Store optimization for learning
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_ANALYTICS,
        ID.unique(),
        {
          userId,
          optimizationType: 'search_optimization',
          optimizationData: JSON.stringify(optimization),
          timestamp: optimization.timestamp
        }
      );

      return optimization;
    }, 'optimizeSearch');
  }

  /**
   * Track user journey progression
   */
  static async trackUserJourney(
    userId: string,
    stepType: UserJourney['steps'][0]['stepType'],
    metadata?: Record<string, any>
  ): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get or create user journey
      let journey = await this.getUserJourney(userId);
      
      if (!journey) {
        journey = {
          userId,
          journeyId: ID.unique(),
          startTime: new Date().toISOString(),
          steps: [],
          currentStage: 'onboarding',
          completionRate: 0
        };
      }

      // Add new step
      journey.steps.push({
        stepType,
        timestamp: new Date().toISOString(),
        metadata
      });

      // Update current stage and completion rate
      journey.currentStage = this.determineCurrentStage(journey.steps);
      journey.completionRate = this.calculateJourneyCompletion(journey.steps);

      // Store updated journey
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_ANALYTICS,
        ID.unique(),
        {
          userId,
          journeyData: JSON.stringify(journey),
          currentStage: journey.currentStage,
          completionRate: journey.completionRate,
          timestamp: new Date().toISOString()
        }
      );
    }, 'trackUserJourney');
  }

  // Private helper methods

  private static async updateSearchPatterns(searchData: SearchAnalytics): Promise<void> {
    try {
      // Analyze filters for patterns
      const filterPatterns = this.extractFilterPatterns(searchData.filters);
      
      for (const pattern of filterPatterns) {
        // Check if pattern exists
        const existingPatterns = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_IDS.MATCH_ANALYTICS,
          [
            Query.equal('userId', searchData.userId),
            Query.equal('patternType', pattern.type),
            Query.limit(1)
          ]
        );

        if (existingPatterns.documents.length > 0) {
          // Update existing pattern
          const existing = existingPatterns.documents[0];
          const patternData = JSON.parse(existing.patternData) as SearchPattern;
          
          patternData.frequency += 1;
          patternData.lastSeen = new Date().toISOString();
          patternData.confidence = Math.min(1, patternData.confidence + 0.1);

          await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_IDS.MATCH_ANALYTICS,
            existing.$id,
            {
              patternData: JSON.stringify(patternData),
              frequency: patternData.frequency,
              lastSeen: patternData.lastSeen
            }
          );
        } else {
          // Create new pattern
          const newPattern: SearchPattern = {
            userId: searchData.userId,
            patternType: pattern.type as any,
            pattern: pattern.data,
            frequency: 1,
            lastSeen: new Date().toISOString(),
            confidence: 0.3
          };

          await databases.createDocument(
            DATABASE_ID,
            COLLECTION_IDS.MATCH_ANALYTICS,
            ID.unique(),
            {
              userId: searchData.userId,
              patternType: pattern.type,
              patternData: JSON.stringify(newPattern),
              frequency: 1,
              lastSeen: newPattern.lastSeen
            }
          );
        }
      }
    } catch (error) {
      console.warn('Failed to update search patterns:', error);
    }
  }

  private static async checkAndTrackConversions(behavior: UserBehavior): Promise<void> {
    try {
      // Check for conversion events based on behavior
      if (behavior.behaviorType === 'profile_view' && behavior.metadata.source === 'search') {
        // Track search to view conversion
        await this.trackConversion({
          userId: behavior.userId,
          eventType: 'search_to_view',
          sourceId: behavior.metadata.searchId || 'unknown',
          targetId: behavior.targetUserId,
          conversionTime: behavior.duration || 0
        });
      } else if (behavior.behaviorType === 'interest_sent' && behavior.metadata.source === 'profile_view') {
        // Track view to interest conversion
        await this.trackConversion({
          userId: behavior.userId,
          eventType: 'view_to_interest',
          sourceId: behavior.metadata.profileViewId || 'unknown',
          targetId: behavior.targetUserId,
          conversionTime: behavior.duration || 0
        });
      }
    } catch (error) {
      console.warn('Failed to track conversions:', error);
    }
  }

  private static async getUserSearchHistory(userId: string, limit: number): Promise<SearchAnalytics[]> {
    const activities = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.USER_ACTIVITIES,
      [
        Query.equal('userId', userId),
        Query.equal('activityType', 'search'),
        Query.orderDesc('timestamp'),
        Query.limit(limit)
      ]
    );

    return activities.documents.map(doc => JSON.parse(doc.searchData) as SearchAnalytics);
  }

  private static async analyzeSearchPatterns(searchHistory: SearchAnalytics[]): Promise<SearchInsights['insights']> {
    // Analyze most searched filters
    const filterCounts: Record<string, number> = {};
    let totalResults = 0;
    let totalSearches = searchHistory.length;

    searchHistory.forEach(search => {
      totalResults += search.resultsCount;
      
      Object.entries(search.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const filterKey = Array.isArray(value) ? `${key}:${value.join(',')}` : `${key}:${value}`;
          filterCounts[filterKey] = (filterCounts[filterKey] || 0) + 1;
        }
      });
    });

    const mostSearchedFilters = Object.entries(filterCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([filter, count]) => ({ filter, count }));

    // Calculate search times
    const searchTimes: Record<number, number> = {};
    searchHistory.forEach(search => {
      const hour = new Date(search.timestamp).getHours();
      searchTimes[hour] = (searchTimes[hour] || 0) + 1;
    });

    const preferredSearchTimes = Object.entries(searchTimes)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);

    return {
      mostSearchedFilters,
      averageResultsPerSearch: totalSearches > 0 ? totalResults / totalSearches : 0,
      searchToViewConversionRate: 0, // Would be calculated from conversion data
      viewToInterestConversionRate: 0, // Would be calculated from conversion data
      preferredSearchTimes,
      searchPatternTrends: [] // Would be calculated from historical data
    };
  }

  private static async generateSearchRecommendations(
    userId: string,
    insights: SearchInsights['insights']
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze patterns and generate recommendations
    if (insights.averageResultsPerSearch < 5) {
      recommendations.push('Try broadening your search criteria to find more matches');
    }

    if (insights.searchToViewConversionRate < 0.3) {
      recommendations.push('Consider adjusting your filters to find more relevant profiles');
    }

    if (insights.mostSearchedFilters.length > 0) {
      const topFilter = insights.mostSearchedFilters[0];
      recommendations.push(`You frequently search with ${topFilter.filter}. Try exploring similar options.`);
    }

    return recommendations.slice(0, 3);
  }

  private static calculateDailyEngagement(activities: any[]): UserEngagement[] {
    const engagementByDate: Record<string, UserEngagement> = {};

    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      
      if (!engagementByDate[date]) {
        engagementByDate[date] = {
          userId: activity.userId,
          date,
          metrics: {
            sessionsCount: 0,
            totalTimeSpent: 0,
            profilesViewed: 0,
            searchesPerformed: 0,
            interestsSent: 0,
            interestsReceived: 0,
            profileUpdates: 0,
            loginCount: 0
          },
          engagementScore: 0
        };
      }

      const engagement = engagementByDate[date];
      
      // Update metrics based on activity type
      switch (activity.activityType) {
        case 'profile_view':
          engagement.metrics.profilesViewed++;
          break;
        case 'search':
          engagement.metrics.searchesPerformed++;
          break;
        case 'interest':
          engagement.metrics.interestsSent++;
          break;
        // Add more activity types as needed
      }

      if (activity.duration) {
        engagement.metrics.totalTimeSpent += activity.duration / 60000; // Convert to minutes
      }
    });

    // Calculate engagement scores
    Object.values(engagementByDate).forEach(engagement => {
      const metrics = engagement.metrics;
      engagement.engagementScore = Math.min(100, 
        (metrics.profilesViewed * 2) +
        (metrics.searchesPerformed * 3) +
        (metrics.interestsSent * 5) +
        (metrics.totalTimeSpent * 0.5)
      );
    });

    return Object.values(engagementByDate);
  }

  private static async getUserRecommendations(userId: string, startDate: Date): Promise<any[]> {
    const recommendations = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.MATCH_RECOMMENDATIONS,
      [
        Query.equal('userId', userId),
        Query.greaterThan('generatedAt', startDate.toISOString()),
        Query.limit(100)
      ]
    );

    return recommendations.documents;
  }

  private static async getUserInteractions(userId: string, startDate: Date): Promise<any[]> {
    const interactions = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.USER_ACTIVITIES,
      [
        Query.equal('userId', userId),
        Query.greaterThan('timestamp', startDate.toISOString()),
        Query.limit(200)
      ]
    );

    return interactions.documents;
  }

  private static async getUserConversions(userId: string, startDate: Date): Promise<any[]> {
    const conversions = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.MATCH_ANALYTICS,
      [
        Query.equal('userId', userId),
        Query.greaterThan('timestamp', startDate.toISOString()),
        Query.limit(100)
      ]
    );

    return conversions.documents;
  }

  private static calculateMatchingMetrics(recommendations: any[], interactions: any[], conversions: any[]): MatchingEffectiveness['metrics'] {
    const recommendationsShown = recommendations.length;
    const recommendationsViewed = interactions.filter(i => i.activityType === 'profile_view').length;
    const recommendationsInterested = interactions.filter(i => i.activityType === 'interest').length;
    
    const compatibilityScores = recommendations
      .map(r => JSON.parse(r.compatibilityData || '{}'))
      .filter(c => c.overall)
      .map(c => c.overall);
    
    const averageCompatibilityScore = compatibilityScores.length > 0 
      ? compatibilityScores.reduce((sum, score) => sum + score, 0) / compatibilityScores.length 
      : 0;

    const highQualityMatches = compatibilityScores.filter(score => score > 80).length;

    return {
      recommendationsShown,
      recommendationsViewed,
      recommendationsInterested,
      averageCompatibilityScore: Math.round(averageCompatibilityScore),
      highQualityMatches,
      successfulConnections: conversions.filter(c => c.eventType === 'interest_to_acceptance').length,
      userSatisfactionScore: 75 // Would be calculated from feedback data
    };
  }

  private static async calculateMatchingTrends(userId: string, period: string): Promise<MatchingEffectiveness['trends']> {
    // This would compare current period with previous period
    // Simplified implementation
    return {
      improvementRate: 5.2,
      qualityTrend: 'improving',
      engagementTrend: 'increasing'
    };
  }

  private static extractFilterPatterns(filters: any): Array<{ type: string; data: any }> {
    const patterns: Array<{ type: string; data: any }> = [];

    if (filters.ageMin && filters.ageMax) {
      patterns.push({
        type: 'age_preference_trend',
        data: { min: filters.ageMin, max: filters.ageMax }
      });
    }

    if (filters.districts && filters.districts.length > 0) {
      patterns.push({
        type: 'location_expansion',
        data: { districts: filters.districts }
      });
    }

    if (filters.educationLevels && filters.educationLevels.length > 0) {
      patterns.push({
        type: 'education_preference',
        data: { levels: filters.educationLevels }
      });
    }

    return patterns;
  }

  private static async analyzeUserSearchPatterns(userId: string, searchHistory: SearchAnalytics[]): Promise<any> {
    // Analyze user's search patterns for optimization
    const patterns = {
      preferredAgeRange: { min: 22, max: 35 },
      preferredLocations: [] as string[],
      preferredEducation: [] as string[],
      searchFrequency: searchHistory.length,
      averageResultsViewed: 0
    };

    // Extract patterns from search history
    searchHistory.forEach(search => {
      if (search.filters.ageMin) patterns.preferredAgeRange.min = Math.min(patterns.preferredAgeRange.min, search.filters.ageMin);
      if (search.filters.ageMax) patterns.preferredAgeRange.max = Math.max(patterns.preferredAgeRange.max, search.filters.ageMax);
      
      if (search.filters.districts) {
        search.filters.districts.forEach(district => {
          if (!patterns.preferredLocations.includes(district)) {
            patterns.preferredLocations.push(district);
          }
        });
      }
    });

    return patterns;
  }

  private static generateOptimizedFilters(originalFilters: any, patterns: any): any {
    const optimized = { ...originalFilters };

    // Apply pattern-based optimizations
    if (patterns.preferredAgeRange) {
      optimized.ageMin = Math.max(originalFilters.ageMin || 18, patterns.preferredAgeRange.min - 2);
      optimized.ageMax = Math.min(originalFilters.ageMax || 50, patterns.preferredAgeRange.max + 2);
    }

    if (patterns.preferredLocations && patterns.preferredLocations.length > 0) {
      optimized.districts = [...(originalFilters.districts || []), ...patterns.preferredLocations];
    }

    return optimized;
  }

  private static calculateOptimizationScore(original: any, optimized: any, patterns: any): number {
    // Calculate how much the optimization might improve results
    let score = 0;

    if (optimized.ageMin !== original.ageMin || optimized.ageMax !== original.ageMax) {
      score += 20;
    }

    if (optimized.districts && optimized.districts.length > (original.districts?.length || 0)) {
      score += 30;
    }

    return Math.min(100, score);
  }

  private static generateOptimizationReason(patterns: any): string {
    const reasons = [];

    if (patterns.preferredAgeRange) {
      reasons.push('Adjusted age range based on your search history');
    }

    if (patterns.preferredLocations && patterns.preferredLocations.length > 0) {
      reasons.push('Expanded location preferences based on your interests');
    }

    return reasons.join('; ') || 'General optimization based on platform trends';
  }

  private static async getUserJourney(userId: string): Promise<UserJourney | null> {
    try {
      const journeys = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.MATCH_ANALYTICS,
        [
          Query.equal('userId', userId),
          Query.orderDesc('timestamp'),
          Query.limit(1)
        ]
      );

      if (journeys.documents.length > 0) {
        return JSON.parse(journeys.documents[0].journeyData) as UserJourney;
      }

      return null;
    } catch (error) {
      console.warn('Failed to get user journey:', error);
      return null;
    }
  }

  private static determineCurrentStage(steps: UserJourney['steps']): UserJourney['currentStage'] {
    const stepTypes = steps.map(s => s.stepType);

    if (stepTypes.includes('first_match')) return 'connected';
    if (stepTypes.includes('first_interest')) return 'matching';
    if (stepTypes.includes('first_view')) return 'engaging';
    if (stepTypes.includes('first_search')) return 'exploring';
    return 'onboarding';
  }

  private static calculateJourneyCompletion(steps: UserJourney['steps']): number {
    const totalSteps = 6; // registration, profile_creation, first_search, first_view, first_interest, first_match
    const completedSteps = new Set(steps.map(s => s.stepType)).size;
    return Math.round((completedSteps / totalSteps) * 100);
  }
}