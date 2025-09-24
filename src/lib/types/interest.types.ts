// Interest-related types and interfaces

export interface Interest {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  senderId: string;
  receiverId: string;
  status: InterestStatus;
  message?: string;
  sentAt: string;
  respondedAt?: string;
  type: InterestType;
  isRead: boolean;
  aiMatchScore?: number;
  commonInterests?: string[];
  withdrawnAt?: string;
  expiresAt?: string;
}

export type InterestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired';

export type InterestType = 'proposal' | 'favorite' | 'contact_request';

export interface CreateInterestData {
  receiverId: string;
  message?: string;
  type?: InterestType;
}

export interface InterestResponse {
  interestId: string;
  response: 'accepted' | 'declined';
  message?: string;
}

export interface InterestStats {
  totalSent: number;
  totalReceived: number;
  acceptedSent: number;
  acceptedReceived: number;
  pendingSent: number;
  pendingReceived: number;
  declinedSent: number;
  declinedReceived: number;
  withdrawnSent: number;
  mutualInterests: number;
  successRate: number;
  responseRate: number;
  averageResponseTime: number; // in hours
}

export interface InterestHistory {
  interests: Interest[];
  totalCount: number;
  hasMore: boolean;
  lastCursor?: string;
}

export interface InterestFilters {
  status?: InterestStatus[];
  type?: InterestType[];
  dateRange?: {
    from: string;
    to: string;
  };
  limit?: number;
  offset?: number;
}

export interface MutualInterest {
  interestId: string;
  otherUserId: string;
  matchedAt: string;
  contactShared: boolean;
  aiMatchScore?: number;
}

export interface InterestValidationResult {
  isValid: boolean;
  errors: string[];
  canSend: boolean;
  dailyLimitReached: boolean;
  alreadyExists: boolean;
}

// Extended profile info for interest context
export interface InterestProfileInfo {
  userId: string;
  name: string;
  age: number;
  district: string;
  education: string;
  occupation: string;
  profilePictureId?: string;
  isVerified: boolean;
  lastActiveAt?: string;
}

// Interest notification data
export interface InterestNotificationData {
  interestId: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  type: InterestType;
  message?: string;
}