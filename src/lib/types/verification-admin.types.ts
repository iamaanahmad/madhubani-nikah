export interface VerificationReviewRequest {
  $id: string
  userId: string
  userName: string
  userEmail: string
  documentType: 'id_card' | 'address_proof' | 'education_certificate' | 'other'
  documentUrl: string
  documentFileName: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewerName?: string
  rejectionReason?: string
  notes?: string
  priority: 'low' | 'medium' | 'high'
  isUrgent: boolean
}

export interface VerificationReviewAction {
  requestId: string
  action: 'approve' | 'reject'
  notes?: string
  rejectionReason?: string
  reviewerId: string
}

export interface VerificationStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  avgReviewTime: number // in hours
  todaySubmissions: number
  urgentRequests: number
}

export interface VerificationFilters {
  status?: 'pending' | 'approved' | 'rejected'
  documentType?: string
  priority?: 'low' | 'medium' | 'high'
  dateRange?: {
    from: string
    to: string
  }
  reviewerId?: string
  isUrgent?: boolean
}

export interface VerificationReviewHistory {
  $id: string
  requestId: string
  action: 'submitted' | 'approved' | 'rejected' | 'resubmitted'
  performedBy: string
  performerName: string
  timestamp: string
  notes?: string
  rejectionReason?: string
  previousStatus?: string
  newStatus?: string
}

export interface BulkVerificationAction {
  requestIds: string[]
  action: 'approve' | 'reject' | 'mark_urgent' | 'assign_reviewer'
  notes?: string
  rejectionReason?: string
  assigneeId?: string
  reviewerId: string
}