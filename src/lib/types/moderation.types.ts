export interface UserReport {
  $id: string
  reporterId: string
  reporterName: string
  reportedUserId: string
  reportedUserName: string
  reportedUserEmail: string
  category: ReportCategory
  reason: string
  description: string
  evidence?: string[] // URLs to evidence files
  status: ReportStatus
  priority: ReportPriority
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewerName?: string
  resolution?: string
  actionTaken?: ModerationAction
  isAnonymous: boolean
}

export type ReportCategory = 
  | 'inappropriate_content'
  | 'fake_profile'
  | 'harassment'
  | 'spam'
  | 'inappropriate_photos'
  | 'scam_fraud'
  | 'underage'
  | 'violence_threats'
  | 'hate_speech'
  | 'other'

export type ReportStatus = 
  | 'pending'
  | 'under_review'
  | 'resolved'
  | 'dismissed'
  | 'escalated'

export type ReportPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export type ModerationAction = 
  | 'no_action'
  | 'warning_sent'
  | 'content_removed'
  | 'profile_suspended'
  | 'account_banned'
  | 'profile_restricted'
  | 'verification_revoked'

export interface CreateReportRequest {
  reportedUserId: string
  category: ReportCategory
  reason: string
  description: string
  evidence?: File[]
  isAnonymous?: boolean
}

export interface ModerationActionRequest {
  reportId: string
  action: ModerationAction
  resolution: string
  notifyReporter?: boolean
  notifyReported?: boolean
  suspensionDuration?: number // in days
  moderatorId: string
}

export interface UserSuspension {
  $id: string
  userId: string
  suspendedBy: string
  reason: string
  startDate: string
  endDate: string
  isActive: boolean
  reportId?: string
  appealStatus?: 'none' | 'pending' | 'approved' | 'rejected'
  appealReason?: string
  appealedAt?: string
}

export interface ModerationStats {
  totalReports: number
  pendingReports: number
  resolvedReports: number
  dismissedReports: number
  criticalReports: number
  activeSuspensions: number
  todayReports: number
  avgResolutionTime: number // in hours
}

export interface ReportFilters {
  status?: ReportStatus
  category?: ReportCategory
  priority?: ReportPriority
  dateRange?: {
    from: string
    to: string
  }
  reviewerId?: string
}

export interface ModerationHistory {
  $id: string
  reportId: string
  action: string
  performedBy: string
  performerName: string
  timestamp: string
  details: string
  previousStatus?: string
  newStatus?: string
}

export interface BulkModerationAction {
  reportIds: string[]
  action: 'resolve' | 'dismiss' | 'escalate' | 'assign'
  resolution?: string
  assigneeId?: string
  moderatorId: string
}

export const REPORT_CATEGORIES: { value: ReportCategory; label: string; description: string }[] = [
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Content that violates community guidelines'
  },
  {
    value: 'fake_profile',
    label: 'Fake Profile',
    description: 'Profile with false or misleading information'
  },
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Bullying, stalking, or unwanted contact'
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Unwanted promotional or repetitive content'
  },
  {
    value: 'inappropriate_photos',
    label: 'Inappropriate Photos',
    description: 'Photos that violate photo guidelines'
  },
  {
    value: 'scam_fraud',
    label: 'Scam/Fraud',
    description: 'Fraudulent activity or scam attempts'
  },
  {
    value: 'underage',
    label: 'Underage User',
    description: 'User appears to be under 18 years old'
  },
  {
    value: 'violence_threats',
    label: 'Violence/Threats',
    description: 'Threats of violence or harmful content'
  },
  {
    value: 'hate_speech',
    label: 'Hate Speech',
    description: 'Discriminatory or hateful language'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other violations not listed above'
  }
]

export const MODERATION_ACTIONS: { value: ModerationAction; label: string; description: string }[] = [
  {
    value: 'no_action',
    label: 'No Action Required',
    description: 'Report reviewed, no violation found'
  },
  {
    value: 'warning_sent',
    label: 'Warning Sent',
    description: 'User warned about policy violation'
  },
  {
    value: 'content_removed',
    label: 'Content Removed',
    description: 'Specific content removed from profile'
  },
  {
    value: 'profile_suspended',
    label: 'Profile Suspended',
    description: 'User profile temporarily suspended'
  },
  {
    value: 'account_banned',
    label: 'Account Banned',
    description: 'User account permanently banned'
  },
  {
    value: 'profile_restricted',
    label: 'Profile Restricted',
    description: 'User profile visibility restricted'
  },
  {
    value: 'verification_revoked',
    label: 'Verification Revoked',
    description: 'User verification status removed'
  }
]