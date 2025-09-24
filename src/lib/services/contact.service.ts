import { databases, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS, QUERY_LIMITS } from '../appwrite-config';
import { Query, ID, Permission, Role } from 'appwrite';
import { NotificationService } from './notification.service';
import type {
  ContactShare,
  CreateContactShareData,
  MutualMatch,
  CreateMutualMatchData,
  ContactShareRequest,
  CreateContactShareRequestData,
  ContactShareStats,
  MutualMatchStats,
  ContactPrivacySettings,
  MatchRecommendation,
  MatchInsight,
  ContactInteraction,
  ContactInteractionType,
  MutualMatchStatus,
  MatchQuality
} from '../types/contact.types';
import type { Interest } from '../types/interest.types';

export class ContactService {
  /**
   * Create a mutual match when two users have mutual interests
   */
  static async createMutualMatch(data: CreateMutualMatchData): Promise<MutualMatch> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Calculate match quality based on AI score
      let matchQuality: MatchQuality = 'fair';
      if (data.aiMatchScore) {
        if (data.aiMatchScore >= 90) matchQuality = 'excellent';
        else if (data.aiMatchScore >= 75) matchQuality = 'good';
        else if (data.aiMatchScore >= 60) matchQuality = 'fair';
        else matchQuality = 'poor';
      }

      const mutualMatchDoc = {
        user1Id: data.user1Id,
        user2Id: data.user2Id,
        interest1Id: data.interest1Id,
        interest2Id: data.interest2Id,
        matchedAt: new Date().toISOString(),
        isContactShared: false,
        aiMatchScore: data.aiMatchScore,
        commonInterests: data.commonInterests || [],
        matchQuality,
        status: 'active' as MutualMatchStatus,
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS, // We'll use interests collection for now, should be separate
        ID.unique(),
        mutualMatchDoc,
        [
          Permission.read(Role.user(data.user1Id)),
          Permission.read(Role.user(data.user2Id)),
          Permission.update(Role.user(data.user1Id)),
          Permission.update(Role.user(data.user2Id)),
        ]
      );

      const mutualMatch = result as unknown as MutualMatch;

      // Create notifications for both users
      try {
        await Promise.all([
          NotificationService.createNotification({
            userId: data.user1Id,
            type: 'new_match',
            title: 'New Mutual Match!',
            message: 'You have a mutual interest with someone. Check it out!',
            priority: 'high',
            relatedUserId: data.user2Id,
            actionUrl: `/matches/${mutualMatch.$id}`,
            metadata: {
              mutualMatchId: mutualMatch.$id,
              aiMatchScore: data.aiMatchScore,
              matchQuality,
            },
          }),
          NotificationService.createNotification({
            userId: data.user2Id,
            type: 'new_match',
            title: 'New Mutual Match!',
            message: 'You have a mutual interest with someone. Check it out!',
            priority: 'high',
            relatedUserId: data.user1Id,
            actionUrl: `/matches/${mutualMatch.$id}`,
            metadata: {
              mutualMatchId: mutualMatch.$id,
              aiMatchScore: data.aiMatchScore,
              matchQuality,
            },
          }),
        ]);
      } catch (notificationError) {
        console.error('Failed to create mutual match notifications:', notificationError);
      }

