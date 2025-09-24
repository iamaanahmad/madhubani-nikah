import { Client, Databases, Storage, Query, ID } from 'appwrite'
import { 
  UserReport,
  CreateReportRequest,
  ModerationActionRequest,
  UserSuspension,
  ModerationStats,
  ReportFilters,
  ModerationHistory,
  BulkModerationAction,
  ReportStatus,
  ModerationAction
} from '@/lib/types/moderation.types'
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/appwrite-config'
import { databases } from '@/lib/appwrite'
import { NotificationService } from './notification.service'

class ModerationService {
  private client: Client
  private databases: Databases
  private storage: Storage

  constructor() {
    this.client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId)
    
    this.databases = new Databases(this.client)
    this.storage = new Storage(this.client)
  }

  /**
   * Submit a user report
   */
  async submitReport(reportData: CreateReportRequest, reporterId: string): Promise<UserReport> {
    try {
      // Get reporter and reported user details
      const [reporter, reportedUser] = await Promise.all([
        this.getUserProfile(reporterId),
        this.getUserProfile(reportData.reportedUserId)
      ])

      // Upload evidence files if provided
      let evidenceUrls: string[] = []
      if (reportData.evidence && reportData.evidence.length > 0) {
        evidenceUrls = await this.uploadEvidenceFiles(reportData.evidence, reporterId)
      }

      // Determine priority based on category
      const priority = this.determinePriority(reportData.category)

      const reportDoc = await this.databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.userReports,
        ID.unique(),
        {
          reporterId,
          reporterName: reporter?.name || 'Unknown',
          reportedUserId: reportData.reportedUserId,
          reportedUserName: reportedUser?.name || 'Unknown',
          reportedUserEmail: reportedUser?.email || 'Unknown',
          category: reportData.category,
          reason: reportData.reason,
          description: reportData.description,
          evidence: evidenceUrls,
          status: 'pending',
          priority,
          isAnonymous: reportData.isAnonymous || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      )

      // Create moderation history entry
      await this.createModerationHistory({
        reportId: reportDoc.$id,
        action: 'report_submitted',
        performedBy: reporterId,
        performerName: reporter?.name || 'Unknown',
        timestamp: new Date().toISOString(),
        details: `Report submitted for ${reportData.category}`
      })

      // Notify moderators if high priority
      if (priority === 'high' || priority === 'critical') {
        await this.notifyModerators(reportDoc as UserReport)
      }

      return reportDoc as UserReport
    } catch (error) {
      console.error('Error submitting report:', error)
      throw error
    }
  }

  /**
   * Get all reports with filters
   */
  async getReports(
    filters: ReportFilters = {},
    limit: number = 25,
    offset: number = 0
  ): Promise<{ reports: UserReport[], total: number }> {
    try {
      const queries = [
        Query.orderDesc('createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ]

      // Apply filters
      if (filters.status) {
        queries.push(Query.equal('status', filters.status))
      }
      if (filters.category) {
        queries.push(Query.equal('category', filters.category))
      }
      if (filters.priority) {
        queries.push(Query.equal('priority', filters.priority))
      }
      if (filters.reviewerId) {
        queries.push(Query.equal('reviewedBy', filters.reviewerId))
      }
      if (filters.dateRange) {
        queries.push(Query.greaterThanEqual('createdAt', filters.dateRange.from))
        queries.push(Query.lessThanEqual('createdAt', filters.dateRange.to))
      }

      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.userReports,
        queries
      )

      return {
        reports: response.documents as UserReport[],
        total: response.total
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      throw error
    }
  }

  /**
   * Get report by ID
   */
  async getReport(reportId: string): Promise<UserReport | null> {
    try {
      const response = await this.databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.userReports,
        reportId
      )

      return response as UserReport
    } catch (error) {
      console.error('Error fetching report:', error)
      return null
    }
  }

  /**
   * Take moderation action on a report
   */
  async takeModerationAction(actionData: ModerationActionRequest): Promise<UserReport> {
    try {
      const report = await this.getReport(actionData.reportId)
      if (!report) {
        throw new Error('Report not found')
      }

      // Update report status
      const updatedReport = await this.databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.userReports,
        actionData.reportId,
        {
          status: 'resolved',
          actionTaken: actionData.action,
          resolution: actionData.resolution,
          reviewedAt: new Date().toISOString(),
          reviewedBy: actionData.moderatorId,
          updatedAt: new Date().toISOString()
        }
      )

      // Execute the moderation action
      await this.executeModerationAction(report, actionData)

      // Create moderation history entry
      await this.createModerationHistory({
        reportId: actionData.reportId,
        action: `action_taken_${actionData.action}`,
        performedBy: actionData.moderatorId,
        performerName: '', // Will be populated by calling component
        timestamp: new Date().toISOString(),
        details: actionData.resolution,
        previousStatus: report.status,
        newStatus: 'resolved'
      })

      // Send notifications
      if (actionData.notifyReporter) {
        await this.notifyReporter(report, actionData)
      }
      if (actionData.notifyReported) {
        await this.notifyReportedUser(report, actionData)
      }

      return updatedReport as UserReport
    } catch (error) {
      console.error('Error taking moderation action:', error)
      throw error
    }
  }

  /**
   * Bulk moderation actions
   */
  async bulkModerationAction(bulkAction: BulkModerationAction): Promise<void> {
    try {
      const promises = bulkAction.reportIds.map(reportId => {
        switch (bulkAction.action) {
          case 'resolve':
            return this.databases.updateDocument(
              appwriteConfig.databaseId,
              appwriteConfig.collections.userReports,
              reportId,
              {
                status: 'resolved',
                resolution: bulkAction.resolution || 'Bulk resolved',
                reviewedAt: new Date().toISOString(),
                reviewedBy: bulkAction.moderatorId,
                updatedAt: new Date().toISOString()
              }
            )
          case 'dismiss':
            return this.databases.updateDocument(
              appwriteConfig.databaseId,
              appwriteConfig.collections.userReports,
              reportId,
              {
                status: 'dismissed',
                resolution: bulkAction.resolution || 'Bulk dismissed',
                reviewedAt: new Date().toISOString(),
                reviewedBy: bulkAction.moderatorId,
                updatedAt: new Date().toISOString()
              }
            )
          case 'escalate':
            return this.databases.updateDocument(
              appwriteConfig.databaseId,
              appwriteConfig.collections.userReports,
              reportId,
              {
                status: 'escalated',
                priority: 'critical',
                updatedAt: new Date().toISOString()
              }
            )
          default:
            return Promise.resolve()
        }
      })

      await Promise.all(promises)
    } catch (error) {
      console.error('Error performing bulk action:', error)
      throw error
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(): Promise<ModerationStats> {
    try {
      const [total, pending, resolved, dismissed, critical, suspensions, today] = await Promise.all([
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.userReports,
          [Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.userReports,
          [Query.equal('status', 'pending'), Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.userReports,
          [Query.equal('status', 'resolved'), Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.userReports,
          [Query.equal('status', 'dismissed'), Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.userReports,
          [Query.equal('priority', 'critical'), Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          'user_suspensions',
          [Query.equal('isActive', true), Query.limit(1)]
        ),
        this.databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.userReports,
          [
            Query.greaterThanEqual('createdAt', new Date().toISOString().split('T')[0]),
            Query.limit(1)
          ]
        )
      ])

      const avgResolutionTime = await this.calculateAverageResolutionTime()

      return {
        totalReports: total.total,
        pendingReports: pending.total,
        resolvedReports: resolved.total,
        dismissedReports: dismissed.total,
        criticalReports: critical.total,
        activeSuspensions: suspensions.total,
        todayReports: today.total,
        avgResolutionTime
      }
    } catch (error) {
      console.error('Error fetching moderation stats:', error)
      throw error
    }
  }

  /**
   * Get user suspensions
   */
  async getUserSuspensions(userId?: string): Promise<UserSuspension[]> {
    try {
      const queries = [Query.orderDesc('startDate')]
      
      if (userId) {
        queries.push(Query.equal('userId', userId))
      }

      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        'user_suspensions',
        queries
      )

      return response.documents as UserSuspension[]
    } catch (error) {
      console.error('Error fetching user suspensions:', error)
      return []
    }
  }

  /**
   * Suspend user account
   */
  async suspendUser(
    userId: string, 
    reason: string, 
    durationDays: number, 
    moderatorId: string,
    reportId?: string
  ): Promise<UserSuspension> {
    try {
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + (durationDays * 24 * 60 * 60 * 1000))

      const suspension = await this.databases.createDocument(
        appwriteConfig.databaseId,
        'user_suspensions',
        ID.unique(),
        {
          userId,
          suspendedBy: moderatorId,
          reason,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isActive: true,
          reportId,
          appealStatus: 'none'
        }
      )

      // Update user profile to reflect suspension
      await this.databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.profiles,
        userId,
        {
          isSuspended: true,
          suspensionEndDate: endDate.toISOString()
        }
      )

      return suspension as UserSuspension
    } catch (error) {
      console.error('Error suspending user:', error)
      throw error
    }
  }

  /**
   * Get moderation history for a report
   */
  async getModerationHistory(reportId: string): Promise<ModerationHistory[]> {
    try {
      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        'moderation_history',
        [
          Query.equal('reportId', reportId),
          Query.orderDesc('timestamp')
        ]
      )

      return response.documents as ModerationHistory[]
    } catch (error) {
      console.error('Error fetching moderation history:', error)
      return []
    }
  }

  /**
   * Search reports
   */
  async searchReports(searchTerm: string): Promise<UserReport[]> {
    try {
      const response = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.userReports,
        [
          Query.search('reportedUserName', searchTerm),
          Query.orderDesc('createdAt')
        ]
      )

      return response.documents as UserReport[]
    } catch (error) {
      console.error('Error searching reports:', error)
      return []
    }
  }

  /**
   * Private helper methods
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const response = await this.databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.profiles,
        userId
      )
      return response
    } catch (error) {
      return null
    }
  }

  private async uploadEvidenceFiles(files: File[], reporterId: string): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => 
        this.storage.createFile(
          'evidence_files',
          ID.unique(),
          file
        )
      )

      const uploadResults = await Promise.all(uploadPromises)
      return uploadResults.map(result => result.$id)
    } catch (error) {
      console.error('Error uploading evidence files:', error)
      return []
    }
  }

  private determinePriority(category: string): 'low' | 'medium' | 'high' | 'critical' {
    const highPriorityCategories = ['violence_threats', 'underage', 'hate_speech']
    const mediumPriorityCategories = ['harassment', 'scam_fraud', 'fake_profile']
    
    if (highPriorityCategories.includes(category)) return 'critical'
    if (mediumPriorityCategories.includes(category)) return 'high'
    return 'medium'
  }

  private async executeModerationAction(report: UserReport, actionData: ModerationActionRequest): Promise<void> {
    switch (actionData.action) {
      case 'profile_suspended':
        if (actionData.suspensionDuration) {
          await this.suspendUser(
            report.reportedUserId,
            actionData.resolution,
            actionData.suspensionDuration,
            actionData.moderatorId,
            report.$id
          )
        }
        break
      case 'account_banned':
        await this.databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          report.reportedUserId,
          { isBanned: true, bannedAt: new Date().toISOString() }
        )
        break
      case 'verification_revoked':
        await this.databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          report.reportedUserId,
          { isVerified: false }
        )
        break
      case 'profile_restricted':
        await this.databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.profiles,
          report.reportedUserId,
          { isRestricted: true }
        )
        break
    }
  }

  private async createModerationHistory(historyData: Omit<ModerationHistory, '$id'>): Promise<void> {
    try {
      await this.databases.createDocument(
        appwriteConfig.databaseId,
        'moderation_history',
        ID.unique(),
        historyData
      )
    } catch (error) {
      console.error('Error creating moderation history:', error)
    }
  }

  private async notifyModerators(report: UserReport): Promise<void> {
    // Implementation would notify moderators about high-priority reports
    console.log('Notifying moderators about high-priority report:', report.$id)
  }

  private async notifyReporter(report: UserReport, actionData: ModerationActionRequest): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId: report.reporterId,
        type: 'system_announcement',
        title: 'Report Update',
        message: `Your report has been reviewed. Action taken: ${actionData.action}`,
        priority: 'medium'
      })
    } catch (error) {
      console.error('Error notifying reporter:', error)
    }
  }

  private async notifyReportedUser(report: UserReport, actionData: ModerationActionRequest): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId: report.reportedUserId,
        type: 'system_announcement',
        title: 'Account Action',
        message: `Action has been taken on your account due to a policy violation.`,
        priority: 'high'
      })
    } catch (error) {
      console.error('Error notifying reported user:', error)
    }
  }

  private async calculateAverageResolutionTime(): Promise<number> {
    try {
      const resolvedReports = await this.databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.userReports,
        [
          Query.equal('status', 'resolved'),
          Query.notEqual('reviewedAt', null),
          Query.limit(100)
        ]
      )

      if (resolvedReports.documents.length === 0) return 0

      const totalTime = resolvedReports.documents.reduce((sum, report: any) => {
        const created = new Date(report.createdAt).getTime()
        const reviewed = new Date(report.reviewedAt).getTime()
        return sum + (reviewed - created)
      }, 0)

      const avgTimeMs = totalTime / resolvedReports.documents.length
      return Math.round(avgTimeMs / (1000 * 60 * 60)) // Convert to hours
    } catch (error) {
      console.error('Error calculating average resolution time:', error)
      return 0
    }
  }
}

export const moderationService = new ModerationService()