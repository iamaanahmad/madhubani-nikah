import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Eye, Check, X } from 'lucide-react';
import { Link } from 'next-intl/navigation';

const pendingVerifications = [
  { id: 'v1', userId: 'user-4', name: 'Yusuf Ahmed', submittedAt: '2024-05-20T10:00:00Z' },
  { id: 'v2', userId: 'user-6', name: 'Bilal Khan', submittedAt: '2024-05-20T12:30:00Z' },
  { id: 'v3', userId: 'user-x', name: 'Amina Parveen', submittedAt: '2024-05-19T18:00:00Z' },
];

export default function VerificationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          Pending Verifications
        </CardTitle>
        <CardDescription>
          Review and approve or reject user verification requests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingVerifications.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingVerifications.map((verification) => (
                <TableRow key={verification.id}>
                  <TableCell>
                    <Link
                      href={`/profile/${verification.userId.replace('user-','')}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {verification.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {new Date(verification.submittedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" /> View Document
                    </Button>
                    <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
                      <Check className="h-5 w-5" />
                      <span className="sr-only">Approve</span>
                    </Button>
                     <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Reject</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-md border-2 border-dashed">
            <p className="text-muted-foreground">
              No pending verifications.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
