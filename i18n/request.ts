import {getRequestConfig} from 'next-intl/server';
import { locales, defaultLocale } from '../src/lib/locales';
 
export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;
 
  // Ensure that a valid locale is used
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }
 
  return {
    locale,
    messages: (await import(`../src/locales/${locale}.json`)).default
  };
});