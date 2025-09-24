'use client';
import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Loader2 } from 'lucide-react';
import { SuccessStoriesService, type SuccessStory } from '@/lib/services/success-stories.service';
import MainLayout from '@/components/layout/main-layout';

export default function SuccessStoriesPage() {
  const [successStories, setSuccessStories] = React.useState<SuccessStory[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadStories = async () => {
      try {
        setIsLoading(true);
        const stories = await SuccessStoriesService.getPublishedStories();
        setSuccessStories(stories);
        setError(null);
      } catch (err) {
        console.error('Failed to load success stories:', err);
        setError('Failed to load success stories');
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-8">
        <Card className="mb-8 bg-gradient-to-br from-card to-secondary/50">
          <CardHeader className="text-center">
            <Heart className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="font-headline text-3xl md:text-4xl mt-4">
              Stories of Blessed Unions
            </CardTitle>
            <p className="text-muted-foreground max-w-2xl mx-auto pt-2">
              Read about the couples who began their journey together on Madhubani Nikah, with the blessings of their families and Allah (SWT).
            </p>
          </CardHeader>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading success stories...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        {!isLoading && !error && successStories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No success stories available yet.</p>
          </div>
        )}

        {!isLoading && !error && successStories.length > 0 && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {successStories.map((story) => (
              <Card key={story.$id} className="flex flex-col overflow-hidden">
                {story.imageUrl && (
                  <div className="aspect-video relative w-full">
                    <Image
                      src={story.imageUrl}
                      alt={story.coupleNames}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">{story.coupleNames}</CardTitle>
                  <p className="text-sm text-muted-foreground">{story.location}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <blockquote className="border-l-4 border-primary pl-4 text-muted-foreground">
                    <p>&ldquo;{story.story}&rdquo;</p>
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
