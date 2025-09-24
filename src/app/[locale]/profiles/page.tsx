'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { ProfileSearchFilters, FilterState } from '@/components/profiles/profile-search-filters';
import { FilteredMatchList } from '@/components/matches/filtered-match-list';
import { useProfileSearch } from '@/hooks/useProfile';
import { useAuth } from '@/components/providers/auth-provider';
import { SearchFilters } from '@/lib/services/profile.service';

export default function ProfilesPage() {
  const { user } = useAuth();
  const { results, loading, searchProfiles, loadMore } = useProfileSearch();
  
  // Initialize comprehensive filter state
  const [filters, setFilters] = useState<FilterState>({
    // Basic Filters
    gender: 'any',
    ageRange: [18, 60],
    district: 'any',
    block: 'any',
    village: '',
    
    // Education & Career
    education: [],
    occupation: [],
    
    // Personal & Religious
    sect: 'any',
    subSect: 'any',
    biradari: 'any',
    familyType: 'any',
    maritalStatus: 'single',
    religiousPractice: [],
    
    // Preferences
    photoVisibility: 'any',
    profileVerified: false,
    
    // Skills & Interests
    skills: [],
    
    // Sorting
    sortBy: 'newest',
    
    // Search query
    searchQuery: ''
  });

  // Convert FilterState to SearchFilters for Appwrite
  const buildSearchFilters = (filterState: FilterState): SearchFilters => {
    const searchFilters: SearchFilters = {
      limit: 20,
      offset: 0
    };

    // Gender filter
    if (filterState.gender !== 'any') {
      searchFilters.gender = filterState.gender;
    }

    // Age range filter
    searchFilters.ageMin = filterState.ageRange[0];
    searchFilters.ageMax = filterState.ageRange[1];

    // District filter
    if (filterState.district !== 'any') {
      searchFilters.district = filterState.district;
    }

    // Education filter
    if (filterState.education.length > 0) {
      searchFilters.educationLevels = filterState.education;
    }

    // Occupation filter
    if (filterState.occupation.length > 0) {
      // Map occupation filter values to actual occupation names
      const occupationMap: Record<string, string> = {
        'student': 'Student',
        'private-job': 'Private Job',
        'government-job': 'Government Job',
        'business': 'Business',
        'homemaker': 'Homemaker',
        'teacher': 'Teacher',
        'religious': 'Religious Scholar'
      };
      
      searchFilters.occupation = filterState.occupation
        .map(occ => occupationMap[occ] || occ)
        .join(',');
    }

    // Sect filter
    if (filterState.sect !== 'any') {
      searchFilters.sect = filterState.sect;
    }

    // Marital status filter
    if (filterState.maritalStatus !== 'any') {
      searchFilters.maritalStatus = filterState.maritalStatus;
    }

    // Verified filter
    if (filterState.profileVerified) {
      searchFilters.isVerified = true;
    }

    // Active profiles only
    searchFilters.isActive = true;

    return searchFilters;
  };

  // Perform search when filters change (debounced)
  useEffect(() => {
    const performSearch = async () => {
      const searchFilters = buildSearchFilters(filters);
      
      // Add search performance tracking
      const startTime = Date.now();
      
      try {
        const result = await searchProfiles(searchFilters);
        
        // Track search performance
        const executionTime = Date.now() - startTime;
        // Note: SearchAnalyticsService.trackSearchPerformance would be called here
        // but we'll skip it to avoid too many analytics calls
        
      } catch (error) {
        console.error('Search failed:', error);
      }
    };

    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Initial search on component mount
  useEffect(() => {
    const initialSearch = async () => {
      const searchFilters = buildSearchFilters(filters);
      await searchProfiles(searchFilters);
    };

    initialSearch();
  }, []);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = async () => {
    const searchFilters = buildSearchFilters(filters);
    await searchProfiles(searchFilters);
  };

  const handleLoadMore = async () => {
    const searchFilters = buildSearchFilters(filters);
    await loadMore(searchFilters);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-3xl">
              <Users className="h-8 w-8 text-primary" />
              Search Profiles
            </CardTitle>
            <CardDescription>
              Find your ideal life partner using our comprehensive search and filtering system. Filter by education, occupation, location, religious practice, and more to discover compatible matches.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search and Filters Section */}
        <ProfileSearchFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
          resultCount={results.total}
        />

        {/* Results Section */}
        {loading && results.profiles.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Searching profiles...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <FilteredMatchList
              profiles={results.profiles}
              filters={filters}
              itemsPerPage={20}
              showLoadMore={results.hasMore}
              onLoadMore={handleLoadMore}
              loadingMore={loading}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
