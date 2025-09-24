'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, BookOpen, Pause, Play } from 'lucide-react';
import { type IslamicContent } from '@/lib/services/islamic-content.service';
import { cn } from '@/lib/utils';

interface IslamicContentCarouselProps {
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
}

export function IslamicContentCarousel({
  className,
  autoPlay = true,
  autoPlayInterval = 8000,
  showControls = true,
  showIndicators = true,
}: IslamicContentCarouselProps) {
  const [content, setContent] = React.useState<IslamicContent[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load Islamic content - using static data for simplicity
  React.useEffect(() => {
    setIsLoading(true);
    
    // Static Islamic quotes and hadiths
    const staticContent = [
      {
        $id: 'static-1',
        type: 'Hadith',
        source: 'Mishkat al-Masabih',
        englishText: 'When a person marries, he has fulfilled half of his religion.',
        attribution: 'Prophet Muhammad (Peace be upon him)',
        isActive: true,
        displayOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        $id: 'static-2',
        type: 'Hadith',
        source: 'Al-Bukhari',
        englishText: 'O young people! Those among you who can support a wife should marry, for it helps him lower his gaze and guard his modesty.',
        attribution: 'Prophet Muhammad (Peace be upon him)',
        isActive: true,
        displayOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        $id: 'static-3',
        type: 'Quran',
        source: 'Surah Ar-Rum (30:21)',
        englishText: 'And among His signs is this: that He created for you mates from among yourselves, that you may dwell in tranquility with them, and He has put love and mercy between your hearts.',
        attribution: 'Allah (SWT)',
        isActive: true,
        displayOrder: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        $id: 'static-4',
        type: 'Quran',
        source: 'Surah An-Nur (24:32)',
        englishText: 'And marry the unmarried among you and the righteous among your male slaves and female slaves.',
        attribution: 'Allah (SWT)',
        isActive: true,
        displayOrder: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        $id: 'static-5',
        type: 'Hadith',
        source: 'Ibn Majah',
        englishText: 'Marriage is part of my Sunnah. Whoever does not follow my Sunnah has nothing to do with me.',
        attribution: 'Prophet Muhammad (Peace be upon him)',
        isActive: true,
        displayOrder: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        $id: 'static-6',
        type: 'Quote',
        source: 'Islamic Teaching',
        englishText: 'Nikah is not just a contract; it is a sacred bond founded on love, respect, and commitment in Islam.',
        attribution: 'Islamic Wisdom',
        isActive: true,
        displayOrder: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    setContent(staticContent);
    setError(null);
    setIsLoading(false);
  }, []);

  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay || isPaused || isHovered || content.length <= 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % content.length);
    }, autoPlayInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, isPaused, isHovered, content.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? content.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % content.length);
  };

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  if (isLoading) {
    return (
      <Card className={cn("bg-gradient-to-br from-primary/10 to-accent/10", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>Loading Islamic wisdom...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || content.length === 0) {
    return (
      <Card className={cn("bg-gradient-to-br from-primary/10 to-accent/10", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2" />
            <p>{error || 'No Islamic content available'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentContent = content[currentIndex];

  return (
    <Card 
      className={cn(
        "relative bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-semibold text-primary">
              {currentContent.type === 'Quran' ? 'Quranic Verse' : 
               currentContent.type === 'Hadith' ? 'Hadith' : 'Islamic Wisdom'}
            </span>
          </div>
          
          {showControls && autoPlay && (
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-primary hover:text-primary/80"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="min-h-[200px] flex flex-col justify-center">
          {/* Arabic Text (if available) */}
          {currentContent.arabicText && (
            <div className="text-right mb-4">
              <p className="text-2xl font-arabic leading-relaxed text-primary/80">
                {currentContent.arabicText}
              </p>
            </div>
          )}

          {/* English Text */}
          <blockquote className="border-l-4 border-primary pl-6 mb-6">
            <p className="text-xl md:text-2xl font-headline italic leading-relaxed text-foreground">
              &ldquo;{currentContent.englishText}&rdquo;
            </p>
          </blockquote>

          {/* Attribution */}
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">
              — {currentContent.attribution || 'Islamic Teaching'}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {currentContent.source}
            </p>
          </div>
        </div>

        {/* Navigation Controls */}
        {showControls && content.length > 1 && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="text-primary hover:text-primary/80"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>

            {/* Slide Counter */}
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {content.length}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="text-primary hover:text-primary/80"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        )}

        {/* Indicators */}
        {showIndicators && content.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {content.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentIndex
                    ? "bg-primary w-6"
                    : "bg-primary/30 hover:bg-primary/50"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Progress Bar (for auto-play) */}
      {autoPlay && !isPaused && !isHovered && content.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
          <div 
            className="h-full bg-primary transition-all duration-100 ease-linear"
            style={{
              width: `${((Date.now() % autoPlayInterval) / autoPlayInterval) * 100}%`
            }}
          />
        </div>
      )}
    </Card>
  );
}

export default IslamicContentCarousel;