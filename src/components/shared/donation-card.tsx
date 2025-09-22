'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartHandshake } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function DonationCard() {
  const t = useTranslations('Donation');

  return (
    <Card className="bg-gradient-to-tr from-green-50 dark:from-green-950 to-background">
        <CardHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full border border-primary/20 mb-4">
                <HeartHandshake className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">{t('title')}</CardTitle>
            <CardDescription className="max-w-xl">{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="text-center max-w-2xl mx-auto">
            <p className="text-muted-foreground">{t('description')}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Button size="lg">
            {t('button')}
            </Button>
        </CardFooter>
    </Card>
  );
}
