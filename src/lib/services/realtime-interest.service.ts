import { RealtimeService } from './realtime.service';
import { InterestService } from './interest.service';
import { UserStatusService } from './user-status.service';
import { ProfileService } from './profile.service';
import type { Interest, InterestStats } from '../types/interest.types';

export interface RealtimeInterestData {
  interest: Interest;
  action: 'created' | 'updated' | 'deleted';
  timestamp: string;
  senderInfo?: {
    name: string;
    age?: number;
    location?: string;
    profilePictureId?: string;
  };
  receiverInfo?: {
    name: string;
    age?: number;
    location?: string;
    profilePictureId?: string;
  };
}

export interface InterestCountUpdate {
  userId: string;
  sentCount: number;
  receivedCount: number;
  unreadCount: number;
  mutualCount: number;
  timestamp: string;
}

export interface MatchSuggestion {
  userId: string;
  suggestedUserId: string;
  matchScore: number;
  commonInterests: string[];
  reason: string;
  timestamp: string;
}

export interface LiveActivityFeed {
  userId: string;
  activityType: 'interest_sent' | 'interest_received' | 'interest_accepted' | 'interest_declined' | 'mutual_match' | 'profile_view';
  activityData: Record<string, any>;
  timestamp: string;
  isPublic: boolean;
}

// Callback types for real-time interest updates
export type RealtimeInterestCallback = (data: RealtimeInterestData) => void;
export type InterestCountCallback = (data: InterestCountUpdate) => void;
export type MatchSuggestionCallback = (data: MatchSuggestion) => void;
export type ActivityFeedCallback = (data: LiveActivityFeed) => void;

export class RealtimeInterestService {
  private static interestSubscriptions: Map<string, () => void> = new Map();
  private static countSubscriptions: Map<string, () => void> = new Map();
  private static suggestionSubscriptions: Map<string, () => void> = new Map();
  private static activitySubscriptions: Map<string, () => void> = new Map();

  /**
   * Subscribe to real-time interest updates for a user
   */
  static subscribeToInterestUpdates(
    userId: string,
    callback: RealtimeInterestCallback
  ): () => void {
    const subscriptionKey = `interest_updates_${userId}`;

    try {
      const unsubscribe = RealtimeService.subscribeToInterests(
        userId,
        async (interest, action) => {
          // Enhance interest data with profile information
          const enhancedData = await this.enhanceInterestData(interest, action);
          callback(enhancedData);

          // Update interest counts
          await this.updateInterestCounts(userId);

          // Track activity
          await this.trackInterestActivity(interest, action);
        }
      );

      this.interestSubscriptions.set(subscriptionKey, unsubscribe);

      return () => {
        unsubscribe();
        this.interestSubscriptions.delete(subscriptionKey);
      };
    } catch (error) {
      console.error('Failed to subscribe to interest updates:', error);
      return () => {};
    }
  }

  /**
   * Subscribe to real-time interest count updates
   */
  static subscribeToInterestCounts(
    userId: string,
    callback: InterestCountCallback
  ): () => void {
    const subscriptionKey = `interest_counts_${userId}`;

    // Create a periodic update for interest counts
    const updateCounts = async () => {
      try {
        const stats = await InterestService.getInterestStats(userId);
        const unreadCount = await InterestService.getUnreadInterestsCount(userId);

        const countUpdate: InterestCountUpdate = {
          userId,
          sentCount: stats.totalSent,
          receivedCount: stats.totalReceived,
          unreadCount,
          mutualCount: stats.mutualInterests,
          timestamp: new Date().toISOString(),
        };

        callback(countUpdate);
      } catch (error) {
        console.error('Failed to update interest counts:', error);
      }
    };

    // Initial update
    updateCounts();

    // Set up periodic updates (every 30 seconds)
    const interval = setInterval(updateCounts, 30000);

    const unsubscribe = () => {
      clearInterval(interval);
    };

    this.countSubscriptions.set(subscriptionKey, unsubscribe);

    return () => {
      unsubscribe();
      this.countSubscriptions.delete(subscriptionKey);
    };
  }

  /**
   * Subscribe to real-time match suggestions
   */
  static subscribeToMatchSuggestions(
    userId: string,
    callback: MatchSuggestionCallback
  ): () => void {
    const subscriptionKey = `match_suggestions_${userId}`;

    // Generate match suggestions periodically
    const generateSuggestions = async () => {
      try {
        const suggestions = await this.generateMatchSuggestions(userId);
        suggestions.forEach(callback);
      } catch (error) {
        console.error('Failed to generate match suggestions:', error);
      }
    };

    // Initial suggestions
    generateSuggestions();

    // Set up periodic suggestions (every 5 minutes)
    const interval = setInterval(generateSuggestions, 5 * 60 * 1000);

    const unsubscribe = () => {
      clearInterval(interval);
    };

    this.suggestionSubscriptions.set(subscriptionKey, unsubscribe);

    return () => {
      unsubscribe();
      this.suggestionSubscriptions.delete(subscriptionKey);
    };
  }

