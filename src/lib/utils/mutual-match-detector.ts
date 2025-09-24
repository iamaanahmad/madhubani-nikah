import { InterestService } from '../services/interest.service';
import { ContactService } from '../services/contact.service';
import type { Interest } from '../types/interest.types';
import type { CreateMutualMatchData } from '../types/contact.types';

/**
 * Utility class for detecting and creating mutual matches
 */
export class MutualMatchDetector {
  /**
   * Check if two users have mutual interests and create a mutual match
   */
  static async checkAndCreateMutualMatch(
    user1Id: string,
    user2Id: string
  ): Promise<boolean> {
    try {
      // Get interests sent by user1 to user2
      const user1Interests = await InterestService.getSentInterests(user1Id);
      const interestToUser2 = user1Interests.interests.find(
        interest => interest.receiverId === user2Id && interest.status === 'accepted'
      );

      if (!interestToUser2) {
        return false; // No accepted interest from user1 to user2
      }

      // Get interests sent by user2 to user1
      const user2Interests = await InterestService.getSentInterests(user2Id);
      const interestToUser1 = user2Interests.interests.find(
        interest => interest.receiverId === user1Id && interest.status === 'accepted'
      );

      if (!interestToUser1) {
        return false; // No accepted interest from user2 to user1
      }

      // Both users have accepted each other's interests - create mutual match
      const mutualMatchData: CreateMutualMatchData = {
        user1Id,
        user2Id,
        interest1Id: interestToUser2.$id,
        interest2Id: interestToUser1.$id,
        aiMatchScore: this.calculateCompatibilityScore(interestToUser2, interestToUser1),
        commonInterests: this.findCommonInterests(interestToUser2, interestToUser1),
      };

      await ContactService.createMutualMatch(mutualMatchData);
      return true;
    } catch (error) {
      console.error('Failed to check and create mutual match:', error);
      return false;
    }
  }

  /**
   * Calculate compatibility score based on interests
   */
  private static calculateCompatibilityScore(interest1: Interest, interest2: Interest): number {
    let score = 70; // Base score for mutual interest

    // Boost score based on common interests
    const commonInterests = this.findCommonInterests(interest1, interest2);
    score += commonInterests.length * 5;

    // Boost score if both interests have messages (shows engagement)
    if (interest1.message && interest2.message) {
      score += 10;
    }

    // Boost score based on response time (faster response = higher compatibility)
    if (interest1.respondedAt && interest2.respondedAt) {
      const response1Time = new Date(interest1.respondedAt).getTime() - new Date(interest1.sentAt).getTime();
      const response2Time = new Date(interest2.respondedAt).getTime() - new Date(interest2.sentAt).getTime();
      
      // If both responded within 24 hours, boost score
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (response1Time < oneDayMs && response2Time < oneDayMs) {
        score += 10;
      }
    }

    // Cap the score at 100
    return Math.min(score, 100);
  }

  /**
   * Find common interests between two interest objects
   */
  private static findCommonInterests(interest1: Interest, interest2: Interest): string[] {
    const commonInterests: string[] = [];

    // Extract interests from metadata or messages
    const interests1 = this.extractInterestsFromInterest(interest1);
    const interests2 = this.extractInterestsFromInterest(interest2);

    // Find common interests
    interests1.forEach(interest => {
      if (interests2.includes(interest) && !commonInterests.includes(interest)) {
        commonInterests.push(interest);
      }
    });

    return commonInterests;
  }

  /**
   * Extract interests from an interest object
   */
  private static extractInterestsFromInterest(interest: Interest): string[] {
    const interests: string[] = [];

    // If commonInterests is already available, use it
    if (interest.commonInterests) {
      interests.push(...interest.commonInterests);
    }

    // Extract from message using simple keyword matching
    if (interest.message) {
      const keywords = [
        'reading', 'books', 'travel', 'cooking', 'music', 'sports', 'movies',
        'photography', 'art', 'technology', 'fitness', 'yoga', 'meditation',
        'gardening', 'dancing', 'singing', 'writing', 'painting', 'hiking',
        'swimming', 'cycling', 'cricket', 'football', 'badminton', 'chess'
      ];

      const lowerMessage = interest.message.toLowerCase();
      keywords.forEach(keyword => {
        if (lowerMessage.includes(keyword) && !interests.includes(keyword)) {
          interests.push(keyword);
        }
      });
    }

    return interests;
  }

  /**
   * Check for mutual matches for a specific user
   */
  static async checkUserForMutualMatches(userId: string): Promise<number> {
    try {
      let matchesCreated = 0;

      // Get all accepted interests received by this user
      const receivedInterests = await InterestService.getReceivedInterests(userId, {
        status: ['accepted'],
      });

      // For each accepted interest, check if this user also sent an accepted interest back
      for (const receivedInterest of receivedInterests.interests) {
        const mutualMatchExists = await this.checkMutualMatchExists(userId, receivedInterest.senderId);
        
        if (!mutualMatchExists) {
          const created = await this.checkAndCreateMutualMatch(userId, receivedInterest.senderId);
          if (created) {
            matchesCreated++;
          }
        }
      }

      return matchesCreated;
    } catch (error) {
      console.error('Failed to check user for mutual matches:', error);
      return 0;
    }
  }

  /**
   * Check if a mutual match already exists between two users
   */
  private static async checkMutualMatchExists(user1Id: string, user2Id: string): Promise<boolean> {
    try {
      const matches = await ContactService.getMutualMatches(user1Id);
      return matches.some(match => 
        (match.user1Id === user1Id && match.user2Id === user2Id) ||
        (match.user1Id === user2Id && match.user2Id === user1Id)
      );
    } catch (error) {
      console.error('Failed to check if mutual match exists:', error);
      return false;
    }
  }

  /**
   * Batch process mutual match detection for multiple users
   */
  static async batchProcessMutualMatches(userIds: string[]): Promise<{
    processed: number;
    matchesCreated: number;
    errors: number;
  }> {
    let processed = 0;
    let matchesCreated = 0;
    let errors = 0;

    for (const userId of userIds) {
      try {
        const created = await this.checkUserForMutualMatches(userId);
        matchesCreated += created;
        processed++;
      } catch (error) {
        console.error(`Failed to process mutual matches for user ${userId}:`, error);
        errors++;
      }
    }

    return { processed, matchesCreated, errors };
  }

  /**
   * Get mutual match statistics for analysis
   */
  static async getMutualMatchAnalytics(): Promise<{
    totalMutualMatches: number;
    averageMatchScore: number;
    topCommonInterests: { interest: string; count: number }[];
    matchQualityDistribution: Record<string, number>;
  }> {
    try {
      // Query mutual matches from the database
      const mutualMatches = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        [
          Query.equal('status', 'accepted'),
          Query.limit(1)
        ]
      );

      return {
        totalMutualMatches: mutualMatches.total,
        averageMatchScore: 0,
        topCommonInterests: [],
        matchQualityDistribution: {
          excellent: 0,
          good: 0,
          fair: 0,
          poor: 0,
        },
      };
    } catch (error) {
      console.error('Failed to get mutual match analytics:', error);
      throw error;
    }
  }
}