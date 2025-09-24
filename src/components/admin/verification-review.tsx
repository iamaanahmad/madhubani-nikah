import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Eye, 
  Check, 
  X, 
  Clock, 
  User, 
  Calendar,
  Download,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import { 
  VerificationService, 
  VerificationRequest, 
  VerificationFilters,
  VerificationStats 
} from '@/lib/services/verification.service';
import { StorageService } from '@/lib/services/storage.service';
import { BUCKET_IDS } from '@/lib/appwrite-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface VerificationReviewProps {
  adminUserId: string;
  className?: string;
}

export const VerificationReview: React.FC<VerificationReviewProps> = ({
  adminUserId,
  className
}) => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<VerificationFilters>({});
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, statsData] = await Promise.all([
        VerificationService.listVerificationRequests(filters, 50, 0),
        VerificationService.getVerificationStats()
      ]);
      
      setRequests(requestsData.requests);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;

    setIsReviewing(true);
    try {
      await VerificationService.reviewVerificationRequest(requestId, {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        notes: reviewNotes,
        reviewedBy: adminUserId
      });

      // Refresh data
      await loadData();
      
      // Close dialog and reset form
      setSelectedRequest(null);
      setReviewNotes('');
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to review request:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      expired: { color: 'bg-gray-100 text-gray-800', label: 'Expired' }
    };

    const config = configs[status as keyof typeof configs] || configs.pending;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      id_card: 'National ID Card',
      passport: 'Passport',
      driving_license: 'Driving License',
      other: 'Other Document'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold">{stats.approvedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejectedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status?.[0] || ''}
                onValueChange={(value) => 
                  setFilters(prev => ({ 
                    ...prev, 
                    status: value ? [value] : undefined 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Document Type</Label>
              <Select
                value={filters.documentType?.[0] || ''}
                onValueChange={(value) => 
                  setFilters(prev => ({ 
                    ...prev, 
                    documentType: value ? [value] : undefined 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="id_card">National ID Card</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="driving_license">Driving License</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>User ID</Label>
              <Input
                placeholder="Search by user ID"
                value={filters.userId || ''}
                onChange={(e) => 
                  setFilters(prev => ({ 
                    ...prev, 
                    userId: e.target.value || undefined 
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requests</CardTitle>
          <CardDescription>
            Review and approve user verification documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No verification requests found
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.$id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">
                          {getDocumentTypeLabel(request.documentType)}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">User ID:</span>
                          <br />
                          {request.userId.substring(0, 8)}...
                        </div>
                        <div>
                          <span className="font-medium">Submitted:</span>
                          <br />
                          {new Date(request.submittedAt).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Documents:</span>
                          <br />
                          {request.documentFileIds.length} files
                        </div>
                        <div>
                          <span className="font-medium">Document #:</span>
                          <br />
                          {request.documentNumber || 'Not provided'}
                        </div>
                      </div>

                      {request.notes && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Notes:</span> {request.notes}
                        </div>
                      )}

                      {request.rejectionReason && (
                        <div className="mt-2 text-sm text-red-600">
                          <span className="font-medium">Rejection Reason:</span> {request.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Review Verification Request</DialogTitle>
                          </DialogHeader>

                          {selectedRequest && (
                            <div className="space-y-6">
                              {/* Request Details */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label>Document Type</Label>
                                  <p>{getDocumentTypeLabel(selectedRequest.documentType)}</p>
                                </div>
                                <div>
                                  <Label>Document Number</Label>
                                  <p>{selectedRequest.documentNumber || 'Not provided'}</p>
                                </div>
                                <div>
                                  <Label>Submitted</Label>
                                  <p>{new Date(selectedRequest.submittedAt).toLocaleString()}</p>
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <p>{getStatusBadge(selectedRequest.status)}</p>
                                </div>
                              </div>

                              {selectedRequest.notes && (
                                <div>
                                  <Label>User Notes</Label>
                                  <p className="text-sm bg-gray-50 p-3 rounded">
                                    {selectedRequest.notes}
                                  </p>
                                </div>
                              )}

                              {/* Document Files */}
                              <div>
                                <Label>Uploaded Documents</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                  {selectedRequest.documentFileIds.map((fileId, index) => (
                                    <div key={fileId} className="border rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">
                                          Document {index + 1}
                                        </span>
                                        <div className="flex space-x-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const url = StorageService.getFilePreview(
                                                BUCKET_IDS.VERIFICATION_DOCUMENTS,
                                                fileId,
                                                { width: 800, height: 600 }
                                              );
                                              window.open(url, '_blank');
                                            }}
                                          >
                                            <Eye className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const url = StorageService.getFileDownload(
                                                BUCKET_IDS.VERIFICATION_DOCUMENTS,
                                                fileId
                                              );
                                              window.open(url, '_blank');
                                            }}
                                          >
                                            <Download className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      <img
                                        src={StorageService.getFilePreview(
                                          BUCKET_IDS.VERIFICATION_DOCUMENTS,
                                          fileId,
                                          { width: 300, height: 200 }
                                        )}
                                        alt={`Document ${index + 1}`}
                                        className="w-full h-32 object-cover rounded"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Review Form */}
                              {selectedRequest.status === 'pending' && (
                                <div className="space-y-4 border-t pt-4">
                                  <div>
                                    <Label>Review Notes</Label>
                                    <Textarea
                                      value={reviewNotes}
                                      onChange={(e) => setReviewNotes(e.target.value)}
                                      placeholder="Add any notes about this verification..."
                                      rows={3}
                                    />
                                  </div>

                                  <div>
                                    <Label>Rejection Reason (if rejecting)</Label>
                                    <Textarea
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Explain why the verification is being rejected..."
                                      rows={2}
                                    />
                                  </div>

                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleReview(selectedRequest.$id, 'rejected')}
                                      disabled={isReviewing}
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                    <Button
                                      onClick={() => handleReview(selectedRequest.$id, 'approved')}
                                      disabled={isReviewing}
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};