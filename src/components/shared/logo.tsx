import { HandHeart } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="p-2 bg-primary rounded-md group-hover:bg-primary/90 transition-colors">
        <HandHeart className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <h1 className="font-headline text-lg font-bold tracking-tight text-foreground">
          Madhubani Nikah
        </h1>
      </div>
    </Link>
  );
}
