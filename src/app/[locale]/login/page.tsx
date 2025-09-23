import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn } from 'lucide-react';
import { Link } from '@i18n/navigation';
import MainLayout from '@/components/layout/main-layout';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('Buttons');
  return (
    <MainLayout>
      <div className="container mx-auto flex min-h-[80vh] items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 font-headline text-3xl">
              <LogIn className="h-8 w-8" />
              Login to Your Account
            </CardTitle>
            <CardDescription>
              Welcome back! Please enter your details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email & Password</TabsTrigger>
                <TabsTrigger value="otp">Mobile OTP</TabsTrigger>
              </TabsList>
              <TabsContent value="email">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" />
                  </div>
                  <Button className="w-full">{t('login')}</Button>
                  <Button variant="link" className="w-full text-sm">
                    Forgot password?
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="otp">
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input id="phone" type="tel" placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <Button className="w-full">Send OTP</Button>
                  <p className="text-center text-xs text-muted-foreground">
                    You will receive a one-time password on your mobile.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Button variant="link" className="p-0" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
