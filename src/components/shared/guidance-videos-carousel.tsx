'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { marriageGuidanceVideos } from '@/lib/video-data';

export function GuidanceVideosCarousel() {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {marriageGuidanceVideos.map((video) => (
          <CarouselItem
            key={video.id}
            className="basis-[90%] md:basis-1/2 lg:basis-1/3"
          >
            <div className="p-1">
              <Card>
                <CardContent className="p-2 aspect-video">
                  <iframe
                    className="w-full h-full rounded-md"
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden md:flex" />
      <CarouselNext className="hidden md:flex" />
    </Carousel>
  );
}
