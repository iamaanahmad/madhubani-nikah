'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Loader2, Sparkles } from 'lucide-react';
import { explainMatch } from '@/ai/flows/smart-match-explanation';
import { currentUser } from '@/lib/data';
import type { UserProfile } from '@/lib/types';

interface SmartMatchExplainerProps {
  profile: UserProfile;
}

export function SmartMatchExplainer({
  profile,
}: SmartMatchExplainerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [explanation, setExplanation] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && !explanation) {
      setIsLoading(true);
      setError('');
      try {
        // Stringify profiles for the AI prompt
        const userProfileStr = JSON.stringify(currentUser, null, 2);
        const matchProfileStr = JSON.stringify(profile, null, 2);

        const result = await explainMatch({
          userProfile: userProfileStr,
          matchProfile: matchProfileStr,
        });
        setExplanation(result.explanation);
      } catch (e) {
        setError('Could not generate explanation. Please try again later.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
      >
        <Sparkles className="mr-2" /> Why this match?
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
            <Sparkles className="text-accent" />
            Smart Match Analysis
          </DialogTitle>
          <DialogDescription>
            Here&apos;s why {profile.name} could be a good match for your
            ward.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyzing profiles...</span>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {explanation && (
            <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted/50 p-4 whitespace-pre-wrap font-body">
              {explanation}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
