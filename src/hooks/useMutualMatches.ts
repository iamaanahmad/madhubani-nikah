import { useState, useEffect, useCallback } from 'react';
import { ContactService } from '../lib/services/contact.service';
import type {
  MutualMatch,
  CreateMutualMatchData,
  ContactShare,
  CreateContactShareData,
  ContactShareRequest,
  CreateContactShareRequestData,
  ContactShareStats,
  MutualMatchStats,
  MatchRecommendation,
  MatchInsight,
  MutualMatchStatus
} from '../lib/services/contact.service';

interface UseMutualMatchesReturn {
  // State
  mutualMatches: MutualMatch[];
  contactShares: ContactShare[];
  shareRequests: ContactShareRequest[];
  stats: MutualMatchStats | null;
  contactStats: ContactShareStats | null;
  recommendations: MatchRecommendation[];
  insights: MatchInsight[];
  loading: boolean;
  error: string | null;

  // Actions
  createMutualMatch: (data: CreateMutualMatchData) => Promise<MutualMatch | null>;
  shareContact: (data: CreateContactShareData) => Promise<ContactShare | null>;
  requestContactShare: (data: CreateContactShareRequestData) => Promise<ContactShareRequest | null>;
  respondToShareRequest: (requestId: string, response: 'approved' | 'declined') => Promise<ContactShareRequest | null>;
  updateMatchStatus: (matchId: string, status: MutualMatchStatus) => Promise<MutualMatch | null>;
  revokeContactShare: (shareId: string) => Promise<ContactShare | null>;

  // Data fetching
  refreshMutualMatches: () => Promise<void>;
  refreshContactShares: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  refreshInsights: () => Promise<void>;

  // Utility
  clearError: () => void;
}

export const useMutualMatches = (userId?: string): UseMutualMatchesReturn => {
  // State
  const [mutualMatches, setMutualMatches] = useState<MutualMatch[]>([]);
  const [contactShares, setContactShares] = useState<ContactShare[]>([]);
  const [shareRequests, setShareRequests] = useState<ContactShareRequest[]>([]);
  const [stats, setStats] = useState<MutualMatchStats | null>(null);
  const [contactStats, setContactStats] = useState<ContactShareStats | null>(null);
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [insights, setInsights] = useState<MatchInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Create mutual match
  const createMutualMatch = useCallback(async (data: CreateMutualMatchData): Promise<MutualMatch | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const match = await ContactService.createMutualMatch(data);
      
      // Update local state
      setMutualMatches(prev => [match, ...prev]);
      
      // Refresh stats
      await refreshStats();
      
      return match;
    } catch (err: any) {
      setError(err.message || 'Failed to create mutual match');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Share contact
  const shareContact = useCallback(async (data: CreateContactShareData): Promise<ContactShare | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const share = await ContactService.shareContact(userId, data);
      
      // Update local state
      setContactShares(prev => [share, ...prev]);
      
      // Refresh contact stats
      if (userId) {
        const newContactStats = await ContactService.getContactShareStats(userId);
        setContactStats(newContactStats);
      }
      
      return share;
    } catch (err: any) {
      setError(err.message || 'Failed to share contact');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Request contact share
  const requestContactShare = useCallback(async (data: CreateContactShareRequestData): Promise<ContactShareRequest | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const request = await ContactService.createContactShareRequest(userId, data);
      
      // Update local state
      setShareRequests(prev => [request, ...prev]);
      
      return request;
    } catch (err: any) {
      setError(err.message || 'Failed to request contact share');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Respond to share request
  const respondToShareRequest = useCallback(async (
    requestId: string, 
    response: 'approved' | 'declined'
  ): Promise<ContactShareRequest | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatedRequest = await ContactService.respondToContactShareRequest(userId, requestId, response);
      
      // Update local state
      setShareRequests(prev => 
        prev.map(req => req.$id === requestId ? updatedRequest : req)
      );
      
      return updatedRequest;
    } catch (err: any) {
      setError(err.message || 'Failed to respond to share request');
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update match status
  const updateMatchStatus = useCallback(async (
    matchId: string, 
    status: MutualMatchStatus
  ): Promise<MutualMatch | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      const updatedMatch = await ContactService.updateMutualMatchStatus(userId, matchId, status);
      
      // Update local state
      setMutualMatches(prev => 
        prev.map(match => match.$id === matchId ? updatedMatch : match)
      );
      
      return updatedMatch;
    } catch (err: any) {
      setError(err.message || 'Failed to update match status');
      return null;
    }
  }, [userId]);

  // Revoke contact share
  const revokeContactShare = useCallback(async (shareId: string): Promise<ContactShare | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    try {
      const revokedShare = await ContactService.revokeContactShare(userId, shareId);
      
      // Update local state
      setContactShares(prev => 
        prev.map(share => share.$id === shareId ? revokedShare : share)
      );
      
      return revokedShare;
    } catch (err: any) {
      setError(err.message || 'Failed to revoke contact share');
      return null;
    }
  }, [userId]);

  // Refresh mutual matches
  const refreshMutualMatches = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      setLoading(true);
      const matches = await ContactService.getMutualMatches(userId);
      setMutualMatches(matches);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch mutual matches');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refresh contact shares
  const refreshContactShares = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const shares = await ContactService.getSharedContacts(userId);
      setContactShares(shares);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contact shares');
    }
  }, [userId]);

  // Refresh stats
  const refreshStats = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const [matchStats, shareStats] = await Promise.all([
        ContactService.getMutualMatchStats(userId),
        ContactService.getContactShareStats(userId),
      ]);
      setStats(matchStats);
      setContactStats(shareStats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics');
    }
  }, [userId]);

  // Refresh recommendations
  const refreshRecommendations = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const recs = await ContactService.getMatchRecommendations(userId);
      setRecommendations(recs);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendations');
    }
  }, [userId]);

  // Refresh insights
  const refreshInsights = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      const userInsights = await ContactService.getMatchInsights(userId);
      setInsights(userInsights);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch insights');
    }
  }, [userId]);

  // Initial data loading
  useEffect(() => {
    if (userId) {
      Promise.all([
        refreshMutualMatches(),
        refreshContactShares(),
        refreshStats(),
        refreshRecommendations(),
        refreshInsights(),
      ]);
    }
  }, [userId, refreshMutualMatches, refreshContactShares, refreshStats, refreshRecommendations, refreshInsights]);

  return {
    // State
    mutualMatches,
    contactShares,
    shareRequests,
    stats,
    contactStats,
    recommendations,
    insights,
    loading,
    error,

    // Actions
    createMutualMatch,
    shareContact,
    requestContactShare,
    respondToShareRequest,
    updateMatchStatus,
    revokeContactShare,

    // Data fetching
    refreshMutualMatches,
    refreshContactShares,
    refreshStats,
    refreshRecommendations,
    refreshInsights,

    // Utility
    clearError,
  };
};