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
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Eye,
  Ban,
  UserX,
  Flag,
  Loader2,
  FileText,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { 
  UserReport,
  ModerationStats,
  ReportFilters,
  ModerationActionRequest,
  REPORT_CATEGORIES,
  MODERATION_ACTIONS,
  ReportCategory,
  ReportStatus,
  ReportPriority,
  ModerationAction
} from '@/lib/types/moderation.types'
import { moderationService } from '@/lib/services/moderation.service'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export function ModerationDashboard() {
  const [reports, setReports] = useState<UserReport[]>([])
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [filters, setFilters] = useState<ReportFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  
  const { session, hasPermission } = useAdminAuth()
  const canModerate = hasPermission('content_moderation') || hasPermission('report_handling')

  const pageSize = 25

  useEffect(() => {
    loadData()
  }, [filters, currentPage])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [reportsData, statsData] = await Promise.all([
        moderationService.getReports(filters, pageSize, (currentPage - 1) * pageSize),
        moderationService.getModerationStats()
      ])

      setReports(reportsData.reports)
      setTotalPages(Math.ceil(reportsData.total / pageSize))
      setStats(statsData)
    } catch (error: any) {
      setError(error.message || 'Failed to load moderation data')
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
      const searchResults = await moderationService.searchReports(searchTerm)
      setReports(searchResults)
      setTotalPages(1)
    } catch (error: any) {
      setError(error.message || 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleModerationAction = async (actionData: ModerationActionRequest) => {
    try {
      if (!session) return
      
      await moderationService.takeModerationAction({
        ...actionData,
        moderatorId: session.adminId
      })
      
      await loadData()
      setIsActionDialogOpen(false)
      setSelectedReport(null)
    } catch (error: any) {
      setError(error.message || 'Failed to take action')
    }
  }

  const handleBulkAction = async (action: 'resolve' | 'dismiss' | 'escalate') => {
    if (selectedReports.length === 0) return
    if (!session) return

    try {
      await moderationService.bulkModerationAction({
        reportIds: selectedReports,
        action,
        moderatorId: session.adminId
      })
      
      setSelectedReports([])
      await loadData()
    } catch (error: any) {
      setError(error.message || 'Bulk action failed')
    }
  }

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="mr-1 h-3 w-3" />Pending</Badge>
      case 'under_review':
        return <Badge variant="outline" className="text-blue-600"><Eye className="mr-1 h-3 w-3" />Under Review</Badge>
      case 'resolved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="mr-1 h-3 w-3" />Resolved</Badge>
      case 'dismissed':
        return <Badge variant="outline" className="text-gray-600"><XCircle className="mr-1 h-3 w-3" />Dismissed</Badge>
      case 'escalated':
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Escalated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: ReportPriority) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'high':
        return <Badge variant="destructive" className="bg-orange-600">High</Badge>
      case 'medium':
        return <Badge variant="outline" className="text-yellow-600">Medium</Badge>
      case 'low':
        return <Badge variant="outline" className="text-gray-600">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getCategoryLabel = (category: ReportCategory) => {
    const categoryInfo = REPORT_CATEGORIES.find(c => c.value === category)
    return categoryInfo?.label || category
  }

  if (isLoading && !reports.length) {
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
          <h2 className="text-2xl font-bold">Moderation Dashboard</h2>
          <p className="text-gray-600">Review and manage user reports</p>
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
                  <p className="text-sm text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold">{stats.totalReports}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{stats.criticalReports}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Suspensions</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.activeSuspensions}</p>
                </div>
                <Ban className="h-8 w-8 text-orange-600" />
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
                  placeholder="Search by reported user name..."
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
              <Select value={filters.status || ''} onValueChange={(value) => setFilters({...filters, status: value as ReportStatus})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.priority || ''} onValueChange={(value) => setFilters({...filters, priority: value as ReportPriority})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.category || ''} onValueChange={(value) => setFilters({...filters, category: value as ReportCategory})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {REPORT_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedReports.length > 0 && canModerate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedReports.length} report{selectedReports.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleBulkAction('resolve')}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Resolve All
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('dismiss')}>
                  <XCircle className="mr-1 h-4 w-4" />
                  Dismiss All
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('escalate')}>
                  <AlertTriangle className="mr-1 h-4 w-4" />
                  Escalate All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Reports</CardTitle>
          <CardDescription>
            {reports.length} report{reports.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedReports.length === reports.length && reports.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedReports(reports.map(r => r.$id))
                      } else {
                        setSelectedReports([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Reported User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.$id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedReports.includes(report.$id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedReports([...selectedReports, report.$id])
                        } else {
                          setSelectedReports(selectedReports.filter(id => id !== report.$id))
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{report.reportedUserName}</p>
                      <p className="text-sm text-gray-600">{report.reportedUserEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getCategoryLabel(report.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>{getPriorityBadge(report.priority)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(report.createdAt).toLocaleDateString()}</p>
                      <p className="text-gray-600">{new Date(report.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report)
                          setIsActionDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canModerate && report.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleModerationAction({
                            reportId: report.$id,
                            action: 'no_action',
                            resolution: 'No violation found',
                            moderatorId: session?.adminId || ''
                          })}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
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

      {/* Moderation Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
            <DialogDescription>
              Review the report details and take appropriate action
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <ModerationActionDialog 
              report={selectedReport}
              onAction={handleModerationAction}
              canModerate={canModerate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Moderation Action Dialog Component
function ModerationActionDialog({ 
  report, 
  onAction, 
  canModerate 
}: { 
  report: UserReport
  onAction: (action: ModerationActionRequest) => void
  canModerate: boolean
}) {
  const [action, setAction] = useState<ModerationAction>('no_action')
  const [resolution, setResolution] = useState('')
  const [suspensionDuration, setSuspensionDuration] = useState(7)
  const [notifyReporter, setNotifyReporter] = useState(true)
  const [notifyReported, setNotifyReported] = useState(true)

  const handleSubmit = () => {
    onAction({
      reportId: report.$id,
      action,
      resolution,
      notifyReporter,
      notifyReported,
      suspensionDuration: action === 'profile_suspended' ? suspensionDuration : undefined,
      moderatorId: '' // Will be set by parent component
    })
  }

  return (
    <div className="space-y-6">
      {/* Report Details */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Reported User</Label>
          <p className="font-medium">{report.reportedUserName}</p>
          <p className="text-sm text-gray-600">{report.reportedUserEmail}</p>
        </div>
        <div>
          <Label>Reporter</Label>
          <p className="font-medium">
            {report.isAnonymous ? 'Anonymous' : report.reporterName}
          </p>
        </div>
        <div>
          <Label>Category</Label>
          <p className="font-medium">{getCategoryLabel(report.category)}</p>
        </div>
        <div>
          <Label>Priority</Label>
          <div className="mt-1">{getPriorityBadge(report.priority)}</div>
        </div>
      </div>

      <div>
        <Label>Reason</Label>
        <p className="font-medium">{report.reason}</p>
      </div>

      <div>
        <Label>Description</Label>
        <p className="text-sm">{report.description}</p>
      </div>

      {report.evidence && report.evidence.length > 0 && (
        <div>
          <Label>Evidence</Label>
          <div className="mt-2 space-y-2">
            {report.evidence.map((evidenceId, index) => (
              <div key={evidenceId} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Evidence {index + 1}</span>
                <Button variant="outline" size="sm">View</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Form */}
      {canModerate && report.status === 'pending' && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <Label>Moderation Action</Label>
            <Select value={action} onValueChange={(value: ModerationAction) => setAction(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODERATION_ACTIONS.map(actionOption => (
                  <SelectItem key={actionOption.value} value={actionOption.value}>
                    {actionOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {action === 'profile_suspended' && (
            <div>
              <Label htmlFor="suspensionDuration">Suspension Duration (days)</Label>
              <Input
                id="suspensionDuration"
                type="number"
                value={suspensionDuration}
                onChange={(e) => setSuspensionDuration(parseInt(e.target.value))}
                min={1}
                max={365}
              />
            </div>
          )}

          <div>
            <Label htmlFor="resolution">Resolution Notes</Label>
            <Textarea
              id="resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Explain the action taken and reasoning..."
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyReporter"
                checked={notifyReporter}
                onCheckedChange={(checked) => setNotifyReporter(checked as boolean)}
              />
              <Label htmlFor="notifyReporter">Notify Reporter</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyReported"
                checked={notifyReported}
                onCheckedChange={(checked) => setNotifyReported(checked as boolean)}
              />
              <Label htmlFor="notifyReported">Notify Reported User</Label>
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Take Action
          </Button>
        </div>
      )}
    </div>
  )
}