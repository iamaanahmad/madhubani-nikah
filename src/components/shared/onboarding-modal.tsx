'use client';
import * as React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, CheckCircle } from 'lucide-react';

const onboardingSlides = [
  {
    image: PlaceHolderImages.find((img) => img.id === 'onboarding1'),
    title: 'Create Your Profile with Ease',
    description: 'Our guided steps help you build a complete profile that truly represents you.',
  },
  {
    image: PlaceHolderImages.find((img) => img.id === 'onboarding2'),
    title: 'Discover Smart Matches',
    description: 'Our AI helps find compatible partners based on values, education, and preferences—not just looks.',
  },
  {
    image: PlaceHolderImages.find((img) => img.id === 'onboarding4'),
    title: 'Family-Oriented Connections',
    description: 'Involve your family in your search by sharing profiles and seeking their advice.',
  },
  {
    image: PlaceHolderImages.find((img) => img.id === 'onboarding3'),
    title: 'Your Privacy Matters',
    description: 'Control who sees your profile, with options for blurred photos and private browsing, especially for sisters.',
  },
];

export function OnboardingModal() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const hasOnboarded = localStorage.getItem('madhubani_nikah_onboarded');
    if (!hasOnboarded) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('madhubani_nikah_onboarded', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <Carousel className="w-full">
          <CarouselContent>
            {onboardingSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="p-1 text-center">
                  <DialogHeader>
                    {slide.image && (
                      <div className="mb-6 flex justify-center">
                        <Image
                          src={slide.image.imageUrl}
                          alt={slide.description}
                          width={600}
                          height={400}
                          data-ai-hint={slide.image.imageHint}
                          className="aspect-video rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <DialogTitle className="font-headline text-2xl">
                      {slide.title}
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-base">
                      {slide.description}
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </CarouselItem>
            ))}
            <CarouselItem>
              <div className="p-1 text-center flex flex-col items-center justify-center h-[450px]">
                <DialogHeader>
                  <div className="mb-6 flex justify-center">
                    <CheckCircle className="h-24 w-24 text-primary" />
                  </div>
                  <DialogTitle className="font-headline text-2xl">
                    You're All Set!
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-base">
                    You are now ready to begin your journey. May Allah grant you
                    success.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-8 w-full sm:justify-center">
                  <Button onClick={handleClose} size="lg">
                    Start Exploring <ArrowRight className="ml-2" />
                  </Button>
                </DialogFooter>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="ml-12" />
          <CarouselNext className="mr-12" />
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}
