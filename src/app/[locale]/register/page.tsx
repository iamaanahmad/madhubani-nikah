'use client';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Loader2 } from 'lucide-react';
import { Link, useRouter } from '@i18n/navigation';
import MainLayout from '@/components/layout/main-layout';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfileCreation } from '@/hooks/useProfile';
import { MADHUBANI_CONFIG } from '@/lib/appwrite-config';
import { toast } from 'sonner';

export default function RegisterPage() {
  const t = useTranslations('RegisterForm');
  const router = useRouter();
  const { register } = useAuth();
  const { createProfile } = useProfileCreation();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Account details
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Profile details
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | '',
    district: '',
    block: '',
    village: '',
    education: '',
    occupation: '',
    sect: '' as 'Sunni' | 'Shia' | 'Other' | '',
    religiousPractice: '',
    familyBackground: '',
    bio: '',
    maritalStatus: 'single' as 'single' | 'divorced' | 'widowed',
    familyType: 'nuclear' as 'nuclear' | 'joint'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 8) {
      toast.error(t('passwordLengthError'));
      return;
    }

    setStep(2);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Register user account
      const authResult = await register(formData.email, formData.password, formData.name);
      
      if (!authResult.success || !authResult.user) {
        throw new Error(t('registrationFailed'));
      }

      // Create profile
      const profileData = {
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender as 'male' | 'female',
        district: formData.district,
        block: formData.block,
        village: formData.village,
        education: formData.education,
        occupation: formData.occupation,
        sect: formData.sect as 'Sunni' | 'Shia' | 'Other',
        religiousPractice: formData.religiousPractice,
        familyBackground: formData.familyBackground,
        bio: formData.bio,
        maritalStatus: formData.maritalStatus,
        familyType: formData.familyType
      };

      await createProfile(authResult.user.$id, profileData);
      
      toast.success(t('accountCreatedSuccess'));
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || t('registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto flex min-h-[80vh] items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 font-headline text-3xl">
              <UserPlus className="h-8 w-8" />
              {step === 1 ? t('titleStep1') : t('titleStep2')}
            </CardTitle>
            <CardDescription>
              {step === 1 ? t('descriptionStep1') : t('descriptionStep2')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('fullNameLabel')}</Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder={t('fullNamePlaceholder')}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
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
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('confirmPasswordLabel')}</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">{t('continueButton')}</Button>
              </form>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">{t('dobLabel')}</Label>
                    <Input 
                      id="dateOfBirth" 
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">{t('genderLabel')}</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('genderPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('genderMale')}</SelectItem>
                        <SelectItem value="female">{t('genderFemale')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="district">{t('districtLabel')}</Label>
                    <Select value={formData.district} onValueChange={(value) => handleInputChange('district', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('districtPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {MADHUBANI_CONFIG.DISTRICTS.map(district => (
                          <SelectItem key={district} value={district}>{district}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="block">{t('blockLabel')}</Label>
                    <Select value={formData.block} onValueChange={(value) => handleInputChange('block', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('blockPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {MADHUBANI_CONFIG.BLOCKS.map(block => (
                          <SelectItem key={block} value={block}>{block}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village">{t('villageLabel')}</Label>
                  <Input 
                    id="village" 
                    type="text" 
                    placeholder={t('villagePlaceholder')}
                    value={formData.village}
                    onChange={(e) => handleInputChange('village', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="education">{t('educationLabel')}</Label>
                    <Select value={formData.education} onValueChange={(value) => handleInputChange('education', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('educationPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {MADHUBANI_CONFIG.EDUCATION_LEVELS.map(edu => (
                          <SelectItem key={edu} value={edu}>{edu}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occupation">{t('occupationLabel')}</Label>
                    <Select value={formData.occupation} onValueChange={(value) => handleInputChange('occupation', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('occupationPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {MADHUBANI_CONFIG.OCCUPATIONS.map(occ => (
                          <SelectItem key={occ} value={occ}>{occ}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sect">{t('sectLabel')}</Label>
                  <Select value={formData.sect} onValueChange={(value) => handleInputChange('sect', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('sectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {MADHUBANI_CONFIG.SECTS.map(sect => (
                        <SelectItem key={sect} value={sect}>{sect}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="religiousPractice">{t('religiousPracticeLabel')}</Label>
                  <Input 
                    id="religiousPractice" 
                    type="text" 
                    placeholder={t('religiousPracticePlaceholder')}
                    value={formData.religiousPractice}
                    onChange={(e) => handleInputChange('religiousPractice', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyBackground">{t('familyBackgroundLabel')}</Label>
                  <Textarea 
                    id="familyBackground" 
                    placeholder={t('familyBackgroundPlaceholder')}
                    value={formData.familyBackground}
                    onChange={(e) => handleInputChange('familyBackground', e.target.value)}
                    required
                    minLength={20}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t('bioLabel')}</Label>
                  <Textarea 
                    id="bio" 
                    placeholder={t('bioPlaceholder')}
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    required
                    minLength={50}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full">
                    {t('backButton')}
                  </Button>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('creatingAccount')}
                      </>
                    ) : (
                      t('createAccountButton')
                    )}
                  </Button>
                </div>
              </form>
            )}
            
            <div className="mt-4 text-center text-sm">
              {t('alreadyHaveAccount')}{' '}
              <Button variant="link" className="p-0" asChild>
                <Link href="/login">{t('loginLink')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
