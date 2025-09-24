import { databases, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS, RATE_LIMITS, QUERY_LIMITS, INTEREST_STATUS } from '../appwrite-config';
import { Query, ID, Permission, Role } from 'appwrite';
import { NotificationService } from './notification.service';
import { MutualMatchDetector } from '../utils/mutual-match-detector';
import type {
  Interest,
  CreateInterestData,
  InterestResponse,
  InterestStats,
  InterestHistory,
  InterestFilters,
  MutualInterest,
  InterestValidationResult,
  InterestProfileInfo,
  InterestStatus,
  InterestType
} from '../types/interest.types';

export class InterestService {
  /**
   * Send an interest to another user
   */
  static async sendInterest(
    senderId: string,
    interestData: CreateInterestData
  ): Promise<Interest> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Validate the interest request
      const validation = await this.validateInterestRequest(senderId, interestData.receiverId);
      if (!validation.isValid) {
        throw new Error(`Cannot send interest: ${validation.errors.join(', ')}`);
      }

      // Create interest document
      const interestDoc = {
        senderId,
        receiverId: interestData.receiverId,
        status: INTEREST_STATUS.PENDING,
        message: interestData.message || '',
        sentAt: new Date().toISOString(),
        type: interestData.type || 'proposal',
        isRead: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        ID.unique(),
        interestDoc,
        [
          Permission.read(Role.user(senderId)),
          Permission.read(Role.user(interestData.receiverId)),
          Permission.update(Role.user(senderId)),
          Permission.update(Role.user(interestData.receiverId)),
          Permission.delete(Role.user(senderId)),
        ]
      );

      const interest = result as unknown as Interest;

      // Create notification for the receiver
      try {
        await NotificationService.createInterestNotification('new_interest', {
          interestId: interest.$id,
          senderId,
          receiverId: interestData.receiverId,
          senderName: 'User', // This would be fetched from profile in real implementation
          interestType: interestData.type || 'proposal',
          message: interestData.message,
        });
      } catch (notificationError) {
        console.error('Failed to create interest notification:', notificationError);
        // Don't fail the interest creation if notification fails
      }

