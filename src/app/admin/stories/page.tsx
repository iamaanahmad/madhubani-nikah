import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, PlusCircle } from 'lucide-react';

export default function AdminStoriesPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6" />
            Manage Success Stories
          </CardTitle>
          <CardDescription>
            Add, edit, or remove success stories from the main site.
          </CardDescription>
        </div>
        <Button>
          <PlusCircle className="mr-2" />
          Add Story
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-center justify-center rounded-md border-2 border-dashed">
          <p className="text-muted-foreground">
            No success stories found.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
