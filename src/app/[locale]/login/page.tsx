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
  const t = useTranslations('LoginForm');
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
      toast.error(t('allFieldsRequired'));
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success(t('loginSuccess'));
        router.push('/');
      } else {
        toast.error(result.error || t('loginFailed'));
      }
    } catch (error: any) {
      toast.error(error.message || t('loginFailed'));
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone) {
      toast.error(t('phoneRequired'));
      return;
    }

    // TODO: Implement phone/OTP login
    toast.info(t('phoneLoginSoon'));
  };

  return (
    <MainLayout>
      <div className="container mx-auto flex min-h-[80vh] items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 font-headline text-3xl">
              <LogIn className="h-8 w-8" />
              {t('title')}
            </CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">{t('emailTab')}</TabsTrigger>
                <TabsTrigger value="otp">{t('mobileTab')}</TabsTrigger>
              </TabsList>
              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('emailLabel')}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder={t('emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('passwordLabel')}</Label>
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
                        {t('loggingIn')}
                      </>
                    ) : (
                      t('loginButton')
                    )}
                  </Button>
                  <Button variant="link" className="w-full text-sm" type="button">
                    {t('forgotPassword')}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="otp">
                <form onSubmit={handlePhoneLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('mobileLabel')}</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder={t('mobilePlaceholder')}
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('sendingOTP')}
                      </>
                    ) : (
                      t('sendOTPButton')
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    {t('otpMessage')}
                  </p>
                </form>
              </TabsContent>
            </Tabs>
            <div className="mt-4 text-center text-sm">
              {t('noAccount')}{' '}
              <Button variant="link" className="p-0" asChild>
                <Link href="/register">{t('signUpLink')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
