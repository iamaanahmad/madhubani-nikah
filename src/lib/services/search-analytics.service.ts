import { ID } from 'appwrite';
import { databases, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS } from '../appwrite-config';
import { AnalyticsService } from './analytics.service';
import type { SearchAnalytics as NewSearchAnalytics } from '../types/analytics.types';

export interface SearchAnalytics {
  $id?: string;
  userId?: string;
  searchQuery?: string;
  filters: Record<string, any>;
  resultCount: number;
  clickedProfileId?: string;
  searchTimestamp: string;
  sessionId: string;
  userAgent?: string;
  location?: string;
}

export interface SearchInsights {
  popularFilters: Array<{ filter: string; count: number }>;
  popularSearchTerms: Array<{ term: string; count: number }>;
  averageResultCount: number;
  clickThroughRate: number;
  searchTrends: Array<{ date: string; searchCount: number }>;
}

export class SearchAnalyticsService {
  /**
   * Track a search event
   */
  static async trackSearch(
    searchData: Omit<SearchAnalytics, '$id' | 'searchTimestamp'>
  ): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const analyticsData: Partial<SearchAnalytics> = {
        ...searchData,
        searchTimestamp: new Date().toISOString()
      };

      // Store in legacy format
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.SEARCH_ANALYTICS,
        ID.unique(),
        analyticsData
      );

      // Also track in new analytics system
      if (searchData.userId) {
        const newAnalyticsData: Omit<NewSearchAnalytics, 'searchId' | 'timestamp'> = {
          userId: searchData.userId,
          searchQuery: searchData.searchQuery,
          filters: searchData.filters,
          resultsCount: searchData.resultCount,
          searchDuration: 0, // Would be measured in real implementation
          source: 'manual_search',
          sessionId: searchData.sessionId
        };

        await AnalyticsService.trackSearch(newAnalyticsData);
      }
    }, 'trackSearch');
  }

  /**
   * Track when a user clicks on a profile from search results
   */
  static async trackProfileClick(
    searchId: string,
    profileId: string
  ): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Update the search record with the clicked profile
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.SEARCH_ANALYTICS,
        searchId,
        {
          clickedProfileId: profileId
        }
      );
    }, 'trackProfileClick');
  }

  /**
   * Get search insights for analytics dashboard
   */
  static async getSearchInsights(
    userId?: string,
    dateRange?: { from: string; to: string }
  ): Promise<SearchInsights> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // This would require aggregation queries which might need to be implemented
      // on the backend or using Appwrite Functions
      
      // For now, return mock data structure
      return {
        popularFilters: [
          { filter: 'age_range_25_30', count: 150 },
          { filter: 'education_graduate', count: 120 },
          { filter: 'district_madhubani', count: 100 }
        ],
        popularSearchTerms: [
          { term: 'engineer', count: 80 },
          { term: 'teacher', count: 65 },
          { term: 'doctor', count: 45 }
        ],
        averageResultCount: 12.5,
        clickThroughRate: 0.35,
        searchTrends: [
          { date: '2024-01-01', searchCount: 45 },
          { date: '2024-01-02', searchCount: 52 },
          { date: '2024-01-03', searchCount: 38 }
        ]
      };
    }, 'getSearchInsights');
  }

  /**
   * Get user's search history
   */
  static async getUserSearchHistory(
    userId: string,
    limit: number = 20
  ): Promise<SearchAnalytics[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.SEARCH_ANALYTICS,
        [
          `equal("userId", "${userId}")`,
          `limit(${limit})`,
          'orderDesc("searchTimestamp")'
        ]
      );

      return result.documents as SearchAnalytics[];
    }, 'getUserSearchHistory');
  }

  /**
   * Generate session ID for tracking user search sessions
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get popular search filters
   */
  static async getPopularFilters(limit: number = 10): Promise<Array<{ filter: string; count: number }>> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // This would require aggregation - for now return static data
      return [
        { filter: 'age_25_30', count: 245 },
        { filter: 'education_graduate', count: 198 },
        { filter: 'district_madhubani', count: 156 },
        { filter: 'sect_sunni', count: 134 },
        { filter: 'occupation_engineer', count: 89 }
      ];
    }, 'getPopularFilters');
  }

  /**
   * Track search performance metrics
   */
  static async trackSearchPerformance(
    searchQuery: string,
    executionTime: number,
    resultCount: number
  ): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const performanceData = {
        searchQuery,
        executionTime,
        resultCount,
        timestamp: new Date().toISOString()
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.SEARCH_PERFORMANCE,
        ID.unique(),
        performanceData
      );
    }, 'trackSearchPerformance');
  }
}