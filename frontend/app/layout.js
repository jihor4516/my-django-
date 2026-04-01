import './globals.css';
import { cookies } from 'next/headers';
import SiteHeader from '@/components/layout/site-header';
import SiteFooter from '@/components/layout/site-footer';
import { LanguageProvider } from '@/components/i18n/language-provider';
import { getMessages, isRtlLanguage, normalizeLang } from '@/lib/i18n';

export const metadata = {
  title: 'Grand Theatre Platform',
  description: 'Digital platform for theatre equipment rental and document workflows.',
};

export default function RootLayout({ children }) {
  const cookieStore = cookies();
  const lang = normalizeLang(cookieStore.get('site_lang')?.value || 'ar');
  const messages = getMessages(lang);
  const direction = isRtlLanguage(lang) ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={direction}>
      <body>
        <LanguageProvider initialLang={lang} initialMessages={messages}>
          <SiteHeader />
          <main className="container">{children}</main>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
