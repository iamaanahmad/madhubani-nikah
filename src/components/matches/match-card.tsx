import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookText,
  Briefcase,
  Heart,
  MapPin,
  MoreVertical,
  ShieldAlert,
  Slash,
  Sparkles,
} from 'lucide-react';
import { VerifiedBadge } from '@/components/profile/verified-badge';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SmartMatchExplainer } from './smart-match-explainer';

type MatchCardProps = {
  profile: UserProfile;
};

export function MatchCard({ profile }: MatchCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="relative p-0">
        <Image
          src={profile.profilePicture.url}
          alt={profile.name}
          width={400}
          height={400}
          data-ai-hint={profile.profilePicture.hint}
          className={cn(
            'aspect-square w-full object-cover',
            profile.isPhotoBlurred && 'blur-lg'
          )}
        />
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
          <CardTitle className="flex items-center gap-2 font-headline text-2xl text-white">
            <span>
              {profile.name}, {profile.age}
            </span>
            {profile.isVerified && <VerifiedBadge />}
          </CardTitle>
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <SmartMatchExplainer matchProfile={profile}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Sparkles className="mr-2" /> Why this match?
                </DropdownMenuItem>
              </SmartMatchExplainer>
              <DropdownMenuItem>
                <ShieldAlert className="mr-2" /> Report
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Slash className="mr-2" /> Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>From {profile.village}</span>
          </div>
          <div className="flex items-start gap-2">
            <BookText className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{profile.education}</span>
          </div>
          <div className="flex items-start gap-2">
            <Briefcase className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{profile.occupation}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 bg-muted/50 p-4">
        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <Heart className="mr-2" /> Propose
        </Button>
        <Button variant="outline" className="w-full">
          View Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
