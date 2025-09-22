import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Handshake, CircleCheckBig, Users, Sparkles, Video } from 'lucide-react';
import { IslamicContentCard } from '@/components/shared/islamic-content-card';
import { NikahSimplifiedCard } from '@/components/shared/nikah-simplified-card';
import MainLayout from '@/components/layout/main-layout';
import { AppTour } from '@/components/shared/app-tour';
import { useTranslations } from 'next-intl';
import { DonationCard } from '@/components/shared/donation-card';
import { NewProfilesCarousel } from '@/components/shared/new-profiles-carousel';
import { GuidanceVideosCarousel } from '@/components/shared/guidance-videos-carousel';

export default function Home() {
  const t = useTranslations('HomePage');

  return (
    <MainLayout>
      <AppTour />
      <div className="flex flex-col">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] md:h-[70vh] text-white">
          <Image
            src="/nikahbg.png"
            alt="Couple holding hands"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center p-4">
            <h1 className="font-headline text-4xl md:text-6xl font-bold">
              {t('heroTitle')}
            </h1>
            <p className="font-body text-lg md:text-xl mt-4 max-w-2xl">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild id="create-profile-button">
                <Link href="/register">{t('createProfile')}</Link>
              </Button>
              <Button size="lg" variant="secondary" className="bg-secondary/90 text-secondary-foreground hover:bg-secondary/100 md:bg-white/90 md:hover:bg-white" asChild id="browse-profiles-button">
                 <Link href="/profiles">{t('browseProfiles')}</Link>
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
                <h3 className="text-2xl font-bold mt-4">{t('stat1_title')}</h3>
                <p className="text-muted-foreground mt-2">{t('stat1_subtitle')}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80">
              <CardContent className="p-6">
                <CircleCheckBig className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-2xl font-bold mt-4">{t('stat2_title')}</h3>
                <p className="text-muted-foreground mt-2">{t('stat2_subtitle')}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/80">
              <CardContent className="p-6">
                <Users className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-2xl font-bold mt-4">{t('stat3_title')}</h3>
                <p className="text-muted-foreground mt-2">{t('stat3_subtitle')}</p>
              </CardContent>
            </Card>
          </section>

          {/* Islamic Content */}
          <IslamicContentCard />
          
          <Separator />

          {/* Nikah Simplified Section */}
          <NikahSimplifiedCard />

          <Separator />

          {/* Newly Listed Profiles */}
          <section id="nearby-profiles-section">
            <div className="text-center">
               <h2 className="font-headline text-3xl md:text-4xl font-semibold flex items-center justify-center gap-2">
                <Sparkles className="h-8 w-8 text-accent" />
                {t('newProfiles')}
              </h2>
              <p className="text-muted-foreground mt-2">
                {t('newProfilesSubtitle')}
              </p>
            </div>
            <div className="mt-8">
              <NewProfilesCarousel />
            </div>
            <div className="text-center mt-8">
              <Button asChild>
                  <Link href="/profiles">{t('seeAllProfiles')}</Link>
              </Button>
            </div>
          </section>

          <Separator />

           {/* Video Guidance Section */}
          <section>
            <div className="text-center">
              <h2 className="font-headline text-3xl md:text-4xl font-semibold flex items-center justify-center gap-2">
                <Video className="h-8 w-8 text-primary" />
                {t('videoGuidanceTitle')}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                {t('videoGuidanceSubtitle')}
              </p>
            </div>
            <div className="mt-8">
              <GuidanceVideosCarousel />
            </div>
          </section>

          <Separator />

          {/* Donation Section */}
          <DonationCard />

        </div>
      </div>
    </MainLayout>
  );
}
