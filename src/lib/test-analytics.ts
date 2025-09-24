/**
 * Test file for analytics and user behavior tracking functionality
 * This file can be used to test the analytics system
 */

import { AnalyticsService } from './services/analytics.service';
import type {
  SearchAnalytics,
  UserBehavior,
  ConversionEvent,
  SearchInsights,
  UserEngagement,
  MatchingEffectiveness
} from './types/analytics.types';

// Mock data for testing
const mockUserId = 'test_user_123';
const mockSessionId = 'session_test_456';
const mockTargetUserId = 'target_user_789';

/**
 * Test search analytics tracking
 */
export async function testSearchTracking() {
  console.log('🧪 Testing Search Analytics Tracking...');
  
  try {
    const searchData: Omit<SearchAnalytics, 'searchId' | 'timestamp'> = {
      userId: mockUserId,
      searchQuery: 'engineer teacher',
      filters: {
        gender: 'female',
        ageMin: 25,
        ageMax: 30,
        districts: ['Madhubani', 'Darbhanga'],
        educationLevels: ['Bachelor\'s Degree', 'Master\'s Degree'],
        sects: ['Sunni'],
        isVerified: true
      },
      resultsCount: 15,
      searchDuration: 2500, // 2.5 seconds
      source: 'manual_search',
      sessionId: mockSessionId
    };

    await AnalyticsService.trackSearch(searchData);
    console.log('✅ Search tracking successful');
    
    return searchData;
  } catch (error) {
    console.error('❌ Search tracking failed:', error);
    throw error;
  }
}

/**
 * Test user behavior tracking
 */
export async function testBehaviorTracking() {
  console.log('🧪 Testing User Behavior Tracking...');
  
  try {
    const behaviors: Array<Omit<UserBehavior, 'timestamp'>> = [
      {
        userId: mockUserId,
        sessionId: mockSessionId,
        behaviorType: 'profile_view',
        targetUserId: mockTargetUserId,
        metadata: {
          source: 'search_results',
          searchId: 'search_123',
          position: 1,
          compatibilityScore: 85
        },
        duration: 45000, // 45 seconds
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          platform: 'Win32',
          screenResolution: '1920x1080',
          isMobile: false,
          isTablet: false,
          isDesktop: true
        },
        location: {
          country: 'India',
          region: 'Bihar',
          city: 'Madhubani',
          timezone: 'Asia/Kolkata'
        }
      },
      {
        userId: mockUserId,
        sessionId: mockSessionId,
        behaviorType: 'interest_sent',
        targetUserId: mockTargetUserId,
        metadata: {
          source: 'profile_view',
          profileViewId: 'view_456',
          message: 'Interested in your profile'
        },
        duration: 5000 // 5 seconds to send interest
      },
      {
        userId: mockUserId,
        sessionId: mockSessionId,
        behaviorType: 'search',
        metadata: {
          filtersChanged: ['ageMax', 'districts'],
          previousResultsCount: 15,
          newResultsCount: 23
        },
        duration: 3000 // 3 seconds for search
      }
    ];

    for (const behavior of behaviors) {
      await AnalyticsService.trackUserBehavior(behavior);
    }

    console.log('✅ Behavior tracking successful');
    return behaviors;
  } catch (error) {
    console.error('❌ Behavior tracking failed:', error);
    throw error;
  }
}

/**
 * Test conversion tracking
 */
export async function testConversionTracking() {
  console.log('🧪 Testing Conversion Tracking...');
  
  try {
    const conversions: Array<Omit<ConversionEvent, 'timestamp'>> = [
      {
        userId: mockUserId,
        eventType: 'search_to_view',
        sourceId: 'search_123',
        targetId: mockTargetUserId,
        conversionTime: 15000, // 15 seconds from search to view
        metadata: {
          searchPosition: 1,
          searchResultsCount: 15
        }
      },
      {
        userId: mockUserId,
        eventType: 'view_to_interest',
        sourceId: 'view_456',
        targetId: mockTargetUserId,
        conversionTime: 45000, // 45 seconds from view to interest
        metadata: {
          viewDuration: 45000,
          compatibilityScore: 85
        }
      },
      {
        userId: mockUserId,
        eventType: 'profile_completion',
        sourceId: mockUserId,
        conversionTime: 0,
        metadata: {
          completionPercentage: 95,
          sectionsCompleted: ['basic_info', 'education', 'family', 'preferences']
        }
      }
    ];

    for (const conversion of conversions) {
      await AnalyticsService.trackConversion(conversion);
    }

    console.log('✅ Conversion tracking successful');
    return conversions;
  } catch (error) {
    console.error('❌ Conversion tracking failed:', error);
    throw error;
  }
}

/**
 * Test user journey tracking
 */
