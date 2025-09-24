'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { MatchCard } from '../matches/match-card';
import { useProfileSearch } from '@/hooks/useProfile';
import { useAuth } from '@/components/providers/auth-provider';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function NewProfilesCarousel() {
  const { user } = useAuth();
  const { results, loading, searchProfiles } = useProfileSearch();
  
  useEffect(() => {
    // Fetch recent profiles
    searchProfiles({
      limit: 8,
      isActive: true
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading new profiles...</span>
        </div>
      </div>
    );
  }

  const newMatches = results.profiles.slice(0, 8);
  const isLoggedIn = !!user;
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-2">
        {newMatches.map((match) => (
          <CarouselItem
            key={match.$id || match.userId}
            className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-2"
          >
            <div className="p-1">
              <MatchCard
                profile={match}
                preview={true}
                isLoggedIn={isLoggedIn}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden md:flex" />
      <CarouselNext className="hidden md:flex" />
    </Carousel>
  );
}
