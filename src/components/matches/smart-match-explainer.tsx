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
import { ProfileService, type Profile } from '@/lib/services/profile.service';
import { useAuth } from '@/components/providers/auth-provider';

interface SmartMatchExplainerProps {
  profile: Profile;
}

export function SmartMatchExplainer({
  profile,
}: SmartMatchExplainerProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [explanation, setExplanation] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && !explanation && user) {
      setIsLoading(true);
      setError('');
      try {
        // Get current user's profile
        const currentUserProfile = await ProfileService.getProfile(user.$id);
        if (!currentUserProfile) {
          setError('Could not load your profile. Please try again.');
          return;
        }

        // Stringify profiles for the AI prompt
        const userProfileStr = JSON.stringify(currentUserProfile, null, 2);
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
            Here&apos;s why {profile.name} could be a good match for you.
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
