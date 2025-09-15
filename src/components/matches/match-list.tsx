import { mockMatches } from '@/lib/data';
import { MatchCard } from './match-card';

export function MatchList() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {mockMatches.map((match) => (
        <MatchCard key={match.id} profile={match} />
      ))}
    </div>
  );
}
