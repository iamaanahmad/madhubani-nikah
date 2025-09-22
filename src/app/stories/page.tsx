import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Heart } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';

const successStories = [
  {
    id: 1,
    couple: 'Ahmed & Fatima',
    location: 'Benipatti, Madhubani',
    story: 'We found each other through Madhubani Nikah and discovered we were from neighboring villages. The platform made it easy for our families to connect. Alhamdulillah, we are now happily married.',
    image: PlaceHolderImages.find((img) => img.id === 'profile1'),
  },
  {
    id: 2,
    couple: 'Imran & Aisha',
    location: 'Rajnagar, Madhubani',
    story: 'As professionals, finding someone with a similar mindset was important. Madhubani Nikah helped us connect based on our educational background and life goals. We are grateful for this service.',
    image: PlaceHolderImages.find((img) => img.id === 'profile3'),
  },
   {
    id: 3,
    couple: 'Yusuf & Zainab',
    location: 'Pandaul, Madhubani',
    story: 'This platform understood our need for a partner who values deen above all. The focus on character and religious practice helped us find a perfect match. JazakAllah Khair.',
    image: PlaceHolderImages.find((img) => img.id === 'profile5'),
  },
];

export default function SuccessStoriesPage() {
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

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {successStories.map((story) => (
            <Card key={story.id} className="flex flex-col overflow-hidden">
              {story.image && (
                <div className="aspect-video relative w-full">
                  <Image
                    src={story.image.imageUrl}
                    alt={story.couple}
                    fill
                    className="object-cover"
                    data-ai-hint={story.image.imageHint}
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="font-headline text-2xl">{story.couple}</CardTitle>
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
      </div>
    </MainLayout>
  );
}
