'use client';
import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, ChevronLeft, ChevronRight, Pause, Play, Loader2 } from 'lucide-react';
import { type IslamicContent } from '@/lib/services/islamic-content.service';
import { useTranslations } from 'next-intl';

export function IslamicContentCard() {
  const [contentIndex, setContentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [islamicContent, setIslamicContent] = React.useState<IslamicContent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const t = useTranslations('Quotes');
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load Islamic content - using static data for simplicity
  React.useEffect(() => {
    setIsLoading(true);
    
    // Static Islamic quotes and hadiths
    const staticContent = [
      {
        $id: 'card-1',
        type: 'Hadith',
        source: 'Mishkat al-Masabih',
        textKey: 'hadith1',
        englishText: 'When a person marries, he has fulfilled half of his religion.',
        attribution: 'Prophet Muhammad (Peace be upon him)',
        isActive: true,
        displayOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        $id: 'card-2',
        type: 'Hadith',
        source: 'Al-Bukhari',
        textKey: 'hadith2',
        englishText: 'O young people! Those among you who can support a wife should marry, for it helps him lower his gaze and guard his modesty.',
        attribution: 'Prophet Muhammad (Peace be upon him)',
        isActive: true,
        displayOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        $id: 'card-3',
        type: 'Quran',
        source: 'Surah Ar-Rum (30:21)',
        textKey: 'quran1',
        englishText: 'And among His signs is this: that He created for you mates from among yourselves, that you may dwell in tranquility with them, and He has put love and mercy between your hearts.',
        attribution: 'Allah (SWT)',
        isActive: true,
        displayOrder: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        $id: 'card-4',
        type: 'Quran',
        source: 'Surah An-Nur (24:32)',
        textKey: 'quran2',
        englishText: 'And marry the unmarried among you and the righteous among your male slaves and female slaves.',
        attribution: 'Allah (SWT)',
        isActive: true,
        displayOrder: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        $id: 'card-5',
        type: 'Hadith',
        source: 'Ibn Majah',
        textKey: 'hadith3',
        englishText: 'Marriage is part of my Sunnah. Whoever does not follow my Sunnah has nothing to do with me.',
        attribution: 'Prophet Muhammad (Peace be upon him)',
        isActive: true,
        displayOrder: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        $id: 'card-6',
        type: 'Quote',
        source: 'Islamic Teaching',
        textKey: 'wisdom1',
        englishText: 'Nikah is not just a contract; it is a sacred bond founded on love, respect, and commitment in Islam.',
        attribution: 'Islamic Wisdom',
        isActive: true,
        displayOrder: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    setIslamicContent(staticContent);
    setError(null);
    setIsLoading(false);
  }, []);

  const resetTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (!isPaused && islamicContent.length > 0) {
      timerRef.current = setInterval(() => {
        setContentIndex((prevIndex) => (prevIndex + 1) % islamicContent.length);
      }, 10000);
    }
  }, [isPaused, islamicContent.length]);
  
  React.useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, resetTimer]);

  const handleNext = () => {
    setContentIndex((prevIndex) => (prevIndex + 1) % islamicContent.length);
    resetTimer();
  };

  const handlePrev = () => {
    setContentIndex((prevIndex) =>
      (prevIndex - 1 + islamicContent.length) % islamicContent.length
    );
    resetTimer();
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };
  
  const content = islamicContent[contentIndex];

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading Islamic content...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !content || islamicContent.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
        <CardContent className="flex items-center justify-center py-8">
          <BookText className="h-6 w-6 text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            {error || 'No Islamic content available'}
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-gradient-to-br from-primary/10 to-accent/10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BookText className="h-5 w-5 text-primary" />
          <span>{t('title')}</span>
        </div>
      </CardHeader>
      <CardContent>
        <blockquote className="border-l-4 border-primary pl-4">
          <p className="font-headline text-xl italic leading-relaxed md:text-2xl min-h-[6rem]">
            &ldquo;{content.englishText || t(content.textKey as any)}&rdquo;
          </p>
        </blockquote>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          <p>— {content.attribution || 'Islamic Teaching'}</p>
          <p className="text-xs">[{content.source}]</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={handlePrev} aria-label="Previous quote">
             <ChevronLeft className="h-5 w-5" />
           </Button>
           <Button variant="ghost" size="icon" onClick={handleTogglePause} aria-label={isPaused ? "Play quotes" : "Pause quotes"}>
             {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
           </Button>
           <Button variant="ghost" size="icon" onClick={handleNext} aria-label="Next quote">
             <ChevronRight className="h-5 w-5" />
           </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
