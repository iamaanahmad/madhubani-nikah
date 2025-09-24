import Image from 'next/image';
import { Link } from 'next-intl/navigation';
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
  EyeOff,
} from 'lucide-react';
import { VerifiedBadge } from '@/components/profile/verified-badge';
import type { Profile } from '@/lib/services/profile.service';
import { SmartMatchExplainer } from './smart-match-explainer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type MatchCardProps = {
  profile: Profile;
  preview?: boolean;
  isLoggedIn?: boolean;
};

export function MatchCard({
  profile,
  preview = false,
  isLoggedIn = false,
}: MatchCardProps) {
  const showPhoto = isLoggedIn && !profile.isPhotoBlurred && profile.profilePictureUrl;
  const profileLink = `/profile/${profile.$id || profile.userId}`;

  const ImageContent = () => (
    <div className="aspect-square w-full bg-muted flex items-center justify-center relative rounded-t-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
      {showPhoto ? (
        <Image
          src={profile.profilePictureUrl!}
          alt={profile.name}
          fill
          className="object-cover"
        />
      ) : (
        <div className="flex flex-col items-center text-muted-foreground text-center p-2">
          <EyeOff className="h-10 w-10" />
          <span className="text-xs mt-2">
            {isLoggedIn ? 'Photo is private' : 'Login to view photo'}
          </span>
        </div>
      )}
    </div>
  );

  const cardContent = (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl h-full group">
      <CardHeader className="relative p-0">
        <div className="block aspect-square w-full overflow-hidden rounded-t-lg">
          {preview ? (
              <div className="block aspect-square w-full">
                <ImageContent />
              </div>
          ) : (
              <Link href={profileLink} className="block aspect-square w-full">
                <ImageContent />
              </Link>
          )}
        </div>
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4 text-white">
           <CardTitle className="flex items-center gap-2 font-headline text-2xl">
            {preview ? (
              <span>
                {profile.name}, {profile.age}
              </span>
            ) : (
              <Link href={profileLink} className="hover:underline">
                <span>
                  {profile.name}, {profile.age}
                </span>
              </Link>
            )}
            {profile.isVerified && <VerifiedBadge />}
          </CardTitle>
        </div>
        {!preview && isLoggedIn && (
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
                <SmartMatchExplainer profile={profile} />
                <DropdownMenuItem>
                  <ShieldAlert className="mr-2" /> Report
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Slash className="mr-2" /> Block
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>From {profile.village || profile.block}, {profile.district}</span>
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
      {!preview && isLoggedIn && (
        <CardFooter className="flex gap-2 bg-muted/50 p-4 border-t">
          <Button className="w-full">
            <Heart className="mr-2" /> Propose
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href={profileLink}>View Profile</Link>
          </Button>
        </CardFooter>
      )}
      {!isLoggedIn && !preview && (
         <CardFooter className="flex bg-muted/50 p-4 border-t">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">View Profile</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Create a free account to view details</AlertDialogTitle>
                    <AlertDialogDescription>
                        To protect our members' privacy, you need to create an account to
                        view full profiles and photos. It's completely free.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Link href="/login">Login or Sign Up</Link>
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
         </CardFooter>
      )}
    </Card>
  );

  if (preview) {
     return (
       <Link href={isLoggedIn ? profileLink : '/login'} className="block h-full">
         {cardContent}
       </Link>
     )
  }

  return cardContent;
}
