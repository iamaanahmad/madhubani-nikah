'use client';
import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { BookText } from 'lucide-react';
import { islamicContent } from '@/lib/data';
import type { IslamicContent } from '@/lib/types';
import { useTranslations } from 'next-intl';

export function IslamicContentCard() {
  const [contentIndex, setContentIndex] = React.useState(0);
  const t = useTranslations('Quotes');

  React.useEffect(() => {
    const timer = setInterval(() => {
      setContentIndex((prevIndex) => (prevIndex + 1) % islamicContent.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  const content = islamicContent[contentIndex];

  if (!content) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BookText className="h-5 w-5 text-primary" />
          <span>{t('title')}</span>
        </div>
      </CardHeader>
      <CardContent>
        <blockquote className="border-l-4 border-primary pl-4">
          <p className="font-headline text-xl italic leading-relaxed md:text-2xl">
            &ldquo;{t(content.textKey as any)}&rdquo;
          </p>
        </blockquote>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">- {content.source}</p>
      </CardFooter>
    </Card>
  );
}
