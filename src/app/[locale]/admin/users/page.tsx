import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users } from 'lucide-react';

export default function UsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Manage Users
        </CardTitle>
        <CardDescription>
          View, verify, or take action on user profiles.
        </CardDescription>
        <Input placeholder="Search by name, email, or village..." className="mt-4" />
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-center justify-center rounded-md border-2 border-dashed">
          <p className="text-muted-foreground">No users found.</p>
        </div>
      </CardContent>
    </Card>
  );
}
