import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeInterestService } from '@/lib/services/realtime-interest.service';
import { InterestService } from '@/lib/services/interest.service';
import type {
  Interest,
  InterestStats,
  InterestHistory,
  InterestFilters,
} from '@/lib/types/interest.types';
import type {
  RealtimeInterestData,
  InterestCountUpdate,
  MatchSuggestion,
  LiveActivityFeed,
} from '@/lib/services/realtime-interest.service';

interface UseRealtimeInterestsReturn {
  // Interest data
  sentInterests: Interest[];
  receivedInterests: Interest[];
  mutualInterests: Interest[];
  
  // Counts and stats
  interestCounts: {
    sent: number;
    received: number;
    unread: number;
    mutual: number;
  };
  interestStats: InterestStats | null;
  
  // Real-time data
  liveUpdates: RealtimeInterestData[];
  matchSuggestions: MatchSuggestion[];
  activityFeed: LiveActivityFeed[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  
  // Actions
  sendInterest: (receiverId: string, message?: string) => Promise<Interest | null>;
  respondToInterest: (interestId: string, response: 'accepted' | 'declined') => Promise<Interest | null>;
  withdrawInterest: (interestId: string) => Promise<Interest | null>;
  markAsRead: (interestId: string) => Promise<Interest | null>;
  
  // Data management
  refreshInterests: () => Promise<void>;
  refreshStats: () => Promise<void>;
  clearLiveUpdates: () => void;
  clearMatchSuggestions: () => void;
  clearActivityFeed: () => void;
  
  // Subscriptions
  enableRealtime: () => void;
  disableRealtime: () => void;
  
  // Utility
  clearError: () => void;
}

export const useRealtimeInterests = (userId?: string): UseRealtimeInterestsReturn => {
  // State
  const [sentInterests, setSentInterests] = useState<Interest[]>([]);
  const [receivedInterests, setReceivedInterests] = useState<Interest[]>([]);
  const [mutualInterests, setMutualInterests] = useState<Interest[]>([]);
  const [interestCounts, setInterestCounts] = useState({
    sent: 0,
    received: 0,
    unread: 0,
    mutual: 0,
  });
  const [interestStats, setInterestStats] = useState<InterestStats | null>(null);
  const [liveUpdates, setLiveUpdates] = useState<RealtimeInterestData[]>([]);
  const [matchSuggestions, setMatchSuggestions] = useState<MatchSuggestion[]>([]);
  const [activityFeed, setActivityFeed] = useState<LiveActivityFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs for cleanup
  const subscriptions = useRef<(() => void)[]>([]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle real-time interest updates
  const handleInterestUpdate = useCallback((data: RealtimeInterestData) => {
    const { interest, action } = data;

    // Add to live updates
    setLiveUpdates(prev => [data, ...prev.slice(0, 49)]); // Keep last 50

    // Update interest lists based on action and user role
    switch (action) {
      case 'created':
        if (interest.senderId === userId) {
          setSentInterests(prev => [interest, ...prev]);
        } else if (interest.receiverId === userId) {
          setReceivedInterests(prev => [interest, ...prev]);
        }
        break;

      case 'updated':
        if (interest.senderId === userId) {
          setSentInterests(prev => 
            prev.map(i => i.$id === interest.$id ? interest : i)
          );
        } else if (interest.receiverId === userId) {
          setReceivedInterests(prev => 
            prev.map(i => i.$id === interest.$id ? interest : i)
          );
        }

        // Check if it became a mutual interest
        if (interest.status === 'accepted') {
          // This would need more logic to determine if it's mutual
          // For now, we'll refresh mutual interests
          refreshMutualInterests();
        }
        break;

      case 'deleted':
        if (interest.senderId === userId) {
          setSentInterests(prev => prev.filter(i => i.$id !== interest.$id));
        } else if (interest.receiverId === userId) {
          setReceivedInterests(prev => prev.filter(i => i.$id !== interest.$id));
        }
        break;
    }
  }, [userId]);

  // Handle interest count updates
  const handleCountUpdate = useCallback((data: InterestCountUpdate) => {
    setInterestCounts({
      sent: data.sentCount,
      received: data.receivedCount,
      unread: data.unreadCount,
      mutual: data.mutualCount,
    });
  }, []);

  // Handle match suggestions
  const handleMatchSuggestion = useCallback((data: MatchSuggestion) => {
    setMatchSuggestions(prev => {
      // Avoid duplicates
      const exists = prev.some(s => s.suggestedUserId === data.suggestedUserId);
      if (exists) return prev;
      
      return [data, ...prev.slice(0, 9)]; // Keep last 10
    });
  }, []);

  // Handle activity feed updates
  const handleActivityFeed = useCallback((data: LiveActivityFeed) => {
    setActivityFeed(prev => [data, ...prev.slice(0, 99)]); // Keep last 100
  }, []);

  // Send interest
  const sendInterest = useCallback(async (receiverId: string, message?: string): Promise<Interest | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      const interest = await RealtimeInterestService.sendInterestWithRealtime(
        userId,
        receiverId,
        message
      );
      return interest;
    } catch (err: any) {
      setError(err.message || 'Failed to send interest');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Respond to interest
  const respondToInterest = useCallback(async (
    interestId: string,
    response: 'accepted' | 'declined'
  ): Promise<Interest | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      const interest = await RealtimeInterestService.respondToInterestWithRealtime(
        userId,
        interestId,
        response
      );
      return interest;
    } catch (err: any) {
      setError(err.message || 'Failed to respond to interest');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Withdraw interest
  const withdrawInterest = useCallback(async (interestId: string): Promise<Interest | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      const interest = await InterestService.withdrawInterest(userId, interestId);
      return interest;
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw interest');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark interest as read
  const markAsRead = useCallback(async (interestId: string): Promise<Interest | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      const interest = await InterestService.markInterestAsRead(userId, interestId);
      return interest;
    } catch (err: any) {
      setError(err.message || 'Failed to mark interest as read');
      return null;
    }
  }, [userId]);

  // Refresh interests
  const refreshInterests = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      setLoading(true);
      const [sent, received] = await Promise.all([
        InterestService.getSentInterests(userId),
        InterestService.getReceivedInterests(userId),
      ]);

      setSentInterests(sent.interests);
      setReceivedInterests(received.interests);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh interests');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refresh mutual interests
  const refreshMutualInterests = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const mutual = await InterestService.getMutualInterests(userId);
      // Convert MutualInterest[] to Interest[] (simplified)
      setMutualInterests([]); // This would need proper conversion
    } catch (err: any) {
      setError(err.message || 'Failed to refresh mutual interests');
    }
  }, [userId]);

