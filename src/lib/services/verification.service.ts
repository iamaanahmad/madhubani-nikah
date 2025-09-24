import { databases, AppwriteService } from '../appwrite';
import { DATABASE_ID, COLLECTION_IDS, VERIFICATION_STATUS } from '../appwrite-config';
import { StorageService, FileUploadResult } from './storage.service';
import { ID, Permission, Query } from 'appwrite';

// Verification request interfaces
export interface VerificationRequest {
  $id: string;
  userId: string;
  documentType: 'id_card' | 'passport' | 'driving_license' | 'other';
  documentNumber?: string;
  documentFileIds: string[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface CreateVerificationRequestData {
  userId: string;
  documentType: 'id_card' | 'passport' | 'driving_license' | 'other';
  documentNumber?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface VerificationReviewData {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
  notes?: string;
  reviewedBy: string;
}

export interface VerificationStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageReviewTime: number; // in hours
}

export interface VerificationFilters {
  status?: string[];
  documentType?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  userId?: string;
  reviewedBy?: string;
}

export class VerificationService {
  /**
   * Create a new verification request
   */
  static async createVerificationRequest(
    data: CreateVerificationRequestData,
    files: File[]
  ): Promise<{ request: VerificationRequest; uploadResults: FileUploadResult[] }> {
    if (files.length === 0) {
      throw new Error('At least one document file is required');
    }

    if (files.length > 5) {
      throw new Error('Maximum 5 files allowed per verification request');
    }

    return AppwriteService.executeWithErrorHandling(async () => {
      // Upload documents first
      const uploadPromises = files.map(file => 
        StorageService.uploadVerificationDocument(file, data.userId)
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const documentFileIds = uploadResults.map(result => result.fileId);

      // Create verification request
      const requestData = {
        userId: data.userId,
        documentType: data.documentType,
        documentNumber: data.documentNumber || '',
        documentFileIds,
        status: VERIFICATION_STATUS.PENDING,
        submittedAt: new Date().toISOString(),
        notes: data.notes || '',
        metadata: data.metadata || {}
      };

      const request = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.VERIFICATION_REQUESTS,
        ID.unique(),
        requestData,
        [
          Permission.read(`user:${data.userId}`),
          Permission.read('role:admin'),
          Permission.update('role:admin'),
          Permission.delete('role:admin')
        ]
      );

      return {
        request: request as VerificationRequest,
        uploadResults
      };
    }, 'create verification request');
  }

  /**
   * Get verification request by ID
   */
  static async getVerificationRequest(requestId: string): Promise<VerificationRequest | null> {
    return AppwriteService.executeWithErrorHandling(async () => {
      try {
        const request = await databases.getDocument(
          DATABASE_ID,
          COLLECTION_IDS.VERIFICATION_REQUESTS,
          requestId
        );
        return request as VerificationRequest;
      } catch (error: any) {
        if (error.code === 404) {
          return null;
        }
        throw error;
      }
    }, 'get verification request');
  }

  /**
   * Get user's verification requests
   */
  static async getUserVerificationRequests(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ requests: VerificationRequest[]; total: number }> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.VERIFICATION_REQUESTS,
        [
          Query.equal('userId', userId),
          Query.orderDesc('submittedAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      return {
        requests: response.documents as VerificationRequest[],
        total: response.total
      };
    }, 'get user verification requests');
  }

