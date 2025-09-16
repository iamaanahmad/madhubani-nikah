import { mockMatches } from '@/lib/data';
import { MatchCard } from './match-card';

type MatchListProps = {
  preview?: boolean;
};

export function MatchList({ preview = false }: MatchListProps) {
  const matchesToShow = preview ? mockMatches.slice(0, 4) : mockMatches;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {matchesToShow.map((match) => (
        <MatchCard key={match.id} profile={match} preview={preview} />
      ))}
    </div>
  );
}
