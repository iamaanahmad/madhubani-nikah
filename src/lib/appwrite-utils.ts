import { Query } from 'appwrite';
import { 
  ALLOWED_EXTENSIONS, 
  ALLOWED_MIME_TYPES, 
  FILE_LIMITS,
  QUERY_LIMITS 
} from './appwrite-config';

// File validation utilities
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    actualSize?: number;
    maxSize?: number;
    actualType?: string;
    allowedTypes?: string[];
  };
}

export class AppwriteUtils {
  /**
   * Validate file for upload
   */
  static validateFile(
    file: File, 
    type: 'image' | 'document',
    maxSize?: number
  ): FileValidationResult {
    const allowedTypes = type === 'image' 
      ? ALLOWED_MIME_TYPES.IMAGES 
      : ALLOWED_MIME_TYPES.DOCUMENTS;
    
    const allowedExtensions = type === 'image'
      ? ALLOWED_EXTENSIONS.IMAGES
      : ALLOWED_EXTENSIONS.DOCUMENTS;

    const defaultMaxSize = type === 'image'
      ? FILE_LIMITS.PROFILE_PICTURE_MAX_SIZE
      : FILE_LIMITS.VERIFICATION_DOCUMENT_MAX_SIZE;

    const sizeLimit = maxSize || defaultMaxSize;

    // Check file size
    if (file.size > sizeLimit) {
      return {
        isValid: false,
        error: `File size exceeds limit of ${this.formatFileSize(sizeLimit)}`,
        details: {
          actualSize: file.size,
          maxSize: sizeLimit
        }
      };
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        details: {
          actualType: file.type,
          allowedTypes
        }
      };
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
        details: {
          actualType: extension,
          allowedTypes: allowedExtensions
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate unique file name
   */
  static generateFileName(originalName: string, userId: string): string {
    const extension = originalName.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId}_${timestamp}_${random}.${extension}`;
  }

  /**
   * Build search queries with filters
   */
  static buildSearchQueries(filters: {
    gender?: string;
    ageMin?: number;
    ageMax?: number;
    district?: string;
    education?: string;
    sect?: string;
    isVerified?: boolean;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): string[] {
    const queries: string[] = [];

    // Gender filter
    if (filters.gender) {
      queries.push(Query.equal('gender', filters.gender));
    }

    // Age range filter
    if (filters.ageMin !== undefined) {
      queries.push(Query.greaterThanEqual('age', filters.ageMin));
    }
    if (filters.ageMax !== undefined) {
      queries.push(Query.lessThanEqual('age', filters.ageMax));
    }

    // Location filter
    if (filters.district) {
      queries.push(Query.equal('district', filters.district));
    }

    // Education filter
    if (filters.education) {
      queries.push(Query.equal('education', filters.education));
    }

    // Religious sect filter
    if (filters.sect) {
      queries.push(Query.equal('sect', filters.sect));
    }

    // Verification status
    if (filters.isVerified !== undefined) {
      queries.push(Query.equal('isVerified', filters.isVerified));
    }

    // Active status
    if (filters.isActive !== undefined) {
      queries.push(Query.equal('isActive', filters.isActive));
    }

    // Pagination
    const limit = Math.min(filters.limit || QUERY_LIMITS.DEFAULT_PAGE_SIZE, QUERY_LIMITS.MAX_PAGE_SIZE);
    queries.push(Query.limit(limit));

    if (filters.offset) {
      queries.push(Query.offset(filters.offset));
    }

    // Default ordering by last active
    queries.push(Query.orderDesc('lastActiveAt'));

    return queries;
  }

  /**
   * Build notification queries
   */
  static buildNotificationQueries(userId: string, options?: {
    isRead?: boolean;
    type?: string;
    limit?: number;
  }): string[] {
    const queries: string[] = [
      Query.equal('userId', userId)
    ];

    if (options?.isRead !== undefined) {
      queries.push(Query.equal('isRead', options.isRead));
    }

    if (options?.type) {
      queries.push(Query.equal('type', options.type));
    }

    const limit = options?.limit || QUERY_LIMITS.NOTIFICATION_LIMIT;
    queries.push(Query.limit(limit));
    queries.push(Query.orderDesc('createdAt'));

    return queries;
  }

  /**
   * Build interest queries
   */
  static buildInterestQueries(userId: string, type: 'sent' | 'received', options?: {
    status?: string;
    limit?: number;
  }): string[] {
    const queries: string[] = [];

    if (type === 'sent') {
      queries.push(Query.equal('senderId', userId));
    } else {
      queries.push(Query.equal('receiverId', userId));
    }

    if (options?.status) {
      queries.push(Query.equal('status', options.status));
    }

    const limit = options?.limit || QUERY_LIMITS.INTEREST_HISTORY_LIMIT;
    queries.push(Query.limit(limit));
    queries.push(Query.orderDesc('sentAt'));

    return queries;
  }

  /**
   * Sanitize user input
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number (Indian format)
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
    }
    return phone;
  }

  /**
   * Calculate age from date of birth
   */
  static calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Generate profile completion percentage
   */
  static calculateProfileCompletion(profile: any): number {
    const requiredFields = [
      'name', 'age', 'gender', 'district', 'education', 
      'occupation', 'sect', 'bio', 'familyBackground'
    ];
    
    const optionalFields = [
      'profilePictureId', 'block', 'village', 'skills',
      'subSect', 'biradari', 'familyType'
    ];

    let score = 0;
    const requiredWeight = 70; // 70% for required fields
    const optionalWeight = 30; // 30% for optional fields

    // Check required fields
    const completedRequired = requiredFields.filter(field => 
      profile[field] && profile[field].toString().trim().length > 0
    ).length;
    
    score += (completedRequired / requiredFields.length) * requiredWeight;

    // Check optional fields
    const completedOptional = optionalFields.filter(field => 
      profile[field] && profile[field].toString().trim().length > 0
    ).length;
    
    score += (completedOptional / optionalFields.length) * optionalWeight;

    return Math.round(score);
  }

  /**
   * Generate user-friendly error messages
   */
  static getErrorMessage(error: any): string {
    if (error.userMessage) {
      return error.userMessage;
    }

    // Fallback error messages
    const errorMessages: Record<string, string> = {
      'user_already_exists': 'An account with this email already exists.',
      'user_invalid_credentials': 'Invalid email or password.',
      'user_not_found': 'User account not found.',
      'document_not_found': 'The requested information was not found.',
      'storage_invalid_file_size': 'File size is too large.',
      'storage_invalid_file': 'Invalid file format.',
      'general_rate_limit_exceeded': 'Too many requests. Please try again later.',
    };

    const errorType = error.type || error.code || 'unknown';
    return errorMessages[errorType] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Debounce function for search
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Generate cache key
   */
  static generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}