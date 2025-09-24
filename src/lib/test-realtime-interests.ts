/**
 * Test script for real-time interest updates functionality
 * This script tests the core real-time interest features
 */

import { RealtimeInterestService } from './services/realtime-interest.service';
import { InterestService } from './services/interest.service';
import type { 
  RealtimeInterestData, 
  InterestCountUpdate, 
  MatchSuggestion, 
  LiveActivityFeed 
} from './services/realtime-interest.service';

// Mock user ID for testing
const TEST_USER_ID = 'test_user_123';

/**
 * Test real-time interest updates subscription
 */
export async function testRealtimeInterestUpdates(): Promise<void> {
  console.log('🧪 Testing real-time interest updates...');

  try {
    // Subscribe to real-time interest updates
    const unsubscribe = RealtimeInterestService.subscribeToInterestUpdates(
      TEST_USER_ID,
      (data: RealtimeInterestData) => {
        console.log('📨 Received real-time interest update:', {
          action: data.action,
          interestId: data.interest.$id,
          senderId: data.interest.senderId,
          receiverId: data.interest.receiverId,
          status: data.interest.status,
          timestamp: data.timestamp,
        });
      }
    );

    console.log('✅ Successfully subscribed to real-time interest updates');

    // Test for 10 seconds then unsubscribe
    setTimeout(() => {
      unsubscribe();
      console.log('🔌 Unsubscribed from real-time interest updates');
    }, 10000);

  } catch (error) {
    console.error('❌ Failed to test real-time interest updates:', error);
  }
}

/**
 * Test interest count updates
 */
export async function testInterestCountUpdates(): Promise<void> {
  console.log('🧪 Testing interest count updates...');

  try {
    // Subscribe to interest count updates
    const unsubscribe = RealtimeInterestService.subscribeToInterestCounts(
      TEST_USER_ID,
      (data: InterestCountUpdate) => {
        console.log('📊 Received interest count update:', {
          userId: data.userId,
          sent: data.sentCount,
          received: data.receivedCount,
          unread: data.unreadCount,
          mutual: data.mutualCount,
          timestamp: data.timestamp,
        });
      }
    );

    console.log('✅ Successfully subscribed to interest count updates');

    // Test for 10 seconds then unsubscribe
    setTimeout(() => {
      unsubscribe();
      console.log('🔌 Unsubscribed from interest count updates');
    }, 10000);

  } catch (error) {
    console.error('❌ Failed to test interest count updates:', error);
  }
}

/**
 * Test match suggestions
 */
export async function testMatchSuggestions(): Promise<void> {
  console.log('🧪 Testing match suggestions...');

  try {
    // Subscribe to match suggestions
    const unsubscribe = RealtimeInterestService.subscribeToMatchSuggestions(
      TEST_USER_ID,
      (data: MatchSuggestion) => {
        console.log('💡 Received match suggestion:', {
          suggestedUserId: data.suggestedUserId,
          matchScore: data.matchScore,
          reason: data.reason,
          commonInterests: data.commonInterests,
          timestamp: data.timestamp,
        });
      }
    );

    console.log('✅ Successfully subscribed to match suggestions');

    // Test for 15 seconds then unsubscribe
    setTimeout(() => {
      unsubscribe();
      console.log('🔌 Unsubscribed from match suggestions');
    }, 15000);

  } catch (error) {
    console.error('❌ Failed to test match suggestions:', error);
  }
}

/**
 * Test activity feed
 */
export async function testActivityFeed(): Promise<void> {
  console.log('🧪 Testing activity feed...');

  try {
    // Subscribe to activity feed
    const unsubscribe = RealtimeInterestService.subscribeToActivityFeed(
      TEST_USER_ID,
      (data: LiveActivityFeed) => {
        console.log('📈 Received activity feed update:', {
          userId: data.userId,
          activityType: data.activityType,
          isPublic: data.isPublic,
          timestamp: data.timestamp,
          activityData: data.activityData,
        });
      }
    );

    console.log('✅ Successfully subscribed to activity feed');

    // Test for 10 seconds then unsubscribe
    setTimeout(() => {
      unsubscribe();
      console.log('🔌 Unsubscribed from activity feed');
    }, 10000);

  } catch (error) {
    console.error('❌ Failed to test activity feed:', error);
  }
}