export async function testUserJourneyTracking() {
  console.log('🧪 Testing User Journey Tracking...');
  
  try {
    const journeySteps: Array<{
      stepType: Parameters<typeof AnalyticsService.trackUserJourney>[1];
      metadata?: Record<string, any>;
    }> = [
      {
        stepType: 'registration',
        metadata: { registrationMethod: 'email', source: 'organic' }
      },
      {
        stepType: 'profile_creation',
        metadata: { completionTime: 300000, sectionsCompleted: 8 }
      },
      {
        stepType: 'first_search',
        metadata: { filtersUsed: 3, resultsFound: 15 }
      },
      {
        stepType: 'first_view',
        metadata: { viewDuration: 45000, profileCompatibility: 85 }
      },
      {
        stepType: 'first_interest',
        metadata: { timeSinceRegistration: 3600000, interestMessage: true }
      }
    ];

    for (const step of journeySteps) {
      await AnalyticsService.trackUserJourney(mockUserId, step.stepType, step.metadata);
    }

    console.log('✅ User journey tracking successful');
    return journeySteps;
  } catch (error) {
    console.error('❌ User journey tracking failed:', error);
    throw error;
  }
}

/**
 * Test analytics insights generation
 */
export async function testAnalyticsInsights() {
  console.log('🧪 Testing Analytics Insights Generation...');
  
  try {
    // Get search insights
    const searchInsights = await AnalyticsService.getUserSearchInsights(mockUserId);
    console.log('✅ Search insights generated:');
    console.log(`  - Most searched filters: ${searchInsights.insights.mostSearchedFilters.length}`);
    console.log(`  - Average results per search: ${searchInsights.insights.averageResultsPerSearch}`);
    console.log(`  - Recommendations: ${searchInsights.recommendations.length}`);

    // Get user engagement
    const userEngagement = await AnalyticsService.getUserEngagement(mockUserId, 30);
    console.log('✅ User engagement calculated:');
    console.log(`  - Days with activity: ${userEngagement.length}`);
    if (userEngagement.length > 0) {
      const avgEngagement = userEngagement.reduce((sum, day) => sum + day.engagementScore, 0) / userEngagement.length;
      console.log(`  - Average engagement score: ${Math.round(avgEngagement)}`);
    }

    // Get matching effectiveness
    const matchingEffectiveness = await AnalyticsService.getMatchingEffectiveness(mockUserId, 'weekly');
    console.log('✅ Matching effectiveness calculated:');
    console.log(`  - Recommendations shown: ${matchingEffectiveness.metrics.recommendationsShown}`);
    console.log(`  - Average compatibility: ${matchingEffectiveness.metrics.averageCompatibilityScore}%`);
    console.log(`  - Quality trend: ${matchingEffectiveness.trends.qualityTrend}`);

    return {
      searchInsights,
      userEngagement,
      matchingEffectiveness
    };
  } catch (error) {
    console.error('❌ Analytics insights generation failed:', error);
    throw error;
  }
}

/**
 * Test search optimization
 */
export async function testSearchOptimization() {
  console.log('🧪 Testing Search Optimization...');
  
  try {
    const originalFilters = {
      gender: 'female',
      ageMin: 25,
      ageMax: 30,
      districts: ['Madhubani'],
      educationLevels: ['Bachelor\'s Degree'],
      sects: ['Sunni']
    };

    // Mock search history
    const searchHistory = [
      {
        userId: mockUserId,
        searchId: 'search_1',
        filters: { ...originalFilters, ageMax: 32 },
        resultsCount: 20,
        searchDuration: 2000,
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        source: 'manual_search' as const,
        sessionId: mockSessionId
      },
      {
        userId: mockUserId,
        searchId: 'search_2',
        filters: { ...originalFilters, districts: ['Madhubani', 'Darbhanga'] },
        resultsCount: 35,
        searchDuration: 1800,
        timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        source: 'manual_search' as const,
        sessionId: mockSessionId
      }
    ];

    const optimization = await AnalyticsService.optimizeSearch(mockUserId, originalFilters, searchHistory);
    
    console.log('✅ Search optimization generated:');
    console.log(`  - Improvement score: ${optimization.improvementScore}`);
    console.log(`  - Optimization reason: ${optimization.optimizationReason}`);
    console.log('  - Original filters:', JSON.stringify(optimization.originalQuery, null, 2));
    console.log('  - Optimized filters:', JSON.stringify(optimization.optimizedQuery, null, 2));

    return optimization;
  } catch (error) {
    console.error('❌ Search optimization failed:', error);
    throw error;
  }
}

/**
 * Run all analytics tests
 */
export async function runAllAnalyticsTests() {
  console.log('🚀 Running All Analytics Tests...\n');
  
  try {
    // Test 1: Search tracking
    await testSearchTracking();
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Behavior tracking
    await testBehaviorTracking();
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Conversion tracking
    await testConversionTracking();
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: User journey tracking
    await testUserJourneyTracking();
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 5: Analytics insights
    await testAnalyticsInsights();
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 6: Search optimization
    await testSearchOptimization();
    console.log('\n' + '='.repeat(50) + '\n');

    console.log('✅ All analytics tests completed successfully!');
  } catch (error) {
    console.error('❌ Analytics tests failed:', error);
  }
}

// Export mock data for use in other tests
export {
  mockUserId,
  mockSessionId,
  mockTargetUserId
};