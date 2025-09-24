// Contact sharing and mutual interest types

export interface ContactInfo {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  preferredContactMethod: ContactMethod;
  contactNotes?: string;
  sharedAt: string;
  sharedBy: string;
}

export type ContactMethod = 'email' | 'phone' | 'whatsapp' | 'telegram' | 'social';

export interface ContactShare {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  fromUserId: string;
  toUserId: string;
  interestId: string;
  contactInfo: ContactInfo;
  isActive: boolean;
  sharedAt: string;
  revokedAt?: string;
  accessCount: number;
  lastAccessedAt?: string;
}

export interface CreateContactShareData {
  toUserId: string;
  interestId: string;
  contactInfo: Partial<ContactInfo>;
}

export interface MutualMatch {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  user1Id: string;
  user2Id: string;
  interest1Id: string;
  interest2Id: string;
  matchedAt: string;
  isContactShared: boolean;
  aiMatchScore?: number;
  commonInterests?: string[];
  matchQuality: MatchQuality;
  status: MutualMatchStatus;
  lastInteractionAt?: string;
}

export type MatchQuality = 'excellent' | 'good' | 'fair' | 'poor';
export type MutualMatchStatus = 'active' | 'contacted' | 'inactive' | 'blocked';

export interface CreateMutualMatchData {
  user1Id: string;
  user2Id: string;
  interest1Id: string;
  interest2Id: string;
  aiMatchScore?: number;
  commonInterests?: string[];
}

export interface ContactShareRequest {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  fromUserId: string;
  toUserId: string;
  mutualMatchId: string;
  message?: string;
  status: ContactShareRequestStatus;
  requestedAt: string;
  respondedAt?: string;
  expiresAt: string;
}

export type ContactShareRequestStatus = 'pending' | 'approved' | 'declined' | 'expired';

export interface CreateContactShareRequestData {
  toUserId: string;
  mutualMatchId: string;
  message?: string;
}

export interface ContactShareStats {
  totalShared: number;
  totalReceived: number;
  activeShares: number;
  totalAccesses: number;
  averageAccessCount: number;
  mostAccessedContact?: string;
  recentShares: ContactShare[];
}

export interface MutualMatchStats {
  totalMatches: number;
  activeMatches: number;
  contactedMatches: number;
  matchQualityBreakdown: {
    [K in MatchQuality]: number;
  };
  averageMatchScore: number;
  recentMatches: MutualMatch[];
}

export interface ContactPrivacySettings {
  userId: string;
  allowContactSharing: boolean;
  autoShareOnMutualMatch: boolean;
  shareEmail: boolean;
  sharePhone: boolean;
  shareWhatsapp: boolean;
  shareTelegram: boolean;
  shareSocialMedia: boolean;
  requireApprovalForSharing: boolean;
  maxActiveShares: number;
  shareExpiryDays: number;
}

export interface MatchRecommendation {
  userId: string;
  matchScore: number;
  reasons: string[];
  commonInterests: string[];
  locationCompatibility: number;
  educationCompatibility: number;
  religiousCompatibility: number;
  ageCompatibility: number;
  overallCompatibility: number;
}

// Analytics and insights
export interface MatchInsight {
  type: 'compatibility' | 'activity' | 'preference' | 'success_rate';
  title: string;
  description: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  recommendation?: string;
}

export interface ContactInteraction {
  $id: string;
  contactShareId: string;
  interactionType: ContactInteractionType;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type ContactInteractionType = 'viewed' | 'copied' | 'called' | 'messaged' | 'blocked' | 'reported';