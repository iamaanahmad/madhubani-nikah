import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MatchList } from '@/components/matches/match-list';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Handshake, CircleCheckBig, Users } from 'lucide-react';
import { IslamicContentCard } from '@/components/shared/islamic-content-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/shared/logo';
import MainLayout from '@/components/layout/main-layout';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

  return (
    <MainLayout>
      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] md:h-[70vh] text-white">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt="Couple holding hands"
              fill
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-4">
            <h1 className="font-headline text-4xl md:text-6xl font-bold">
              Find Your Life Partner - The Islamic Way
            </h1>
            <p className="font-body text-lg md:text-xl mt-4 max-w-2xl">
              A FREE platform for the Muslim community of Madhubani. With a focus on privacy and Islamic values.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/register">Create Profile</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 hover:text-white" asChild>
                 <Link href="/browse">Browse Profiles</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="container mx-auto p-4 md:p-8 space-y-12">
          {/* Trust Statistics */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <Card className="bg-card/80">
              <CardContent className="p-6">
                <Handshake className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-2xl font-bold mt-4">500+ Successful Nikahs</h3>
                <p className="text-muted-foreground mt-2">In the Madhubani region.</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80">
              <CardContent className="p-6">
                <CircleCheckBig className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-2xl font-bold mt-4">100% Free Service</h3>
                <p className="text-muted-foreground mt-2">No hidden fees, ever.</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80">
              <CardContent className="p-6">
                <Users className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-2xl font-bold mt-4">Total Privacy Protection</h3>
                <p className="text-muted-foreground mt-2">Your data is safe with us.</p>
              </CardContent>
            </Card>
          </section>

          {/* Islamic Content */}
          <IslamicContentCard />

          <Separator />

          {/* Nearby Profiles */}
          <section>
            <div className="text-center">
              <h2 className="font-headline text-3xl md:text-4xl font-semibold">
                Nearby Profiles
              </h2>
              <p className="text-muted-foreground mt-2">
                Get a glimpse of profiles from your area.
              </p>
            </div>
            <div className="mt-8">
              <MatchList preview={true} />
            </div>
            <div className="text-center mt-8">
              <Button variant="link" asChild>
                  <Link href="/browse">Register to see all profiles</Link>
              </Button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="bg-muted text-muted-foreground p-8 mt-12">
          <div className="container mx-auto text-center">
            <Logo />
            <p className="mt-4 text-sm">Halal Rishte, Bharosemand Platform</p>
            <p className="text-xs">Trusted Islamic Matrimony for Madhubani</p>
            <div className="flex justify-center gap-4 mt-4">
              <Link href="/about" className="text-sm hover:text-primary">About Us</Link>
              <Link href="/help" className="text-sm hover:text-primary">Contact</Link>
              <Link href="/privacy" className="text-sm hover:text-primary">Privacy Policy</Link>
            </div>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
}