  // Refresh stats
  const refreshStats = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const stats = await RealtimeInterestService.getLiveInterestStats(userId);
      setInterestStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh stats');
    }
  }, [userId]);

  // Clear live updates
  const clearLiveUpdates = useCallback(() => {
    setLiveUpdates([]);
  }, []);

  // Clear match suggestions
  const clearMatchSuggestions = useCallback(() => {
    setMatchSuggestions([]);
  }, []);

  // Clear activity feed
  const clearActivityFeed = useCallback(() => {
    setActivityFeed([]);
  }, []);

  // Enable real-time subscriptions
  const enableRealtime = useCallback(() => {
    if (!userId || isConnected) return;

    try {
      const unsubscribeFunctions = [
        RealtimeInterestService.subscribeToInterestUpdates(userId, handleInterestUpdate),
        RealtimeInterestService.subscribeToInterestCounts(userId, handleCountUpdate),
        RealtimeInterestService.subscribeToMatchSuggestions(userId, handleMatchSuggestion),
        RealtimeInterestService.subscribeToActivityFeed(userId, handleActivityFeed),
      ];

      subscriptions.current = unsubscribeFunctions;
      setIsConnected(true);
    } catch (err: any) {
      setError(err.message || 'Failed to enable real-time updates');
    }
  }, [userId, isConnected, handleInterestUpdate, handleCountUpdate, handleMatchSuggestion, handleActivityFeed]);

  // Disable real-time subscriptions
  const disableRealtime = useCallback(() => {
    subscriptions.current.forEach(unsubscribe => unsubscribe());
    subscriptions.current = [];
    setIsConnected(false);
  }, []);

  // Initialize data and subscriptions
  useEffect(() => {
    if (!userId) return;

    const initialize = async () => {
      await Promise.all([
        refreshInterests(),
        refreshMutualInterests(),
        refreshStats(),
      ]);
      enableRealtime();
    };

    initialize();

    return () => {
      disableRealtime();
    };
  }, [userId, refreshInterests, refreshMutualInterests, refreshStats, enableRealtime, disableRealtime]);

  return {
    // Interest data
    sentInterests,
    receivedInterests,
    mutualInterests,
    
    // Counts and stats
    interestCounts,
    interestStats,
    
    // Real-time data
    liveUpdates,
    matchSuggestions,
    activityFeed,
    
    // Loading states
    loading,
    error,
    isConnected,
    
    // Actions
    sendInterest,
    respondToInterest,
    withdrawInterest,
    markAsRead,
    
    // Data management
    refreshInterests,
    refreshStats,
    clearLiveUpdates,
    clearMatchSuggestions,
    clearActivityFeed,
    
    // Subscriptions
    enableRealtime,
    disableRealtime,
    
    // Utility
    clearError,
  };
};