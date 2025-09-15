'use client';
import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { BookText } from 'lucide-react';
import { islamicContent } from '@/lib/data';
import type { IslamicContent } from '@/lib/types';

export function IslamicContentCard() {
  const [content, setContent] = React.useState<IslamicContent | null>(null);

  React.useEffect(() => {
    // Select a random piece of content on mount
    const randomIndex = Math.floor(Math.random() * islamicContent.length);
    setContent(islamicContent[randomIndex]);
  }, []);

  if (!content) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-card to-secondary">
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BookText className="h-5 w-5" />
          <span>Today&apos;s Inspiring Verse</span>
        </div>
      </CardHeader>
      <CardContent>
        <blockquote className="border-l-4 border-primary pl-4">
          <p className="font-headline text-xl italic leading-relaxed md:text-2xl">
            &ldquo;{content.text}&rdquo;
          </p>
        </blockquote>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">- {content.source}</p>
      </CardFooter>
    </Card>
  );
}