/**
 * Test sending interest with real-time updates
 */
export async function testSendInterestWithRealtime(): Promise<void> {
  console.log('🧪 Testing send interest with real-time updates...');

  try {
    const receiverId = 'test_receiver_456';
    const message = 'Test interest message with real-time updates';

    const interest = await RealtimeInterestService.sendInterestWithRealtime(
      TEST_USER_ID,
      receiverId,
      message
    );

    console.log('✅ Successfully sent interest with real-time updates:', {
      interestId: interest.$id,
      senderId: interest.senderId,
      receiverId: interest.receiverId,
      status: interest.status,
      message: interest.message,
    });

  } catch (error) {
    console.error('❌ Failed to test send interest with real-time:', error);
  }
}

/**
 * Test live interest statistics
 */
export async function testLiveInterestStats(): Promise<void> {
  console.log('🧪 Testing live interest statistics...');

  try {
    const stats = await RealtimeInterestService.getLiveInterestStats(TEST_USER_ID);

    console.log('✅ Successfully retrieved live interest stats:', {
      totalSent: stats.totalSent,
      totalReceived: stats.totalReceived,
      acceptedSent: stats.acceptedSent,
      acceptedReceived: stats.acceptedReceived,
      declinedSent: stats.declinedSent,
      declinedReceived: stats.declinedReceived,
      mutualInterests: stats.mutualInterests,
      isLive: stats.isLive,
    });

  } catch (error) {
    console.error('❌ Failed to test live interest stats:', error);
  }
}

/**
 * Test subscription management
 */
export async function testSubscriptionManagement(): Promise<void> {
  console.log('🧪 Testing subscription management...');

  try {
    // Get initial subscription count
    const initialCount = RealtimeInterestService.getActiveSubscriptionCount();
    console.log(`📊 Initial subscription count: ${initialCount}`);

    // Create multiple subscriptions
    const unsubscribe1 = RealtimeInterestService.subscribeToInterestUpdates(TEST_USER_ID, () => {});
    const unsubscribe2 = RealtimeInterestService.subscribeToInterestCounts(TEST_USER_ID, () => {});
    const unsubscribe3 = RealtimeInterestService.subscribeToMatchSuggestions(TEST_USER_ID, () => {});

    const activeCount = RealtimeInterestService.getActiveSubscriptionCount();
    console.log(`📊 Active subscription count after creating 3: ${activeCount}`);

    // Unsubscribe individually
    unsubscribe1();
    unsubscribe2();
    unsubscribe3();

    const finalCount = RealtimeInterestService.getActiveSubscriptionCount();
    console.log(`📊 Final subscription count after cleanup: ${finalCount}`);

    // Test unsubscribe all
    RealtimeInterestService.subscribeToInterestUpdates(TEST_USER_ID, () => {});
    RealtimeInterestService.subscribeToInterestCounts(TEST_USER_ID, () => {});
    
    const beforeUnsubscribeAll = RealtimeInterestService.getActiveSubscriptionCount();
    console.log(`📊 Before unsubscribe all: ${beforeUnsubscribeAll}`);

    RealtimeInterestService.unsubscribeAll(TEST_USER_ID);
    
    const afterUnsubscribeAll = RealtimeInterestService.getActiveSubscriptionCount();
    console.log(`📊 After unsubscribe all: ${afterUnsubscribeAll}`);

    console.log('✅ Successfully tested subscription management');

  } catch (error) {
    console.error('❌ Failed to test subscription management:', error);
  }
}

/**
 * Run all real-time interest tests
 */
export async function runAllRealtimeInterestTests(): Promise<void> {
  console.log('🚀 Starting real-time interest tests...\n');

  await testLiveInterestStats();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testSubscriptionManagement();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testRealtimeInterestUpdates();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testInterestCountUpdates();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testMatchSuggestions();
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testActivityFeed();
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Note: This test requires actual Appwrite connection
  // await testSendInterestWithRealtime();

  console.log('\n🎉 All real-time interest tests completed!');
}

// Export individual test functions for selective testing
export {
  testRealtimeInterestUpdates,
  testInterestCountUpdates,
  testMatchSuggestions,
  testActivityFeed,
  testSendInterestWithRealtime,
  testLiveInterestStats,
  testSubscriptionManagement,
};