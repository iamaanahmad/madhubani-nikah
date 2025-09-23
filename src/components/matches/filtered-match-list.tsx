'use client';

import { useMemo, useState } from 'react';
import { MatchCard } from './match-card';
import { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { FilterState } from '@/components/profiles/profile-search-filters';

type FilteredMatchListProps = {
  profiles: UserProfile[];
  filters: FilterState;
  itemsPerPage?: number;
};

export function FilteredMatchList({ profiles, filters, itemsPerPage = 12 }: FilteredMatchListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSortedProfiles = useMemo(() => {
    let filtered = profiles.filter((profile) => {
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

      // Block filter
      if (filters.block && filters.block !== 'any') {
        const profileBlock = profile.block || '';
        if (profileBlock !== filters.block) {
          return false;
        }
      }

      // Village filter
      if (filters.village) {
        const profileVillage = profile.village || '';
        if (!profileVillage.toLowerCase().includes(filters.village.toLowerCase())) {
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
              return profileEducation.includes('matric') || profileEducation.includes('10th') || profileEducation.includes('ssc');
            case 'intermediate':
              return profileEducation.includes('intermediate') || profileEducation.includes('12th') || profileEducation.includes('higher secondary');
            case 'graduate':
              return profileEducation.includes('graduate') || profileEducation.includes('bachelor') || profileEducation.includes('b.a') || profileEducation.includes('b.sc') || profileEducation.includes('b.com');
            case 'postgraduate':
              return profileEducation.includes('postgraduate') || profileEducation.includes('master') || profileEducation.includes('m.a') || profileEducation.includes('m.sc') || profileEducation.includes('m.com') || profileEducation.includes('mba');
            case 'religious':
              return profileEducation.includes('madrasa') || profileEducation.includes('islamic') || profileEducation.includes('religious');
            case 'hafiz':
              return profileEducation.includes('hafiz') || profileEducation.includes('hafiza') || profileEducation.includes('quran');
            case 'alim':
              return profileEducation.includes('alim') || profileEducation.includes('alima') || profileEducation.includes('scholar');
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
              return profileOccupation.includes('student') || profileOccupation.includes('studying');
            case 'private-job':
              return profileOccupation.includes('private') || profileOccupation.includes('company') || profileOccupation.includes('corporate');
            case 'government-job':
              return profileOccupation.includes('government') || profileOccupation.includes('govt') || profileOccupation.includes('public sector') || profileOccupation.includes('civil service');
            case 'business':
              return profileOccupation.includes('business') || profileOccupation.includes('entrepreneur') || profileOccupation.includes('self-employed') || profileOccupation.includes('shop');
            case 'homemaker':
              return profileOccupation.includes('homemaker') || profileOccupation.includes('housewife') || profileOccupation.includes('home');
            case 'teacher':
              return profileOccupation.includes('teacher') || profileOccupation.includes('educator') || profileOccupation.includes('instructor') || profileOccupation.includes('professor');
            case 'religious':
              return profileOccupation.includes('imam') || profileOccupation.includes('maulana') || profileOccupation.includes('religious') || profileOccupation.includes('madrasa');
            default:
              return profileOccupation.includes(occ);
          }
        });
        if (!occupationMatch) return false;
      }

      // Sect filter
      if (filters.sect !== 'any') {
        const profileSect = profile.sect?.toLowerCase() || '';
        if (!profileSect.includes(filters.sect)) {
          return false;
        }
      }

      // Sub-sect filter
      if (filters.subSect !== 'any') {
        const profileSubSect = profile.subSect?.toLowerCase() || '';
        if (profileSubSect !== filters.subSect) {
          return false;
        }
      }

      // Biradari filter
      if (filters.biradari !== 'any') {
        const profileBiradari = profile.biradari?.toLowerCase() || '';
        if (profileBiradari !== filters.biradari) {
          return false;
        }
      }

      // Family Type filter
      if (filters.familyType !== 'any') {
        const profileFamilyType = profile.familyType?.toLowerCase() || '';
        if (!profileFamilyType.includes(filters.familyType)) {
          return false;
        }
      }

      // Marital Status filter
      if (filters.maritalStatus !== 'single') {
        const profileMaritalStatus = profile.maritalStatus?.toLowerCase() || 'single';
        if (profileMaritalStatus !== filters.maritalStatus) {
          return false;
        }
      }

      // Religious Practice filter
      if (filters.religiousPractice.length > 0) {
        const profileReligiousPractice = profile.religiousPractice?.toLowerCase() || '';
        const practiceMatch = filters.religiousPractice.some(practice => {
          switch (practice) {
            case 'daily-prayer':
              return profileReligiousPractice.includes('daily') || profileReligiousPractice.includes('namaz') || profileReligiousPractice.includes('prayer');
            case 'hafiz':
              return profileReligiousPractice.includes('hafiz') || profileReligiousPractice.includes('hafiza') || profileReligiousPractice.includes('memorized');
            case 'islamic-studies':
              return profileReligiousPractice.includes('islamic studies') || profileReligiousPractice.includes('religious education');
            case 'hijab':
              return profileReligiousPractice.includes('hijab') || profileReligiousPractice.includes('modest dress');
            default:
              return profileReligiousPractice.includes(practice);
          }
        });
        if (!practiceMatch) return false;
      }

      // Photo Visibility filter
      if (filters.photoVisibility !== 'any') {
        const hasPhoto = profile.profilePicture && profile.profilePicture.url;
        const isBlurred = profile.isPhotoBlurred || false;
        
        switch (filters.photoVisibility) {
          case 'available':
            if (!hasPhoto || isBlurred) return false;
            break;
          case 'blurred':
            if (!hasPhoto || !isBlurred) return false;
            break;
          case 'none':
            if (hasPhoto) return false;
            break;
        }
      }

      // Profile Verified filter
      if (filters.profileVerified && !profile.isVerified) {
        return false;
      }

      // Skills filter
      if (filters.skills.length > 0) {
        const profileSkills = profile.skills?.map(s => s.toLowerCase()) || [];
        const skillsMatch = filters.skills.some(skill => 
          profileSkills.some(ps => ps.includes(skill) || skill.includes(ps))
        );
        if (!skillsMatch) return false;
      }

      return true;
    });

    // Sort the filtered profiles
    return filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'age-asc':
          return a.age - b.age;
        case 'age-desc':
          return b.age - a.age;
        case 'location':
          return (a.village || '').localeCompare(b.village || '');
        case 'verified':
          if (a.isVerified && !b.isVerified) return -1;
          if (!a.isVerified && b.isVerified) return 1;
          return 0;
        case 'education':
          const educationOrder = ['postgraduate', 'graduate', 'intermediate', 'matric', 'no-formal'];
          const aEducation = a.education?.toLowerCase() || '';
          const bEducation = b.education?.toLowerCase() || '';
          const aIndex = educationOrder.findIndex(edu => aEducation.includes(edu));
          const bIndex = educationOrder.findIndex(edu => bEducation.includes(edu));
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
  }, [profiles, filters]);

  const totalPages = Math.ceil(filteredAndSortedProfiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProfiles = filteredAndSortedProfiles.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (filteredAndSortedProfiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No profiles found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search criteria to find more profiles.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reset Filters
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-lg font-semibold">
            {filteredAndSortedProfiles.length} Profile{filteredAndSortedProfiles.length !== 1 ? 's' : ''} Found
          </h2>
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedProfiles.map((profile) => (
          <MatchCard key={profile.id} profile={profile} isLoggedIn={true} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNumber}>
                    <Button
                      variant={currentPage === pageNumber ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </Button>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}