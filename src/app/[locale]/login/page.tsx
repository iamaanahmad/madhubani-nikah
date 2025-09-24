'use client';

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
import { LogIn, Loader2 } from 'lucide-react';
import { Link, useRouter } from '@i18n/navigation';
import MainLayout from '@/components/layout/main-layout';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';

export default function LoginPage() {
  const t = useTranslations('Buttons');
  const router = useRouter();
  const { login, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success('Login successful!');
        router.push('/');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone) {
      toast.error('Please enter your phone number');
      return;
    }

    // TODO: Implement phone/OTP login
    toast.info('Phone login will be implemented soon');
  };

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
                <form onSubmit={handleEmailLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="m@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      t('login')
                    )}
                  </Button>
                  <Button variant="link" className="w-full text-sm" type="button">
                    Forgot password?
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="otp">
                <form onSubmit={handlePhoneLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    You will receive a one-time password on your mobile.
                  </p>
                </form>
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
