import { NextIntlClientProvider, useMessages } from 'next-intl';
import { cn } from '@/lib/utils';
import { locales, defaultLocale } from '@/lib/locales';

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;
  
  // Get messages for server-side rendering - only load valid locale files
  let messages;
  try {
    if (locales.includes(locale as any)) {
      messages = (await import(`../../locales/${locale}.json`)).default;
    } else {
      // Fallback to English if invalid locale
      messages = (await import(`../../locales/${defaultLocale}.json`)).default;
    }
  } catch (error) {
    // Fallback to English if locale file doesn't exist
    messages = (await import(`../../locales/${defaultLocale}.json`)).default;
  }

  return (
    
        <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
        </NextIntlClientProvider>
    
  );
}
