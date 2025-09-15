import { Moon } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Moon className="h-6 w-6 text-primary" />
      <h1 className="font-headline text-xl font-bold tracking-tight text-foreground">
        Madhubani Nikah
      </h1>
    </div>
  );
}
