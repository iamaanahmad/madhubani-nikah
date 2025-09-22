'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { mockMatches } from '@/lib/data';
import { MatchCard } from '../matches/match-card';

export function NewProfilesCarousel() {
  const newMatches = mockMatches.slice(0, 8);
  // TODO: Replace with real auth state from a context
  const isLoggedIn = true;
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
            key={match.id}
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
