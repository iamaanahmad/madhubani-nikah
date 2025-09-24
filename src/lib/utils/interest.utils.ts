import type { Interest, InterestStatus, InterestType } from '../services/interest.service';

/**
 * Format interest status for display
 */
export const formatInterestStatus = (status: InterestStatus): string => {
  const statusMap: Record<InterestStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    declined: 'Declined',
    withdrawn: 'Withdrawn',
    expired: 'Expired',
  };
  
  return statusMap[status] || status;
};

/**
 * Get status color for UI display
 */
export const getInterestStatusColor = (status: InterestStatus): string => {
  const colorMap: Record<InterestStatus, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    accepted: 'text-green-600 bg-green-50',
    declined: 'text-red-600 bg-red-50',
    withdrawn: 'text-gray-600 bg-gray-50',
    expired: 'text-gray-500 bg-gray-50',
  };
  
  return colorMap[status] || 'text-gray-600 bg-gray-50';
};

/**
 * Format interest type for display
 */
export const formatInterestType = (type: InterestType): string => {
  const typeMap: Record<InterestType, string> = {
    proposal: 'Marriage Proposal',
    favorite: 'Added to Favorites',
    contact_request: 'Contact Request',
  };
  
  return typeMap[type] || type;
};

/**
 * Check if interest can be withdrawn
 */
export const canWithdrawInterest = (interest: Interest): boolean => {
  return interest.status === 'pending';
};

/**
 * Check if interest can be responded to
 */
export const canRespondToInterest = (interest: Interest): boolean => {
  return interest.status === 'pending';
};

/**
 * Check if interest is expired
 */
export const isInterestExpired = (interest: Interest): boolean => {
  if (!interest.expiresAt) return false;
  return new Date(interest.expiresAt) < new Date();
};

/**
 * Calculate time remaining for interest expiry
 */
export const getTimeUntilExpiry = (interest: Interest): string | null => {
  if (!interest.expiresAt || interest.status !== 'pending') return null;
  
  const now = new Date();
  const expiryDate = new Date(interest.expiresAt);
  const timeDiff = expiryDate.getTime() - now.getTime();
  
  if (timeDiff <= 0) return 'Expired';
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  } else {
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  }
};

/**
 * Format relative time for interest actions
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * Generate interest message suggestions
 */
export const getInterestMessageSuggestions = (): string[] => {
  return [
    "Assalamu Alaikum, I found your profile interesting and would like to know more about you.",
    "I believe we might be compatible based on our shared values and background.",
    "Your profile caught my attention. I would be honored to connect with you.",
    "I'm impressed by your profile and would like to explore the possibility of marriage.",
    "May Allah bless us with a good match. I would like to get to know you better.",
  ];
};

/**
 * Validate interest message
 */
export const validateInterestMessage = (message: string): { isValid: boolean; error?: string } => {
  if (!message.trim()) {
    return { isValid: true }; // Message is optional
  }
  
  if (message.length < 10) {
    return { isValid: false, error: 'Message should be at least 10 characters long' };
  }
  
  if (message.length > 500) {
    return { isValid: false, error: 'Message should not exceed 500 characters' };
  }
  
  // Check for inappropriate content (basic check)
  const inappropriateWords = ['contact', 'phone', 'whatsapp', 'email', 'number'];
  const lowerMessage = message.toLowerCase();
  
  for (const word of inappropriateWords) {
    if (lowerMessage.includes(word)) {
      return { 
        isValid: false, 
        error: 'Please avoid sharing contact information in the initial message' 
      };
    }
  }
  
  return { isValid: true };
};

/**
 * Calculate success rate percentage
 */
export const calculateSuccessRate = (accepted: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((accepted / total) * 100);
};

/**
 * Get interest priority for sorting
 */
export const getInterestPriority = (interest: Interest): number => {
  // Higher number = higher priority
  const priorityMap: Record<InterestStatus, number> = {
    pending: 5,
    accepted: 4,
    declined: 2,
    withdrawn: 1,
    expired: 0,
  };
  
  return priorityMap[interest.status] || 0;
};

/**
 * Sort interests by priority and date
 */
export const sortInterests = (interests: Interest[]): Interest[] => {
  return [...interests].sort((a, b) => {
    // First sort by priority
    const priorityDiff = getInterestPriority(b) - getInterestPriority(a);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then sort by date (newest first)
    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
  });
};

/**
 * Filter interests by status
 */
export const filterInterestsByStatus = (
  interests: Interest[], 
  statuses: InterestStatus[]
): Interest[] => {
  if (statuses.length === 0) return interests;
  return interests.filter(interest => statuses.includes(interest.status));
};

/**
 * Group interests by status
 */
export const groupInterestsByStatus = (interests: Interest[]): Record<InterestStatus, Interest[]> => {
  const groups: Record<InterestStatus, Interest[]> = {
    pending: [],
    accepted: [],
    declined: [],
    withdrawn: [],
    expired: [],
  };
  
  interests.forEach(interest => {
    groups[interest.status].push(interest);
  });
  
  return groups;
};

/**
 * Get interest statistics summary
 */
export const getInterestSummary = (interests: Interest[]): {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  withdrawn: number;
  expired: number;
  successRate: number;
} => {
  const groups = groupInterestsByStatus(interests);
  const total = interests.length;
  const accepted = groups.accepted.length;
  
  return {
    total,
    pending: groups.pending.length,
    accepted,
    declined: groups.declined.length,
    withdrawn: groups.withdrawn.length,
    expired: groups.expired.length,
    successRate: calculateSuccessRate(accepted, total),
  };
};