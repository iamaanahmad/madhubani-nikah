'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Heart, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function NikahSimplifiedCard() {
    const t = useTranslations('NikahSimplified');

  return (
    <section>
        <div className="text-center mb-8">
            <h2 className="font-headline text-3xl md:text-4xl font-semibold">
            {t('mainTitle')}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
            {t('mainSubtitle')}
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card/80">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Heart className="h-6 w-6 text-primary" />
                        {t('parents_title')}
                    </CardTitle>
                    <CardDescription>{t('parents_subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                   <p>{t('parents_para1')}</p>
                   <p>{t('parents_para2')}</p>
                </CardContent>
            </Card>
            <Card className="bg-card/80">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                        <Users className="h-6 w-6 text-primary" />
                        {t('youth_title')}
                    </CardTitle>
                     <CardDescription>{t('youth_subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                        <div>
                            <h4 className="font-semibold">{t('youth_step1_title')}</h4>
                            <p className="text-sm text-muted-foreground">{t('youth_step1_desc')}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                        <div>
                            <h4 className="font-semibold">{t('youth_step2_title')}</h4>
                            <p className="text-sm text-muted-foreground">{t('youth_step2_desc')}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                        <div>
                            <h4 className="font-semibold">{t('youth_step3_title')}</h4>
                            <p className="text-sm text-muted-foreground">{t('youth_step3_desc')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </section>
  );
}