  /**
   * Get user's current verification status
   */
  static async getUserVerificationStatus(userId: string): Promise<{
    isVerified: boolean;
    latestRequest?: VerificationRequest;
    verificationLevel: 'none' | 'pending' | 'partial' | 'full';
  }> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.VERIFICATION_REQUESTS,
        [
          Query.equal('userId', userId),
          Query.orderDesc('submittedAt'),
          Query.limit(1)
        ]
      );

      const latestRequest = response.documents[0] as VerificationRequest | undefined;
      
      let verificationLevel: 'none' | 'pending' | 'partial' | 'full' = 'none';
      let isVerified = false;

      if (latestRequest) {
        switch (latestRequest.status) {
          case VERIFICATION_STATUS.APPROVED:
            verificationLevel = 'full';
            isVerified = true;
            break;
          case VERIFICATION_STATUS.PENDING:
            verificationLevel = 'pending';
            break;
          case VERIFICATION_STATUS.REJECTED:
          case VERIFICATION_STATUS.EXPIRED:
            verificationLevel = 'none';
            break;
        }
      }

      return {
        isVerified,
        latestRequest,
        verificationLevel
      };
    }, 'get user verification status');
  }

  /**
   * List verification requests (admin function)
   */
  static async listVerificationRequests(
    filters: VerificationFilters = {},
    limit: number = 25,
    offset: number = 0
  ): Promise<{ requests: VerificationRequest[]; total: number }> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const queries = [
        Query.orderDesc('submittedAt'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        queries.push(Query.equal('status', filters.status));
      }

      if (filters.documentType && filters.documentType.length > 0) {
        queries.push(Query.equal('documentType', filters.documentType));
      }

      if (filters.userId) {
        queries.push(Query.equal('userId', filters.userId));
      }

      if (filters.reviewedBy) {
        queries.push(Query.equal('reviewedBy', filters.reviewedBy));
      }

      if (filters.dateRange) {
        queries.push(Query.greaterThanEqual('submittedAt', filters.dateRange.start));
        queries.push(Query.lessThanEqual('submittedAt', filters.dateRange.end));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.VERIFICATION_REQUESTS,
        queries
      );

      return {
        requests: response.documents as VerificationRequest[],
        total: response.total
      };
    }, 'list verification requests');
  }

  /**
   * Review verification request (admin function)
   */
  static async reviewVerificationRequest(
    requestId: string,
    reviewData: VerificationReviewData
  ): Promise<VerificationRequest> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const updateData = {
        status: reviewData.status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewData.reviewedBy,
        rejectionReason: reviewData.rejectionReason || '',
        notes: reviewData.notes || ''
      };

      // Set expiration date for approved verifications (1 year)
      if (reviewData.status === VERIFICATION_STATUS.APPROVED) {
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        updateData.expiresAt = expirationDate.toISOString();
      }

      const updatedRequest = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.VERIFICATION_REQUESTS,
        requestId,
        updateData
      );

      return updatedRequest as VerificationRequest;
    }, 'review verification request');
  }

  /**
   * Delete verification request
   */
  static async deleteVerificationRequest(requestId: string): Promise<void> {
    return AppwriteService.executeWithErrorHandling(async () => {
      // Get request to access file IDs
      const request = await this.getVerificationRequest(requestId);
      
      if (request) {
        // Delete associated files
        const deletePromises = request.documentFileIds.map(fileId =>
          StorageService.deleteFile('verification_documents', fileId).catch(error => {
            console.warn(`Failed to delete verification file ${fileId}:`, error);
          })
        );
        
        await Promise.all(deletePromises);
      }

      // Delete the request document
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTION_IDS.VERIFICATION_REQUESTS,
        requestId
      );
    }, 'delete verification request');
  }

  /**
   * Get verification statistics (admin function)
   */
  static async getVerificationStats(
    dateRange?: { start: string; end: string }
  ): Promise<VerificationStats> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const queries = [];
      
      if (dateRange) {
        queries.push(Query.greaterThanEqual('submittedAt', dateRange.start));
        queries.push(Query.lessThanEqual('submittedAt', dateRange.end));
      }

      // Get all requests
      const allRequests = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.VERIFICATION_REQUESTS,
        [...queries, Query.limit(1000)] // Adjust limit as needed
      );

      const requests = allRequests.documents as VerificationRequest[];

      // Calculate statistics
      const stats = {
        totalRequests: requests.length,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        averageReviewTime: 0
      };

      let totalReviewTime = 0;
      let reviewedCount = 0;

      requests.forEach(request => {
        switch (request.status) {
          case VERIFICATION_STATUS.PENDING:
            stats.pendingRequests++;
            break;
          case VERIFICATION_STATUS.APPROVED:
            stats.approvedRequests++;
            break;
          case VERIFICATION_STATUS.REJECTED:
          case VERIFICATION_STATUS.EXPIRED:
            stats.rejectedRequests++;
            break;
        }

        // Calculate review time for reviewed requests
        if (request.reviewedAt) {
          const submittedTime = new Date(request.submittedAt).getTime();
          const reviewedTime = new Date(request.reviewedAt).getTime();
          const reviewTime = (reviewedTime - submittedTime) / (1000 * 60 * 60); // hours
          
          totalReviewTime += reviewTime;
          reviewedCount++;
        }
      });

      stats.averageReviewTime = reviewedCount > 0 ? totalReviewTime / reviewedCount : 0;

      return stats;
    }, 'get verification stats');
  }

  /**
   * Check for expired verifications and update status
   */
  static async updateExpiredVerifications(): Promise<number> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const now = new Date().toISOString();
      
      // Find expired approved verifications
      const expiredRequests = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_IDS.VERIFICATION_REQUESTS,
        [
          Query.equal('status', VERIFICATION_STATUS.APPROVED),
          Query.lessThan('expiresAt', now),
          Query.limit(100)
        ]
      );

      // Update expired requests
      const updatePromises = expiredRequests.documents.map(request =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTION_IDS.VERIFICATION_REQUESTS,
          request.$id,
          { status: VERIFICATION_STATUS.EXPIRED }
        )
      );

      await Promise.all(updatePromises);

      return expiredRequests.documents.length;
    }, 'update expired verifications');
  }

  /**
   * Resubmit verification request with new documents
   */
  static async resubmitVerificationRequest(
    requestId: string,
    files: File[],
    notes?: string
  ): Promise<{ request: VerificationRequest; uploadResults: FileUploadResult[] }> {
    return AppwriteService.executeWithErrorHandling(async () => {
      const existingRequest = await this.getVerificationRequest(requestId);
      if (!existingRequest) {
        throw new Error('Verification request not found');
      }

      // Delete old files
      const deletePromises = existingRequest.documentFileIds.map(fileId =>
        StorageService.deleteFile('verification_documents', fileId).catch(error => {
          console.warn(`Failed to delete old verification file ${fileId}:`, error);
        })
      );
      await Promise.all(deletePromises);

      // Upload new files
      const uploadPromises = files.map(file => 
        StorageService.uploadVerificationDocument(file, existingRequest.userId)
      );
      const uploadResults = await Promise.all(uploadPromises);
      const documentFileIds = uploadResults.map(result => result.fileId);

      // Update request
      const updatedRequest = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.VERIFICATION_REQUESTS,
        requestId,
        {
          documentFileIds,
          status: VERIFICATION_STATUS.PENDING,
          submittedAt: new Date().toISOString(),
          notes: notes || existingRequest.notes,
          reviewedAt: '',
          reviewedBy: '',
          rejectionReason: ''
        }
      );

      return {
        request: updatedRequest as VerificationRequest,
        uploadResults
      };
    }, 'resubmit verification request');
  }
}