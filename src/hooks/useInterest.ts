import { useState, useEffect, useCallback } from 'react';
import { InterestService } from '../lib/services/interest.service';
import { useAuth } from './useAuth';
import type {
  Interest,
  CreateInterestData,
  InterestResponse,
  InterestStats,
  InterestHistory,
  InterestFilters,
  MutualInterest,
  InterestValidationResult
} from '../lib/services/interest.service';

interface UseInterestReturn {
  // State
  sentInterests: Interest[];
  receivedInterests: Interest[];
  mutualInterests: MutualInterest[];
  interestStats: InterestStats | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Actions
  sendInterest: (data: CreateInterestData) => Promise<Interest | null>;
  respondToInterest: (response: InterestResponse) => Promise<Interest | null>;
  withdrawInterest: (interestId: string) => Promise<Interest | null>;
  markAsRead: (interestId: string) => Promise<Interest | null>;
  validateInterest: (receiverId: string) => Promise<InterestValidationResult | null>;
  
  // Data fetching
  refreshSentInterests: (filters?: InterestFilters) => Promise<void>;
  refreshReceivedInterests: (filters?: InterestFilters) => Promise<void>;
  refreshMutualInterests: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  
  // Utility
  clearError: () => void;
}

export const useInterest = (): UseInterestReturn => {
  const { user } = useAuth();
  
  // State
  const [sentInterests, setSentInterests] = useState<Interest[]>([]);
  const [receivedInterests, setReceivedInterests] = useState<Interest[]>([]);
  const [mutualInterests, setMutualInterests] = useState<MutualInterest[]>([]);
  const [interestStats, setInterestStats] = useState<InterestStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Send interest
  const sendInterest = useCallback(async (data: CreateInterestData): Promise<Interest | null> => {
    if (!user?.$id) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const interest = await InterestService.sendInterest(user.$id, data);
      
      // Update sent interests list
      setSentInterests(prev => [interest, ...prev]);
      
      // Refresh stats
      await refreshStats();
      
      return interest;
    } catch (err: any) {
      setError(err.message || 'Failed to send interest');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  // Respond to interest
  const respondToInterest = useCallback(async (response: InterestResponse): Promise<Interest | null> => {
    if (!user?.$id) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatedInterest = await InterestService.respondToInterest(user.$id, response);
      
      // Update received interests list
      setReceivedInterests(prev => 
        prev.map(interest => 
          interest.$id === response.interestId ? updatedInterest : interest
        )
      );
      
      // Refresh mutual interests and stats
      await Promise.all([refreshMutualInterests(), refreshStats()]);
      
      return updatedInterest;
    } catch (err: any) {
      setError(err.message || 'Failed to respond to interest');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  // Withdraw interest
  const withdrawInterest = useCallback(async (interestId: string): Promise<Interest | null> => {
    if (!user?.$id) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatedInterest = await InterestService.withdrawInterest(user.$id, interestId);
      
      // Update sent interests list
      setSentInterests(prev => 
        prev.map(interest => 
          interest.$id === interestId ? updatedInterest : interest
        )
      );
      
      // Refresh stats
      await refreshStats();
      
      return updatedInterest;
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw interest');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  // Mark interest as read
  const markAsRead = useCallback(async (interestId: string): Promise<Interest | null> => {
    if (!user?.$id) {
      setError('User not authenticated');
      return null;
    }

    try {
      const updatedInterest = await InterestService.markInterestAsRead(user.$id, interestId);
      
      // Update received interests list
      setReceivedInterests(prev => 
        prev.map(interest => 
          interest.$id === interestId ? updatedInterest : interest
        )
      );
      
      // Refresh unread count
      await refreshUnreadCount();
      
      return updatedInterest;
    } catch (err: any) {
      setError(err.message || 'Failed to mark interest as read');
      return null;
    }
  }, [user?.$id]);

  // Validate interest
  const validateInterest = useCallback(async (receiverId: string): Promise<InterestValidationResult | null> => {
    if (!user?.$id) {
      setError('User not authenticated');
      return null;
    }

    try {
      return await InterestService.validateInterestRequest(user.$id, receiverId);
    } catch (err: any) {
      setError(err.message || 'Failed to validate interest');
      return null;
    }
  }, [user?.$id]);

  // Refresh sent interests
  const refreshSentInterests = useCallback(async (filters?: InterestFilters): Promise<void> => {
    if (!user?.$id) return;

    try {
      setLoading(true);
      const result = await InterestService.getSentInterests(user.$id, filters);
      setSentInterests(result.interests);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sent interests');
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  // Refresh received interests
  const refreshReceivedInterests = useCallback(async (filters?: InterestFilters): Promise<void> => {
    if (!user?.$id) return;

    try {
      setLoading(true);
      const result = await InterestService.getReceivedInterests(user.$id, filters);
      setReceivedInterests(result.interests);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch received interests');
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  // Refresh mutual interests
  const refreshMutualInterests = useCallback(async (): Promise<void> => {
    if (!user?.$id) return;

    try {
      const mutuals = await InterestService.getMutualInterests(user.$id);
      setMutualInterests(mutuals);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch mutual interests');
    }
  }, [user?.$id]);

  // Refresh stats
  const refreshStats = useCallback(async (): Promise<void> => {
    if (!user?.$id) return;

    try {
      const stats = await InterestService.getInterestStats(user.$id);
      setInterestStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch interest statistics');
    }
  }, [user?.$id]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async (): Promise<void> => {
    if (!user?.$id) return;

    try {
      const count = await InterestService.getUnreadInterestsCount(user.$id);
      setUnreadCount(count);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch unread count');
    }
  }, [user?.$id]);

  // Initial data loading
  useEffect(() => {
    if (user?.$id) {
      Promise.all([
        refreshSentInterests(),
        refreshReceivedInterests(),
        refreshMutualInterests(),
        refreshStats(),
        refreshUnreadCount(),
      ]);
    }
  }, [user?.$id, refreshSentInterests, refreshReceivedInterests, refreshMutualInterests, refreshStats, refreshUnreadCount]);

  return {
    // State
    sentInterests,
    receivedInterests,
    mutualInterests,
    interestStats,
    unreadCount,
    loading,
    error,

    // Actions
    sendInterest,
    respondToInterest,
    withdrawInterest,
    markAsRead,
    validateInterest,

    // Data fetching
    refreshSentInterests,
    refreshReceivedInterests,
    refreshMutualInterests,
    refreshStats,
    refreshUnreadCount,

    // Utility
    clearError,
  };
};