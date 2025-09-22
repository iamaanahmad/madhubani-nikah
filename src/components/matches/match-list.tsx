import { mockMatches } from '@/lib/data';
import { MatchCard } from './match-card';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

type MatchListProps = {
  preview?: boolean;
};

export function MatchList({ preview = false }: MatchListProps) {
  // In a real app, you'd fetch this and get the loggedIn state from auth
  const isLoggedIn = false;
  const matchesToShow = preview ? mockMatches.slice(0, 4) : mockMatches;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {matchesToShow.map((match) => (
          <MatchCard key={match.id} profile={match} preview={preview} isLoggedIn={isLoggedIn} />
        ))}
      </div>
      {!preview && (
         <Pagination className="mt-8">
            <PaginationContent>
                <PaginationItem>
                <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                <PaginationLink href="#" isActive>
                    2
                </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                <PaginationNext href="#" />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