  /**
   * Subscribe to live activity feed
   */
  static subscribeToActivityFeed(
    userId: string,
    callback: ActivityFeedCallback
  ): () => void {
    const subscriptionKey = `activity_feed_${userId}`;

    try {
      // Subscribe to user activities
      const unsubscribe = RealtimeService.subscribeToMultiple({
        interests: {
          userId,
          callback: async (interest, action) => {
            const activity = await this.createActivityFeedItem(userId, interest, action);
            if (activity) {
              callback(activity);
            }
          }
        }
      });

      this.activitySubscriptions.set(subscriptionKey, unsubscribe);

      return () => {
        unsubscribe();
        this.activitySubscriptions.delete(subscriptionKey);
      };
    } catch (error) {
      console.error('Failed to subscribe to activity feed:', error);
      return () => {};
    }
  }

  /**
   * Get live interest statistics
   */
  static async getLiveInterestStats(userId: string): Promise<InterestStats & { isLive: boolean }> {
    try {
      const stats = await InterestService.getInterestStats(userId);
      return {
        ...stats,
        isLive: true,
      };
    } catch (error) {
      console.error('Failed to get live interest stats:', error);
      throw error;
    }
  }

  /**
   * Send interest with real-time updates
   */
  static async sendInterestWithRealtime(
    senderId: string,
    receiverId: string,
    message?: string
  ): Promise<Interest> {
    try {
      // Send the interest
      const interest = await InterestService.sendInterest(senderId, {
        receiverId,
        message,
        type: 'proposal',
      });

      // Track activity
      await UserStatusService.trackActivity(senderId, 'interest_sent', {
        receiverId,
        interestId: interest.$id,
        interestType: interest.type,
      });

      // Update sender's online activity
      await UserStatusService.updateOnlineStatus(senderId, true, 'interest_sent');

      return interest;
    } catch (error) {
      console.error('Failed to send interest with realtime:', error);
      throw error;
    }
  }

  /**
   * Respond to interest with real-time updates
   */
  static async respondToInterestWithRealtime(
    userId: string,
    interestId: string,
    response: 'accepted' | 'declined'
  ): Promise<Interest> {
    try {
      // Respond to the interest
      const interest = await InterestService.respondToInterest(userId, {
        interestId,
        response,
      });

      // Track activity
      await UserStatusService.trackActivity(userId, 'interest_sent', {
        interestId,
        response,
        senderId: interest.senderId,
      });

      // Update user's online activity
      await UserStatusService.updateOnlineStatus(userId, true, `interest_${response}`);

      return interest;
    } catch (error) {
      console.error('Failed to respond to interest with realtime:', error);
      throw error;
    }
  }

  /**
   * Enhance interest data with profile information
   */
  private static async enhanceInterestData(
    interest: Interest,
    action: 'created' | 'updated' | 'deleted'
  ): Promise<RealtimeInterestData> {
    const enhancedData: RealtimeInterestData = {
      interest,
      action,
      timestamp: new Date().toISOString(),
    };

    try {
      // Fetch profile information for enhanced data
      try {
        const [senderProfile, receiverProfile] = await Promise.all([
          ProfileService.getProfile(interest.senderId),
          ProfileService.getProfile(interest.receiverId)
        ]);

        enhancedData.senderInfo = {
          name: senderProfile?.name || 'Unknown User',
          age: senderProfile?.age || 0,
          location: senderProfile?.village || 'Unknown',
        };

        enhancedData.receiverInfo = {
          name: receiverProfile?.name || 'Unknown User',
          age: receiverProfile?.age || 0,
          location: receiverProfile?.village || 'Unknown',
        };
      } catch (error) {
        console.error('Failed to enhance interest data:', error);
        // Set default values if profile fetch fails
        enhancedData.senderInfo = {
          name: 'Unknown User',
          age: 0,
          location: 'Unknown',
        };
        enhancedData.receiverInfo = {
          name: 'Unknown User',
          age: 0,
          location: 'Unknown',
        };
      }
    } catch (error) {
      console.error('Failed to enhance interest data:', error);
    }

    return enhancedData;
  }

  /**
   * Update interest counts for a user
   */
  private static async updateInterestCounts(userId: string): Promise<void> {
    try {
      // This would trigger count updates for subscribed clients
      // The actual implementation would use the count subscription callback
      console.log(`Updating interest counts for user ${userId}`);
    } catch (error) {
      console.error('Failed to update interest counts:', error);
    }
  }

