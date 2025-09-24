'use client';

import { useState, useEffect } from 'react';
import { ProfileService, Profile, CreateProfileData, SearchFilters, SearchResult } from '@/lib/services/profile.service';
import { useAuth } from './useAuth';

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (targetUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const profileData = await ProfileService.getProfile(targetUserId);
      setProfile(profileData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
  }, [userId]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) throw new Error('User ID is required');
    
    setLoading(true);
    setError(null);
    try {
      const updatedProfile = await ProfileService.updateProfile(userId, updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!userId) throw new Error('User ID is required');
    
    setLoading(true);
    setError(null);
    try {
      const fileId = await ProfileService.uploadProfilePicture(userId, file);
      // Refresh profile to get updated picture URL
      await fetchProfile(userId);
      return fileId;
    } catch (err: any) {
      setError(err.message || 'Failed to upload profile picture');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProfilePicture = async () => {
    if (!userId) throw new Error('User ID is required');
    
    setLoading(true);
    setError(null);
    try {
      await ProfileService.deleteProfilePicture(userId);
      // Refresh profile to reflect changes
      await fetchProfile(userId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile picture');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture,
    refetch: () => userId ? fetchProfile(userId) : Promise.resolve()
  };
}

export function useProfileSearch() {
  const [results, setResults] = useState<SearchResult>({ profiles: [], total: 0, hasMore: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProfiles = async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      const searchResults = await ProfileService.searchProfiles(filters);
      setResults(searchResults);
      return searchResults;
    } catch (err: any) {
      console.error('Profile search error:', err);
      setError(err.message || 'Failed to search profiles');
      // Set empty results instead of throwing
      setResults({ profiles: [], total: 0, hasMore: false });
      return { profiles: [], total: 0, hasMore: false };
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async (filters: SearchFilters) => {
    if (!results.hasMore || loading) return;

    setLoading(true);
    setError(null);
    try {
      const moreFilters = {
        ...filters,
        offset: results.profiles.length
      };
      const moreResults = await ProfileService.searchProfiles(moreFilters);
      
      setResults(prev => ({
        profiles: [...prev.profiles, ...moreResults.profiles],
        total: moreResults.total,
        hasMore: moreResults.hasMore
      }));
      
      return moreResults;
    } catch (err: any) {
      setError(err.message || 'Failed to load more profiles');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    error,
    searchProfiles,
    loadMore,
    clearResults: () => setResults({ profiles: [], total: 0, hasMore: false })
  };
}

export function useProfileCreation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProfile = async (userId: string, data: CreateProfileData) => {
    setLoading(true);
    setError(null);
    try {
      const profile = await ProfileService.createProfile(userId, data);
      return profile;
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProfile,
    loading,
    error
  };
}

export function useRecommendedMatches(userId?: string) {
  const [matches, setMatches] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendedMatches = async (targetUserId: string, limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const recommendedMatches = await ProfileService.getRecommendedMatches(targetUserId, limit);
      setMatches(recommendedMatches);
      return recommendedMatches;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommended matches');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchRecommendedMatches(userId);
    }
  }, [userId]);

  return {
    matches,
    loading,
    error,
    refetch: () => userId ? fetchRecommendedMatches(userId) : Promise.resolve([])
  };
}