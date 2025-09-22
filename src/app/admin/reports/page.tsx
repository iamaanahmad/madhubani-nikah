import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function ReportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" />
          User Reports
        </CardTitle>
        <CardDescription>
          Review and take action on user-submitted reports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-center justify-center rounded-md border-2 border-dashed">
          <p className="text-muted-foreground">No active reports.</p>
        </div>
      </CardContent>
    </Card>
  );
}
