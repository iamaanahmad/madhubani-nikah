import MainLayout from '@/components/layout/main-layout';
import { VerificationForm } from '@/components/profile/verification-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function ProfileVerificationPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-3xl">
                <ShieldCheck className="h-8 w-8 text-primary" />
                Profile Verification
              </CardTitle>
              <CardDescription>
                Submit your documents to get a "Verified" badge on your
                profile. This builds trust and increases your visibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <VerificationForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
