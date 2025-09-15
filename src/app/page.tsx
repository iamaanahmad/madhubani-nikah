import { IslamicContentCard } from '@/components/shared/islamic-content-card';
import { MatchList } from '@/components/matches/match-list';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">
          Welcome, Guardian
        </h1>
        <p className="text-muted-foreground mt-2">
          Here are today&apos;s potential matches for your review.
        </p>
      </div>

      <IslamicContentCard />

      <Separator />

      <div>
        <h2 className="font-headline text-2xl md:text-3xl font-semibold">
          Suggested Profiles
        </h2>
        <p className="text-muted-foreground mt-1">
          Based on your preferences, we&apos;ve found these potential matches.
        </p>
      </div>
      <MatchList />
    </div>
  );
}
