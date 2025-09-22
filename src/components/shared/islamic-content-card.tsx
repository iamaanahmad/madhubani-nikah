'use client';
import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { islamicContent } from '@/lib/data';
import { useTranslations } from 'next-intl';

export function IslamicContentCard() {
  const [contentIndex, setContentIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const t = useTranslations('Quotes');
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const resetTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setContentIndex((prevIndex) => (prevIndex + 1) % islamicContent.length);
      }, 10000);
    }
  }, [isPaused]);
  
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

  if (!content) {
    return null;
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
            &ldquo;{t(content.textKey as any)}&rdquo;
          </p>
        </blockquote>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">- {content.source}</p>
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
