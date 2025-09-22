import type { Metadata } from 'next';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NextIntlClientProvider, useMessages } from 'next-intl';

export const metadata: Metadata = {
  title: 'Madhubani Nikah',
  description: 'Trusted Islamic Matrimony for Madhubani',
  manifest: '/manifest.json',
};

export default function LocaleLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: {locale: string};
}>) {
  const messages = useMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