  /**
   * Track interest activity
   */
  private static async trackInterestActivity(
    interest: Interest,
    action: 'created' | 'updated' | 'deleted'
  ): Promise<void> {
    try {
      let activityType: string;
      let userId: string;

      switch (action) {
        case 'created':
          activityType = 'interest_sent';
          userId = interest.senderId;
          break;
        case 'updated':
          if (interest.status === 'accepted') {
            activityType = 'interest_accepted';
            userId = interest.receiverId;
          } else if (interest.status === 'declined') {
            activityType = 'interest_declined';
            userId = interest.receiverId;
          } else {
            return; // Don't track other updates
          }
          break;
        default:
          return; // Don't track deletions
      }

      await UserStatusService.trackActivity(userId, activityType as any, {
        interestId: interest.$id,
        otherUserId: userId === interest.senderId ? interest.receiverId : interest.senderId,
        interestType: interest.type,
        interestStatus: interest.status,
      });
    } catch (error) {
      console.error('Failed to track interest activity:', error);
    }
  }

  /**
   * Generate match suggestions for a user
   */
  private static async generateMatchSuggestions(userId: string): Promise<MatchSuggestion[]> {
    try {
      // This would implement AI-based match suggestions
      // For now, generate some mock suggestions based on user activity
      const suggestions: MatchSuggestion[] = [];
      
      // Get user's recent interests to understand preferences
      const recentInterests = await InterestService.getSentInterests(userId);
      
      if (recentInterests.interests.length > 0) {
        // Generate suggestions based on patterns (simplified implementation)
        const suggestion: MatchSuggestion = {
          userId,
          suggestedUserId: 'suggested_user_' + Date.now(),
          matchScore: Math.floor(Math.random() * 30) + 70, // 70-100% match
          commonInterests: ['Education', 'Family Values', 'Location'],
          reason: 'High compatibility based on your preferences and activity patterns',
          timestamp: new Date().toISOString(),
        };
        
        suggestions.push(suggestion);
      }
      
      return suggestions;
    } catch (error) {
      console.error('Failed to generate match suggestions:', error);
      return [];
    }
  }

  /**
   * Create activity feed item
   */
  private static async createActivityFeedItem(
    userId: string,
    interest: Interest,
    action: 'created' | 'updated' | 'deleted'
  ): Promise<LiveActivityFeed | null> {
    try {
      let activityType: LiveActivityFeed['activityType'];
      let isPublic = false;

      switch (action) {
        case 'created':
          activityType = 'interest_sent';
          isPublic = false; // Private activity
          break;
        case 'updated':
          if (interest.status === 'accepted') {
            activityType = 'interest_accepted';
            isPublic = true; // Public success story
          } else if (interest.status === 'declined') {
            activityType = 'interest_declined';
            isPublic = false; // Private activity
          } else {
            return null;
          }
          break;
        default:
          return null;
      }

      return {
        userId,
        activityType,
        activityData: {
          interestId: interest.$id,
          otherUserId: userId === interest.senderId ? interest.receiverId : interest.senderId,
          interestType: interest.type,
          interestStatus: interest.status,
        },
        timestamp: new Date().toISOString(),
        isPublic,
      };
    } catch (error) {
      console.error('Failed to create activity feed item:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from all interest subscriptions for a user
   */
  static unsubscribeAll(userId: string): void {
    const subscriptionKeys = [
      `interest_updates_${userId}`,
      `interest_counts_${userId}`,
      `match_suggestions_${userId}`,
      `activity_feed_${userId}`,
    ];

    subscriptionKeys.forEach(key => {
      const unsubscribe = this.interestSubscriptions.get(key) ||
                         this.countSubscriptions.get(key) ||
                         this.suggestionSubscriptions.get(key) ||
                         this.activitySubscriptions.get(key);

      if (unsubscribe) {
        unsubscribe();
        this.interestSubscriptions.delete(key);
        this.countSubscriptions.delete(key);
        this.suggestionSubscriptions.delete(key);
        this.activitySubscriptions.delete(key);
      }
    });
  }

  /**
   * Get active subscription count
   */
  static getActiveSubscriptionCount(): number {
    return this.interestSubscriptions.size +
           this.countSubscriptions.size +
           this.suggestionSubscriptions.size +
           this.activitySubscriptions.size;
  }
}

// Export types and service class
export type {
  RealtimeInterestData,
  InterestCountUpdate,
  MatchSuggestion,
  LiveActivityFeed,
  RealtimeInterestCallback,
  InterestCountCallback,
  MatchSuggestionCallback,
  ActivityFeedCallback,
};