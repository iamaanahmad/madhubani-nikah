import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/shared/logo';
import { AccessibilityToolbar } from '@/components/shared/accessibility-toolbar';

export function AppFooter() {
    const t = useTranslations('HomePage');
    return (
        <footer className="bg-muted text-muted-foreground p-8 mt-12">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
                <div className="flex flex-col items-center md:items-start">
                    <Logo />
                    <p className="mt-4 text-sm">{t('footer_tagline')}</p>
                    <p className="text-xs">{t('footer_subtitle')}</p>
                </div>
                <div className="flex justify-center gap-4">
                    <Link href="/about" className="text-sm hover:text-primary">About Us</Link>
                    <Link href="/help" className="text-sm hover:text-primary">Contact</Link>
                    <Link href="/privacy" className="text-sm hover:text-primary">Privacy Policy</Link>
                </div>
                <div className="flex justify-center md:justify-end">
                    <AccessibilityToolbar />
                </div>
            </div>
        </footer>
    )
}
