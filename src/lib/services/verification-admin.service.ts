import { Client, Databases, Query, ID } from 'appwrite'
import { 
  VerificationReviewRequest,
  VerificationReviewAction,
  VerificationStats,
  VerificationFilters,
  VerificationReviewHistory,
  BulkVerificationAction
} from '@/lib/types/verification-admin.types'
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/appwrite-config'
import { databases } from '@/lib/appwrite'
import { NotificationService } from './notification.service'

class VerificationAdminService {
  private client: Client
  private databases: Databases

  constructor() {
    this.client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
    
    this.databases = new Databases(this.client)
  }

  /**
   * Get all verification requests with filters
   */
  async getVerificationRequests(
    filters: VerificationFilters = {},
    limit: number = 25,
    offset: number = 0
  ): Promise<{ requests: VerificationReviewRequest[], total: number }> {
    try {
      const queries = [
        Query.orderDesc('submittedAt'),
        Query.limit(limit),
        Query.offset(offset)
      ]

      // Apply filters
      if (filters.status) {
        queries.push(Query.equal('status', filters.status))
      }
      if (filters.documentType) {
        queries.push(Query.equal('documentType', filters.documentType))
      }
      if (filters.priority) {
        queries.push(Query.equal('priority', filters.priority))
      }
      if (filters.isUrgent !== undefined) {
        queries.push(Query.equal('isUrgent', filters.isUrgent))
      }
      if (filters.reviewerId) {
        queries.push(Query.equal('reviewedBy', filters.reviewerId))
      }
      if (filters.dateRange) {
        queries.push(Query.greaterThanEqual('submittedAt', filters.dateRange.from))
        queries.push(Query.lessThanEqual('submittedAt', filters.dateRange.to))
      }

      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.verificationRequests,
        queries
      )

      return {
        requests: response.documents as VerificationReviewRequest[],
        total: response.total
      }
    } catch (error) {
      console.error('Error fetching verification requests:', error)
      throw error
    }
  }

  /**
   * Get verification request by ID
   */
  async getVerificationRequest(requestId: string): Promise<VerificationReviewRequest | null> {
    try {
      const response = await this.databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.verificationRequests,
        requestId
      )

      return response as VerificationReviewRequest
    } catch (error) {
      console.error('Error fetching verification request:', error)
      return null
    }
  }

  /**
   * Review verification request (approve/reject)
   */
  async reviewVerificationRequest(action: VerificationReviewAction): Promise<VerificationReviewRequest> {
    try {
      const updateData: any = {
        status: action.action === 'approve' ? 'approved' : 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: action.reviewerId,
        notes: action.notes || ''
      }

      if (action.action === 'reject' && action.rejectionReason) {
        updateData.rejectionReason = action.rejectionReason
      }

      // Update the verification request
      const updatedRequest = await this.databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.verificationRequests,
        action.requestId,
        updateData
      )

      // Get the request details for notifications
      const request = updatedRequest as VerificationReviewRequest

      // Update user's verification status if approved
      if (action.action === 'approve') {
        await this.updateUserVerificationStatus(request.userId, true)
      }

      // Create review history entry
      await this.createReviewHistory({
        requestId: action.requestId,
        action: action.action === 'approve' ? 'approved' : 'rejected',
        performedBy: action.reviewerId,
        performerName: '', // Will be populated by the calling component
        timestamp: new Date().toISOString(),
        notes: action.notes,
        rejectionReason: action.rejectionReason,
        previousStatus: 'pending',
        newStatus: updateData.status
      })

      // Send notification to user
      await this.sendVerificationNotification(request, action.action)

      return request
    } catch (error) {
      console.error('Error reviewing verification request:', error)
      throw error
    }
  }

  /**
   * Bulk review verification requests
   */
  async bulkReviewRequests(bulkAction: BulkVerificationAction): Promise<void> {
    try {
      const promises = bulkAction.requestIds.map(requestId => {
        if (bulkAction.action === 'approve' || bulkAction.action === 'reject') {
          return this.reviewVerificationRequest({
            requestId,
            action: bulkAction.action,
            notes: bulkAction.notes,
            rejectionReason: bulkAction.rejectionReason,
            reviewerId: bulkAction.reviewerId
          })
        } else if (bulkAction.action === 'mark_urgent') {
          return this.databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.collections.verificationRequests,
            requestId,
            { isUrgent: true, priority: 'high' }
          )
        }
        return Promise.resolve()
      })

      await Promise.all(promises)
    } catch (error) {
      console.error('Error performing bulk action:', error)
      throw error
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<VerificationStats> {
    try {
      const [total, pending, approved, rejected, todaySubmissions, urgent] = await Promise.all([
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.verificationRequests,
          [Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.verificationRequests,
          [Query.equal('status', 'pending'), Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.verificationRequests,
          [Query.equal('status', 'approved'), Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.verificationRequests,
          [Query.equal('status', 'rejected'), Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.verificationRequests,
          [
            Query.greaterThanEqual('submittedAt', new Date().toISOString().split('T')[0]),
            Query.limit(1)
          ]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.verificationRequests,
          [Query.equal('isUrgent', true), Query.limit(1)]
        )
      ])

      // Calculate average review time (simplified)
      const avgReviewTime = await this.calculateAverageReviewTime()

      return {
        totalRequests: total.total,
        pendingRequests: pending.total,
        approvedRequests: approved.total,
        rejectedRequests: rejected.total,
        avgReviewTime,
        todaySubmissions: todaySubmissions.total,
        urgentRequests: urgent.total
      }
    } catch (error) {
      console.error('Error fetching verification stats:', error)
      throw error
    }
  }

  /**
   * Get verification review history
   */
  async getReviewHistory(requestId: string): Promise<VerificationReviewHistory[]> {
    try {
      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        'verification_history',
        [
          Query.equal('requestId', requestId),
          Query.orderDesc('timestamp')
        ]
      )

      return response.documents as VerificationReviewHistory[]
    } catch (error) {
      console.error('Error fetching review history:', error)
      return []
    }
  }

  /**
   * Update verification request priority
   */
  async updateRequestPriority(requestId: string, priority: 'low' | 'medium' | 'high', isUrgent: boolean = false): Promise<void> {
    try {
      await this.databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.verificationRequests,
        requestId,
        { priority, isUrgent }
      )
    } catch (error) {
      console.error('Error updating request priority:', error)
      throw error
    }
  }

  /**
   * Get pending requests count for dashboard
   */
  async getPendingRequestsCount(): Promise<number> {
    try {
      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.verificationRequests,
        [Query.equal('status', 'pending'), Query.limit(1)]
      )

      return response.total
    } catch (error) {
      console.error('Error fetching pending requests count:', error)
      return 0
    }
  }

  /**
   * Search verification requests
   */
  async searchVerificationRequests(searchTerm: string): Promise<VerificationReviewRequest[]> {
    try {
      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.verificationRequests,
        [
          Query.search('userName', searchTerm),
          Query.orderDesc('submittedAt')
        ]
      )

      return response.documents as VerificationReviewRequest[]
    } catch (error) {
      console.error('Error searching verification requests:', error)
      return []
    }
  }

  /**
   * Private helper methods
   */
  private async updateUserVerificationStatus(userId: string, isVerified: boolean): Promise<void> {
    try {
      await this.databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.profiles,
        userId,
        { isVerified }
      )
    } catch (error) {
      console.error('Error updating user verification status:', error)
    }
  }

  private async createReviewHistory(historyData: Omit<VerificationReviewHistory, '$id'>): Promise<void> {
    try {
      await this.databases.createDocument(
        appwriteConfig.databaseId,
        'verification_history',
        ID.unique(),
        historyData
      )
    } catch (error) {
      console.error('Error creating review history:', error)
    }
  }

  private async sendVerificationNotification(request: VerificationReviewRequest, action: 'approve' | 'reject'): Promise<void> {
    try {
      const notificationData = {
        userId: request.userId,
        type: 'verification_update' as const,
        title: action === 'approve' ? 'Verification Approved' : 'Verification Rejected',
        message: action === 'approve' 
          ? 'Your verification documents have been approved. Your profile is now verified!'
          : `Your verification documents were rejected. ${request.rejectionReason || 'Please resubmit with correct documents.'}`,
        priority: 'high' as const,
        actionUrl: '/profile/verification'
      }

      await NotificationService.createNotification(notificationData)
    } catch (error) {
      console.error('Error sending verification notification:', error)
    }
  }

  private async calculateAverageReviewTime(): Promise<number> {
    try {
      // This is a simplified calculation
      // In a real implementation, you might want to use aggregation functions
      const reviewedRequests = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.verificationRequests,
        [
          Query.notEqual('reviewedAt', null),
          Query.limit(100)
        ]
      )

      if (reviewedRequests.documents.length === 0) return 0

      const totalTime = reviewedRequests.documents.reduce((sum, request: any) => {
        const submitted = new Date(request.submittedAt).getTime()
        const reviewed = new Date(request.reviewedAt).getTime()
        return sum + (reviewed - submitted)
      }, 0)

      const avgTimeMs = totalTime / reviewedRequests.documents.length
      return Math.round(avgTimeMs / (1000 * 60 * 60)) // Convert to hours
    } catch (error) {
      console.error('Error calculating average review time:', error)
      return 0
    }
  }
}

export const verificationAdminService = new VerificationAdminService()