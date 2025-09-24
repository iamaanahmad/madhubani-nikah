'use client';
import * as React from 'react';
import { MatchCard } from './match-card';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ProfileService, type Profile } from '@/lib/services/profile.service';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader2 } from 'lucide-react';

type MatchListProps = {
  preview?: boolean;
};

export function MatchList({ preview = false }: MatchListProps) {
  const { user, isAuthenticated } = useAuth();
  const [matches, setMatches] = React.useState<Profile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const pageSize = preview ? 4 : 10;

  React.useEffect(() => {
    const loadMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!isAuthenticated || !user) {
          // For non-authenticated users, show limited public profiles
          const publicProfiles = await ProfileService.getPublicProfiles({
            limit: pageSize,
            offset: (currentPage - 1) * pageSize
          });
          setMatches(publicProfiles.profiles);
          setTotalPages(Math.ceil(publicProfiles.total / pageSize));
        } else {
          // For authenticated users, get recommended matches
          const userProfile = await ProfileService.getProfile(user.$id);
          if (userProfile) {
            const recommendedMatches = await ProfileService.getRecommendedMatches(user.$id, {
              limit: pageSize,
              offset: (currentPage - 1) * pageSize
            });
            setMatches(recommendedMatches.profiles);
            setTotalPages(Math.ceil(recommendedMatches.total / pageSize));
          }
        }
      } catch (err) {
        console.error('Failed to load matches:', err);
        setError('Failed to load matches');
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [isAuthenticated, user, currentPage, pageSize, preview]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading matches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No matches found</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {matches.map((match) => (
          <MatchCard key={match.userId} profile={match} preview={preview} isLoggedIn={isAuthenticated} />
        ))}
      </div>
      {!preview && totalPages > 1 && (
         <Pagination className="mt-8">
            <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink 
                        href="#" 
                        isActive={currentPage === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
