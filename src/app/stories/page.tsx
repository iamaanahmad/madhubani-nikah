import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export default function SuccessStoriesPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-3xl">
            <Heart className="h-8 w-8 text-primary" />
            Success Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Read about the blessed unions that started on our platform. This section is coming soon!</p>
          {/* Success story cards will be displayed here */}
        </CardContent>
      </Card>
    </div>
  );
}
