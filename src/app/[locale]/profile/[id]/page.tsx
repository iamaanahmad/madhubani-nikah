import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookText,
  Briefcase,
  Heart,
  Home,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  Tag,
  User,
  Users,
} from 'lucide-react';
import { mockMatches, currentUser } from '@/lib/data';
import { VerifiedBadge } from '@/components/profile/verified-badge';
import MainLayout from '@/components/layout/main-layout';
import { Separator } from '@/components/ui/separator';
import { EyeOff } from 'lucide-react';

export default function ProfilePage({ params }: { params: { id: string } }) {
  const profile = [...mockMatches, currentUser].find(
    (p) => p.id === `user-${params.id}`
  );

  if (!profile) {
    return (
      <MainLayout>
        <div className="container mx-auto p-8 text-center">
          Profile not found.
        </div>
      </MainLayout>
    );
  }

  // A logged-in user can see their own photo even if blurred
  const isLoggedInUser = profile.id === currentUser.id;
  const showPhoto = !profile.isPhotoBlurred || isLoggedInUser;

  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Profile Picture & Actions */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="p-0">
                <div className="aspect-square w-full relative bg-muted rounded-t-lg">
                  {showPhoto ? (
                    <Image
                      src={profile.profilePicture.url}
                      alt={profile.name}
                      fill
                      className="object-cover rounded-t-lg"
                      data-ai-hint={profile.profilePicture.hint}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <EyeOff className="h-16 w-16" />
                        <p className="mt-2 text-sm">Photo is private</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="flex items-center gap-2 font-headline text-3xl">
                  <span>
                    {profile.name}, {profile.age}
                  </span>
                  {profile.isVerified && <VerifiedBadge />}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" /> {profile.village}
                </CardDescription>
                 <CardDescription className="flex items-center gap-2 mt-1 capitalize">
                  <Users className="h-4 w-4" /> {profile.gender}
                </CardDescription>
              </CardContent>
              <CardContent className="flex gap-2 p-4 pt-0">
                 <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Heart className="mr-2" /> Propose
                </Button>
                <Button variant="outline">
                    <MessageSquare />
                </Button>
                <Button variant="outline">
                    <Phone />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2 space-y-6">
             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <User className="h-6 w-6 text-primary" />
                  About Me
                </CardTitle>
              </CardHeader>
              <CardContent className="font-body text-base">
                <p>{profile.bio}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                 <CardTitle className="flex items-center gap-2 font-headline">
                  <BookText className="h-6 w-6 text-primary" />
                  Education & Occupation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Education</h4>
                  <p className="text-muted-foreground">{profile.education}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Occupation</h4>
                  <p className="text-muted-foreground">{profile.occupation}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
               <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Shield className="h-6 w-6 text-primary" />
                    Religious & Family Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Religious Practice</h4>
                  <p className="text-muted-foreground">{profile.religiousPractice}</p>
                </div>
                 <div>
                  <h4 className="font-semibold">Sect</h4>
                  <p className="text-muted-foreground">{profile.sect}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Family Background</h4>
                  <p className="text-muted-foreground">{profile.familyBackground}</p>
                </div>
              </CardContent>
            </Card>
            
            {profile.skills && profile.skills.length > 0 && (
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                    <Tag className="h-6 w-6 text-primary" />
                    Skills
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
