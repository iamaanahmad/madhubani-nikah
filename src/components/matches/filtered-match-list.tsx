'use client';

import { useMemo, useState } from 'react';
import { MatchCard } from './match-card';
import { Profile } from '@/lib/services/profile.service';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { FilterState } from '@/components/profiles/profile-search-filters';
import { Loader2 } from 'lucide-react';

type FilteredMatchListProps = {
  profiles: Profile[];
  filters: FilterState;
  itemsPerPage?: number;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
};

export function FilteredMatchList({ 
  profiles, 
  filters, 
  itemsPerPage = 12, 
  showLoadMore = false, 
  onLoadMore, 
  loadingMore = false 
}: FilteredMatchListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Since filtering is now done server-side, we just need to handle client-side search query
  const filteredProfiles = useMemo(() => {
    if (!filters.searchQuery) {
      return profiles;
    }

    const query = filters.searchQuery.toLowerCase();
    return profiles.filter((profile) => {
      const searchableText = [
        profile.name,
        profile.bio,
        profile.village,
        profile.occupation,
        profile.education
      ].join(' ').toLowerCase();
      
      return searchableText.includes(query);
    });
  }, [profiles, filters.searchQuery]);

  // For server-side pagination, we show all profiles and use load more
  const displayProfiles = showLoadMore ? filteredProfiles : filteredProfiles.slice(0, itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (filteredProfiles.length === 0) {
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
            {filteredProfiles.length} Profile{filteredProfiles.length !== 1 ? 's' : ''} Found
          </h2>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayProfiles.map((profile) => (
          <MatchCard key={profile.$id || profile.userId} profile={profile} isLoggedIn={true} />
        ))}
      </div>

      {/* Load More Button */}
      {showLoadMore && onLoadMore && (
        <div className="flex justify-center pt-8">
          <Button 
            onClick={onLoadMore} 
            disabled={loadingMore}
            variant="outline"
            size="lg"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more profiles...
              </>
            ) : (
              'Load More Profiles'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}