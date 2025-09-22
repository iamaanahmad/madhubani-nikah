import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-[80vh] items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 font-headline text-3xl">
            <UserPlus className="h-8 w-8" />
            Create Your Account
          </CardTitle>
          <CardDescription>
            Join our community for free to find your life partner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="Your Name" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <div className="flex justify-center">
              {/* reCAPTCHA placeholder */}
              <div className="w-[304px] h-[78px] bg-muted/50 border rounded-md flex items-center justify-center text-muted-foreground text-sm">
                reCAPTCHA placeholder
              </div>
            </div>
            <Button className="w-full">Create Account</Button>
          </div>
           <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Button variant="link" className="p-0" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
