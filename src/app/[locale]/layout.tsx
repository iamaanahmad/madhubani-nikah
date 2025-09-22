import { NextIntlClientProvider, useMessages } from 'next-intl';
import { cn } from '@/lib/utils';

export default function LocaleLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  const messages = useMessages();

  return (
    
        <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
        </NextIntlClientProvider>
    
  );
}
