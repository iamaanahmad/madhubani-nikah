'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { ProfileSearchFilters, FilterState } from '@/components/profiles/profile-search-filters';
import { FilteredMatchList } from '@/components/matches/filtered-match-list';
import { mockMatches } from '@/lib/data';

export default function ProfilesPage() {
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

  // Calculate filtered result count
  const resultCount = useMemo(() => {
    // Apply filters to get accurate count
    let filtered = mockMatches.filter((profile) => {
      // Search Query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          profile.name,
          profile.bio,
          profile.village,
          profile.occupation,
          profile.education
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      // Gender filter
      if (filters.gender !== 'any' && profile.gender !== filters.gender) {
        return false;
      }

      // Age range filter
      if (profile.age < filters.ageRange[0] || profile.age > filters.ageRange[1]) {
        return false;
      }

      // District filter
      if (filters.district && filters.district !== 'any') {
        const location = profile.village || '';
        if (!location.toLowerCase().includes(filters.district.toLowerCase())) {
          return false;
        }
      }

      // Village filter
      if (filters.village) {
        const location = profile.village || '';
        if (!location.toLowerCase().includes(filters.village.toLowerCase())) {
          return false;
        }
      }

      // Education filter
      if (filters.education.length > 0) {
        const profileEducation = profile.education?.toLowerCase() || '';
        const educationMatch = filters.education.some(edu => {
          switch (edu) {
            case 'no-formal':
              return profileEducation.includes('no formal') || profileEducation.includes('none');
            case 'matric':
              return profileEducation.includes('matric') || profileEducation.includes('10th');
            case 'intermediate':
              return profileEducation.includes('intermediate') || profileEducation.includes('12th');
            case 'graduate':
              return profileEducation.includes('graduate') || profileEducation.includes('bachelor');
            case 'postgraduate':
              return profileEducation.includes('postgraduate') || profileEducation.includes('master');
            case 'religious':
              return profileEducation.includes('madrasa') || profileEducation.includes('islamic');
            case 'hafiz':
              return profileEducation.includes('hafiz') || profileEducation.includes('hafiza');
            case 'alim':
              return profileEducation.includes('alim') || profileEducation.includes('alima');
            default:
              return profileEducation.includes(edu);
          }
        });
        if (!educationMatch) return false;
      }

      // Occupation filter
      if (filters.occupation.length > 0) {
        const profileOccupation = profile.occupation?.toLowerCase() || '';
        const occupationMatch = filters.occupation.some(occ => {
          switch (occ) {
            case 'student':
              return profileOccupation.includes('student');
            case 'private-job':
              return profileOccupation.includes('private') || profileOccupation.includes('company');
            case 'government-job':
              return profileOccupation.includes('government') || profileOccupation.includes('govt');
            case 'business':
              return profileOccupation.includes('business') || profileOccupation.includes('entrepreneur');
            case 'homemaker':
              return profileOccupation.includes('homemaker') || profileOccupation.includes('housewife');
            case 'teacher':
              return profileOccupation.includes('teacher') || profileOccupation.includes('educator');
            case 'religious':
              return profileOccupation.includes('imam') || profileOccupation.includes('maulana');
            default:
              return profileOccupation.includes(occ);
          }
        });
        if (!occupationMatch) return false;
      }

      // Profile verified filter
      if (filters.profileVerified && !profile.isVerified) {
        return false;
      }

      return true;
    });

    return filtered.length;
  }, [filters]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    // Filters are applied in real-time, so this is mainly for UI feedback
    console.log('Filters applied:', filters);
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
          resultCount={resultCount}
        />

        {/* Results Section */}
        <FilteredMatchList
          profiles={mockMatches}
          filters={filters}
          itemsPerPage={16}
        />
      </div>
    </MainLayout>
  );
}