      return interest;
    }, 'sendInterest');
  }

  /**
   * Respond to an interest (accept/decline)
   */
  static async respondToInterest(
    userId: string,
    response: InterestResponse
  ): Promise<Interest> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get the interest document first
      const interest = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        response.interestId
      ) as unknown as Interest;

      // Validate that the user can respond to this interest
      if (interest.receiverId !== userId) {
        throw new Error('You can only respond to interests sent to you');
      }

      if (interest.status !== INTEREST_STATUS.PENDING) {
        throw new Error('This interest has already been responded to');
      }

      // Update the interest with response
      const updateData = {
        status: response.response === 'accepted' ? INTEREST_STATUS.ACCEPTED : INTEREST_STATUS.DECLINED,
        respondedAt: new Date().toISOString(),
        isRead: true,
      };

      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        response.interestId,
        updateData
      );

      const updatedInterest = result as unknown as Interest;

      // Create notification for the sender
      try {
        const notificationType = response.response === 'accepted' ? 'interest_accepted' : 'interest_declined';
        await NotificationService.createInterestNotification(notificationType, {
          interestId: updatedInterest.$id,
          senderId: interest.senderId,
          receiverId: interest.receiverId,
          senderName: 'User', // This would be fetched from profile in real implementation
          interestType: interest.type,
        });
      } catch (notificationError) {
        console.error('Failed to create response notification:', notificationError);
        // Don't fail the response if notification fails
      }

      // Check for mutual match if interest was accepted
      if (response.response === 'accepted') {
        try {
          await MutualMatchDetector.checkAndCreateMutualMatch(interest.senderId, interest.receiverId);
        } catch (mutualMatchError) {
          console.error('Failed to check for mutual match:', mutualMatchError);
          // Don't fail the response if mutual match check fails
        }
      }

      return updatedInterest;
    }, 'respondToInterest');
  }

  /**
   * Withdraw a sent interest
   */
  static async withdrawInterest(userId: string, interestId: string): Promise<Interest> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get the interest document first
      const interest = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        interestId
      ) as unknown as Interest;

      // Validate that the user can withdraw this interest
      if (interest.senderId !== userId) {
        throw new Error('You can only withdraw interests you have sent');
      }

      if (interest.status !== INTEREST_STATUS.PENDING) {
        throw new Error('You can only withdraw pending interests');
      }

      // Update the interest status to withdrawn
      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        interestId,
        {
          status: INTEREST_STATUS.WITHDRAWN,
          withdrawnAt: new Date().toISOString(),
        }
      );

      return result as unknown as Interest;
    }, 'withdrawInterest');
  }

  /**
   * Get interests sent by a user
   */
  static async getSentInterests(
    userId: string,
    filters?: InterestFilters
  ): Promise<InterestHistory> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const queries = [
        Query.equal('senderId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(filters?.limit || QUERY_LIMITS.INTEREST_HISTORY_LIMIT),
      ];

      // Add status filter if provided
      if (filters?.status && filters.status.length > 0) {
        queries.push(Query.equal('status', filters.status));
      }

      // Add type filter if provided
      if (filters?.type && filters.type.length > 0) {
        queries.push(Query.equal('type', filters.type));
      }

      // Add date range filter if provided
      if (filters?.dateRange) {
        queries.push(Query.greaterThanEqual('sentAt', filters.dateRange.from));
        queries.push(Query.lessThanEqual('sentAt', filters.dateRange.to));
      }

      // Add offset if provided
      if (filters?.offset) {
        queries.push(Query.offset(filters.offset));
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        queries
      );

      return {
        interests: result.documents as unknown as Interest[],
        totalCount: result.total,
        hasMore: result.documents.length === (filters?.limit || QUERY_LIMITS.INTEREST_HISTORY_LIMIT),
      };
    }, 'getSentInterests');
  }

  /**
   * Get interests received by a user
   */
  static async getReceivedInterests(
    userId: string,
    filters?: InterestFilters
  ): Promise<InterestHistory> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const queries = [
        Query.equal('receiverId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(filters?.limit || QUERY_LIMITS.INTEREST_HISTORY_LIMIT),
      ];

      // Add status filter if provided
      if (filters?.status && filters.status.length > 0) {
        queries.push(Query.equal('status', filters.status));
      }

      // Add type filter if provided
      if (filters?.type && filters.type.length > 0) {
        queries.push(Query.equal('type', filters.type));
      }

      // Add date range filter if provided
      if (filters?.dateRange) {
        queries.push(Query.greaterThanEqual('sentAt', filters.dateRange.from));
        queries.push(Query.lessThanEqual('sentAt', filters.dateRange.to));
      }

      // Add offset if provided
      if (filters?.offset) {
        queries.push(Query.offset(filters.offset));
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        queries
      );

      return {
        interests: result.documents as unknown as Interest[],
        totalCount: result.total,
        hasMore: result.documents.length === (filters?.limit || QUERY_LIMITS.INTEREST_HISTORY_LIMIT),
      };
    }, 'getReceivedInterests');
  }

  /**
   * Get mutual interests for a user
   */
  static async getMutualInterests(userId: string): Promise<MutualInterest[]> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get accepted interests sent by the user
      const sentAccepted = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        [
          Query.equal('senderId', userId),
          Query.equal('status', INTEREST_STATUS.ACCEPTED),
        ]
      );

      // Get accepted interests received by the user
      const receivedAccepted = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        [
          Query.equal('receiverId', userId),
          Query.equal('status', INTEREST_STATUS.ACCEPTED),
        ]
      );

      // Find mutual interests
      const mutualInterests: MutualInterest[] = [];
      
      for (const sentInterest of sentAccepted.documents as unknown as Interest[]) {
        const mutualInterest = (receivedAccepted.documents as unknown as Interest[]).find(
          received => received.senderId === sentInterest.receiverId
        );

        if (mutualInterest) {
          mutualInterests.push({
            interestId: sentInterest.$id,
            otherUserId: sentInterest.receiverId,
            matchedAt: sentInterest.respondedAt || sentInterest.$updatedAt,
            contactShared: false, // This will be implemented in task 4.3
            aiMatchScore: sentInterest.aiMatchScore,
          });
        }
      }

      return mutualInterests;
    }, 'getMutualInterests');
  }

  /**
   * Get interest statistics for a user
   */
  static async getInterestStats(userId: string): Promise<InterestStats> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get all sent interests
      const sentInterests = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        [
          Query.equal('senderId', userId),
          Query.limit(1000), // Get all for accurate stats
        ]
      );

      // Get all received interests
      const receivedInterests = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        [
          Query.equal('receiverId', userId),
          Query.limit(1000), // Get all for accurate stats
        ]
      );

      const sent = sentInterests.documents as unknown as Interest[];
      const received = receivedInterests.documents as unknown as Interest[];

      // Calculate statistics
      const stats: InterestStats = {
        totalSent: sent.length,
        totalReceived: received.length,
        acceptedSent: sent.filter(i => i.status === INTEREST_STATUS.ACCEPTED).length,
        acceptedReceived: received.filter(i => i.status === INTEREST_STATUS.ACCEPTED).length,
        pendingSent: sent.filter(i => i.status === INTEREST_STATUS.PENDING).length,
        pendingReceived: received.filter(i => i.status === INTEREST_STATUS.PENDING).length,
        declinedSent: sent.filter(i => i.status === INTEREST_STATUS.DECLINED).length,
        declinedReceived: received.filter(i => i.status === INTEREST_STATUS.DECLINED).length,
        withdrawnSent: sent.filter(i => i.status === INTEREST_STATUS.WITHDRAWN).length,
        mutualInterests: 0, // Will be calculated below
        successRate: 0,
        responseRate: 0,
        averageResponseTime: 0,
      };

      // Calculate success rate (accepted / total sent)
      stats.successRate = stats.totalSent > 0 ? (stats.acceptedSent / stats.totalSent) * 100 : 0;

      // Calculate response rate (responded / total received)
      const respondedReceived = received.filter(i => 
        i.status === INTEREST_STATUS.ACCEPTED || i.status === INTEREST_STATUS.DECLINED
      ).length;
      stats.responseRate = stats.totalReceived > 0 ? (respondedReceived / stats.totalReceived) * 100 : 0;

      // Calculate average response time
      const respondedInterests = received.filter(i => i.respondedAt);
      if (respondedInterests.length > 0) {
        const totalResponseTime = respondedInterests.reduce((sum, interest) => {
          const sentTime = new Date(interest.sentAt).getTime();
          const respondedTime = new Date(interest.respondedAt!).getTime();
          return sum + (respondedTime - sentTime);
        }, 0);
        stats.averageResponseTime = totalResponseTime / respondedInterests.length / (1000 * 60 * 60); // Convert to hours
      }

      // Get mutual interests count
      const mutualInterests = await this.getMutualInterests(userId);
      stats.mutualInterests = mutualInterests.length;

      return stats;
    }, 'getInterestStats');
  }

  /**
   * Validate if a user can send an interest
   */
  static async validateInterestRequest(
    senderId: string,
    receiverId: string
  ): Promise<InterestValidationResult> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const result: InterestValidationResult = {
        isValid: true,
        errors: [],
        canSend: true,
        dailyLimitReached: false,
        alreadyExists: false,
      };

      // Check if sender and receiver are the same
      if (senderId === receiverId) {
        result.errors.push('You cannot send an interest to yourself');
        result.isValid = false;
        result.canSend = false;
      }

      // Check if interest already exists
      const existingInterest = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        [
          Query.equal('senderId', senderId),
          Query.equal('receiverId', receiverId),
          Query.equal('status', [INTEREST_STATUS.PENDING, INTEREST_STATUS.ACCEPTED]),
        ]
      );

      if (existingInterest.documents.length > 0) {
        result.errors.push('You have already sent an interest to this user');
        result.isValid = false;
        result.alreadyExists = true;
      }

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayInterests = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        [
          Query.equal('senderId', senderId),
          Query.greaterThanEqual('sentAt', today.toISOString()),
        ]
      );

      if (todayInterests.documents.length >= RATE_LIMITS.INTEREST_SEND_DAILY_LIMIT) {
        result.errors.push(`Daily interest limit of ${RATE_LIMITS.INTEREST_SEND_DAILY_LIMIT} reached`);
        result.isValid = false;
        result.dailyLimitReached = true;
      }

      return result;
    }, 'validateInterestRequest');
  }

  /**
   * Mark interest as read
   */
  static async markInterestAsRead(userId: string, interestId: string): Promise<Interest> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get the interest document first
      const interest = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        interestId
      ) as unknown as Interest;

      // Validate that the user can mark this interest as read
      if (interest.receiverId !== userId) {
        throw new Error('You can only mark interests sent to you as read');
      }

      // Update the interest
      const result = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        interestId,
        { isRead: true }
      );

      return result as unknown as Interest;
    }, 'markInterestAsRead');
  }

  /**
   * Get interest by ID
   */
  static async getInterest(userId: string, interestId: string): Promise<Interest> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const interest = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        interestId
      ) as unknown as Interest;

      // Validate that the user can access this interest
      if (interest.senderId !== userId && interest.receiverId !== userId) {
        throw new Error('You do not have permission to view this interest');
      }

      return interest;
    }, 'getInterest');
  }

  /**
   * Get unread interests count
   */
  static async getUnreadInterestsCount(userId: string): Promise<number> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        [
          Query.equal('receiverId', userId),
          Query.equal('isRead', false),
          Query.limit(1), // We only need the count
        ]
      );

      return result.total;
    }, 'getUnreadInterestsCount');
  }

  /**
   * Clean up expired interests (utility function)
   */
  static async cleanupExpiredInterests(): Promise<number> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const now = new Date().toISOString();
      const expiredInterests = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.INTERESTS,
        [
          Query.equal('status', INTEREST_STATUS.PENDING),
          Query.lessThan('expiresAt', now),
          Query.limit(100), // Process in batches
        ]
      );

      let cleanedCount = 0;
      for (const interest of expiredInterests.documents) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_IDS.INTERESTS,
          interest.$id,
          { status: INTEREST_STATUS.EXPIRED }
        );
        cleanedCount++;
      }

      return cleanedCount;
    }, 'cleanupExpiredInterests');
  }
}

// Export types for use in other modules
export type {
  Interest,
  CreateInterestData,
  InterestResponse,
  InterestStats,
  InterestHistory,
  InterestFilters,
  MutualInterest,
  InterestValidationResult,
  InterestProfileInfo,
  InterestStatus,
  InterestType
};