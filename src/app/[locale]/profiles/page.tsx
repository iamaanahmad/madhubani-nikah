import { MatchList } from '@/components/matches/match-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';

export default function ProfilesPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-3xl">
              <Users className="h-8 w-8 text-primary" />
              Browse Profiles
            </CardTitle>
            <CardDescription>
              Explore profiles from our community. Create a free account to view details and connect.
            </CardDescription>
          </CardHeader>
        </Card>
        <MatchList />
      </div>
    </MainLayout>
  );
}