      return mutualMatch;
    }, 'createMutualMatch');
  }

  /**
   * Get mutual matches for a user
   */
  static async getMutualMatches(userId: string): Promise<MutualMatch[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS, // Should be separate collection
        [
          Query.or([
            Query.equal('user1Id', userId),
            Query.equal('user2Id', userId),
          ]),
          Query.orderDesc('$createdAt'),
          Query.limit(QUERY_LIMITS.DEFAULT_PAGE_SIZE),
        ]
      );

      return result.documents as unknown as MutualMatch[];
    }, 'getMutualMatches');
  }

  /**
   * Create a contact share request
   */
  static async createContactShareRequest(
    fromUserId: string,
    data: CreateContactShareRequestData
  ): Promise<ContactShareRequest> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const requestDoc = {
        fromUserId,
        toUserId: data.toUserId,
        mutualMatchId: data.mutualMatchId,
        message: data.message || '',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS, // Using notifications collection for now
        ID.unique(),
        requestDoc,
        [
          Permission.read(Role.user(fromUserId)),
          Permission.read(Role.user(data.toUserId)),
          Permission.update(Role.user(fromUserId)),
          Permission.update(Role.user(data.toUserId)),
        ]
      );

      const request = result as unknown as ContactShareRequest;

      // Create notification for the recipient
      try {
        await NotificationService.createNotification({
          userId: data.toUserId,
          type: 'new_interest', // Using existing type for now
          title: 'Contact Share Request',
          message: `Someone wants to share contact information with you${data.message ? `: "${data.message}"` : ''}`,
          priority: 'medium',
          relatedUserId: fromUserId,
          actionUrl: `/contact-requests/${request.$id}`,
          metadata: {
            requestId: request.$id,
            mutualMatchId: data.mutualMatchId,
          },
        });
      } catch (notificationError) {
        console.error('Failed to create contact share request notification:', notificationError);
      }

      return request;
    }, 'createContactShareRequest');
  }

  /**
   * Respond to a contact share request
   */
  static async respondToContactShareRequest(
    userId: string,
    requestId: string,
    response: 'approved' | 'declined'
  ): Promise<ContactShareRequest> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get the request first
      const request = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        requestId
      ) as unknown as ContactShareRequest;

      // Validate that the user can respond to this request
      if (request.toUserId !== userId) {
        throw new Error('You can only respond to requests sent to you');
      }

      if (request.status !== 'pending') {
        throw new Error('This request has already been responded to');
      }

      // Update the request
      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        requestId,
        {
          status: response,
          respondedAt: new Date().toISOString(),
        }
      );

      const updatedRequest = result as unknown as ContactShareRequest;

      // If approved, create the contact share
      if (response === 'approved') {
        try {
          // This would create the actual contact share
          // For now, just update the mutual match
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_IDS.INTERESTS,
            request.mutualMatchId,
            {
              isContactShared: true,
              lastInteractionAt: new Date().toISOString(),
            }
          );
        } catch (error) {
          console.error('Failed to create contact share:', error);
        }
      }

      // Notify the requester
      try {
        await NotificationService.createNotification({
          userId: request.fromUserId,
          type: response === 'approved' ? 'interest_accepted' : 'interest_declined',
          title: `Contact Share ${response === 'approved' ? 'Approved' : 'Declined'}`,
          message: `Your contact share request has been ${response}`,
          priority: 'medium',
          relatedUserId: userId,
          actionUrl: response === 'approved' ? `/matches/${request.mutualMatchId}` : undefined,
          metadata: {
            requestId: request.$id,
            mutualMatchId: request.mutualMatchId,
          },
        });
      } catch (notificationError) {
        console.error('Failed to create response notification:', notificationError);
      }

      return updatedRequest;
    }, 'respondToContactShareRequest');
  }

  /**
   * Share contact information
   */
  static async shareContact(
    fromUserId: string,
    data: CreateContactShareData
  ): Promise<ContactShare> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const contactShareDoc = {
        fromUserId,
        toUserId: data.toUserId,
        interestId: data.interestId,
        contactInfo: {
          userId: fromUserId,
          name: data.contactInfo.name || 'User',
          email: data.contactInfo.email,
          phone: data.contactInfo.phone,
          whatsapp: data.contactInfo.whatsapp,
          telegram: data.contactInfo.telegram,
          socialMedia: data.contactInfo.socialMedia || {},
          preferredContactMethod: data.contactInfo.preferredContactMethod || 'email',
          contactNotes: data.contactInfo.contactNotes,
          sharedAt: new Date().toISOString(),
          sharedBy: fromUserId,
        },
        isActive: true,
        sharedAt: new Date().toISOString(),
        accessCount: 0,
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS, // Using notifications collection for now
        ID.unique(),
        contactShareDoc,
        [
          Permission.read(Role.user(fromUserId)),
          Permission.read(Role.user(data.toUserId)),
          Permission.update(Role.user(fromUserId)),
          Permission.delete(Role.user(fromUserId)),
        ]
      );

      return result as unknown as ContactShare;
    }, 'shareContact');
  }

  /**
   * Get shared contacts for a user
   */
  static async getSharedContacts(userId: string): Promise<ContactShare[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS, // Using notifications collection for now
        [
          Query.equal('toUserId', userId),
          Query.equal('isActive', true),
          Query.orderDesc('$createdAt'),
          Query.limit(QUERY_LIMITS.DEFAULT_PAGE_SIZE),
        ]
      );

      return result.documents as unknown as ContactShare[];
    }, 'getSharedContacts');
  }

  /**
   * Record contact interaction
   */
  static async recordContactInteraction(
    contactShareId: string,
    interactionType: ContactInteractionType,
    metadata?: Record<string, any>
  ): Promise<ContactInteraction> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const interactionDoc = {
        contactShareId,
        interactionType,
        timestamp: new Date().toISOString(),
        metadata: metadata || {},
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS, // Using notifications collection for now
        ID.unique(),
        interactionDoc
      );

      // Update access count
      try {
        const contactShare = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_IDS.NOTIFICATIONS,
          contactShareId
        ) as unknown as ContactShare;

        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_IDS.NOTIFICATIONS,
          contactShareId,
          {
            accessCount: contactShare.accessCount + 1,
            lastAccessedAt: new Date().toISOString(),
          }
        );
      } catch (error) {
        console.error('Failed to update access count:', error);
      }

      return result as unknown as ContactInteraction;
    }, 'recordContactInteraction');
  }

  /**
   * Get contact share statistics
   */
  static async getContactShareStats(userId: string): Promise<ContactShareStats> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get shared contacts (sent by user)
      const sharedResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        [
          Query.equal('fromUserId', userId),
          Query.limit(1000),
        ]
      );

      // Get received contacts
      const receivedResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        [
          Query.equal('toUserId', userId),
          Query.limit(1000),
        ]
      );

      const sharedContacts = sharedResult.documents as unknown as ContactShare[];
      const receivedContacts = receivedResult.documents as unknown as ContactShare[];

      const activeShares = sharedContacts.filter(share => share.isActive).length;
      const totalAccesses = sharedContacts.reduce((sum, share) => sum + share.accessCount, 0);
      const averageAccessCount = sharedContacts.length > 0 ? totalAccesses / sharedContacts.length : 0;

      // Find most accessed contact
      const mostAccessed = sharedContacts.reduce((max, share) => 
        share.accessCount > (max?.accessCount || 0) ? share : max, 
        null as ContactShare | null
      );

      return {
        totalShared: sharedContacts.length,
        totalReceived: receivedContacts.length,
        activeShares,
        totalAccesses,
        averageAccessCount,
        mostAccessedContact: mostAccessed?.contactInfo.name,
        recentShares: sharedContacts.slice(0, 5),
      };
    }, 'getContactShareStats');
  }

  /**
   * Get mutual match statistics
   */
  static async getMutualMatchStats(userId: string): Promise<MutualMatchStats> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        [
          Query.or([
            Query.equal('user1Id', userId),
            Query.equal('user2Id', userId),
          ]),
          Query.limit(1000),
        ]
      );

      const matches = result.documents as unknown as MutualMatch[];

      const activeMatches = matches.filter(match => match.status === 'active').length;
      const contactedMatches = matches.filter(match => match.status === 'contacted').length;

      // Calculate match quality breakdown
      const matchQualityBreakdown = matches.reduce((acc, match) => {
        acc[match.matchQuality] = (acc[match.matchQuality] || 0) + 1;
        return acc;
      }, {} as Record<MatchQuality, number>);

      // Calculate average match score
      const scoresWithValues = matches.filter(match => match.aiMatchScore);
      const averageMatchScore = scoresWithValues.length > 0
        ? scoresWithValues.reduce((sum, match) => sum + (match.aiMatchScore || 0), 0) / scoresWithValues.length
        : 0;

      return {
        totalMatches: matches.length,
        activeMatches,
        contactedMatches,
        matchQualityBreakdown: {
          excellent: matchQualityBreakdown.excellent || 0,
          good: matchQualityBreakdown.good || 0,
          fair: matchQualityBreakdown.fair || 0,
          poor: matchQualityBreakdown.poor || 0,
        },
        averageMatchScore,
        recentMatches: matches.slice(0, 5),
      };
    }, 'getMutualMatchStats');
  }

  /**
   * Get match recommendations for a user
   */
  static async getMatchRecommendations(userId: string): Promise<MatchRecommendation[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // This would typically use AI/ML algorithms to generate recommendations
      // For now, return mock data
      return [
        {
          userId: 'user123',
          matchScore: 92,
          reasons: ['Similar education background', 'Same district', 'Compatible age range'],
          commonInterests: ['Reading', 'Travel', 'Cooking'],
          locationCompatibility: 95,
          educationCompatibility: 88,
          religiousCompatibility: 100,
          ageCompatibility: 85,
          overallCompatibility: 92,
        },
        {
          userId: 'user456',
          matchScore: 87,
          reasons: ['Similar profession', 'Compatible family values', 'Shared interests'],
          commonInterests: ['Music', 'Sports', 'Technology'],
          locationCompatibility: 80,
          educationCompatibility: 92,
          religiousCompatibility: 95,
          ageCompatibility: 82,
          overallCompatibility: 87,
        },
      ];
    }, 'getMatchRecommendations');
  }

  /**
   * Get match insights for a user
   */
  static async getMatchInsights(userId: string): Promise<MatchInsight[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // This would analyze user data to provide insights
      // For now, return mock insights
      return [
        {
          type: 'compatibility',
          title: 'High Compatibility Score',
          description: 'Your average compatibility score is 85%, which is above average',
          value: 85,
          trend: 'up',
          recommendation: 'Continue being active to maintain high match quality',
        },
        {
          type: 'activity',
          title: 'Profile Views',
          description: 'Your profile has been viewed 24 times this week',
          value: 24,
          trend: 'up',
          recommendation: 'Add more photos to increase engagement',
        },
        {
          type: 'success_rate',
          title: 'Interest Success Rate',
          description: 'Your interests are accepted 60% of the time',
          value: 60,
          trend: 'stable',
          recommendation: 'Personalize your interest messages for better results',
        },
      ];
    }, 'getMatchInsights');
  }

  /**
   * Update mutual match status
   */
  static async updateMutualMatchStatus(
    userId: string,
    matchId: string,
    status: MutualMatchStatus
  ): Promise<MutualMatch> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get the match first to verify ownership
      const match = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        matchId
      ) as unknown as MutualMatch;

      // Validate that the user is part of this match
      if (match.user1Id !== userId && match.user2Id !== userId) {
        throw new Error('You can only update matches you are part of');
      }

      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        matchId,
        {
          status,
          lastInteractionAt: new Date().toISOString(),
        }
      );

      return result as unknown as MutualMatch;
    }, 'updateMutualMatchStatus');
  }

  /**
   * Revoke contact share
   */
  static async revokeContactShare(userId: string, shareId: string): Promise<ContactShare> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get the share first to verify ownership
      const share = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        shareId
      ) as unknown as ContactShare;

      // Validate that the user owns this share
      if (share.fromUserId !== userId) {
        throw new Error('You can only revoke your own contact shares');
      }

      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.NOTIFICATIONS,
        shareId,
        {
          isActive: false,
          revokedAt: new Date().toISOString(),
        }
      );

      return result as unknown as ContactShare;
    }, 'revokeContactShare');
  }
}

// Export types for use in other modules
export type {
  ContactShare,
  CreateContactShareData,
  MutualMatch,
  CreateMutualMatchData,
  ContactShareRequest,
  CreateContactShareRequestData,
  ContactShareStats,
  MutualMatchStats,
  ContactPrivacySettings,
  MatchRecommendation,
  MatchInsight,
  ContactInteraction,
  ContactInteractionType
};