'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Loader2,
  FileText,
  User,
  Calendar,
  Flag
} from 'lucide-react'
import { 
  VerificationReviewRequest,
  VerificationStats,
  VerificationFilters,
  VerificationReviewAction
} from '@/lib/types/verification-admin.types'
import { verificationAdminService } from '@/lib/services/verification-admin.service'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export function VerificationManagement() {
  const [requests, setRequests] = useState<VerificationReviewRequest[]>([])
  const [stats, setStats] = useState<VerificationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequests, setSelectedRequests] = useState<string[]>([])
  const [filters, setFilters] = useState<VerificationFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<VerificationReviewRequest | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  
  const { session, hasPermission } = useAdminAuth()
  const canReviewVerifications = hasPermission('profile_verification')

  const pageSize = 25

  useEffect(() => {
    loadData()
  }, [filters, currentPage])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [requestsData, statsData] = await Promise.all([
        verificationAdminService.getVerificationRequests(
          filters, 
          pageSize, 
          (currentPage - 1) * pageSize
        ),
        verificationAdminService.getVerificationStats()
      ])

      setRequests(requestsData.requests)
      setTotalPages(Math.ceil(requestsData.total / pageSize))
      setStats(statsData)
    } catch (error: any) {
      setError(error.message || 'Failed to load verification data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData()
      return
    }

    try {
      setIsLoading(true)
      const searchResults = await verificationAdminService.searchVerificationRequests(searchTerm)
      setRequests(searchResults)
      setTotalPages(1)
    } catch (error: any) {
      setError(error.message || 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReviewRequest = async (action: VerificationReviewAction) => {
    try {
      if (!session) return
      
      await verificationAdminService.reviewVerificationRequest({
        ...action,
        reviewerId: session.adminId
      })
      
      await loadData()
      setIsReviewDialogOpen(false)
      setSelectedRequest(null)
    } catch (error: any) {
      setError(error.message || 'Failed to review request')
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject' | 'mark_urgent') => {
    if (selectedRequests.length === 0) return
    if (!session) return

    try {
      await verificationAdminService.bulkReviewRequests({
        requestIds: selectedRequests,
        action,
        reviewerId: session.adminId
      })
      
      setSelectedRequests([])
      await loadData()
    } catch (error: any) {
      setError(error.message || 'Bulk action failed')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string, isUrgent: boolean) => {
    if (isUrgent) {
      return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Urgent</Badge>
    }
    
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>
      case 'medium':
        return <Badge variant="outline" className="text-yellow-600">Medium</Badge>
      case 'low':
        return <Badge variant="outline" className="text-gray-600">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  if (isLoading && !requests.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Verification Management</h2>
          <p className="text-gray-600">Review and manage user verification requests</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgentRequests}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by user name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.status || ''} onValueChange={(value) => setFilters({...filters, status: value as any})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.priority || ''} onValueChange={(value) => setFilters({...filters, priority: value as any})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRequests.length > 0 && canReviewVerifications && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedRequests.length} request{selectedRequests.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleBulkAction('approve')}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve All
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('reject')}>
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject All
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('mark_urgent')}>
                  <Flag className="mr-1 h-4 w-4" />
                  Mark Urgent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requests</CardTitle>
          <CardDescription>
            {requests.length} request{requests.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRequests.length === requests.length && requests.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRequests(requests.map(r => r.$id))
                      } else {
                        setSelectedRequests([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.$id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRequests.includes(request.$id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRequests([...selectedRequests, request.$id])
                        } else {
                          setSelectedRequests(selectedRequests.filter(id => id !== request.$id))
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.userName}</p>
                      <p className="text-sm text-gray-600">{request.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {request.documentType.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{getPriorityBadge(request.priority, request.isUrgent)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(request.submittedAt).toLocaleDateString()}</p>
                      <p className="text-gray-600">{new Date(request.submittedAt).toLocaleTimeString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request)
                          setIsReviewDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canReviewVerifications && request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleReviewRequest({
                              requestId: request.$id,
                              action: 'approve',
                              reviewerId: session?.adminId || ''
                            })}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewRequest({
                              requestId: request.$id,
                              action: 'reject',
                              reviewerId: session?.adminId || '',
                              rejectionReason: 'Documents not clear or invalid'
                            })}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
            <DialogDescription>
              Review and approve or reject the verification documents
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <VerificationReviewDialog 
              request={selectedRequest}
              onReview={handleReviewRequest}
              canReview={canReviewVerifications}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Verification Review Dialog Component
function VerificationReviewDialog({ 
  request, 
  onReview, 
  canReview 
}: { 
  request: VerificationReviewRequest
  onReview: (action: VerificationReviewAction) => void
  canReview: boolean
}) {
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const handleSubmit = () => {
    onReview({
      requestId: request.$id,
      action,
      notes: notes || undefined,
      rejectionReason: action === 'reject' ? rejectionReason : undefined,
      reviewerId: '' // Will be set by parent component
    })
  }

  return (
    <div className="space-y-6">
      {/* Request Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>User Name</Label>
          <p className="font-medium">{request.userName}</p>
        </div>
        <div>
          <Label>Email</Label>
          <p className="font-medium">{request.userEmail}</p>
        </div>
        <div>
          <Label>Document Type</Label>
          <p className="font-medium">{request.documentType.replace('_', ' ').toUpperCase()}</p>
        </div>
        <div>
          <Label>Submitted</Label>
          <p className="font-medium">{new Date(request.submittedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Document Preview */}
      <div>
        <Label>Document</Label>
        <div className="mt-2 border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">{request.documentFileName}</span>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download Document
          </Button>
        </div>
      </div>

      {/* Review Form */}
      {canReview && request.status === 'pending' && (
        <div className="space-y-4">
          <div>
            <Label>Review Decision</Label>
            <Select value={action} onValueChange={(value: 'approve' | 'reject') => setAction(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approve">Approve</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === 'reject' && (
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why the verification is being rejected..."
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes for this review..."
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit}>
              {action === 'approve' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Request
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Request
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}