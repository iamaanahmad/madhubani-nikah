import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-3xl">
            <Search className="h-8 w-8 text-primary" />
            Search Profiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The search functionality is under construction. Please check back soon!</p>
          {/* Search filters and results will be implemented here */}
        </CardContent>
      </Card>
    </div>
  );
}
